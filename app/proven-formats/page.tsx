'use client'

import { useState, useEffect } from 'react'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { FormatCard } from "@/components/FormatCard"
import { ViralFormatModal } from "@/components/ViralFormatModal"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
// Keep Card imports if needed for other elements on the page in the future
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

// Define the structure for a video example
interface VideoExample {
  url: string
  platform: "tiktok" | "instagram"
  views: number
  view_url: string // This seems to be the actual video source URL for the preview
}

// Define the structure for a format, matching ViralFormatModal
interface Format {
  id: string; // Added ID
  name: string;
  difficulty: string;
  description: string; // Keep basic description for the card
  how_it_works: string; // Added for modal
  requires: string[]; // Added for modal
  examples: VideoExample[]; // Added for modal
}

export default function ProvenFormatsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [formats, setFormats] = useState<Format[]>([]);
  const [isLoadingFormats, setIsLoadingFormats] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFormats = async () => {
      setIsLoadingFormats(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from('formats')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }
        
        // Log the fetched data to inspect its structure
        console.log("Fetched formats data:", data);
        data?.forEach((f, index) => {
          console.log(`Format ${index} examples type:`, typeof f.examples, 'Value:', f.examples);
        });

        setFormats(data || []); 
      } catch (error: any) {
        console.error("Error fetching formats:", error);
        setFetchError("Failed to load formats. Please try refreshing the page.");
        setFormats([]);
      } finally {
        setIsLoadingFormats(false);
      }
    };

    fetchFormats();
  }, [supabase]);

  const handleCardClick = (format: Format) => {
    setSelectedFormat(format);
    setIsModalOpen(true);
  };

  const handleGoogleSignIn = async () => {
    setIsCtaLoading(true);
    console.log("Initiating sign-in...");
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setIsCtaLoading(false);
    console.log("Sign-in attempt finished.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Add background gradients like landing page */}
      <div className="fixed inset-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 -z-10"></div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] -right-[30%] w-[120%] h-[120%] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[30%] w-[120%] h-[120%] rounded-full bg-purple-500/5 blur-3xl"></div>
      </div>

      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="mb-10 pb-6 border-b border-border">
            <h1 className="text-4xl font-bold mb-4 gradient-text">Proven Formats</h1>
            <p className="text-textMuted text-lg max-w-3xl">
              Explore high-performing content formats designed to capture attention and drive app downloads.
            </p>
          </div>

          {isLoadingFormats ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-20 text-red-600">
              <p>{fetchError}</p>
            </div>
          ) : formats.length === 0 ? (
             <div className="text-center py-20 text-muted-foreground">
              <p>No formats found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {formats.map((format) => (
                <FormatCard 
                  key={format.id} 
                  format={format} 
                  onClick={() => handleCardClick(format)} 
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Final CTA Section - Replicated from landing page structure */}
        <div className="max-w-4xl mx-auto text-center py-16 mb-16 relative px-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl z-0 mx-4"></div>
          <div className="relative z-10 p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Ready to Create High-Converting Content?</h2>
            <p className="text-base sm:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Use these proven formats with our AI tools to generate engaging videos in minutes.
            </p>
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isCtaLoading}
              size="lg" 
              className="rounded-full px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              {isCtaLoading ? "Connecting..." : "Try the Video Generator Now"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />

      {/* Conditionally render modal */}
      {selectedFormat && (
        <ViralFormatModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          format={selectedFormat}
        />
      )}
    </div>
  );
} 