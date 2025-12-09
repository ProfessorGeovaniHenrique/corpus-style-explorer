/**
 * 🎯 TOUR GUIADO - CATÁLOGO DE MÚSICAS
 * Sprint CAT-AUDIT-P3 - Onboarding com Shepherd.js
 * 
 * Tour interativo para guiar professores/usuários
 * pelas funcionalidades do catálogo musical
 */

import { useEffect, useRef, useCallback } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface TourOptions {
  autoStart?: boolean;
  onComplete?: () => void;
}

const TOUR_STORAGE_KEY = 'music_catalog_tour_completed';

export function useMusicCatalogTour(options: TourOptions = {}) {
  const tourRef = useRef<typeof Shepherd.Tour.prototype | null>(null);

  useEffect(() => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: { enabled: true },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 8,
      }
    });

    // Passo 1: Boas-vindas
    tour.addStep({
      id: 'welcome',
      title: '👋 Bem-vindo ao Catálogo Musical',
      text: `
        <p>Este tour vai te mostrar como explorar e gerenciar o catálogo de músicas do <strong>VersoAustral</strong>.</p>
        <p class="mt-2">Vamos conhecer as principais funcionalidades!</p>
      `,
      buttons: [
        { text: 'Pular Tour', action: tour.cancel, secondary: true },
        { text: 'Começar', action: tour.next }
      ]
    });

    // Passo 2: Busca Inteligente
    tour.addStep({
      id: 'search',
      title: '🔍 Busca Inteligente',
      text: `
        <p>Use a <strong>barra de busca</strong> para encontrar artistas e músicas rapidamente.</p>
        <p class="mt-2">A busca oferece sugestões automáticas enquanto você digita!</p>
      `,
      attachTo: { element: '[data-tour="search-autocomplete"]', on: 'bottom' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Próximo', action: tour.next }
      ]
    });

    // Passo 3: Filtro Alfabético
    tour.addStep({
      id: 'alphabet-filter',
      title: '🔤 Filtro Alfabético',
      text: `
        <p>Clique em uma <strong>letra</strong> para filtrar artistas por inicial.</p>
        <p class="mt-2">Use as teclas ← → para navegar e Enter para selecionar.</p>
      `,
      attachTo: { element: '[data-tour="alphabet-filter"]', on: 'bottom' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Próximo', action: tour.next }
      ]
    });

    // Passo 4: Cartão do Artista
    tour.addStep({
      id: 'artist-card',
      title: '🎤 Cartão do Artista',
      text: `
        <p>Cada cartão mostra <strong>estatísticas</strong> do artista:</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li>• Total de músicas no catálogo</li>
          <li>• Músicas pendentes de enriquecimento</li>
          <li>• Barra de progresso de completude</li>
        </ul>
      `,
      attachTo: { element: '[data-tour="artist-card"]', on: 'right' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Próximo', action: tour.next }
      ]
    });

    // Passo 5: Botão Analisar
    tour.addStep({
      id: 'analyze-button',
      title: '🔬 Analisar Corpus',
      text: `
        <p>Clique em <strong>Analisar Corpus</strong> para ir às ferramentas de análise estilística.</p>
        <p class="mt-2">Lá você pode explorar domínios semânticos, estatísticas e visualizações!</p>
      `,
      attachTo: { element: '[data-tour="analyze-corpus-button"]', on: 'bottom' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Próximo', action: tour.next }
      ]
    });

    // Passo 6: Abas do Catálogo
    tour.addStep({
      id: 'tabs',
      title: '📑 Navegação por Abas',
      text: `
        <p>O catálogo possui várias <strong>abas</strong>:</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li>• <strong>Artistas</strong>: Lista de todos os artistas</li>
          <li>• <strong>Músicas</strong>: Visualização das músicas</li>
          <li>• <strong>Métricas</strong>: Estatísticas do catálogo</li>
          <li>• <strong>Jobs</strong>: Gerenciamento de processamentos</li>
        </ul>
      `,
      attachTo: { element: '[data-tour="catalog-tabs"]', on: 'bottom' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Finalizar', action: tour.complete }
      ]
    });

    // Evento de conclusão
    tour.on('complete', () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      options.onComplete?.();
    });

    tourRef.current = tour;

    // Auto-start se solicitado e não foi completado antes
    if (options.autoStart) {
      const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!hasCompleted) {
        // Aguardar elementos renderizarem
        setTimeout(() => tour.start(), 1500);
      }
    }

    return () => {
      tour.cancel();
    };
  }, [options.autoStart, options.onComplete]);

  const startTour = useCallback(() => {
    tourRef.current?.start();
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    tourRef.current?.start();
  }, []);

  const hasCompletedTour = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  }, []);

  return {
    startTour,
    resetTour,
    hasCompletedTour,
    tour: tourRef.current
  };
}
