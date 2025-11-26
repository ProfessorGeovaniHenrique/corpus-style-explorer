import { useMemo } from "react";
import { CorpusDomain } from "@/services/corpusDataService";

export interface GalaxyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  colorText: string;
  size: number;
  domain: string;
  frequency: number;
  prosody: 'Positiva' | 'Negativa' | 'Neutra';
  type: 'domain' | 'word';
}

/**
 * Hook para processar dados normalizados em layout orbital
 * Distribui domínios em círculo e palavras orbitando cada domínio
 * 
 * @param dominiosData - Dados dos domínios (agora recebidos externamente)
 */
export function useGalaxyData(dominiosData?: CorpusDomain[]) {
  const nodes = useMemo(() => {
    const galaxyNodes: GalaxyNode[] = [];
    
    // Centro da galáxia (canvas 1400x800)
    const centerX = 700;
    const centerY = 400;
    
    // Se não houver dados externos, retornar vazio
    if (!dominiosData || dominiosData.length === 0) {
      return galaxyNodes;
    }
    
    // Filtrar domínios (excluir palavras funcionais se houver)
    const domains = dominiosData.filter(
      d => d.dominio !== "Palavras Funcionais"
    );
    
    // Distribuir domínios em círculo
    const domainRadius = 250; // Raio da órbita dos domínios
    
    domains.forEach((dominio, domainIndex) => {
      const angle = (domainIndex / domains.length) * Math.PI * 2;
      const domainX = centerX + Math.cos(angle) * domainRadius;
      const domainY = centerY + Math.sin(angle) * domainRadius;
      
      // Adicionar nó do domínio (planeta central)
      galaxyNodes.push({
        id: `domain-${dominio.dominio}`,
        label: dominio.dominio,
        x: domainX,
        y: domainY,
          color: dominio.cor,
          colorText: '#ffffff',
        size: 35, // Tamanho fixo para domínios
        domain: dominio.dominio,
        frequency: dominio.ocorrencias,
        prosody: 'Neutra',
        type: 'domain'
      });
      
      // Distribuir palavras em órbita ao redor do domínio
      const palavras = dominio.palavras || [];
      const wordOrbitRadius = 80;
      
      palavras.forEach((palavraText, wordIndex) => {
        const wordAngle = (wordIndex / palavras.length) * Math.PI * 2;
        
        // Criar camadas de órbita (3 camadas)
        const layer = wordIndex % 3;
        const layerRadius = wordOrbitRadius + layer * 25;
        
        const wordX = domainX + Math.cos(wordAngle) * layerRadius;
        const wordY = domainY + Math.sin(wordAngle) * layerRadius;
        
        // Tamanho fixo (dados de frequência individual não disponíveis)
        const wordSize = 8;
        
        galaxyNodes.push({
          id: `word-${palavraText}`,
          label: palavraText,
          x: wordX,
          y: wordY,
          color: dominio.cor,
          colorText: '#ffffff',
          size: wordSize,
          domain: dominio.dominio,
          frequency: 1,
          prosody: 'Neutra' as const,
          type: 'word'
        });
      });
    });
    
    return galaxyNodes;
  }, [dominiosData]);
  
  return { nodes };
}
