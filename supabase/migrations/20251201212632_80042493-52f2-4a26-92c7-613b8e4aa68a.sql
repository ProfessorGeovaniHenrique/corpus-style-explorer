-- ===== LIMPEZA DE DADOS LEGADOS: Resetar compositores "Não Identificado" =====
-- Este script reseta músicas que possuem compositor marcado como "Não Identificado"
-- ou variações desse placeholder inválido, retornando-as ao estado pending para
-- permitir novo enriquecimento com a validação corrigida.

-- Resetar músicas com compositor "Não Identificado" (dado inválido legado)
UPDATE songs 
SET 
  composer = NULL,
  status = 'pending',
  confidence_score = 0,
  enrichment_source = NULL
WHERE 
  composer IS NOT NULL 
  AND (
    composer = 'Não Identificado'
    OR composer ILIKE '%não identificado%'
    OR composer ILIKE '%desconhecido%'
    OR composer = 'Unknown'
    OR composer ILIKE '%unknown%'
  );

-- Log de quantas músicas foram resetadas
-- (O número aparecerá nos logs da migration)