-- ✅ SINCRONIZAÇÃO FORÇADA: Atualizar TODOS os registros validados
UPDATE gutenberg_lexicon
SET 
  validation_status = 'approved',
  reviewed_at = COALESCE(reviewed_at, atualizado_em, criado_em)
WHERE validado = true;

UPDATE dialectal_lexicon
SET 
  validation_status = 'approved',
  reviewed_at = COALESCE(reviewed_at, atualizado_em, criado_em)
WHERE validado_humanamente = true;

-- ✅ TRIGGERS AUTOMÁTICOS: Manter consistência futura

-- Função para sincronizar Gutenberg
CREATE OR REPLACE FUNCTION sync_gutenberg_validation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validado = true AND (NEW.validation_status IS NULL OR NEW.validation_status = 'pending') THEN
    NEW.validation_status := 'approved';
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, NEW.atualizado_em, NEW.criado_em);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Gutenberg
DROP TRIGGER IF EXISTS gutenberg_validation_sync ON gutenberg_lexicon;
CREATE TRIGGER gutenberg_validation_sync
  BEFORE INSERT OR UPDATE ON gutenberg_lexicon
  FOR EACH ROW
  EXECUTE FUNCTION sync_gutenberg_validation_status();

-- Função para sincronizar Dialectal
CREATE OR REPLACE FUNCTION sync_dialectal_validation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validado_humanamente = true AND (NEW.validation_status IS NULL OR NEW.validation_status = 'pending') THEN
    NEW.validation_status := 'approved';
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, NEW.atualizado_em, NEW.criado_em);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Dialectal
DROP TRIGGER IF EXISTS dialectal_validation_sync ON dialectal_lexicon;
CREATE TRIGGER dialectal_validation_sync
  BEFORE INSERT OR UPDATE ON dialectal_lexicon
  FOR EACH ROW
  EXECUTE FUNCTION sync_dialectal_validation_status();