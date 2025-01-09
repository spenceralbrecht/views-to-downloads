'use client'

import { Button } from "@/components/ui/button"
import { Power, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Session } from '@supabase/auth-helpers-nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCallback } from 'react'

interface AuthButtonProps {
  session: Session | null
}

export default function AuthButton({ session }: AuthButtonProps) {
  const supabase = createClientComponentClient()

  const handleStartNow = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Error signing in with Google:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in handleStartNow:', error)
      window.location.href = `/?error=${encodeURIComponent('Failed to start authentication')}`
    }
  }, [supabase.auth])

  if (session) {
    return (
      <Button 
        size="lg" 
        className="bg-[#4287f5] hover:bg-[#3276e4] text-white rounded-full px-8 py-6 text-lg"
        asChild
      >
        <Link href="/dashboard">
          Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    )
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

