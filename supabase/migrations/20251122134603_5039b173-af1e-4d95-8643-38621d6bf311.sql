-- Tabela para tracking de uso da API do YouTube
CREATE TABLE IF NOT EXISTS youtube_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  queries_count INTEGER NOT NULL DEFAULT 0,
  quota_limit INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Habilitar RLS
ALTER TABLE youtube_api_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view YouTube quota usage"
  ON youtube_api_usage
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can insert/update YouTube quota"
  ON youtube_api_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para incrementar contador de quota
CREATE OR REPLACE FUNCTION increment_youtube_quota()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Função para obter uso atual
CREATE OR REPLACE FUNCTION get_youtube_quota_usage()
RETURNS TABLE (
  queries_used INTEGER,
  quota_limit INTEGER,
  queries_remaining INTEGER,
  usage_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger para atualizar updated_at
CREATE TRIGGER update_youtube_api_usage_updated_at
  BEFORE UPDATE ON youtube_api_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();