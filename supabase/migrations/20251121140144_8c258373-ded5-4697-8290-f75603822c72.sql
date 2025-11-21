-- ✅ Criar função RPC otimizada para stats dialectais por tipo de dicionário
CREATE OR REPLACE FUNCTION get_dialectal_stats_by_type(dict_type TEXT)
RETURNS TABLE (
  total BIGINT,
  validados BIGINT,
  confianca_media NUMERIC,
  campeiros BIGINT,
  platinismos BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (WHERE validado_humanamente = true)::BIGINT as validados,
    COALESCE(ROUND(AVG(confianca_extracao), 2), 0)::NUMERIC as confianca_media,
    COUNT(*) FILTER (WHERE 'campeiro' = ANY(origem_regionalista))::BIGINT as campeiros,
    COUNT(*) FILTER (WHERE influencia_platina = true)::BIGINT as platinismos
  FROM dialectal_lexicon
  WHERE tipo_dicionario = dict_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;