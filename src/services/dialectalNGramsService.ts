/**
 * 🔤 ANÁLISE DE N-GRAMS DIALETAIS
 * 
 * Identifica expressões multi-palavra típicas da cultura gaúcha
 * usando o dicionário e análise estatística
 */

import { findInDictionary, DIALECTAL_DICTIONARY } from '@/data/dialectal-dictionary';
import { NGram, NGramAnalysis } from '@/data/types/full-text-corpus.types';
import { isDialectalStopword } from '@/data/dialectal-stopwords';

export interface DialectalNGram {
  ngram: string;
  frequencia: number;
  score: number;
  tipo: 'expressao_fixa' | 'colocacao_forte' | 'colocacao_media';
  categoria?: string;
  definicao?: string;
  palavrasDialetais: string[];
  noDicionario: boolean;
}

// Expressões fixas conhecidas do dicionário
const EXPRESSOES_FIXAS = [
  { expressao: 'de sol a sol', categoria: 'lida_campeira', definicao: 'Do amanhecer ao anoitecer, o dia todo trabalhando' },
  { expressao: 'campo afora', categoria: 'lida_campeira', definicao: 'Pelos campos, terra adentro' },
  { expressao: 'gado chimarrão', categoria: 'lida_campeira', definicao: 'Gado solto e selvagem' },
  { expressao: 'cavalo crioulo', categoria: 'fauna', definicao: 'Raça de cavalo típica do pampa' },
  { expressao: 'pago querência', categoria: 'social', definicao: 'Terra natal, lugar de origem' },
  { expressao: 'nos pagos', categoria: 'social', definicao: 'Na região, nas terras de origem' },
  { expressao: 'lida campeira', categoria: 'lida_campeira', definicao: 'Trabalho rural com gado' },
  { expressao: 'de cabeça gacha', categoria: 'social', definicao: 'Com postura de submissão ou vergonha' },
  { expressao: 'tropeiro velho', categoria: 'lida_campeira', definicao: 'Tropeiro experiente' },
  { expressao: 'galpão de estância', categoria: 'habitacao', definicao: 'Construção típica para reuniões' },
  { expressao: 'fogo de chão', categoria: 'culinaria', definicao: 'Fogueira no solo para chimarrão e churrasco' },
  { expressao: 'roda de mate', categoria: 'culinaria', definicao: 'Reunião social para tomar chimarrão' },
  { expressao: 'cantador de vaneira', categoria: 'musica', definicao: 'Músico que toca vaneiras' },
  { expressao: 'baile de galpão', categoria: 'musica', definicao: 'Festa tradicional gaúcha' },
  { expressao: 'china faceira', categoria: 'social', definicao: 'Mulher gaúcha elegante' },
  { expressao: 'peão campeiro', categoria: 'lida_campeira', definicao: 'Trabalhador rural experiente' },
];

/**
 * Analisa N-grams e identifica expressões dialetais
 */
export function analyzeDialectalNGrams(ngrams: NGram[]): DialectalNGram[] {
  const dialectalNGrams: DialectalNGram[] = [];

  for (const ngram of ngrams) {
    const words = ngram.ngram.split(' ');
    
    // Ignora N-grams muito curtos ou muito longos
    if (words.length < 2 || words.length > 4) continue;
    
    // Ignora se todas as palavras são stopwords
    if (words.every(w => isDialectalStopword(w))) continue;

    // TIPO 1: Expressões fixas do dicionário
    const expressaoFixa = EXPRESSOES_FIXAS.find(
      exp => exp.expressao.toLowerCase() === ngram.ngram.toLowerCase()
    );

    if (expressaoFixa) {
      dialectalNGrams.push({
        ngram: ngram.ngram,
        frequencia: ngram.frequencia,
        score: 100 + ngram.frequencia * 5, // Score alto para expressões conhecidas
        tipo: 'expressao_fixa',
        categoria: expressaoFixa.categoria,
        definicao: expressaoFixa.definicao,
        palavrasDialetais: words,
        noDicionario: true
      });
      continue;
    }

    // TIPO 2: N-grams com pelo menos uma palavra no dicionário
    const palavrasNoDicionario = words.filter(w => findInDictionary(w));
    
    if (palavrasNoDicionario.length === 0) continue;

    // Calcula score baseado em:
    // - Frequência do N-gram
    // - Quantidade de palavras dialetais
    // - Proporção de palavras dialetais
    const proporcaoDialetal = palavrasNoDicionario.length / words.length;
    const bonusFrequencia = Math.log(ngram.frequencia + 1) * 10;
    const bonusPalavrasDialetais = palavrasNoDicionario.length * 15;
    const score = bonusFrequencia + bonusPalavrasDialetais + (proporcaoDialetal * 30);

    // Classifica força da colocação
    let tipo: 'colocacao_forte' | 'colocacao_media';
    if (proporcaoDialetal >= 0.5 && ngram.frequencia >= 10) {
      tipo = 'colocacao_forte';
    } else {
      tipo = 'colocacao_media';
    }

    // Pega categoria da primeira palavra dialetal encontrada
    const primeiraPalavraDialetal = palavrasNoDicionario[0];
    const dictEntry = findInDictionary(primeiraPalavraDialetal);

    dialectalNGrams.push({
      ngram: ngram.ngram,
      frequencia: ngram.frequencia,
      score,
      tipo,
      categoria: dictEntry?.categoria,
      definicao: dictEntry ? `Expressão contendo: ${dictEntry.definicao}` : undefined,
      palavrasDialetais: palavrasNoDicionario,
      noDicionario: palavrasNoDicionario.length > 0
    });
  }

  // Ordena por score e retorna top resultados
  return dialectalNGrams
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
}

/**
 * Filtra N-grams dialetais por categoria
 */
export function filterByCategory(ngrams: DialectalNGram[], categoria: string): DialectalNGram[] {
  if (categoria === 'todos') return ngrams;
  return ngrams.filter(ng => ng.categoria === categoria);
}

/**
 * Filtra N-grams dialetais por tipo
 */
export function filterByType(ngrams: DialectalNGram[], tipo: string): DialectalNGram[] {
  if (tipo === 'todos') return ngrams;
  return ngrams.filter(ng => ng.tipo === tipo);
}

/**
 * Retorna estatísticas dos N-grams dialetais
 */
export function getDialectalNGramsStats(ngrams: DialectalNGram[]) {
  const total = ngrams.length;
  const expressoesFixes = ngrams.filter(ng => ng.tipo === 'expressao_fixa').length;
  const colocacoesFortes = ngrams.filter(ng => ng.tipo === 'colocacao_forte').length;
  const colocacoesMedias = ngrams.filter(ng => ng.tipo === 'colocacao_media').length;

  // Estatísticas por categoria
  const porCategoria: Record<string, number> = {};
  ngrams.forEach(ng => {
    if (ng.categoria) {
      porCategoria[ng.categoria] = (porCategoria[ng.categoria] || 0) + 1;
    }
  });

  return {
    total,
    expressoesFixes,
    colocacoesFortes,
    colocacoesMedias,
    porCategoria,
    mediaFrequencia: total > 0 
      ? (ngrams.reduce((sum, ng) => sum + ng.frequencia, 0) / total).toFixed(1)
      : '0'
  };
}
