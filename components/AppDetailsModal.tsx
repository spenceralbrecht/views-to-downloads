import Image from 'next/image'
import { Loader2, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
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
import { useState } from 'react'

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
  isDeleting?: boolean
}

export function AppDetailsModal({
  open,
  onOpenChange,
  app,
  onDelete,
  isDeleting
}: AppDetailsModalProps) {
  const [alertOpen, setAlertOpen] = useState(false)
  
  if (!app) return null

  const handleDelete = async () => {
    await onDelete?.(app.id)
    setAlertOpen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-2 flex-shrink-0">
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
              {app.app_store_url && (
                <a 
                  href={app.app_store_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View in App Store
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <ReactMarkdown 
            className="prose dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-4 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-4 prose-p:leading-relaxed prose-li:my-2 prose-ol:my-4 prose-ul:my-4"
          >
            {app.app_description}
          </ReactMarkdown>
        </ScrollArea>

        <div className="p-6 pt-4 border-t flex justify-end flex-shrink-0">
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete App</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {app.app_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}
