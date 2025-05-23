import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-10 pb-6 border-b border-border">
        <h1 className="text-4xl font-bold mb-4 gradient-text">Guide to Virality</h1>
        <p className="text-textMuted text-lg max-w-3xl">
          A comprehensive guide to help you achieve viral growth on social media platforms.
        </p>
      </div>

      <div className="space-y-8">
        <Card className="border-border bg-card hover-primary border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-semibold">!</div>
              <CardTitle>Avoiding Bot-Like Behavior</CardTitle>
              <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-500 rounded">CRITICAL</span>
            </div>
            <CardDescription>Essential practices to maintain reach and avoid algorithmic penalties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Social media algorithms are sophisticated at detecting inauthentic behavior. Follow these critical guidelines:</p>
            <ul className="list-disc pl-6 space-y-3 text-textMuted">
              <li>
                <span className="text-text font-semibold">Never post duplicate content:</span> Platforms can detect identical videos, even across accounts. Always create unique content or significantly modify existing videos by changing metadata, file names, and re-exporting. This is especially crucial on Instagram and TikTok.
              </li>
              <li>
                <span className="text-text font-semibold">Post strategically, not excessively:</span> Limit posts to 1-4 times daily with at least 3+ hours between uploads. Accounts that only post without genuine platform engagement appear bot-like.
              </li>
              <li>
                <span className="text-text font-semibold">Engage authentically:</span> Like, save, and comment on content related to your target audience. This helps algorithms understand your niche and proves you're a real user, not a bot.
              </li>
              <li>
                <span className="text-text font-semibold">Warm up new accounts properly:</span> For the first 48 hours, don't post anything. Instead, scroll, interact, and behave like a genuine user interested in your niche. Start posting slowly after this period—begin with 1 post daily for the first week.
              </li>
              <li>
                <span className="text-text font-semibold">Limit accounts per device:</span> Never manage more than 3 accounts on a single phone. Platforms can detect when multiple accounts are being operated from the same device, which triggers bot detection algorithms and can result in all associated accounts being penalized.
              </li>
            </ul>
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-textMuted">
                <strong className="text-red-500">Warning:</strong> Violating these guidelines can result in severe reach suppression or shadowbanning. 
                Algorithm trust is hard to regain once lost, especially on TikTok where audience targeting becomes nearly impossible to change.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">1</div>
              <CardTitle>Identify Winning Formats</CardTitle>
            </div>
            <CardDescription>Understanding what works in your niche</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Research and analyze successful content in your space:</p>
            <ul className="list-disc pl-6 space-y-2 text-textMuted">
              <li><span className="text-text">Study top-performing videos</span> in your niche</li>
              <li><span className="text-text">Note common hooks, transitions,</span> and storytelling patterns</li>
              <li><span className="text-text">Analyze video length, style,</span> and editing techniques</li>
              <li><span className="text-text">Save successful videos</span> for reference and inspiration</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">2</div>
              <CardTitle>Post, Post, Post</CardTitle>
            </div>
            <CardDescription>Maintaining consistency and volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Volume is key to finding what resonates with your audience:</p>
            <ul className="list-disc pl-6 space-y-2 text-textMuted">
              <li><span className="text-text">Aim for at least 3-5 posts</span> per day</li>
              <li><span className="text-text">Test different posting times</span> for optimal reach</li>
              <li><span className="text-text">Batch create content</span> to maintain consistency</li>
              <li><span className="text-text">Use our AI</span> to generate multiple variations of successful content</li>
            </ul>
            
            <div className="mt-6">
              <img 
                src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/demo-posting-same-format.png" 
                alt="Account posting the same format multiple times" 
                className="rounded-lg w-full mb-4"
              />
              <p className="text-sm text-textMuted">
                <strong>Persistence pays off:</strong> Many successful accounts post the same format 100+ times 
                with small tweaks, and it still performs well. Success requires volume and persistence. 
                Don't get discouraged if you don't see a viral video within your first 5, 10, or even 20 posts. 
                Keep refining and posting consistently.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">3</div>
              <CardTitle>Analyze and Iterate</CardTitle>
            </div>
            <CardDescription>Learning from your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Use analytics to refine your strategy:</p>
            <ul className="list-disc pl-6 space-y-2 text-textMuted">
              <li><span className="text-text">Track watch time</span> and completion rates</li>
              <li><span className="text-text">Identify patterns</span> in your viral content</li>
              <li><span className="text-text">Double down</span> on what works</li>
              <li><span className="text-text">Test new hooks</span> while maintaining successful formats</li>
            </ul>
            <div className="mt-6 p-4 bg-card border border-border rounded-lg">
              <p className="text-sm text-textMuted">
                <strong className="text-primary">Pro Tip:</strong> When you find a winning format, use our AI to create multiple
                variations while keeping the core elements that made it successful.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="mt-12 rounded-lg p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
        <h2 className="text-2xl font-bold mb-4">Ready to Go Viral?</h2>
        <p className="text-textMuted mb-6">
          Start applying these strategies today using our AI tools to create viral content that drives downloads.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/dashboard/create" className="btn-gradient inline-block text-center">
            Create Viral Content
          </a>
          <a href="/dashboard/hooks" className="btn-outline inline-block text-center">
            Generate Hooks
          </a>
        </div>
      </div>
    </div>
  )
} 