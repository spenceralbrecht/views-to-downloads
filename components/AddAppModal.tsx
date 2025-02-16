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
  onAddApp: (url: string) => void
  isPending: boolean
}) {
  const [appUrl, setAppUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddApp(appUrl)
    setAppUrl('')
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