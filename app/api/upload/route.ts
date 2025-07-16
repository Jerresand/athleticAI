import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 