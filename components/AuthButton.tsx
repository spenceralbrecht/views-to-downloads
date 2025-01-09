'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import StartNowButton from './StartNowButton'

export default function AuthButton() {
  const [session, setSession] = useState(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
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

  return <StartNowButton />
}

