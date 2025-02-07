'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HookItem } from "@/components/HookItem"
import { getApps, generateHooks, getHooks, deleteHook } from "../actions"
import { useToast } from "@/components/ui/use-toast"

type App = {
  id: string
  app_name: string
}

type Hook = {
  id: string
  hook_text: string
}

export default function HooksPage() {
  const [selectedApp, setSelectedApp] = useState<string>('')
  const [apps, setApps] = useState<App[]>([])
  const [hooks, setHooks] = useState<Hook[]>([])
  const [selectedHooks, setSelectedHooks] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Load apps
  useEffect(() => {
    const loadApps = async () => {
      const { data } = await getApps()
      if (data) {
        setApps(data)
        if (data.length > 0) {
          setSelectedApp(data[0].id)
        }
      }
      setIsLoading(false)
    }
    loadApps()
  }, [])

  // Load hooks when app is selected
  useEffect(() => {
    const loadHooks = async () => {
      if (!selectedApp) return
      const { data, error } = await getHooks(selectedApp)
      if (error) {
        toast({
          title: "Error loading hooks",
          description: error,
          variant: "destructive",
        })
      } else if (data) {
        setHooks(data)
      }
    }
    loadHooks()
  }, [selectedApp, toast])

  const handleSelectHook = (id: string, selected: boolean) => {
    setSelectedHooks(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleDeleteHook = async (id: string) => {
    const { error } = await deleteHook(id)
    if (error) {
      toast({
        title: "Error deleting hook",
        description: error,
        variant: "destructive",
      })
    } else {
      setHooks(hooks => hooks.filter(hook => hook.id !== id))
      setSelectedHooks(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      toast({
        title: "Hook deleted",
        description: "The hook has been deleted successfully.",
      })
    }
  }

  const handleDeselectAll = () => {
    setSelectedHooks(new Set())
  }

  const handleGenerateHooks = async () => {
    if (!selectedApp) return

    setIsGenerating(true)
    const { hooks: newHooks, error } = await generateHooks(selectedApp)
    setIsGenerating(false)

    if (error) {
      toast({
        title: "Error generating hooks",
        description: error,
        variant: "destructive",
      })
    } else if (newHooks) {
      setHooks(prev => [...newHooks, ...prev])
      toast({
        title: "Hooks generated",
        description: "New hooks have been generated successfully.",
      })
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Hooks Manager</h1>
          <Select value={selectedApp} onValueChange={setSelectedApp}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select an app">
                {apps.find(app => app.id === selectedApp)?.app_name || 'Select an app'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {apps.map(app => (
                <SelectItem key={app.id} value={app.id}>
                  {app.app_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="text-sm"
            onClick={handleDeselectAll}
            disabled={selectedHooks.size === 0}
          >
            Deselect all
          </Button>
          <Button 
            className="bg-black text-white hover:bg-gray-800"
            onClick={handleGenerateHooks}
            disabled={!selectedApp || isGenerating}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generate New Hooks
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[auto,1fr,auto] gap-4 text-sm text-gray-500 px-4 py-2 border-b">
        <div className="w-16">Select</div>
        <div>Hook</div>
        <div className="w-24">Actions</div>
      </div>

      <div className="divide-y">
        {hooks.length > 0 ? (
          hooks.map(hook => (
            <HookItem
              key={hook.id}
              id={hook.id}
              text={hook.hook_text}
              selected={selectedHooks.has(hook.id)}
              onSelect={handleSelectHook}
              onDelete={handleDeleteHook}
            />
          ))
        ) : (
          <div className="text-gray-500 text-sm p-4">
            No hooks found. Click "Generate New Hooks" to create some.
          </div>
        )}
      </div>
    </div>
  )
}
