'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { Heading } from '@/components/ui/heading'
import { Card, CardContent } from '@/components/ui/card'
import { InfluencerPrompt } from '@/components/dashboard/influencers/InfluencerPrompt'
import { InfluencerGallery } from '@/components/InfluencerGallery'

export default function InfluencersPage() {
  const [session, setSession] = useState<any>(null)
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0)
  const supabase = createClientComponentClient()

  // Function to refresh the gallery when a new influencer is saved
  const refreshGallery = () => {
    setGalleryRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    async function fetchSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        redirect('/')
      }
      setSession(session)
    }

    fetchSession()
  }, [supabase])

  if (!session) return null

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold mb-2 gradient-text">Influencers</h1>
          <p className="text-textMuted max-w-2xl">Create custom influencers for your app videos</p>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <CardContent className="p-6">
          <InfluencerPrompt onSaveSuccess={refreshGallery} />
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-border bg-card">
        <CardContent className="p-6">
          <InfluencerGallery key={galleryRefreshKey} />
        </CardContent>
      </Card>
    </div>
  )
} 