'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initial user fetch
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // If user is logged in and we're on the landing page, redirect to dashboard
        if (user && window.location.pathname === '/') {
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.replace(redirectTo)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      }
    }

    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.replace(redirectTo)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router, searchParams])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  if (user) {
    return (
      <Button asChild>
        <Link href="/dashboard">
          Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    )
  }

  return (
    <Button onClick={handleSignIn}>
      Start Now
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  )
}
