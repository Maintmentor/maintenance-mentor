-- Image Cache System Migration
-- Stores cached product images and analytics

-- Table for cached images metadata
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  search_query_normalized TEXT NOT NULL, -- lowercase, trimmed for matching
  image_url TEXT NOT NULL, -- Original Google image URL
  cached_url TEXT NOT NULL, -- Supabase storage URL
  cache_key TEXT UNIQUE NOT NULL, -- Hash of normalized query
  file_path TEXT NOT NULL, -- Path in Supabase storage
  file_size BIGINT, -- Size in bytes
  mime_type TEXT DEFAULT 'image/jpeg',
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN DEFAULT true
);

-- Table for cache analytics
CREATE TABLE IF NOT EXISTS image_cache_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  search_query TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'hit', 'miss', 'refresh', 'expired'
  response_time_ms INTEGER,
  source TEXT, -- 'cache' or 'google_api'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cache_query_normalized ON image_cache(search_query_normalized);
CREATE INDEX idx_cache_key ON image_cache(cache_key);
CREATE INDEX idx_cache_expires ON image_cache(expires_at) WHERE is_active = true;
CREATE INDEX idx_cache_hit_count ON image_cache(hit_count DESC);
CREATE INDEX idx_analytics_created ON image_cache_analytics(created_at DESC);
CREATE INDEX idx_analytics_event_type ON image_cache_analytics(event_type);

-- Function to update hit count and last accessed
CREATE OR REPLACE FUNCTION update_cache_hit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE image_cache
  SET hit_count = hit_count + 1,
      last_accessed_at = NOW()
  WHERE cache_key = NEW.cache_key
    AND NEW.event_type = 'hit';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update hit counts
CREATE TRIGGER trigger_update_cache_hit
AFTER INSERT ON image_cache_analytics
FOR EACH ROW
EXECUTE FUNCTION update_cache_hit();

-- Enable RLS
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to active cache"
  ON image_cache FOR SELECT
  USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Allow authenticated users to insert cache"
  ON image_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to cache"
  ON image_cache FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow public insert to analytics"
  ON image_cache_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read analytics"
  ON image_cache_analytics FOR SELECT
  TO authenticated
  USING (true);
