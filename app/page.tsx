'use client'

import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { VideoThumbnail } from "@/components/VideoThumbnail"
import AuthButton from '@/components/AuthButton'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Alternatives from '@/components/Alternatives'
import FAQ from '@/components/FAQ'
import { useState } from 'react'
import { Video, Camera, Sparkles } from 'lucide-react'

export default function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleStartNow = () => {
    setIsLoginModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-gray-950">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 md:py-24">
        {searchParams.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{searchParams.error}</span>
          </div>
        )}
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Create UGC content that gets downloads
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10">
            Save thousands on your marketing and focus on building your app
          </p>
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>

        {/* Video Grid */}
        <div className="relative w-full max-w-5xl mx-auto px-4 mb-24">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-8 px-6 snap-x snap-mandatory -mx-4">
            {[
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-1.mp4",
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-2.mp4",
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-3.mp4",
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-4.mp4",
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-5.mp4"
            ].map((video, index) => (
              <VideoThumbnail key={index} video={video} index={index} />
            ))}
          </div>
          {/* Gradient Fade Edges */}
          <div className="absolute left-0 top-0 bottom-8 w-12 bg-gradient-to-r from-[#fafafa] dark:from-gray-950 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-[#fafafa] dark:from-gray-950 to-transparent pointer-events-none" />
        </div>

        <Alternatives />
        <Features />
        <Pricing />
        <div className="mb-24">
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  )
}

