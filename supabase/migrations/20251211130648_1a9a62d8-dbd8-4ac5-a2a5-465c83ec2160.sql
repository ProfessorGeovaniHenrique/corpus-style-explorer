-- Fix RLS policies for edge_function_logs table
-- Issue: Sensitive data (IPs, request payloads) potentially exposed

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access to edge_function_logs" ON public.edge_function_logs;
DROP POLICY IF EXISTS "Only admins can view edge function logs" ON public.edge_function_logs;

-- Ensure RLS is enabled
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read edge function logs (PERMISSIVE policy)
CREATE POLICY "Only admins can read edge_function_logs"
ON public.edge_function_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert logs (needed for edge functions to log)
CREATE POLICY "System can insert edge_function_logs"
ON public.edge_function_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Only admins can update/delete logs
CREATE POLICY "Only admins can manage edge_function_logs"
ON public.edge_function_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));