import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from 'react'
import { ImagePlus } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

type ManualAppModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddApp: (appData: {
    app_name: string
    icp: string
    features: string
    main_problem: string
    app_logo_file?: File
  }) => Promise<{ success?: boolean; error?: string }>
  isPending: boolean
}

export function ManualAppModal({ 
  open,
  onOpenChange,
  onAddApp,
  isPending
}: ManualAppModalProps) {
  const [appName, setAppName] = useState('')
  const [icp, setIcp] = useState('')
  const [features, setFeatures] = useState('')
  const [mainProblem, setMainProblem] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create preview URL when image file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    } else {
      setPreviewUrl(null)
    }
  }, [imageFile])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setAppName('')
      setIcp('')
      setFeatures('')
      setMainProblem('')
      setImageFile(null)
      setPreviewUrl(null)
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!appName || !icp || !features || !mainProblem) {
      setError('Please fill in all required fields')
      return
    }
    
    // Close modal immediately and let parent handle loading state
    onOpenChange(false)
    
    const result = await onAddApp({
      app_name: appName,
      icp: icp,
      features: features,
      main_problem: mainProblem,
      app_logo_file: imageFile || undefined
    })

    if (result.error) {
      setError(result.error)
      // Reopen modal to show error
      onOpenChange(true)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please choose a file under 10MB.')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.')
        return
      }

      setImageFile(file)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[85vh] flex flex-col border-gray-500 overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add App Manually</DialogTitle>
          <DialogDescription>
            Fill in your app details to get started
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(85vh-180px)]" style={{ scrollbarColor: 'rgba(100, 116, 139, 0.5) transparent' }}>
          <form onSubmit={handleSubmit} className="space-y-6 py-4 px-4 md:px-6">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <label htmlFor="app-name" className="text-sm font-medium">
                  App Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="app-name"
                  placeholder="Enter your app name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                  className="w-full md:w-[95%]"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="main-problem" className="text-sm font-medium">
                  Main Problem Solved <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="main-problem"
                  placeholder="What is the main problem your app solves for users?"
                  value={mainProblem}
                  onChange={(e) => setMainProblem(e.target.value)}
                  required
                  className="min-h-[80px] w-full md:w-[95%]"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="features" className="text-sm font-medium">
                  Key Features <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="features"
                  placeholder="List your app's main features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  required
                  className="min-h-[80px] w-full md:w-[95%]"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="icp" className="text-sm font-medium">
                  Ideal Customer Profile (ICP) <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="icp"
                  placeholder="e.g. 24-34 year old women in America who like to shop for clothes on their phones"
                  value={icp}
                  onChange={(e) => setIcp(e.target.value)}
                  required
                  className="min-h-[80px] w-full md:w-[95%]"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="app-icon" className="text-sm font-medium">
                  App Icon
                </label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="app-icon"
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden" // Hide default input
                  />
                  <label 
                    htmlFor="app-icon" 
                    className="cursor-pointer border rounded-md p-2 hover:bg-accent inline-flex items-center"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {imageFile ? imageFile.name : 'Choose Image'}
                  </label>
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-md object-cover" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Max 10MB. Recommended: Square aspect ratio.</p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 pt-2">{error}</p>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 mt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-[#4287f5]"
            disabled={isPending}
          >
            {isPending ? 'Adding...' : 'Add App'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 