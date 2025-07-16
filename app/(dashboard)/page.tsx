"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter((file) =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    setFiles((prev) => [...prev, ...accepted]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
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
          <p className="text-gray-500 mb-4">or click to select files</p>
          <Button variant="outline" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose Files
          </Button>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-8 w-full max-w-xl grid grid-cols-2 gap-4">
          {files.map((file, idx) => (
            <div key={idx} className="border rounded-lg p-2 bg-white flex flex-col items-center">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="max-h-48 w-auto object-contain mb-2 rounded"
                />
              ) : file.type.startsWith('video/') ? (
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="max-h-48 w-auto object-contain mb-2 rounded"
                />
              ) : null}
              <span className="text-xs text-gray-700 break-all text-center">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
