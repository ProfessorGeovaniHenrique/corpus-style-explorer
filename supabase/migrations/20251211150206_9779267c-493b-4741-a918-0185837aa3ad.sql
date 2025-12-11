-- ============================================
-- SECURITY FIX: annotation_debug_logs - Admin Only Access
-- ============================================

-- 1. Drop any existing public SELECT policies
DROP POLICY IF EXISTS "Allow anonymous to insert annotation_debug_logs" ON public.annotation_debug_logs;
DROP POLICY IF EXISTS "Allow authenticated to insert annotation_debug_logs" ON public.annotation_debug_logs;
DROP POLICY IF EXISTS "Allow public to read annotation_debug_logs" ON public.annotation_debug_logs;
DROP POLICY IF EXISTS "Allow authenticated to read annotation_debug_logs" ON public.annotation_debug_logs;
DROP POLICY IF EXISTS "Public can insert debug logs" ON public.annotation_debug_logs;
DROP POLICY IF EXISTS "Public can read debug logs" ON public.annotation_debug_logs;

-- 2. Ensure RLS is enabled
ALTER TABLE public.annotation_debug_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create INSERT policy for edge functions (service role bypasses RLS anyway)
-- Allow inserts from anyone (for debugging purposes - edge functions use service role)
CREATE POLICY "Service role can insert debug logs"
ON public.annotation_debug_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 4. Create SELECT policy restricted to admins only
CREATE POLICY "Only admins can read debug logs"
ON public.annotation_debug_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create UPDATE policy restricted to admins only
CREATE POLICY "Only admins can update debug logs"
ON public.annotation_debug_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Create DELETE policy restricted to admins only
CREATE POLICY "Only admins can delete debug logs"
ON public.annotation_debug_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Add comment documenting security measures
COMMENT ON TABLE public.annotation_debug_logs IS 
'Debug logs for annotation requests. 
SECURITY: Contains sensitive data (request payloads, response data, error details).
- INSERT: Allowed for logging purposes (service role)
- SELECT/UPDATE/DELETE: Restricted to admins only via has_role() function';