-- FASE 1: Adicionar campo insignias_culturais
-- Adicionar coluna para marcar identidade cultural regional/étnica das palavras

ALTER TABLE semantic_lexicon 
ADD COLUMN insignias_culturais TEXT[] DEFAULT '{}';

ALTER TABLE annotated_corpus 
ADD COLUMN insignias_culturais TEXT[] DEFAULT '{}';

-- Criar índices para performance em queries por insígnia
CREATE INDEX idx_semantic_lexicon_insignias ON semantic_lexicon USING GIN(insignias_culturais);
CREATE INDEX idx_annotated_corpus_insignias ON annotated_corpus USING GIN(insignias_culturais);

-- Comentários explicativos
COMMENT ON COLUMN semantic_lexicon.insignias_culturais IS 'Marcadores culturais/regionais/étnicos da palavra (ex: Gaúcho, Nordestino, Indígena, Platino)';
COMMENT ON COLUMN annotated_corpus.insignias_culturais IS 'Marcadores culturais/regionais/étnicos da palavra no contexto do corpus';