/**
 * Configuração da Hierarquia Visual
 * Define como os dados estatísticos são mapeados para propriedades visuais
 */

export const HIERARCHY_CONFIG = {
  // Mapeamento: Riqueza Lexical → Tamanho da Esfera
  domainSize: {
    min: 1.5,  // Menor esfera
    max: 4.5,  // Maior esfera
    multiplier: 3,
    // Formula: scale = min + (lexicalRichness * multiplier)
  },
  
  // Mapeamento: Peso Textual → Intensidade do Glow
  domainGlow: {
    base: 0.5,
    multiplier: 1.3,
    max: 1.8,
    // Formula: glow = base + (textualWeight / 100 * multiplier)
  },
  
  // Mapeamento: Frequência Normalizada → Tamanho da Palavra
  wordSize: {
    min: 0.3,
    max: 1.0,
    threshold: 10, // Frequência normalizada máxima considerada
    // Formula: scale = min + Math.min(1, normalizedFreq / threshold) * (max - min)
  },
  
  // Mapeamento: Prosódia Semântica → Opacidade da Palavra
  wordOpacity: {
    'Positiva': 1.0,
    'Neutra': 0.7,
    'Negativa': 0.5,
  } as const,
  
  // Animação de Pulso para Domínios Super-Representados
  domainPulse: {
    threshold: 20, // percentualTematico > 20%
    amplitude: 0.05, // 5% de variação no tamanho
    speed: 2, // ciclos por segundo
  },
  
  // Layout Espacial
  layout: {
    constellation: {
      domainOrbitRadius: 15,
      wordOrbitRadiusMin: 3,
      wordOrbitRadiusMax: 5,
      verticalSpread: 2,
    },
    orbital: {
      centerPosition: [0, 0, 0] as [number, number, number],
      wordOrbitRadiusMin: 5,
      wordOrbitRadiusMax: 10,
      verticalSpread: 4,
    },
  },
  
  // Top N palavras por domínio
  topWordsPerDomain: 15,
} as const;
