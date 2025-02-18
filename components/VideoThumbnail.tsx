'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface VideoThumbnailProps {
  video: string;
  index: number;
  onClick?: () => void;
}

export function VideoThumbnail({ video, index, onClick }: VideoThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Load the first frame on mount
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Load just enough to get the first frame
      video.preload = 'metadata';
      video.currentTime = 0.1;

      const handleLoadedMetadata = () => {
        // Once metadata is loaded, we can seek to get the poster frame
        video.currentTime = 0.1;
      };

      const handleLoadedData = () => {
        console.log(`Video ${index} loaded data`);
        setIsVideoReady(true);
        if (isLoading) {
          video.play().catch(err => {
            console.error(`Error playing video ${index}:`, err);
            setError(err.message);
            setIsLoading(false);
          });
        }
      };

      const handleLoadStart = () => {
        console.log(`Video ${index} load started`);
      };

      const handleError = (e: ErrorEvent) => {
        console.error(`Video ${index} error:`, e);
        setError(e.message);
        setIsLoading(false);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('error', handleError as EventListener);
      video.addEventListener('play', () => {
        console.log(`Video ${index} playing`);
        setIsPlaying(true);
        setIsLoading(false);
      });
      video.addEventListener('pause', () => {
        console.log(`Video ${index} paused`);
        setIsPlaying(false);
      });

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('error', handleError as EventListener);
        video.removeEventListener('play', () => setIsPlaying(true));
        video.removeEventListener('pause', () => setIsPlaying(false));
      };
    }
  }, [index, isLoading]);

  const handlePlay = () => {
    if (!videoRef.current) return;
    
    console.log(`Attempting to play video ${index}. Ready: ${isVideoReady}, Loading: ${isLoading}`);
    setError(null);
    setIsLoading(true);
    
    if (videoRef.current.paused) {
      if (!isVideoReady) {
        videoRef.current.load();
      } else {
        videoRef.current.play().catch(err => {
          console.error(`Error playing video ${index}:`, err);
          setError(err.message);
          setIsLoading(false);
        });
      }
    } else {
      videoRef.current.pause();
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ width: '300px' }}
    >
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg group">
        <div className="transform transition-transform duration-200 group-hover:scale-105 h-full">
          <video
            ref={videoRef}
            src={video}
            className="w-full h-full object-cover"
            preload="metadata"
            playsInline
            loop
            muted
          />
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 z-10 cursor-pointer ${
              isPlaying ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-40'
            }`}
            onClick={handlePlay}
            style={{ pointerEvents: 'auto' }}
          >
            {!isPlaying && !isLoading && (
              <button
                className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300"
                aria-label={`Play demo video ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay();
                }}
              >
                <Play className="h-6 w-6 text-white" fill="white" />
              </button>
            )}
            {isLoading && (
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
            {error && (
              <div className="absolute bottom-2 left-2 right-2 bg-red-500/80 text-white text-xs p-2 rounded">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

