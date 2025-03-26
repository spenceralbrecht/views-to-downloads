'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChipSelect } from './ChipSelect'
import { ImageResultsView } from './ImageResultsView'
import { Skeleton } from '@/components/ui/skeleton'

export function InfluencerPrompt() {
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
    { label: 'Happy', value: 'happy' },
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
              className="w-full md:w-auto bg-[#4287f5]"
              disabled={!age || !gender || !ethnicity || !emotion || isLoading}
            >
              {isLoading ? 'Generating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>

      <div className="w-full md:w-2/3 mt-8 md:mt-0">
        {!promptData && !isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="relative aspect-[9/16] overflow-hidden rounded-md border-border border">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <ImageResultsView 
            promptData={promptData} 
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>
    </div>
  )
} 