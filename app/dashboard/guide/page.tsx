import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 gradient-text">Guide to Virality</h1>
      <p className="text-muted-foreground mb-8">
        A comprehensive guide to help you achieve viral growth on social media platforms.
      </p>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Warming Up Your Account</CardTitle>
            <CardDescription>Building a strong foundation for your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Start with consistent, quality content to establish your account's credibility:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post 1-3 times daily for at least 2-3 days</li>
              <li>Engage with similar content in your niche</li>
              <li>Maintain high completion rates by keeping videos under 30 seconds</li>
              <li>Use trending sounds and music in your niche</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Identify Winning Formats</CardTitle>
            <CardDescription>Understanding what works in your niche</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Research and analyze successful content in your space:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Study top-performing videos in your niche</li>
              <li>Note common hooks, transitions, and storytelling patterns</li>
              <li>Analyze video length, style, and editing techniques</li>
              <li>Save successful videos for reference and inspiration</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Post, Post, Post</CardTitle>
            <CardDescription>Maintaining consistency and volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Volume is key to finding what resonates with your audience:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aim for at least 3-5 posts per day</li>
              <li>Test different posting times</li>
              <li>Batch create content to maintain consistency</li>
              <li>Use our AI to generate multiple variations of successful content</li>
            </ul>
            
            <div className="mt-6">
              <img 
                src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/demo-posting-same-format.png" 
                alt="Account posting the same format multiple times" 
                className="rounded-lg w-full mb-4"
              />
              <p className="text-sm text-muted-foreground">
                <strong>Persistence pays off:</strong> Many successful accounts post the same format 100+ times 
                with small tweaks, and it still performs well. Success requires volume and persistence. 
                Don't get discouraged if you don't see a viral video within your first 5, 10, or even 20 posts. 
                Keep refining and posting consistently.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Analyze and Iterate</CardTitle>
            <CardDescription>Learning from your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Use analytics to refine your strategy:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Track watch time and completion rates</li>
              <li>Identify patterns in your viral content</li>
              <li>Double down on what works</li>
              <li>Test new hooks while maintaining successful formats</li>
            </ul>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Pro Tip:</strong> When you find a winning format, use our AI to create multiple
                variations while keeping the core elements that made it successful.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 