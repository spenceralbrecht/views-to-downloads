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
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
        
        // If user is logged in and we're on the landing page, redirect to dashboard
        if (user && window.location.pathname === '/') {
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.replace(redirectTo)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN') {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
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

  if (loading) {
    return (
      <Button 
        size="lg" 
        className="bg-[#4287f5] hover:bg-[#3276e4] text-white rounded-full px-8 py-6 text-lg"
        disabled
      >
        Loading...
      </Button>
    )
  }

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
