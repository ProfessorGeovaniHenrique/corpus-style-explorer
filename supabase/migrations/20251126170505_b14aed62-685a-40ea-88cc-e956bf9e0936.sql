-- Normalizar normalized_name para compatibilidade com CorpusType TypeScript
UPDATE corpora SET normalized_name = 'gaucho' WHERE normalized_name = 'corpus-gaucho';
UPDATE corpora SET normalized_name = 'nordestino' WHERE normalized_name = 'corpus-nordestino';
UPDATE corpora SET normalized_name = 'sertanejo' WHERE normalized_name = 'corpus-sertanejo';