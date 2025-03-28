'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { Loader2, Plus } from 'lucide-react';
import { InfluencerVidWithTags } from '@/types/database';
import React from 'react';
import Link from 'next/link';

interface InfluencerTabsProps {
  baseInfluencerVideos: InfluencerVidWithTags[];
  selectedVideo: string | null;
  onVideoSelect: (id: string, videoUrl: string, isCustom: boolean) => void;
  loading: boolean;
  activeTab: 'your' | 'base';
  setActiveTab: (tab: 'your' | 'base') => void;
  filterTagsComponent?: React.ReactNode;
}

export function InfluencerTabs({
  baseInfluencerVideos,
  selectedVideo,
  onVideoSelect,
  loading,
  activeTab,
  setActiveTab,
  filterTagsComponent
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
      {/* Tab navigation - redesigned for dark mode */}
      <div className="mb-0">
        <div className="flex space-x-1 p-1 bg-gray-800/40 rounded-lg">
          <button
            onClick={() => setActiveTab('base')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'base'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Base Influencers
          </button>
          <button
            onClick={() => setActiveTab('your')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'your'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Your Influencers
          </button>
        </div>
      </div>

      {/* Render Filter Tags if provided */}
      {filterTagsComponent && <div className="mt-3 mb-4">{filterTagsComponent}</div>}

      {/* Tab content */}
      <div className="tab-content mt-4">
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
                    className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 rounded-lg overflow-hidden aspect-[9/16] ${
                      selectedVideo === influencer.id
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-gray-900'
                        : 'hover:ring-2 hover:ring-primary/70 hover:ring-offset-1 hover:ring-offset-gray-900'
                    }`}
                  >
                    <Image
                      src={influencer.image_url}
                      alt={influencer.name || 'Generated influencer'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 15vw"
                    />
                  </div>
                ))}
                
                {/* Create New Custom Influencer Card */}
                <Link href="/dashboard/influencers" passHref>
                  <div className="relative flex-shrink-0 cursor-pointer transition-all duration-200 rounded-lg overflow-hidden aspect-[9/16] bg-gray-800/60 hover:bg-gray-800/80 border-2 border-dashed border-gray-600 hover:border-primary flex flex-col items-center justify-center text-center p-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs text-gray-300">Create a new custom influencer</span>
                  </div>
                </Link>
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
                    className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 rounded-lg overflow-hidden aspect-[9/16] ${
                      selectedVideo === video.id
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-gray-900'
                        : 'hover:ring-2 hover:ring-primary/70 hover:ring-offset-1 hover:ring-offset-gray-900'
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