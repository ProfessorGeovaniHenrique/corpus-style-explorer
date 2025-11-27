-- Tabela para gerenciar jobs de reprocessamento de palavras não classificadas
CREATE TABLE IF NOT EXISTS semantic_reprocess_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro', 'cancelado')),
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Estatísticas
  total_candidates INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  improved INTEGER DEFAULT 0,
  unchanged INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  
  -- Tracking
  current_offset INTEGER DEFAULT 0,
  chunks_processed INTEGER DEFAULT 0,
  
  -- Metadados
  artist_id UUID,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_chunk_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_semantic_reprocess_jobs_status ON semantic_reprocess_jobs(status);
CREATE INDEX idx_semantic_reprocess_jobs_artist ON semantic_reprocess_jobs(artist_id);
CREATE INDEX idx_semantic_reprocess_jobs_created ON semantic_reprocess_jobs(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER update_semantic_reprocess_jobs_updated_at
  BEFORE UPDATE ON semantic_reprocess_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE semantic_reprocess_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs públicos leitura" ON semantic_reprocess_jobs FOR SELECT USING (true);
CREATE POLICY "Sistema criar jobs" ON semantic_reprocess_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema atualizar jobs" ON semantic_reprocess_jobs FOR UPDATE USING (true);