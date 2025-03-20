import { useState, useEffect } from 'react';
import { Tag as TagType } from '../types/database';
import { getAllTags, getOrCreateTag, addTagsToVideo, removeTagFromVideo } from '../utils/influencerVideos';
import { Tag } from './ui/Tag';

interface TagSelectorProps {
  videoId: string;
  existingTags: TagType[];
  onTagsUpdated: () => void;
}

export default function TagSelector({ videoId, existingTags, onTagsUpdated }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    const tags = await getAllTags();
    setAvailableTags(tags);
  }

  async function handleAddTag(tagId: string) {
    setIsLoading(true);
    const success = await addTagsToVideo(videoId, [tagId]);
    if (success) {
      onTagsUpdated();
    }
    setIsLoading(false);
  }

  async function handleRemoveTag(tagId: string) {
    setIsLoading(true);
    const success = await removeTagFromVideo(videoId, tagId);
    if (success) {
      onTagsUpdated();
    }
    setIsLoading(false);
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    
    setIsLoading(true);
    const tag = await getOrCreateTag(newTagName);
    if (tag) {
      await addTagsToVideo(videoId, [tag.id]);
      onTagsUpdated();
      setNewTagName('');
      loadTags();
    }
    setIsLoading(false);
  }

  // Check if a tag is already applied to this video
  const isTagApplied = (tagId: string) => {
    return existingTags.some(tag => tag.id === tagId);
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Tags</h3>
      
      {/* Existing tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {existingTags.map(tag => (
          <Tag 
            key={tag.id} 
            label={tag.name}
            onRemove={() => handleRemoveTag(tag.id)}
          />
        ))}
        {existingTags.length === 0 && (
          <p className="text-gray-500 text-xs">No tags added yet</p>
        )}
      </div>
      
      {/* Add new tag form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Add new tag..."
          className="border rounded px-3 py-2 text-sm flex-grow"
          disabled={isLoading}
        />
        <button
          onClick={handleCreateTag}
          disabled={isLoading || !newTagName.trim()}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300"
        >
          Add
        </button>
      </div>
      
      {/* Available tags */}
      <div>
        <h4 className="text-xs font-medium mb-2">Available Tags</h4>
        <div className="flex flex-wrap gap-2">
          {availableTags
            .filter(tag => !isTagApplied(tag.id))
            .map(tag => (
              <Tag
                key={tag.id}
                label={tag.name}
                interactive={true}
                onClick={() => handleAddTag(tag.id)}
              />
            ))}
          {availableTags.filter(tag => !isTagApplied(tag.id)).length === 0 && (
            <p className="text-gray-500 text-xs">No more tags available</p>
          )}
        </div>
      </div>
    </div>
  );
}
