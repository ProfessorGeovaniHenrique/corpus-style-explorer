import { useMemo } from "react";
import { CorpusDomain } from "@/services/corpusDataService";
import { calculateAllDomainStats } from "@/lib/linguisticStats";
import { HIERARCHY_CONFIG } from "@/config/hierarchyConfig";
import {
  VisualNode,
  VisualDomainNode,
  VisualWordNode,
  DomainConnection,
  ViewMode,
  RawDomainData,
  RawWordData,
} from "@/data/types/threeVisualization.types";
import {
  calculateGlowIntensity,
  calculateProsodyOpacity,
  normalizeWithThreshold,
  calculatePulseSpeed,
} from "@/lib/visualNormalization";
import { DominioSemantico } from "@/data/types/corpus.types";

// Tamanho do corpus
const CORPUS_SIZE = 10000;

/**
 * Hook para gerar dados 3D da nuvem de domínios semânticos
 * Refatorado com separação clara entre dados brutos e visuais
 * 
 * @param dominiosData - Dados dos domínios (agora recebidos externamente)
 */
export function useThreeSemanticData(
  viewMode: ViewMode = 'constellation',
  selectedDomainId?: string,
  dominiosData?: CorpusDomain[]
) {
  const { nodes, stats, connections } = useMemo(() => {
    // Se não houver dados, retornar vazio
    if (!dominiosData || dominiosData.length === 0) {
      return { nodes: [], stats: null, connections: [] };
    }

    // ===== FASE 1: Converter dados brutos =====
    const rawDomains = convertToRawDomains(dominiosData);
    
    // ===== FASE 2: Criar nós visuais de domínios =====
    const domainNodes = createDomainNodes(
      rawDomains,
      viewMode,
      selectedDomainId
    );
    
    // ===== FASE 3: Criar nós visuais de palavras =====
    const wordNodes = createWordNodes(
      rawDomains,
      domainNodes,
      viewMode,
      selectedDomainId
    );
    
    // ===== FASE 4: Combinar nós =====
    const allNodes = [...domainNodes, ...wordNodes];
    
    // ===== FASE 5: Calcular estatísticas =====
    const domainStats = rawDomains.length > 0 ? {
      totalDomains: rawDomains.length,
      avgLexicalRichness: rawDomains.reduce((a, d) => a + d.lexicalRichness, 0) / rawDomains.length,
      avgTextualWeight: rawDomains.reduce((a, d) => a + d.textualWeight, 0) / rawDomains.length
    } : null;
    
    // ===== FASE 6: Calcular conexões =====
    const connections = calculateDomainConnections();
    
    return { nodes: allNodes, stats: domainStats, connections };
  }, [viewMode, selectedDomainId, dominiosData]);
  
  return { nodes, stats, connections };
}

// ===== FUNÇÕES AUXILIARES =====

/**
 * Converte dados reais para estrutura RawDomainData
 */
function convertToRawDomains(dominios: CorpusDomain[]): RawDomainData[] {
  return dominios
    .filter(d => d.dominio !== "Palavras Funcionais")
    .map(dominio => ({
      id: dominio.dominio,
      name: dominio.dominio,
      rawFrequency: dominio.ocorrencias,
      normalizedFrequency: dominio.percentual,
      lexicalRichness: dominio.riquezaLexical / 100,
      textualWeight: dominio.percentual,
      comparisonStatus: 'equilibrado',
      color: dominio.cor,
      textColor: '#ffffff',
      words: dominio.palavras.map(p => ({
        text: p,
        rawFrequency: 1,
        normalizedFrequency: 1,
        prosody: 'Neutra' as const,
      })),
    }));
}

/**
 * Cria nós visuais de domínios
 */
function createDomainNodes(
  rawDomains: RawDomainData[],
  viewMode: ViewMode,
  selectedDomainId?: string
): VisualDomainNode[] {
  const config = HIERARCHY_CONFIG;
  
  return rawDomains.map((domain, index) => {
    // Calcular escala baseado em riqueza lexical
    const scale = config.domainSize.min + 
                  domain.lexicalRichness * config.domainSize.multiplier;
    
    // Calcular glow intensity baseado em peso textual
    const glowIntensity = calculateGlowIntensity(
      domain.textualWeight,
      config.domainGlow
    );
    
    // Calcular velocidade de pulso
    const pulseSpeed = calculatePulseSpeed(domain.textualWeight);
    
    // Calcular posição
    const position = calculateDomainPosition(
      index,
      rawDomains.length,
      viewMode,
      selectedDomainId === domain.id,
      config
    );
    
    return {
      id: `domain-${domain.id}`,
      label: domain.name,
      type: 'domain',
      position,
      scale,
      color: domain.color,
      glowIntensity,
      pulseSpeed,
      baseOpacity: 1.0,
      rawData: domain,
    };
  });
}

