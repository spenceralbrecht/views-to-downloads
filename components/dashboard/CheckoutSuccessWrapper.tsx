'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CheckoutSuccessModal from '@/components/CheckoutSuccessModal'

export default function CheckoutSuccessWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for checkout_success parameter
    const checkoutSuccess = searchParams.get('checkout_success')
    if (checkoutSuccess === 'true') {
      setShowSuccessModal(true)
    }
  }, [searchParams])

  return (
    <>
      {children}
      <CheckoutSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
    </>
  )
}
