import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlaceholderContent } from "@/components/dashboard/PlaceholderContent"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Video, ImageIcon, User, Sparkles } from "lucide-react"

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Apps</h1>
        <Link href="/dashboard/add-app" title="Add New App">
          <button type="button" className="add-app-button">+</button>
        </Link>
      </header>
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/dashboard/create" className="cursor-pointer">
            <Card>
              <CardHeader>
                <Video className="h-8 w-8 mb-2 text-blue-500" />
                <CardTitle>Create UGC videos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create & publish UGC videos promoting your product demo</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="relative">
            <CardHeader>
              <ImageIcon className="h-8 w-8 mb-2 text-green-500" />
              <CardTitle>Create slideshow videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Create & publish image slideshow videos to TikTok</p>
            </CardContent>
            <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              Not Available Yet
            </div>
          </Card>
          <Card className="relative">
            <CardHeader>
              <User className="h-8 w-8 mb-2 text-purple-500" />
              <CardTitle>UGC Avatar Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Auto-magically generate and save viral hooks for your videos</p>
            </CardContent>
            <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              Not Available Yet
            </div>
          </Card>
          <Link href="/dashboard/hooks" className="cursor-pointer">
            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 mb-2 text-amber-500" />
                <CardTitle>Hook Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Auto-magically generate and save viral hooks for your videos</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <PlaceholderContent />
      </div>
    </div>
  )
}
