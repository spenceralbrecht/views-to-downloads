import { useState } from 'react';
import { createInfluencerVid, getOrCreateTag, addTagsToVideo } from '../utils/influencerVideos';
import { Tag } from './ui/Tag';

interface AddInfluencerVideoFormProps {
  onVideoAdded: () => void;
}

export default function AddInfluencerVideoForm({ onVideoAdded }: AddInfluencerVideoFormProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleAddTag() {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!videoUrl || !thumbnailUrl) {
      setError('Video URL and thumbnail URL are required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create the video
      const video = await createInfluencerVid({
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        title: title || undefined,
        description: description || undefined
      });
      
      if (!video) {
        throw new Error('Failed to create video');
      }
      
      // Add tags if any
      if (tags.length > 0) {
        const tagObjects = await Promise.all(
          tags.map(tagName => getOrCreateTag(tagName))
        );
        
        const validTagIds = tagObjects
          .filter(tag => tag !== null)
          .map(tag => tag!.id);
          
        if (validTagIds.length > 0) {
          await addTagsToVideo(video.id, validTagIds);
        }
      }
      
      // Reset form
      setVideoUrl('');
      setThumbnailUrl('');
      setTitle('');
      setDescription('');
      setTags([]);
      
      // Notify parent
      onVideoAdded();
    } catch (err) {
      console.error('Error adding influencer video:', err);
      setError('Failed to add video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle pressing Enter in the tag input
  function handleTagInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Video URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://example.com/video.mp4"
          required
          className="w-full border rounded p-2 text-sm"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Thumbnail URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://example.com/thumbnail.jpg"
          required
          className="w-full border rounded p-2 text-sm"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video title"
          className="w-full border rounded p-2 text-sm"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Video description"
          rows={3}
          className="w-full border rounded p-2 text-sm"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add tag and press Enter"
            className="flex-grow border rounded p-2 text-sm"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || isSubmitting}
            className="bg-gray-200 px-3 py-1 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <Tag
              key={index}
              label={tag}
              onRemove={() => handleRemoveTag(tag)}
            />
          ))}
          {tags.length === 0 && (
            <p className="text-gray-500 text-xs">No tags added yet</p>
          )}
        </div>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !videoUrl || !thumbnailUrl}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Video'}
        </button>
      </div>
    </form>
  );
}
