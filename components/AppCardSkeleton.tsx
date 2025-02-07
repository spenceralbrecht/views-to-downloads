import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AppCardSkeleton() {
  return (
    <Card className="p-6 bg-white rounded-3xl">
      <div className="flex gap-4 items-center">
        <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
    </Card>
  )
}
