-- Conceder permissão SELECT na materialized view para roles de acesso
GRANT SELECT ON public.artist_stats_mv TO authenticated;
GRANT SELECT ON public.artist_stats_mv TO anon;