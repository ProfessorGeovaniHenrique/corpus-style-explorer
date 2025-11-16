/**
 * 🎯 CORPUS MASTER - FONTE ÚNICA DE VERDADE
 * 
 * Este arquivo consolida TODOS os dados do corpus gaúcho em uma única estrutura,
 * garantindo consistência entre todas as abas e dashboards.
 * 
 * Estrutura integrada:
 * - Dados de frequenciaNormalizadaData (142 palavras)
 * - Dados estatísticos de palavrasChaveData (118 palavras)
 * - Mapeamento de domínios semânticos
 * - Mapeamento de prosódia semântica
 * 
 * IMPORTANTE: Este é o arquivo MASTER. Todos os outros dados devem ser derivados daqui.
 */

import { frequenciaNormalizadaData } from './frequencia-normalizada';
import { palavrasChaveData } from './palavras-chave';
import { dominiosNormalizados } from './dominios-normalized';
import { getProsodiaByLema } from './prosodias-lemas';
import { ProsodiaType } from '../types/corpus.types';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Interface completa de uma palavra no corpus master
 */
export interface CorpusMasterWord {
  // Dados básicos
  palavra: string;
  lema: string;
  frequenciaBruta: number;
  frequenciaNormalizada: number;
  
  // Domínio semântico
  dominio: string;
  
  // Prosódia semântica
  prosodia: ProsodiaType;
  
  // Estatísticas de keyness
  ll: number;
  mi: number;
  significancia: 'Alta' | 'Média' | 'Baixa' | 'Funcional';
  efeito: string;
  efeitoIcon: typeof TrendingUp | typeof TrendingDown;
}

/**
 * Cria o mapa de lema -> domínio a partir dos domínios normalizados
 */
function createLemaToDominioMap(): Record<string, string> {
  const map: Record<string, string> = {};
  
  dominiosNormalizados.forEach(dominio => {
    dominio.palavras.forEach(lema => {
      map[lema] = dominio.dominio;
    });
  });
  
  return map;
}

const lemaToDominioMap = createLemaToDominioMap();

/**
 * Cria o mapa de palavra -> dados estatísticos
 */
function createPalavraToStatsMap() {
  const map = new Map<string, typeof palavrasChaveData[0]>();
  palavrasChaveData.forEach(p => {
    map.set(p.palavra, p);
  });
  return map;
}

const palavraToStatsMap = createPalavraToStatsMap();

/**
 * 🎯 CORPUS MASTER CONSOLIDADO
 * 
 * Array de todas as 142 palavras do corpus com dados completos
 */
export const corpusMaster: CorpusMasterWord[] = frequenciaNormalizadaData.map(freq => {
  const stats = palavraToStatsMap.get(freq.palavra);
  const dominio = lemaToDominioMap[freq.lema] || 'Sem Classificação';
  const prosodia = getProsodiaByLema(freq.lema);
  
  // Garantir que significancia seja um dos valores permitidos
  let significancia: 'Alta' | 'Média' | 'Baixa' | 'Funcional' = 'Funcional';
  if (stats?.significancia === 'Alta' || stats?.significancia === 'Média' || 
      stats?.significancia === 'Baixa' || stats?.significancia === 'Funcional') {
    significancia = stats.significancia as 'Alta' | 'Média' | 'Baixa' | 'Funcional';
  }
  
  return {
    palavra: freq.palavra,
    lema: freq.lema,
    frequenciaBruta: freq.frequenciaBruta,
    frequenciaNormalizada: freq.frequenciaNormalizada,
    dominio,
    prosodia,
    ll: stats?.ll || 0,
    mi: stats?.mi || 0,
    significancia,
    efeito: stats?.efeito || 'Neutro',
    efeitoIcon: stats?.efeitoIcon || TrendingUp
  };
});

/**
 * 📊 FUNÇÕES DERIVADAS DO CORPUS MASTER
 */

