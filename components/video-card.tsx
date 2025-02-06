import { Card } from "@/components/ui/card"

export interface OutputContent {
  id: string
  url: string
  created_at: string
  status: string
}

export function VideoCard({ video }: { video: OutputContent }) {
  return (
    <Card className="p-4 space-y-2">
      <video 
        src={video.url} 
        controls 
        className="w-full rounded-lg"
        style={{ maxHeight: '400px' }}
      />
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Created: {new Date(video.created_at).toLocaleDateString()}</span>
        <span>Status: {video.status}</span>
      </div>
    </Card>
  )
}
