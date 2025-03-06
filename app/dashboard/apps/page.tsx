'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { AddAppModal } from "@/components/AddAppModal"
import { AppDetailsModal } from "@/components/AppDetailsModal"
import { AppCard } from "@/components/AppCard"
import { AppCardSkeleton } from "@/components/AppCardSkeleton"
import { addApp, getApps, deleteApp } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'
import { PostgrestError } from '@supabase/supabase-js'

type App = {
  id: string
  app_name: string
  app_logo_url: string
  app_store_url: string
  app_description: string
}

// Loading stages for app addition process
type LoadingStage = "fetching" | "extracting" | "analyzing" | "understanding" | undefined;

export default function AppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingApp, setIsAddingApp] = useState(false)
  const [isDeletingApp, setIsDeletingApp] = useState(false)
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(undefined)
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const loadApps = async () => {
      const { data, error } = await getApps()
      if (error) {
        toast({
          title: "Error loading apps",
          description: error instanceof PostgrestError ? error.message : String(error),
          variant: "destructive",
        })
      } else if (data) {
        setApps(data)
      }
      setIsLoading(false)
    }
    loadApps()
  }, [toast])

  const handleAddApp = async (appStoreUrl: string) => {
    setIsAddingApp(true)
    
    // Start with fetching stage
    setLoadingStage("fetching")
    
    try {
      // Distribute stages across the 60-second average process time
      // First stage (fetching) starts immediately
      // Then transition through the other stages
      setTimeout(() => setLoadingStage("extracting"), 5000)    // After 5 seconds
      setTimeout(() => setLoadingStage("analyzing"), 20000)    // After 20 seconds
      setTimeout(() => setLoadingStage("understanding"), 40000) // After 40 seconds
      
      const result = await addApp(appStoreUrl)
      
      if (result.success) {
        // Refresh the apps list
        const { data: newApps, error: refreshError } = await getApps()
        if (!refreshError && newApps) {
          setApps(newApps)
        }
      }
      
      return result
    } finally {
      // Keep showing skeleton for a moment to ensure smooth transition
      setTimeout(() => {
        setIsAddingApp(false)
        setLoadingStage(undefined)
      }, 500)
    }
  }

  const handleDeleteApp = async (appId: string) => {
    if (!appId) return

    setIsDeletingApp(true)
    const result = await deleteApp(appId)
    
    if (result.error) {
      toast({
        title: "Error deleting app",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setApps(prev => prev.filter(a => a.id !== appId))
      setSelectedApp(null)
      toast({
        title: "App deleted",
        description: "The app has been deleted successfully.",
      })
    }
    setIsDeletingApp(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Your Apps</h1>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="btn-gradient"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add New App
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {isLoading ? (
            // Show 3 skeleton cards while loading
            Array.from({ length: 3 }).map((_, i) => (
              <AppCardSkeleton key={i} />
            ))
          ) : (
            <>
              {/* Show skeleton card first while adding */}
              {isAddingApp && <AppCardSkeleton loadingStage={loadingStage} />}
              
              {/* Existing app cards */}
              {apps.map(app => (
                <AppCard
                  key={app.id}
                  app={app}
                  onClick={() => setSelectedApp(app)}
                />
              ))}
            </>
          )}

          {!isLoading && apps.length === 0 && !isAddingApp && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No apps yet. Click "Add New App" to get started.</p>
            </div>
          )}
        </div>

        <AddAppModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onAddApp={handleAddApp}
          isPending={isPending || isAddingApp}
        />

        <AppDetailsModal
          open={!!selectedApp}
          onOpenChange={(open) => !open && setSelectedApp(null)}
          app={selectedApp}
          onDelete={() => selectedApp?.id && handleDeleteApp(selectedApp.id)}
          isDeleting={isDeletingApp}
        />
      </div>
    </div>
  )
}