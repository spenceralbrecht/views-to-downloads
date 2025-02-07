'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { appDataSchema, type FirecrawlResponse } from '@/types/firecrawl'
import { generateAppDescription } from '@/utils/openai'
import { OpenAI } from 'openai'

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

export async function addApp(appStoreUrl: string) {
  try {
    // Get user
    const supabase = createServerActionClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Extract app data from Firecrawl
    const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

    console.log('Extracting app data for:', appStoreUrl)
    const extractResponse = await firecrawl.extract([appStoreUrl], {
      prompt: "Extract the app name, full app description, and app logo URL from this app store page.",
      schema: appDataSchema
    }) as FirecrawlResponse

    if (!extractResponse.success || !extractResponse.data) {
      console.error('Firecrawl extraction failed:', extractResponse.error)
      throw new Error(extractResponse.error || 'Failed to extract app data')
    }

    const { app_name, app_description, app_logo_url } = extractResponse.data
    
    // Process description through OpenAI
    const enhancedDescription = await generateAppDescription(app_description)

    // Insert into database
    const { data: newApp, error: insertError } = await supabase
      .from('apps')
      .insert({
        owner_id: user.id,
        app_store_url: appStoreUrl,
        app_description: enhancedDescription,
        app_name,
        app_logo_url
      })
      .select()
      .single()

    if (insertError) throw insertError
    if (!newApp) throw new Error('Failed to create app')

    revalidatePath('/dashboard/apps')
    return { success: true, app: newApp }
  } catch (error) {
    console.error('Error adding app:', error)
    return { error: error instanceof Error ? error.message : 'Failed to add app' }
  }
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
  const { error } = await supabase
    .from('apps')
    .delete()
    .eq('id', appId)

  if (error) {
    console.error('Error deleting app:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/apps')
  return { success: true }
}

export async function generateHooks(appId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Get app details
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('app_description')
      .eq('id', appId)
      .single()
    
    if (appError) throw appError
    if (!app?.app_description) throw new Error('No app description found')

    // Generate hooks using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'o3-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a social media expert who creates engaging hooks for TikTok videos. Return your response as a JSON array of strings, with each string being a hook.'
        },
        {
          role: 'user',
          content: `Generate 10 one sentence hooks for TikTok videos based on this app description: ${app.app_description}`
        }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No hooks generated')

    const { hooks } = JSON.parse(content)
    if (!Array.isArray(hooks)) throw new Error('Invalid hooks format')

    // Save hooks to Supabase
    const { data: savedHooks, error: insertError } = await supabase
      .from('hooks')
      .insert(
        hooks.map(hook => ({
          app_id: appId,
          user_id: user.id,
          hook_text: hook
        }))
      )
      .select()

    if (insertError) throw insertError

    revalidatePath('/dashboard/hooks')
    return { success: true, hooks: savedHooks }
  } catch (error) {
    console.error('Error generating hooks:', error)
    return { error: error instanceof Error ? error.message : 'Failed to generate hooks' }
  }
}

export async function getHooks(appId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    const { data, error } = await supabase
      .from('hooks')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error getting hooks:', error)
    return { error: error instanceof Error ? error.message : 'Failed to get hooks' }
  }
}

export async function deleteHook(hookId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    const { error } = await supabase
      .from('hooks')
      .delete()
      .eq('id', hookId)

    if (error) throw error
    revalidatePath('/dashboard/hooks')
    return { success: true }
  } catch (error) {
    console.error('Error deleting hook:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete hook' }
  }
}
