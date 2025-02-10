'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, Home, Video, Zap, Activity, HelpCircle, CreditCard, Settings, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ImageIcon, User as UserIcon } from "lucide-react"
import { stripeConfig } from '@/config/stripe'
import { useSubscription, CONTENT_LIMITS } from '@/hooks/useSubscription'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { subscription, isSubscribed, plan, contentUsed, contentRemaining, contentLimit, loading } = useSubscription(user)
  
  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Videos', href: '/dashboard/videos', icon: Video },
    { name: 'Hooks', href: '/dashboard/hooks', icon: Zap },
    { name: 'Apps', href: '/dashboard/apps', icon: Activity },
  ]

  const bottomNav = [
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
    { 
      name: 'Billing', 
      href: stripeConfig.customerBillingLink || '/dashboard/billing', 
      icon: CreditCard,
      external: true 
    },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  // Calculate progress percentage
  const progressPercentage = (contentUsed / contentLimit) * 100

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-gray-50/50">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Download className="h-6 w-6 text-[#4287f5]" />
          <span className="font-semibold">Views to Downloads</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <div className="px-4 mb-4">
          <Button className="w-full bg-[#4287f5]" asChild>
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
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-gray-500' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Subscription Usage */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Content Usage</span>
              <span className="font-medium">
                {contentUsed} / {contentLimit}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="capitalize">
                {plan || 'No Plan'}
              </Badge>
              <span className="text-xs text-gray-500">
                {contentRemaining} remaining
              </span>
            </div>
            {subscription?.content_reset_date && (
              <div className="text-xs text-gray-500 text-right">
                Resets {new Date(subscription.content_reset_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mt-8">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{contentRemaining} videos remaining</span>
              {subscription?.current_period_end && (
                <span className="text-gray-500">
                  Resets {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              )}
            </div>
            <Progress value={progressPercentage} className="h-1" />
          </div>
        </div>
      </div>

      <div className="border-t">
        <nav className="space-y-1 px-2 py-4">
          {bottomNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t">
          {!loading && (
            <div className="mb-4">
              <Badge variant={isSubscribed ? "default" : "secondary"} className="w-full justify-center py-1">
                {isSubscribed ? `${plan?.toUpperCase()} Plan` : 'Free Plan'}
              </Badge>
            </div>
          )}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              <button
                onClick={() => signOut()}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
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
