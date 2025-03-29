'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChipSelect } from './ChipSelect'
import { ImageResultsView } from './ImageResultsView'
import { Skeleton } from '@/components/ui/skeleton'

interface InfluencerPromptProps {
  onSaveSuccess?: () => void
}

export function InfluencerPrompt({ onSaveSuccess }: InfluencerPromptProps) {
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [ethnicity, setEthnicity] = useState<string>('')
  const [emotion, setEmotion] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [promptData, setPromptData] = useState<{
    age?: string
    gender?: string
    ethnicity?: string
    emotion?: string
    location?: string
  } | null>(null)
  const [galleryKey, setGalleryKey] = useState(0)

  // Callback function to refresh the gallery component
  const handleSaveSuccess = useCallback(() => {
    setGalleryKey(prevKey => prevKey + 1);
    if (onSaveSuccess) {
      onSaveSuccess();
    }
  }, [onSaveSuccess]);

  const ageOptions = [
    { label: '16-18', value: '16-18' },
    { label: '18-22', value: '18-22' },
    { label: '22-26', value: '22-26' },
    { label: '26-30', value: '26-30' },
    { label: '30-40', value: '30-40' },
    { label: '40-50', value: '40-50' }
  ]

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ]

  const ethnicityOptions = [
    { label: 'Hispanic', value: 'hispanic' },
    { label: 'White', value: 'white' },
    { label: 'Black', value: 'black' },
    { label: 'Asian', value: 'asian' }
  ]

  const emotionOptions = [
    { label: 'Neutral', value: 'neutral' },
    { label: 'Happy', value: 'happy' },
    { label: 'Shocked', value: 'shocked' },
    { label: 'Excited', value: 'excited' },
    { label: 'Calm', value: 'calm' },
    { label: 'Sad', value: 'sad' },
    { label: 'Angry', value: 'angry' }
  ]

  const locationOptions = [
    { label: 'Car', value: 'car' },
    { label: 'Desk', value: 'desk' },
    { label: 'Bedroom', value: 'bedroom' },
    { label: 'Park', value: 'park' },
    { label: 'City Sidewalk', value: 'city sidewalk' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { age, gender, ethnicity, emotion, location }
    setPromptData(data)
    setIsLoading(true)
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-6">
      <div className="w-full md:w-1/3 md:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-6">
            <ChipSelect 
              label="Age" 
              options={ageOptions} 
              value={age} 
              onChange={setAge} 
            />
            
            <ChipSelect 
              label="Sex" 
              options={genderOptions} 
              value={gender} 
              onChange={setGender} 
            />
            
            <ChipSelect 
              label="Ethnicity" 
              options={ethnicityOptions} 
              value={ethnicity} 
              onChange={setEthnicity} 
            />
            
            <ChipSelect 
              label="Emotion" 
              options={emotionOptions} 
              value={emotion} 
              onChange={setEmotion} 
            />
            
            <ChipSelect 
              label="Location" 
              options={locationOptions} 
              value={location} 
              onChange={setLocation} 
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full md:w-auto btn-gradient rounded-md"
              disabled={!age || !gender || !ethnicity || !emotion || isLoading}
            >
              {isLoading ? 'Generating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>

      <div className="w-full md:w-2/3 mt-8 md:mt-0">
        {!promptData && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-border rounded-lg bg-card/50 p-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text mb-3">No influencers generated</h3>
            <p className="text-textMuted text-center max-w-sm">
              Select options and click Create to generate custom influencer images for your videos.
            </p>
          </div>
        ) : (
          <ImageResultsView 
            promptData={promptData} 
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
      </div>
    </div>
  )
} 