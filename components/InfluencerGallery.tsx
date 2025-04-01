'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { SaveInfluencerModal } from './SaveInfluencerModal'

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
  const [isUploading, setIsUploading] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [influencerDataForSave, setInfluencerDataForSave] = useState<any>(null)
  const supabaseClient = createClientComponentClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchInfluencers = useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) {
      setInfluencers([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('generated_influencers')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase fetch error:', error)
        throw error
      }
      
      console.log('Fetched influencers:', data)
      setInfluencers(data || [])
    } catch (error) {
      console.error('Error fetching influencers:', error)
      setInfluencers([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const setup = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      const currentUserId = session?.user?.id || null
      setUserId(currentUserId)
      if (currentUserId) {
        fetchInfluencers(currentUserId)
      } else {
        setLoading(false)
        setInfluencers([])
      }
    }
    setup()
  }, [supabaseClient, fetchInfluencers])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}_${Date.now()}.${fileExt}`
      const filePath = `public/${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('generated-influencers')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Failed to upload image: ' + uploadError.message)
      }

      const { data: urlData } = supabase.storage
        .from('generated-influencers')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Could not get public URL for uploaded image.')
      }

      console.log('Uploaded image URL:', urlData.publicUrl)
      setUploadedImageUrl(urlData.publicUrl)
      setInfluencerDataForSave({
        name: '',
        age: '',
        gender: '',
        ethnicity: '',
        emotion: '',
        location: ''
      })
      setShowSaveModal(true)
    } catch (error) {
      console.error('Error during upload process:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSaveSuccess = () => {
    setShowSaveModal(false)
    setUploadedImageUrl(null)
    setInfluencerDataForSave(null)
    if (userId) {
      fetchInfluencers(userId)
    }
  }

  if (loading && influencers.length === 0) {
    return <div className="flex justify-center p-6 text-textMuted">Loading influencers...</div>
  }

  const noInfluencersMessage = (
    <div className="text-center py-6 text-textMuted">
      No influencers saved yet. Generate images or upload your own!
    </div>
  )

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-text">My Saved Influencers</h2>
        <Button
          onClick={handleUploadClick}
          disabled={isUploading || !userId}
          variant="outline"
          size="sm"
          className="ml-4 border-border text-text"
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          style={{ display: 'none' }}
        />
      </div>

      {influencers.length === 0 && !loading ? (
        noInfluencersMessage
      ) : loading && influencers.length === 0 ? (
        <div className="flex justify-center p-6 text-textMuted">Loading influencers...</div>
      ) : (
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
      )}

      {uploadedImageUrl && influencerDataForSave && (
        <SaveInfluencerModal
          open={showSaveModal}
          onOpenChange={setShowSaveModal}
          imageUrl={uploadedImageUrl}
          influencerData={influencerDataForSave}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  )
} 