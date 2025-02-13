import { Check, X } from "lucide-react"
import Link from 'next/link'

interface OnboardingChecklistProps {
  hasSubscription: boolean
  hasApp: boolean
  hasDemoVideo: boolean
  billingUrl: string
}

export function OnboardingChecklist({ hasSubscription, hasApp, hasDemoVideo, billingUrl }: OnboardingChecklistProps) {
  return (
    <div className="grid gap-8 mb-8">
      <Link href={hasSubscription ? '#' : billingUrl} className={!hasSubscription ? 'cursor-pointer' : 'cursor-default'}>
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`${hasSubscription ? 'bg-primary/10' : 'bg-muted'} p-2 rounded-lg`}>
              <span className={`text-xl ${hasSubscription ? 'text-primary' : 'text-muted-foreground'}`}>S</span>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Subscription required</h3>
              <p className="text-muted-foreground text-sm">Estimated 2-3 minutes</p>
            </div>
          </div>
          {hasSubscription ? (
            <Check className="text-green-500 h-5 w-5" />
          ) : (
            <X className="text-red-500 h-5 w-5" />
          )}
        </div>
      </Link>

      <Link href={hasApp ? '#' : '/dashboard/apps'} className={!hasApp ? 'cursor-pointer' : 'cursor-default'}>
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`${hasApp ? 'bg-primary/10' : 'bg-muted'} p-2 rounded-lg flex items-center justify-center`}>
              <span className={`text-xl ${hasApp ? 'text-primary' : 'text-muted-foreground'}`}>+</span>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Add your first app</h3>
              <p className="text-muted-foreground text-sm">Estimated 30 seconds</p>
            </div>
          </div>
          {hasApp ? (
            <Check className="text-green-500 h-5 w-5" />
          ) : (
            <X className="text-red-500 h-5 w-5" />
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <div className={`${hasDemoVideo ? 'bg-primary/10' : 'bg-muted'} p-2 rounded-lg`}>
            <span className="text-xl">📹</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Upload demo video</h3>
            <p className="text-muted-foreground text-sm">Estimated 30 seconds</p>
          </div>
        </div>
        {hasDemoVideo ? (
          <Check className="text-green-500 h-5 w-5" />
        ) : (
          <X className="text-red-500 h-5 w-5" />
        )}
      </div>
    </div>
  )
}
