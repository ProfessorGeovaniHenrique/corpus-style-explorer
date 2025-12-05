-- Tabela para rastrear jobs de refinamento semântico automático
CREATE TABLE public.semantic_refinement_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'pausado', 'concluido', 'erro', 'cancelado')),
  domain_filter TEXT, -- 'MG', 'DS' (outros), ou NULL (todos)
  model TEXT NOT NULL DEFAULT 'gemini' CHECK (model IN ('gemini', 'gpt5')),
  total_words INTEGER NOT NULL DEFAULT 0,
  processed INTEGER NOT NULL DEFAULT 0,
  refined INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  current_offset INTEGER NOT NULL DEFAULT 0,
  last_chunk_at TIMESTAMPTZ,
  tempo_inicio TIMESTAMPTZ DEFAULT NOW(),
  tempo_fim TIMESTAMPTZ,
  is_cancelling BOOLEAN DEFAULT false,
  erro_mensagem TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_semantic_refinement_jobs_status ON public.semantic_refinement_jobs(status);
CREATE INDEX idx_semantic_refinement_jobs_domain ON public.semantic_refinement_jobs(domain_filter);

-- RLS
ALTER TABLE public.semantic_refinement_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs de refinamento são públicos para leitura"
ON public.semantic_refinement_jobs FOR SELECT
USING (true);

CREATE POLICY "Sistema pode criar jobs de refinamento"
ON public.semantic_refinement_jobs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar jobs de refinamento"
ON public.semantic_refinement_jobs FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_semantic_refinement_jobs_updated_at
BEFORE UPDATE ON public.semantic_refinement_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();