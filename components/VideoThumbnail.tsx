'use client'

import { useState, useRef, useEffect } from 'react'
import { Play } from 'lucide-react'
import Image from 'next/image'

interface VideoThumbnailProps {
  video: string;
  index: number;
}

export function VideoThumbnail({ video, index }: VideoThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Listen for play/pause events
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));

      // Generate thumbnail from first frame
      const video = videoRef.current;
      video.currentTime = 0.1; // Seek a bit into the video to get a real frame
      video.addEventListener('seeked', function onSeeked() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        setThumbnailUrl(canvas.toDataURL());
        video.removeEventListener('seeked', onSeeked);
      });
    }
  }, []);

  const handlePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="relative flex-none w-[216px] snap-center p-2">
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg group">
        <div className="transform transition-transform duration-200 group-hover:scale-105 h-full">
          <video
            ref={videoRef}
            src={video}
            poster={thumbnailUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            playsInline
            loop
            muted
            onClick={handlePlay}
          />
          <div 
            className={`absolute inset-0 flex items-center justify-center ${isPlaying ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-40'}`}
            onClick={handlePlay}
          >
            {!isPlaying && (
              <button
                className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center"
                aria-label={`Play demo video ${index + 1}`}
              >
                <Play className="h-6 w-6 text-white" fill="white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

