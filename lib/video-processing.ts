/**
 * Client-side video frame extraction using Canvas API
 */

export interface ExtractedFrame {
  blob: Blob;
  timestamp: number;
  frameNumber: number;
}

export interface FrameExtractionOptions {
  fps?: number; // frames per second to extract
  maxFrames?: number; // maximum number of frames
  quality?: number; // JPEG quality (0-1)
}

export async function extractVideoFrames(
  videoFile: File,
  options: FrameExtractionOptions = {}
): Promise<ExtractedFrame[]> {
  const { fps = 30, maxFrames = 500, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    const frames: ExtractedFrame[] = [];
    let frameNumber = 0;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      
      // Extract frames more frequently for better coverage
      const frameInterval = 1 / fps; // seconds between frames
      const totalFramesToExtract = Math.min(
        Math.ceil(duration * fps), // Use ceil to get all possible frames
        maxFrames
      );

      console.log(`🎬 Video metadata:`);
      console.log(`   Duration: ${duration.toFixed(2)}s`);
      console.log(`   Dimensions: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`   Requested FPS: ${fps}`);
      console.log(`   Frame interval: ${frameInterval.toFixed(3)}s`);
      console.log(`   Frames to extract: ${totalFramesToExtract}`);

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      let currentTime = 0;

      const extractFrame = () => {
        if (frameNumber >= totalFramesToExtract || currentTime >= duration) {
          console.log(`✅ Frame extraction complete: ${frames.length} frames extracted`);
          resolve(frames);
          return;
        }

        video.currentTime = Math.min(currentTime, duration - 0.001); // Ensure we don't exceed duration
      };

      video.onseeked = () => {
        try {
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                frames.push({
                  blob,
                  timestamp: video.currentTime, // Use actual video time
                  frameNumber: frameNumber + 1
                });

                if (frameNumber % 10 === 0 || frameNumber < 5) { // Log every 10th frame + first 5
                  console.log(`📸 Extracted frame ${frameNumber + 1}/${totalFramesToExtract} at ${video.currentTime.toFixed(3)}s (${(blob.size / 1024).toFixed(1)}KB)`);
                }
              }

              frameNumber++;
              currentTime += frameInterval;
              extractFrame();
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          console.error('Frame extraction error:', error);
          reject(error);
        }
      };

      video.onerror = () => reject(new Error('Video loading failed'));
      extractFrame();
    };

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
} 