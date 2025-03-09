'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone } from 'lucide-react'

interface PremiumSupportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function PremiumSupportDialog({ isOpen, onClose }: PremiumSupportDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Premium Support
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base">
            I'm Spencer, the founder and I want to hear from you. Text me at <span className="font-semibold">+1 512 387 3564</span> and I'll respond within 24 hours!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 