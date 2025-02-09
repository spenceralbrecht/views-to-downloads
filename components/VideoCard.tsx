'use client'

import { useState } from 'react'
import type { OutputContent } from '@/types/video'
import { Trash2, Download } from 'lucide-react'
import { deleteVideo } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface VideoCardProps {
  video: OutputContent
}

export function VideoCard({ video }: VideoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isLoading = video.status === 'in_progress'
  const supabase = createClientComponentClient()

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
            {new Date(video.created_at).toLocaleDateString()}
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
                  className="h-8 w-8 bg-white hover:bg-gray-100"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 bg-white hover:bg-gray-100"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
