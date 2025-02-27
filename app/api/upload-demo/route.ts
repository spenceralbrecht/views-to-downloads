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

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
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
    
    // Log the data we're about to insert
    const recordData = {
      user_id: user.id,
      content_url: filePath,
      app_id: formData.get('appId')
    }
    console.log('Attempting to insert record into input_content:', recordData)
    
    const { data: insertedRecord, error: insertError } = await supabase
      .from('input_content')
      .insert(recordData)
      .select()
      .single()

    if (insertError) {
      console.error('Database insert failed:', {
        table: 'input_content',
        error: insertError,
        user: user.id,
        filePath: filePath,
        recordData
      })
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    console.log('Successfully created input_content record:', insertedRecord)
    return NextResponse.json({ success: true, record: insertedRecord })
    
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