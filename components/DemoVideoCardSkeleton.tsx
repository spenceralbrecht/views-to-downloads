import { Loader2 } from 'lucide-react'

interface DemoVideoCardSkeletonProps {
  progress?: number
}

export function DemoVideoCardSkeleton({ progress }: DemoVideoCardSkeletonProps) {
  return (
    <div
      className="relative flex-shrink-0 w-24 h-[170px] rounded-lg border-2 border-border bg-card overflow-hidden"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        {typeof progress === 'number' && (
          <div className="text-xs text-muted-foreground">
            {Math.round(progress)}%
          </div>
        )}
      </div>
      {typeof progress === 'number' && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20"
        >
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
} 