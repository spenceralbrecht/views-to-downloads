'use client'

import { useState, useEffect } from 'react'
import { Loader2, Film, Plus } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { VideoCard } from '@/components/VideoCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { OutputContent } from '@/types/video'

export default function VideosPage() {
  const [videos, setVideos] = useState<OutputContent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchVideos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('output_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching videos:', error)
        return
      }

      setVideos(data)
      setLoading(false)
    }

    fetchVideos()
  }, [supabase])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 pb-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">My Videos</h1>
            <p className="text-textMuted max-w-2xl">
              {videos.length > 0 
                ? `You have ${videos.length} generated video${videos.length === 1 ? '' : 's'}.` 
                : 'Create and manage your generated videos here.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Film className="h-10 w-10 text-primary opacity-60" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">No videos yet</h3>
          <p className="text-textMuted mb-8 max-w-md mx-auto">
            Create your first video to start showcasing your app to potential users.
          </p>
          <div className="max-w-xs mx-auto">
            <Link href="/dashboard/create">
              <Button className="btn-gradient w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Video
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
        
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video}
                isPending={false}
                onDelete={async (id) => {
                  const { error } = await supabase
                    .from('output_content')
                    .delete()
                    .eq('id', id)
                  
                  if (!error) {
                    setVideos(videos.filter(v => v.id !== id))
                  }
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
