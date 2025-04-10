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

// TODO: Implement actual TikTok API interaction logic for fetching status

export async function POST(request: NextRequest) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('API Auth Error:', sessionError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { publishId, accountId } = body; // Need accountId to fetch the correct token

        if (!publishId || !accountId) {
            return NextResponse.json({ error: 'Missing required parameters: publishId and accountId' }, { status: 400 });
        }

        // --- Authentication & Authorization ---
        // 1. Verify the user owns the accountId to get the token
        const { data: account, error: accountError } = await supabase
            .from('connected_accounts')
            .select('access_token, refresh_token, token_expires_at') // Need tokens
            .eq('id', accountId)
            .eq('user_id', session.user.id)
            .single();

        if (accountError || !account) {
            console.error(`Account fetch error for user ${session.user.id}, account ${accountId}:`, accountError);
            return NextResponse.json({ error: 'TikTok account not found or not linked to this user' }, { status: 403 });
        }

        // 2. TODO: Check if token is expired and refresh if necessary

        // --- Call TikTok API ---
        // 3. Construct the request body for TikTok's /v2/post/publish/status/fetch/ endpoint
        //    Reference: https://developers.tiktok.com/doc/content-posting-api-reference/
        console.log('Received status fetch request:', { publishId, accountId });

        // Placeholder for actual TikTok API call
        const tiktokApiUrl = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
        const accessToken = account.access_token;

        /*
        const tiktokResponse = await fetch(tiktokApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                publish_id: publishId
            })
        });

        const tiktokResult = await tiktokResponse.json();

        if (!tiktokResponse.ok || tiktokResult.error?.code !== 'ok') {
            console.error('TikTok API Status Fetch Error:', tiktokResult.error);
            // Note: Need to handle specific error codes like 'PUBLISH_ID_INVALID' or 'ACCESS_TOKEN_INVALID'
            throw new Error(tiktokResult.error?.message || 'TikTok API status fetch failed');
        }

        const status = tiktokResult.data?.status;
        const failReason = tiktokResult.data?.fail_reason;
        */

        // --- Mock Response (Simulate different states) ---
        // To test, cycle through statuses: 'PROCESSING', 'PUBLISHED', 'FAILED'
        const mockStatuses = ['PROCESSING', 'PROCESSING', 'PROCESSING', 'PUBLISHED', 'FAILED'];
        const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
        const mockResponse = {
            status: randomStatus,
            fail_reason: randomStatus === 'FAILED' ? 'Mock failure reason' : undefined
        };
        console.log(`Mock TikTok Status Fetch: Returning status: ${mockResponse.status}`);


        // --- Return Response ---
        return NextResponse.json(mockResponse);

    } catch (error: any) {
        console.error('Error in /api/tiktok/publish-status:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('API Auth Error:', sessionError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const publishId = searchParams.get('publish_id');
    const accountId = searchParams.get('account_id'); // Need account ID to fetch the correct token

    if (!publishId || !accountId) {
        return NextResponse.json({ error: 'Missing required query parameters: publish_id, account_id' }, { status: 400 });
    }

    try {
        // --- Authentication & Authorization ---
        // Fetch account details using accountId to get the correct token
        const { data: account, error: accountError } = await supabase
            .from('connected_accounts')
            .select('id, access_token, refresh_token, token_expires_at') // Select necessary fields
            .eq('id', accountId)
            .eq('user_id', session.user.id) // Ensure user owns this account
            .single();

        if (accountError || !account) {
            console.error(`Account fetch error for user ${session.user.id}, account ${accountId}:`, accountError);
            const errorMessage = accountError?.message || 'TikTok account not found or not linked to this user';
            return NextResponse.json({ error: errorMessage }, { status: 403 });
        }

        // --- Token Refresh Logic (Identical to publish route) ---
        let currentAccessToken = account.access_token;
        const now = Math.floor(Date.now() / 1000);
        const fiveMinutes = 5 * 60;
        const tokenExpiresAt = account.token_expires_at ? Math.floor(new Date(account.token_expires_at).getTime() / 1000) : 0;

        if (tokenExpiresAt && (tokenExpiresAt - fiveMinutes) < now) {
            console.log(`Access token for account ${accountId} expired or expiring soon. Refreshing...`);
            if (!account.refresh_token) {
                console.error(`Missing refresh token for account ${accountId}. User needs to re-authenticate.`);
                return NextResponse.json({ error: 'TikTok connection invalid. Please reconnect your account.', errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
            }

            const refreshedData: TikTokTokenResponse | null = await refreshTikTokToken(account.refresh_token);

            if (refreshedData) {
                console.log(`Token refresh successful for account ${accountId}`);
                currentAccessToken = refreshedData.access_token;
                const newExpirySeconds = Math.floor(Date.now() / 1000) + refreshedData.expires_in;
                const newExpiryISO = new Date(newExpirySeconds * 1000).toISOString();

                const { error: updateError } = await supabase
                    .from('connected_accounts')
                    .update({
                        access_token: refreshedData.access_token,
                        refresh_token: refreshedData.refresh_token,
                        token_expires_at: newExpiryISO,
                    })
                    .eq('id', account.id);

                if (updateError) {
                    console.error(`Failed to update refreshed token in DB for account ${accountId}:`, updateError);
                }
            } else {
                console.error(`Token refresh failed for account ${accountId}. User may need to re-authenticate.`);
                // return NextResponse.json({ error: 'Failed to refresh TikTok connection. Please reconnect your account.', errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
            }
        }

        // --- Call TikTok Status API ---
        const tiktokApiUrl = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
        console.log(`Checking TikTok Publish Status for publish_id: ${publishId}`);

        const tiktokResponse = await fetch(tiktokApiUrl, {
            method: 'POST', // Status endpoint uses POST
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                publish_id: publishId
            })
        });

        const tiktokResult = await tiktokResponse.json();

        if (!tiktokResponse.ok || tiktokResult.error?.code !== 'ok') {
            console.error(`TikTok API Status Fetch Error for publish_id ${publishId}:`, tiktokResult.error);
            let errorMessage = tiktokResult.error?.message || 'TikTok status API request failed';
             if (tiktokResult.error?.code === 'access_token_invalid') {
                 errorMessage = 'Your TikTok connection is invalid. Please reconnect your account.';
                 return NextResponse.json({ error: errorMessage, errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
             }
            // Add more specific error handling if needed
            throw new Error(errorMessage);
        }

        // Extract relevant data from the response
        const status = tiktokResult.data?.status; // e.g., "PROCESSING", "PUBLISHED", "FAILED"
        const failReason = tiktokResult.data?.fail_reason; // Only present if status is FAILED

        if (!status) {
            console.error(`TikTok API Status Fetch Success, but no status returned for publish_id ${publishId}:`, tiktokResult.data);
            throw new Error('TikTok did not return a status.');
        }

        console.log(`TikTok Publish Status for ${publishId}: ${status}${failReason ? ` (Reason: ${failReason})` : ''}`);

        // --- Return Response ---
        return NextResponse.json({
            status: status,
            fail_reason: failReason || null // Ensure fail_reason is null if not present
        });

    } catch (error: any) {
        console.error(`Error in /api/tiktok/publish-status for publish_id ${publishId}:`, error);
        if (error.errorCode === 'REAUTH_REQUIRED') {
            return NextResponse.json({ error: error.message, errorCode: 'REAUTH_REQUIRED' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
