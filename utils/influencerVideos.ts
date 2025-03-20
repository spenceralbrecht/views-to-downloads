import { supabase } from '../lib/supabase';
import { InfluencerVid, Tag, InfluencerVidWithTags } from '../types/database';

// Create a new influencer video
export async function createInfluencerVid(
  videoData: Omit<InfluencerVid, 'id' | 'created_at' | 'user_id'>
): Promise<InfluencerVid | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('influencer_vids')
    .insert({
      ...videoData,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating influencer video:', error);
    return null;
  }
  
  return data;
}

// Get or create a tag
export async function getOrCreateTag(tagName: string, category?: string): Promise<Tag | null> {
  // First try to get the tag
  const normalizedTag = tagName.toLowerCase().trim();
  let { data, error } = await supabase
    .from('tags')
    .select()
    .eq('name', normalizedTag)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching tag:', error);
    return null;
  }
  
  // If tag doesn't exist, create it
  if (!data) {
    const { data: newTag, error: createError } = await supabase
      .from('tags')
      .insert({ name: normalizedTag, category })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating tag:', createError);
      return null;
    }
    
    return newTag;
  }
  
  return data;
}

// Add tags to a video
export async function addTagsToVideo(videoId: string, tagIds: string[]): Promise<boolean> {
  const tagLinks = tagIds.map(tagId => ({
    influencer_vid_id: videoId,
    tag_id: tagId
  }));
  
  const { error } = await supabase
    .from('influencer_vid_tags')
    .insert(tagLinks);
    
  if (error) {
    console.error('Error adding tags to video:', error);
    return false;
  }
  
  return true;
}

// Get all available tags
export async function getAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
  
  return data || [];
}

// Get all influencer videos with their tags
export async function getInfluencerVidsWithTags(): Promise<InfluencerVidWithTags[]> {
  const { data: videos, error } = await supabase
    .from('influencer_vids')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error || !videos) {
    console.error('Error fetching videos:', error);
    return [];
  }
  
  // For each video, get its tags
  const videosWithTags: InfluencerVidWithTags[] = await Promise.all(
    videos.map(async (video: InfluencerVid) => {
      const { data: videoTags } = await supabase
        .from('influencer_vid_tags')
        .select('tag_id, tags(*)')
        .eq('influencer_vid_id', video.id);
        
      return {
        ...video,
        tags: videoTags?.map(vt => vt.tags as unknown as Tag) || []
      };
    })
  );
  
  return videosWithTags;
}

// Find videos by tag names
export async function findVideosByTags(tagNames: string[]): Promise<InfluencerVidWithTags[]> {
  if (!tagNames.length) {
    return getInfluencerVidsWithTags();
  }

  // Get the tag IDs first
  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .in('name', tagNames.map(name => name.toLowerCase().trim()));
    
  if (tagError || !tags || tags.length === 0) {
    console.error('Error fetching tags:', tagError);
    return [];
  }
  
  const tagIds = tags.map(t => t.id);
  
  // Find videos that have ALL the specified tags
  const { data, error } = await supabase.rpc('get_videos_with_all_tags', {
    tag_ids: tagIds
  });
  
  if (error) {
    console.error('Error finding videos by tags:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // For each video, get its tags
  const videosWithTags: InfluencerVidWithTags[] = await Promise.all(
    data.map(async (video: InfluencerVid) => {
      const { data: videoTags } = await supabase
        .from('influencer_vid_tags')
        .select('tag_id, tags(*)')
        .eq('influencer_vid_id', video.id);
        
      return {
        ...video,
        tags: videoTags?.map(vt => vt.tags as unknown as Tag) || []
      };
    })
  );
  
  return videosWithTags;
}

// Remove tag from video
export async function removeTagFromVideo(videoId: string, tagId: string): Promise<boolean> {
  const { error } = await supabase
    .from('influencer_vid_tags')
    .delete()
    .match({ influencer_vid_id: videoId, tag_id: tagId });
    
  if (error) {
    console.error('Error removing tag from video:', error);
    return false;
  }
  
  return true;
}
