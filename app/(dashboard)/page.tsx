"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  file: File;
  url?: string;
  uploading?: boolean;
  error?: string;
}

export default function HomePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = async (file: File): Promise<string | null> => {
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return 'File must be an image or video';
    }

    // Check video duration (max 5 seconds)
    if (file.type.startsWith('video/')) {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 5) {
            resolve('Video must be 5 seconds or shorter');
          } else {
            resolve(null);
          }
        };
        
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          resolve('Invalid video file');
        };
        
        video.src = URL.createObjectURL(file);
      });
    }

    return null;
  };

  const uploadToBlob = async (file: File): Promise<string> => {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      body: file,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(fileList)) {
      const error = await validateFile(file);
      
      if (error) {
        // Add file with error
        newFiles.push({ file, error });
      } else {
        // Add file and start upload
        const uploadedFile: UploadedFile = { file, uploading: true };
        newFiles.push(uploadedFile);
        
        // Start upload asynchronously
        uploadToBlob(file)
          .then((url) => {
            setFiles(prev => prev.map(f => 
              f.file === file ? { ...f, url, uploading: false } : f
            ));
          })
          .catch((err) => {
            setFiles(prev => prev.map(f => 
              f.file === file ? { ...f, error: err.message, uploading: false } : f
            ));
          });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div
        className={`w-full max-w-xl border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors duration-200 ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white'}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center">
          <span className="text-3xl mb-2">📤</span>
          <h2 className="text-xl font-semibold mb-1">Drop videos or photos here</h2>
          <p className="text-gray-500 mb-2">or click to select files</p>
          <p className="text-sm text-gray-400 mb-4">Videos must be 5 seconds or shorter</p>
          <Button variant="outline" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose Files
          </Button>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-8 w-full max-w-xl grid grid-cols-2 gap-4">
          {files.map((uploadedFile, idx) => (
            <div key={idx} className="border rounded-lg p-2 bg-white flex flex-col items-center relative">
              <button
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
              >
                ×
              </button>
              
              {uploadedFile.file.type.startsWith('image/') ? (
                <img
                  src={uploadedFile.url || URL.createObjectURL(uploadedFile.file)}
                  alt={uploadedFile.file.name}
                  className="max-h-48 w-auto object-contain mb-2 rounded"
                />
              ) : uploadedFile.file.type.startsWith('video/') ? (
                <video
                  src={uploadedFile.url || URL.createObjectURL(uploadedFile.file)}
                  controls
                  className="max-h-48 w-auto object-contain mb-2 rounded"
                />
              ) : null}
              
              <span className="text-xs text-gray-700 break-all text-center mb-2">
                {uploadedFile.file.name}
              </span>
              
              {/* Upload status */}
              {uploadedFile.uploading && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Uploading...
                </div>
              )}
              
              {uploadedFile.url && !uploadedFile.uploading && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✓ Uploaded
                </div>
              )}
              
              {uploadedFile.error && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded text-center">
                  {uploadedFile.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
