import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil } from "lucide-react"

interface Hook {
  id: string
  hook_text: string
}

interface HookItemProps {
  hook: Hook
  onDelete: (id: string) => void
  onEdit: (hook: Hook) => void
}

export function HookItem({ hook, onDelete, onEdit }: HookItemProps) {
  return (
    <div className="grid grid-cols-[1fr,auto] gap-4 items-center px-4 py-3 bg-card rounded-lg border border-border hover:bg-accent/50">
      <div className="text-sm text-foreground">{hook.hook_text}</div>
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
