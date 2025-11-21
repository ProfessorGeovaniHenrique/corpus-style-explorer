-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create normalize_text function for search optimization
CREATE OR REPLACE FUNCTION public.normalize_text(text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
SET search_path TO 'public'
AS $$
  SELECT lower(unaccent(trim($1)));
$$;

-- Create uploads table
CREATE TABLE IF NOT EXISTS public.uploads (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename text NOT NULL,
    total_rows integer DEFAULT 0,
    processed_rows integer DEFAULT 0,
    status text DEFAULT 'completed',
    created_at timestamptz DEFAULT now()
);

-- Create artists table
CREATE TABLE IF NOT EXISTS public.artists (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    normalized_name text,
    genre text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    normalized_title text,
    artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    upload_id uuid REFERENCES public.uploads(id) ON DELETE SET NULL,
    composer text,
    release_year text,
    lyrics text,
    raw_data jsonb,
    status text DEFAULT 'pending',
    confidence_score integer DEFAULT 0,
    enrichment_source text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create youtube_cache table
CREATE TABLE IF NOT EXISTS public.youtube_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query text NOT NULL,
    video_id text NOT NULL,
    video_title text NOT NULL,
    channel_title text NOT NULL,
    publish_date text NOT NULL,
    description text,
    hits_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON public.songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_upload_id ON public.songs(upload_id);
CREATE INDEX IF NOT EXISTS idx_songs_status ON public.songs(status);
CREATE INDEX IF NOT EXISTS idx_songs_normalized_title ON public.songs(normalized_title);
CREATE INDEX IF NOT EXISTS idx_artists_normalized_name ON public.artists(normalized_name);
CREATE INDEX IF NOT EXISTS idx_youtube_cache_search_query ON public.youtube_cache(search_query);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column_music()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_artists_updated_at ON public.artists;
CREATE TRIGGER update_artists_updated_at
    BEFORE UPDATE ON public.artists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_music();

DROP TRIGGER IF EXISTS update_songs_updated_at ON public.songs;
CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON public.songs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_music();

-- Enable RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all access for now)
CREATE POLICY "Allow all access" ON public.uploads FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.artists FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.songs FOR ALL USING (true);
CREATE POLICY "Allow all access to youtube_cache" ON public.youtube_cache FOR ALL USING (true);