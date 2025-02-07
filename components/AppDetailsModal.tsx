import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type AppDetailsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: {
    id: string
    app_name: string
    app_store_url: string
    app_description: string
    app_logo_url: string
  } | null
  onDelete?: (appId: string) => void
}

export function AppDetailsModal({
  open,
  onOpenChange,
  app,
  onDelete
}: AppDetailsModalProps) {
  if (!app) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-2">
          <div className="flex items-center gap-4">
            {app.app_logo_url ? (
              <div className="h-16 w-16 relative rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={app.app_logo_url}
                  alt={`${app.app_name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-3xl">?</span>
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-semibold">
                {app.app_name || 'Unnamed App'}
              </DialogTitle>
              <a 
                href={app.app_store_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View in App Store
              </a>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-2">
          <h4 className="font-medium">Description</h4>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="pr-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">
                {app.app_description || 'No description available'}
              </p>
            </div>
          </div>
        </ScrollArea>

        {onDelete && (
          <div className="flex-shrink-0 p-6 pt-4 flex justify-end border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete App</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this app? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => {
                      onDelete(app.id)
                      onOpenChange(false)
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
