'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, ImageIcon, User, Sparkles } from 'lucide-react'

export default function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto mb-24">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Features</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Link href="/dashboard/create" className="cursor-pointer">
          <Card className="h-full transition-all duration-200 hover:shadow-xl dark:bg-gray-900/40 hover:border-primary/50 group">
            <CardHeader>
              <div className="rounded-full w-12 h-12 bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Video className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl text-foreground">Create UGC videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Create & publish UGC videos promoting your product demo</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="relative h-full transition-all duration-200 hover:shadow-xl dark:bg-gray-900/40 hover:border-primary/50 group">
          <CardHeader>
            <div className="rounded-full w-12 h-12 bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <ImageIcon className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-xl text-foreground">Create slideshow videos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Create & publish image slideshow videos to TikTok</p>
          </CardContent>
          <div className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-muted-foreground">
            Coming Soon
          </div>
        </Card>
        <Card className="relative h-full transition-all duration-200 hover:shadow-xl dark:bg-gray-900/40 hover:border-primary/50 group">
          <CardHeader>
            <div className="rounded-full w-12 h-12 bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <User className="h-6 w-6 text-purple-500" />
            </div>
            <CardTitle className="text-xl text-foreground">UGC Avatar Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Auto-magically generate and save viral hooks for your videos</p>
          </CardContent>
          <div className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-muted-foreground">
            Coming Soon
          </div>
        </Card>
        <Card className="h-full transition-all duration-200 hover:shadow-xl dark:bg-gray-900/40 hover:border-primary/50 group">
          <CardHeader>
            <div className="rounded-full w-12 h-12 bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl text-foreground">Hook Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Auto-magically generate and save viral hooks for your videos</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

