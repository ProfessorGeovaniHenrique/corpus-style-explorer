-- Fase 1: Remover constraints antigas
ALTER TABLE semantic_tagset DROP CONSTRAINT IF EXISTS check_nivel_pai;
ALTER TABLE semantic_tagset DROP CONSTRAINT IF EXISTS semantic_tagset_nivel_profundidade_check;

-- Fase 2: Criar nova constraint para nivel_profundidade permitindo 0-4
ALTER TABLE semantic_tagset ADD CONSTRAINT semantic_tagset_nivel_profundidade_check 
CHECK (nivel_profundidade >= 0 AND nivel_profundidade <= 4);

-- Fase 3: Criar nova constraint para relacionamento nivel/pai
ALTER TABLE semantic_tagset ADD CONSTRAINT check_nivel_pai CHECK (
  -- Nível 0 (transitório): não pode ter pai
  (nivel_profundidade = 0 AND categoria_pai IS NULL)
  OR
  -- Nível 1 (raiz): não pode ter pai
  (nivel_profundidade = 1 AND categoria_pai IS NULL)
  OR
  -- Níveis 2-4: devem ter pai
  (nivel_profundidade >= 2 AND nivel_profundidade <= 4 AND categoria_pai IS NOT NULL)
);

-- Fase 4: Atualizar NC para nível 0 (transitório)
UPDATE semantic_tagset
SET 
  nivel_profundidade = 0,
  descricao = 'Domínio transitório para palavras ainda não classificadas semanticamente. Não participa das análises estatísticas de domínios. Palavras anotadas com NC devem ser reclassificadas para um dos 12 domínios N1 legítimos.',
  hierarquia_completa = '[Transitório] Não Classificado'
WHERE codigo = 'NC';

-- Verificar resultado
SELECT codigo, nome, nivel_profundidade, categoria_pai, hierarquia_completa
FROM semantic_tagset
WHERE codigo = 'NC';