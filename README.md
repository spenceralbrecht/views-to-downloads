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

## Subscription Plans and Content Limits

The application offers three subscription tiers with different content creation limits:

1. **Starter Plan**
   - 10 pieces of content per month
   - Basic features
   - Perfect for individual creators

2. **Growth Plan**
   - 50 pieces of content per month
   - All Starter features
   - Ideal for growing channels

3. **Scale Plan**
   - 150 pieces of content per month
   - All Growth features
   - Built for professional content creators

Content limits reset at the start of each billing period. When upgrading plans, the content limit is immediately adjusted and usage is reset.

### Content Usage Tracking

The application tracks content creation across all types (videos, images, etc.) with these features:
- Real-time usage display in the sidebar
- Progress bar showing percentage used
- Automatic reset at billing period start
- Usage limits enforced before content creation

## Subscription Management

### 1. **Subscription States**
   The application manages subscriptions through Stripe with these states:
   - Active: Full access to features within plan limits
   - Canceled: Access until end of current period
   - Past Due: Grace period with continued access

### 2. **Plan Changes**
   When changing plans:
   - Upgrades: Immediate access to new limits
   - Downgrades: New limits apply at next billing cycle
   - Content usage resets on plan change

### 3. **Webhook Processing**
   The following Stripe webhooks manage subscription state:
   - `checkout.session.completed`: Initial subscription creation
     - Matches user by email
     - Creates subscription record
     - Sets initial content limits
   - `customer.subscription.updated`: Plan changes
     - Updates plan and limits
     - Resets usage counters
   - `invoice.paid`: Renewal processing
     - Extends subscription period
     - Resets monthly usage
   - `customer.subscription.deleted`: Cancellations
     - Updates subscription status
     - Maintains access until period end

## Pricing Plans and Stripe Integration

The application offers three pricing tiers:
- Starter: Basic plan for individuals getting started
- Growth: Enhanced features for growing creators
- Scale: Full suite of features for businesses

## Stripe Subscription Flow

### Overview
The application uses Stripe Payment Links for handling subscriptions and payments. This provides a simple, secure, and maintainable approach to subscription management.

### Payment Links
Payment links are configured in the Stripe Dashboard for each subscription tier:
- Starter: Basic features
- Growth: Enhanced features
- Scale: Full feature set

Each payment link is configured with:
- Success URL: `${NEXT_PUBLIC_TEST_APP_URL}/dashboard?success=true`
- Cancel URL: `${NEXT_PUBLIC_TEST_APP_URL}/dashboard?canceled=true`
- Customer email collection enabled
- Automatic tax handling (optional)

### Subscription Flow
1. **User Initiates Subscription**
   - Clicks payment link for desired plan
   - Redirected to Stripe's hosted checkout page

2. **Payment Processing**
   - User enters payment information
   - Stripe handles payment processing
   - Success/failure handled by Stripe

3. **Webhook Processing**
   The following Stripe webhooks manage subscription state:
   - `checkout.session.completed`: Initial subscription creation
     - Matches user by email
     - Creates subscription record
     - Stores metadata for tracking
   - `invoice.paid`: Recurring payments
     - Updates subscription period
   - `customer.subscription.deleted`: Cancellation
     - Updates subscription status

4. **Database Updates**
   The `subscriptions` table tracks:
   - `user_id`: Link to Supabase user
   - `stripe_customer_id`: Stripe customer reference
   - `stripe_subscription_id`: Active subscription reference
   - `stripe_price_id`: Selected plan's price
   - `plan_name`: Plan tier (starter/growth/scale)
   - `status`: Subscription status
   - `current_period_end`: Access expiration date

### Testing
For development testing:
1. Use test payment links (prefixed with NEXT_PUBLIC_STRIPE_TEST_)
2. Test card: 4242 4242 4242 4242
3. Any future expiry date and CVC
4. Use your email to receive test receipts

### Environment Variables
```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_ENV=development # or 'production'
STRIPE_TEST_SECRET_KEY=sk_test_... # Stripe test secret key
STRIPE_SECRET_KEY=sk_live_... # Stripe live secret key
STRIPE_TEST_WEBHOOK_SECRET=whsec_... # Webhook signing secret

# Payment Links
NEXT_PUBLIC_STRIPE_TEST_STARTER_LINK=https://buy.stripe.com/test_...
NEXT_PUBLIC_STRIPE_TEST_GROWTH_LINK=https://buy.stripe.com/test_...
NEXT_PUBLIC_STRIPE_TEST_SCALE_LINK=https://buy.stripe.com/test_...

# Production Payment Links
NEXT_PUBLIC_STRIPE_STARTER_LINK=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_GROWTH_LINK=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_SCALE_LINK=https://buy.stripe.com/...
```

## Local Development

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

### Testing Stripe Webhooks Locally

To test Stripe subscriptions and webhooks in your local development environment:

1. Install the Stripe CLI:
   ```bash
   # On macOS
   brew install stripe/stripe-cli/stripe

   # On Windows (using scoop)
   scoop install stripe

   # On Linux
   # Follow instructions at https://stripe.com/docs/stripe-cli
   ```

2. Login to your Stripe account through the CLI:
   ```bash
   stripe login
   ```

3. Start the webhook forwarding in a separate terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret that appears after running the listen command:
   ```
   Ready! Your webhook signing secret is whsec_xxx... (^C to quit)
   ```

5. Add the webhook secret to your `.env.local` file:
   ```
   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxx...
   ```

6. Test specific webhook events:
   ```bash
   # Test a successful checkout
   stripe trigger checkout.session.completed

   # Test subscription updates
   stripe trigger customer.subscription.updated

   # Test subscription cancellation
   stripe trigger customer.subscription.deleted

   # Test invoice payment
   stripe trigger invoice.paid
   ```

7. Monitor the webhook forwarding terminal to see events being sent and responses from your local server.

Note: The webhook secret changes each time you run `stripe listen`. Make sure to update your `.env.local` file with the new secret when testing.
