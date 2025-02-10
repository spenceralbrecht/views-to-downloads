'use client'

import { useState } from 'react'
import type { OutputContent } from '@/types/video'
import { Trash2, Download, Loader2 } from 'lucide-react'
import { deleteVideo } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatDistanceToNow, isWithinInterval, subHours } from 'date-fns'
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
  video: OutputContent
  isPending?: boolean
  onDelete?: (id: string) => void
}

export function VideoCard({ video, isPending = false, onDelete }: VideoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isLoading = video.status === 'in_progress'
  const supabase = createClientComponentClient()

  // Format the date - show relative time if within 24 hours
  const formatDate = (date: string) => {
    const createdDate = new Date(date)
    const now = new Date()
    
    const isWithin24Hours = isWithinInterval(createdDate, {
      start: subHours(now, 24),
      end: now
    })

    if (isWithin24Hours) {
      return formatDistanceToNow(createdDate, { addSuffix: true })
    }

    return createdDate.toLocaleDateString()
  }

  if (isPending) {
    return (
      <Card className="relative aspect-video bg-gray-100 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  // Clean the URL by removing any query parameters
  const cleanVideoUrl = (url: string) => {
    try {
      // Remove everything after the last question mark
      const cleanUrl = url.split('?')[0]
      console.log('Original URL:', url, 'Cleaned URL:', cleanUrl)
      return cleanUrl
    } catch (e) {
      console.error('Invalid URL:', url, 'Error:', e)
      return url
    }
  }

  const videoUrl = cleanVideoUrl(video.url)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteVideo(video.id)
      // Call the onDelete callback if provided
      onDelete?.(video.id)
    } catch (error) {
      console.error('Failed to delete video:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    // Create an anchor element and trigger download
    const link = document.createElement('a')
    link.href = videoUrl
    // Extract filename from the URL
    const filename = videoUrl.split('/').pop() || `video-${video.id}.mp4`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-gray-200 animate-pulse">
          <div className="text-gray-400">Processing...</div>
        </div>
      ) : (
        <div className="relative aspect-video bg-black">
          <video 
            className="absolute inset-0 w-full h-full object-contain"
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {formatDate(video.created_at)}
          </span>
          <div className="flex gap-2">
            {isLoading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Processing
              </span>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
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
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={handleDelete}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
