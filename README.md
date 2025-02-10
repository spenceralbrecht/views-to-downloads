# Views to Downloads

This is a web application for managing and creating UGC videos. The project is built using Next.js with TypeScript and integrates with Supabase for authentication, storage, and database operations.

## Features

- Create and publish UGC videos
- Upload demo videos
- Fetch and display demo videos from Supabase
- Create slideshow videos
- Integrated with external content creation API to create videos
- Manage connected apps with add/delete functionality
- Generate viral hooks for your videos

## Pages

### Dashboard
The main dashboard provides quick access to all major features:
- UGC Video Creation
- Slideshow Video Creation (coming soon)
- UGC Avatar Generator (coming soon)
- Hook Generator

### Hooks Manager
The hooks page allows users to:
- Generate viral hooks for their connected apps
- View and manage existing hooks
- Add new apps if none exist

## Create Video API Integration

When creating a UGC video, users follow these steps:

1. Select the target app for the video content
2. Enter hook text and position
3. Choose a UGC video
4. Upload or select demo footage
5. Click "Create" to initiate the video creation

The application then makes a POST request to:

```
https://content-creation-api.replit.app/api/create-video
```

The API accepts the following parameters:

```json
{
    "influencerVideoUrl": "string (required)",
    "demoFootageUrl": "string (required)",
    "captionText": "string (optional)",
    "captionPosition": "string (optional, enum: 'top', 'middle', 'bottom', default: 'bottom')",
    "userUuid": "string (required)",
    "app_id": "string (required)"
}
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
  - `dashboard/`: Dashboard pages for managing apps and content
    - `apps/`: Connected apps management (view, add, delete apps)
    - `videos/`: Video management and creation
- `components/`: UI components used throughout the application.
- `lib/`: Utility functions and Supabase client configuration.
- `supabase/`: Contains Supabase related configuration if applicable.

## Database Schema

### Apps Table
The application uses Supabase to store connected apps with the following schema:

| Column          | Type         | Description                           |
|----------------|-------------|---------------------------------------|
| id             | uuid        | Primary key                           |
| created_at     | timestamptz | Creation timestamp                    |
| owner_id       | uuid        | Foreign key to auth.users             |
| app_store_url  | text        | URL to the app in the store           |
| app_description| text        | Auto-generated app description        |

Apps can be managed through the dashboard with the following operations:
- Add new app: Enter app store URL to connect a new app
- View app details: Click on app card to view full details
- Delete app: Use trash icon to remove app (requires confirmation)

## Pricing Plans and Stripe Integration

The application offers three pricing tiers:
- Starter: Basic plan for individuals getting started
- Growth: Enhanced features for growing creators
- Scale: Full suite of features for businesses

### Stripe Configuration

The Stripe payment links and price IDs are configured in `config/stripe.ts` and are environment-specific. The configuration uses environment variables from `.env.local`:

```env
NEXT_PUBLIC_STRIPE_ENV=development|production
NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID=price_xxx
```

Development environment uses test payment links and price IDs, while production environment uses live ones. To switch between environments, set the `NEXT_PUBLIC_STRIPE_ENV` environment variable.

Example configuration structure:
```typescript
interface StripeConfig {
  checkoutLinks: {
    starter: string;
    growth: string;
    scale: string;
  };
  productIds: {
    starter: string;
    growth: string;
    scale: string;
  };
}
```

## Stripe Subscription Flow

### Overview
The application uses Stripe for handling subscriptions and payments. Here's the complete flow from checkout to feature access:

1. **Checkout Initiation**
   - User clicks a subscription plan button on the dashboard
   - Frontend sends request to `/api/stripe/checkout` with:
     - `priceId`: The selected plan's price ID
     - `userId`: The authenticated user's ID

2. **Checkout Session Creation**
   - Backend checks if user has an existing subscription
     - If active subscription exists, redirects to Stripe billing portal
     - If no subscription, creates new Stripe checkout session
   - Session is created with:
     - User's email (from Supabase)
     - Plan details and pricing
     - Success/cancel URLs
     - Metadata containing userId for tracking

3. **Payment Process**
   - User is redirected to Stripe's hosted checkout page
   - Enters payment information
   - Completes payment

4. **Webhook Processing**
   The following Stripe webhooks update the subscription status:
   - `checkout.session.completed`: Initial checkout success
     - Creates customer in Stripe
     - Stores userId in customer metadata
     - Creates subscription record in database
   - `customer.subscription.created`: Subscription activation
     - Updates subscription status to active
     - Records subscription period dates
   - `invoice.paid`: Recurring payments
     - Updates subscription period end date
     - Maintains active status
   - `customer.subscription.deleted`: Cancellation
     - Updates subscription status to canceled
     - Removes access to premium features

5. **Database Updates**
   The `subscriptions` table tracks:
   - `user_id`: Link to Supabase user
   - `stripe_customer_id`: Stripe customer reference
   - `stripe_subscription_id`: Active subscription reference
   - `stripe_price_id`: Selected plan's price
   - `plan_name`: Plan tier (starter/growth/scale)
   - `status`: Subscription status
   - `current_period_end`: Access expiration date

6. **Feature Access**
   - Application checks subscription status before allowing access to premium features
   - Middleware validates subscription status on protected routes
   - UI dynamically updates based on subscription status
   - Users can manage their subscription through the Stripe billing portal

### Error Handling
- Failed payments trigger Stripe's automatic retry system
- Webhook failures are logged for debugging
- Users are notified of payment issues through Stripe's communication
- Application gracefully handles subscription status changes

### Testing Subscriptions
For testing in development:
1. Use Stripe test card: 4242 4242 4242 4242
2. Set future expiry date and any CVC
3. Use any email to receive test receipts

## Instructions

1. Update your environment variables (e.g., AIRTABLE_API_KEY, AIRTABLE_BASE_ID) as required.
2. Run `npm install` (or `yarn install`) to install dependencies.
3. Run the development server with `npm run dev`.

## Environment Variables

Add the following to your `.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_ENV=development # or 'production' for live environment
```

## API Endpoints

### Create Video

`POST /api/create-video`

This endpoint accepts a JSON body with the following parameters:

- `influencerVideoUrl` (string, required): URL of the influencer video to process
- `demoFootageUrl` (string, required): URL of the demo footage to append
- `captionText` (string, optional): Text to overlay on the video
- `captionPosition` (string, optional): Position of the caption text. Must be one of: "top", "middle", or "bottom". Defaults to "bottom"
- `userUuid` (string, optional): Optional user ID to organize videos in folders

Example usage:
```javascript
fetch('/api/create-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    influencerVideoUrl: 'https://example.com/influencer.mp4',
    demoFootageUrl: 'https://example.com/demo.mp4',
    captionText: 'Check out this awesome product!',
    captionPosition: 'top',
    userUuid: 'user-1234'
  })
});
```

## Video Loading States

The application uses Supabase's realtime features to handle video processing states. The `output_content` table includes a `status` field that can have the following values:

- `in_progress`: Video is currently being processed
- `completed`: Video processing is complete and ready for viewing

The UI automatically updates when a video's status changes, providing real-time feedback to users. This is implemented using:

- Supabase's realtime subscriptions for instant updates
- Loading skeletons for videos in the "in_progress" state
- Automatic UI refresh when processing completes

## Testing

The project uses Vitest for testing. Tests are located in the `__tests__` directory.

### Running Tests

```bash
bun test
```

Note: Tests use the Supabase credentials from your `.env.local` file. Make sure you have the following variables set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Test Structure

- `__tests__/stripe/` - Tests for Stripe integration functionality
  - `metadata.test.ts` - Tests for managing Stripe metadata in user profiles

## Future Improvements

- Enhance error handling and logging
- Improve UI/UX for video creation flow
- Add more detailed documentation for API endpoints and database schema

## Recent Fixes
- Fixed a TypeScript error in `/app/dashboard/create/page.tsx` where state variables `selectedInfluencerVideo` and `selectedDemoVideo` were incorrectly initialized as `null` instead of an empty string. This resolves the error "Type 'null' is not assignable to type 'string'."

## Changelog

- 2025-02-05: Updated video creation API parameters to match new schema (influencerVideoUrl, demoFootageUrl, captionText, captionPosition)
- 2025-02-05: Fixed TypeScript type error in `app/dashboard/create/page.tsx` by updating the state initialization for `items`. Changed from `useState([])` to `useState<{ id: string; loading: boolean }[]>([])` for proper typing.
- 2025-02-05: Fixed createVideo type error by passing the required arguments in the call from the create page.
