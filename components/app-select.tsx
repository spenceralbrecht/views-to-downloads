import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Image as ImageIcon } from 'lucide-react'
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
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    )
  }

  if (!apps || apps.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <p className="text-muted-foreground font-medium mb-2">Add your first app</p>
        <p className="text-sm text-muted-foreground/80">Create an app to get started with generating content</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <Card
          key={app.id}
          onClick={() => onSelect(app.id)}
          className={`p-4 cursor-pointer transition-all duration-200 min-h-[100px] min-w-[200px] ${
            selectedAppId === app.id 
              ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
              : 'hover:bg-primary/5 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            {app.app_logo_url ? (
              <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <Image
                  src={app.app_logo_url}
                  alt={app.app_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{app.app_name}</h3>
              <p className="text-sm text-muted-foreground truncate">Added {new Date(app.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
