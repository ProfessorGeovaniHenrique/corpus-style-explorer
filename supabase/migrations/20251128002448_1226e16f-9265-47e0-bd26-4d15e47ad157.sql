-- FASE 4: Adicionar constraint única em cultural_insignia_attribution
-- Previne duplicatas ao usar UPSERT

-- Remover duplicatas existentes (se houverem)
DELETE FROM cultural_insignia_attribution a
USING cultural_insignia_attribution b
WHERE a.id > b.id
  AND a.palavra = b.palavra
  AND a.insignia = b.insignia;

-- Adicionar constraint única
ALTER TABLE cultural_insignia_attribution
ADD CONSTRAINT unique_palavra_insignia UNIQUE (palavra, insignia);

-- Comentário
COMMENT ON CONSTRAINT unique_palavra_insignia ON cultural_insignia_attribution IS 
'Previne duplicatas - permite UPSERT com ON CONFLICT (palavra, insignia)';