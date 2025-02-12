'use client'

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Loader2 } from 'lucide-react'
import { VideoCardSkeleton } from './VideoCardSkeleton'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactPlayer from 'react-player'
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
  }
  isPending: boolean
  onDelete: (videoId: string) => void
}

export function VideoCard({ video, isPending, onDelete }: VideoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [playError, setPlayError] = useState(false)
  const supabase = createClientComponentClient()

  if (isPending) {
    return <VideoCardSkeleton />
  }

  const videoUrl = video.url || ''

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(video.id)
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
      a.download = `video-${video.id}.mp4`
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
    <Card className="relative overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className="relative aspect-[9/16]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {playError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground">Error loading video</p>
          </div>
        ) : (
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls={true}
            playing={isHovered}
            onError={() => setPlayError(true)}
            style={{ aspectRatio: '9/16', objectFit: 'cover' }}
            playsinline
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  disablePictureInPicture: true
                }
              }
            }}
          />
        )}
        
        {/* Delete button overlay - always visible */}
        <div className="absolute top-2 left-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="bg-destructive/80 hover:bg-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
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
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Download button overlay - visible on hover */}
        <div 
          className={`absolute top-2 right-2 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/50 hover:bg-background/70 text-foreground"
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
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {new Date(video.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  )
}
