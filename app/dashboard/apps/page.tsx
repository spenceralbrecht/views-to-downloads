'use client'

import { Button } from "@/components/ui/button"
import { useState, useTransition, useEffect } from 'react'
import { AddAppModal } from "@/components/AddAppModal"
import { addApp, getApps } from "../actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string|null>(null)
  const [apps, setApps] = useState<Array<any>>([])
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
      if (result.success) {
        // Refresh apps list after successful add
        const { data } = await getApps()
        if (data) setApps(data)
      } else {
        setError(result.error || 'Failed to add app')
      }
    })
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Connected Apps</h1>
      
      {apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {apps.map((app) => (
            <Card key={app.id} className="p-6 bg-white shadow-sm">
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
                <p className="text-gray-600 break-all">{app.app_store_url}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold">No apps connected yet</h2>
            <p className="text-gray-600">Connect your first app to start generating content</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm"
          >
            <span className="text-gray-600">+</span>
            <span>Connect New App</span>
          </Button>
        </div>
      )}

      {/* Keep error and modal at bottom */}
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
    </div>
  )
} 