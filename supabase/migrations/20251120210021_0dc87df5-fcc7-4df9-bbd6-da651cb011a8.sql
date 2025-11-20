-- Adicionar suporte a Multi-Word Expressions (MWE)
ALTER TABLE dialectal_lexicon 
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'word' 
CHECK (entry_type IN ('word', 'mwe'));

ALTER TABLE gutenberg_lexicon 
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'word' 
CHECK (entry_type IN ('word', 'mwe'));

CREATE INDEX IF NOT EXISTS idx_dialectal_entry_type ON dialectal_lexicon(entry_type);
CREATE INDEX IF NOT EXISTS idx_gutenberg_entry_type ON gutenberg_lexicon(entry_type);