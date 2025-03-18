'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { exchangeCodeForToken } from '@/utils/tiktokService';

export default function PendingTikTokAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    // Set the base URL based on the current window location
    // This ensures we use the same domain (ngrok or localhost) for redirects
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      setBaseUrl(`${url.protocol}//${url.host}`);
    }
  }, []);

  useEffect(() => {
    async function completeTikTokAuth() {
      try {
        const state = searchParams.get('state');
        if (!state) {
          setStatus('error');
          setErrorMessage('Missing authentication state');
          return;
        }

        // Decode the state parameter
        const pendingAuthState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        console.log('Pending auth state:', {
          code: pendingAuthState.code ? pendingAuthState.code.substring(0, 10) + '...' : 'missing',
          codeVerifier: pendingAuthState.codeVerifier ? pendingAuthState.codeVerifier.substring(0, 10) + '...' : 'missing',
          timestamp: new Date(pendingAuthState.timestamp).toISOString()
        });

        // Check if the auth request is still valid (10 minute expiration)
        const now = Date.now();
        const authAge = now - pendingAuthState.timestamp;
        const maxAge = 10 * 60 * 1000; // 10 minutes in milliseconds

        if (authAge > maxAge) {
          setStatus('error');
          setErrorMessage('Authentication request expired. Please try connecting again.');
          return;
        }

        // Get the current user session
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setStatus('error');
          setErrorMessage('You must be logged in to complete this action');
          // Redirect to login and pass the current URL as the redirect URL
          setTimeout(() => {
            if (baseUrl) {
              const currentUrl = encodeURIComponent(window.location.href);
              window.location.href = `${baseUrl}/login?redirectUrl=${currentUrl}`;
            } else {
              router.push('/login');
            }
          }, 2000);
          return;
        }

        // Now we have an authenticated user and valid auth data, complete the OAuth flow
        const { code, codeVerifier } = pendingAuthState;

        // Exchange the code for an access token
        console.log('Exchanging code for token...');
        const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

        if (!tokenResponse) {
          setStatus('error');
          setErrorMessage('Failed to exchange code for access token');
          return;
        }

        // At this point the TikTok authentication is complete
        setStatus('success');

        // Redirect back to connected accounts page after a short delay
        setTimeout(() => {
          if (baseUrl) {
            window.location.href = `${baseUrl}/dashboard/connected-accounts?success=true`;
          } else {
            router.push('/dashboard/connected-accounts');
          }
        }, 1500);
      } catch (error) {
        console.error('Error completing TikTok auth:', error);
        setStatus('error');
        setErrorMessage('Failed to complete TikTok authentication');
      }
    }

    if (baseUrl) {
      completeTikTokAuth();
    }
  }, [searchParams, router, baseUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">TikTok Authentication</h1>

        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
            <p>Completing your TikTok connection...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-2 font-semibold">Authentication Error</p>
            <p className="text-gray-600 mb-4">{errorMessage || 'An error occurred during authentication'}</p>
            <button
              onClick={() => router.push('/dashboard/connected-accounts')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Return to Connected Accounts
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 mb-2 font-semibold">Successfully Connected</p>
            <p className="text-gray-600 mb-4">Your TikTok account has been successfully connected.</p>
            <button
              onClick={() => router.push('/dashboard/connected-accounts')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Return to Connected Accounts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
