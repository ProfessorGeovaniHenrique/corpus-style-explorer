-- Fix RLS policies for analytics_events table
-- Issue: Table is publicly readable, exposing user tracking data

-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Admins can read all analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins have full access to analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics_events" ON public.analytics_events;

-- Ensure RLS is enabled
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create PERMISSIVE policies (default type, allows access when condition is true)

-- Only admins can read analytics events (PERMISSIVE policy)
CREATE POLICY "Only admins can read analytics_events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert analytics events (needed for tracking)
CREATE POLICY "Anyone can insert analytics_events"
ON public.analytics_events
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Only admins can update/delete analytics events
CREATE POLICY "Only admins can modify analytics_events"
ON public.analytics_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));