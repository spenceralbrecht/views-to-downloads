export const config = {
  runtime: 'edge',
  regions: ['sfo1'], // Adjust this to your preferred region
  api: {
    bodyParser: false // Disable body parsing, we need the raw body for webhook signature verification
  }
}
