-- Criar tabela annotation_debug_logs
CREATE TABLE IF NOT EXISTS public.annotation_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contexto da requisição
  demo_mode BOOLEAN NOT NULL DEFAULT false,
  auth_status TEXT NOT NULL,
  user_id UUID,
  corpus_type TEXT NOT NULL,
  job_id UUID,
  
  -- Dados da requisição
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_headers JSONB,
  
  -- Resposta
  response_status INTEGER NOT NULL,
  response_data JSONB,
  error_details JSONB,
  
  -- Métricas
  processing_time_ms INTEGER,
  words_processed INTEGER,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para queries otimizadas
CREATE INDEX idx_annotation_debug_logs_created_at ON public.annotation_debug_logs(created_at DESC);
CREATE INDEX idx_annotation_debug_logs_corpus_type ON public.annotation_debug_logs(corpus_type);
CREATE INDEX idx_annotation_debug_logs_auth_status ON public.annotation_debug_logs(auth_status);
CREATE INDEX idx_annotation_debug_logs_demo_mode ON public.annotation_debug_logs(demo_mode);
CREATE INDEX idx_annotation_debug_logs_job_id ON public.annotation_debug_logs(job_id) WHERE job_id IS NOT NULL;

-- RLS: Logs são públicos para leitura (fins de debug/desenvolvimento)
ALTER TABLE public.annotation_debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Debug logs são públicos para leitura"
  ON public.annotation_debug_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir logs"
  ON public.annotation_debug_logs
  FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.annotation_debug_logs IS 'Logs de debug para requisições de anotação semântica';
COMMENT ON COLUMN public.annotation_debug_logs.auth_status IS 'Status da autenticação: demo, authenticated, unauthorized, invalid_token';
COMMENT ON COLUMN public.annotation_debug_logs.response_status IS 'HTTP status code da resposta';
COMMENT ON COLUMN public.annotation_debug_logs.processing_time_ms IS 'Tempo de processamento em milissegundos';