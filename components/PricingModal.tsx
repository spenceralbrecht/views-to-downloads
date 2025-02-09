'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { stripeConfig } from '@/config/stripe'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  buttonText: string
  getLink: () => string | undefined
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$9',
    description: 'Perfect for getting started with video creation',
    features: [
      'Create up to 10 videos per month',
      'Basic video editing features',
      'Standard quality exports',
      'Email support'
    ],
    buttonText: 'Start with Starter',
    getLink: () => stripeConfig.checkoutLinks.starter
  },
  {
    name: 'Growth',
    price: '$29',
    description: 'Ideal for growing creators',
    features: [
      'Create up to 50 videos per month',
      'Advanced video editing features',
      'HD quality exports',
      'Priority email support',
      'Custom branding'
    ],
    buttonText: 'Upgrade to Growth',
    getLink: () => stripeConfig.checkoutLinks.growth
  },
  {
    name: 'Scale',
    price: '$99',
    description: 'For professional content creators',
    features: [
      'Unlimited video creation',
      'Premium video editing features',
      '4K quality exports',
      '24/7 priority support',
      'Custom branding',
      'API access',
      'Team collaboration'
    ],
    buttonText: 'Scale your content',
    getLink: () => stripeConfig.checkoutLinks.scale
  }
]

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const handlePurchaseClick = (tier: PricingTier) => {
    const link = tier.getLink()
    if (!link) {
      console.error(`Checkout link not found for ${tier.name} plan`)
      return
    }
    window.location.href = link
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold text-center mb-8"
                >
                  Choose Your Plan
                </Dialog.Title>

                <div className="grid md:grid-cols-3 gap-8">
                  {pricingTiers.map((tier) => (
                    <div
                      key={tier.name}
                      className="border rounded-lg p-6 flex flex-col h-full hover:shadow-lg transition-shadow"
                    >
                      <h4 className="text-xl font-semibold mb-2">{tier.name}</h4>
                      <div className="text-3xl font-bold mb-4">{tier.price}<span className="text-sm font-normal">/month</span></div>
                      <p className="text-gray-600 mb-4">{tier.description}</p>
                      <ul className="space-y-3 mb-8 flex-grow">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start">
                            <svg
                              className="h-6 w-6 text-green-500 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handlePurchaseClick(tier)}
                        className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {tier.buttonText}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    className="text-gray-600 hover:text-gray-800"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
