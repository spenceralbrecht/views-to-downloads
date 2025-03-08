import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * API route for uploading demo videos
 * 
 * NOTE: For larger files (>6MB), we now use client-side TUS protocol uploads via tus-js-client
 * directly to Supabase Storage. This enables resumable uploads and better reliability.
 * This API route is kept for smaller files but has a practical limit of around 6MB 
 * for optimal performance. Larger files should use the TUS client implementation.
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Must be logged in to upload a demo video.', details: authError },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('videoFile') as File | null
    const appId = formData.get('appId')
    
    console.log('Upload request received:', {
      userId: user.id,
      appId: appId,
      fileName: file?.name,
      fileSize: file?.size ? `${(file.size / (1024 * 1024)).toFixed(2)}MB` : 'N/A',
      fileType: file?.type
    })
    
    if (!file) {
      console.warn('No file provided in upload request')
      return NextResponse.json(
        { error: 'No video file selected.', details: 'File missing in request' },
        { status: 400 }
      )
    }

    if (!appId) {
      console.warn('No app ID provided in upload request')
      return NextResponse.json(
        { error: 'App ID is required.', details: 'appId missing in request' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('mp4')) {
      console.warn('Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only MP4 video files are allowed.', details: { providedType: file.type } },
        { status: 400 }
      )
    }

    // Reduce max size to 6MB for API route - above this size, client should use TUS protocol
    const maxSize = 6 * 1024 * 1024
    if (file.size > maxSize) {
      console.warn('File size exceeds API route recommended limit:', `${(file.size / (1024 * 1024)).toFixed(2)}MB`)
      return NextResponse.json(
        { 
          error: 'File size exceeds 6MB recommended limit for API route uploads', 
          details: { 
            providedSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            maxSize: '6MB',
            recommendation: 'For files larger than 6MB, use client-side TUS protocol upload for resumable uploads'
          } 
        },
        { status: 413 }
      )
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`
    console.log('Starting storage upload to path:', filePath)
    
    // Perform the upload directly without retries
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
      
      // Prepare error details with type safety
      const errorDetails: Record<string, any> = {
        path: filePath,
        suggestion: 'Please try uploading a smaller file or contact support if the issue persists.'
      }
      
      // Add error properties if they exist
      if (typeof uploadError === 'object' && uploadError !== null) {
        if ('code' in uploadError) errorDetails.errorCode = uploadError.code;
        if ('name' in uploadError) errorDetails.errorName = uploadError.name;
        if ('message' in uploadError) errorDetails.message = uploadError.message;
      } else if (typeof uploadError === 'string') {
        errorDetails.message = uploadError;
      }
      
      return NextResponse.json(
        { 
          error: 'Storage upload failed: ' + (errorDetails.message || 'Unknown error'), 
          details: errorDetails
        },
        { status: 500 }
      )
    }
    
    console.log('Storage upload successful:', {
      path: filePath,
      bucket: 'input-content',
      fileId: uploadData?.id
    })
    
    // Log the data we're about to insert
    const recordData = {
      user_id: user.id,
      content_url: filePath,
      app_id: appId
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
      
      // Check if we can get the public URL even though the DB insert failed
      const { data: publicUrlData } = supabase
        .storage
        .from('input-content')
        .getPublicUrl(filePath)
      
      return NextResponse.json(
        { 
          error: 'Database record creation failed: ' + insertError.message, 
          details: { 
            errorCode: insertError.code,
            errorMessage: insertError.message,
            filePath: filePath,
            publicUrl: publicUrlData?.publicUrl || null,
            note: 'File was uploaded to storage but database record creation failed'
          } 
        },
        { status: 500 }
      )
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase
      .storage
      .from('input-content')
      .getPublicUrl(filePath)
    
    console.log('Successfully created input_content record:', {
      ...insertedRecord,
      publicUrl: publicUrlData?.publicUrl
    })
    
    return NextResponse.json({ 
      success: true, 
      record: insertedRecord,
      publicUrl: publicUrlData?.publicUrl
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Unexpected error in upload process:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Upload failed - unexpected error', 
        details: {
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}