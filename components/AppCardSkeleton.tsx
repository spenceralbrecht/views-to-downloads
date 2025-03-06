import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type LoadingStage = 
  | "fetching" 
  | "extracting" 
  | "analyzing" 
  | "understanding" 
  | undefined;

const loadingMessages = {
  fetching: "Fetching app store link...",
  extracting: "Extracting app data...",
  analyzing: "Analyzing app store description...",
  understanding: "Understanding customer profiles..."
};

interface AppCardSkeletonProps {
  loadingStage?: LoadingStage;
}

export function AppCardSkeleton({ loadingStage }: AppCardSkeletonProps) {
  return (
    <Card className="group relative overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            {/* App name */}
            <Skeleton className="h-4 w-2/3 mb-2" />
            
            {/* Description preview - 2 lines instead of 3 */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        </div>

        {/* Loading indicator and stage message */}
        {loadingStage && (
          <div className="flex items-center justify-center mt-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>{loadingMessages[loadingStage]}</span>
          </div>
        )}

        {/* Action buttons - moved closer to content */}
        <div className="flex justify-end gap-2 mt-3">
          <Skeleton className="h-8 w-[90px]" />
          <Skeleton className="h-8 w-[90px]" />
        </div>
      </div>
    </Card>
  )
}
