import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { refreshTikTokToken, TikTokTokenResponse } from '@/utils/tiktokService';
import type { Database } from '@/types/database.types';

// Ensure required ENV VARS are present
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    console.error("TikTok client key or secret is missing from environment variables.");
}

export async function POST(request: NextRequest) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('API Auth Error:', sessionError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Ensure postInfo structure matches client-side
        const { accountId, videoUrl, postInfo, internalVideoId } = body as {
            accountId: string;
            videoUrl: string;
            postInfo: {
                title: string;
                privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
                disable_comment: boolean;
                disable_duet: boolean;
                disable_stitch: boolean;
                is_branded_content: boolean; // Promoting third party
                is_brand_organic: boolean;   // Promoting self
            };
            internalVideoId?: string; // Optional
        };

        if (!accountId || !videoUrl || !postInfo) {
            return NextResponse.json({ error: 'Missing required parameters: accountId, videoUrl, postInfo' }, { status: 400 });
        }

        // --- Authentication & Authorization ---
        // Fetch account details including tokens and expiry
        const { data: account, error: accountError } = await supabase
            .from('connected_accounts')
            .select('id, provider_account_id, access_token, refresh_token, token_expires_at') // Removed refresh_token_expires_at
            .eq('id', accountId)
            .eq('user_id', session.user.id)
            .single();

        if (accountError || !account) {
            console.error(`Account fetch error for user ${session.user.id}, account ${accountId}:`, accountError);
            // Ensure the type is compatible with potential null/error before accessing properties
            const errorMessage = accountError?.message || 'TikTok account not found or not linked to this user';
            return NextResponse.json({ error: errorMessage }, { status: 403 });
        }

        // --- Token Refresh Logic ---
        let currentAccessToken = account.access_token;
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const fiveMinutes = 5 * 60;
        const tokenExpiresAt = account.token_expires_at ? Math.floor(new Date(account.token_expires_at).getTime() / 1000) : 0; // Convert ISO string to epoch seconds for comparison

        // Check if access token is expired or expires within 5 minutes
        if (tokenExpiresAt && (tokenExpiresAt - fiveMinutes) < now) {
            console.log(`Access token for account ${accountId} expired or expiring soon. Refreshing...`);

            // Removed check for refresh_token_expires_at
            // Check if refresh token itself is expired (optional but good practice)
            // if (account.refresh_token_expires_at && account.refresh_token_expires_at < now) {
            //      console.error(`Refresh token expired for account ${accountId}. User needs to re-authenticate.`);
            //      return NextResponse.json({ error: 'TikTok connection expired. Please reconnect your account.', errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
            // }

            if (!account.refresh_token) {
                 console.error(`Missing refresh token for account ${accountId}. User needs to re-authenticate.`);
                 return NextResponse.json({ error: 'TikTok connection invalid. Please reconnect your account.', errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
            }

            const refreshedData: TikTokTokenResponse | null = await refreshTikTokToken(account.refresh_token);

            if (refreshedData) {
                console.log(`Token refresh successful for account ${accountId}`);
                currentAccessToken = refreshedData.access_token; // Use the new access token

                // Update the database with new tokens and expiry times
                // Calculate new expiry time in seconds since epoch
                const newExpirySeconds = Math.floor(Date.now() / 1000) + refreshedData.expires_in;
                // Convert to ISO string for Supabase
                const newExpiryISO = new Date(newExpirySeconds * 1000).toISOString();
                // const newRefreshExpiry = Math.floor(Date.now() / 1000) + refreshedData.refresh_expires_in;

                const { error: updateError } = await supabase
                    .from('connected_accounts')
                    .update({
                        access_token: refreshedData.access_token,
                        refresh_token: refreshedData.refresh_token,
                        token_expires_at: newExpiryISO, // Use ISO string
                        // refresh_token_expires_at: newRefreshExpiry,
                        // Keep scope if needed: scope: refreshedData.scope
                    })
                    .eq('id', account.id); // Use account.id safely after check

                if (updateError) {
                    console.error(`Failed to update refreshed token in DB for account ${accountId}:`, updateError);
                    // Proceed with the refreshed token for this request, but log the DB error
                }
            } else {
                console.error(`Token refresh failed for account ${accountId}. User may need to re-authenticate.`);
                 // Attempting publish with potentially expired token might fail, but let TikTok API decide.
                 // Alternatively, force re-auth:
                 // return NextResponse.json({ error: 'Failed to refresh TikTok connection. Please reconnect your account.', errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
            }
        }


        // --- Map Client Post Info to TikTok API Fields ---
        const tiktokPostInfo = {
            title: postInfo.title,
            privacy_level: postInfo.privacy_level,
            disable_comment: postInfo.disable_comment,
            disable_duet: postInfo.disable_duet,
            disable_stitch: postInfo.disable_stitch,
            brand_content_toggle: postInfo.is_branded_content, // Promoting third party
            brand_organic_toggle: postInfo.is_brand_organic,   // Promoting self
            // video_cover_timestamp_ms: ... // Optional: Set cover frame time
        };


        // --- Call TikTok API ---
        const tiktokApiUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
        console.log('Calling TikTok Publish Init API...');

        const tiktokResponse = await fetch(tiktokApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                post_info: tiktokPostInfo,
                source_info: {
                    source: 'PULL_FROM_URL',
                    video_url: videoUrl
                },
                post_mode: 'DIRECT_POST' // Explicitly use Direct Post
                // notification: false // Optional: disable creator notifications
            })
        });

        const tiktokResult = await tiktokResponse.json();

        if (!tiktokResponse.ok || tiktokResult.error?.code !== 'ok') {
            console.error('TikTok API Publish Init Error:', tiktokResult.error);
            // Provide more specific error messages based on code if possible
            let errorMessage = tiktokResult.error?.message || 'TikTok API request failed';
            if (tiktokResult.error?.code === 'spam_risk_too_high') {
                errorMessage = 'TikTok detected potential spam. Please try again later or adjust content.';
            } else if (tiktokResult.error?.code === 'access_token_invalid') {
                 errorMessage = 'Your TikTok connection is invalid. Please reconnect your account.';
                 return NextResponse.json({ error: errorMessage, errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
            }
            // ... handle other specific error codes ...
            throw new Error(errorMessage);
        }

        const publishId = tiktokResult.data?.publish_id;

        if (!publishId) {
             console.error('TikTok API Publish Init Success, but no publish_id returned:', tiktokResult.data);
             throw new Error('TikTok did not return a publish ID.');
        }

        console.log(`TikTok Publish Init Successful. publish_id: ${publishId}`);

        // --- Return Response ---
        return NextResponse.json({ success: true, publish_id: publishId });

    } catch (error: any) {
        console.error('Error in /api/tiktok/publish:', error);
        // Check if it's a reauth error we set earlier
        if (error.errorCode === 'REAUTH_REQUIRED') {
             return NextResponse.json({ error: error.message, errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
