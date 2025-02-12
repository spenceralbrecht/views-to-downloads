import Image from 'next/image'
import { Card } from "@/components/ui/card"

interface AppCardProps {
  app: {
    app_name: string
    app_logo_url: string
  }
  onClick?: () => void
}

export function AppCard({ app, onClick }: AppCardProps) {
  return (
    <Card 
      className="p-6 bg-card rounded-3xl border border-border hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <div className="flex gap-4 items-center">
        {app.app_logo_url ? (
          <div className="h-16 w-16 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={app.app_logo_url}
              alt={`${app.app_name} logo`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-muted-foreground text-2xl">?</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {app.app_name || 'Unnamed App'}
          </h2>
        </div>
      </div>
    </Card>
  )
}
