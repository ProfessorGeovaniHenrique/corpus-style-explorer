-- Corrigir search_path das funções criadas na migração anterior
CREATE OR REPLACE FUNCTION increment_youtube_quota()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  INSERT INTO youtube_api_usage (date, queries_count)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date) 
  DO UPDATE SET 
    queries_count = youtube_api_usage.queries_count + 1,
    updated_at = NOW()
  RETURNING queries_count INTO current_count;
  
  RETURN current_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_youtube_quota_usage()
RETURNS TABLE (
  queries_used INTEGER,
  quota_limit INTEGER,
  queries_remaining INTEGER,
  usage_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(queries_count, 0) as queries_used,
    quota_limit,
    quota_limit - COALESCE(queries_count, 0) as queries_remaining,
    ROUND((COALESCE(queries_count, 0)::NUMERIC / quota_limit::NUMERIC) * 100, 2) as usage_percentage
  FROM youtube_api_usage
  WHERE date = CURRENT_DATE
  UNION ALL
  SELECT 0, 10000, 10000, 0.00
  WHERE NOT EXISTS (SELECT 1 FROM youtube_api_usage WHERE date = CURRENT_DATE)
  LIMIT 1;
END;
$$;