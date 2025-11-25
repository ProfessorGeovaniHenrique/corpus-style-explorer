-- Create table for spaCy API health monitoring
CREATE TABLE IF NOT EXISTS spacy_api_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'timeout', 'error')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for querying recent health checks
CREATE INDEX IF NOT EXISTS idx_spacy_health_checked_at ON spacy_api_health(checked_at DESC);

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_spacy_health_status ON spacy_api_health(status);

-- Add comment
COMMENT ON TABLE spacy_api_health IS 'Monitora saúde da API spaCy externa usada para POS tagging Layer 2';
