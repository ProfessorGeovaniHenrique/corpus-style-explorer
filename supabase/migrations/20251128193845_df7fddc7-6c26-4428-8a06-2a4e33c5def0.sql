-- Criar função SECURITY DEFINER para verificar tokens de convite
-- Esta função bypassa RLS e retorna apenas dados necessários do convite
CREATE OR REPLACE FUNCTION public.verify_invite_token(
  p_token uuid,
  p_invite_code text
)
RETURNS TABLE (
  id uuid,
  key_code text,
  recipient_email text,
  recipient_name text,
  role app_role,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ik.id,
    ik.key_code,
    ik.recipient_email,
    ik.recipient_name,
    ik.role,
    (ik.is_active = true 
     AND ik.used_by IS NULL 
     AND (ik.expires_at IS NULL OR ik.expires_at > now())
    ) as is_valid
  FROM invite_keys ik
  WHERE ik.magic_link_token = p_token
    AND ik.key_code = p_invite_code;
END;
$$;

-- Permitir que usuários não autenticados e autenticados executem a função
GRANT EXECUTE ON FUNCTION public.verify_invite_token(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_invite_token(uuid, text) TO authenticated;