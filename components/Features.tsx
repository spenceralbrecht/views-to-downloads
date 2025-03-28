'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, ImageIcon, User, Sparkles, Zap, BarChart } from 'lucide-react'

export default function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto mb-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 inline-block">Feature Highlights</h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Everything you need to create high-converting UGC content
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Link href="/dashboard/create" className="cursor-pointer">
          <Card className="h-full transition-all duration-300 hover:shadow-xl dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 group hover:translate-y-[-5px]">
            <CardHeader>
              <div className="rounded-full w-14 h-14 bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors duration-300">
                <Video className="h-7 w-7 text-blue-500" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors duration-300">Create UGC videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                Generate professional UGC videos for your app in seconds, with AI-optimized scripts and trending formats
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Card className="relative h-full transition-all duration-300 hover:shadow-xl dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-green-500/50 dark:hover:border-green-500/50 group hover:translate-y-[-5px]">
          <CardHeader>
            <div className="rounded-full w-14 h-14 bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors duration-300">
              <ImageIcon className="h-7 w-7 text-green-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-green-500 transition-colors duration-300">Create slideshow videos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              Generate image slideshow videos with viral formats, optimized to drive app downloads and engagement
            </p>
          </CardContent>
          <div className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-muted-foreground border border-gray-200 dark:border-gray-800">
            Coming Soon
          </div>
        </Card>
        
        <Card className="relative h-full transition-all duration-300 hover:shadow-xl dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 group hover:translate-y-[-5px]">
          <CardHeader>
            <div className="rounded-full w-14 h-14 bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors duration-300">
              <User className="h-7 w-7 text-purple-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-purple-500 transition-colors duration-300">UGC Influencer Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              Create professional UGC avatars for your brand, complete with custom voices and personalized styles
            </p>
          </CardContent>
        </Card>
        
        <Card className="h-full transition-all duration-300 hover:shadow-xl dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 group hover:translate-y-[-5px]">
          <CardHeader>
            <div className="rounded-full w-14 h-14 bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors duration-300">
              <Sparkles className="h-7 w-7 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-amber-500 transition-colors duration-300">Hook Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              Generate attention-grabbing hooks that stop the scroll and drive high conversion rates for your app
            </p>
          </CardContent>
        </Card>
        
        <Card className="h-full transition-all duration-300 hover:shadow-xl dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-red-500/50 dark:hover:border-red-500/50 group hover:translate-y-[-5px]">
          <CardHeader>
            <div className="rounded-full w-14 h-14 bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors duration-300">
              <Zap className="h-7 w-7 text-red-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-red-500 transition-colors duration-300">One-Click</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              Just add your app link and let the AI do the rest, saving hours of marketing time and thousands in costs
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative h-full transition-all duration-300 hover:shadow-xl dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 group hover:translate-y-[-5px]">
          <CardHeader>
            <div className="rounded-full w-14 h-14 bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors duration-300">
              <BarChart className="h-7 w-7 text-indigo-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-indigo-500 transition-colors duration-300">Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              Track which videos and hooks are driving the most downloads, with detailed analytics and insights
            </p>
          </CardContent>
          <div className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-muted-foreground border border-gray-200 dark:border-gray-800">
            Coming Soon
          </div>
        </Card>
      </div>
    </section>
  )
}

