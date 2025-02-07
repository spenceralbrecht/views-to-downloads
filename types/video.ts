export type VideoStatus = 'in_progress' | 'completed'

export interface OutputContent {
  id: string
  created_at: string
  app_id: string
  user_id: string
  url: string
  status: VideoStatus
}

export interface VideoCardProps {
  video: OutputContent
}
