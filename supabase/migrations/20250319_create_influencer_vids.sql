-- Create the influencer_vids table
CREATE TABLE influencer_vids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  title TEXT,
  description TEXT
);

-- Create RLS policies for influencer_vids
ALTER TABLE influencer_vids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own videos" 
  ON influencer_vids FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own videos" 
  ON influencer_vids FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" 
  ON influencer_vids FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" 
  ON influencer_vids FOR DELETE 
  USING (auth.uid() = user_id);

-- Create the tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

-- Create the junction table
CREATE TABLE influencer_vid_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_vid_id UUID REFERENCES influencer_vids(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(influencer_vid_id, tag_id)
);

-- Create RLS policies for the junction table
ALTER TABLE influencer_vid_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own video tags" 
  ON influencer_vid_tags FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM influencer_vids 
    WHERE id = influencer_vid_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can insert their own video tags" 
  ON influencer_vid_tags FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM influencer_vids 
    WHERE id = influencer_vid_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can delete their own video tags" 
  ON influencer_vid_tags FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM influencer_vids 
    WHERE id = influencer_vid_id AND user_id = auth.uid()
  ));

-- Create function to find videos with all specified tags
CREATE OR REPLACE FUNCTION get_videos_with_all_tags(tag_ids UUID[])
RETURNS SETOF influencer_vids AS $$
BEGIN
  RETURN QUERY
  SELECT v.*
  FROM influencer_vids v
  WHERE (
    SELECT COUNT(DISTINCT tag_id)
    FROM influencer_vid_tags
    WHERE influencer_vid_id = v.id AND tag_id = ANY(tag_ids)
  ) = array_length(tag_ids, 1);
END;
$$ LANGUAGE plpgsql;
