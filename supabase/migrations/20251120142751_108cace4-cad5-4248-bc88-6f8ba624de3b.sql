-- Adicionar índice UNIQUE para otimizar upserts no dialectal_lexicon
CREATE UNIQUE INDEX IF NOT EXISTS idx_dialectal_lexicon_verbete_normalizado 
ON dialectal_lexicon(verbete_normalizado);

-- Comentário explicativo
COMMENT ON INDEX idx_dialectal_lexicon_verbete_normalizado IS 
'Índice único para permitir upserts na importação de dicionários. Garante que cada verbete normalizado apareça apenas uma vez.';