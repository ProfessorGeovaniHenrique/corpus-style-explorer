import { useMemo } from 'react';
import { useDashboardAnaliseContext, DomainData, KeywordData } from '@/contexts/DashboardAnaliseContext';

/**
 * Hook que retorna domínios e keywords filtrados com base nas configurações
 * Aplica filtro de marcadores gramaticais (MG) se ativado
 */
export function useDominiosComFiltro() {
  const { processamentoData } = useDashboardAnaliseContext();
  
  const ignorarMarcadoresGramaticais = processamentoData.ignorarMarcadoresGramaticais || false;
  
  const { dominios, keywords, cloudData, estatisticas } = useMemo(() => {
    const originalDominios = processamentoData.analysisResults?.dominios || [];
    const originalKeywords = processamentoData.analysisResults?.keywords || [];
    const originalCloudData = processamentoData.analysisResults?.cloudData || [];
    const originalEstatisticas = processamentoData.analysisResults?.estatisticas;
    
    // Se não deve ignorar MG, retorna dados originais
    if (!ignorarMarcadoresGramaticais) {
      return { 
        dominios: originalDominios, 
        keywords: originalKeywords,
        cloudData: originalCloudData,
        estatisticas: originalEstatisticas
      };
    }

    // Filtrar keywords removendo marcadores gramaticais (MG)
    const keywordsFiltradas = originalKeywords.filter(k => !k.dominio.startsWith('MG'));
    
    // Filtrar cloudData removendo domínios MG
    const cloudDataFiltrado = originalCloudData.filter(c => !c.codigo.startsWith('MG'));
    
    // Recalcular total de ocorrências sem MG
    const totalOcorrenciasSemMG = keywordsFiltradas.reduce((sum, k) => sum + k.frequencia, 0);
    
    // Agrupar keywords por domínio
    const dominioMap = new Map<string, KeywordData[]>();
    keywordsFiltradas.forEach(k => {
      const dominio = k.dominio;
      if (!dominioMap.has(dominio)) {
        dominioMap.set(dominio, []);
      }
      dominioMap.get(dominio)!.push(k);
    });
    
    // Recalcular métricas de cada domínio
    const dominiosRecalculados: DomainData[] = [];
    
    dominioMap.forEach((palavrasChave, codigoDominio) => {
      const dominioOriginal = originalDominios.find(d => d.codigo === codigoDominio);
      if (!dominioOriginal) return;
      
      const ocorrencias = palavrasChave.reduce((sum, k) => sum + k.frequencia, 0);
      const percentual = totalOcorrenciasSemMG > 0 ? (ocorrencias / totalOcorrenciasSemMG) * 100 : 0;
      const palavras = palavrasChave.map(k => k.palavra);
      const avgLL = palavrasChave.reduce((sum, k) => sum + k.ll, 0) / palavrasChave.length;
      const avgMI = palavrasChave.reduce((sum, k) => sum + k.mi, 0) / palavrasChave.length;
      
      dominiosRecalculados.push({
        ...dominioOriginal,
        palavras,
        ocorrencias,
        percentual,
        avgLL,
        avgMI,
        riquezaLexical: palavras.length,
      });
    });
    
    // Ordenar por percentual decrescente
    dominiosRecalculados.sort((a, b) => b.percentual - a.percentual);
    
    // Recalcular estatísticas gerais se existirem
    let estatisticasRecalculadas = originalEstatisticas;
    if (originalEstatisticas) {
      const totalPalavrasSemMG = keywordsFiltradas.length;
      const dominiosIdentificadosSemMG = dominiosRecalculados.length;
      
      // Recalcular prosódia sem MG
      const prosodiaPositivas = keywordsFiltradas.filter(k => k.prosody === 'Positiva').length;
      const prosodiaNegativas = keywordsFiltradas.filter(k => k.prosody === 'Negativa').length;
      const prosodiaNeutras = keywordsFiltradas.filter(k => k.prosody === 'Neutra').length;
      const totalProsody = prosodiaPositivas + prosodiaNegativas + prosodiaNeutras;
      
      estatisticasRecalculadas = {
        ...originalEstatisticas,
        totalPalavras: totalPalavrasSemMG,
        dominiosIdentificados: dominiosIdentificadosSemMG,
        prosodiaDistribution: {
          positivas: prosodiaPositivas,
          negativas: prosodiaNegativas,
          neutras: prosodiaNeutras,
          percentualPositivo: totalProsody > 0 ? (prosodiaPositivas / totalProsody) * 100 : 0,
          percentualNegativo: totalProsody > 0 ? (prosodiaNegativas / totalProsody) * 100 : 0,
          percentualNeutro: totalProsody > 0 ? (prosodiaNeutras / totalProsody) * 100 : 0,
        },
      };
    }
    
    return { 
      dominios: dominiosRecalculados, 
      keywords: keywordsFiltradas,
      cloudData: cloudDataFiltrado,
      estatisticas: estatisticasRecalculadas
    };
  }, [
    processamentoData.analysisResults?.dominios, 
    processamentoData.analysisResults?.keywords,
    processamentoData.analysisResults?.cloudData,
    processamentoData.analysisResults?.estatisticas,
    ignorarMarcadoresGramaticais
  ]);
  
  return { dominios, keywords, cloudData, estatisticas };
}
