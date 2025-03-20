// Database types for the application

// Existing database types...

// Influencer Videos Types
export interface InfluencerVid {
  id: string;
  created_at: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string;
  title?: string;
  description?: string;
}

export interface Tag {
  id: string;
  created_at: string;
  name: string;
  category?: string;
}

export interface InfluencerVidTag {
  id: string;
  influencer_vid_id: string;
  tag_id: string;
}

export interface InfluencerVidWithTags extends InfluencerVid {
  tags: Tag[];
}
