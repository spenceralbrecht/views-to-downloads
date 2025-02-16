'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, Home, Video, Smartphone, Activity, HelpCircle, CreditCard, Settings, Sparkles, BookOpen, Anchor } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ImageIcon, User as UserIcon } from "lucide-react"
import { getStripeConfig } from '@/config/stripe'
import { useSubscription, CONTENT_LIMITS } from '@/hooks/useSubscription'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import PricingModal from '@/components/PricingModal'

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { subscription, loading } = useSubscription(user)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const planName = subscription?.plan_name || 'starter'
  const contentUsed = subscription ? subscription.content_used_this_month : 0
  const contentLimit = subscription ? CONTENT_LIMITS[subscription.plan_name] : CONTENT_LIMITS['starter']
  const contentRemaining = subscription ? Math.max(0, contentLimit - contentUsed) : 0
  
  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Videos', href: '/dashboard/videos', icon: Video },
    { name: 'Hooks', href: '/dashboard/hooks', icon: Anchor },
    { name: 'Apps', href: '/dashboard/apps', icon: Smartphone },
    { name: 'Guide to Virality', href: '/dashboard/guide', icon: BookOpen },
  ]

  const bottomNav = [
    { 
      name: 'Support', 
      href: '#',
      icon: HelpCircle,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        // The widget will be triggered by the data-feedback-fish attribute
      }
    },
    { 
      name: 'Billing', 
      href: getStripeConfig().customerBillingLink || '/dashboard/billing', 
      icon: CreditCard,
      external: true 
    },
  ]

  // Calculate progress percentage
  const progressPercentage = (contentUsed / contentLimit) * 100

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Download className="h-6 w-6 text-primary" />
          <span className="font-semibold gradient-text">Views to Downloads</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <div className="px-4 mb-4">
          <Button 
            className="w-full btn-gradient" 
            asChild
          >
            <Link href="/dashboard/create">
              + Create Content
            </Link>
          </Button>
        </div>

        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {!loading && (
          <div className="px-4 mt-6">
            {subscription ? (
              <>
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Content Usage</span>
                    <span className="text-sm font-medium text-primary">
                      {contentUsed}/{contentLimit}
                    </span>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className="bg-background"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {(planName.charAt(0).toUpperCase() + planName.slice(1)) + ' Plan'}
                    </span>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                      Active
                    </Badge>
                  </div>
                  {contentUsed >= contentLimit && planName !== 'scale' && (
                    <Button 
                      className="w-full btn-gradient mt-3" 
                      size="sm"
                      onClick={() => setShowPricingModal(true)}
                    >
                      Upgrade for More
                    </Button>
                  )}
                </div>
                <PricingModal 
                  isOpen={showPricingModal} 
                  onClose={() => setShowPricingModal(false)} 
                />
              </>
            ) : (
              <>
                <Button 
                  className="w-full btn-gradient" 
                  size="sm"
                  onClick={() => setShowPricingModal(true)}
                >
                  Upgrade
                </Button>
                <PricingModal 
                  isOpen={showPricingModal} 
                  onClose={() => setShowPricingModal(false)} 
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card">
        <nav className="space-y-1 px-2 py-4">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href
            const linkProps = {
              href: item.href,
              ...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
              ...(item.onClick ? { onClick: item.onClick } : {}),
              ...(item.name === 'Support' ? {
                'data-feedback-fish': true,
                'data-feedback-fish-userid': user?.email,
              } : {}),
              className: `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
            return (
              <Link key={item.name} {...linkProps}>
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <button
                onClick={() => signOut()}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
