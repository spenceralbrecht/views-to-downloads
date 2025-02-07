'use client'

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getApps } from "../actions"
import Link from "next/link"

type App = {
  id: string
  app_store_url: string
  app_description?: string
  created_at: string
}

export default function HooksPage() {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadApps = async () => {
      const { data } = await getApps()
      if (data) setApps(data)
      setIsLoading(false)
    }
    loadApps()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold mb-4">Hooks Manager</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold mb-4">Hooks Manager</h1>
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold">Oops! You need to add an app</h2>
          <p className="text-gray-600">You need to add an app to generate viral hooks</p>
        </div>
        <Link href="/dashboard/apps">
          <Button className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-gray-600">+</span>
            <span>Add new app</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Hooks Manager</h1>
      <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2">
        Generate New Hooks
      </Button>
    </div>
  )
}
