import { useState } from 'react'
import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { AppDetailsModal } from './AppDetailsModal'

interface AppCardProps {
  app: {
    app_name: string
    app_description: string
    app_logo_url: string
    app_store_url: string
  }
  onClick?: () => void
}

export function AppCard({ app, onClick }: AppCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const truncateDescription = (text: string) => {
    if (!text) return ''
    return text.length > 150 ? `${text.slice(0, 150)}...` : text
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowDetails(true)
    }
  }

  return (
    <>
      <Card 
        className="p-6 bg-white rounded-3xl hover:shadow-md transition-shadow cursor-pointer" 
        onClick={handleClick}
      >
        <div className="flex gap-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden relative">
            {app.app_logo_url ? (
              <Image
                src={app.app_logo_url}
                alt={`${app.app_name} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-2xl">?</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-black mb-2">
              {app.app_name}
            </h2>
            <p className="text-gray-500 text-base line-clamp-2">
              {truncateDescription(app.app_description)}
            </p>
          </div>
        </div>
      </Card>

      <AppDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        app={app}
      />
    </>
  )
}
