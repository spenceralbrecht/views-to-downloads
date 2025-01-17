'use client'

import { useState, useRef, useEffect } from 'react'
import { Play } from 'lucide-react'
import Image from 'next/image'

interface VideoThumbnailProps {
  video: string;
  thumbnail: string;
  index: number;
}

export function VideoThumbnail({ video, thumbnail, index }: VideoThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadeddata', () => setIsLoaded(true));
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));
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
    <div
      className="relative flex-none w-[180px] snap-center"
      style={{
        transform: `rotate(${index % 2 === 0 ? '2deg' : '-2deg'})`,
      }}
    >
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200">
        <video
          ref={videoRef}
          src={video}
          className="w-full h-full object-cover"
          preload="metadata"
          playsInline
          loop
          muted
        />
        {!isLoaded && (
          <Image
            src={thumbnail}
            alt={`Video thumbnail ${index + 1}`}
            fill
            sizes="180px"
            className="object-cover"
            priority={index < 2}
          />
        )}
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
  );
}

