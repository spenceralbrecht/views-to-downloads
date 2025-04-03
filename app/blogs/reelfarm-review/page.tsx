'use client'

import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download } from 'lucide-react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function ReelfarmReviewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 -z-10"></div>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] -right-[30%] w-[120%] h-[120%] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[30%] w-[120%] h-[120%] rounded-full bg-purple-500/5 blur-3xl"></div>
        <div className="absolute top-[40%] left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>
      
      <header className="py-4 px-4 md:px-6 flex items-center justify-between bg-transparent">
        <Link href="/" className="flex items-center space-x-2">
          <Download className="h-6 w-6 text-[#4287f5]" />
          <span className="text-xl font-bold">Views to Downloads</span>
        </Link>
        <Button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="rounded-full px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? "Connecting..." : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </header>
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article className="mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-10 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-center">
              ReelFarm Review: Automated TikTok Video Creation
            </h1>
            
            <div className="w-full mb-10 relative">
              <div className="relative bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
                <Image
                  src="https://pub-a027e435822042eb96a9208813b48997.r2.dev/reelfarm-screenshot.png"
                  alt="ReelFarm platform screenshot"
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10">
              In the dynamic world of social media marketing, creating engaging and consistent content can be a significant challenge for businesses and content creators. ReelFarm offers an innovative solution by automating the production of TikTok videos. This article provides an in-depth review of ReelFarm's features, pricing, and a comparison with other platforms, highlighting ViewsToDownloads.com as a notable alternative.
            </p>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 mt-10 text-gray-900 dark:text-gray-100">
              What is ReelFarm?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              ReelFarm is an automated marketing platform designed to simplify the creation and publishing of user-generated content (UGC) videos, focusing primarily on TikTok. It offers a suite of AI-powered tools that enable users to produce professional-quality videos with minimal effort, positioning itself as a cost-effective alternative to traditional UGC agencies or the time-intensive process of manual content creation.
            </p>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 mt-10 text-gray-900 dark:text-gray-100">
              Key Features of ReelFarm
            </h2>
            <ul className="list-disc pl-6 space-y-3 text-lg text-gray-700 dark:text-gray-300 mb-8">
              <li><strong className="font-semibold">"Hook + Demo" Video Creation:</strong> Enables users to create and publish UGC videos that promote product demonstrations, enhancing audience engagement.</li>
              <li><strong className="font-semibold">UGC Avatar Generator:</strong> Allows for the creation of custom AI avatars tailored for UGC "hook + demo" video formats, adding a personalized touch to content.</li>
              <li><strong className="font-semibold">Automated Campaigns:</strong> Facilitates automatic creation and publishing of UGC videos directly to a user's TikTok account, streamlining the content distribution process.</li>
              <li><strong className="font-semibold">Hook Generator:</strong> An AI-powered tool that generates and saves viral hooks for videos, aiming to increase viewer retention and engagement.</li>
              <li><strong className="font-semibold">Slideshow Video Creation:</strong> Enables users to create and publish image slideshow videos to TikTok, diversifying content types.</li>
            </ul>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 mt-10 text-gray-900 dark:text-gray-100">
              Pricing Plans
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              ReelFarm offers three subscription tiers:
            </p>
            <ol className="list-decimal pl-6 space-y-6 text-lg text-gray-700 dark:text-gray-300 mb-8">
              <li>
                <strong className="text-xl font-semibold">Starter Plan ($19/month):</strong>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>10 videos per month</li>
                  <li>Access to all 200+ UGC avatars</li>
                  <li>Unlimited viral hook generation</li>
                  <li>Creation of custom AI avatars (25 images and 5 videos)</li>
                  <li>TikTok publishing and scheduling/automation features</li>
                </ul>
              </li>
              <li>
                <strong className="text-xl font-semibold">Growth Plan ($49/month):</strong>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>50 videos per month</li>
                  <li>All features included in the Starter Plan</li>
                  <li>Enhanced custom AI avatar creation (100 images and 25 videos)</li>
                </ul>
              </li>
              <li>
                <strong className="text-xl font-semibold">Scale Plan ($95/month):</strong>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>150 videos per month</li>
                  <li>All features included in the Growth Plan</li>
                  <li>Expanded custom AI avatar creation (200 images and 50 videos)</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 mt-10 text-gray-900 dark:text-gray-100">
              Pros and Cons
            </h2>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Pros:
            </h3>
            <ul className="list-disc pl-6 space-y-3 text-lg text-gray-700 dark:text-gray-300 mb-6">
              <li><strong className="font-semibold">Cost-Effective:</strong> ReelFarm provides an affordable alternative to traditional UGC agencies, which can charge between $60 to $120 per video.</li>
              <li><strong className="font-semibold">Automation:</strong> The platform automates various aspects of video creation and publishing, saving users significant time and effort.</li>
              <li><strong className="font-semibold">AI Avatars:</strong> Offers the ability to create custom AI avatars, adding a unique and personalized element to videos.</li>
            </ul>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Cons:
            </h3>
            <ul className="list-disc pl-6 space-y-3 text-lg text-gray-700 dark:text-gray-300 mb-8">
              <li><strong className="font-semibold">Platform Limitation:</strong> Currently, ReelFarm only supports publishing to TikTok, which may be restrictive for users aiming to distribute content across multiple social media platforms.</li>
              <li><strong className="font-semibold">Limited Customization:</strong> The platform offers pre-set templates, which might limit flexibility for users seeking more advanced video customization options.</li>
            </ul>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 mt-10 text-gray-900 dark:text-gray-100">
              Comparison with Alternatives
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              When evaluating ReelFarm against other AI-driven video creation platforms, several distinctions emerge:
            </p>
            <ul className="list-disc pl-6 space-y-5 text-lg text-gray-700 dark:text-gray-300 mb-8">
              <li>
                <strong className="text-xl font-semibold">ViewsToDownloads.com (V2D):</strong> V2D is an AI-powered platform that assists app developers and marketers in creating influencer-style UGC videos aimed at boosting app visibility and downloads. It streamlines the video creation process into three steps: inputting app details, generating AI-optimized scripts with trending video formats, and producing professional-quality UGC videos ready for distribution. V2D offers three pricing plans: Starter at $25/month for 10 videos, Growth at $35/month for 50 videos, and Scale at $65/month for 150 videos. Notably, V2D provides multi-platform support, allowing content distribution across various social media channels, unlike ReelFarm's TikTok-only focus.
              </li>
              <li>
                <strong className="text-xl font-semibold">SendShort:</strong> Unlike ReelFarm, SendShort supports multi-platform publishing, including TikTok, Instagram Reels, and YouTube Shorts. It also offers more advanced AI customization features, such as realistic voiceovers and faceless video generation. However, SendShort's pricing starts at a higher point, which may be a consideration for budget-conscious users.
              </li>
              <li>
                <strong className="text-xl font-semibold">MakeUGC:</strong> This platform provides AI-generated avatars and supports multiple languages, catering to a global audience. While it offers similar features to ReelFarm, its pricing and specific toolset may differ, making it essential for users to assess which platform aligns best with their needs.
              </li>
            </ul>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 mt-10 text-gray-900 dark:text-gray-100">
              Conclusion
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              ReelFarm presents a compelling solution for businesses and content creators looking to automate their TikTok video production. Its suite of AI-powered tools, combined with affordable pricing plans, makes it an attractive option for those seeking efficiency and cost savings. However, its current limitation to TikTok and the potential constraints in customization may prompt some users to explore alternative platforms like ViewsToDownloads.com, which offers multi-platform support and additional features tailored to app marketing. As with any tool, it's crucial to assess your specific needs and objectives to determine if ReelFarm aligns with your content creation and marketing strategies.
            </p>
          </article>
          
          {/* Final CTA Section */}
          <div className="max-w-4xl mx-auto text-center py-16 mt-16 mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl z-0"></div>
            <div className="relative z-10 p-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Automate Your UGC Content?</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of app founders and marketers saving time and money with AI-generated UGC ads.
              </p>
              <Button 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                size="lg" 
                className="rounded-full px-8 py-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? "Connecting..." : "Generate Your First AI Video Now"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 