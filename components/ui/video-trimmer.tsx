import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';

interface VideoTrimmerProps {
  file: File;
  onTrimComplete: (trimmedBlob: Blob) => void;
  onCancel: () => void;
}

export function VideoTrimmer({ file, onTrimComplete, onCancel }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimming, setTrimming] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setEndTime(Math.min(5, video.duration));
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.currentTime = startTime;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleStartTimeChange = (value: number) => {
    const newStartTime = Math.max(0, Math.min(value, duration - 5));
    setStartTime(newStartTime);
    setEndTime(newStartTime + 5);
    handleSeek(newStartTime);
  };

  const trimVideo = async () => {
    setTrimming(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setTrimming(false);
      return;
    }

    try {
      // Set up canvas to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Create MediaRecorder to capture the trimmed video
      const stream = canvas.captureStream(30); // 30 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp8'
      });

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
        onTrimComplete(trimmedBlob);
        setTrimming(false);
      };

      // Start recording
      mediaRecorder.start();

      // Play video from start time and draw frames to canvas
      video.currentTime = startTime;
      video.muted = true; // Avoid audio feedback
      
      const drawFrame = () => {
        if (video.currentTime >= endTime) {
          mediaRecorder.stop();
          video.pause();
          return;
        }

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        if (video.currentTime < endTime) {
          requestAnimationFrame(drawFrame);
        }
      };

      video.onplay = () => {
        drawFrame();
      };

      await video.play();
    } catch (error) {
      console.error('Error trimming video:', error);
      setTrimming(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-lg max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Trim Video to 5 seconds</h3>
      
      <div className="space-y-4">
        {/* Video Player */}
        <div className="relative">
          <video
            ref={videoRef}
            src={URL.createObjectURL(file)}
            className="w-full max-h-80 rounded"
            onEnded={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              onClick={handlePlay}
              variant="outline"
              className="bg-white"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Start: {formatTime(startTime)}</span>
            <span>Duration: 5s</span>
            <span>End: {formatTime(endTime)}</span>
          </div>
          
          {/* Timeline slider */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={Math.max(0, duration - 5)}
              step={0.1}
              value={startTime}
              onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            {/* Visual representation of selected segment */}
            <div 
              className="absolute top-0 h-2 bg-orange-500 rounded pointer-events-none"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${(5 / duration) * 100}%`
              }}
            />
          </div>
          
          <div className="text-xs text-gray-500">
            Total duration: {formatTime(duration)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={trimming}>
            Cancel
          </Button>
          <Button onClick={trimVideo} disabled={trimming}>
            {trimming ? 'Trimming...' : 'Trim & Use'}
          </Button>
        </div>
      </div>

      {/* Hidden canvas for video processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 