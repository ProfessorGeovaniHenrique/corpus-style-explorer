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
    // Verificar tanto o código quanto o nome do domínio para compatibilidade
    const keywordsFiltradas = originalKeywords.filter(k => 
      !(k.dominioCodigo?.startsWith('MG') || k.dominio === 'Marcadores Gramaticais')
    );
    
    // Filtrar cloudData removendo domínios MG
    const cloudDataFiltrado = originalCloudData.filter(c => !c.codigo.startsWith('MG'));
    
    // Recalcular total de ocorrências sem MG
    const totalOcorrenciasSemMG = keywordsFiltradas.reduce((sum, k) => sum + k.frequencia, 0);
    
    // Agrupar keywords por domínio usando código (com fallback para nome)
    const dominioMap = new Map<string, KeywordData[]>();
    keywordsFiltradas.forEach(k => {
      // Usar código se disponível, senão usar nome do domínio
      const chave = k.dominioCodigo || k.dominio;
      if (!dominioMap.has(chave)) {
        dominioMap.set(chave, []);
      }
      dominioMap.get(chave)!.push(k);
    });
    
    // Recalcular métricas de cada domínio
    const dominiosRecalculados: DomainData[] = [];
    
    dominioMap.forEach((palavrasChave, codigoDominio) => {
      // Buscar por código OU por nome para compatibilidade com dados antigos
      const dominioOriginal = originalDominios.find(d => 
        d.codigo === codigoDominio || d.dominio === codigoDominio
      );
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
