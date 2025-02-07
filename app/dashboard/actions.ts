'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { appDataSchema, type FirecrawlResponse } from '@/types/firecrawl'

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
  
  console.log('Starting addApp for URL:', url)
  const supabase = createServerActionClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log('No session found')
    return { success: false, error: 'User not authenticated' }
  }

  console.log('User authenticated:', session.user.id)
  const { data: newApp, error } = await supabase
    .from('apps')
    .insert({
      owner_id: session.user.id,
      app_store_url: url
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding app:', error)
    return { success: false, error: error.message }
  }

  if (!newApp) {
    console.error('No app data returned from insert')
    return { success: false, error: 'Failed to create app' }
  }

  console.log('Successfully created app:', newApp.id)

  // Return the app data immediately while extraction happens in background
  const returnValue = { success: true, app: newApp }

  if (process.env.FIRECRAWL_API_KEY) {
    console.log('FIRECRAWL_API_KEY found:', process.env.FIRECRAWL_API_KEY.substring(0, 5) + '...')
    try {
      console.log('Starting firecrawl extraction for:', url)
      const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
      const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

      console.log('Calling Firecrawl extract with schema')
      const extractResponse = await firecrawl.extract([url], {
        prompt: "Extract the app name, full app description, and app logo URL from this app store page.",
        schema: appDataSchema
      }) as FirecrawlResponse

      console.log('Raw Firecrawl response:', JSON.stringify(extractResponse, null, 2))

      if (extractResponse.success && extractResponse.data) {
        const { app_name, app_description, app_logo_url } = extractResponse.data
        console.log('Extracted app data:', {
          app_name,
          app_description: app_description?.substring(0, 50) + '...',
          app_logo_url
        })

        // First verify the app exists
        const { data: existingApp, error: checkError } = await supabase
          .from('apps')
          .select('id')
          .eq('id', newApp.id)
          .single()

        if (checkError || !existingApp) {
          console.error('Could not find app to update:', { checkError, appId: newApp.id })
          return
        }

        console.log('Updating app with extracted data...')
        // Update all extracted fields in the apps table
        const updateData = {
          ...(app_name && { app_name }),
          ...(app_description && { app_description }),
          ...(app_logo_url && { app_logo_url })
        }
        
        console.log('Update data being sent to Supabase:', updateData)
        const { error: updateError } = await supabase
          .from('apps')
          .update(updateData)
          .eq('id', newApp.id)

        if (updateError) {
          console.error('Error updating app details:', updateError)
        } else {
          // Verify the update by fetching the updated row
          const { data: verifyData, error: verifyError } = await supabase
            .from('apps')
            .select('id, app_name, app_description, app_logo_url')
            .eq('id', newApp.id)
            .single()

          console.log('Final app data in database:', {
            success: !verifyError,
            appId: newApp.id,
            data: verifyData
          })
        }
      } else {
        console.error('Failed to extract app data:', {
          success: extractResponse.success,
          error: extractResponse.error,
          data: extractResponse.data
        })
      }
    } catch (error) {
      console.error('Error during extraction:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
    }
  } else {
    console.log('No FIRECRAWL_API_KEY found in environment')
  }

  return returnValue
}

export async function getApps() {
  'use server'
  
  const supabase = createServerActionClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  console.log('Fetching apps for user:', session.user.id)
  const { data, error } = await supabase
    .from('apps')
    .select('id, app_store_url, app_name, app_description, app_logo_url, created_at')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching apps:', error)
  } else {  
    console.log('Fetched apps:', data)
  }

  return { data, error }
}

interface VideoCreationRequest {
  influencerVideoUrl: string
  demoFootageUrl: string
  captionText?: string
  captionPosition?: 'top' | 'middle' | 'bottom'
  userUuid?: string
  appId?: string
}

interface VideoCreationResponse {
  status: string;
  video_url: string;
  details: {
    duration: number;
  };
}

async function callVideoCreationAPI(params: VideoCreationRequest): Promise<VideoCreationResponse> {
  console.log('Calling video creation API with params:', JSON.stringify(params, null, 2));
  
  try {
    const response = await fetch('https://content-creation-api-python.onrender.com/api/create-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video creation API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Video creation API response:', JSON.stringify(data, null, 2));
    
    if (!data.video_url) {
      throw new Error('API response missing video_url');
    }

    return data;
  } catch (error) {
    console.error('Error in callVideoCreationAPI:', error);
    throw error;
  }
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
      userUuid: videoData.userUuid,
      appId: videoData.app_id  // Pass appId to the API
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

export async function deleteApp(appId: string) {
  'use server'
  
  const supabase = createServerActionClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // First verify the app exists and belongs to the user
  const { data: app } = await supabase
    .from('apps')
    .select('owner_id')
    .eq('id', appId)
    .single()

  if (!app || app.owner_id !== session.user.id) {
    return { success: false, error: 'App not found or unauthorized' }
  }

  // Delete the app with a returning clause to confirm deletion
  const { data: deletedApp, error: deleteError } = await supabase
    .from('apps')
    .delete()
    .eq('id', appId)
    .eq('owner_id', session.user.id)
    .select()
    .single()

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  if (!deletedApp) {
    return { success: false, error: 'Failed to delete app' }
  }

  return { success: true }
}
