/**
 * 🔍 SCRIPT DE AUDITORIA DE DADOS DO CORPUS
 * 
 * Valida a integridade dos dados de mockup, identificando:
 * - Palavras sem lema
 * - Palavras sem domínio
 * - Palavras sem prosódia
 * - Inconsistências entre arquivos
 * - Palavras duplicadas (não lemas, pois lemas podem ter múltiplas formas)
 */

import { frequenciaNormalizadaData } from '../frequencia-normalizada';
import { palavrasChaveData } from '../palavras-chave';
import { dominiosNormalizados } from '../dominios-normalized';
import { prosodiasLemasMap } from '../prosodias-lemas';

// Configuração para desabilitar auditoria automática
export const CORPUS_AUDIT_CONFIG = {
  enableAutoAudit: true, // Mude para false para desabilitar auditoria automática
  logLevel: 'warn' as 'log' | 'warn' | 'error' // Nível de log
};

interface AuditReport {
  totalWords: number;
  issues: {
    palavrasSemLema: string[];
    palavrasSemDominio: string[];
    lemasSemProsodia: string[];
    lemasNaoNaFrequencia: string[];
    dominiosComPalavrasInvalidas: Array<{ dominio: string; palavrasInvalidas: string[] }>;
    palavrasDuplicadas: Array<{ palavra: string; count: number }>;
  };
  summary: {
    totalIssues: number;
    isValid: boolean;
  };
}

export function auditCorpusData(): AuditReport {
  console.group('🔍 AUDITORIA DE DADOS DO CORPUS');
  
  // 1. Verificar palavras sem lema
  const palavrasSemLema = palavrasChaveData
    .filter(p => !p.lema || p.lema.trim() === '')
    .map(p => p.palavra);
  
  // 2. Criar mapa de lemas para palavras temáticas
  const lemasSet = new Set(
    frequenciaNormalizadaData.map(f => f.lema)
  );
  
  // 3. Verificar palavras temáticas sem domínio
  const palavrasTematicas = palavrasChaveData.filter(p => p.significancia !== 'Funcional');
  const todosDominiosLemas = dominiosNormalizados
    .filter(d => d.dominio !== 'Palavras Funcionais')
    .flatMap(d => d.palavras);
  const dominiosLemaSet = new Set(todosDominiosLemas);
  
  const palavrasSemDominio = palavrasTematicas
    .filter(p => p.lema && !dominiosLemaSet.has(p.lema))
    .map(p => `${p.palavra} (lema: ${p.lema})`);
  
  // 4. Verificar lemas sem prosódia
  const lemasUnicos = Array.from(new Set(palavrasTematicas.map(p => p.lema).filter(Boolean)));
  const lemasSemProsodia = lemasUnicos.filter(lema => !prosodiasLemasMap[lema]);
  
  // 5. Verificar lemas em palavras-chave que não estão em frequencia-normalizada
  const lemasNaFrequencia = new Set(frequenciaNormalizadaData.map(f => f.lema));
  const lemasNaoNaFrequencia = Array.from(
    new Set(palavrasChaveData.map(p => p.lema).filter(Boolean))
  ).filter(lema => !lemasNaFrequencia.has(lema));
  
  // 6. Verificar domínios com palavras que não existem no corpus
  const dominiosComPalavrasInvalidas = dominiosNormalizados
    .filter(d => d.dominio !== 'Palavras Funcionais')
    .map(d => {
      const palavrasInvalidas = d.palavras.filter(p => !lemasSet.has(p));
      return { dominio: d.dominio, palavrasInvalidas };
    })
    .filter(d => d.palavrasInvalidas.length > 0);
  
  // 7. Verificar PALAVRAS duplicadas (não lemas, pois lemas podem ter múltiplas formas)
  const palavraCount: Record<string, number> = {};
  frequenciaNormalizadaData.forEach(f => {
    palavraCount[f.palavra] = (palavraCount[f.palavra] || 0) + 1;
  });
  const palavrasDuplicadas = Object.entries(palavraCount)
    .filter(([_, count]) => count > 1)
    .map(([palavra, count]) => ({ palavra, count }));
  
  // Montar relatório
  const report: AuditReport = {
    totalWords: palavrasChaveData.length,
    issues: {
      palavrasSemLema,
      palavrasSemDominio,
      lemasSemProsodia,
      lemasNaoNaFrequencia,
      dominiosComPalavrasInvalidas,
      palavrasDuplicadas
    },
    summary: {
      totalIssues: 
        palavrasSemLema.length +
        palavrasSemDominio.length +
        lemasSemProsodia.length +
        lemasNaoNaFrequencia.length +
        dominiosComPalavrasInvalidas.reduce((acc, d) => acc + d.palavrasInvalidas.length, 0) +
        palavrasDuplicadas.length,
      isValid: false
    }
  };
  
  report.summary.isValid = report.summary.totalIssues === 0;
  
  // Exibir relatório no console
  console.log('📊 Total de palavras:', report.totalWords);
  console.log('\n🔴 PROBLEMAS ENCONTRADOS:');
  
  if (palavrasSemLema.length > 0) {
    console[CORPUS_AUDIT_CONFIG.logLevel](`❌ ${palavrasSemLema.length} palavras sem lema:`, palavrasSemLema);
  }
  
  if (palavrasSemDominio.length > 0) {
    console[CORPUS_AUDIT_CONFIG.logLevel](`❌ ${palavrasSemDominio.length} palavras temáticas sem domínio:`, palavrasSemDominio);
  }
  
  if (lemasSemProsodia.length > 0) {
    console[CORPUS_AUDIT_CONFIG.logLevel](`❌ ${lemasSemProsodia.length} lemas sem prosódia:`, lemasSemProsodia);
  }
  
  if (lemasNaoNaFrequencia.length > 0) {
    console[CORPUS_AUDIT_CONFIG.logLevel](`❌ ${lemasNaoNaFrequencia.length} lemas em palavras-chave que não estão em frequencia-normalizada:`, lemasNaoNaFrequencia);
  }
  
  if (dominiosComPalavrasInvalidas.length > 0) {
    console[CORPUS_AUDIT_CONFIG.logLevel](`❌ ${dominiosComPalavrasInvalidas.length} domínios com palavras inválidas:`, dominiosComPalavrasInvalidas);
  }
  
  if (palavrasDuplicadas.length > 0) {
    console[CORPUS_AUDIT_CONFIG.logLevel](`⚠️ ${palavrasDuplicadas.length} palavras duplicadas em frequencia-normalizada:`, palavrasDuplicadas);
  }
  
  console.log('\n📈 RESUMO:');
  console.log(`Total de problemas: ${report.summary.totalIssues}`);
  console.log(`Status: ${report.summary.isValid ? '✅ Válido' : '❌ Inválido'}`);
  
  console.groupEnd();
  
  return report;
}

// Executar auditoria automaticamente quando importado (apenas em desenvolvimento)
if (typeof window !== 'undefined' && CORPUS_AUDIT_CONFIG.enableAutoAudit) {
  console.log('🚀 Executando auditoria de dados do corpus...');
  auditCorpusData();
}
