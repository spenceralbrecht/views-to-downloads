import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function VideoCardSkeleton() {
  return (
    <Card className="relative bg-card shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
      <div className="aspect-[9/16] flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Processing video...</p>
          <p className="text-[0.7rem] text-muted-foreground mt-1">(1-2 minutes)</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </Card>
  )
}
