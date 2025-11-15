/**
 * Estilo Visual Cosmic Sci-Fi
 * Cores, efeitos e temas visuais
 */

export const COSMIC_STYLE = {
  // Cores por status de comparação
  domainColors: {
    'super-representado': 'hsl(142, 71%, 45%)', // Verde neon
    'equilibrado': 'hsl(200, 70%, 50%)',        // Azul ciano
    'sub-representado': 'hsl(340, 75%, 50%)',   // Magenta
  },
  
  // Background por domínio (para zoom)
  backgroundTints: {
    'Cultura e Lida Gaúcha': { r: 0.1, g: 0.3, b: 0.15 },
    'Natureza e Paisagem': { r: 0.0, g: 0.2, b: 0.3 },
    'Sentimentos e Abstrações': { r: 0.2, g: 0.1, b: 0.3 },
    'Qualidades e Estados': { r: 0.3, g: 0.0, b: 0.2 },
    'Ações e Processos': { r: 0.3, g: 0.2, b: 0.0 },
    'Partes do Corpo e Seres Vivos': { r: 0.3, g: 0.1, b: 0.1 },
  } as Record<string, { r: number; g: number; b: number }>,
  
  // Efeitos de hover
  hover: {
    scaleMultiplier: 1.3,
    emissiveIntensity: 0.8,
    duration: 0.3, // segundos
  },
  
  // Efeitos de conexão
  connections: {
    lineWidth: 2,
    opacity: 0.3,
    dashScale: 10,
    dashSize: 2,
    gapSize: 1,
  },
  
  // Bloom post-processing
  bloom: {
    luminanceThreshold: 0.2,
    luminanceSmoothing: 0.9,
    intensity: 1.5,
  },
  
  // Ambiente
  environment: {
    preset: 'night' as const,
    backgroundStars: {
      count: 5000,
      color: '#ffffff',
      size: 0.05,
      radius: 100,
    },
  },
} as const;
