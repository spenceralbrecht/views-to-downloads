'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, Home, Video, Zap, Activity, HelpCircle, CreditCard, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ImageIcon, User as UserIcon, Sparkles } from "lucide-react"

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  
  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Videos', href: '/dashboard/videos', icon: Video },
    { name: 'Hooks', href: '/dashboard/hooks', icon: Zap },
    { name: 'Apps', href: '/dashboard/apps', icon: Activity },
  ]

  const bottomNav = [
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

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
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-gray-500' : 'text-gray-400'
                }`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 mt-8">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">49 videos remaining</span>
              <span className="text-gray-500">Resets in 25 days</span>
            </div>
            <Progress value={33} className="h-1" />
          </div>
        </div>
      </div>

      <div className="border-t">
        <nav className="space-y-1 px-2 py-4">
          {bottomNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          {user ? (
            <div className="text-xs text-gray-500">
              <div className="font-medium">
                {user?.user_metadata?.name ?? user.email}
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="mt-2 text-blue-500 hover:text-blue-600"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Not signed in</div>
          )}
        </div>
      </div>
    </div>
  )
}

