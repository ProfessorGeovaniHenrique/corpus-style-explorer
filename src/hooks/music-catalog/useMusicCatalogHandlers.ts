/**
 * Hook centralizado para handlers do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/loggerFactory';
import { Song } from '@/components/music/SongCard';
import type { MusicCatalogState } from './useMusicCatalogState';

const log = createLogger('MusicCatalogHandlers');

export function useMusicCatalogHandlers(state: MusicCatalogState) {
  const { toast } = useToast();
  
  // Convert SongWithRelations → Song
  const convertToSongCard = useCallback((songWithRelations: any): Song => ({
    id: songWithRelations.id,
    title: songWithRelations.title,
    normalized_title: songWithRelations.normalized_title,
    artist_id: songWithRelations.artist_id,
    composer: songWithRelations.composer,
    release_year: songWithRelations.release_year,
    lyrics: songWithRelations.lyrics,
    status: songWithRelations.status,
    confidence_score: songWithRelations.confidence_score,
    enrichment_source: songWithRelations.enrichment_source,
    youtube_url: songWithRelations.youtube_url,
    corpus_id: songWithRelations.corpus_id,
    upload_id: songWithRelations.upload_id,
    raw_data: songWithRelations.raw_data,
    created_at: songWithRelations.created_at,
    updated_at: songWithRelations.updated_at,
    artists: songWithRelations.artists,
    corpora: songWithRelations.corpora
  }), []);

  // Detect suspicious data
  const hasSuspiciousData = useCallback((song: Song): boolean => {
    if (!song.composer) return false;
    const composer = song.composer.toLowerCase();
    const artistName = song.artists?.name?.toLowerCase() || '';
    if (composer === artistName) return true;
    const junkWords = ['released', 'gravadora', 'records', 'provided', 'auto-generated', 
                       'topic', 'vevo', 'official', 'music', 'entertainment'];
    return junkWords.some(word => composer.includes(word));
  }, []);

  // Enrich single song
  const handleEnrichSong = useCallback(async (songId: string, forceReenrich?: boolean) => {
    log.info('Starting song enrichment', { songId, forceReenrich });
    
    try {
      const enrichPromise = supabase.functions.invoke('enrich-music-data', {
        body: { songId, forceReenrich: forceReenrich || false }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: operação demorou mais de 30s')), 30000)
      );
      
      const { data, error } = await Promise.race([enrichPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      
      if (data?.success) {
        return {
          success: true,
          message: `${data.enrichedData?.composer || 'Compositor'} - ${data.confidenceScore}%`
        };
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao enriquecer');
      }
    } catch (error: any) {
      await supabase.from('songs').update({ status: 'pending' }).eq('id', songId);
      return { success: false, error: error.message || 'Falha ao buscar metadados' };
    }
  }, []);

  // Enrich song UI wrapper
  const handleEnrichSongUI = useCallback(async (songId: string) => {
    if (state.enrichingIds.has(songId)) return;
    
    state.setEnrichingIds(prev => new Set(prev).add(songId));
    
    try {
      const result = await handleEnrichSong(songId);
      
      if (result.success) {
        toast({ title: "✨ Música enriquecida!", description: result.message });
        await state.reload();
        await state.reloadArtistSongs?.();
      } else {
        toast({ title: "Erro ao enriquecer", description: result.error, variant: "destructive" });
      }
    } finally {
      state.setEnrichingIds(prev => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  }, [state, handleEnrichSong, toast]);

  // Batch enrich
  const handleBatchEnrich = useCallback(async () => {
    try {
      state.setLoading(true);
      toast({ title: "Buscando músicas pendentes...", description: "Consultando banco de dados." });

      const { data: pendingSongsData, error } = await supabase
        .from('songs')
        .select(`id, title, artists (name)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingFormatted = pendingSongsData?.map(s => ({
        id: s.id,
        title: s.title,
        artist: (s.artists as any)?.name || 'Desconhecido'
      })) || [];

      if (pendingFormatted.length === 0) {
        toast({ title: "Nenhuma música pendente", description: "Todas já foram enriquecidas!" });
        return;
      }

      state.setPendingSongsForBatch(pendingFormatted);
      state.setBatchModalOpen(true);
    } catch (error: any) {
      toast({ title: "Erro ao buscar músicas", description: error.message, variant: "destructive" });
    } finally {
      state.setLoading(false);
    }
  }, [state, toast]);

  // YouTube batch enrich
  const handleBatchEnrichYouTube = useCallback(() => {
    const withoutYouTube = state.songs.filter(s => !s.youtube_url);
    state.setSongsWithoutYouTube(withoutYouTube);
    state.setYoutubeModalOpen(true);
  }, [state]);

  // Optimistic update
  const handleOptimisticUpdate = useCallback((artistId: string, enrichedCount: number) => {
    const artist = state.artistsWithStats.find((a: any) => a.id === artistId) as any;
    if (!artist || enrichedCount <= 0) return;
    
    state.setArtistStatsOverrides(prev => {
      const newMap = new Map(prev);
      const currentPending = artist.pendingSongs ?? 0;
      const currentEnriched = artist.enrichedSongs ?? 0;
      const totalSongs = artist.totalSongs ?? 1;
      
      newMap.set(artistId, {
        pendingSongs: Math.max(0, currentPending - enrichedCount),
        enrichedPercentage: Math.min(100, Math.round(((currentEnriched + enrichedCount) / totalSongs) * 100))
      });
      return newMap;
    });
  }, [state]);

  // Batch complete handler
  const handleBatchComplete = useCallback(async (enrichedCount: number = 0, artistIdFromModal?: string) => {
    const targetArtistId = artistIdFromModal || state.selectedArtistId;
    if (targetArtistId && enrichedCount > 0) {
      handleOptimisticUpdate(targetArtistId, enrichedCount);
    }
    
    state.setIsDataRefreshing(true);
    toast({ title: "🎉 Enriquecimento concluído!", description: `${enrichedCount} músicas processadas.` });
    
    await state.reloadWithDelay(2500);
    await state.reloadArtistSongs?.();
    
    state.setIsDataRefreshing(false);
    toast({ title: "✅ Dados atualizados", description: "Catálogo sincronizado." });
  }, [state, handleOptimisticUpdate, toast]);

  // Edit song (placeholder)
  const handleEditSong = useCallback((song: any) => {
    toast({ title: "Em desenvolvimento", description: "Funcionalidade de edição em breve." });
  }, [toast]);

  // Re-enrich song
  const handleReEnrichSong = useCallback(async (songId: string) => {
    if (state.enrichingIds.has(songId)) return;
    
    state.setEnrichingIds(prev => new Set(prev).add(songId));
    
    try {
      toast({ title: "Re-enriquecendo", description: "Buscando metadados atualizados..." });
      const result = await handleEnrichSong(songId);
      
      if (result.success) {
        toast({ title: "✨ Re-enriquecimento concluído!", description: result.message });
        await state.reload();
        await state.reloadArtistSongs?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } finally {
      state.setEnrichingIds(prev => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  }, [state, handleEnrichSong, toast]);

  // Mark as reviewed
  const handleMarkReviewed = useCallback(async (songId: string) => {
    try {
      const { error } = await supabase.from('songs').update({ status: 'approved' }).eq('id', songId);
      if (error) throw error;
      
      toast({ title: "✓ Aprovado", description: "Música marcada como revisada." });
      await state.reload();
    } catch (error: any) {
      toast({ title: "Erro", description: "Falha ao atualizar status.", variant: "destructive" });
    }
  }, [state, toast]);

  // Delete song
  const handleDeleteSong = useCallback(async (songId: string) => {
    try {
      const { error } = await supabase.from('songs').delete().eq('id', songId);
      if (error) throw error;
      
      toast({ title: "🗑️ Música deletada", description: "A música foi removida." });
      await state.reload();
    } catch (error: any) {
      toast({ title: "Erro", description: "Falha ao deletar música.", variant: "destructive" });
    }
  }, [state, toast]);

  // Bio enriched handler
  const handleBioEnriched = useCallback(async (artistId: string) => {
    try {
      state.setArtistBioOverrides(prev => {
        const newMap = new Map(prev);
        newMap.delete(artistId);
        return newMap;
      });
      
      const { data: artistData, error } = await supabase
        .from('artists')
        .select('biography, biography_source, biography_updated_at')
        .eq('id', artistId)
        .single();
      
      if (error) throw error;
      
      if (artistData?.biography) {
        state.setArtistBioOverrides(prev => {
          const newMap = new Map(prev);
          newMap.set(artistId, {
            biography: artistData.biography,
            biography_source: artistData.biography_source || 'unknown',
            biography_updated_at: artistData.biography_updated_at || new Date().toISOString()
          });
          return newMap;
        });
        
        toast({ title: "Biografia atualizada", description: "A biografia foi carregada." });
      }
    } catch (error: any) {
      toast({ title: "Erro ao atualizar biografia", description: "Tente reabrir o painel.", variant: "destructive" });
    }
  }, [state, toast]);

  // Clear catalog
  const handleClearCatalog = useCallback(async () => {
    state.setIsClearingCatalog(true);
    try {
      const { data, error } = await supabase.functions.invoke('clear-music-catalog');
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "🧹 Catálogo limpo!",
          description: `${data.deleted.songs} músicas, ${data.deleted.artists} artistas removidos.`
        });
        await state.reload();
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao limpar.", variant: "destructive" });
    } finally {
      state.setIsClearingCatalog(false);
    }
  }, [state, toast]);

  // Export report
  const handleExportReport = useCallback(() => {
    if (!state.enrichmentMetrics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalSongs: state.enrichmentMetrics.totalSongs,
        enriched: state.enrichmentMetrics.enrichedCount,
        pending: state.enrichmentMetrics.pendingCount,
        errors: state.enrichmentMetrics.errorCount,
        successRate: state.enrichmentMetrics.successRate,
        avgConfidence: state.enrichmentMetrics.avgConfidence
      },
      fieldCoverage: state.enrichmentMetrics.fieldCoverage,
      layerStats: state.enrichmentMetrics.layerStats,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-enriquecimento-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "✅ Relatório exportado!", description: "Arquivo JSON baixado." });
  }, [state, toast]);

  return {
    convertToSongCard,
    hasSuspiciousData,
    handleEnrichSong,
    handleEnrichSongUI,
    handleBatchEnrich,
    handleBatchEnrichYouTube,
    handleOptimisticUpdate,
    handleBatchComplete,
    handleEditSong,
    handleReEnrichSong,
    handleMarkReviewed,
    handleDeleteSong,
    handleBioEnriched,
    handleClearCatalog,
    handleExportReport,
  };
}
