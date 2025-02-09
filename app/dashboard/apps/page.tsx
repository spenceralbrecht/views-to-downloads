'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AddAppModal } from "@/components/AddAppModal"
import { AppDetailsModal } from "@/components/AppDetailsModal"
import { AppCard } from "@/components/AppCard"
import { AppCardSkeleton } from "@/components/AppCardSkeleton"
import { addApp, getApps, deleteApp } from "../actions"
import { useToast } from "@/components/ui/use-toast"

type App = {
  id: string
  app_name: string
  app_logo_url: string
  app_store_url: string
  app_description: string
}

export default function AppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingApp, setIsAddingApp] = useState(false)
  const [isDeletingApp, setIsDeletingApp] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadApps = async () => {
      const { data, error } = await getApps()
      if (error) {
        toast({
          title: "Error loading apps",
          description: error,
          variant: "destructive",
        })
      } else if (data) {
        setApps(data)
      }
      setIsLoading(false)
    }
    loadApps()
  }, [toast])

  const handleAddApp = async (url: string) => {
    setIsAddingApp(true)
    const result = await addApp(url)
    
    if (result.error) {
      toast({
        title: "Error adding app",
        description: result.error,
        variant: "destructive",
      })
    } else if (result.success) {
      // Refresh the apps list
      const { data } = await getApps()
      if (data) {
        setApps(data)
      }
      setIsModalOpen(false)
      toast({
        title: "App added",
        description: "The app has been added successfully.",
      })
    }
    setIsAddingApp(false)
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Your Apps</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add New App
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Show 3 skeleton cards while loading
          Array.from({ length: 3 }).map((_, i) => (
            <AppCardSkeleton key={i} />
          ))
        ) : apps.length > 0 ? (
          <>
            {apps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                onClick={() => setSelectedApp(app)}
              />
            ))}
            {isAddingApp && <AppCardSkeleton />}
          </>
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No apps yet. Click "Add New App" to get started.</p>
          </div>
        )}
      </div>

      <AddAppModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddApp={handleAddApp}
        isLoading={isAddingApp}
      />

      <AppDetailsModal
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        app={selectedApp}
        onDelete={() => handleDeleteApp(selectedApp?.id)}
        isDeleting={isDeletingApp}
      />
    </div>
  )
}