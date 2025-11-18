import { useEffect, useState } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

export function useQuickTour() {
  const [tour] = useState(() => {
    const newTour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: {
          enabled: true,
        },
      },
    });

    return newTour;
  });

  useEffect(() => {
    const shouldShowQuickTour = localStorage.getItem('show_quick_tour') === 'true';
    
    if (shouldShowQuickTour) {
      // Remove flag para não mostrar novamente
      localStorage.removeItem('show_quick_tour');
      
      // Aguarda 1 segundo para garantir que a página carregou
      const timer = setTimeout(() => {
        startQuickTour();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const startQuickTour = () => {
    tour.addStep({
      id: "quick-intro",
      title: "🚀 Tour Rápido - 30 segundos",
      text: "Vou mostrar rapidamente as 3 áreas principais da plataforma!",
      buttons: [
        {
          text: "Iniciar",
          action: tour.next,
        },
      ],
    });

    tour.addStep({
      id: "quick-tabs",
      title: "📍 Navegação",
      text: "Use estas abas para navegar entre as diferentes seções.",
      attachTo: {
        element: "[data-tour='header-tabs']",
        on: "bottom",
      },
      buttons: [
        {
          text: "Próximo",
          action: tour.next,
        },
      ],
    });

    tour.addStep({
      id: "quick-apresentacao",
      title: "✨ Apresentação",
      text: "Demonstração completa com corpus pré-carregado. Explore visualizações interativas!",
      attachTo: {
        element: "[data-tour='header-tab-apresentacao']",
        on: "bottom",
      },
      buttons: [
        {
          text: "Próximo",
          action: tour.next,
        },
      ],
    });

    tour.addStep({
      id: "quick-tools",
      title: "🔧 Ferramentas",
      text: "Suite profissional de Linguística de Corpus: KWIC, Keywords, Wordlist, N-grams e Dispersão.",
      attachTo: {
        element: "[data-tour='header-tab-tools']",
        on: "bottom",
      },
      buttons: [
        {
          text: "Próximo",
          action: tour.next,
        },
      ],
    });

    tour.addStep({
      id: "quick-complete",
      title: "🎉 Pronto!",
      text: "Agora você conhece a plataforma. Explore à vontade e clique nos ícones de ajuda (?) para tours detalhados de cada ferramenta.",
      buttons: [
        {
          text: "Começar a explorar",
          action: tour.complete,
        },
      ],
    });

    tour.start();
  };

  return {
    startQuickTour,
  };
}
