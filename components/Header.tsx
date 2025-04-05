import Link from 'next/link'
import { Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export function Header() {
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
    <header className="py-6 px-4 md:px-6 lg:px-8 flex items-center justify-between bg-transparent sticky top-0 z-50 backdrop-blur-sm">
      <div className="w-full max-w-7xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-800 shadow-sm py-3 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Download className="h-6 w-6 text-[#4287f5]" />
          <span className="hidden md:inline text-xl font-bold">Views to Downloads</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link 
            href="/proven-formats" 
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Proven Formats
          </Link>
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="rounded-full px-6 py-2 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? "Connecting..." : "Get Started"}
          </Button>
        </div>
      </div>
    </header>
  )
}

