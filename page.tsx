import { Button } from "@/components/ui/button"
import { Power, Play, X, Check, Video, Image, Megaphone, User, Sparkles, Camera, Clock, Share2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { LoginModal } from "@/components/LoginModal"
import { useState, useRef, useEffect } from 'react'

function VideoThumbnail({ src, index }: { src: string; index: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));
    }
  }, []);

  const handlePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="relative flex-none w-[180px] snap-center">
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          preload="metadata"
          playsInline
          loop
          muted
        />
        <div 
          className={`absolute inset-0 flex items-center justify-center ${isPlaying ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-40'}`}
          onClick={handlePlay}
        >
          {!isPlaying && (
            <button
              className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center"
              aria-label={`Play demo video ${index + 1}`}
            >
              <Play className="h-6 w-6 text-white" fill="white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleStartNow = () => {
    setIsLoginModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-gray-950">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Automate TikToks that drive traffic to your website
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10">
            it&apos;s like a gen z marketing team, but way cheaper
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#4287f5] hover:bg-[#3276e4] text-white rounded-full px-8 py-6 text-lg"
              onClick={handleStartNow}
            >
              <Power className="mr-2 h-5 w-5" />
              Start Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 py-6 text-lg bg-white"
            >
              <Play className="mr-2 h-5 w-5" />
              Demo
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="relative w-full max-w-5xl mx-auto px-4 mb-24">
          <div className="flex gap-4 overflow-x-auto pb-8 px-6 snap-x snap-mandatory -mx-4">
            {[
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-1.mp4",
              "https://views-to-downloads.s3.us-east-2.amazonaws.com/video-demo-2.mp4",
              "https://uwy5fs2ngvq04srq.public.blob.vercel-storage.com/video-demo-3-lDp09BTh8jmjQZLS6OkvuMyvL57qKC.mp4",
              "https://uwy5fs2ngvq04srq.public.blob.vercel-storage.com/video-demo-4-mjJaMZCDzgwowGeUH0INn3tsDPwiYk.mp4",
              "https://uwy5fs2ngvq04srq.public.blob.vercel-storage.com/video-demo-5-jKidBLZzEiAbZxhkB0BozsNXKk816Y.mp4"
            ].map((src, index) => (
              <VideoThumbnail key={index} src={src} index={index} />
            ))}
          </div>
          {/* Gradient Fade Edges */}
          <div className="absolute left-0 top-0 bottom-8 w-12 bg-gradient-to-r from-[#fafafa] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-[#fafafa] to-transparent pointer-events-none" />
        </div>

        {/* Alternatives Section */}
        <section className="max-w-5xl mx-auto mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Don't waste another dollar on a failed influencer campaign</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-red-50 border-red-100">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>UGC Agencies</CardTitle>
                  <X className="h-5 w-5 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">Expensive, $60-120 per video, anywhere between $4000 to $6000 a month.</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-100">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Doing it yourself</CardTitle>
                  <X className="h-5 w-5 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">Researching, planning, iterating, recording, editing, publishing, re-purposing</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>ReelFarm</CardTitle>
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-green-600">Automatically creating & publishing videos to all platforms, for a monthly subscription</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-5xl mx-auto mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Video className="h-8 w-8 mb-2 text-blue-500" />
                <CardTitle>Create UGC videos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create content that drives downloads for your app</p>
              </CardContent>
            </Card>
            <Card className="relative">
              <CardHeader>
                <Image className="h-8 w-8 mb-2 text-green-500" />
                <CardTitle>Create slideshow videos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create image slideshow videos for your appk</p>
              </CardContent>
              <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                Not Available Yet
              </div>
            </Card>
            <Card>
              <CardHeader>
                <Megaphone className="h-8 w-8 mb-2 text-green-500" />
                <CardTitle>Automated Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Automatically create & auto-publish UGC videos to your TikTok account</p>
              </CardContent>
            </Card>
            <Card className="relative">
              <CardHeader>
                <User className="h-8 w-8 mb-2 text-purple-500" />
                <CardTitle>UGC Avatar Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Automatically generate and save viral hooks for your apps</p>
              </CardContent>
              <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                Not Available Yet
              </div>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 mb-2 text-amber-500" />
                <CardTitle>Hook Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Automatically generate and save viral hooks for your apps</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Choose your plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "15",
                videos: "10",
                popular: false,
                features: [
                  { text: "10 videos per month", icon: Video, enabled: true },
                  { text: "Limited UGC avatars", icon: Camera, enabled: true },
                  { text: "Generate unlimited viral hooks", icon: Sparkles, enabled: true },
                ],
              },
              {
                name: "Growth",
                price: "35",
                videos: "50",
                popular: true,
                features: [
                  { text: "50 videos per month", icon: Video, enabled: true },
                  { text: "All 50+ UGC avatars", icon: Camera, enabled: true },
                  { text: "Generate unlimited viral hooks", icon: Sparkles, enabled: true },
                ],
              },
              {
                name: "Scale",
                price: "65",
                videos: "150",
                popular: false,
                features: [
                  { text: "150 videos per month", icon: Video, enabled: true },
                  { text: "All 50+ UGC avatars", icon: Camera, enabled: true },
                  { text: "Generate unlimited viral hooks", icon: Sparkles, enabled: true },
                ],
              },
            ].map((plan) => (
              <div key={plan.name} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-[#4287f5] text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <Card className={`h-full ${plan.popular ? 'border-[#4287f5] border-2' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">{plan.name}</CardTitle>
                    <div className="text-center">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <div className="text-center text-gray-600 mt-2">
                      {plan.videos} videos per month
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-px bg-gray-200 my-4" />
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <feature.icon className={`h-5 w-5 ${feature.enabled ? 'text-gray-900' : 'text-gray-400'}`} />
                        <span className={feature.enabled ? 'text-gray-900' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                    <Button 
                      className={`w-full mt-6 ${
                        plan.popular 
                          ? 'bg-[#4287f5] hover:bg-[#3276e4] text-white' 
                          : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

