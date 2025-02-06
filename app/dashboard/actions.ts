'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function joinWaitlist(email: string) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
  const AIRTABLE_TABLE_NAME = 'Waitlist'

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable API key or Base ID is missing')
    return { success: false, error: 'Server configuration error' }
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Email: email
            }
          }
        ]
      })
    })

    const responseData = await response.text()
    console.log('Airtable response:', responseData)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseData}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to add to waitlist:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function uploadDemoVideo(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  console.log('Starting video upload process...')
  let user = null
  
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    user = authUser
    if (authError) console.error('Auth error:', authError)
    
    console.log('Authenticated user:', user?.id)
    if (!user) {
      console.warn('Upload attempt by unauthenticated user')
      return { error: 'Must be logged in to upload a demo video.' }
    }

    const file = formData.get('videoFile') as File | null
    console.log('Received file:', file?.name, 'Size:', file?.size, 'Type:', file?.type)
    if (!file) {
      console.warn('No file selected by user:', user.id)
      return { error: 'No video file selected.' }
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn('File size exceeded by user:', user.id, 'File size:', file.size)
      return { error: 'File size exceeds 50MB limit' };
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    console.log('Starting storage upload to path:', filePath)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('input-content')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
        duplex: 'half'
      })

    if (uploadError) {
      console.error('Storage upload failed:', {
        path: filePath,
        error: uploadError,
        user: user.id,
        fileSize: file.size
      })
      return { error: uploadError.message }
    }
    
    console.log('Storage upload successful:', {
      path: filePath,
      bucket: 'input-content',
      fileId: uploadData?.id
    })

    console.log('Starting database insert for user:', user.id)
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
      return { error: insertError.message }
    }

    console.log('Database insert successful for file:', filePath)
    return { success: true }
    
  } catch (error) {
    console.error('Unexpected error in upload process:', {
      error: error instanceof Error ? error.stack : 'Unknown error',
      user: user?.id,
      timestamp: new Date().toISOString()
    })
    return { error: 'Upload failed - check server logs' }
  }
}

export async function addApp(url: string) {
  'use server'
  
  const supabase = createServerActionClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('apps')
    .insert({
      owner_id: session.user.id,
      app_store_url: url
    })

  if (error) {
    console.error('Error adding app:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getApps() {
  'use server'
  
  const supabase = createServerActionClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message }
}

interface VideoCreationRequest {
  influencerVideoUrl: string
  demoFootageUrl: string
  captionText?: string
  captionPosition?: 'top' | 'middle' | 'bottom'
  userUuid?: string
}

interface VideoCreationResponse {
  status: 'success';
  video_url: string;
  details: {
    duration: number;
    processingTime: number;
    captions: string;
    user_folder: string;
  };
}

async function callVideoCreationAPI(params: VideoCreationRequest): Promise<VideoCreationResponse> {
  const response = await fetch('https://content-creation-api-ydf6.onrender.com/api/create-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status !== 'success' || !data.video_url) {
    throw new Error('API response invalid or missing video_url');
  }

  return data;
}

export async function createVideo(videoData: VideoCreationRequest & { app_id: string }) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    // Call the external API first to get the video URL
    const { video_url, details } = await callVideoCreationAPI({
      influencerVideoUrl: videoData.influencerVideoUrl,
      demoFootageUrl: videoData.demoFootageUrl,
      captionText: videoData.captionText,
      captionPosition: videoData.captionPosition,
      userUuid: videoData.userUuid
    });

    // Create the output content record with the returned URL
    const { data: outputContent, error: insertError } = await supabase
      .from('output_content')
      .insert([{
        app_id: videoData.app_id,
        user_id: videoData.userUuid,
        status: 'completed',
        url: video_url
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create output content: ${insertError.message}`);
    }

    return { 
      success: true, 
      data: {
        ...outputContent,
        details  // Include processing details in response
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in createVideo:', { message: errorMessage, originalError: error });
    throw new Error(errorMessage);
  }
}
