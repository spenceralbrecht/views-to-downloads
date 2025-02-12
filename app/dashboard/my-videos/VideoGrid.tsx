'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { VideoCard } from '@/components/VideoCard'
import { SubscriptionLimitDialog } from '@/components/SubscriptionLimitDialog'
import type { OutputContent } from '@/types/video'

interface VideoGridProps {
  initialVideos: OutputContent[]
}

export function VideoGrid({ initialVideos }: VideoGridProps) {
  const [videos, setVideos] = useState<OutputContent[]>(initialVideos)
  const [pendingVideos, setPendingVideos] = useState<string[]>([])
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('')
  const [upgradeLink, setUpgradeLink] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .single()

      if (subscription) {
        // Set the upgrade link based on the current plan
        const planName = subscription.plan_name?.toLowerCase() || ''
        setCurrentPlan(planName)
        
        // Set the appropriate upgrade link based on environment and current plan
        const isDev = process.env.NEXT_PUBLIC_STRIPE_ENV === 'development'
        const linkPrefix = isDev ? 'NEXT_PUBLIC_STRIPE_TEST_' : 'NEXT_PUBLIC_STRIPE_'
        
        let nextTier = ''
        if (planName === 'starter') {
          nextTier = `${linkPrefix}GROWTH_LINK`
        } else if (planName === 'growth') {
          nextTier = `${linkPrefix}SCALE_LINK`
        }
        
        setUpgradeLink(process.env[nextTier] || '')
      }
    }

    checkSubscriptionStatus()
  }, [supabase])

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

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('output_content')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      setVideos(current => current.filter(v => v.id !== videoId))
      setPendingVideos(current => current.filter(pendingId => pendingId !== videoId))
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            isPending={pendingVideos.includes(video.id)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <SubscriptionLimitDialog 
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        currentPlan={currentPlan}
        upgradeLink={upgradeLink}
      />
    </>
  )
}
