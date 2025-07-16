import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Ensure fluent-ffmpeg can locate the ffmpeg binary provided by ffmpeg-static
if (ffmpegStatic) {
  console.log('🔧 Setting FFmpeg path to:', ffmpegStatic);
  ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
  console.warn('⚠️ ffmpeg-static path not found, FFmpeg might not work');
}

/**
 * Request payload shape expected by this route.
 */
interface ProcessVideoBody {
  /**
   * Public (or signed) URL pointing to the uploaded video in Vercel Blob.
   */
  url: string;

  /**
   * Optional folder inside the blob store where the extracted frames should be uploaded.
   * Defaults to `frames/`.
   */
  outputFolder?: string;

  /**
   * Optional FPS value to control output frame rate. Defaults to 1 (one frame per second).
   */
  fps?: number;
}

export async function POST(request: NextRequest) {
  let tmpDir: string | undefined;

  try {
    const { url, outputFolder = 'frames', fps = 1 } = (await request.json()) as ProcessVideoBody;

    if (!url) {
      return NextResponse.json({ error: 'Missing "url" in request body' }, { status: 400 });
    }

    console.log(`🎬 Starting video processing for: ${url}`);
    console.log(`📁 Output folder: ${outputFolder}, FPS: ${fps}`);

    // Validate URL format
    let videoUrl: URL;
    try {
      videoUrl = new URL(url);
      console.log(`🔗 Parsed URL - Host: ${videoUrl.host}, Pathname: ${videoUrl.pathname}`);
    } catch (e) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // 1. Download the original video to a temporary location
    console.log('📥 Downloading video from blob...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'athleticAI-processor/1.0'
      }
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video. HTTP ${response.status}: ${response.statusText}. URL: ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const videoSizeMB = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`📦 Downloaded video: ${videoSizeMB}MB`);
    
    tmpDir = await fs.mkdtemp(join(tmpdir(), 'athai-'));
    const inputPath = join(tmpDir, 'input-video.mp4'); // Add extension for better codec detection
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));
    console.log(`💾 Saved to temp: ${inputPath}`);

    // 2. Run ffmpeg to extract frames
    console.log('🎞️  Starting frame extraction with FFmpeg...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .addOption('-vf', `fps=${fps}`)
        .output(join(tmpDir!, 'frame_%05d.jpg')) // zero-padded frame number
        .on('start', (commandLine) => {
          console.log('▶️  FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`⏳ Processing: ${progress.percent?.toFixed(1) || '?'}% done`);
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('✅ FFmpeg completed frame extraction');
          resolve();
        })
        .run();
    });

    // 3. Upload each extracted frame back to the Blob store
    console.log('📂 Reading extracted frames...');
    const entries = await fs.readdir(tmpDir);
    const frameFiles = entries.filter(file => file.startsWith('frame_'));
    console.log(`🖼️  Found ${frameFiles.length} frames: ${frameFiles.join(', ')}`);
    
    const frameUrls: string[] = [];

    for (const file of frameFiles) {
      console.log(`⬆️  Uploading ${file}...`);
      const fileBuffer = await fs.readFile(join(tmpDir, file));
      const fileSizeKB = (fileBuffer.length / 1024).toFixed(1);
      
      const blob = await put(`${outputFolder}/${file}`, fileBuffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'image/jpeg',
      });

      console.log(`✅ Uploaded ${file} (${fileSizeKB}KB) -> ${blob.url}`);
      frameUrls.push(blob.url);
    }

    // 4. Delete the original video from Blob storage
    console.log('🗑️  Deleting original video from blob...');
    try {
      await del(url);
      console.log('✅ Original video deleted successfully');
    } catch (err) {
      console.warn('⚠️  Failed to delete original blob:', err);
    }

    console.log(`🎉 Processing complete! Generated ${frameUrls.length} frames`);
    return NextResponse.json({ 
      frames: frameUrls,
      metadata: {
        originalVideoSize: videoSizeMB + 'MB',
        framesExtracted: frameUrls.length,
        outputFolder,
        fps
      }
    });
  } catch (error) {
    console.error('💥 Video processing error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    // 5. Clean up any temporary files created during processing
    if (tmpDir) {
      try {
        console.log('🧹 Cleaning up temp directory...');
        await fs.rm(tmpDir, { recursive: true, force: true });
        console.log('✅ Temp cleanup complete');
      } catch (e) {
        console.warn('⚠️  Failed cleaning up tmp directory', e);
      }
    }
  }
}