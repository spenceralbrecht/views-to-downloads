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
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function AddAccountModal({ 
  open,
  onOpenChange,
  onConnectTikTok,
  connecting
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectTikTok: () => Promise<void>
  connecting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Social Media Account</DialogTitle>
          <DialogDescription>
            Connect your social media accounts to enhance your content creation workflow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button 
            disabled={true}
            className="w-full"
          >
            Connect TikTok (Coming Soon)
          </Button>
          
          {/* Add more platform buttons here as needed */}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 