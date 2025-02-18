import { Skeleton } from "@/components/ui/skeleton"

export function HookItemSkeleton() {
  return (
    <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center px-4 py-3 bg-card rounded-lg border border-border">
      {/* App Logo Skeleton */}
      <div className="h-10 w-10 relative rounded-lg overflow-hidden flex-shrink-0">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Hook Text and App Name Skeleton */}
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Actions Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
} 