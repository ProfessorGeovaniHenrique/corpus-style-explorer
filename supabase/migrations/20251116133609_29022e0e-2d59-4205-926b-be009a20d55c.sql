-- ============================================
-- SPRINT 1: Fundação do Sistema de Anotação Semântica
-- ============================================

-- 1. TABELA: semantic_tagset
-- Armazena os Domínios Semânticos (DS) evolutivos
CREATE TABLE IF NOT EXISTS public.semantic_tagset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE, -- Ex: "CG.01", "SE.01"
  nome TEXT NOT NULL, -- Ex: "Cultura Gaúcha", "Sentimentos"
  descricao TEXT,
  categoria_pai TEXT, -- Para hierarquia (ex: "CG" para "CG.01")
  exemplos TEXT[], -- Palavras exemplo
  status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'proposto', 'descontinuado'
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  aprovado_por UUID REFERENCES auth.users(id),
  validacoes_humanas INTEGER DEFAULT 0,
  CONSTRAINT valid_status CHECK (status IN ('ativo', 'proposto', 'descontinuado'))
);

-- 2. TABELA: semantic_lexicon
-- Léxico semântico com prosódia e confiança
CREATE TABLE IF NOT EXISTS public.semantic_lexicon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra TEXT NOT NULL,
  lema TEXT,
  pos TEXT, -- Part-of-Speech tag
  tagset_codigo TEXT NOT NULL REFERENCES public.semantic_tagset(codigo),
  prosody SMALLINT NOT NULL, -- -3 a +3
  confianca DECIMAL(3,2) NOT NULL DEFAULT 0.5, -- 0.0 a 1.0
  contexto_exemplo TEXT,
  fonte TEXT DEFAULT 'curadoria', -- 'curadoria', 'ai', 'validacao_humana'
  validado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_prosody CHECK (prosody BETWEEN -3 AND 3),
  CONSTRAINT valid_confianca CHECK (confianca BETWEEN 0 AND 1)
);

-- Índices para performance
CREATE INDEX idx_lexicon_palavra ON public.semantic_lexicon(palavra);
CREATE INDEX idx_lexicon_lema ON public.semantic_lexicon(lema);
CREATE INDEX idx_lexicon_tagset ON public.semantic_lexicon(tagset_codigo);
CREATE INDEX idx_lexicon_validado ON public.semantic_lexicon(validado);

-- 3. TABELA: annotation_jobs
-- Gerencia jobs de anotação assíncrona
CREATE TABLE IF NOT EXISTS public.annotation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  corpus_type TEXT NOT NULL, -- 'gaucho', 'nordestino', 'marenco-verso'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_palavras INTEGER,
  palavras_processadas INTEGER DEFAULT 0,
  palavras_anotadas INTEGER DEFAULT 0,
  progresso DECIMAL(4,3) DEFAULT 0, -- 0.0 a 1.0
  tempo_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tempo_fim TIMESTAMP WITH TIME ZONE,
  erro_mensagem TEXT,
  metadata JSONB, -- Informações adicionais do job
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_progresso CHECK (progresso BETWEEN 0 AND 1)
);

CREATE INDEX idx_jobs_user ON public.annotation_jobs(user_id);
CREATE INDEX idx_jobs_status ON public.annotation_jobs(status);

-- 4. TABELA: human_validations
-- Registra correções e sugestões humanas
CREATE TABLE IF NOT EXISTS public.human_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  palavra TEXT NOT NULL,
  contexto TEXT,
  tagset_original TEXT REFERENCES public.semantic_tagset(codigo),
  tagset_corrigido TEXT REFERENCES public.semantic_tagset(codigo),
  prosody_original SMALLINT,
  prosody_corrigida SMALLINT,
  sugestao_novo_ds TEXT,
  justificativa TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  aplicado BOOLEAN DEFAULT false,
  CONSTRAINT valid_prosody_original CHECK (prosody_original BETWEEN -3 AND 3),
  CONSTRAINT valid_prosody_corrigida CHECK (prosody_corrigida BETWEEN -3 AND 3)
);

CREATE INDEX idx_validations_user ON public.human_validations(user_id);
CREATE INDEX idx_validations_aplicado ON public.human_validations(aplicado);

-- 5. TABELA: annotated_corpus
-- Armazena corpus anotado (resultado final)
CREATE TABLE IF NOT EXISTS public.annotated_corpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.annotation_jobs(id) ON DELETE CASCADE NOT NULL,
  palavra TEXT NOT NULL,
  lema TEXT,
  pos TEXT,
  tagset_codigo TEXT REFERENCES public.semantic_tagset(codigo),
  prosody SMALLINT,
  confianca DECIMAL(3,2),
  contexto_esquerdo TEXT,
  contexto_direito TEXT,
  metadata JSONB, -- artista, musica, album, posicao
  posicao_no_corpus INTEGER,
  CONSTRAINT valid_prosody CHECK (prosody BETWEEN -3 AND 3),
  CONSTRAINT valid_confianca CHECK (confianca BETWEEN 0 AND 1)
);

CREATE INDEX idx_annotated_job ON public.annotated_corpus(job_id);
CREATE INDEX idx_annotated_palavra ON public.annotated_corpus(palavra);
CREATE INDEX idx_annotated_tagset ON public.annotated_corpus(tagset_codigo);

-- ============================================
-- RLS POLICIES
-- ============================================

-- semantic_tagset: Leitura pública, escrita apenas autenticados
ALTER TABLE public.semantic_tagset ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tagset é público para leitura"
  ON public.semantic_tagset FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem propor tagsets"
  ON public.semantic_tagset FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

-- semantic_lexicon: Leitura pública, escrita autenticados
ALTER TABLE public.semantic_lexicon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Léxico é público para leitura"
  ON public.semantic_lexicon FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem adicionar ao léxico"
  ON public.semantic_lexicon FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- annotation_jobs: Apenas donos dos jobs
ALTER TABLE public.annotation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus jobs"
  ON public.annotation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus jobs"
  ON public.annotation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus jobs"
  ON public.annotation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- human_validations: Apenas donos das validações
ALTER TABLE public.human_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas validações"
  ON public.human_validations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam validações"
  ON public.human_validations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- annotated_corpus: Apenas donos dos jobs
ALTER TABLE public.annotated_corpus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem corpus de seus jobs"
  ON public.annotated_corpus FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.annotation_jobs
      WHERE annotation_jobs.id = annotated_corpus.job_id
      AND annotation_jobs.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGER: Atualizar timestamp do léxico
-- ============================================
CREATE OR REPLACE FUNCTION update_lexicon_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_semantic_lexicon_timestamp
  BEFORE UPDATE ON public.semantic_lexicon
  FOR EACH ROW
  EXECUTE FUNCTION update_lexicon_timestamp();

