import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VideoGrid } from './VideoGrid'
import type { OutputContent } from '@/types/video'

export default async function MyVideosPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: videos } = await supabase
    .from('output_content')
    .select('*')
    .order('created_at', { ascending: false })
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Videos</h1>
      <VideoGrid initialVideos={videos as OutputContent[]} />
    </div>
  )
}
