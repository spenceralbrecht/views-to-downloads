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
          <Card>
            <CardHeader>
              <Video className="h-8 w-8 mb-2 text-blue-500" />
              <CardTitle>Create UGC videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Create & publish UGC videos promoting your product demo</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="relative">
          <CardHeader>
            <ImageIcon className="h-8 w-8 mb-2 text-green-500" />
            <CardTitle>Create slideshow videos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Create & publish image slideshow videos to TikTok</p>
          </CardContent>
          <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            Not Available Yet
          </div>
        </Card>
        <Card className="relative">
          <CardHeader>
            <User className="h-8 w-8 mb-2 text-purple-500" />
            <CardTitle>UGC Avatar Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Auto-magically generate and save viral hooks for your videos</p>
          </CardContent>
          <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            Not Available Yet
          </div>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 mb-2 text-amber-500" />
            <CardTitle>Hook Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Auto-magically generate and save viral hooks for your videos</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

