import { Check } from "lucide-react"

export function OnboardingChecklist() {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="text-primary text-xl">S</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Subscription required</h3>
            <p className="text-muted-foreground text-sm">Estimated 2-3 minutes</p>
          </div>
        </div>
        <Check className="text-primary h-5 w-5" />
      </div>

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="bg-muted p-2 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground text-xl">+</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Add your first app</h3>
            <p className="text-muted-foreground text-sm">Estimated 30 seconds</p>
          </div>
        </div>
        <Check className="text-primary h-5 w-5" />
      </div>

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="bg-muted p-2 rounded-lg">
            <span className="text-xl">📹</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Upload demo video</h3>
            <p className="text-muted-foreground text-sm">Estimated 30 seconds</p>
          </div>
        </div>
        <Check className="text-primary h-5 w-5" />
      </div>
    </div>
  )
}
