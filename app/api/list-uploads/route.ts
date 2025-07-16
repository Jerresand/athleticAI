import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { blobs } = await list();
    
    return NextResponse.json({
      files: blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))
    });
  } catch (error) {
    console.error('Error listing blobs:', error);
    return NextResponse.json(
      { error: 'Failed to list uploads' },
      { status: 500 }
    );
  }
} 