-- Criar funções para buscar palavras candidatas usando LEFT JOIN
-- FASE 1: Corrigir lógica de getCandidateWords para buscar todas 59k+ palavras do Gutenberg

-- Função para buscar palavras Gutenberg não processadas
CREATE OR REPLACE FUNCTION get_unprocessed_gutenberg_words(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  verbete TEXT,
  classe_gramatical TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.verbete,
    g.classe_gramatical
  FROM gutenberg_lexicon g
  LEFT JOIN semantic_lexicon sl ON LOWER(g.verbete) = sl.palavra
  WHERE 
    sl.palavra IS NULL  -- Não está no lexicon
    AND g.classe_gramatical IS NOT NULL
    AND (
      g.classe_gramatical LIKE '%m.%' OR 
      g.classe_gramatical LIKE '%f.%' OR 
      g.classe_gramatical LIKE '%adj%' OR 
      g.classe_gramatical LIKE '%v.%' OR 
      g.classe_gramatical LIKE '%adv%'
    )
  ORDER BY g.verbete
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para buscar palavras Dialectal não processadas
CREATE OR REPLACE FUNCTION get_unprocessed_dialectal_words(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  verbete TEXT,
  classe_gramatical TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.verbete,
    d.classe_gramatical
  FROM dialectal_lexicon d
  LEFT JOIN semantic_lexicon sl ON LOWER(d.verbete) = sl.palavra
  WHERE 
    sl.palavra IS NULL  -- Não está no lexicon
    AND d.classe_gramatical IS NOT NULL
  ORDER BY d.verbete
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Comentários
COMMENT ON FUNCTION get_unprocessed_gutenberg_words IS 
  'Busca palavras do Gutenberg Lexicon que ainda não foram processadas no Semantic Lexicon usando LEFT JOIN';

COMMENT ON FUNCTION get_unprocessed_dialectal_words IS 
  'Busca palavras do Dialectal Lexicon que ainda não foram processadas no Semantic Lexicon usando LEFT JOIN';