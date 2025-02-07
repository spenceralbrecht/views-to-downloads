import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface HookItemProps {
  id: string
  text: string
  selected: boolean
  onSelect: (id: string, selected: boolean) => void
  onDelete: (id: string) => void
}

export function HookItem({ id, text, selected, onSelect, onDelete }: HookItemProps) {
  return (
    <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center px-4 py-3 hover:bg-gray-50">
      <div className="w-16">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(id, checked as boolean)}
        />
      </div>
      <div className="text-sm text-gray-700">{text}</div>
      <div className="w-24 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
