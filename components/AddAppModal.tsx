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
import { useState, useEffect } from 'react'
import { ManualAppModal } from './ManualAppModal'

type AddAppModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddApp: (url: string) => Promise<{ success?: boolean; error?: string }>
  onAddManualApp: (appData: {
    app_name: string
    icp: string
    features: string
    main_problem: string
    app_logo_url?: string
  }) => Promise<{ success?: boolean; error?: string }>
  isPending: boolean
}

export function AddAppModal({ 
  open,
  onOpenChange,
  onAddApp,
  onAddManualApp,
  isPending
}: AddAppModalProps) {
  const [appUrl, setAppUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)

  // Reset error when modal is closed
  useEffect(() => {
    if (!open) {
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Close modal immediately and let parent handle loading state
    onOpenChange(false)
    
    const result = await onAddApp(appUrl)
    if (result.error) {
      setError(result.error)
      // Reopen modal to show error
      onOpenChange(true)
    } else if (result.success) {
      setAppUrl('')
    }
  }

  const handleManualAdd = () => {
    onOpenChange(false)
    setShowManualModal(true)
  }

  return (
    <>
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
            
            <DialogFooter className="relative pt-4 sm:flex sm:justify-between">
              <div className="absolute left-0 bottom-2 sm:static sm:bottom-auto sm:mr-4">
                <button
                  type="button"
                  onClick={handleManualAdd}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Add manually
                </button>
              </div>
              <div className="flex justify-end space-x-2"> 
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#4287f5] hover:bg-[#3a7be0]"
                  disabled={isPending}
                >
                  {isPending ? 'Adding...' : 'Add App'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ManualAppModal
        open={showManualModal}
        onOpenChange={setShowManualModal}
        onAddApp={onAddManualApp}
        isPending={isPending}
      />
    </>
  )
} 