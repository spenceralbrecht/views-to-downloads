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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Dashboard</h1>
        
        <OnboardingChecklist 
          hasSubscription={hasSubscription}
          hasApp={hasApp}
          hasDemoVideo={hasDemoVideo}
          hasHooks={hasHooks}
          billingUrl={billingUrl}
        />

        <Separator className="my-8" />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/dashboard/create" onClick={handleCreateUGCClick} className="cursor-pointer">
            <Card className="bg-card border-border hover:bg-accent/50 transition-colors">
              <CardHeader>
                <Video className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-foreground">UGC Hook & Demo Format</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Create UGC content that get downloads for your app</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="relative bg-card border-border">
            <CardHeader>
              <ImageIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-foreground">Other viral formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">More viral formats coming soon!</p>
            </CardContent>
            <div className="absolute top-4 right-4 px-3 py-1 bg-accent rounded-full text-sm text-muted-foreground">
              Not Available Yet
            </div>
          </Card>
          <Card className="relative bg-card border-border">
            <CardHeader>
              <User className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-foreground">UGC Avatar Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Automatically create UGC demo videos</p>
            </CardContent>
            <div className="absolute top-4 right-4 px-3 py-1 bg-accent rounded-full text-sm text-muted-foreground">
              Not Available Yet
            </div>
          </Card>
          <Link href="/dashboard/hooks" className="cursor-pointer">
            <Card className="bg-card border-border hover:bg-accent/50 transition-colors">
              <CardHeader>
                <Sparkles className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-foreground">Hook Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Automatically generate and save viral hooks for your apps</p>
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
