-- Fix YouTube cache schema to use search_query properly
-- Add unique constraint to prevent duplicate searches
CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_cache_search_query_unique 
ON public.youtube_cache(search_query);

-- Clean up any invalid cache entries with NULL search_query
DELETE FROM public.youtube_cache WHERE search_query IS NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_youtube_cache_search_query_unique IS 'Ensures each YouTube search query is cached only once';