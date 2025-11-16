-- Tabela para armazenar histórico de análises da IA
CREATE TABLE IF NOT EXISTS public.ai_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logs_type TEXT NOT NULL, -- 'audit', 'construction', 'corrections', etc.
  total_issues INTEGER NOT NULL DEFAULT 0,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking de implementação
  applied_fixes TEXT[] DEFAULT '{}'::text[], -- IDs das correções aplicadas
  resolved_at TIMESTAMPTZ, -- Quando todas foram resolvidas
  
  -- Métricas de economia
  estimated_credits_saved INTEGER DEFAULT 0,
  actual_credits_saved INTEGER DEFAULT 0, -- Calculado após implementação
  
  -- User tracking
  analyzed_by UUID,
  
  CONSTRAINT ai_analysis_history_logs_type_check 
    CHECK (logs_type IN ('audit', 'construction', 'corrections', 'scientific', 'ai-assistant'))
);

-- Tabela para rastrear status individual de cada sugestão
CREATE TABLE IF NOT EXISTS public.ai_suggestion_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.ai_analysis_history(id) ON DELETE CASCADE,
  suggestion_id TEXT NOT NULL, -- ID único da sugestão (ex: "security_user_id_hardcoded")
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'dismissed'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  
  -- Dados da sugestão
  category TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'Crítico', 'Alto', 'Médio', 'Baixo'
  title TEXT NOT NULL,
  estimated_effort TEXT NOT NULL, -- 'low', 'medium', 'high'
  estimated_credits_saved INTEGER DEFAULT 0,
  
  -- Implementação
  implementation_notes TEXT,
  actual_time_spent INTEGER, -- em minutos
  actual_credits_saved INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT ai_suggestion_status_status_check 
    CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  CONSTRAINT ai_suggestion_status_severity_check 
    CHECK (severity IN ('Crítico', 'Alto', 'Médio', 'Baixo')),
  CONSTRAINT unique_suggestion_per_analysis UNIQUE (analysis_id, suggestion_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_created_at 
  ON public.ai_analysis_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_logs_type 
  ON public.ai_analysis_history(logs_type);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_status_analysis_id 
  ON public.ai_suggestion_status(analysis_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_status_status 
  ON public.ai_suggestion_status(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_suggestion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_suggestion_status_updated_at
  BEFORE UPDATE ON public.ai_suggestion_status
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_suggestion_updated_at();

-- RLS Policies
ALTER TABLE public.ai_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestion_status ENABLE ROW LEVEL SECURITY;

-- Permitir leitura de histórico de análises
CREATE POLICY "Análises são públicas para leitura"
  ON public.ai_analysis_history
  FOR SELECT
  USING (true);

-- Edge functions podem criar análises
CREATE POLICY "Edge functions podem criar análises"
  ON public.ai_analysis_history
  FOR INSERT
  WITH CHECK (true);

-- Permitir atualização de análises
CREATE POLICY "Permitir atualização de análises"
  ON public.ai_analysis_history
  FOR UPDATE
  USING (true);

-- Permitir leitura de status de sugestões
CREATE POLICY "Status de sugestões é público para leitura"
  ON public.ai_suggestion_status
  FOR SELECT
  USING (true);

-- Permitir criação de status
CREATE POLICY "Permitir criação de status"
  ON public.ai_suggestion_status
  FOR INSERT
  WITH CHECK (true);

-- Permitir atualização de status
CREATE POLICY "Permitir atualização de status"
  ON public.ai_suggestion_status
  FOR UPDATE
  USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.ai_analysis_history IS 
  'Histórico de análises realizadas pela IA Assistant para tracking de ROI e economia de créditos';

COMMENT ON TABLE public.ai_suggestion_status IS 
  'Status individual de cada sugestão gerada pela IA, permitindo rastrear quais foram implementadas';

COMMENT ON COLUMN public.ai_suggestion_status.estimated_credits_saved IS 
  'Estimativa de créditos economizados se esta correção for implementada';

COMMENT ON COLUMN public.ai_suggestion_status.actual_credits_saved IS 
  'Créditos realmente economizados após implementação (pode ser atualizado com dados reais de uso)';