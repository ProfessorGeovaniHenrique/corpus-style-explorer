-- Tabela principal de jobs de enriquecimento
CREATE TABLE public.enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  job_type TEXT NOT NULL CHECK (job_type IN ('metadata', 'youtube', 'lyrics', 'full')),
  scope TEXT NOT NULL CHECK (scope IN ('all', 'artist', 'corpus', 'selection')),
  
  -- Escopo específico
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT,
  corpus_id UUID REFERENCES corpora(id) ON DELETE SET NULL,
  corpus_type TEXT,
  song_ids UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'processando', 'pausado', 'concluido', 'erro', 'cancelado')),
  is_cancelling BOOLEAN DEFAULT false,
  
  -- Progresso
  total_songs INTEGER NOT NULL DEFAULT 0,
  songs_processed INTEGER DEFAULT 0,
  songs_succeeded INTEGER DEFAULT 0,
  songs_failed INTEGER DEFAULT 0,
  current_song_index INTEGER DEFAULT 0,
  
  -- Chunks (para auto-invocação)
  chunk_size INTEGER DEFAULT 20,
  chunks_processed INTEGER DEFAULT 0,
  last_chunk_at TIMESTAMPTZ,
  
  -- Opções
  force_reenrich BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tempo_inicio TIMESTAMPTZ,
  tempo_fim TIMESTAMPTZ,
  
  -- Metadados/Logs
  erro_mensagem TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Índices para performance
CREATE INDEX idx_enrichment_jobs_status ON enrichment_jobs(status);
CREATE INDEX idx_enrichment_jobs_artist ON enrichment_jobs(artist_id);
CREATE INDEX idx_enrichment_jobs_corpus ON enrichment_jobs(corpus_id);
CREATE INDEX idx_enrichment_jobs_type ON enrichment_jobs(job_type);
CREATE INDEX idx_enrichment_jobs_created ON enrichment_jobs(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_enrichment_job_timestamp
  BEFORE UPDATE ON enrichment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Jobs de enriquecimento são públicos para leitura"
  ON enrichment_jobs FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode criar jobs de enriquecimento"
  ON enrichment_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar jobs de enriquecimento"
  ON enrichment_jobs FOR UPDATE
  USING (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE enrichment_jobs;