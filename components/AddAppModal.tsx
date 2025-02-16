'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'

export function AddAppModal({ 
  open,
  onOpenChange,
  onAddApp,
  isPending
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddApp: (url: string) => Promise<{ success?: boolean; error?: string }>
  isPending: boolean
}) {
  const [appUrl, setAppUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const result = await onAddApp(appUrl)
    
    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setAppUrl('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect New App</DialogTitle>
          <DialogDescription>
            Add your app store link to generate marketing content
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Paste your App Store or Play Store link"
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            required
          />
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#4287f5]"
              disabled={isPending}
            >
              {isPending ? 'Adding...' : 'Add App'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 