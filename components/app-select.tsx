import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

interface App {
  id: string
  app_store_url: string
  created_at: string
}

interface AppSelectProps {
  selectedAppId: string | null
  onSelect: (appId: string) => void
}

export function AppSelect({ selectedAppId, onSelect }: AppSelectProps) {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchApps() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching apps:', error)
      } else if (data) {
        setApps(data)
      }
      setLoading(false)
    }
    fetchApps()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <p className="text-gray-500 text-center">No apps found. Please add an app first.</p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {apps.map((app) => (
        <Card
          key={app.id}
          onClick={() => onSelect(app.id)}
          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedAppId === app.id ? 'border-2 border-blue-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{app.app_store_url}</p>
              <p className="text-sm text-gray-500">
                {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
