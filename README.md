# Views to Downloads

This is a web application for managing and creating UGC videos. The project is built using Next.js with TypeScript and integrates with Supabase for authentication, storage, and database operations.

## Features

- Create and publish UGC videos
- Upload demo videos
- Fetch and display demo videos from Supabase
- Create slideshow videos
- Integrated with external content creation API to create videos

## Create Video API Integration

When a user clicks the "Create" button on the create UGC page, the application makes a POST request to the following endpoint:

```
https://content-creation-api.replit.app/api/create-video
```

The API returns a JSON response in the following format:

```json
{
    "status": "success",
    "video_url": "https://<video-url>",
    "details": {
        "duration": <duration>,
        "processingTime": <processingTime>,
        "captions": "<captions>",
        "user_folder": "<user_folder>"
    }
}
```

Upon receiving a successful response, the application inserts a new record into the Supabase table `output_content` with the following fields:

- `user_id`: The authenticated user's ID
- `url`: The video URL returned by the API
- `status`: The status from the API response (e.g., "success")

## Project Structure

- `app/`: Contains Next.js pages and server actions.
- `components/`: UI components used throughout the application.
- `lib/`: Utility functions and Supabase client configuration.
- `supabase/`: Contains Supabase related configuration if applicable.

## Instructions

1. Update your environment variables (e.g., AIRTABLE_API_KEY, AIRTABLE_BASE_ID) as required.
2. Run `npm install` (or `yarn install`) to install dependencies.
3. Run the development server with `npm run dev`.

## API Endpoints

### Create Video

`POST /api/create-video`
- **influencer_video_url** (string, required): URL or path of the influencer video.
- **demo_footage_url** (string, required): URL or path of the demo footage.
- **captions** (string, optional): Text for the opening captions on the video.
- **user_uuid** (string, optional): Unique user identifier used to create a dedicated subfolder in the Supabase Storage bucket for organizing videos.

## POST /api/create-video

This endpoint accepts a JSON body with the following parameters:

- `influencer_video_url` (string, required): URL or path of the influencer video.
- `demo_footage_url` (string, required): URL or path of the demo footage.
- `captions` (string, optional): Text for the opening captions on the video.
- `user_uuid` (string, optional): Unique user identifier used to create a dedicated subfolder in the Supabase Storage bucket for organizing videos.

Example usage:
```javascript
fetch('/api/create-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    influencer_video_url: 'https://example.com/influencer.mp4',
    demo_footage_url: 'https://example.com/demo.mp4',
    captions: 'Opening Caption',
    user_uuid: 'user-1234'
  })
});
```

## Future Improvements

- Enhance error handling and logging
- Improve UI/UX for video creation flow
- Add more detailed documentation for API endpoints and database schema

## Recent Fixes
- Fixed a TypeScript error in `/app/dashboard/create/page.tsx` where state variables `selectedInfluencerVideo` and `selectedDemoVideo` were incorrectly initialized as `null` instead of an empty string. This resolves the error "Type 'null' is not assignable to type 'string'."

## Changelog

- 2025-02-05: Fixed TypeScript type error in `app/dashboard/create/page.tsx` by updating the state initialization for `items`. Changed from `useState([])` to `useState<{ id: string; loading: boolean }[]>([])` for proper typing.
- 2025-02-05: Fixed createVideo type error by passing the required arguments (influencer_video_url, demo_footage_url, captions, and user_uuid) in the call from the create page.
