'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

interface CheckoutSuccessModalProps {
  isOpen: boolean
  onClose: () => void
}

function CheckoutSuccessModal({ isOpen, onClose }: CheckoutSuccessModalProps) {
  const handleBookCall = () => {
    window.open("https://cal.com/viewstodownloads/onboarding-and-free-growth-consultation", "_blank", "noopener,noreferrer")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations on starting your mobile app growth journey!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 my-4">
          <div className="relative w-64 h-64 rounded-md overflow-hidden">
            <Image 
              src="/founder-image.png" 
              alt="Founder" 
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <p className="text-center text-muted-foreground">
            If you want to book a call to help you get the most out of this platform for your app, 
            please select a time below.
          </p>

          <Button 
            className="w-full btn-gradient flex items-center justify-center gap-2"
            onClick={handleBookCall}
          >
            Get Onboarded Personally
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CheckoutSuccessModal
