'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface InfluencerPromptProps {
  onSubmit: (data: {
    age?: string
    gender?: string
    ethnicity?: string
    emotion?: string
    feature?: string
  }) => void
}

export function InfluencerPrompt({ onSubmit }: InfluencerPromptProps) {
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [ethnicity, setEthnicity] = useState<string>('')
  const [emotion, setEmotion] = useState<string>('')
  const [feature, setFeature] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ age, gender, ethnicity, emotion, feature })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-xl font-semibold mb-6">
        Who's your influencer today?
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-auto">
          <Label htmlFor="age">Age</Label>
          <Select value={age} onValueChange={setAge}>
            <SelectTrigger id="age" className="w-[180px]">
              <SelectValue placeholder="Select age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18">18 year old</SelectItem>
              <SelectItem value="20">20 year old</SelectItem>
              <SelectItem value="25">25 year old</SelectItem>
              <SelectItem value="27">27 year old</SelectItem>
              <SelectItem value="30">30 year old</SelectItem>
              <SelectItem value="35">35 year old</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender" className="w-[180px]">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="woman">woman</SelectItem>
              <SelectItem value="man">man</SelectItem>
              <SelectItem value="girl">girl</SelectItem>
              <SelectItem value="boy">boy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto">
          <Label htmlFor="ethnicity">Ethnicity</Label>
          <Select value={ethnicity} onValueChange={setEthnicity}>
            <SelectTrigger id="ethnicity" className="w-[180px]">
              <SelectValue placeholder="Select ethnicity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asian">asian</SelectItem>
              <SelectItem value="black">black</SelectItem>
              <SelectItem value="hispanic">hispanic</SelectItem>
              <SelectItem value="white">white</SelectItem>
              <SelectItem value="middle eastern">middle eastern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto">
          <Label htmlFor="emotion">Emotion</Label>
          <Select value={emotion} onValueChange={setEmotion}>
            <SelectTrigger id="emotion" className="w-[180px]">
              <SelectValue placeholder="Select emotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="happy">happy</SelectItem>
              <SelectItem value="sad">sad</SelectItem>
              <SelectItem value="excited">excited</SelectItem>
              <SelectItem value="nervous">nervous</SelectItem>
              <SelectItem value="confident">confident</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto">
          <Label htmlFor="feature">Feature</Label>
          <Select value={feature} onValueChange={setFeature}>
            <SelectTrigger id="feature" className="w-[180px]">
              <SelectValue placeholder="Select feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="biting lip">biting lip</SelectItem>
              <SelectItem value="smiling">smiling</SelectItem>
              <SelectItem value="winking">winking</SelectItem>
              <SelectItem value="serious face">serious face</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm pt-2 pb-4">
        <div className="flex flex-wrap gap-2">
          {age && <span className="bg-muted rounded-full px-3 py-1 text-xs">{age}</span>}
          {gender && <span className="bg-muted rounded-full px-3 py-1 text-xs">{gender}</span>}
          {ethnicity && <span className="bg-muted rounded-full px-3 py-1 text-xs">{ethnicity}</span>}
          {emotion && <span className="bg-muted rounded-full px-3 py-1 text-xs">{emotion}</span>}
          {feature && <span className="bg-muted rounded-full px-3 py-1 text-xs">{feature}</span>}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full md:w-auto bg-[#4287f5]"
        disabled={!age || !gender || !ethnicity || !emotion}
      >
        Create
      </Button>
    </form>
  )
} 