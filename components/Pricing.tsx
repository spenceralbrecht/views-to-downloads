'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Camera, Sparkles } from 'lucide-react'

export default function Pricing() {
  return (
    <section id="pricing" className="max-w-5xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Choose your plan</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            name: "Starter",
            price: "19",
            videos: "10",
            popular: false,
            features: [
              { text: "10 videos per month", icon: Video, enabled: true },
              { text: "5 UGC avatars", icon: Camera, enabled: true },
              { text: "Generate unlimited viral hooks", icon: Sparkles, enabled: true },
            ],
          },
          {
            name: "Growth",
            price: "49",
            videos: "50",
            popular: true,
            features: [
              { text: "50 videos per month", icon: Video, enabled: true },
              { text: "All 50+ UGC avatars", icon: Camera, enabled: true },
              { text: "Generate unlimited viral hooks", icon: Sparkles, enabled: true },
            ],
          },
          {
            name: "Scale",
            price: "95",
            videos: "150",
            popular: false,
            features: [
              { text: "150 videos per month", icon: Video, enabled: true },
              { text: "All 50+ UGC avatars", icon: Camera, enabled: true },
              { text: "Generate unlimited viral hooks", icon: Sparkles, enabled: true },
            ],
          },
        ].map((plan) => (
          <div key={plan.name} className="relative">
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#4287f5] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <Card className={`h-full ${plan.popular ? 'border-[#4287f5] border-2' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl text-center">{plan.name}</CardTitle>
                <div className="text-center">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="text-center text-gray-600 mt-2">
                  {plan.videos} videos per month
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-px bg-gray-200 my-4" />
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <feature.icon className={`h-5 w-5 ${feature.enabled ? 'text-gray-900' : 'text-gray-400'}`} />
                    <span className={feature.enabled ? 'text-gray-900' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
                <Button 
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'bg-[#4287f5] hover:bg-[#3276e4] text-white' 
                      : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}

