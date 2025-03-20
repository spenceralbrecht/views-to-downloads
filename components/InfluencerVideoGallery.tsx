import { useState, useEffect } from 'react';
import { InfluencerVidWithTags, Tag } from '../types/database';
import { getInfluencerVidsWithTags, findVideosByTags, getAllTags } from '../utils/influencerVideos';
import TagSelector from './TagSelector';
import { Tag as TagComponent } from './ui/Tag';
import AddInfluencerVideoForm from './AddInfluencerVideoForm';

export default function InfluencerVideoGallery() {
  const [videos, setVideos] = useState<InfluencerVidWithTags[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadVideosAndTags();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [selectedTags]);

  async function loadVideosAndTags() {
    setIsLoading(true);
    const [videosData, tagsData] = await Promise.all([
      getInfluencerVidsWithTags(),
      getAllTags()
    ]);
    
    setVideos(videosData);
    setAllTags(tagsData);
    setIsLoading(false);
  }

  async function filterVideos() {
    if (selectedTags.length === 0) {
      loadVideosAndTags();
      return;
    }
    
    setIsLoading(true);
    const filteredVideos = await findVideosByTags(selectedTags);
    setVideos(filteredVideos);
    setIsLoading(false);
  }

  function toggleTag(tagName: string) {
    setSelectedTags(prev => 
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  }

  function handleVideoUpdated() {
    loadVideosAndTags();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Influencer Videos</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showAddForm ? 'Cancel' : 'Add New Video'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Add New Influencer Video</h2>
          <AddInfluencerVideoForm onVideoAdded={() => {
            handleVideoUpdated();
            setShowAddForm(false);
          }} />
        </div>
      )}
      
      {/* Tag filter */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Filter by Tags</h2>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <TagComponent
              key={tag.id}
              label={tag.name}
              interactive={true}
              selected={selectedTags.includes(tag.name)}
              onClick={() => toggleTag(tag.name)}
            />
          ))}
          {allTags.length === 0 && (
            <p className="text-gray-500 text-sm">No tags available</p>
          )}
        </div>
      </div>
      
      {/* Video grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <p className="text-gray-500">No videos found with the selected tags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
              <div className="aspect-video relative">
                <img 
                  src={video.thumbnail_url} 
                  alt={video.title || 'Influencer video thumbnail'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-2">{video.title || 'Untitled Video'}</h3>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {video.tags.map(tag => (
                    <TagComponent key={tag.id} label={tag.name} />
                  ))}
                </div>
                
                <TagSelector 
                  videoId={video.id} 
                  existingTags={video.tags} 
                  onTagsUpdated={handleVideoUpdated} 
                />
                
                <a 
                  href={video.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-4 bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600"
                >
                  Watch Video
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
