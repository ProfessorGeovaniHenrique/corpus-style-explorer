-- Fix ambiguous key_code bug in generate_invite_key function
CREATE OR REPLACE FUNCTION public.generate_invite_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_key_code := 'VA-' || 
                    UPPER(substring(md5(random()::text) from 1 for 4)) || '-' ||
                    UPPER(substring(md5(random()::text) from 1 for 4));
    
    -- Fixed: no ambiguity between column and variable
    SELECT EXISTS(SELECT 1 FROM public.invite_keys WHERE key_code = new_key_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_key_code;
END;
$$;

-- Add fields for magic link invites
ALTER TABLE public.invite_keys 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS magic_link_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS magic_link_token TEXT UNIQUE;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_invite_keys_magic_token 
ON public.invite_keys(magic_link_token) 
WHERE magic_link_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.invite_keys.recipient_email IS 'Email do destinatário para convites via magic link';
COMMENT ON COLUMN public.invite_keys.magic_link_token IS 'Token único para magic link, usado no callback de autenticação';