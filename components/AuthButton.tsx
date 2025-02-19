'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'
import StartNowButton from './StartNowButton'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('AuthButton - Fetching user')
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
        
        // If user is logged in and we're on the landing page, redirect to dashboard
        if (user && window.location.pathname === '/') {
          console.log('AuthButton - User logged in, redirecting to dashboard')
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.replace(redirectTo)
        }
      } catch (error) {
        console.error('AuthButton - Error fetching user:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthButton - Auth state change:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN') {
        console.log('AuthButton - User signed in, fetching user data')
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user)
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          console.log('AuthButton - Redirecting to:', redirectTo)
          router.replace(redirectTo)
        } else {
          console.error('AuthButton - Error fetching user after sign in:', error)
          setError(error?.message || 'Failed to fetch user after sign in')
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthButton - User signed out')
        setUser(null)
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router, searchParams])

  if (loading) {
    return (
      <Button disabled>
        Loading...
      </Button>
    )
  }

  if (error) {
    return (
      <Button variant="destructive" onClick={() => window.location.reload()}>
        Error: {error} (Click to retry)
      </Button>
    )
  }

  return <StartNowButton />
}
