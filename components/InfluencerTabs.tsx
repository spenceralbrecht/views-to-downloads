'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { InfluencerVidWithTags } from '@/types/database';

interface InfluencerTabsProps {
  baseInfluencerVideos: InfluencerVidWithTags[];
  selectedVideo: string | null;
  onVideoSelect: (id: string, videoUrl: string, isCustom: boolean) => void;
  loading: boolean;
  activeTab: 'your' | 'base';
  setActiveTab: (tab: 'your' | 'base') => void;
}

export function InfluencerTabs({
  baseInfluencerVideos,
  selectedVideo,
  onVideoSelect,
  loading,
  activeTab,
  setActiveTab
}: InfluencerTabsProps) {
  const [userInfluencers, setUserInfluencers] = useState<any[]>([]);
  const [loadingUserInfluencers, setLoadingUserInfluencers] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserInfluencers() {
      try {
        setLoadingUserInfluencers(true);
        // Get the current session using auth helpers
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          setUserInfluencers([]);
          setLoadingUserInfluencers(false);
          return;
        }
        
        // Fetch the user's generated influencers
        const { data, error } = await supabase
          .from('generated_influencers')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase fetch error:', error);
          throw error;
        }
        
        console.log('Fetched user influencers:', data?.length || 0);
        setUserInfluencers(data || []);
      } catch (error) {
        console.error('Error fetching user influencers:', error);
      } finally {
        setLoadingUserInfluencers(false);
      }
    }
    
    fetchUserInfluencers();
  }, [supabase]);

  return (
    <div className="w-full">
      {/* Tab navigation - styled to match the provided image */}
      <div className="mb-6">
        <div className="flex justify-center border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('your')}
              className={`py-3 px-6 text-center relative ${
                activeTab === 'your'
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Your Influencers
              {activeTab === 'your' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('base')}
              className={`py-3 px-6 text-center relative ${
                activeTab === 'base'
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Base Influencers
              {activeTab === 'base' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'your' && (
          <div>
            {loadingUserInfluencers ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : userInfluencers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No generated influencers found.</p>
                <p className="text-sm mt-2">
                  Generate influencers in the Influencers tab to see them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {userInfluencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    onClick={() => {
                      // Format for compatibility with base influencer videos
                      onVideoSelect(influencer.id, influencer.image_url, true);
                    }}
                    className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden aspect-[9/16] ${
                      selectedVideo === influencer.id
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                        : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
                    }`}
                  >
                    <Image
                      src={influencer.image_url}
                      alt={influencer.name || 'Generated influencer'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 15vw"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                      <p className="text-white text-xs truncate">{influencer.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'base' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : baseInfluencerVideos.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No base influencer videos available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {baseInfluencerVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      console.log('Selected video:', video);
                      onVideoSelect(video.id, video.video_url, false);
                    }}
                    className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden aspect-[9/16] ${
                      selectedVideo === video.id
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                        : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
                    }`}
                  >
                    <img
                      src={video.thumbnail_url}
                      alt={video.title || `Influencer Video`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 