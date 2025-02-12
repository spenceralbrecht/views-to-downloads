'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SubscriptionLimitDialogProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  upgradeLink: string
}

export function SubscriptionLimitDialog({ 
  isOpen, 
  onClose, 
  currentPlan,
  upgradeLink 
}: SubscriptionLimitDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usage Limit Reached</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve reached the content usage limit for your {currentPlan} plan. 
            Upgrade your subscription to create more videos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              window.location.href = upgradeLink
            }}
          >
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
