-- Adicionar campo album para armazenar metadados de álbum
ALTER TABLE songs ADD COLUMN IF NOT EXISTS album text;

-- Adicionar comentário para documentação
COMMENT ON COLUMN songs.album IS 'Nome do álbum extraído de múltiplas fontes durante enriquecimento';