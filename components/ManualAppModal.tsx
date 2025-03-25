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
      const url = URL.createObjectURL(imageFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  // Cleanup preview URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please choose a file under 10MB.')
        return
      }
      setImageFile(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add App Manually</DialogTitle>
          <DialogDescription>
            Fill in your app details to get started
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="min-h-[80px]"
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
                className="min-h-[100px]"
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
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2.5">
              <label htmlFor="app-icon" className="text-sm font-medium">
                App Icon
              </label>
              <div className="mt-1.5">
                <div className="flex items-center gap-4">
                  {previewUrl && (
                    <div className="w-16 h-16 relative border rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="App icon preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-sm">Upload Icon</span>
                    <input
                      type="file"
                      id="app-icon"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <DialogFooter>
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
        </form>
      </DialogContent>
    </Dialog>
  )
} 