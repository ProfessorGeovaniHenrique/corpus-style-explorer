-- Fase 1: Remover FK antiga que aponta para semantic_tagset_gaucho
ALTER TABLE semantic_disambiguation_cache 
DROP CONSTRAINT IF EXISTS semantic_disambiguation_cache_tagset_codigo_fkey;

-- Fase 2: Limpar registros com códigos antigos ANTES de criar FK nova
DELETE FROM semantic_disambiguation_cache 
WHERE tagset_codigo NOT IN (SELECT codigo FROM semantic_tagset);

-- Fase 3: Criar FK nova apontando para semantic_tagset (tabela correta)
ALTER TABLE semantic_disambiguation_cache 
ADD CONSTRAINT semantic_disambiguation_cache_tagset_codigo_fkey 
FOREIGN KEY (tagset_codigo) REFERENCES semantic_tagset(codigo);

-- Fase 4: Resetar job atual para reprocessar com FK corrigida
UPDATE semantic_annotation_jobs 
SET status = 'processando',
    processed_words = 0, 
    cached_words = 0, 
    new_words = 0,
    current_song_index = 0, 
    current_word_index = 0,
    chunks_processed = 0, 
    last_chunk_at = NOW()
WHERE id = '5e069509-1484-4e97-a02a-8d29a7d9ecfb';