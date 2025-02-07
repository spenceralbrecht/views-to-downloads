import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AppDetailsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: {
    app_store_url: string
    app_description: string
  } | null
}

export function AppDetailsModal({
  open,
  onOpenChange,
  app
}: AppDetailsModalProps) {
  if (!app) return null

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (!text) return 'No description available'
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {new URL(app.app_store_url).hostname}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium mb-2">App Link</h4>
            <a 
              href={app.app_store_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 break-all"
            >
              {app.app_store_url}
            </a>
          </div>
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-600">
              {truncateDescription(app.app_description)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