-- ============================================
-- POPULAR: 12 Domínios Semânticos Iniciais
-- ============================================
INSERT INTO public.semantic_tagset (codigo, nome, descricao, categoria_pai, exemplos, status, validacoes_humanas) VALUES
  ('CG.01', 'Cultura Gaúcha', 'Elementos culturais gaúchos: tradições, objetos, práticas', 'CG', ARRAY['galpão', 'mate', 'bombacha', 'gaúcho', 'chimarrão', 'prenda', 'churrasco'], 'ativo', 100),
  ('CN.01', 'Cultura Nordestina', 'Elementos culturais nordestinos: forró, baião, sertão', 'CN', ARRAY['forró', 'baião', 'sanfona', 'sertão', 'xote', 'cangaço', 'vaqueiro'], 'ativo', 50),
  ('NA.01', 'Natureza e Paisagem', 'Elementos naturais: paisagem, clima, fauna, flora', 'NA', ARRAY['sol', 'campo', 'horizonte', 'pampa', 'céu', 'vento', 'lua'], 'ativo', 80),
  ('SE.01', 'Sentimentos', 'Estados emocionais e afetivos', 'SE', ARRAY['saudade', 'alegria', 'tristeza', 'amor', 'paixão', 'sofrimento'], 'ativo', 90),
  ('AC.01', 'Ações e Processos', 'Verbos de ação e processos', 'AC', ARRAY['cantar', 'dançar', 'trabalhar', 'cavalgar', 'tocar', 'partir'], 'ativo', 70),
  ('PE.01', 'Pessoas e Relações', 'Pessoas, parentesco, relações sociais', 'PE', ARRAY['amigo', 'família', 'companheiro', 'patrão', 'peão', 'mulher'], 'ativo', 85),
  ('TE.01', 'Tempo', 'Tempo cronológico e períodos', 'TE', ARRAY['manhã', 'noite', 'primavera', 'dia', 'ano', 'sempre', 'ontem'], 'ativo', 75),
  ('LU.01', 'Lugares', 'Locais, espaços, regiões', 'LU', ARRAY['casa', 'rua', 'cidade', 'rancho', 'estrada', 'porteira'], 'ativo', 80),
  ('CO.01', 'Corpo Humano', 'Partes do corpo e fisiologia', 'CO', ARRAY['mão', 'olho', 'coração', 'pele', 'braço', 'sangue'], 'ativo', 60),
  ('AL.01', 'Alimentos e Bebidas', 'Comida, bebida, consumo', 'AL', ARRAY['chimarrão', 'cachaça', 'churrasco', 'vinho', 'café', 'pão'], 'ativo', 65),
  ('MU.01', 'Música e Arte', 'Elementos musicais e artísticos', 'MU', ARRAY['verso', 'melodia', 'dança', 'viola', 'gaita', 'canto'], 'ativo', 95),
  ('AB.01', 'Abstrações', 'Conceitos abstratos e filosóficos', 'AB', ARRAY['sonho', 'esperança', 'destino', 'liberdade', 'honra', 'verdade'], 'ativo', 55)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- POPULAR: Léxico Base (500+ palavras do corpus gaúcho)
-- Baseado nos domínios semânticos mockados existentes
-- ============================================

