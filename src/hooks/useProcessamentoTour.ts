import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface ProcessamentoTourOptions {
  autoStart?: boolean;
  onComplete?: () => void;
  onStepChange?: (stepId: string) => void;
}

export function useProcessamentoTour(options: ProcessamentoTourOptions = {}) {
  const tourRef = useRef<any>(null);

  useEffect(() => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: { enabled: true },
        modalOverlayOpeningPadding: 12,
        modalOverlayOpeningRadius: 12,
      }
    });

    // PASSO 1: Selecionar Artista
    tour.addStep({
      id: 'select-artist',
      title: '🎯 Passo 1: Escolha o Artista',
      text: `
        <p>Clique aqui e procure por <strong>Luiz Marenco</strong>.</p>
        <p class="mt-2 text-sm bg-primary/10 p-2 rounded">
          💡 <strong>Dica:</strong> Aperte a letra <kbd class="px-1 py-0.5 bg-muted rounded">L</kbd> 
          para ir direto para os artistas com essa inicial!
        </p>
      `,
      attachTo: { element: '[data-tour="artist-select"]', on: 'bottom' },
      buttons: [
        { text: 'Próximo', action: tour.next }
      ],
      beforeShowPromise: () => {
        options.onStepChange?.('select-artist');
        return Promise.resolve();
      }
    });

    // PASSO 2: Modo Música
    tour.addStep({
      id: 'select-mode',
      title: '🎵 Passo 2: Modo Música',
      text: `
        <p>Agora clique no botão <strong>"Música"</strong> para escolhermos a canção específica.</p>
      `,
      attachTo: { element: '[data-tour="song-mode-button"]', on: 'bottom' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Próximo', action: tour.next }
      ],
      beforeShowPromise: () => {
        options.onStepChange?.('select-mode');
        return Promise.resolve();
      }
    });

    // PASSO 3: Selecionar Música
    tour.addStep({
      id: 'select-song',
      title: '🎵 Passo 3: Selecione a Música',
      text: `
        <p>Clique aqui para abrir o menu e selecionar a música <strong>"Quando o verso vem pras casa"</strong>.</p>
      `,
      attachTo: { element: '[data-tour="song-search"]', on: 'bottom' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Próximo', action: tour.next }
      ],
      beforeShowPromise: () => {
        options.onStepChange?.('select-song');
        return Promise.resolve();
      }
    });

    // PASSO 4: Processar
    tour.addStep({
      id: 'process-corpus',
      title: '✅ Passo 4: Processar!',
      text: `
        <p><strong>Perfeito!</strong> Agora clique em "Processar Corpus" para iniciar a análise semântica.</p>
        <p class="mt-2 text-sm text-muted-foreground">
          O sistema irá classificar cada palavra da música em domínios semânticos.
        </p>
      `,
      attachTo: { element: '[data-tour="process-button"]', on: 'top' },
      buttons: [
        { text: 'Voltar', action: tour.back, secondary: true },
        { text: 'Finalizar Tutorial', action: tour.complete }
      ],
      beforeShowPromise: () => {
        options.onStepChange?.('process-corpus');
        return Promise.resolve();
      }
    });

    tour.on('complete', () => {
      localStorage.setItem('processamento_tour_completed', 'true');
      options.onComplete?.();
    });

    tour.on('cancel', () => {
      localStorage.setItem('processamento_tour_completed', 'true');
    });

    tourRef.current = tour;

    if (options.autoStart) {
      const hasCompleted = localStorage.getItem('processamento_tour_completed');
      if (!hasCompleted) {
        setTimeout(() => tour.start(), 800);
      }
    }

    return () => { 
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, []);

  return {
    startTour: () => tourRef.current?.start(),
    nextStep: () => tourRef.current?.next(),
    goToStep: (id: string) => tourRef.current?.show(id),
    resetTour: () => {
      localStorage.removeItem('processamento_tour_completed');
      tourRef.current?.start();
    }
  };
}
