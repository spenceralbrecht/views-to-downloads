'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Camera, Sparkles, Check, Shield, Zap, Download } from 'lucide-react'
import { cn } from "@/lib/utils"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const plans = [
  {
    name: "Starter",
    price: { monthly: "15", annual: "16" },
    description: "Perfect for indie developers and startups",
    popular: false,
    features: [
      { text: "10 videos per month", icon: Video },
      { text: "Limited UGC avatars", icon: Camera },
      { text: "Generate unlimited viral hooks", icon: Sparkles },
      { text: "Email support", icon: Shield },
    ]
  },
  {
    name: "Growth",
    price: { monthly: "35", annual: "41" },
    description: "Perfect for growing app businesses",
    popular: true,
    features: [
      { text: "50 videos per month", icon: Video },
      { text: "All 50+ UGC avatars", icon: Camera },
      { text: "Generate unlimited viral hooks", icon: Sparkles },
      { text: "Priority support", icon: Shield },
      { text: "Performance analytics", icon: Download, comingSoon: true },
    ]
  },
  {
    name: "Scale",
    price: { monthly: "65", annual: "79" },
    description: "For professional app publishers",
    popular: false,
    features: [
      { text: "150 videos per month", icon: Video },
      { text: "All 50+ UGC avatars", icon: Camera },
      { text: "Generate unlimited viral hooks", icon: Sparkles },
      { text: "Dedicated support", icon: Shield },
      { text: "Performance analytics", icon: Download, comingSoon: true },
    ]
  }
]

export default function Pricing() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  // Always use monthly pricing by default and removed the toggle functionality
  const billingCycle = 'monthly'
  const supabase = createClientComponentClient()

  const handleGoogleSignIn = async (planName: string) => {
    try {
      setIsLoading(planName)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            plan: planName.toLowerCase(),
          }
        },
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <section id="pricing" className="max-w-6xl mx-auto mb-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 inline-block">Simple, Transparent Pricing</h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
          Choose the perfect plan for your app marketing needs
        </p>
        
        {/* Removed the billing toggle UI */}
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className="relative mt-6">
            {plan.popular && (
              <div className="absolute -top-6 inset-x-0 flex justify-center z-10">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-1.5 rounded-full text-sm font-medium shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            <Card 
              className={cn(
                "h-full transition-all duration-300 hover:shadow-xl border relative", 
                plan.popular 
                  ? "border-blue-500/50 shadow-lg dark:bg-gray-900/60 transform hover:scale-105" 
                  : "border-gray-200 dark:border-gray-800 dark:bg-gray-900/40 hover:border-blue-500/30"
              )}
            >
              <CardHeader className={cn("pb-4", plan.popular ? "pt-8" : "")}>
                <CardTitle className="text-2xl font-bold text-center">
                  {plan.name}
                </CardTitle>
                <div className="text-center mt-4 mb-2">
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold">${plan.price[billingCycle]}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">/mo</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{plan.description}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-px bg-gray-200 dark:bg-gray-800 my-4" />
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center", 
                        plan.popular ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                      )}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                        {feature.comingSoon && (
                          <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                            Coming soon
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => handleGoogleSignIn(plan.name)}
                  disabled={isLoading !== null}
                  variant={plan.popular ? "default" : "outline"}
                  className={cn(
                    "w-full py-6 rounded-lg text-base font-medium", 
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                      : "hover:bg-primary/10 border-gray-200 dark:border-gray-700"
                  )}
                >
                  {isLoading === plan.name ? "Connecting..." : plan.popular ? "Get Started Now" : "Start Today"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
        Need a custom plan? <a href="mailto:support@viewstodownloads.com" className="text-blue-600 dark:text-blue-400 hover:underline">Contact us</a> for enterprise pricing.
      </div>
    </section>
  )
}
