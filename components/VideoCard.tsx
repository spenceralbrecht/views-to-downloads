'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Loader2, X, AlertTriangle } from 'lucide-react'
import { VideoCardSkeleton } from './VideoCardSkeleton'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactPlayer from 'react-player'
import { PublishToTikTokModal } from './PublishToTikTokModal'
import { isTikTokEnabled } from '@/utils/featureFlags'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VideoCardProps {
  video: {
    id: string
    status: string
    created_at: string
    url?: string
    published?: string
    published_url?: string
  }
  isPending: boolean
  onDelete: (videoId: string) => void
}

export function VideoCard({ video, isPending, onDelete }: VideoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [playError, setPlayError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showTikTokModal, setShowTikTokModal] = useState(false)
  const [videoData, setVideoData] = useState(video)
  const supabase = createClientComponentClient()

  // Synchronize videoData with video prop when it changes
  useEffect(() => {
    console.log(' [VIDEO-CARD] Video prop changed:', video.id, video.status, 'URL:', video.url?.substring(0, 60) + '...');
    setVideoData(video);
  }, [video.id, video.status, video.url]);

  // Function to refresh the video data after publishing
  const refreshVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('output_content')
        .select('*')
        .eq('id', video.id)
        .single()
        
      if (error) {
        console.error('Error refreshing video data:', error)
        return
      }
      
      if (data) {
        setVideoData(data)
      }
    } catch (error) {
      console.error('Error refreshing video data:', error)
    }
  }

  // Show loading skeleton for in_progress videos
  if (videoData.status === 'in_progress' || isPending) {
    return <VideoCardSkeleton />
  }

  // Show failed state
  if (videoData.status === 'failed') {
    return (
      <Card className="relative bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
        <div className="aspect-[9/16] flex items-center justify-center bg-sidebar">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-textMuted">Video processing failed</p>
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-textMuted">
              {new Date(videoData.created_at).toLocaleDateString()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(videoData.id)}
              className="text-danger hover:text-danger/90 hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const videoUrl = videoData.url || ''

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(videoData.id)
    } catch (error) {
      console.error('Error deleting video:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `video-${videoData.id}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading video:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card className="relative overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 rounded-md">
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {playError ? (
          <div className="aspect-[9/16] flex items-center justify-center bg-sidebar p-4 text-center">
            <div className="text-sm text-textMuted">
              Error loading video
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlayError(false)}
                className="block mx-auto mt-2 hover:bg-primary/10"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-sidebar z-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <div className="aspect-[9/16]">
              <ReactPlayer
                url={videoUrl}
                width="100%"
                height="100%"
                controls={true}
                playing={false}
                onError={() => {
                  setPlayError(true)
                  setIsLoading(false)
                }}
                onReady={() => setIsLoading(false)}
                style={{ aspectRatio: '9/16' }}
                playsinline
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      disablePictureInPicture: true,
                      preload: 'metadata'
                    },
                    forceVideo: true
                  }
                }}
              />
            </div>
          </>
        )}
        
        {/* Delete button overlay - only visible on hover */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <X className="h-4 w-4 text-white" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Video</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this video? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-danger hover:bg-danger/90 text-white"
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Download button overlay - visible on hover */}
        <div 
          className={`absolute top-2 right-2 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/50 hover:bg-background/70 text-text"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {new Date(videoData.created_at).toLocaleDateString()}
            </span>
            {/* TikTok publish button */}
            {isTikTokEnabled() ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground p-1" 
                onClick={() => setShowTikTokModal(true)}
              >
                <img 
                  src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/tiktok-logo.png" 
                  alt="TikTok" 
                  className="h-5 w-5 object-contain"
                />
                <span className="sr-only">Publish to TikTok</span>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground p-1 opacity-50 cursor-not-allowed" 
                disabled={true}
              >
                <img 
                  src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/tiktok-logo.png" 
                  alt="TikTok" 
                  className="h-5 w-5 object-contain"
                />
                <span className="sr-only">TikTok Integration Coming Soon</span>
              </Button>
            )}
          </div>
          
          {/* Published status indicator - now below the date */}
          {videoData.published === 'tiktok' && videoData.published_url && (
            <a
              href={videoData.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-700 flex items-center"
            >
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Published to TikTok
            </a>
          )}
        </div>
      </div>
      
      {/* TikTok publish modal */}
      <PublishToTikTokModal
        open={showTikTokModal}
        onOpenChange={setShowTikTokModal}
        videoUrl={videoUrl}
        videoId={videoData.id}
        published={videoData.published}
        publishedUrl={videoData.published_url}
        onPublishSuccess={refreshVideo}
      />
    </Card>
  )
}
