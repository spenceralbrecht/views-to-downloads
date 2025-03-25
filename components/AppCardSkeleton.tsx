import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { LoadingStage } from "@/lib/types"

type AppCardSkeletonProps = {
  loadingStage?: LoadingStage
}

export function AppCardSkeleton({ loadingStage }: AppCardSkeletonProps) {
  return (
    <Card className="p-6 bg-card rounded-3xl border border-border">
      <div className="flex gap-4 items-center">
        <div className="h-16 w-16 bg-muted rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
          {loadingStage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="capitalize">{loadingStage}...</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
