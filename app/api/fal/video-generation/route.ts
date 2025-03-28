import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { fal } from '@fal-ai/client';

// Schema for the request body
interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
}

/**
 * Handles video generation requests using FAL AI
 * Keeps API key secure by running on the server
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as VideoGenerationRequest;
    const { imageUrl, prompt } = body;

    console.log('🔍 [SERVER-FAL] Starting video generation from static image');
    console.log('🔍 [SERVER-FAL] Full Image URL:', imageUrl);
    console.log('🔍 [SERVER-FAL] Animation prompt:', prompt);

    // Initialize FAL client with server-side API key
    // Try both environment variable names
    const apiKey = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY;
    
    console.log('🔍 [SERVER-FAL] API key status:', apiKey ? 'Present' : 'Missing');
    console.log('🔍 [SERVER-FAL] Checked environment variables: FAL_KEY and NEXT_PUBLIC_FAL_KEY');
    
    if (!apiKey) {
      console.error('🔍 [SERVER-FAL] API key missing from environment variables');
      console.error('🔍 [SERVER-FAL] Please set either FAL_KEY or NEXT_PUBLIC_FAL_KEY in your .env.local file');
      return NextResponse.json(
        { error: 'Server configuration error: Missing FAL API key' },
        { status: 500 }
      );
    }

    // Configure FAL client with server-side API key
    fal.config({
      credentials: apiKey
    });
    
    // Submit request to FAL API
    console.log('🔍 [SERVER-FAL] Submitting request to FAL API...');
    const initialResponse = await fal.queue.submit("fal-ai/veo2/image-to-video", {
      input: {
        prompt,
        image_url: imageUrl
      }
    });
    
    const requestId = initialResponse.request_id;
    console.log('🔍 [SERVER-FAL] Request submitted with ID:', requestId);
    
    // Poll for status until complete
    let status = "PENDING";
    let attempts = 0;
    const maxAttempts = 30; // Limit the number of attempts
    const pollingInterval = 2000; // 2 seconds between checks
    
    console.log('🔍 [SERVER-FAL] Starting to poll for request status');
    
    while (status !== "COMPLETED" && status !== "FAILED" && attempts < maxAttempts) {
      attempts++;
      
      // Wait for the polling interval
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      // Check status
      try {
        const statusResponse = await fal.queue.status("fal-ai/veo2/image-to-video", {
          requestId: requestId
        });
        
        status = statusResponse.status;
        console.log(`🔍 [SERVER-FAL] Poll attempt ${attempts}/${maxAttempts}: Status: ${status}`);
        
        // If there are logs, print them
        if (statusResponse && typeof statusResponse === 'object' && 'logs' in statusResponse && Array.isArray(statusResponse.logs)) {
          statusResponse.logs.forEach((log: any) => {
            if (log && typeof log === 'object' && 'message' in log) {
              console.log(`🔍 [SERVER-FAL] Processing log: ${log.message}`);
            }
          });
        }
      } catch (statusError) {
        console.error('🔍 [SERVER-FAL] Error checking status:', statusError);
        // Continue polling despite status check error
      }
    }
    
    if (status !== "COMPLETED") {
      console.error('🔍 [SERVER-FAL] Request did not complete successfully:', status);
      return NextResponse.json(
        { error: `Video generation failed. Final status: ${status}` },
        { status: 500 }
      );
    }
    
    // Fetch the final result
    console.log('🔍 [SERVER-FAL] Request completed. Fetching final result...');
    const result = await fal.queue.result("fal-ai/veo2/image-to-video", {
      requestId: requestId
    });
    
    // Parse the response data
    console.log('🔍 [SERVER-FAL] Processing response data');
    const responseData = result.data as any;
    
    let videoUrl = "";
    
    // Try to extract the video URL from various possible locations in the response
    if (responseData.video && responseData.video.url) {
      videoUrl = responseData.video.url;
    } else if (responseData.videos && responseData.videos.length > 0) {
      videoUrl = responseData.videos[0];
    } else if (responseData.video_url) {
      videoUrl = responseData.video_url;
    } else if (responseData.output && responseData.output.video) {
      videoUrl = responseData.output.video;
    } else if (responseData.video_urls && responseData.video_urls.length > 0) {
      videoUrl = responseData.video_urls[0];
    }
    
    if (!videoUrl) {
      console.error('🔍 [SERVER-FAL] No video URL found in the response');
      
      // Try to extract deeper nested structures that might contain the URL
      if (typeof responseData === 'object') {
        const flattenedPaths: Record<string, string> = {};
        
        // Function to recursively scan the object for potential URL paths
        const findPaths = (obj: any, path: string = '') => {
          if (!obj || typeof obj !== 'object') return;
          
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            // Check if this value looks like a URL
            if (typeof value === 'string' && 
                (value.startsWith('http://') || value.startsWith('https://')) &&
                (value.endsWith('.mp4') || value.includes('video'))) {
              flattenedPaths[currentPath] = value;
              console.log(`🔍 [SERVER-FAL] Found potential video URL at path ${currentPath}:`, value);
            }
            
            // Recursively search nested objects
            if (value && typeof value === 'object') {
              findPaths(value, currentPath);
            }
          });
        };
        
        // Scan the response for URLs
        findPaths(responseData);
        
        // If we found any URLs, use the first one
        const urlPaths = Object.keys(flattenedPaths);
        if (urlPaths.length > 0) {
          videoUrl = flattenedPaths[urlPaths[0]];
          console.log(`🔍 [SERVER-FAL] Using URL found at path ${urlPaths[0]}:`, videoUrl);
        }
      }
      
      // If we still don't have a URL, return an error
      if (!videoUrl) {
        return NextResponse.json(
          { error: 'No video URL found in the response' },
          { status: 500 }
        );
      }
    }
    
    console.log('🔍 [SERVER-FAL] Generated video URL:', videoUrl);
    
    // Return success response with the video URL
    return NextResponse.json({ videoUrl });
    
  } catch (error: any) {
    console.error('🔍 [SERVER-FAL] Error during video generation:', error);
    
    // Handle specific error cases
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed with FAL API. Please check your API key.' },
        { status: 401 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: `FAL AI video generation failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
