'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Check, DollarSign, Clock, Zap } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function Alternatives() {
  return (
    <section className="max-w-6xl mx-auto mb-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 inline-block">Don't waste another dollar on a failed influencer campaign</h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Choose the smarter way to create content that drives app downloads
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="relative h-full overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-500 hover:translate-y-[-5px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/10" />
          <div className="absolute top-0 left-0 w-[120%] h-1 bg-gradient-to-r from-red-400 to-red-600" />
          
          <CardHeader className="relative pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-2">
                    <DollarSign className="h-4 w-4 text-red-500" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">UGC Agencies</CardTitle>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Easily thousands of dollars a month with no guarantee of success.</p>
            
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-start">
                <X className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">High monthly costs</span>
              </div>
              <div className="flex items-start">
                <X className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Lengthy contracts</span>
              </div>
              <div className="flex items-start">
                <X className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Unreliable results</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative h-full overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-500 hover:translate-y-[-5px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10" />
          <div className="absolute top-0 left-0 w-[120%] h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          
          <CardHeader className="relative pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Doing it yourself</CardTitle>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <X className="h-4 w-4 text-orange-500" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">You built an app but marketing is a whole different skillset. It can take years to start getting views.</p>
            
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-start">
                <X className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Steep learning curve</span>
              </div>
              <div className="flex items-start">
                <X className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Time-consuming process</span>
              </div>
              <div className="flex items-start">
                <X className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Inconsistent quality</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative h-full overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-500 hover:translate-y-[-5px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/10" />
          <div className="absolute top-0 left-0 w-[120%] h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
          
          <CardHeader className="relative pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Views to Downloads</CardTitle>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Check className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Automatically create high quality content that drives downloads so you can focus on your app</p>
            
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-start">
                <Check className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">AI-generated UGC in seconds</span>
              </div>
              <div className="flex items-start">
                <Check className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Fraction of the cost</span>
              </div>
              <div className="flex items-start">
                <Check className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Proven conversion formats</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
