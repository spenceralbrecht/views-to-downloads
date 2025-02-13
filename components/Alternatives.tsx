'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Check } from 'lucide-react'

export default function Alternatives() {
  return (
    <section className="max-w-5xl mx-auto mb-24">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Alternatives are expensive.</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-bold text-red-800 dark:text-red-300">UGC Agencies</CardTitle>
              <X className="h-6 w-6 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-400 leading-relaxed">Expensive, $60-120 per video, anywhere between $4000 to $6000 a month.</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-bold text-red-800 dark:text-red-300">Doing it yourself</CardTitle>
              <X className="h-6 w-6 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-400 leading-relaxed">Researching, planning, iterating, recording, editing, publishing, re-purposing</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-bold text-green-800 dark:text-green-300">Views to Downloads</CardTitle>
              <Check className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-400 leading-relaxed">Automatically creating & publishing videos to all platforms, for a monthly subscription</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
