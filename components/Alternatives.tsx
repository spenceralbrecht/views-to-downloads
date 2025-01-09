'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Check } from 'lucide-react'

export default function Alternatives() {
  return (
    <section className="max-w-5xl mx-auto mb-24">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Alternatives are expensive.</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-red-50 border-red-100">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>UGC Agencies</CardTitle>
              <X className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Expensive, $60-120 per video, anywhere between $4000 to $6000 a month.</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Doing it yourself</CardTitle>
              <X className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Researching, planning, iterating, recording, editing, publishing, re-purposing</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Views to Downloads</CardTitle>
              <Check className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-600">Automatically creating & publishing videos to all platforms, for a monthly subscription</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

