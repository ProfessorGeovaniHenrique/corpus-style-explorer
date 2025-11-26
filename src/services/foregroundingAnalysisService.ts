/**
 * Foregrounding Detection Service
 * Based on Prague School theory of deautomatization (Leech & Short 2007, Chapter 4)
 * Detects internal/external deviation and parallelism for prominence analysis
 */

export interface DeviationInstance {
  type: 'internal' | 'external' | 'parallelism';
  category: string;
  description: string;
  example: string;
  context: string;
  prominenceScore: number;
  statisticalSignificance?: number;
  metadata?: {
    artista?: string;
    musica?: string;
  };
}

export interface ForegroundingProfile {
  corpusType: string;
  totalDeviations: number;
  internalDeviations: number;
  externalDeviations: number;
  parallelisms: number;
  distribution: Record<string, number>;
  instances: DeviationInstance[];
  prominentPatterns: {
    pattern: string;
    frequency: number;
    avgProminence: number;
  }[];
  overallProminenceScore: number;
}

export interface ParallelStructure {
  structure: string;
  instances: string[];
  frequency: number;
}

/**
 * Detecta desvio interno: padrões que diferem da norma do próprio texto
 */
export function detectInternalDeviation(text: string): DeviationInstance[] {
  const instances: DeviationInstance[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calcular comprimento médio de sentença
  const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  const stdDev = Math.sqrt(
    sentences.reduce((sum, s) => {
      const len = s.split(/\s+/).length;
      return sum + Math.pow(len - avgLength, 2);
    }, 0) / sentences.length
  );
  
  // Detectar sentenças anormalmente longas ou curtas
  sentences.forEach((sentence, idx) => {
    const words = sentence.trim().split(/\s+/);
    const len = words.length;
    const deviation = Math.abs(len - avgLength) / stdDev;
    
    if (deviation > 2.0) {
      const category = len > avgLength ? 'sentença-longa-anormal' : 'sentença-curta-anormal';
      instances.push({
        type: 'internal',
        category,
        description: `Sentença com ${len} palavras (média: ${avgLength.toFixed(1)}, desvio: ${deviation.toFixed(2)}σ)`,
        example: sentence.trim().substring(0, 150),
        context: sentence.trim(),
        prominenceScore: Math.min(deviation / 2, 1.0),
        statisticalSignificance: deviation
      });
    }
  });
  
  // Detectar repetições incomuns de palavras
  const wordFreq: Record<string, number> = {};
  const allWords = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const avgFreq = Object.values(wordFreq).reduce((a, b) => a + b, 0) / Object.keys(wordFreq).length;
  const outliers = Object.entries(wordFreq).filter(([_, freq]) => freq > avgFreq * 3);
  
  outliers.forEach(([word, freq]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const match = text.match(regex);
    if (match && match.length > 0) {
      instances.push({
        type: 'internal',
        category: 'repetição-léxica-anormal',
        description: `Palavra "${word}" repetida ${freq}x (média: ${avgFreq.toFixed(1)}x)`,
        example: match.slice(0, 3).join(', '),
        context: `Frequência anormal: ${(freq / avgFreq).toFixed(2)}x acima da média`,
        prominenceScore: Math.min(freq / (avgFreq * 5), 1.0)
      });
    }
  });
  
  return instances;
}

/**
 * Detecta desvio externo: padrões que diferem de corpus de referência
 * (Simplificado - usa heurísticas sem corpus externo real)
 */
export function detectExternalDeviation(text: string, referenceNorms?: any): DeviationInstance[] {
  const instances: DeviationInstance[] = [];
  const lowerText = text.toLowerCase();
  
  // Palavras raras/neológicas (heurística: palavras muito longas)
  const longWords = text.match(/\b\w{15,}\b/gi);
  if (longWords && longWords.length > 0) {
    longWords.forEach(word => {
      instances.push({
        type: 'external',
        category: 'palavra-rara',
        description: `Palavra incomumente longa (${word.length} letras)`,
        example: word,
        context: '',
        prominenceScore: Math.min(word.length / 20, 1.0)
      });
    });
  }
  
  // Uso incomum de pontuação
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const totalSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  const exclamationRate = exclamations / totalSentences;
  const questionRate = questions / totalSentences;
  
  if (exclamationRate > 0.3) {
    instances.push({
      type: 'external',
      category: 'pontuação-expressiva',
      description: `Uso intenso de exclamações (${(exclamationRate * 100).toFixed(0)}% das sentenças)`,
      example: '!',
      context: `${exclamations} exclamações em ${totalSentences} sentenças`,
      prominenceScore: Math.min(exclamationRate * 2, 1.0)
    });
  }
  
  if (questionRate > 0.3) {
    instances.push({
      type: 'external',
      category: 'interrogação-intensiva',
      description: `Uso intenso de interrogações (${(questionRate * 100).toFixed(0)}% das sentenças)`,
      example: '?',
      context: `${questions} interrogações em ${totalSentences} sentenças`,
      prominenceScore: Math.min(questionRate * 2, 1.0)
    });
  }
  
  return instances;
}

/**
 * Detecta paralelismo: estruturas sintáticas repetidas
 */
export function detectParallelism(text: string): DeviationInstance[] {
  const instances: DeviationInstance[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Anáfora: repetição de palavra/frase no início
  const lineStarts: Record<string, string[]> = {};
  sentences.forEach(sentence => {
    const firstWords = sentence.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
    if (firstWords.length > 3) {
      if (!lineStarts[firstWords]) lineStarts[firstWords] = [];
      lineStarts[firstWords].push(sentence.trim());
    }
  });
  
  Object.entries(lineStarts).forEach(([start, lines]) => {
    if (lines.length >= 2) {
      instances.push({
        type: 'parallelism',
        category: 'anáfora',
        description: `Repetição de "${start}" no início de ${lines.length} linhas`,
        example: lines[0].substring(0, 100),
        context: lines.slice(0, 3).join(' | '),
        prominenceScore: Math.min(lines.length / 5, 1.0)
      });
    }
  });
  
  // Estruturas sintáticas paralelas (heurística: mesma estrutura POS)
  const patterns: Record<string, string[]> = {};
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    if (words.length >= 3 && words.length <= 8) {
      // Criar padrão simplificado (comprimento + primeira/última palavra)
      const pattern = `${words.length}-${words[0].toLowerCase()}-${words[words.length - 1].toLowerCase()}`;
      if (!patterns[pattern]) patterns[pattern] = [];
      patterns[pattern].push(sentence.trim());
    }
  });
  
  Object.entries(patterns).forEach(([pattern, lines]) => {
    if (lines.length >= 2) {
      instances.push({
        type: 'parallelism',
        category: 'paralelismo-sintático',
        description: `Estrutura paralela repetida ${lines.length}x`,
        example: lines[0].substring(0, 100),
        context: lines.slice(0, 2).join(' || '),
        prominenceScore: Math.min(lines.length / 4, 1.0)
      });
    }
  });
  
  return instances;
}

