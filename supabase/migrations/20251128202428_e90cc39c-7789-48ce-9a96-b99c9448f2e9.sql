-- Fase 1: Adicionar colunas multi-nível ao semantic_disambiguation_cache
ALTER TABLE semantic_disambiguation_cache 
ADD COLUMN IF NOT EXISTS tagset_n1 TEXT,
ADD COLUMN IF NOT EXISTS tagset_n2 TEXT,
ADD COLUMN IF NOT EXISTS tagset_n3 TEXT,
ADD COLUMN IF NOT EXISTS tagset_n4 TEXT,
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_semantic_cache_n1 ON semantic_disambiguation_cache(tagset_n1);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_n2 ON semantic_disambiguation_cache(tagset_n2);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_n3 ON semantic_disambiguation_cache(tagset_n3);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_n4 ON semantic_disambiguation_cache(tagset_n4);

-- Preencher tagset_n1 com dados existentes (extraindo primeira parte do código)
UPDATE semantic_disambiguation_cache 
SET tagset_n1 = SPLIT_PART(tagset_codigo, '.', 1)
WHERE tagset_n1 IS NULL AND tagset_codigo IS NOT NULL;

COMMENT ON COLUMN semantic_disambiguation_cache.tagset_n1 IS 'Código do domínio semântico N1 (ex: NA, AP)';
COMMENT ON COLUMN semantic_disambiguation_cache.tagset_n2 IS 'Código do domínio semântico N2 (ex: NA.01)';
COMMENT ON COLUMN semantic_disambiguation_cache.tagset_n3 IS 'Código do domínio semântico N3 (ex: NA.01.02)';
COMMENT ON COLUMN semantic_disambiguation_cache.tagset_n4 IS 'Código do domínio semântico N4 (ex: NA.01.02.03)';
COMMENT ON COLUMN semantic_disambiguation_cache.enriched_at IS 'Timestamp da última atualização de enriquecimento semântico';