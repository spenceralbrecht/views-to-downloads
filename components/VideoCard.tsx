import { VideoCardProps } from '@/types/video'

export function VideoCard({ video }: VideoCardProps) {
  const isLoading = video.status === 'in_progress'

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 shadow-sm">
      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-gray-200 animate-pulse">
          <div className="text-gray-400">Processing...</div>
        </div>
      ) : (
        <video 
          className="w-full h-48 object-cover"
          src={video.url}
          controls
        />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {new Date(video.created_at).toLocaleDateString()}
          </span>
          {isLoading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Processing
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
