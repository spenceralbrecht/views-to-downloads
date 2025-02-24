'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Video, ImageIcon, User, Sparkles, Check, X } from "lucide-react"
import { OnboardingChecklist } from '@/components/onboarding-checklist'
import { getStripeConfig } from '@/config/stripe'
import { useState, useEffect } from 'react'
import { ViralFormatModal } from '@/components/ViralFormatModal'
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
  const [session, setSession] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [demoVideos, setDemoVideos] = useState<any[]>([])
  const [hooks, setHooks] = useState<any[]>([])
  const [isViralFormatModalOpen, setIsViralFormatModalOpen] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        redirect('/')
      }
      setSession(session)

      const [subscriptionData, appsData, demoVideosData, hooksData] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('apps')
          .select('*')
          .eq('owner_id', session.user.id),
        supabase
          .from('input_content')
          .select('*')
          .eq('user_id', session.user.id),
        supabase
          .from('hooks')
          .select('*')
          .eq('user_id', session.user.id)
      ])

      setSubscription(subscriptionData.data)
      setApps(appsData.data || [])
      setDemoVideos(demoVideosData.data || [])
      setHooks(hooksData.data || [])
    }

    fetchData()
  }, [supabase])

  const hasSubscription = !!subscription
  const hasApp = apps.length > 0
  const hasDemoVideo = demoVideos.length > 0
  const hasHooks = hooks.length > 0
  const billingUrl = getStripeConfig().customerBillingLink

  const handleCreateUGCClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsViralFormatModalOpen(true)
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-foreground">Dashboard</h1>
        
        <OnboardingChecklist 
          hasSubscription={hasSubscription}
          hasApp={hasApp}
          hasDemoVideo={hasDemoVideo}
          hasHooks={hasHooks}
          billingUrl={billingUrl}
        />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-8 mt-4">
          <Link href="/dashboard/create" onClick={handleCreateUGCClick} className="cursor-pointer">
            <Card className="bg-card border-border hover:bg-accent/50 transition-colors h-full">
              <CardHeader className="p-4 lg:p-6">
                <Video className="h-6 w-6 lg:h-8 lg:w-8 mb-2 text-primary" />
                <CardTitle className="text-lg lg:text-xl text-foreground">UGC Hook & Demo Format</CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                <p className="text-sm lg:text-base text-muted-foreground">Create UGC content that get downloads for your app</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="relative bg-card border-border h-full">
            <CardHeader className="p-4 lg:p-6">
              <ImageIcon className="h-6 w-6 lg:h-8 lg:w-8 mb-2 text-primary" />
              <CardTitle className="text-lg lg:text-xl text-foreground">Other viral formats</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0">
              <p className="text-sm lg:text-base text-muted-foreground">More viral formats coming soon!</p>
            </CardContent>
            <div className="absolute top-3 right-3 lg:top-4 lg:right-4 px-2 py-1 lg:px-3 lg:py-1 bg-accent rounded-full text-xs lg:text-sm text-muted-foreground">
              Not Available Yet
            </div>
          </Card>

          <Card className="relative bg-card border-border h-full">
            <CardHeader className="p-4 lg:p-6">
              <User className="h-6 w-6 lg:h-8 lg:w-8 mb-2 text-primary" />
              <CardTitle className="text-lg lg:text-xl text-foreground">UGC Avatar Generator</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0">
              <p className="text-sm lg:text-base text-muted-foreground">Automatically create UGC demo videos</p>
            </CardContent>
            <div className="absolute top-3 right-3 lg:top-4 lg:right-4 px-2 py-1 lg:px-3 lg:py-1 bg-accent rounded-full text-xs lg:text-sm text-muted-foreground">
              Not Available Yet
            </div>
          </Card>

          <Link href="/dashboard/hooks" className="cursor-pointer">
            <Card className="bg-card border-border hover:bg-accent/50 transition-colors h-full">
              <CardHeader className="p-4 lg:p-6">
                <Sparkles className="h-6 w-6 lg:h-8 lg:w-8 mb-2 text-primary" />
                <CardTitle className="text-lg lg:text-xl text-foreground">Hook Generator</CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                <p className="text-sm lg:text-base text-muted-foreground">Automatically generate and save viral hooks for your apps</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <ViralFormatModal
          open={isViralFormatModalOpen}
          onOpenChange={setIsViralFormatModalOpen}
        />
      </div>
    </div>
  )
}
