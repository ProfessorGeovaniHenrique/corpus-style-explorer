-- CORREÇÃO: Substituir constraint UNIQUE simples por constraint COMPOSTA
-- Permite que o mesmo verbete_normalizado exista em dicionários diferentes

-- 1. Remover constraint incorreta (apenas verbete_normalizado)
ALTER TABLE dialectal_lexicon 
DROP CONSTRAINT IF EXISTS dialectal_lexicon_verbete_normalizado_key;

-- 2. Adicionar constraint composta correta (verbete_normalizado + volume_fonte)
ALTER TABLE dialectal_lexicon 
ADD CONSTRAINT dialectal_lexicon_unique_per_dictionary 
UNIQUE (verbete_normalizado, volume_fonte);

-- 3. Criar índice composto para performance otimizada
CREATE INDEX IF NOT EXISTS idx_dialectal_verbete_volume 
ON dialectal_lexicon(verbete_normalizado, volume_fonte);