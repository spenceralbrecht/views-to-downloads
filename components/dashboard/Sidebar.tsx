'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, Home, Video, Smartphone, Activity, HelpCircle, CreditCard, Settings, Sparkles, BookOpen, Anchor, Menu, Plug, Phone } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { trackStripeCheckout } from '@/utils/tracking'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import PremiumSupportDialog from '@/components/PremiumSupportDialog'

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { subscription, loading } = useSubscription(user)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [showPremiumSupportDialog, setShowPremiumSupportDialog] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const planName = subscription?.plan_name || 'starter'
  const contentUsed = subscription ? subscription.content_used_this_month : 0
  const contentLimit = subscription ? CONTENT_LIMITS[subscription.plan_name] : CONTENT_LIMITS['starter']
  const contentRemaining = subscription ? Math.max(0, contentLimit - contentUsed) : 0
  const supabase = createClientComponentClient()
  
  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Videos', href: '/dashboard/videos', icon: Video },
    { name: 'Hooks', href: '/dashboard/hooks', icon: Anchor },
    { name: 'Apps', href: '/dashboard/apps', icon: Smartphone },
    { name: 'Influencers', href: '/dashboard/influencers', icon: UserIcon },
    { name: 'Guide', href: '/dashboard/guide', icon: BookOpen },
    { name: 'Connected Accounts', href: '/dashboard/connected-accounts', icon: Plug },
  ]

  const bottomNav = [
    { 
      name: 'Support', 
      href: '#',
      icon: HelpCircle,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        // Call the Feedback Fish API directly
        if (typeof window !== 'undefined' && (window as any).feedback && (window as any).feedback.fish) {
          (window as any).feedback.fish.api.showWidget()
        }
      }
    },
    // Add Premium Support option only for users with an active subscription
    ...(subscription && subscription.plan_name !== 'starter' ? [
      {
        name: 'Premium Support',
        href: '#',
        icon: Phone,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          setShowPremiumSupportDialog(true)
        }
      }
    ] : []),
    { 
      name: 'Billing', 
      href: getStripeConfig(user?.email).customerBillingLink || '/dashboard/billing', 
      icon: CreditCard,
      external: true 
    },
  ]

  // Calculate progress percentage
  const progressPercentage = (contentUsed / contentLimit) * 100

  const handleUpgradeClick = async (closeMobileMenu = false) => {
    // Just open the pricing modal without tracking yet
    if (closeMobileMenu) {
      setIsMobileMenuOpen(false);
    }
    setShowPricingModal(true);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-border bg-card">
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
                        onClick={() => handleUpgradeClick(true)}
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
                    onClick={() => handleUpgradeClick(true)}
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
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50">
        <nav className="flex justify-around items-center h-16">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mb-1 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            <Menu className="h-5 w-5 mb-1" />
            More
          </button>
        </nav>
      </div>

      {/* Mobile Menu Dialog */}
      <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {!loading && (
              <div className="mb-6">
                {subscription ? (
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Content Usage</span>
                      <span className="text-sm font-medium text-primary">
                        {contentUsed}/{contentLimit}
                      </span>
                    </div>
                    <Progress 
                      value={(contentUsed / contentLimit) * 100} 
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
                  </div>
                ) : (
                  <Button 
                    className="w-full btn-gradient" 
                    size="sm"
                    onClick={() => handleUpgradeClick(true)}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Additional navigation items for mobile menu */}
              {navigation.slice(5).map((item) => (
                <Link 
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                  {item.name}
                </Link>
              ))}
              
              {bottomNav.map((item) => {
                const linkProps = {
                  href: item.href,
                  ...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
                  ...(item.onClick ? { onClick: item.onClick } : {}),
                  ...(item.name === 'Support' ? {
                    'data-feedback-fish': true,
                    'data-feedback-fish-userid': user?.email,
                  } : {}),
                  className: "flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent"
                }
                return (
                  <Link key={item.name} {...linkProps}>
                    <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                    {item.name}
                  </Link>
                )
              })}
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-center px-3 py-2">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
      
      <PremiumSupportDialog
        isOpen={showPremiumSupportDialog}
        onClose={() => setShowPremiumSupportDialog(false)}
      />
    </>
  )
}
