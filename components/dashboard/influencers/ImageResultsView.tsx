'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fal } from '@fal-ai/client'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { SaveInfluencerModal } from '../../../components/SaveInfluencerModal'
import { supabase } from '../../../lib/supabaseClient'

// Initialize fal client with API key directly
fal.config({
  credentials: '3e858b41-fbf7-463d-8381-c5f809db884f:a4de9547b72453eae0bb225f6078bce7'
})

interface ImageResultsViewProps {
  promptData: {
    age?: string
    gender?: string
    ethnicity?: string 
    emotion?: string
    location?: string
  } | null
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  onSaveSuccess?: () => void
}

interface FalImage {
  url: string
  content_type: string
}

interface FalResponse {
  images: FalImage[]
  prompt: string
  seed?: number
  has_nsfw_concepts?: boolean[]
}

export function ImageResultsView({ 
  promptData, 
  isLoading, 
  setIsLoading,
  onSaveSuccess
}: ImageResultsViewProps) {
  const [images, setImages] = useState<FalImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [currentInfluencer, setCurrentInfluencer] = useState({
    imageUrl: '',
    data: {
      name: '',
      age: '',
      gender: '',
      ethnicity: '',
      emotion: '',
      location: ''
    }
  })

  useEffect(() => {
    let isMounted = true
    
    const generateImages = async () => {
      if (!promptData) return
      
      try {
        setError(null)
        
        // Construct a detailed prompt from the dropdown selections
        const { age, gender, ethnicity, emotion, location } = promptData
        
        // Map gender to appropriate terms for AI image generation
        const genderTerm = gender === 'male' ? 'man' : 'woman';
        const ageRange = age || '';
        
        // Construct base prompt with more natural language
        const basePrompt = `A ${ethnicity} ${genderTerm} aged ${ageRange} with ${emotion} expression taking a selfie`;
        const locationContext = location ? ` in a ${location}` : '';
        const enhancedPrompt = `${basePrompt}${locationContext}. Natural, organic, UGC tiktok style content, no filters, no editing, vertical portrait shot in 9:16 aspect ratio.`;
        
        console.log('Sending prompt to Fal AI:', enhancedPrompt)
        
        // Send request to Fal AI
        const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
          input: {
            prompt: enhancedPrompt,
            num_images: 4,
            aspect_ratio: "9:16",
            "enable_safety_checker": false
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log)
            }
          },
        })
        
        console.log('Results received:', result.data)
        
        if (isMounted) {
          const responseData = result.data as FalResponse
          if (responseData && responseData.images) {
            setImages(responseData.images)
          } else {
            setError('Failed to generate images')
          }
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error generating images:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error generating images. Please try again.')
          setIsLoading(false)
        }
      }
    }

    if (isLoading && promptData) {
      generateImages()
    }

    return () => {
      isMounted = false
    }
  }, [promptData, isLoading, setIsLoading])

  const handleSaveInfluencer = (imageUrl: string) => {
    setCurrentInfluencer({
      imageUrl,
      data: {
        name: '',
        age: promptData?.age || '',
        gender: promptData?.gender || '',
        ethnicity: promptData?.ethnicity || '',
        emotion: promptData?.emotion || '',
        location: promptData?.location || ''
      }
    })
    setShowSaveModal(true)
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsLoading(false)}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="relative aspect-[9/16] overflow-hidden rounded-md border-border border">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <Skeleton className="h-full w-full opacity-70" />
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>Generating influencer images...</p>
          <p className="text-xs mt-1">This may take up to 30 seconds</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="relative aspect-[9/16] overflow-hidden rounded-md border-border border group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Image
                src={image.url}
                alt={`Generated influencer ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 15vw"
                priority={index < 2}
              />
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Button 
                    onClick={() => handleSaveInfluencer(image.url)}
                    className="bg-white text-black hover:bg-white/90 text-xs p-2 h-auto"
                  >
                    Save this Influencer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {images.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Generated {images.length} influencer images</p>
          </div>
        )}
      </div>

      <SaveInfluencerModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        imageUrl={currentInfluencer.imageUrl}
        influencerData={currentInfluencer.data}
        onSuccess={() => {
          setShowSaveModal(false);
          if (onSaveSuccess) {
            onSaveSuccess();
          }
        }}
      />
    </>
  )
} 