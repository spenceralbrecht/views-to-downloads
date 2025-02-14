'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import PricingModal from '@/components/PricingModal'

interface SubscriptionGuardProps {
  children: ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()
  const { isSubscribed, loading } = useSubscription(user)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // If still loading user or subscription, render nothing
  if (!user || loading) {
    return null
  }

  // If user is subscribed, render children directly
  if (isSubscribed) {
    return <>{children}</>
  }

  // If user is not subscribed, wrap children with dialog
  return (
    <>
      <div onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowDialog(true)
      }}>
        {children}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Premium Feature</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Subscribe to access this feature and more.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-gradient" 
              onClick={() => {
                setShowDialog(false)
                setShowPricingModal(true)
              }}
            >
              Subscribe Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </>
  )
}