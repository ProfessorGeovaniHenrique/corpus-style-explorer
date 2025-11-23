-- ==========================================
-- Migration: Adicionar status 'rejeitado' ao semantic_tagset
-- Data: 2025-11-23
-- Objetivo: Corrigir erro ao rejeitar domínios semânticos
-- ==========================================

-- 1. Verificar registros com status inválido antes da alteração
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM semantic_tagset 
  WHERE status NOT IN ('ativo', 'proposto', 'descontinuado');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: % registro(s) com status inválido detectados', invalid_count;
  ELSE
    RAISE NOTICE 'OK: Todos os registros possuem status válido';
  END IF;
END $$;

-- 2. Remover constraint antiga
ALTER TABLE semantic_tagset DROP CONSTRAINT IF EXISTS valid_status;

-- 3. Adicionar nova constraint com 'rejeitado'
ALTER TABLE semantic_tagset 
ADD CONSTRAINT valid_status 
CHECK (status IN ('ativo', 'proposto', 'rejeitado', 'descontinuado'));

-- 4. Criar índice para melhorar performance em consultas por status
CREATE INDEX IF NOT EXISTS idx_semantic_tagset_status 
ON semantic_tagset(status) 
WHERE status IN ('proposto', 'rejeitado');

-- 5. Adicionar comentário para documentação
COMMENT ON CONSTRAINT valid_status ON semantic_tagset IS 
'Estados válidos do ciclo de vida: ativo (aprovado e em uso), proposto (aguardando validação), rejeitado (não aprovado na validação), descontinuado (foi ativo mas não é mais usado)';