/**
 * Cria nós visuais de palavras
 */
function createWordNodes(
  rawDomains: RawDomainData[],
  domainNodes: VisualDomainNode[],
  viewMode: ViewMode,
  selectedDomainId?: string
): VisualWordNode[] {
  const config = HIERARCHY_CONFIG;
  const wordNodes: VisualWordNode[] = [];
  
  rawDomains.forEach(domain => {
    // Encontrar o nó de domínio correspondente
    const domainNode = domainNodes.find(n => n.id === `domain-${domain.id}`);
    if (!domainNode) return;
    
    // Ocultar palavras de outros domínios no modo orbital
    const shouldHide = viewMode === 'orbital' && 
                       selectedDomainId && 
                       domain.id !== selectedDomainId;
    
    if (shouldHide) return;
    
    // Pegar top N palavras mais frequentes
    const topWords = domain.words
      .sort((a, b) => b.rawFrequency - a.rawFrequency)
      .slice(0, config.topWordsPerDomain);
    
    topWords.forEach((word, wordIndex) => {
      // Calcular escala baseado em frequência normalizada
      const scale = normalizeWithThreshold(
        word.normalizedFrequency,
        config.wordSize.threshold,
        { min: config.wordSize.min, max: config.wordSize.max }
      );
      
      // Calcular opacidade baseado em prosódia
      const opacity = calculateProsodyOpacity(
        word.prosody,
        config.wordOpacity
      );
      
      // Calcular glow intensity
      const glowIntensity = 0.3 + word.normalizedFrequency / 30;
      
      // Calcular posição orbital ao redor do domínio
      const position = calculateWordPosition(
        domainNode.position,
        wordIndex,
        topWords.length,
        viewMode,
        config
      );
      
      wordNodes.push({
        id: `word-${word.text}`,
        label: word.text,
        type: 'word',
        position,
        scale,
        color: domain.color,
        opacity,
        baseOpacity: opacity,
        glowIntensity,
        domain: domain.name,
        frequency: word.rawFrequency,
        prosody: word.prosody,
        rawData: word,
      });
    });
  });
  
  return wordNodes;
}

/**
 * Calcula posição do domínio
 */
function calculateDomainPosition(
  index: number,
  total: number,
  viewMode: ViewMode,
  isSelected: boolean,
  config: typeof HIERARCHY_CONFIG
): [number, number, number] {
  // Se for o domínio selecionado no modo orbital, colocar no centro
  if (viewMode === 'orbital' && isSelected) {
    return [...config.layout.orbital.centerPosition];
  }
  
  // Distribuir em círculo
  const angle = (index / total) * Math.PI * 2;
  const radius = config.layout.constellation.domainOrbitRadius;
  
  return [
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius
  ];
}

/**
 * Calcula posição da palavra orbitando o domínio
 */
function calculateWordPosition(
  domainPosition: [number, number, number],
  wordIndex: number,
  totalWords: number,
  viewMode: ViewMode,
  config: typeof HIERARCHY_CONFIG
): [number, number, number] {
  const layout = viewMode === 'constellation' 
    ? config.layout.constellation 
    : config.layout.orbital;
  
  // Distribuir palavras em círculo ao redor do domínio
  const angleOffset = (wordIndex / totalWords) * Math.PI * 2;
  const orbitRadius = layout.wordOrbitRadiusMin + 
                      Math.random() * (layout.wordOrbitRadiusMax - layout.wordOrbitRadiusMin);
  
  return [
    domainPosition[0] + Math.cos(angleOffset) * orbitRadius,
    Math.sin(angleOffset * 2) * layout.verticalSpread, // Variação vertical
    domainPosition[2] + Math.sin(angleOffset) * orbitRadius
  ];
}

/**
 * Calcula conexões entre domínios (mock estático por enquanto)
 */
function calculateDomainConnections(): DomainConnection[] {
  return [
    { from: "Cultura e Lida Gaúcha", to: "Natureza e Paisagem", strength: 0.7 },
    { from: "Sentimentos e Abstrações", to: "Qualidades e Estados", strength: 0.5 },
    { from: "Natureza e Paisagem", to: "Sentimentos e Abstrações", strength: 0.4 },
    { from: "Ações e Processos", to: "Cultura e Lida Gaúcha", strength: 0.6 }
  ];
}

// Re-exportar tipos para compatibilidade
export type { VisualNode, VisualDomainNode, VisualWordNode, DomainConnection, ViewMode };
