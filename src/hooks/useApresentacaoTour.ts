/**
 * 🎯 TOUR GUIADO - APRESENTAÇÃO
 * 
 * Tour interativo usando Shepherd.js para guiar usuários
 * pelas funcionalidades da TabApresentacao
 */

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface TourOptions {
  autoStart?: boolean;
  onComplete?: () => void;
}

export function useApresentacaoTour(options: TourOptions = {}) {
  const tourRef = useRef<typeof Shepherd.Tour.prototype | null>(null);

  useEffect(() => {
    // Criar tour instance
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true
        },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 8,
      }
    });

    // Passo 1: Introdução
    tour.addStep({
      id: 'intro',
      title: '👋 Bem-vindo ao VersoAustral',
      text: `
        <p>Este tour guiado vai te mostrar como explorar a análise estilística da canção <strong>"Quando o Verso Vem pras Casa"</strong> de Luiz Marenco.</p>
        <p class="mt-2">Vamos conhecer cada seção da análise!</p>
      `,
      buttons: [
        {
          text: 'Pular Tour',
          action: tour.cancel,
          secondary: true
        },
        {
          text: 'Começar',
          action: tour.next
        }
      ]
    });

    // Passo 2: Letra da Música
    tour.addStep({
      id: 'letra',
      title: '📜 Letra da Música',
      text: `
        <p>Aqui você encontra a <strong>letra completa</strong> da música que está sendo analisada.</p>
        <p class="mt-2">Este é nosso corpus de estudo principal - 143 palavras que revelam muito sobre a linguagem gaúcha.</p>
      `,
      attachTo: {
        element: '[data-tour="letra-musica"]',
        on: 'left'
      },
      buttons: [
        {
          text: 'Voltar',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Próximo',
          action: tour.next
        }
      ]
    });

    // Passo 3: Player
    tour.addStep({
      id: 'player',
      title: '🎵 Ouça a Música',
      text: `
        <p>Clique no player para <strong>ouvir a música</strong> enquanto explora a análise.</p>
        <p class="mt-2">A experiência sonora ajuda a compreender melhor as escolhas estilísticas do artista.</p>
      `,
      attachTo: {
        element: '[data-tour="music-player"]',
        on: 'left'
      },
      buttons: [
        {
          text: 'Voltar',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Próximo',
          action: tour.next
        }
      ]
    });

    // Passo 4: Aba Domínios
    tour.addStep({
      id: 'dominios',
      title: '🗂️ Domínios Semânticos',
      text: `
        <p>Na aba <strong>Domínios</strong>, você verá a distribuição temática comparativa.</p>
        <p class="mt-2">Compare o corpus gaúcho com o corpus nordestino para identificar características linguísticas regionais.</p>
      `,
      attachTo: {
        element: '[data-tour="tab-dominios"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Voltar',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Próximo',
          action: tour.next
        }
      ]
    });

    // Passo 5: Aba Estatísticas
    tour.addStep({
      id: 'estatisticas',
      title: '📊 Análise Estatística',
      text: `
        <p>A aba <strong>Estatísticas</strong> mostra métricas de <strong>keyness</strong>:</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li>• <strong>Log-Likelihood (LL)</strong>: Significância estatística das palavras-chave</li>
          <li>• <strong>Mutual Information (MI)</strong>: Força da associação palavra-corpus</li>
        </ul>
      `,
      attachTo: {
        element: '[data-tour="tab-estatisticas"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Voltar',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Próximo',
          action: tour.next
        }
      ]
    });

    // Passo 6: Aba Nuvem
    tour.addStep({
      id: 'nuvem',
      title: '☁️ Visualização Interativa',
      text: `
        <p>A <strong>Nuvem de Palavras</strong> oferece uma visualização espacial dos domínios semânticos.</p>
        <p class="mt-2">Explore visualmente a distribuição temática da música!</p>
      `,
      attachTo: {
        element: '[data-tour="tab-nuvem"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Voltar',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Finalizar',
          action: tour.complete
        }
      ]
    });

    // Evento de conclusão
    tour.on('complete', () => {
      localStorage.setItem('apresentacao_tour_completed', 'true');
      options.onComplete?.();
    });

    // Salvar referência
    tourRef.current = tour;

    // Auto-start se solicitado e não foi completado antes
    if (options.autoStart) {
      const hasCompleted = localStorage.getItem('apresentacao_tour_completed');
      if (!hasCompleted) {
        setTimeout(() => tour.start(), 500);
      }
    }

    // Cleanup
    return () => {
      tour.cancel();
    };
  }, [options.autoStart, options.onComplete]);

  const startTour = () => {
    tourRef.current?.start();
  };

  const resetTour = () => {
    localStorage.removeItem('apresentacao_tour_completed');
    tourRef.current?.start();
  };

  return {
    startTour,
    resetTour,
    tour: tourRef.current
  };
}
