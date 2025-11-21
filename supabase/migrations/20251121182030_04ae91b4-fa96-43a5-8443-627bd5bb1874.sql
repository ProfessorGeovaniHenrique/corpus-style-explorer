-- ============================================
-- FASE 9: Criar bucket 'corpus' para Storage
-- ============================================
-- Bucket para armazenar arquivos Excel/CSV de upload
-- Permite que admins façam upload de planilhas de músicas

-- Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'corpus',
  'corpus',
  false,
  20971520,
  ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-excel', 
        'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS Policies para o bucket 'corpus'
-- ============================================

-- POLICY 1: Admins podem fazer UPLOAD
CREATE POLICY "Admins podem fazer upload no corpus"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'corpus' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- POLICY 2: Admins podem LER arquivos
CREATE POLICY "Admins podem ler arquivos do corpus"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'corpus' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- POLICY 3: Admins podem DELETAR arquivos
CREATE POLICY "Admins podem deletar arquivos do corpus"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'corpus' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- POLICY 4: Admins podem ATUALIZAR metadados
CREATE POLICY "Admins podem atualizar metadados no corpus"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'corpus' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'corpus' AND
  has_role(auth.uid(), 'admin'::app_role)
);