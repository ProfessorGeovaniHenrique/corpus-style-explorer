-- Limpar tabela caso exista parcialmente
DROP TABLE IF EXISTS public.semantic_lexicon CASCADE;

-- Criar tabela semantic_lexicon para acelerar anotação semântica
CREATE TABLE public.semantic_lexicon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra TEXT NOT NULL UNIQUE,
  lema TEXT,
  pos TEXT,
  tagset_n1 TEXT NOT NULL,
  tagset_n2 TEXT,
  tagset_n3 TEXT,
  tagset_n4 TEXT,
  confianca NUMERIC DEFAULT 0.85 CHECK (confianca >= 0 AND confianca <= 1),
  fonte TEXT NOT NULL CHECK (fonte IN ('gemini', 'morfologico', 'manual', 'heranca')),
  origem_lexicon TEXT CHECK (origem_lexicon IN ('gutenberg', 'dialectal', 'corpus', 'manual')),
  frequencia_corpus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance otimizada
CREATE INDEX idx_semantic_lexicon_palavra ON public.semantic_lexicon(palavra);
CREATE INDEX idx_semantic_lexicon_lema ON public.semantic_lexicon(lema) WHERE lema IS NOT NULL;
CREATE INDEX idx_semantic_lexicon_pos ON public.semantic_lexicon(pos) WHERE pos IS NOT NULL;
CREATE INDEX idx_semantic_lexicon_tagset_n1 ON public.semantic_lexicon(tagset_n1);
CREATE INDEX idx_semantic_lexicon_frequencia ON public.semantic_lexicon(frequencia_corpus DESC);
CREATE INDEX idx_semantic_lexicon_fonte ON public.semantic_lexicon(fonte);

-- RLS policies
ALTER TABLE public.semantic_lexicon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lexicon é público para leitura"
  ON public.semantic_lexicon
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir no lexicon"
  ON public.semantic_lexicon
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar lexicon"
  ON public.semantic_lexicon
  FOR UPDATE
  USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.semantic_lexicon IS 'Léxico semântico pré-classificado para acelerar anotação sem API calls';
COMMENT ON COLUMN public.semantic_lexicon.palavra IS 'Palavra normalizada (lowercase, sem acentos)';
COMMENT ON COLUMN public.semantic_lexicon.fonte IS 'gemini: classificado via API, morfologico: regras morfológicas, manual: validado por humano, heranca: herdado de família lexical';
COMMENT ON COLUMN public.semantic_lexicon.origem_lexicon IS 'Origem da palavra: gutenberg, dialectal, corpus, ou manual';