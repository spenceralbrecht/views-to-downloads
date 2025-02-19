'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { AppSelect } from "@/components/app-select"
import { HookItem } from "@/components/HookItem"
import { generateHooks, deleteHook } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from '@supabase/auth-helpers-react'
import { useSubscription } from '@/hooks/useSubscription'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { ContentLimitGuard } from '@/components/ContentLimitGuard'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UpgradeModal } from '@/components/upgrade-modal'
import { HookItemSkeleton } from '@/components/HookItemSkeleton'
import Link from 'next/link'

type App = {
  id: string
  app_name: string
  app_logo_url: string
  created_at: string
  app_store_url: string
}

type Hook = {
  id: string
  hook_text: string
  app_id: string
  app_name?: string
  app_logo_url?: string
}

interface RawDatabaseHook {
  id: string
  hook_text: string
  app_id: string
  apps: {
    app_name: string
    app_logo_url: string
  } | null
}

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingApps, setLoadingApps] = useState(true)
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAppPicker, setShowAppPicker] = useState(false)
  const [selectedAppForGeneration, setSelectedAppForGeneration] = useState<string>('')
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const user = useUser()
  const { isSubscribed, contentRemaining, subscription } = useSubscription(user)

  useEffect(() => {
    const fetchApps = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('apps')
          .select('id, app_name, app_logo_url, created_at, app_store_url')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setApps(data as App[])
      } catch (error: any) {
        console.error('Error fetching apps:', error)
        toast({
          title: "Error fetching apps",
          description: error?.message || "Please try again later",
          variant: "destructive"
        })
      } finally {
        setLoadingApps(false)
      }
    }
    fetchApps()
  }, [supabase])

  useEffect(() => {
    const loadHooks = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('hooks')
          .select(`
            id,
            hook_text,
            app_id,
            apps (
              app_name,
              app_logo_url
            )
          `)
          .eq('apps.owner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Cast to unknown first, then to our raw database type
        const rawData = (data as unknown) as RawDatabaseHook[]
        const processedHooks = rawData.map(hook => ({
          id: hook.id,
          hook_text: hook.hook_text,
          app_id: hook.app_id,
          app_name: hook.apps?.app_name,
          app_logo_url: hook.apps?.app_logo_url
        }))

        setHooks(processedHooks)
      } catch (error: any) {
        console.error('Error fetching hooks:', error)
        toast({
          title: "Error fetching hooks",
          description: error?.message || "Please try again later",
          variant: "destructive"
        })
      }
    }
    loadHooks()
  }, [supabase])

  const handleDeleteHook = async (id: string) => {
    try {
      const result = await deleteHook(id)
      if (!result.success) {
        throw new Error(result.error)
      }

      // Only update UI if delete was successful
      setHooks(hooks => hooks.filter(hook => hook.id !== id))
      toast({
        title: "Hook deleted",
        description: "The hook has been deleted successfully.",
      })
    } catch (error: any) {
      console.error('Error deleting hook:', error)
      toast({
        title: "Error deleting hook",
        description: error?.message || "Failed to delete hook. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleGenerateHooks = async (appId: string) => {
    setIsGenerating(true)
    setShowAppPicker(false)

    try {
      const result = await generateHooks(appId)
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh hooks list
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('hooks')
        .select(`
          id,
          hook_text,
          app_id,
          apps (
            app_name,
            app_logo_url
          )
        `)
        .eq('apps.owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Cast to unknown first, then to our raw database type
      const rawData = (data as unknown) as RawDatabaseHook[]
      const processedHooks = rawData.map(hook => ({
        id: hook.id,
        hook_text: hook.hook_text,
        app_id: hook.app_id,
        app_name: hook.apps?.app_name,
        app_logo_url: hook.apps?.app_logo_url
      }))

      setHooks(processedHooks)

      toast({
        title: "Hooks generated",
        description: "New hooks have been generated for your app"
      })
    } catch (error: any) {
      console.error('Error generating hooks:', error)
      toast({
        title: "Error generating hooks",
        description: error?.message || "Failed to generate hooks",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditHook = (hook: Hook) => {
    setSelectedHook(hook)
    setIsEditing(true)
  }

  const handleSaveEdit = async (newText: string) => {
    if (!selectedHook) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('hooks')
        .update({ hook_text: newText })
        .eq('id', selectedHook.id)
        .select()

      if (error) throw error

      setHooks(hooks => hooks.map(hook => 
        hook.id === selectedHook.id ? { ...hook, hook_text: newText } : hook
      ))

      setIsEditing(false)
      setSelectedHook(null)

      toast({
        title: "Hook updated",
        description: "The hook has been updated successfully."
      })
    } catch (error: any) {
      console.error('Error updating hook:', error)
      toast({
        title: "Error updating hook",
        description: error?.message || "An error occurred while updating the hook",
        variant: "destructive"
      })
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSelectedHook(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <SubscriptionGuard>
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header with Generate Button */}
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Hooks</h1>
              <ContentLimitGuard>
                <Button
                  className="btn-gradient"
                  onClick={() => setShowAppPicker(true)}
                  disabled={isGenerating || apps.length === 0}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    'Generate Hooks'
                  )}
                </Button>
              </ContentLimitGuard>
            </div>

            {/* App Selection Dialog */}
            <Dialog open={showAppPicker} onOpenChange={setShowAppPicker}>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Select App</DialogTitle>
                  <DialogDescription>
                    Choose an app to generate hooks for
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <AppSelect
                    apps={apps}
                    selectedAppId={selectedAppForGeneration}
                    onSelect={setSelectedAppForGeneration}
                    loadingApps={loadingApps}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAppPicker(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleGenerateHooks(selectedAppForGeneration)}
                    disabled={!selectedAppForGeneration || isGenerating}
                    className="btn-gradient"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Hooks List */}
            <div className="grid gap-4">
              {/* Show skeleton cards at the top while generating */}
              {isGenerating && (
                Array.from({ length: 10 }).map((_, index) => (
                  <HookItemSkeleton key={`skeleton-${index}`} />
                ))
              )}
              
              {/* Show existing hooks */}
              {hooks.length > 0 ? (
                hooks.map((hook) => (
                  <HookItem
                    key={hook.id}
                    hook={hook}
                    onDelete={() => handleDeleteHook(hook.id)}
                    onEdit={() => handleEditHook(hook)}
                  />
                ))
              ) : !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  No hooks generated yet. Click &quot;Generate Hooks&quot; to get started, but make sure you have added an app first!
                </div>
              )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Hook</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hook">Hook Text</Label>
                    <Textarea
                      id="hook"
                      defaultValue={selectedHook?.hook_text}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const textarea = document.querySelector('textarea')
                      if (textarea) {
                        handleSaveEdit(textarea.value)
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <UpgradeModal
              open={showUpgradeModal}
              onOpenChange={setShowUpgradeModal}
              subscription={subscription}
              loading={false}
            />
          </div>
        </SubscriptionGuard>
      </div>
    </div>
  )
}
