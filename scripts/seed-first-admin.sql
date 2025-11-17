-- ============================================
-- SEED: Primeiro Usuário Admin
-- ============================================
-- Este script cria o primeiro admin do sistema
-- Execute DEPOIS de criar a conta via signup na UI
-- ============================================

-- INSTRUÇÕES:
-- 1. Faça signup na página /auth com seu email
-- 2. Copie seu user_id da tabela auth.users (query abaixo)
-- 3. Substitua 'SEU_USER_ID_AQUI' pelo seu UUID
-- 4. Execute este script completo

-- ============================================
-- PASSO 1: Encontrar seu user_id
-- ============================================
-- Execute esta query primeiro para ver seu user_id:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- ============================================
-- PASSO 2: Inserir role de admin
-- ============================================
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo UUID que você copiou acima!

INSERT INTO public.user_roles (user_id, role)
VALUES (
  'SEU_USER_ID_AQUI'::uuid,  -- ⚠️ SUBSTITUA AQUI COM SEU UUID
  'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- PASSO 3: Verificar se deu certo
-- ============================================
-- Execute esta query para confirmar:
-- SELECT ur.*, u.email 
-- FROM public.user_roles ur
-- JOIN auth.users u ON ur.user_id = u.id
-- WHERE ur.role = 'admin';

-- ============================================
-- EXEMPLO COMPLETO (PASSO A PASSO):
-- ============================================
-- 
-- 1. Encontre seu user_id:
--    SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
--    Resultado: id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
--
-- 2. Execute o INSERT substituindo o UUID:
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'admin'::app_role)
--    ON CONFLICT DO NOTHING;
--
-- 3. Confirme que funcionou:
--    SELECT * FROM public.user_roles WHERE role = 'admin';
--
-- ============================================
