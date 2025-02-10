import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface Hook {
  id: string
  hook_text: string
}

interface HookItemProps {
  hook: Hook
  onDelete: (id: string) => void
}

export function HookItem({ hook, onDelete }: HookItemProps) {
  return (
    <div className="grid grid-cols-[1fr,auto] gap-4 items-center px-4 py-3 bg-white rounded-lg border hover:bg-gray-50">
      <div className="text-sm text-gray-700">{hook.hook_text}</div>
      <div className="w-24 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(hook.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
