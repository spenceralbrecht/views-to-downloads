'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import StartNowButton from './StartNowButton'

export default function AuthButton() {
  const [user, setUser] = useState(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (user) {
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
