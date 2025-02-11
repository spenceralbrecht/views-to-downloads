'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { VideoCard } from '@/components/VideoCard'
import type { OutputContent } from '@/types/video'

interface VideoGridProps {
  initialVideos: OutputContent[]
}

export function VideoGrid({ initialVideos }: VideoGridProps) {
  const [videos, setVideos] = useState<OutputContent[]>(initialVideos)
  const [pendingVideos, setPendingVideos] = useState<string[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const channel = supabase
      .channel('output_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'output_content'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setVideos(currentVideos => 
              currentVideos.map(video => 
                video.id === payload.new.id ? { ...video, ...payload.new } : video
              )
            )
            // Remove from pending if status is no longer in_progress
            if (payload.new.status !== 'in_progress') {
              setPendingVideos(current => current.filter(id => id !== payload.new.id))
            }
          } else if (payload.eventType === 'INSERT') {
            const newVideo = payload.new as OutputContent
            setVideos(currentVideos => [newVideo, ...currentVideos])
            if (newVideo.status === 'in_progress') {
              setPendingVideos(current => [...current, newVideo.id])
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard 
          key={video.id} 
          video={video} 
          isPending={pendingVideos.includes(video.id)}
          onDelete={(id) => {
            setVideos(current => current.filter(v => v.id !== id))
            setPendingVideos(current => current.filter(pendingId => pendingId !== id))
          }}
        />
      ))}
    </div>
  )
}
