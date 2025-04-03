'use client'

import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { VideoThumbnail } from "@/components/VideoThumbnail"
import Features from '@/components/Features'
import ViralHooksFeature from '@/components/ViralHooksFeature'
import CustomInfluencersFeature from '@/components/CustomInfluencersFeature'
import Pricing from '@/components/Pricing'
import Alternatives from '@/components/Alternatives'
import FAQ from '@/components/FAQ'
import { useState, useEffect } from 'react'
import { ArrowRight, Play, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LandingPage({
  searchParams,
}: {
  searchParams: { 
    error?: string,
    redirect?: string,
    tiktok_success?: string,
    tiktok_data?: string
  }
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const supabase = createClientComponentClient()

  // Handle TikTok OAuth redirect data
  useEffect(() => {
    if (searchParams.tiktok_data) {
      try {
        // Sanitize the data before storing it
        // First try to decode and validate it's proper JSON
        const rawData = searchParams.tiktok_data;
        const decoded = Buffer.from(rawData, 'base64').toString('utf-8');
        
        // Try to parse it to ensure it's valid JSON
        const parsed = JSON.parse(decoded);
        
        // If we got here, it's valid JSON, so we can safely store it
        console.log('Storing valid TikTok data in localStorage');
        localStorage.setItem('tiktok_pending_data', rawData);
      } catch (error) {
        console.error('Error processing TikTok data from URL:', error);
        // Don't store invalid data
      }
      
      // Check if the user is already logged in
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is logged in, redirect to dashboard
          console.log('User is logged in, redirecting to dashboard');
          window.location.href = '/dashboard/connected-accounts';
        } else {
          // Show login prompt
          console.log('User needs to log in first');
          // We'll rely on the sign-in button being visible
        }
      };
      
      checkSession();
      
      // Clean up URL to prevent repeated processing
      const url = new URL(window.location.href);
      url.searchParams.delete('tiktok_data');
      url.searchParams.delete('tiktok_success');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams.tiktok_data, supabase.auth]);

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
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 -z-10"></div>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] -right-[30%] w-[120%] h-[120%] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[30%] w-[120%] h-[120%] rounded-full bg-purple-500/5 blur-3xl"></div>
        <div className="absolute top-[40%] left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>
      
      <Header />
      <main className="flex-grow relative">
        <div className="w-full max-w-7xl mx-auto px-4">
          {searchParams.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{searchParams.error}</span>
            </div>
          )}
          
          {/* Hero Section */}
          <div className="relative pt-20 pb-8 md:pt-28 md:pb-16 overflow-hidden">            
            <div className="max-w-5xl mx-auto text-center relative z-10">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Automate Viral App Content
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
                Drive views, downloads, and revenue with a content automation system that helps you scale your reach
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
                <Button 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  size="lg" 
                  className="rounded-full px-8 py-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? "Connecting..." : "Get Started"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => setIsDemoOpen(true)}
                  size="lg" 
                  variant="outline"
                  className="rounded-full px-8 py-6 text-lg font-medium border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
                >
                  Demo <Play className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              {/* Social Proof */}
              <div className="mb-16">
                <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">Trusted by 500+ Founders & Growth Teams</p>
              </div>
            </div>
          </div>

          {/* Video Demo Section with Floating UI */}
          <div className="relative w-full max-w-6xl mx-auto mb-24 rounded-xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm z-0"></div>
            <div className="relative z-10 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-inner">
                <div className="relative aspect-video w-full">
                  {/* Video Showcase */}
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-6 snap-x snap-mandatory">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <VideoThumbnail 
                        key={num-1} 
                        video={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/app-video-demo-${num}.mp4`}
                        index={num-1} 
                      />
                    ))}
                  </div>
                  {/* Gradient Fade Edges - adjusted to match the height of the content */}
                  <div className="absolute left-0 top-4 bottom-4 w-12 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none" />
                  <div className="absolute right-0 top-4 bottom-4 w-12 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Value Propositions and Features */}
          <Alternatives />
          <Features />
          <CustomInfluencersFeature />
          <ViralHooksFeature />
          <Pricing />
          <div className="mb-24">
            <FAQ />
          </div>
          
          {/* Final CTA Section */}
          <div className="max-w-4xl mx-auto text-center py-16 mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl z-0"></div>
            <div className="relative z-10 p-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Automate Your UGC Content?</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of app founders and marketers saving time and money with AI-generated UGC ads.
              </p>
              <Button 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                size="lg" 
                className="rounded-full px-8 py-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? "Connecting..." : "Generate Your First AI Video Now"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Demo Video Modal */}
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="max-w-4xl w-full p-1 sm:p-2">
          <DialogHeader className="p-2">
            <DialogTitle className="text-xl">How to Get Started</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-video">
            <video 
              src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/full-demo.mp4" 
              controls 
              autoPlay
              className="w-full h-full rounded-md"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
