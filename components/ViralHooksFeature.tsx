'use client'

import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ViralHooksFeature() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="w-full max-w-6xl mx-auto mb-32 px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center justify-center mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
            <span className="text-amber-500 dark:text-amber-400 font-medium">NEW FEATURE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-purple-600 dark:from-amber-400 dark:to-purple-400 inline-block">
            Generate viral hooks
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Create attention-grabbing hooks that stop the scroll and drive high conversion rates for your app. Our AI analyzes top-performing TikTok content to generate hooks that resonate with your target audience.
          </p>
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            size="lg" 
            className="rounded-full px-8 py-6 text-lg font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? "Connecting..." : "Try hook generator"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-xl -z-10 blur-lg transform scale-95 opacity-70"></div>
          <div className="relative bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
            <Image
              src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/hooks-screenshot.png"
              alt="Generate viral hooks feature"
              width={800}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
} 