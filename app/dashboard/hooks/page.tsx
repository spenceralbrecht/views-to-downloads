'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AppSelect } from "@/components/app-select"
import { HookItem } from "@/components/HookItem"
import { getApps, generateHooks, getHooks, deleteHook } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from '@supabase/auth-helpers-react'
import { useSubscription } from '@/hooks/useSubscription'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { ContentLimitGuard } from '@/components/ContentLimitGuard'
import { Loader2 } from 'lucide-react'

type App = {
  id: string
  app_name: string
}

type Hook = {
  id: string
  hook_text: string
}

export default function HooksPage() {
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [apps, setApps] = useState<App[]>([])
  const [hooks, setHooks] = useState<Hook[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const user = useUser()
  const { isSubscribed } = useSubscription(user)

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const result = await getApps()
        if (result.error) {
          throw new Error(result.error)
        }
        setApps(result.data)
      } catch (error) {
        console.error('Error fetching apps:', error)
        toast({
          title: "Error fetching apps",
          description: "Please try again later",
          variant: "destructive"
        })
      }
    }

    fetchApps()
  }, [])

  useEffect(() => {
    const loadHooks = async () => {
      if (!selectedAppId) return
      try {
        const result = await getHooks(selectedAppId)
        if (result.error) {
          throw new Error(result.error)
        }
        setHooks(result.data)
      } catch (error) {
        console.error('Error fetching hooks:', error)
        toast({
          title: "Error fetching hooks",
          description: "Please try again later",
          variant: "destructive"
        })
      }
    }
    loadHooks()
  }, [selectedAppId])

  const handleDeleteHook = async (id: string) => {
    try {
      const result = await deleteHook(id)
      if (result.error) {
        throw new Error(result.error)
      }
      setHooks(hooks => hooks.filter(hook => hook.id !== id))
      toast({
        title: "Hook deleted",
        description: "The hook has been deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting hook:', error)
      toast({
        title: "Error deleting hook",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleGenerateHooks = async () => {
    if (!isSubscribed) {
      return
    }

    if (!selectedAppId) {
      toast({
        title: "Select an app",
        description: "Please select an app to generate hooks for",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateHooks(selectedAppId)
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh hooks list
      const hooksResult = await getHooks(selectedAppId)
      if (hooksResult.error) {
        throw new Error(hooksResult.error)
      }
      setHooks(hooksResult.data)

      toast({
        title: "Hooks generated",
        description: "New hooks have been generated for your app"
      })
    } catch (error) {
      console.error('Error generating hooks:', error)
      toast({
        title: "Error generating hooks",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Generate Hooks</h1>
        <div className="flex items-center gap-4">
          <AppSelect
            selectedAppId={selectedAppId}
            onSelect={setSelectedAppId}
          />
          <SubscriptionGuard>
            <ContentLimitGuard>
              <Button
                onClick={handleGenerateHooks}
                disabled={!selectedAppId || isGenerating}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </div>
                ) : (
                  "Generate Hooks"
                )}
              </Button>
            </ContentLimitGuard>
          </SubscriptionGuard>
        </div>
      </div>

      {hooks.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Generated Hooks</h2>
          <div className="space-y-2">
            {hooks.map((hook) => (
              <HookItem
                key={hook.id}
                id={hook.id}
                text={hook.hook_text}
                onDelete={() => handleDeleteHook(hook.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No hooks found. Generate some hooks to get started!</p>
        </div>
      )}
    </div>
  )
}
