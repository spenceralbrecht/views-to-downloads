import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil } from "lucide-react"

interface Hook {
  id: string
  hook_text: string
  app_id: string
  app_name?: string
  app_logo_url?: string
}

interface HookItemProps {
  hook: Hook
  onDelete: (id: string) => void
  onEdit: (hook: Hook) => void
}

export function HookItem({ hook, onDelete, onEdit }: HookItemProps) {
  return (
    <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center px-4 py-3 bg-card rounded-lg border border-border hover:bg-accent/50">
      {/* App Logo */}
      <div className="h-10 w-10 relative rounded-lg overflow-hidden flex-shrink-0">
        {hook.app_logo_url ? (
          <img
            src={hook.app_logo_url}
            alt={hook.app_name || 'App logo'}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xl">?</span>
          </div>
        )}
      </div>

      {/* Hook Text and App Name */}
      <div className="min-w-0">
        <div className="text-sm text-foreground mb-1">{hook.hook_text}</div>
        <div className="text-xs text-muted-foreground">{hook.app_name || 'Unknown App'}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={() => onEdit(hook)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(hook.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
