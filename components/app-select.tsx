import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

interface App {
  id: string
  app_store_url: string
  app_name: string
  app_logo_url: string
  created_at: string
}

interface AppSelectProps {
  selectedAppId: string | null
  onSelect: (appId: string) => void
  apps: App[]
  loadingApps: boolean
}

export function AppSelect({ selectedAppId, onSelect, apps, loadingApps }: AppSelectProps) {
  const supabase = createClientComponentClient()

  if (loadingApps) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    )
  }

  if (!apps || apps.length === 0) {
    return (
      <p className="text-gray-500 text-center">No apps found. Please add an app first.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <Card
          key={app.id}
          onClick={() => onSelect(app.id)}
          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedAppId === app.id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            {app.app_logo_url ? (
              <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={app.app_logo_url}
                  alt={`${app.app_name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-2xl">?</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-base truncate">
                {app.app_name || new URL(app.app_store_url).hostname}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
