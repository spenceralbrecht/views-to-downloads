# TikTok Publish Edge Function

This Supabase Edge Function handles publishing videos to TikTok using the TikTok Content Posting API with the `FILE_UPLOAD` method.

## Why an Edge Function?

The TikTok API requires one of two approaches when uploading videos:
1. `PULL_FROM_URL` - TikTok pulls from a URL you provide, but requires URL/domain verification
2. `FILE_UPLOAD` - You upload the video file directly to TikTok

Since verifying Supabase Storage domains with TikTok can be challenging, we use the `FILE_UPLOAD` approach which requires:
1. Downloading the video from Supabase Storage
2. Uploading it to TikTok's servers

This requires more server-side processing that's better handled in an Edge Function than a Next.js API route.

## Deployment

### Prerequisites

1. Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Logged in to Supabase:
   ```bash
   supabase login
   ```

3. Linked your project:
   ```bash
   supabase link --project-ref <your-project-id>
   ```

### Deploy the Function

```bash
npm run supabase:deploy-tiktok-function
```

Or manually:

```bash
supabase functions deploy tiktok-publish
```

### Set Required Environment Variables

```bash
supabase secrets set NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
supabase secrets set TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## Usage

The function expects a POST request with the following JSON body:

```json
{
  "accountId": "tiktok_account_id_from_your_db",
  "videoId": "output_content_id_from_your_db",
  "videoUrl": "https://your-supabase-bucket-url/path/to/video.mp4"
}
```

Authentication is required - the request must include an Authorization header with a valid Supabase session token.

## Response Format

Success response:
```json
{
  "success": true,
  "publishedUrl": "https://www.tiktok.com/@username/video/123456789",
  "message": "Video published to TikTok successfully"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "isTokenError": true|false
}
```

## Troubleshooting

Common issues:
1. TikTok token expiration - The function handles token refresh automatically
2. Video size limits - TikTok has limits on video file sizes
3. Network timeouts - Downloading/uploading large videos can time out

Check the Edge Function logs for detailed error messages:
```bash
supabase functions logs tiktok-publish --tail
``` 