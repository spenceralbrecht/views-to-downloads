'use client'

import { Button } from "@/components/ui/button"
import { Power } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function StartNowButton() {
  const supabase = createClientComponentClient()

  const handleStartNow = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  return (
    <Button 
      size="lg" 
      className="bg-[#4287f5] hover:bg-[#3276e4] text-white rounded-full px-8 py-6 text-lg"
      onClick={handleStartNow}
    >
      <Power className="mr-2 h-5 w-5" />
      Start Now
    </Button>
  )
}

