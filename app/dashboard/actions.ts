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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Must be logged in to upload a demo video.' }
  }

  const file = formData.get('videoFile') as File | null
  if (!file) {
    return { error: 'No video file selected.' }
  }

  // Upload to a Supabase Storage bucket named "input-content"
  const filePath = `input-content/${user.id}/${Date.now()}_${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('input-content')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Insert a row in the "input_content" table with the uploaded video's path
  const { error: insertError } = await supabase
    .from('input_content')
    .insert({
      user_id: user.id,
      file_path: filePath
    })

  if (insertError) {
    return { error: insertError.message }
  }

  return { success: true }
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
