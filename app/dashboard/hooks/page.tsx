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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Label, Textarea } from "@/components/ui/dialog"
import { UpgradeModal } from '@/components/upgrade-modal'

type App = {
  id: string
  app_name: string
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const user = useUser()
  const { isSubscribed, contentRemaining } = useSubscription(user)

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

  const handleSaveEdit = async (hookText: string) => {
    if (!selectedHook) return

    try {
      const result = await updateHook(selectedHook.id, hookText)
      if (result.error) {
        throw new Error(result.error)
      }

      setHooks(hooks => hooks.map(hook => 
        hook.id === selectedHook.id ? { ...hook, hook_text: hookText } : hook
      ))

      setIsEditing(false)
      setSelectedHook(null)

      toast({
        title: "Hook updated",
        description: "The hook has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating hook:', error)
      toast({
        title: "Error updating hook",
        description: error instanceof Error ? error.message : "Please try again later",
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
      <div className="container mx-auto py-8">
        <SubscriptionGuard>
          <div className="space-y-8">
            {/* Generate Hooks Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Hooks</h2>
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
