import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function VideoCardSkeleton() {
  return (
    <Card className="relative aspect-[9/16] bg-muted animate-pulse shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </Card>
  )
}
