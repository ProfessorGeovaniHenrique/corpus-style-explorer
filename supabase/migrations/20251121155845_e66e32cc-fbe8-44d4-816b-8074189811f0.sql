-- ✅ FASE 1: Criar função RPC flexível que suporta múltiplos filtros
CREATE OR REPLACE FUNCTION public.get_dialectal_stats_flexible(
  dict_type TEXT DEFAULT NULL,
  volume_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  total BIGINT,
  validados BIGINT,
  confianca_media NUMERIC,
  campeiros BIGINT,
  platinismos BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (WHERE validado_humanamente = true)::BIGINT as validados,
    COALESCE(ROUND(AVG(confianca_extracao), 2), 0)::NUMERIC as confianca_media,
    COUNT(*) FILTER (WHERE 'campeiro' = ANY(origem_regionalista))::BIGINT as campeiros,
    COUNT(*) FILTER (WHERE influencia_platina = true)::BIGINT as platinismos
  FROM dialectal_lexicon
  WHERE 
    (dict_type IS NULL OR tipo_dicionario = dict_type)
    AND
    (volume_filter IS NULL OR volume_fonte = volume_filter);
END;
$$;

-- ✅ FASE 2: Atualizar dados existentes do Navarro para consistência
UPDATE dialectal_lexicon 
SET tipo_dicionario = 'navarro_2014'
WHERE volume_fonte = 'Navarro 2014' 
  AND (tipo_dicionario IS NULL OR tipo_dicionario = 'dialectal');

-- ✅ FASE 3: Comentar função antiga (manter para compatibilidade)
COMMENT ON FUNCTION public.get_dialectal_stats_by_type(TEXT) IS 
  'Legacy function - use get_dialectal_stats_flexible instead';