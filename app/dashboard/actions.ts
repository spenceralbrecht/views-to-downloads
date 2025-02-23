'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { appDataSchema, type FirecrawlResponse, type AddAppResponse } from '@/types/firecrawl'
import { generateAppDescription } from '@/utils/openai'
import { OpenAI } from 'openai'
import { incrementContentUsage } from '@/utils/subscription'

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

    // Validate file type
    if (!file.type.includes('mp4')) {
      console.warn('Invalid file type uploaded by user:', user.id, 'File type:', file.type)
      return { error: 'Only MP4 video files are allowed.' }
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

export async function addApp(appStoreUrl: string): Promise<AddAppResponse> {
  try {
    // Get user
    const supabase = createServerActionClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Validate URL format
    if (!appStoreUrl.includes('apps.apple.com') && !appStoreUrl.includes('play.google.com')) {
      throw new Error('Please provide a valid App Store or Play Store URL')
    }

    // Check if app already exists for this user first
    const { data: existingApp } = await supabase
      .from('apps')
      .select('id')
      .eq('owner_id', user.id)
      .eq('app_store_url', appStoreUrl)
      .single()

    if (existingApp) {
      throw new Error('This app has already been added to your account')
    }

    // Extract app data from Firecrawl
    const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

    console.log('Extracting app data for:', appStoreUrl)
    
    try {
      console.log('Starting Firecrawl extraction')
      const result = await firecrawl.extract([appStoreUrl], {
        prompt: "Extract the app name, full app description, and app logo URL from this app store page.",
        schema: appDataSchema
      })

      console.log('Firecrawl raw response:', JSON.stringify(result, null, 2))

      // Check for error response first
      if ('error' in result && result.error) {
        console.error('Firecrawl extraction failed with error:', result.error)
        throw new Error(result.error)
      }

      // Type guard to ensure we have a successful response
      if (!('success' in result) || !result.success || !result.data) {
        console.error('Firecrawl extraction failed:', {
          success: 'success' in result ? result.success : false,
          hasData: 'data' in result ? !!result.data : false
        })
        throw new Error('Failed to extract app data')
      }

      // At this point TypeScript knows result has data property
      const validationResult = appDataSchema.safeParse(result.data)
      if (!validationResult.success) {
        console.error('Invalid data structure:', {
          data: result.data,
          error: validationResult.error
        })
        throw new Error('Failed to validate extracted app data')
      }

      console.log('Successfully extracted and validated app data')
      
      // Process description through OpenAI
      const enhancedDescription = await generateAppDescription(validationResult.data.app_description)

      // Insert into database
      const { data: newApp, error: insertError } = await supabase
        .from('apps')
        .insert({
          owner_id: user.id,
          app_store_url: appStoreUrl,
          app_description: enhancedDescription,
          app_name: validationResult.data.app_name,
          app_logo_url: validationResult.data.app_logo_url
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (!newApp) throw new Error('Failed to create app')

      revalidatePath('/dashboard/apps')
      return { success: true, app: newApp }
    } catch (error) {
      console.error('Error in Firecrawl extraction:', error)
      throw error
    }
  } catch (error) {
    console.error('Error adding app:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add app'
    return { 
      success: false,
      error: errorMessage.includes('timed out') 
        ? 'The app store is taking too long to respond. Please try again in a few minutes.' 
        : errorMessage 
    }
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
  fontOutline?: boolean
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

export async function createVideo({
  influencerVideoUrl,
  demoFootageUrl,
  captionText,
  captionPosition,
  userUuid,
  app_id: appId
}: {
  influencerVideoUrl: string,
  demoFootageUrl: string,
  captionText: string,
  captionPosition: 'top' | 'middle' | 'bottom',
  userUuid: string,
  app_id: string
}) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user has an active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subscriptionError || !subscription) {
      throw new Error('Active subscription required')
    }

    try {
      // Call the external API to create the video
      const response = await fetch('https://content-creation-api-python.onrender.com/api/create-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencerVideoUrl,
          demoFootageUrl,
          captionText,
          captionPosition,
          userUuid: user.id,
          appId,
          fontOutline: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Video creation API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        })
        
        throw new Error(`Failed to create video: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Video creation result:', result)

      return { success: true, video: { ...result, status: 'completed' } }
    } catch (error) {
      throw error
    }
  } catch (error) {
    console.error('Error creating video:', error)
    return { error: error instanceof Error ? error.message : 'Failed to create video' }
  }
}

export async function deleteVideo(videoId: string) {
  const supabase = createServerActionClient({ cookies })
  
  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Not authenticated')

  // First verify the video belongs to the user
  const { data: video } = await supabase
    .from('output_content')
    .select('user_id')
    .eq('id', videoId)
    .single()

  if (!video || video.user_id !== user.id) {
    throw new Error('Video not found or unauthorized')
  }

  const { error } = await supabase
    .from('output_content')
    .delete()
    .eq('id', videoId)
    .eq('user_id', user.id)
  
  if (error) {
    throw new Error('Failed to delete video')
  }
  
  return { success: true }
}

export async function deleteApp(appId: string) {
  try {
    if (!appId) {
      throw new Error('App ID is required')
    }

    const supabase = createServerActionClient({ cookies })
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // First verify the app belongs to the user
    const { data: app } = await supabase
      .from('apps')
      .select('owner_id')
      .eq('id', appId)
      .single()

    if (!app || app.owner_id !== user.id) {
      throw new Error('App not found or unauthorized')
    }
    
    // Delete hooks first due to foreign key constraint
    const { error: hooksError } = await supabase
      .from('hooks')
      .delete()
      .eq('app_id', appId)
      .eq('user_id', user.id)

    if (hooksError) throw hooksError

    // Delete app
    const { error: appError } = await supabase
      .from('apps')
      .delete()
      .eq('id', appId)
      .eq('owner_id', user.id)

    if (appError) throw appError

    revalidatePath('/dashboard/apps')
    return { success: true }
  } catch (error) {
    console.error('Error deleting app:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete app' }
  }
}

export async function generateHooks(appId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

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
      model: 'chatgpt-4o-latest',
      messages: [
        {
          role: 'system',
          content: `# Hook Generation Prompt for UGC Videos

## Context
You are a creative hook generator for our AI UGC video creation SaaS. Your task is to generate attention-grabbing hooks for app/product descriptions.

## Success Criteria
- Hooks achieve >1% engagement rate in social media tests
- Gen Z audiences rate language authenticity 8+/10 in blind tests
- Each hook presents a unique angle or perspective
- Hooks are immediately actionable for video creation
- Language feels natural and unforced

## Input/Output Format
INPUT: [App/Product Description]
OUTPUT: JSON object with array of 10 hooks in this exact format:
{
  "hooks": [
    "hook1",
    "hook2",
    ...
  ]
}

## Process Steps
1. Analyze core value proposition
2. Identify key user pain points
3. Brainstorm diverse angles (emotional, practical, humorous)
4. Generate hooks using authentic Gen-Z voice
5. Verify uniqueness of each hook
6. Check against evaluation criteria

## Hook Requirements
- Use casual, conversational Gen-Z language
- Incorporate relevant slang naturally (e.g., "fr fr", "ngl", "bestie")
- Include fitting emojis where natural
- Keep each hook concise and impactful
- Ensure immediate clarity of value proposition

## Examples
✅ GOOD HOOK:
"pov: you haven't checked your phone in 2 hours and your personality is still intact"
(Why: Conversational, authentic voice, clear value, humor)

❌ BAD HOOK:
"This amazing app will help you reduce phone addiction!"
(Why: Generic, promotional, lacks personality)

## Evaluation Checklist
Each hook must:
- Be immediately understandable
- Use authentic Gen-Z language
- Present a unique angle
- Be suitable for video format
- Avoid repetitive patterns
- Feel natural, not forced
- Be distinct from all other generated hooks

## CRITICAL: Response Format
Your entire response must be a single JSON object with a "hooks" array containing exactly 10 strings. No other text or formatting allowed.`
        },
        {
          role: 'user',
          content: `Generate 10 hooks for TikTok videos based on this app description: ${app.app_description} and app name: ${app.app_name}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No hooks generated')

    try {
      // Clean the content string to handle potential markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      console.log('Cleaned content:', cleanContent)
      
      // Parse the JSON
      const parsed = JSON.parse(cleanContent)
      console.log('Parsed hooks:', parsed)
      
      // Validate the structure
      if (!parsed || !Array.isArray(parsed.hooks) || parsed.hooks.length !== 10) {
        console.error('Invalid hooks structure:', parsed)
        throw new Error('Invalid hooks format or incorrect number of hooks')
      }

      // Save hooks to Supabase
      const { data: savedHooks, error: insertError } = await supabase
        .from('hooks')
        .insert(
          parsed.hooks.map(hook => ({
            app_id: appId,
            user_id: user.id,
            hook_text: hook
          }))
        )
        .select()

      if (insertError) throw insertError

      revalidatePath('/dashboard/hooks')
      return { success: true, hooks: savedHooks }
    } catch (jsonError) {
      console.error('Error parsing OpenAI response:', content)
      throw new Error('Failed to parse generated hooks as JSON')
    }
  } catch (error) {
    console.error('Error generating hooks:', error)
    return { error: error instanceof Error ? error.message : 'Failed to generate hooks' }
  }
}

export async function getHooks(appId: string) {
  const supabase = createServerActionClient({ cookies })
  
  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('hooks')
    .select('*')
    .eq('app_id', appId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hooks:', error)
  }

  return { data, error }
}

export async function deleteHook(hookId: string) {
  'use server'
  
  const supabase = createServerActionClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const { error } = await supabase
      .from('hooks')
      .delete()
      .match({ id: hookId })

    if (error) throw error

    revalidatePath('/dashboard/hooks')
    return { success: true }
  } catch (error) {
    console.error('Error deleting hook:', error)
    return { success: false, error: 'Failed to delete hook' }
  }
}