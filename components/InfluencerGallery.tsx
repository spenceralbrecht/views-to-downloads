'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

type Influencer = {
  id: string
  name: string
  image_url: string
  age?: string
  gender?: string
  ethnicity?: string
  emotion?: string
  location?: string
}

export function InfluencerGallery() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseClient = createClientComponentClient()

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setLoading(true);
        // Get the current session using auth helpers
        const { data: { session } } = await supabaseClient.auth.getSession()
        
        if (!session || !session.user) {
          setInfluencers([])
          setLoading(false)
          return
        }
        
        // Then fetch influencers for this user
        const { data, error } = await supabase
          .from('generated_influencers')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Supabase fetch error:', error)
          throw error
        }
        
        console.log('Fetched influencers:', data)
        setInfluencers(data || [])
      } catch (error) {
        console.error('Error fetching influencers:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInfluencers()
  }, [supabaseClient])

  if (loading) {
    return <div className="flex justify-center p-6">Loading influencers...</div>
  }

  if (influencers.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">No influencers saved yet. Generate some images above and save them to see them here!</div>
  }

  return (
    <div className="py-2">
      <h2 className="text-xl font-bold mb-4">My Saved Influencers</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {influencers.map((influencer) => (
          <div 
            key={influencer.id} 
            className="relative aspect-[9/16] rounded-lg overflow-hidden group border border-border"
          >
            <Image
              src={influencer.image_url}
              alt={influencer.name || 'Influencer image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-white font-medium text-lg">{influencer.name}</h3>
                {influencer.age && (
                  <p className="text-white/80 text-sm">Age: {influencer.age}</p>
                )}
                {influencer.gender && (
                  <p className="text-white/80 text-sm">Gender: {influencer.gender}</p>
                )}
                {influencer.ethnicity && (
                  <p className="text-white/80 text-sm">Ethnicity: {influencer.ethnicity}</p>
                )}
                {influencer.emotion && (
                  <p className="text-white/80 text-sm">Emotion: {influencer.emotion}</p>
                )}
                {influencer.location && (
                  <p className="text-white/80 text-sm">Location: {influencer.location}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 