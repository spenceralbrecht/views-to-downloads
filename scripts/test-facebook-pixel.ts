import { config } from 'dotenv';
import path from 'path';
import { sendPurchaseEvent } from '../utils/facebookConversions';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

interface TestArgs {
  email?: string;
  value?: number;
  currency?: string;
  plan?: string;
  eventSourceUrl?: string;
  userAgent?: string;
  actionSource?: string;
  help?: boolean;
}

function parseArgs(): TestArgs {
  const args: TestArgs = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg === '--email' && i + 1 < argv.length) {
      args.email = argv[++i];
    } else if (arg === '--value' && i + 1 < argv.length) {
      args.value = parseFloat(argv[++i]);
    } else if (arg === '--currency' && i + 1 < argv.length) {
      args.currency = argv[++i];
    } else if (arg === '--plan' && i + 1 < argv.length) {
      args.plan = argv[++i];
    } else if (arg === '--event-source-url' && i + 1 < argv.length) {
      args.eventSourceUrl = argv[++i];
    } else if (arg === '--user-agent' && i + 1 < argv.length) {
      args.userAgent = argv[++i];
    } else if (arg === '--action-source' && i + 1 < argv.length) {
      args.actionSource = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  
  return args;
}

function showHelp() {
  console.log(`
Facebook Conversions API Test Script
-----------------------------------

Usage: bun run scripts/test-facebook-pixel.ts [options]

Options:
  --email <email>             Email address to use for the test (default: test@example.com)
  --value <value>             Purchase value (default: 49.99)
  --currency <currency>       Currency code (default: USD)
  --plan <plan>               Subscription plan name (default: growth-plan)
  --event-source-url <url>    Source URL for the event (default: https://viewstodownloads.com)
  --user-agent <agent>        User agent string (default: Test User Agent)
  --action-source <source>    Action source (default: website, options: website, app, email, phone_call, chat, physical_store, system_generated, other)
  --help, -h                  Show this help message

Examples:
  bun run scripts/test-facebook-pixel.ts
  bun run scripts/test-facebook-pixel.ts --email user@example.com --value 99.99 --plan scale-plan
  bun run scripts/test-facebook-pixel.ts --action-source email --currency EUR
  `);
}

async function testFacebookPixel(args: TestArgs) {
  if (args.help) {
    showHelp();
    return;
  }

  console.log('Starting Facebook Pixel test...');
  console.log(`Using Pixel ID: ${process.env.FACEBOOK_PIXEL_ID}`);
  
  // Create a purchase event with provided or default values
  const purchaseData = {
    email: args.email || 'test@example.com',
    value: args.value !== undefined ? args.value : 49.99,
    currency: args.currency || 'USD',
    orderId: `test-order-${Date.now()}`,
    contentIds: [args.plan || 'growth-plan'],
    eventSourceUrl: args.eventSourceUrl || 'https://viewstodownloads.com/checkout',
    userAgent: args.userAgent || 'Test User Agent',
    actionSource: (args.actionSource || 'website') as any
  };
  
  console.log('Sending purchase event with data:', purchaseData);
  
  try {
    const result = await sendPurchaseEvent(purchaseData);
    
    if (result.success) {
      console.log('✅ Test purchase event sent successfully!');
      console.log('Response from Facebook:', result.response);
      
      console.log('\n🔍 To verify this event in Facebook Events Manager:');
      console.log('1. Go to: https://business.facebook.com/events_manager/');
      console.log('2. Select your pixel ID');
      console.log('3. Navigate to "Test Events" tab');
      console.log('4. You should see your purchase event with the following details:');
      console.log(`   - Event Name: Purchase`);
      console.log(`   - Value: ${purchaseData.value} ${purchaseData.currency}`);
      console.log(`   - Email: ${purchaseData.email}`);
      console.log(`   - Action Source: ${purchaseData.actionSource}`);
      console.log(`   - Event Source URL: ${purchaseData.eventSourceUrl}`);
      console.log(`   - User Agent: ${purchaseData.userAgent}`);
    } else {
      console.error('❌ Failed to send test purchase event');
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Unexpected error occurred:');
    console.error(error);
  }
}

// Parse command line arguments and run the test
const args = parseArgs();
testFacebookPixel(args).catch(console.error);
