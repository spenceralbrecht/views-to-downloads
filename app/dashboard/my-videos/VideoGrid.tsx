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
          } else if (payload.eventType === 'INSERT') {
            setVideos(currentVideos => [payload.new as OutputContent, ...currentVideos])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