/**
 * Retorna apenas palavras temáticas (exclui funcionais)
 */
export function getPalavrasTematicas(): CorpusMasterWord[] {
  return corpusMaster.filter(p => p.significancia !== 'Funcional');
}

/**
 * Retorna palavras de um domínio específico
 */
export function getPalavrasByDominio(dominio: string): CorpusMasterWord[] {
  return corpusMaster.filter(p => p.dominio === dominio);
}

/**
 * Retorna palavras por prosódia
 */
export function getPalavrasByProsodia(prosodia: ProsodiaType): CorpusMasterWord[] {
  return getPalavrasTematicas().filter(p => p.prosodia === prosodia);
}

/**
 * Retorna palavras-chave (alta significância estatística)
 */
export function getPalavrasChave(): CorpusMasterWord[] {
  return corpusMaster.filter(p => 
    p.significancia === 'Alta' || p.significancia === 'Média'
  );
}

/**
 * Calcula estatísticas agregadas por domínio
 */
export function getDominiosAgregados() {
  const dominios = Array.from(new Set(corpusMaster.map(p => p.dominio)));
  
  return dominios.map(dominio => {
    const palavras = getPalavrasByDominio(dominio);
    const ocorrencias = palavras.reduce((acc, p) => acc + p.frequenciaBruta, 0);
    const lemas = Array.from(new Set(palavras.map(p => p.lema)));
    
    return {
      dominio,
      riquezaLexical: lemas.length,
      ocorrencias,
      palavras: palavras.map(p => p.palavra),
      lemas
    };
  });
}

/**
 * Calcula estatísticas de prosódia ponderadas por frequência
 */
export function getProsodiaStats() {
  const tematicas = getPalavrasTematicas();
  const total = tematicas.reduce((acc, p) => acc + p.frequenciaBruta, 0);
  
  const positivas = tematicas
    .filter(p => p.prosodia === 'Positiva')
    .reduce((acc, p) => acc + p.frequenciaBruta, 0);
  
  const negativas = tematicas
    .filter(p => p.prosodia === 'Negativa')
    .reduce((acc, p) => acc + p.frequenciaBruta, 0);
  
  const neutras = tematicas
    .filter(p => p.prosodia === 'Neutra')
    .reduce((acc, p) => acc + p.frequenciaBruta, 0);
  
  return {
    total,
    positivas: { count: positivas, percent: ((positivas / total) * 100).toFixed(1) },
    negativas: { count: negativas, percent: ((negativas / total) * 100).toFixed(1) },
    neutras: { count: neutras, percent: ((neutras / total) * 100).toFixed(1) },
    razao: (positivas / (negativas || 1)).toFixed(2)
  };
}

/**
 * Busca uma palavra no corpus master
 */
export function findPalavra(palavra: string): CorpusMasterWord | undefined {
  return corpusMaster.find(p => p.palavra.toLowerCase() === palavra.toLowerCase());
}

/**
 * Busca todas as formas flexionadas de um lema
 */
export function findFormasByLema(lema: string): CorpusMasterWord[] {
  return corpusMaster.filter(p => p.lema === lema);
}

/**
 * 🔍 LOG DE VALIDAÇÃO DO CORPUS MASTER
 */
if (typeof window !== 'undefined') {
  console.group('🎯 CORPUS MASTER CONSOLIDADO');
  console.log('Total de palavras:', corpusMaster.length);
  console.log('Palavras temáticas:', getPalavrasTematicas().length);
  console.log('Palavras funcionais:', corpusMaster.filter(p => p.significancia === 'Funcional').length);
  console.log('Domínios únicos:', Array.from(new Set(corpusMaster.map(p => p.dominio))).length);
  console.log('\n📊 Estatísticas de Prosódia:');
  console.log(getProsodiaStats());
  console.log('\n📚 Domínios Agregados:');
  console.table(getDominiosAgregados());
  console.groupEnd();
}
