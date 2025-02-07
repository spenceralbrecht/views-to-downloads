'use client'

import { Button } from "@/components/ui/button"
import { useState, useTransition, useEffect } from 'react'
import { AddAppModal } from "@/components/AddAppModal"
import { AppDetailsModal } from "@/components/AppDetailsModal"
import { LoadingAppCard } from "@/components/LoadingAppCard"
import { addApp, getApps, deleteApp } from "../actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type App = {
  id: string
  app_store_url: string
  app_description?: string
  created_at: string
}

export default function AppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [appToDelete, setAppToDelete] = useState<App | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string|null>(null)
  const [apps, setApps] = useState<App[]>([])
  const [loadingApps, setLoadingApps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initial load
  useEffect(() => {
    const loadApps = async () => {
      const { data, error } = await getApps()
      if (data) setApps(data)
      if (error) setError(error)
      setIsLoading(false)
    }
    loadApps()
  }, [])

  const handleAddApp = async (url: string) => {
    setError(null)
    startTransition(async () => {
      const result = await addApp(url)
      if (result.success && result.app) {
        setApps(prev => [...prev, result.app])
        setLoadingApps(prev => [...prev, result.app.id])
        setIsModalOpen(false)

        // Poll for updates to get the description
        const pollInterval = setInterval(async () => {
          const { data } = await getApps()
          if (data) {
            const updatedApp = data.find(app => app.id === result.app.id)
            if (updatedApp?.app_description) {
              setApps(prev => prev.map(app => 
                app.id === updatedApp.id ? updatedApp : app
              ))
              setLoadingApps(prev => prev.filter(id => id !== result.app.id))
              clearInterval(pollInterval)
            }
          }
        }, 2000)

        setTimeout(() => {
          clearInterval(pollInterval)
          setLoadingApps(prev => prev.filter(id => id !== result.app.id))
        }, 30000)
      } else {
        setError(result.error || 'Failed to add app')
      }
    })
  }

  const handleDeleteApp = async (app: App) => {
    startTransition(async () => {
      const result = await deleteApp(app.id)
      if (result.success) {
        setApps(prev => prev.filter(a => a.id !== app.id))
      } else {
        setError(result.error || 'Failed to delete app')
      }
      setAppToDelete(null)
    })
  }

  const handleCardClick = (app: App, e: React.MouseEvent) => {
    // Prevent opening details modal when clicking delete button
    if ((e.target as HTMLElement).closest('.delete-button')) {
      e.stopPropagation()
      setAppToDelete(app)
      return
    }
    setSelectedApp(app)
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Connected Apps</h1>
      
      <div className="w-full max-w-6xl mb-8">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm"
        >
          <span className="text-gray-600">+</span>
          <span>Connect New App</span>
        </Button>
      </div>

      {apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {apps.map((app) => 
            loadingApps.includes(app.id) ? (
              <LoadingAppCard key={app.id} />
            ) : (
              <Card 
                key={app.id} 
                className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={(e) => handleCardClick(app, e)}
              >
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {new URL(app.app_store_url).hostname}
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-gray-600 break-all mb-4">{app.app_store_url}</p>
                  <div className="absolute bottom-6 right-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="delete-button h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAppToDelete(app)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold">No apps connected yet</h2>
            <p className="text-gray-600">Connect your first app to start generating content</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 text-red-500 text-sm">
          Error: {error}
        </div>
      )}

      <AddAppModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddApp={handleAddApp}
        isPending={isPending}
      />

      <AppDetailsModal
        open={selectedApp !== null}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        app={selectedApp}
      />

      <AlertDialog open={appToDelete !== null} onOpenChange={(open) => !open && setAppToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the app and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => appToDelete && handleDeleteApp(appToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}