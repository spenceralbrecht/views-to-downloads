'use client'

import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function CustomInfluencersFeature() {
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
        <div className="order-2 md:order-1 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl -z-10 blur-lg transform scale-95 opacity-70"></div>
          <div className="relative bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
            <Image
              src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/create-influencer-screenshot.png"
              alt="Create Custom Influencers feature"
              width={800}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="inline-flex items-center justify-center mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
            <span className="text-purple-600 dark:text-purple-400 font-medium">POWERFUL FEATURE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 inline-block">
            Create Custom Influencers
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Generate AI influencers tailored to your target audience. Customize age, style, and personality to create authentic-looking content that resonates with your potential customers.
          </p>
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            size="lg" 
            className="rounded-full px-8 py-6 text-lg font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? "Connecting..." : "Create your influencer"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
} 