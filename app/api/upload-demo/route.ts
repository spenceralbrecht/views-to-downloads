import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Must be logged in to upload a demo video.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('videoFile') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No video file selected.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('mp4')) {
      return NextResponse.json(
        { error: 'Only MP4 video files are allowed.' },
        { status: 400 }
      )
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('input-content')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Storage upload failed:', {
        path: filePath,
        error: uploadError,
        user: user.id,
        fileSize: file.size
      })
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }
    
    const { error: insertError } = await supabase
      .from('input_content')
      .insert({
        user_id: user.id,
        content_url: filePath
      })

    if (insertError) {
      console.error('Database insert failed:', {
        table: 'input_content',
        error: insertError,
        user: user.id,
        filePath: filePath
      })
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Unexpected error in upload process:', {
      error: error instanceof Error ? error.stack : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Upload failed - check server logs' },
      { status: 500 }
    )
  }
} 