import { Content, CustomData, EventRequest, ServerEvent, UserData } from 'facebook-nodejs-business-sdk';

// Initialize Facebook Business SDK
const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
const pixelId = process.env.FACEBOOK_PIXEL_ID;

interface PurchaseEventParams {
  email: string;
  value: number;
  currency?: string;
  orderId?: string;
  contentIds?: string[];
  eventSourceUrl?: string;
  userAgent?: string;
  actionSource?: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

/**
 * Send a purchase event to Facebook Conversions API
 * @param params Purchase event parameters
 */
export async function sendPurchaseEvent(params: PurchaseEventParams) {
  if (!accessToken || !pixelId) {
    console.error('Missing Facebook access token or pixel ID');
    return { success: false, error: 'Missing Facebook credentials' };
  }

  try {
    const { 
      email, 
      value, 
      currency = 'USD', 
      orderId, 
      contentIds = [],
      eventSourceUrl = process.env.NEXT_PUBLIC_TEST_APP_URL || 'https://viewstodownloads.com',
      userAgent = 'ViewsToDownloads Server',
      actionSource = 'website'
    } = params;

    // Create user data - Include client user agent without hashing
    const userData = new UserData()
      .setEmail(email.toLowerCase())
      .setClientUserAgent(userAgent);

    // Create custom data
    const customData = new CustomData()
      .setValue(value)
      .setCurrency(currency);

    // Add order ID if provided
    if (orderId) {
      customData.setOrderId(orderId);
    }

    // Add content IDs if provided
    if (contentIds.length > 0) {
      const contents = contentIds.map(id => new Content().setId(id));
      customData.setContents(contents);
    }

    // Get current timestamp in seconds (for eventTime)
    const eventTime = Math.floor(Date.now() / 1000);

    // Create server event with all required parameters
    const serverEvent = new ServerEvent()
      .setEventName('Purchase')
      .setEventTime(eventTime)
      .setUserData(userData)
      .setCustomData(customData)
      .setActionSource(actionSource)
      .setEventSourceUrl(eventSourceUrl);

    // Create event request
    const eventRequest = new EventRequest(accessToken, pixelId)
      .setEvents([serverEvent])
      .setTestEventCode(process.env.FACEBOOK_TEST_EVENT_CODE); // Include test event code if available

    // Execute the request
    const response = await eventRequest.execute();
    console.log('Facebook Conversions API response:', response);
    
    return { success: true, response };
  } catch (error) {
    console.error('Error sending Facebook purchase event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
