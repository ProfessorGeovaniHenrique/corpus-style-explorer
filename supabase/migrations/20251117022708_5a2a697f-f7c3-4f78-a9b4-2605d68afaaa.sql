-- Função para calcular automaticamente os campos hierárquicos de todos os tagsets
CREATE OR REPLACE FUNCTION calculate_tagset_hierarchy()
RETURNS void AS $$
BEGIN
  -- Atualizar tagsets de nível 1 (sem pai - categoria_pai IS NULL)
  UPDATE semantic_tagset
  SET 
    nivel_profundidade = 1,
    hierarquia_completa = nome,
    tagset_pai = NULL,
    codigo_nivel_1 = codigo,
    codigo_nivel_2 = NULL,
    codigo_nivel_3 = NULL,
    codigo_nivel_4 = NULL
  WHERE categoria_pai IS NULL;

  -- Atualizar tagsets de nível 2 (filhos diretos de nível 1)
  UPDATE semantic_tagset t2
  SET
    nivel_profundidade = 2,
    tagset_pai = t1.codigo,
    hierarquia_completa = t1.nome || ' > ' || t2.nome,
    codigo_nivel_1 = t1.codigo,
    codigo_nivel_2 = t2.codigo,
    codigo_nivel_3 = NULL,
    codigo_nivel_4 = NULL
  FROM semantic_tagset t1
  WHERE t2.categoria_pai = t1.codigo
    AND t1.categoria_pai IS NULL;

  -- Atualizar tagsets de nível 3 (netos)
  UPDATE semantic_tagset t3
  SET
    nivel_profundidade = 3,
    tagset_pai = t2.codigo,
    hierarquia_completa = t1.nome || ' > ' || t2.nome || ' > ' || t3.nome,
    codigo_nivel_1 = t2.codigo_nivel_1,
    codigo_nivel_2 = t2.codigo,
    codigo_nivel_3 = t3.codigo,
    codigo_nivel_4 = NULL
  FROM semantic_tagset t2
  JOIN semantic_tagset t1 ON t2.categoria_pai = t1.codigo
  WHERE t3.categoria_pai = t2.codigo
    AND t2.categoria_pai IS NOT NULL
    AND t1.categoria_pai IS NULL;

  -- Atualizar tagsets de nível 4 (bisnetos)
  UPDATE semantic_tagset t4
  SET
    nivel_profundidade = 4,
    tagset_pai = t3.codigo,
    hierarquia_completa = t1.nome || ' > ' || t2.nome || ' > ' || t3.nome || ' > ' || t4.nome,
    codigo_nivel_1 = t3.codigo_nivel_1,
    codigo_nivel_2 = t3.codigo_nivel_2,
    codigo_nivel_3 = t3.codigo,
    codigo_nivel_4 = t4.codigo
  FROM semantic_tagset t3
  JOIN semantic_tagset t2 ON t3.categoria_pai = t2.codigo
  JOIN semantic_tagset t1 ON t2.categoria_pai = t1.codigo
  WHERE t4.categoria_pai = t3.codigo
    AND t1.categoria_pai IS NULL;

  RAISE NOTICE 'Campos hierárquicos calculados com sucesso para todos os tagsets';
END;
$$ LANGUAGE plpgsql;

-- Executar função para calcular hierarquia de todos os tagsets existentes
SELECT calculate_tagset_hierarchy();

-- Adicionar comentário explicativo
COMMENT ON FUNCTION calculate_tagset_hierarchy() IS 
'Calcula automaticamente nivel_profundidade, hierarquia_completa, tagset_pai e codigo_nivel_X para todos os tagsets baseado em categoria_pai';