/**
 * Configuração de Animações GSAP
 * Durations, easings e sequências
 */

export const ANIMATION_CONFIG = {
  // Zoom para domínio
  domainZoom: {
    camera: {
      duration: 2.5,
      ease: 'power3.inOut',
      offsetX: 10,
      offsetY: 8,
      offsetZ: 12,
    },
    background: {
      duration: 1.5,
      ease: 'power2.inOut',
      delay: 0.5,
    },
    fadeOtherDomains: {
      duration: 1.0,
      targetOpacity: 0.1,
      ease: 'power2.out',
    },
    expandWords: {
      duration: 1.5,
      ease: 'elastic.out(1, 0.5)',
      scaleMultiplier: 2,
    },
  },
  
  // Hover cascade
  hoverCascade: {
    wordScale: {
      duration: 0.3,
      scale: 1.3,
    },
    sameDomainFade: {
      duration: 0.2,
      opacity: 0.8,
    },
    otherDomainFade: {
      duration: 0.2,
      opacity: 0.2,
    },
  },
  
  // Reset de câmera
  cameraReset: {
    duration: 1.5,
    ease: 'power2.inOut',
  },
  
  // Transição de filtros
  filterTransition: {
    duration: 0.5,
    ease: 'power2.out',
  },
} as const;
