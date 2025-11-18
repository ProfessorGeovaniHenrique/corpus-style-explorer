-- Criar tabela sync_metadata para rastrear sincronizações
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL UNIQUE,
  data_hash TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  items_synced INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Sync metadata é público para leitura"
  ON sync_metadata
  FOR SELECT
  USING (true);

-- Política de inserção/atualização apenas para sistema
CREATE POLICY "Sistema pode gerenciar sync metadata"
  ON sync_metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para construction_phases
ALTER PUBLICATION supabase_realtime ADD TABLE construction_phases;

-- Habilitar Realtime para sync_metadata
ALTER PUBLICATION supabase_realtime ADD TABLE sync_metadata;