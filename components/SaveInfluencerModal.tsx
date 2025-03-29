'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type SaveInfluencerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  influencerData: {
    name: string
    age?: string
    gender?: string
    ethnicity?: string
    emotion?: string
    location?: string
  }
  onSuccess: () => void
}

export function SaveInfluencerModal({
  open,
  onOpenChange,
  imageUrl,
  influencerData,
  onSuccess
}: SaveInfluencerModalProps) {
  const [name, setName] = useState(influencerData.name || '')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabaseClient = createClientComponentClient()

  const saveInfluencer = async () => {
    if (!name) {
      setError('Name is required')
      return
    }

    setIsPending(true)
    setError(null)
    
    try {
      // Get authenticated user ID using the more reliable pattern
      const { data: { session } } = await supabaseClient.auth.getSession()
      
      if (!session || !session.user) {
        throw new Error('User not authenticated')
      }
      
      const userId = session.user.id
      
      // 1. First fetch and upload the image to Supabase Storage
      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      
      const fileName = `influencer-${Date.now()}`
      const fileExt = imageBlob.type.split('/')[1]
      const filePath = `${fileName}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-influencers')
        .upload(filePath, imageBlob)
      
      if (uploadError) throw uploadError
      
      // 2. Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('generated-influencers')
        .getPublicUrl(filePath)
      
      const storedImageUrl = publicUrlData.publicUrl
      
      // 3. Store the record in the database with user_id
      const { error: insertError } = await supabase
        .from('generated_influencers')
        .insert({
          image_url: storedImageUrl,
          name,
          age: influencerData.age,
          gender: influencerData.gender,
          ethnicity: influencerData.ethnicity,
          emotion: influencerData.emotion,
          location: influencerData.location,
          user_id: userId
        })
      
      if (insertError) throw insertError
      
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Error saving influencer:', err)
      setError('Failed to save influencer. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-text">Save Influencer</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex justify-center">
            <div className="relative aspect-[9/16] w-[200px] rounded-lg overflow-hidden border border-border">
              <Image
                src={imageUrl}
                alt="Influencer preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          <div className="grid items-center gap-2">
            <Label htmlFor="name" className="text-text">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter influencer name"
              className="bg-background border-border text-text"
            />
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-border text-text"
          >
            Cancel
          </Button>
          <Button 
            onClick={saveInfluencer}
            className="btn-gradient"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Influencer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 