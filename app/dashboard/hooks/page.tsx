'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { AppSelect } from "@/components/app-select"
import { HookItem } from "@/components/HookItem"
import { getApps, generateHooks, getHooks, deleteHook, updateHook } from "../actions"
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
import Link from 'next/link'

type App = {
  id: string
  app_name: string
  app_logo_url: string
}

type Hook = {
  id: string
  hook_text: string
  app_id: string
  app_name?: string
  app_logo_url?: string
}

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAppPicker, setShowAppPicker] = useState(false)
  const [selectedAppForGeneration, setSelectedAppForGeneration] = useState<string>('')
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const user = useUser()
  const { isSubscribed, contentRemaining } = useSubscription(user)

  useEffect(() => {
    const fetchApps = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('apps')
        .select('id, app_name, app_logo_url')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching apps:', error)
        toast({
          title: "Error fetching apps",
          description: "Please try again later",
          variant: "destructive"
        })
      } else if (data) {
        setApps(data)
      }
    }
    fetchApps()
  }, [supabase])

  useEffect(() => {
    const loadHooks = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        const { data: hooks, error } = await supabase
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

        const processedHooks = hooks.map(hook => ({
          id: hook.id,
          hook_text: hook.hook_text,
          app_id: hook.app_id,
          app_name: hook.apps?.app_name,
          app_logo_url: hook.apps?.app_logo_url
        }))

        setHooks(processedHooks)
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
  }, [supabase])

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

  const handleGenerateHooks = async (appId: string) => {
    if (contentRemaining <= 0) {
      setShowUpgradeModal(true)
      return
    }

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

      const { data: hooks, error } = await supabase
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

      const processedHooks = hooks.map(hook => ({
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
    } catch (error) {
      console.error('Error updating hook:', error)
      toast({
        title: "Error updating hook",
        description: error.message,
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
              <h2 className="text-lg font-semibold">Hooks</h2>
              <ContentLimitGuard>
                <Button
                  onClick={() => {
                    if (apps.length === 0) {
                      toast({
                        title: "No apps found",
                        description: "Please add an app first before generating hooks",
                        variant: "destructive"
                      })
                    } else {
                      setShowAppPicker(true)
                    }
                  }}
                  disabled={isGenerating}
                  className="btn-gradient"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    "Generate More Hooks"
                  )}
                </Button>
              </ContentLimitGuard>
            </div>

            {/* Hooks List */}
            <div className="space-y-2">
              {hooks.map((hook) => (
                <HookItem
                  key={hook.id}
                  hook={hook}
                  onDelete={handleDeleteHook}
                  onEdit={handleEditHook}
                />
              ))}
            </div>

            {/* App Picker Modal */}
            <Dialog open={showAppPicker} onOpenChange={setShowAppPicker}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Select App for Hook Generation</DialogTitle>
                  <DialogDescription>
                    Choose which app you want to generate hooks for.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppForGeneration(app.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedAppForGeneration === app.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {app.app_logo_url ? (
                            <div className="h-12 w-12 relative rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={app.app_logo_url}
                                alt={app.app_name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-muted-foreground text-xl">?</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">
                              {app.app_name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      "Generate Hooks"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Hook</DialogTitle>
                  <DialogDescription>
                    Make changes to your hook below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hookText">Hook Text</Label>
                    <Textarea
                      id="hookText"
                      defaultValue={selectedHook?.hook_text}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => selectedHook && handleSaveEdit(selectedHook.hook_text)}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Upgrade Modal */}
            <UpgradeModal 
              open={showUpgradeModal} 
              onOpenChange={setShowUpgradeModal}
            />
          </div>
        </SubscriptionGuard>
      </div>
    </div>
  )
}
