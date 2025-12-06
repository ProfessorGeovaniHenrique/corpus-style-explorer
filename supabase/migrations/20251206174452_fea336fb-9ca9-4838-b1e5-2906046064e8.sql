-- SPRINT RAC-2: Correção emergencial - cancelar todos jobs duplicados ainda processando

-- Passo 1: Cancelar TODOS os jobs 'processando' que têm mensagem de erro de duplicado da RAC-1
UPDATE semantic_annotation_jobs 
SET 
  status = 'cancelado', 
  tempo_fim = NOW()
WHERE 
  status = 'processando' 
  AND erro_mensagem LIKE '%race condition cleanup%';

-- Passo 2: Para cada artista com múltiplos jobs processando, manter apenas o mais recente
UPDATE semantic_annotation_jobs j1
SET 
  status = 'cancelado', 
  tempo_fim = NOW(),
  erro_mensagem = 'Job duplicado cancelado (Sprint RAC-2)'
WHERE 
  j1.status = 'processando'
  AND EXISTS (
    SELECT 1 FROM semantic_annotation_jobs j2 
    WHERE j2.artist_id = j1.artist_id 
    AND j2.status = 'processando'
    AND j2.tempo_inicio > j1.tempo_inicio
  );