/**
 * Calcula score de proeminência usando Log-Likelihood
 * (Simplificado - usa frequência relativa)
 */
export function calculateProminenceScore(
  observedFreq: number,
  expectedFreq: number,
  corpusSize: number
): number {
  if (expectedFreq === 0) return 0;
  
  const ratio = observedFreq / expectedFreq;
  
  // Log-likelihood simplificado
  const ll = 2 * (observedFreq * Math.log(ratio));
  
  // Normalizar para 0-1
  return Math.min(ll / 10, 1.0);
}

export function analyzeForegrounding(corpus: any): ForegroundingProfile {
  const allText = corpus.musicas
    .map((m: any) => m.letra)
    .join('\n\n');
    
  const internalDeviations = detectInternalDeviation(allText);
  const externalDeviations = detectExternalDeviation(allText);
  const parallelisms = detectParallelism(allText);
  
  const allInstances = [...internalDeviations, ...externalDeviations, ...parallelisms];
  
  // Adicionar metadata de artista/música
  corpus.musicas.forEach((musica: any) => {
    const musicaText = musica.letra;
    allInstances.forEach(instance => {
      if (instance.context && musicaText.includes(instance.context.substring(0, 30))) {
        instance.metadata = {
          artista: musica.artista,
          musica: musica.titulo
        };
      }
    });
  });
  
  // Calcular distribuição por categoria
  const distribution: Record<string, number> = {};
  allInstances.forEach(inst => {
    distribution[inst.category] = (distribution[inst.category] || 0) + 1;
  });
  
  // Identificar padrões proeminentes
  const patternMap: Record<string, { frequency: number; scores: number[] }> = {};
  allInstances.forEach(inst => {
    if (!patternMap[inst.category]) {
      patternMap[inst.category] = { frequency: 0, scores: [] };
    }
    patternMap[inst.category].frequency++;
    patternMap[inst.category].scores.push(inst.prominenceScore);
  });
  
  const prominentPatterns = Object.entries(patternMap)
    .map(([pattern, data]) => ({
      pattern,
      frequency: data.frequency,
      avgProminence: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    }))
    .sort((a, b) => b.avgProminence - a.avgProminence)
    .slice(0, 10);
  
  // Score geral de proeminência
  const overallProminenceScore = allInstances.length > 0
    ? allInstances.reduce((sum, inst) => sum + inst.prominenceScore, 0) / allInstances.length
    : 0;
  
  return {
    corpusType: corpus.tipo,
    totalDeviations: allInstances.length,
    internalDeviations: internalDeviations.length,
    externalDeviations: externalDeviations.length,
    parallelisms: parallelisms.length,
    distribution,
    instances: allInstances,
    prominentPatterns,
    overallProminenceScore
  };
}

export function exportForegroundingToCSV(profile: ForegroundingProfile): string {
  const rows = [
    ['Tipo', 'Categoria', 'Descrição', 'Exemplo', 'Score', 'Artista', 'Música'],
    ...profile.instances.map(inst => [
      inst.type,
      inst.category,
      `"${inst.description.replace(/"/g, '""')}"`,
      `"${inst.example.replace(/"/g, '""')}"`,
      inst.prominenceScore.toFixed(2),
      inst.metadata?.artista || '',
      inst.metadata?.musica || ''
    ])
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}
