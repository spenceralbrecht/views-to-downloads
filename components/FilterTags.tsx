'use client';

import { useEffect, useState } from 'react';
import { Tag as TagType } from '../types/database';
import { Tag } from './ui/Tag';
import { getAllTags } from '../utils/influencerVideos';
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterTagsProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  tags?: TagType[]; 
}

export default function FilterTags({ selectedTags, onChange, tags }: FilterTagsProps) {
  const [availableTags, setAvailableTags] = useState<TagType[]>(tags || []);
  const [isLoading, setIsLoading] = useState(!tags);

  useEffect(() => {
    if (tags) {
      setAvailableTags(tags);
      setIsLoading(false);
    } else {
      loadTags();
    }
  }, [tags]);

  async function loadTags() {
    if (tags) return; 
    
    setIsLoading(true);
    try {
      const tags = await getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleTag = (tagId: string) => {
    let newSelectedTags: string[];
    
    if (selectedTags.includes(tagId)) {
      newSelectedTags = selectedTags.filter(id => id !== tagId);
    } else {
      newSelectedTags = [...selectedTags, tagId];
    }
    
    onChange(newSelectedTags);
  };

  const isTagSelected = (tagId: string) => {
    return selectedTags.includes(tagId);
  };

  const clearAllTags = () => {
    onChange([]);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        {selectedTags.length > 0 && (
          <button 
            onClick={clearAllTags}
            className="text-xs text-primary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading tags...</div>
        ) : availableTags.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tags available</div>
        ) : (
          availableTags.map(tag => (
            <Badge
              key={tag.id}
              variant={isTagSelected(tag.id) ? "default" : "outline"}
              className={`cursor-pointer ${isTagSelected(tag.id) ? '' : 'hover:bg-primary/10'}`}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
              {isTagSelected(tag.id) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