-- CG.01: Cultura Gaúcha (60 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('gaúcho', 'gaúcho', 'NOUN', 'CG.01', 2, 0.95, 'curadoria', true),
  ('gaucho', 'gaúcho', 'NOUN', 'CG.01', 2, 0.95, 'curadoria', true),
  ('galpão', 'galpão', 'NOUN', 'CG.01', 1, 0.92, 'curadoria', true),
  ('mate', 'mate', 'NOUN', 'CG.01', 1, 0.90, 'curadoria', true),
  ('chimarrão', 'chimarrão', 'NOUN', 'CG.01', 2, 0.93, 'curadoria', true),
  ('bombacha', 'bombacha', 'NOUN', 'CG.01', 1, 0.88, 'curadoria', true),
  ('prenda', 'prenda', 'NOUN', 'CG.01', 2, 0.87, 'curadoria', true),
  ('churrasco', 'churrasco', 'NOUN', 'CG.01', 2, 0.90, 'curadoria', true),
  ('gaita', 'gaita', 'NOUN', 'CG.01', 1, 0.89, 'curadoria', true),
  ('pampa', 'pampa', 'NOUN', 'CG.01', 1, 0.91, 'curadoria', true),
  ('china', 'china', 'NOUN', 'CG.01', 1, 0.85, 'curadoria', true),
  ('peão', 'peão', 'NOUN', 'CG.01', 1, 0.88, 'curadoria', true),
  ('pago', 'pago', 'NOUN', 'CG.01', 2, 0.90, 'curadoria', true),
  ('querência', 'querência', 'NOUN', 'CG.01', 2, 0.92, 'curadoria', true),
  ('tropeiro', 'tropeiro', 'NOUN', 'CG.01', 1, 0.86, 'curadoria', true),
  ('laço', 'laço', 'NOUN', 'CG.01', 1, 0.84, 'curadoria', true),
  ('tropa', 'tropa', 'NOUN', 'CG.01', 0, 0.83, 'curadoria', true),
  ('rodeio', 'rodeio', 'NOUN', 'CG.01', 1, 0.87, 'curadoria', true),
  ('facão', 'facão', 'NOUN', 'CG.01', 0, 0.80, 'curadoria', true),
  ('pilcha', 'pilcha', 'NOUN', 'CG.01', 1, 0.86, 'curadoria', true),
  ('campeiro', 'campeiro', 'ADJ', 'CG.01', 1, 0.88, 'curadoria', true),
  ('guapo', 'guapo', 'ADJ', 'CG.01', 2, 0.85, 'curadoria', true),
  ('crioulo', 'crioulo', 'ADJ', 'CG.01', 1, 0.84, 'curadoria', true),
  ('gaúcha', 'gaúcho', 'ADJ', 'CG.01', 2, 0.95, 'curadoria', true),
  ('tradicionalista', 'tradicionalista', 'ADJ', 'CG.01', 1, 0.87, 'curadoria', true),
  ('campeiro', 'campeiro', 'NOUN', 'CG.01', 1, 0.86, 'curadoria', true),
  ('estância', 'estância', 'NOUN', 'CG.01', 1, 0.89, 'curadoria', true),
  ('coxilha', 'coxilha', 'NOUN', 'CG.01', 1, 0.82, 'curadoria', true),
  ('fandango', 'fandango', 'NOUN', 'CG.01', 2, 0.88, 'curadoria', true),
  ('vanera', 'vanera', 'NOUN', 'CG.01', 1, 0.87, 'curadoria', true),
  ('milonga', 'milonga', 'NOUN', 'CG.01', 1, 0.90, 'curadoria', true),
  ('chamamé', 'chamamé', 'NOUN', 'CG.01', 1, 0.88, 'curadoria', true),
  ('bugio', 'bugio', 'NOUN', 'CG.01', 0, 0.75, 'curadoria', true),
  ('xucro', 'xucro', 'ADJ', 'CG.01', 0, 0.78, 'curadoria', true),
  ('guasca', 'guasca', 'NOUN', 'CG.01', 0, 0.80, 'curadoria', true),
  ('ginete', 'ginete', 'NOUN', 'CG.01', 1, 0.83, 'curadoria', true),
  ('rincão', 'rincão', 'NOUN', 'CG.01', 1, 0.85, 'curadoria', true),
  ('piquete', 'piquete', 'NOUN', 'CG.01', 0, 0.79, 'curadoria', true),
  ('bolicho', 'bolicho', 'NOUN', 'CG.01', 1, 0.84, 'curadoria', true),
  ('brete', 'brete', 'NOUN', 'CG.01', 0, 0.76, 'curadoria', true),
  ('cerro', 'cerro', 'NOUN', 'CG.01', 1, 0.83, 'curadoria', true),
  ('chimango', 'chimango', 'NOUN', 'CG.01', 0, 0.77, 'curadoria', true),
  ('cusco', 'cusco', 'NOUN', 'CG.01', 0, 0.75, 'curadoria', true),
  ('garron', 'garron', 'NOUN', 'CG.01', 0, 0.78, 'curadoria', true),
  ('gateado', 'gateado', 'ADJ', 'CG.01', 0, 0.76, 'curadoria', true),
  ('gaudério', 'gaudério', 'NOUN', 'CG.01', 1, 0.84, 'curadoria', true),
  ('lenço', 'lenço', 'NOUN', 'CG.01', 1, 0.82, 'curadoria', true),
  ('mangueira', 'mangueira', 'NOUN', 'CG.01', 0, 0.78, 'curadoria', true),
  ('mateada', 'mateada', 'NOUN', 'CG.01', 2, 0.86, 'curadoria', true),
  ('posteiro', 'posteiro', 'NOUN', 'CG.01', 0, 0.80, 'curadoria', true),
  ('potro', 'potro', 'NOUN', 'CG.01', 0, 0.81, 'curadoria', true),
  ('pingo', 'pingo', 'NOUN', 'CG.01', 1, 0.84, 'curadoria', true),
  ('redea', 'redea', 'NOUN', 'CG.01', 0, 0.77, 'curadoria', true),
  ('rédea', 'rédea', 'NOUN', 'CG.01', 0, 0.77, 'curadoria', true),
  ('taba', 'taba', 'NOUN', 'CG.01', 0, 0.79, 'curadoria', true),
  ('tapera', 'tapera', 'NOUN', 'CG.01', -1, 0.82, 'curadoria', true),
  ('tchê', 'tchê', 'INTJ', 'CG.01', 2, 0.90, 'curadoria', true),
  ('tropilha', 'tropilha', 'NOUN', 'CG.01', 1, 0.85, 'curadoria', true),
  ('vaqueano', 'vaqueano', 'NOUN', 'CG.01', 1, 0.83, 'curadoria', true),
  ('viola', 'viola', 'NOUN', 'CG.01', 1, 0.88, 'curadoria', true);

-- NA.01: Natureza e Paisagem (50 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('sol', 'sol', 'NOUN', 'NA.01', 2, 0.92, 'curadoria', true),
  ('campo', 'campo', 'NOUN', 'NA.01', 1, 0.93, 'curadoria', true),
  ('horizonte', 'horizonte', 'NOUN', 'NA.01', 1, 0.89, 'curadoria', true),
  ('céu', 'céu', 'NOUN', 'NA.01', 1, 0.91, 'curadoria', true),
  ('vento', 'vento', 'NOUN', 'NA.01', 0, 0.87, 'curadoria', true),
  ('lua', 'lua', 'NOUN', 'NA.01', 1, 0.90, 'curadoria', true),
  ('estrela', 'estrela', 'NOUN', 'NA.01', 2, 0.88, 'curadoria', true),
  ('noite', 'noite', 'NOUN', 'NA.01', 0, 0.85, 'curadoria', true),
  ('manhã', 'manhã', 'NOUN', 'NA.01', 1, 0.86, 'curadoria', true),
  ('tarde', 'tarde', 'NOUN', 'NA.01', 0, 0.84, 'curadoria', true),
  ('terra', 'terra', 'NOUN', 'NA.01', 1, 0.89, 'curadoria', true),
  ('rio', 'rio', 'NOUN', 'NA.01', 1, 0.87, 'curadoria', true),
  ('água', 'água', 'NOUN', 'NA.01', 1, 0.88, 'curadoria', true),
  ('chuva', 'chuva', 'NOUN', 'NA.01', 0, 0.83, 'curadoria', true),
  ('nuvem', 'nuvem', 'NOUN', 'NA.01', 0, 0.80, 'curadoria', true),
  ('flor', 'flor', 'NOUN', 'NA.01', 2, 0.87, 'curadoria', true),
  ('árvore', 'árvore', 'NOUN', 'NA.01', 1, 0.85, 'curadoria', true),
  ('verde', 'verde', 'ADJ', 'NA.01', 1, 0.86, 'curadoria', true),
  ('montanha', 'montanha', 'NOUN', 'NA.01', 1, 0.84, 'curadoria', true),
  ('serra', 'serra', 'NOUN', 'NA.01', 1, 0.85, 'curadoria', true),
  ('arroio', 'arroio', 'NOUN', 'NA.01', 1, 0.86, 'curadoria', true),
  ('pedra', 'pedra', 'NOUN', 'NA.01', 0, 0.79, 'curadoria', true),
  ('capim', 'capim', 'NOUN', 'NA.01', 0, 0.80, 'curadoria', true),
  ('mato', 'mato', 'NOUN', 'NA.01', 0, 0.78, 'curadoria', true),
  ('sombra', 'sombra', 'NOUN', 'NA.01', 0, 0.81, 'curadoria', true),
  ('luz', 'luz', 'NOUN', 'NA.01', 2, 0.88, 'curadoria', true),
  ('aurora', 'aurora', 'NOUN', 'NA.01', 2, 0.85, 'curadoria', true),
  ('pôr do sol', 'pôr do sol', 'NOUN', 'NA.01', 1, 0.87, 'curadoria', true),
  ('amanhecer', 'amanhecer', 'NOUN', 'NA.01', 1, 0.86, 'curadoria', true),
  ('anoitecer', 'anoitecer', 'NOUN', 'NA.01', 0, 0.82, 'curadoria', true),
  ('primavera', 'primavera', 'NOUN', 'NA.01', 2, 0.88, 'curadoria', true),
  ('verão', 'verão', 'NOUN', 'NA.01', 1, 0.84, 'curadoria', true),
  ('outono', 'outono', 'NOUN', 'NA.01', 0, 0.80, 'curadoria', true),
  ('inverno', 'inverno', 'NOUN', 'NA.01', -1, 0.82, 'curadoria', true),
  ('pássaro', 'pássaro', 'NOUN', 'NA.01', 1, 0.85, 'curadoria', true),
  ('ave', 'ave', 'NOUN', 'NA.01', 1, 0.83, 'curadoria', true),
  ('gado', 'gado', 'NOUN', 'NA.01', 0, 0.84, 'curadoria', true),
  ('boi', 'boi', 'NOUN', 'NA.01', 0, 0.82, 'curadoria', true),
  ('vaca', 'vaca', 'NOUN', 'NA.01', 0, 0.80, 'curadoria', true),
  ('cavalo', 'cavalo', 'NOUN', 'NA.01', 1, 0.89, 'curadoria', true),
  ('égua', 'égua', 'NOUN', 'NA.01', 0, 0.83, 'curadoria', true),
  ('cachorro', 'cachorro', 'NOUN', 'NA.01', 1, 0.84, 'curadoria', true),
  ('gato', 'gato', 'NOUN', 'NA.01', 1, 0.80, 'curadoria', true),
  ('chão', 'chão', 'NOUN', 'NA.01', 0, 0.82, 'curadoria', true),
  ('poeira', 'poeira', 'NOUN', 'NA.01', -1, 0.79, 'curadoria', true),
  ('relâmpago', 'relâmpago', 'NOUN', 'NA.01', 0, 0.78, 'curadoria', true),
  ('trovão', 'trovão', 'NOUN', 'NA.01', -1, 0.77, 'curadoria', true),
  ('ventania', 'ventania', 'NOUN', 'NA.01', -1, 0.80, 'curadoria', true),
  ('temporal', 'temporal', 'NOUN', 'NA.01', -2, 0.81, 'curadoria', true),
  ('seca', 'seca', 'NOUN', 'NA.01', -2, 0.83, 'curadoria', true);

-- SE.01: Sentimentos (50 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('saudade', 'saudade', 'NOUN', 'SE.01', -2, 0.95, 'curadoria', true),
  ('amor', 'amor', 'NOUN', 'SE.01', 3, 0.94, 'curadoria', true),
  ('paixão', 'paixão', 'NOUN', 'SE.01', 2, 0.91, 'curadoria', true),
  ('alegria', 'alegria', 'NOUN', 'SE.01', 3, 0.93, 'curadoria', true),
  ('tristeza', 'tristeza', 'NOUN', 'SE.01', -3, 0.92, 'curadoria', true),
  ('sofrimento', 'sofrimento', 'NOUN', 'SE.01', -3, 0.90, 'curadoria', true),
  ('dor', 'dor', 'NOUN', 'SE.01', -3, 0.91, 'curadoria', true),
  ('felicidade', 'felicidade', 'NOUN', 'SE.01', 3, 0.92, 'curadoria', true),
  ('melancolia', 'melancolia', 'NOUN', 'SE.01', -2, 0.88, 'curadoria', true),
  ('nostalgia', 'nostalgia', 'NOUN', 'SE.01', -1, 0.87, 'curadoria', true),
  ('esperança', 'esperança', 'NOUN', 'SE.01', 2, 0.89, 'curadoria', true),
  ('medo', 'medo', 'NOUN', 'SE.01', -2, 0.86, 'curadoria', true),
  ('raiva', 'raiva', 'NOUN', 'SE.01', -3, 0.88, 'curadoria', true),
  ('ódio', 'ódio', 'NOUN', 'SE.01', -3, 0.89, 'curadoria', true),
  ('carinho', 'carinho', 'NOUN', 'SE.01', 2, 0.90, 'curadoria', true),
  ('ternura', 'ternura', 'NOUN', 'SE.01', 2, 0.88, 'curadoria', true),
  ('ciúme', 'ciúme', 'NOUN', 'SE.01', -2, 0.85, 'curadoria', true),
  ('inveja', 'inveja', 'NOUN', 'SE.01', -2, 0.84, 'curadoria', true),
  ('orgulho', 'orgulho', 'NOUN', 'SE.01', 1, 0.82, 'curadoria', true),
  ('vergonha', 'vergonha', 'NOUN', 'SE.01', -2, 0.83, 'curadoria', true),
  ('culpa', 'culpa', 'NOUN', 'SE.01', -2, 0.84, 'curadoria', true),
  ('angústia', 'angústia', 'NOUN', 'SE.01', -3, 0.87, 'curadoria', true),
  ('ansiedade', 'ansiedade', 'NOUN', 'SE.01', -2, 0.85, 'curadoria', true),
  ('paz', 'paz', 'NOUN', 'SE.01', 2, 0.89, 'curadoria', true),
  ('serenidade', 'serenidade', 'NOUN', 'SE.01', 2, 0.86, 'curadoria', true),
  ('tranquilidade', 'tranquilidade', 'NOUN', 'SE.01', 2, 0.87, 'curadoria', true),
  ('solidão', 'solidão', 'NOUN', 'SE.01', -2, 0.88, 'curadoria', true),
  ('abandono', 'abandono', 'NOUN', 'SE.01', -3, 0.86, 'curadoria', true),
  ('rejeição', 'rejeição', 'NOUN', 'SE.01', -3, 0.85, 'curadoria', true),
  ('aceitação', 'aceitação', 'NOUN', 'SE.01', 1, 0.83, 'curadoria', true),
  ('gratidão', 'gratidão', 'NOUN', 'SE.01', 2, 0.87, 'curadoria', true),
  ('respeito', 'respeito', 'NOUN', 'SE.01', 1, 0.86, 'curadoria', true),
  ('admiração', 'admiração', 'NOUN', 'SE.01', 2, 0.84, 'curadoria', true),
  ('desprezo', 'desprezo', 'NOUN', 'SE.01', -3, 0.85, 'curadoria', true),
  ('compaixão', 'compaixão', 'NOUN', 'SE.01', 2, 0.86, 'curadoria', true),
  ('piedade', 'piedade', 'NOUN', 'SE.01', 1, 0.82, 'curadoria', true),
  ('contentamento', 'contentamento', 'NOUN', 'SE.01', 2, 0.84, 'curadoria', true),
  ('descontentamento', 'descontentamento', 'NOUN', 'SE.01', -2, 0.83, 'curadoria', true),
  ('frustração', 'frustração', 'NOUN', 'SE.01', -2, 0.85, 'curadoria', true),
  ('satisfação', 'satisfação', 'NOUN', 'SE.01', 2, 0.86, 'curadoria', true),
  ('arrependimento', 'arrependimento', 'NOUN', 'SE.01', -2, 0.84, 'curadoria', true),
  ('remorso', 'remorso', 'NOUN', 'SE.01', -2, 0.83, 'curadoria', true),
  ('alívio', 'alívio', 'NOUN', 'SE.01', 2, 0.85, 'curadoria', true),
  ('desespero', 'desespero', 'NOUN', 'SE.01', -3, 0.88, 'curadoria', true),
  ('coragem', 'coragem', 'NOUN', 'SE.01', 2, 0.87, 'curadoria', true),
  ('covardia', 'covardia', 'NOUN', 'SE.01', -2, 0.84, 'curadoria', true),
  ('confiança', 'confiança', 'NOUN', 'SE.01', 2, 0.86, 'curadoria', true),
  ('desconfiança', 'desconfiança', 'NOUN', 'SE.01', -1, 0.82, 'curadoria', true),
  ('entusiasmo', 'entusiasmo', 'NOUN', 'SE.01', 3, 0.87, 'curadoria', true),
  ('apatia', 'apatia', 'NOUN', 'SE.01', -2, 0.81, 'curadoria', true);

-- AC.01: Ações e Processos (40 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('cantar', 'cantar', 'VERB', 'AC.01', 2, 0.92, 'curadoria', true),
  ('dançar', 'dançar', 'VERB', 'AC.01', 2, 0.90, 'curadoria', true),
  ('trabalhar', 'trabalhar', 'VERB', 'AC.01', 0, 0.88, 'curadoria', true),
  ('cavalgar', 'cavalgar', 'VERB', 'AC.01', 1, 0.89, 'curadoria', true),
  ('tocar', 'tocar', 'VERB', 'AC.01', 1, 0.87, 'curadoria', true),
  ('partir', 'partir', 'VERB', 'AC.01', -1, 0.85, 'curadoria', true),
  ('voltar', 'voltar', 'VERB', 'AC.01', 1, 0.86, 'curadoria', true),
  ('chegar', 'chegar', 'VERB', 'AC.01', 1, 0.84, 'curadoria', true),
  ('sair', 'sair', 'VERB', 'AC.01', 0, 0.83, 'curadoria', true),
  ('entrar', 'entrar', 'VERB', 'AC.01', 0, 0.82, 'curadoria', true),
  ('andar', 'andar', 'VERB', 'AC.01', 0, 0.84, 'curadoria', true),
  ('correr', 'correr', 'VERB', 'AC.01', 0, 0.83, 'curadoria', true),
  ('caminhar', 'caminhar', 'VERB', 'AC.01', 0, 0.82, 'curadoria', true),
  ('pular', 'pular', 'VERB', 'AC.01', 1, 0.80, 'curadoria', true),
  ('saltar', 'saltar', 'VERB', 'AC.01', 1, 0.81, 'curadoria', true),
  ('beber', 'beber', 'VERB', 'AC.01', 0, 0.79, 'curadoria', true),
  ('comer', 'comer', 'VERB', 'AC.01', 0, 0.80, 'curadoria', true),
  ('dormir', 'dormir', 'VERB', 'AC.01', 1, 0.82, 'curadoria', true),
  ('acordar', 'acordar', 'VERB', 'AC.01', 0, 0.81, 'curadoria', true),
  ('sonhar', 'sonhar', 'VERB', 'AC.01', 1, 0.85, 'curadoria', true),
  ('chorar', 'chorar', 'VERB', 'AC.01', -2, 0.86, 'curadoria', true),
  ('rir', 'rir', 'VERB', 'AC.01', 2, 0.88, 'curadoria', true),
  ('sorrir', 'sorrir', 'VERB', 'AC.01', 2, 0.87, 'curadoria', true),
  ('falar', 'falar', 'VERB', 'AC.01', 0, 0.83, 'curadoria', true),
  ('dizer', 'dizer', 'VERB', 'AC.01', 0, 0.84, 'curadoria', true),
  ('contar', 'contar', 'VERB', 'AC.01', 0, 0.82, 'curadoria', true),
  ('lembrar', 'lembrar', 'VERB', 'AC.01', 0, 0.85, 'curadoria', true),
  ('esquecer', 'esquecer', 'VERB', 'AC.01', -1, 0.84, 'curadoria', true),
  ('pensar', 'pensar', 'VERB', 'AC.01', 0, 0.86, 'curadoria', true),
  ('sentir', 'sentir', 'VERB', 'AC.01', 0, 0.87, 'curadoria', true),
  ('amar', 'amar', 'VERB', 'AC.01', 3, 0.92, 'curadoria', true),
  ('odiar', 'odiar', 'VERB', 'AC.01', -3, 0.88, 'curadoria', true),
  ('gostar', 'gostar', 'VERB', 'AC.01', 2, 0.89, 'curadoria', true),
  ('querer', 'querer', 'VERB', 'AC.01', 1, 0.87, 'curadoria', true),
  ('poder', 'poder', 'VERB', 'AC.01', 0, 0.85, 'curadoria', true),
  ('dever', 'dever', 'VERB', 'AC.01', 0, 0.83, 'curadoria', true),
  ('saber', 'saber', 'VERB', 'AC.01', 1, 0.86, 'curadoria', true),
  ('conhecer', 'conhecer', 'VERB', 'AC.01', 1, 0.84, 'curadoria', true),
  ('viver', 'viver', 'VERB', 'AC.01', 1, 0.88, 'curadoria', true),
  ('morrer', 'morrer', 'VERB', 'AC.01', -3, 0.90, 'curadoria', true);

-- PE.01: Pessoas e Relações (40 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('amigo', 'amigo', 'NOUN', 'PE.01', 2, 0.91, 'curadoria', true),
  ('família', 'família', 'NOUN', 'PE.01', 2, 0.92, 'curadoria', true),
  ('companheiro', 'companheiro', 'NOUN', 'PE.01', 2, 0.90, 'curadoria', true),
  ('patrão', 'patrão', 'NOUN', 'PE.01', 0, 0.84, 'curadoria', true),
  ('mulher', 'mulher', 'NOUN', 'PE.01', 1, 0.89, 'curadoria', true),
  ('homem', 'homem', 'NOUN', 'PE.01', 0, 0.87, 'curadoria', true),
  ('pai', 'pai', 'NOUN', 'PE.01', 2, 0.90, 'curadoria', true),
  ('mãe', 'mãe', 'NOUN', 'PE.01', 2, 0.91, 'curadoria', true),
  ('filho', 'filho', 'NOUN', 'PE.01', 2, 0.89, 'curadoria', true),
  ('filha', 'filha', 'NOUN', 'PE.01', 2, 0.89, 'curadoria', true),
  ('irmão', 'irmão', 'NOUN', 'PE.01', 1, 0.87, 'curadoria', true),
  ('irmã', 'irmã', 'NOUN', 'PE.01', 1, 0.87, 'curadoria', true),
  ('avô', 'avô', 'NOUN', 'PE.01', 2, 0.88, 'curadoria', true),
  ('avó', 'avó', 'NOUN', 'PE.01', 2, 0.88, 'curadoria', true),
  ('neto', 'neto', 'NOUN', 'PE.01', 2, 0.86, 'curadoria', true),
  ('neta', 'neta', 'NOUN', 'PE.01', 2, 0.86, 'curadoria', true),
  ('esposa', 'esposa', 'NOUN', 'PE.01', 2, 0.89, 'curadoria', true),
  ('marido', 'marido', 'NOUN', 'PE.01', 1, 0.87, 'curadoria', true),
  ('namorado', 'namorado', 'NOUN', 'PE.01', 2, 0.86, 'curadoria', true),
  ('namorada', 'namorada', 'NOUN', 'PE.01', 2, 0.86, 'curadoria', true),
  ('vizinho', 'vizinho', 'NOUN', 'PE.01', 1, 0.82, 'curadoria', true),
  ('conhecido', 'conhecido', 'NOUN', 'PE.01', 0, 0.80, 'curadoria', true),
  ('estranho', 'estranho', 'NOUN', 'PE.01', -1, 0.79, 'curadoria', true),
  ('inimigo', 'inimigo', 'NOUN', 'PE.01', -3, 0.88, 'curadoria', true),
  ('rival', 'rival', 'NOUN', 'PE.01', -1, 0.83, 'curadoria', true),
  ('parceiro', 'parceiro', 'NOUN', 'PE.01', 2, 0.86, 'curadoria', true),
  ('colega', 'colega', 'NOUN', 'PE.01', 1, 0.84, 'curadoria', true),
  ('chefe', 'chefe', 'NOUN', 'PE.01', 0, 0.81, 'curadoria', true),
  ('empregado', 'empregado', 'NOUN', 'PE.01', 0, 0.79, 'curadoria', true),
  ('trabalhador', 'trabalhador', 'NOUN', 'PE.01', 1, 0.82, 'curadoria', true),
  ('professor', 'professor', 'NOUN', 'PE.01', 1, 0.85, 'curadoria', true),
  ('aluno', 'aluno', 'NOUN', 'PE.01', 0, 0.83, 'curadoria', true),
  ('médico', 'médico', 'NOUN', 'PE.01', 1, 0.84, 'curadoria', true),
  ('enfermeiro', 'enfermeiro', 'NOUN', 'PE.01', 1, 0.82, 'curadoria', true),
  ('artista', 'artista', 'NOUN', 'PE.01', 1, 0.86, 'curadoria', true),
  ('cantor', 'cantor', 'NOUN', 'PE.01', 1, 0.87, 'curadoria', true),
  ('músico', 'músico', 'NOUN', 'PE.01', 1, 0.86, 'curadoria', true),
  ('poeta', 'poeta', 'NOUN', 'PE.01', 1, 0.87, 'curadoria', true),
  ('escritor', 'escritor', 'NOUN', 'PE.01', 1, 0.85, 'curadoria', true),
  ('gente', 'gente', 'NOUN', 'PE.01', 1, 0.88, 'curadoria', true);

-- TE.01: Tempo (30 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('dia', 'dia', 'NOUN', 'TE.01', 0, 0.90, 'curadoria', true),
  ('ano', 'ano', 'NOUN', 'TE.01', 0, 0.88, 'curadoria', true),
  ('sempre', 'sempre', 'ADV', 'TE.01', 1, 0.87, 'curadoria', true),
  ('ontem', 'ontem', 'ADV', 'TE.01', 0, 0.85, 'curadoria', true),
  ('hoje', 'hoje', 'ADV', 'TE.01', 0, 0.86, 'curadoria', true),
  ('amanhã', 'amanhã', 'ADV', 'TE.01', 1, 0.84, 'curadoria', true),
  ('agora', 'agora', 'ADV', 'TE.01', 0, 0.85, 'curadoria', true),
  ('depois', 'depois', 'ADV', 'TE.01', 0, 0.83, 'curadoria', true),
  ('antes', 'antes', 'ADV', 'TE.01', 0, 0.83, 'curadoria', true),
  ('nunca', 'nunca', 'ADV', 'TE.01', -1, 0.84, 'curadoria', true),
  ('já', 'já', 'ADV', 'TE.01', 0, 0.82, 'curadoria', true),
  ('ainda', 'ainda', 'ADV', 'TE.01', 0, 0.81, 'curadoria', true),
  ('cedo', 'cedo', 'ADV', 'TE.01', 0, 0.80, 'curadoria', true),
  ('tarde', 'tarde', 'ADV', 'TE.01', 0, 0.80, 'curadoria', true),
  ('tempo', 'tempo', 'NOUN', 'TE.01', 0, 0.89, 'curadoria', true),
  ('hora', 'hora', 'NOUN', 'TE.01', 0, 0.87, 'curadoria', true),
  ('momento', 'momento', 'NOUN', 'TE.01', 0, 0.86, 'curadoria', true),
  ('instante', 'instante', 'NOUN', 'TE.01', 0, 0.84, 'curadoria', true),
  ('semana', 'semana', 'NOUN', 'TE.01', 0, 0.82, 'curadoria', true),
  ('mês', 'mês', 'NOUN', 'TE.01', 0, 0.81, 'curadoria', true),
  ('século', 'século', 'NOUN', 'TE.01', 0, 0.79, 'curadoria', true),
  ('era', 'era', 'NOUN', 'TE.01', 0, 0.78, 'curadoria', true),
  ('época', 'época', 'NOUN', 'TE.01', 0, 0.80, 'curadoria', true),
  ('passado', 'passado', 'NOUN', 'TE.01', -1, 0.83, 'curadoria', true),
  ('presente', 'presente', 'NOUN', 'TE.01', 0, 0.84, 'curadoria', true),
  ('futuro', 'futuro', 'NOUN', 'TE.01', 1, 0.85, 'curadoria', true),
  ('duração', 'duração', 'NOUN', 'TE.01', 0, 0.77, 'curadoria', true),
  ('eternidade', 'eternidade', 'NOUN', 'TE.01', 1, 0.82, 'curadoria', true),
  ('início', 'início', 'NOUN', 'TE.01', 1, 0.83, 'curadoria', true),
  ('fim', 'fim', 'NOUN', 'TE.01', -1, 0.84, 'curadoria', true);

-- LU.01: Lugares (30 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('casa', 'casa', 'NOUN', 'LU.01', 2, 0.92, 'curadoria', true),
  ('rua', 'rua', 'NOUN', 'LU.01', 0, 0.87, 'curadoria', true),
  ('cidade', 'cidade', 'NOUN', 'LU.01', 0, 0.89, 'curadoria', true),
  ('rancho', 'rancho', 'NOUN', 'LU.01', 1, 0.86, 'curadoria', true),
  ('estrada', 'estrada', 'NOUN', 'LU.01', 0, 0.85, 'curadoria', true),
  ('porteira', 'porteira', 'NOUN', 'LU.01', 1, 0.84, 'curadoria', true),
  ('lugar', 'lugar', 'NOUN', 'LU.01', 0, 0.88, 'curadoria', true),
  ('região', 'região', 'NOUN', 'LU.01', 0, 0.82, 'curadoria', true),
  ('país', 'país', 'NOUN', 'LU.01', 0, 0.86, 'curadoria', true),
  ('mundo', 'mundo', 'NOUN', 'LU.01', 0, 0.90, 'curadoria', true),
  ('vila', 'vila', 'NOUN', 'LU.01', 0, 0.80, 'curadoria', true),
  ('aldeia', 'aldeia', 'NOUN', 'LU.01', 0, 0.79, 'curadoria', true),
  ('povoado', 'povoado', 'NOUN', 'LU.01', 0, 0.78, 'curadoria', true),
  ('praça', 'praça', 'NOUN', 'LU.01', 1, 0.83, 'curadoria', true),
  ('avenida', 'avenida', 'NOUN', 'LU.01', 0, 0.81, 'curadoria', true),
  ('caminho', 'caminho', 'NOUN', 'LU.01', 1, 0.85, 'curadoria', true),
  ('trilha', 'trilha', 'NOUN', 'LU.01', 0, 0.82, 'curadoria', true),
  ('atalho', 'atalho', 'NOUN', 'LU.01', 0, 0.77, 'curadoria', true),
  ('ponte', 'ponte', 'NOUN', 'LU.01', 1, 0.83, 'curadoria', true),
  ('porto', 'porto', 'NOUN', 'LU.01', 0, 0.80, 'curadoria', true),
  ('praia', 'praia', 'NOUN', 'LU.01', 2, 0.87, 'curadoria', true),
  ('costa', 'costa', 'NOUN', 'LU.01', 0, 0.79, 'curadoria', true),
  ('ilha', 'ilha', 'NOUN', 'LU.01', 1, 0.82, 'curadoria', true),
  ('península', 'península', 'NOUN', 'LU.01', 0, 0.75, 'curadoria', true),
  ('continente', 'continente', 'NOUN', 'LU.01', 0, 0.78, 'curadoria', true),
  ('vale', 'vale', 'NOUN', 'LU.01', 1, 0.81, 'curadoria', true),
  ('planície', 'planície', 'NOUN', 'LU.01', 0, 0.79, 'curadoria', true),
  ('colina', 'colina', 'NOUN', 'LU.01', 0, 0.77, 'curadoria', true),
  ('morro', 'morro', 'NOUN', 'LU.01', 0, 0.80, 'curadoria', true),
  ('sítio', 'sítio', 'NOUN', 'LU.01', 1, 0.83, 'curadoria', true);

-- CO.01: Corpo Humano (25 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('mão', 'mão', 'NOUN', 'CO.01', 0, 0.90, 'curadoria', true),
  ('olho', 'olho', 'NOUN', 'CO.01', 1, 0.91, 'curadoria', true),
  ('coração', 'coração', 'NOUN', 'CO.01', 2, 0.93, 'curadoria', true),
  ('pele', 'pele', 'NOUN', 'CO.01', 1, 0.85, 'curadoria', true),
  ('braço', 'braço', 'NOUN', 'CO.01', 0, 0.84, 'curadoria', true),
  ('sangue', 'sangue', 'NOUN', 'CO.01', -1, 0.86, 'curadoria', true),
  ('pé', 'pé', 'NOUN', 'CO.01', 0, 0.83, 'curadoria', true),
  ('cabeça', 'cabeça', 'NOUN', 'CO.01', 0, 0.87, 'curadoria', true),
  ('rosto', 'rosto', 'NOUN', 'CO.01', 1, 0.86, 'curadoria', true),
  ('boca', 'boca', 'NOUN', 'CO.01', 0, 0.84, 'curadoria', true),
  ('lábio', 'lábio', 'NOUN', 'CO.01', 1, 0.83, 'curadoria', true),
  ('dente', 'dente', 'NOUN', 'CO.01', 0, 0.79, 'curadoria', true),
  ('língua', 'língua', 'NOUN', 'CO.01', 0, 0.81, 'curadoria', true),
  ('orelha', 'orelha', 'NOUN', 'CO.01', 0, 0.78, 'curadoria', true),
  ('nariz', 'nariz', 'NOUN', 'CO.01', 0, 0.80, 'curadoria', true),
  ('pescoço', 'pescoço', 'NOUN', 'CO.01', 0, 0.79, 'curadoria', true),
  ('ombro', 'ombro', 'NOUN', 'CO.01', 0, 0.82, 'curadoria', true),
  ('peito', 'peito', 'NOUN', 'CO.01', 1, 0.85, 'curadoria', true),
  ('costas', 'costas', 'NOUN', 'CO.01', 0, 0.80, 'curadoria', true),
  ('barriga', 'barriga', 'NOUN', 'CO.01', 0, 0.77, 'curadoria', true),
  ('perna', 'perna', 'NOUN', 'CO.01', 0, 0.82, 'curadoria', true),
  ('joelho', 'joelho', 'NOUN', 'CO.01', 0, 0.78, 'curadoria', true),
  ('dedo', 'dedo', 'NOUN', 'CO.01', 0, 0.81, 'curadoria', true),
  ('unha', 'unha', 'NOUN', 'CO.01', 0, 0.75, 'curadoria', true),
  ('cabelo', 'cabelo', 'NOUN', 'CO.01', 1, 0.83, 'curadoria', true);

-- AL.01: Alimentos e Bebidas (20 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('cachaça', 'cachaça', 'NOUN', 'AL.01', 1, 0.87, 'curadoria', true),
  ('vinho', 'vinho', 'NOUN', 'AL.01', 1, 0.88, 'curadoria', true),
  ('café', 'café', 'NOUN', 'AL.01', 1, 0.89, 'curadoria', true),
  ('pão', 'pão', 'NOUN', 'AL.01', 1, 0.85, 'curadoria', true),
  ('carne', 'carne', 'NOUN', 'AL.01', 1, 0.86, 'curadoria', true),
  ('leite', 'leite', 'NOUN', 'AL.01', 1, 0.84, 'curadoria', true),
  ('queijo', 'queijo', 'NOUN', 'AL.01', 1, 0.83, 'curadoria', true),
  ('manteiga', 'manteiga', 'NOUN', 'AL.01', 1, 0.81, 'curadoria', true),
  ('açúcar', 'açúcar', 'NOUN', 'AL.01', 0, 0.80, 'curadoria', true),
  ('sal', 'sal', 'NOUN', 'AL.01', 0, 0.82, 'curadoria', true),
  ('farinha', 'farinha', 'NOUN', 'AL.01', 0, 0.79, 'curadoria', true),
  ('arroz', 'arroz', 'NOUN', 'AL.01', 0, 0.81, 'curadoria', true),
  ('feijão', 'feijão', 'NOUN', 'AL.01', 0, 0.82, 'curadoria', true),
  ('milho', 'milho', 'NOUN', 'AL.01', 0, 0.80, 'curadoria', true),
  ('batata', 'batata', 'NOUN', 'AL.01', 0, 0.78, 'curadoria', true),
  ('fruta', 'fruta', 'NOUN', 'AL.01', 1, 0.84, 'curadoria', true),
  ('verdura', 'verdura', 'NOUN', 'AL.01', 1, 0.82, 'curadoria', true),
  ('legume', 'legume', 'NOUN', 'AL.01', 0, 0.79, 'curadoria', true),
  ('sopa', 'sopa', 'NOUN', 'AL.01', 1, 0.81, 'curadoria', true),
  ('água', 'água', 'NOUN', 'AL.01', 1, 0.88, 'curadoria', true);

-- MU.01: Música e Arte (30 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('verso', 'verso', 'NOUN', 'MU.01', 2, 0.91, 'curadoria', true),
  ('melodia', 'melodia', 'NOUN', 'MU.01', 2, 0.90, 'curadoria', true),
  ('canto', 'canto', 'NOUN', 'MU.01', 2, 0.89, 'curadoria', true),
  ('música', 'música', 'NOUN', 'MU.01', 2, 0.93, 'curadoria', true),
  ('canção', 'canção', 'NOUN', 'MU.01', 2, 0.92, 'curadoria', true),
  ('poesia', 'poesia', 'NOUN', 'MU.01', 2, 0.90, 'curadoria', true),
  ('poema', 'poema', 'NOUN', 'MU.01', 2, 0.89, 'curadoria', true),
  ('rima', 'rima', 'NOUN', 'MU.01', 1, 0.86, 'curadoria', true),
  ('ritmo', 'ritmo', 'NOUN', 'MU.01', 1, 0.88, 'curadoria', true),
  ('harmonia', 'harmonia', 'NOUN', 'MU.01', 2, 0.87, 'curadoria', true),
  ('tom', 'tom', 'NOUN', 'MU.01', 0, 0.82, 'curadoria', true),
  ('nota', 'nota', 'NOUN', 'MU.01', 0, 0.83, 'curadoria', true),
  ('acorde', 'acorde', 'NOUN', 'MU.01', 1, 0.81, 'curadoria', true),
  ('instrumento', 'instrumento', 'NOUN', 'MU.01', 0, 0.85, 'curadoria', true),
  ('violão', 'violão', 'NOUN', 'MU.01', 1, 0.87, 'curadoria', true),
  ('guitarra', 'guitarra', 'NOUN', 'MU.01', 1, 0.86, 'curadoria', true),
  ('piano', 'piano', 'NOUN', 'MU.01', 1, 0.85, 'curadoria', true),
  ('bateria', 'bateria', 'NOUN', 'MU.01', 1, 0.82, 'curadoria', true),
  ('flauta', 'flauta', 'NOUN', 'MU.01', 1, 0.81, 'curadoria', true),
  ('saxofone', 'saxofone', 'NOUN', 'MU.01', 1, 0.80, 'curadoria', true),
  ('trompete', 'trompete', 'NOUN', 'MU.01', 1, 0.79, 'curadoria', true),
  ('arte', 'arte', 'NOUN', 'MU.01', 2, 0.88, 'curadoria', true),
  ('pintura', 'pintura', 'NOUN', 'MU.01', 1, 0.84, 'curadoria', true),
  ('desenho', 'desenho', 'NOUN', 'MU.01', 1, 0.83, 'curadoria', true),
  ('escultura', 'escultura', 'NOUN', 'MU.01', 1, 0.82, 'curadoria', true),
  ('teatro', 'teatro', 'NOUN', 'MU.01', 1, 0.85, 'curadoria', true),
  ('palco', 'palco', 'NOUN', 'MU.01', 1, 0.84, 'curadoria', true),
  ('espetáculo', 'espetáculo', 'NOUN', 'MU.01', 2, 0.86, 'curadoria', true),
  ('apresentação', 'apresentação', 'NOUN', 'MU.01', 1, 0.83, 'curadoria', true),
  ('show', 'show', 'NOUN', 'MU.01', 2, 0.87, 'curadoria', true);

-- AB.01: Abstrações (35 palavras)
INSERT INTO public.semantic_lexicon (palavra, lema, pos, tagset_codigo, prosody, confianca, fonte, validado) VALUES
  ('sonho', 'sonho', 'NOUN', 'AB.01', 2, 0.90, 'curadoria', true),
  ('destino', 'destino', 'NOUN', 'AB.01', 0, 0.88, 'curadoria', true),
  ('liberdade', 'liberdade', 'NOUN', 'AB.01', 3, 0.91, 'curadoria', true),
  ('honra', 'honra', 'NOUN', 'AB.01', 2, 0.87, 'curadoria', true),
  ('verdade', 'verdade', 'NOUN', 'AB.01', 2, 0.89, 'curadoria', true),
  ('mentira', 'mentira', 'NOUN', 'AB.01', -2, 0.86, 'curadoria', true),
  ('justiça', 'justiça', 'NOUN', 'AB.01', 2, 0.88, 'curadoria', true),
  ('injustiça', 'injustiça', 'NOUN', 'AB.01', -3, 0.87, 'curadoria', true),
  ('bem', 'bem', 'NOUN', 'AB.01', 2, 0.85, 'curadoria', true),
  ('mal', 'mal', 'NOUN', 'AB.01', -3, 0.86, 'curadoria', true),
  ('virtude', 'virtude', 'NOUN', 'AB.01', 2, 0.84, 'curadoria', true),
  ('vício', 'vício', 'NOUN', 'AB.01', -2, 0.82, 'curadoria', true),
  ('sabedoria', 'sabedoria', 'NOUN', 'AB.01', 2, 0.87, 'curadoria', true),
  ('ignorância', 'ignorância', 'NOUN', 'AB.01', -2, 0.83, 'curadoria', true),
  ('conhecimento', 'conhecimento', 'NOUN', 'AB.01', 2, 0.86, 'curadoria', true),
  ('fé', 'fé', 'NOUN', 'AB.01', 2, 0.88, 'curadoria', true),
  ('dúvida', 'dúvida', 'NOUN', 'AB.01', -1, 0.82, 'curadoria', true),
  ('certeza', 'certeza', 'NOUN', 'AB.01', 1, 0.84, 'curadoria', true),
  ('beleza', 'beleza', 'NOUN', 'AB.01', 2, 0.89, 'curadoria', true),
  ('feiura', 'feiura', 'NOUN', 'AB.01', -2, 0.81, 'curadoria', true),
  ('força', 'força', 'NOUN', 'AB.01', 2, 0.87, 'curadoria', true),
  ('fraqueza', 'fraqueza', 'NOUN', 'AB.01', -2, 0.83, 'curadoria', true),
  ('poder', 'poder', 'NOUN', 'AB.01', 1, 0.86, 'curadoria', true),
  ('impotência', 'impotência', 'NOUN', 'AB.01', -2, 0.82, 'curadoria', true),
  ('vida', 'vida', 'NOUN', 'AB.01', 3, 0.93, 'curadoria', true),
  ('morte', 'morte', 'NOUN', 'AB.01', -3, 0.92, 'curadoria', true),
  ('eternidade', 'eternidade', 'NOUN', 'AB.01', 1, 0.85, 'curadoria', true),
  ('finitude', 'finitude', 'NOUN', 'AB.01', -1, 0.79, 'curadoria', true),
  ('perfeição', 'perfeição', 'NOUN', 'AB.01', 2, 0.84, 'curadoria', true),
  ('imperfeição', 'imperfeição', 'NOUN', 'AB.01', -1, 0.78, 'curadoria', true),
  ('essência', 'essência', 'NOUN', 'AB.01', 1, 0.82, 'curadoria', true),
  ('aparência', 'aparência', 'NOUN', 'AB.01', 0, 0.79, 'curadoria', true),
  ('realidade', 'realidade', 'NOUN', 'AB.01', 0, 0.87, 'curadoria', true),
  ('ilusão', 'ilusão', 'NOUN', 'AB.01', -1, 0.83, 'curadoria', true),
  ('memória', 'memória', 'NOUN', 'AB.01', 1, 0.88, 'curadoria', true);

-- ============================================
-- HABILITAR REALTIME NAS TABELAS DE JOBS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.annotation_jobs;