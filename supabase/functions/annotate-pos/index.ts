// Deno Edge Runtime - POS Tagging with Grammar-Based Rules

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface POSToken {
  palavra: string;
  lema: string;
  pos: string;
  posDetalhada: string;
  features: Record<string, string>;
  posicao: number;
}

// ============= GRAMMATICAL KNOWLEDGE BASE =============

// Verbos irregulares mais comuns
const IRREGULAR_VERBS: Record<string, { infinitivo: string; forms: string[] }> = {
  'ser': { infinitivo: 'ser', forms: ['sou', 'és', 'é', 'somos', 'são', 'fui', 'foi', 'foram', 'era', 'eram', 'sendo', 'sido'] },
  'estar': { infinitivo: 'estar', forms: ['estou', 'está', 'estão', 'estive', 'esteve', 'estiveram', 'estando', 'estado'] },
  'ter': { infinitivo: 'ter', forms: ['tenho', 'tens', 'tem', 'temos', 'têm', 'tive', 'teve', 'tiveram', 'tendo', 'tido'] },
  'haver': { infinitivo: 'haver', forms: ['hei', 'há', 'hão', 'houve', 'houveram', 'havendo', 'havido'] },
  'ir': { infinitivo: 'ir', forms: ['vou', 'vais', 'vai', 'vamos', 'vão', 'fui', 'foi', 'foram', 'ia', 'iam', 'indo', 'ido'] },
  'fazer': { infinitivo: 'fazer', forms: ['faço', 'faz', 'fazem', 'fiz', 'fez', 'fizeram', 'fazendo', 'feito'] },
  'dizer': { infinitivo: 'dizer', forms: ['digo', 'diz', 'dizem', 'disse', 'disseram', 'dizendo', 'dito'] },
  'trazer': { infinitivo: 'trazer', forms: ['trago', 'traz', 'trazem', 'trouxe', 'trouxeram', 'trazendo', 'trazido'] },
  'poder': { infinitivo: 'poder', forms: ['posso', 'pode', 'podem', 'pude', 'pôde', 'puderam', 'podendo', 'podido'] },
  'pôr': { infinitivo: 'pôr', forms: ['ponho', 'põe', 'põem', 'pus', 'pôs', 'puseram', 'pondo', 'posto'] },
  'ver': { infinitivo: 'ver', forms: ['vejo', 'vê', 'veem', 'vi', 'viu', 'viram', 'vendo', 'visto'] },
  'vir': { infinitivo: 'vir', forms: ['venho', 'vem', 'vêm', 'vim', 'veio', 'vieram', 'vindo'] },
  'dar': { infinitivo: 'dar', forms: ['dou', 'dá', 'dão', 'dei', 'deu', 'deram', 'dando', 'dado'] },
  'saber': { infinitivo: 'saber', forms: ['sei', 'sabe', 'sabem', 'soube', 'souberam', 'sabendo', 'sabido'] },
  'querer': { infinitivo: 'querer', forms: ['quero', 'quer', 'querem', 'quis', 'quiseram', 'querendo', 'querido'] },
};

// Mapa rápido de forma conjugada → infinitivo
const CONJUGATED_TO_INFINITIVE: Record<string, string> = {};
Object.entries(IRREGULAR_VERBS).forEach(([inf, data]) => {
  data.forms.forEach(form => CONJUGATED_TO_INFINITIVE[form] = inf);
  CONJUGATED_TO_INFINITIVE[inf] = inf;
});

// Verbos auxiliares
const AUXILIARY_VERBS = new Set(['ter', 'haver', 'ser', 'estar', 'ir', 'vir', 'poder', 'dever', 'querer']);

// Pronomes
const PRONOUNS = {
  pessoais: new Set(['eu', 'tu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas', 'a gente']),
  obliquos: new Set(['me', 'te', 'se', 'o', 'a', 'lhe', 'nos', 'vos', 'os', 'as', 'lhes']),
  possessivos: new Set(['meu', 'minha', 'teu', 'tua', 'seu', 'sua', 'nosso', 'nossa', 'meus', 'minhas', 'seus', 'suas']),
  demonstrativos: new Set(['este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'isto', 'isso', 'aquilo']),
  indefinidos: new Set(['algum', 'alguma', 'nenhum', 'nenhuma', 'todo', 'toda', 'outro', 'outra', 'muito', 'muita', 'pouco', 'pouca', 'alguém', 'ninguém', 'tudo', 'nada']),
  relativos: new Set(['que', 'quem', 'qual', 'onde', 'cujo', 'cuja']),
};

// Determinantes/artigos
const DETERMINERS = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas']);

// Preposições
const PREPOSITIONS = new Set(['de', 'em', 'para', 'por', 'com', 'sem', 'sobre', 'até', 'desde', 'após', 'ante', 'contra', 'entre', 'perante', 'sob']);

// Conjunções
const CONJUNCTIONS = {
  coordenativas: new Set(['e', 'ou', 'mas', 'porém', 'contudo', 'todavia', 'entretanto']),
  subordinativas: new Set(['que', 'se', 'porque', 'quando', 'como', 'embora', 'conquanto', 'caso']),
};

// Advérbios comuns
const ADVERBS = new Set([
  'não', 'sim', 'nunca', 'sempre', 'talvez', 'aqui', 'ali', 'lá', 'cá',
  'hoje', 'ontem', 'amanhã', 'agora', 'já', 'ainda', 'logo', 'cedo', 'tarde',
  'bem', 'mal', 'muito', 'pouco', 'mais', 'menos', 'bastante', 'demais',
  'longe', 'perto', 'dentro', 'fora', 'acima', 'abaixo'
]);

// ============= POS TAGGING FUNCTIONS =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, idioma = 'pt' } = await req.json();

    if (!texto || typeof texto !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Texto inválido ou ausente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[annotate-pos] Processando ${texto.length} caracteres`);

    const tokens = await processText(texto);

    console.log(`[annotate-pos] Processados ${tokens.length} tokens`);

    return new Response(
      JSON.stringify({ tokens }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[annotate-pos] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Processa texto usando regras gramaticais avançadas
 */
async function processText(texto: string): Promise<POSToken[]> {
  const words = texto
    .toLowerCase()
    .replace(/[^\w\sáàâãéêíóôõúç\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const tokens: POSToken[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const palavra = words[i];
    const contexto = {
      anterior: i > 0 ? words[i - 1] : null,
      proximo: i < words.length - 1 ? words[i + 1] : null,
    };

    const pos = inferPOSAdvanced(palavra, contexto);
    const lema = lemmatizeAdvanced(palavra, pos);
    const features = inferFeaturesAdvanced(palavra, pos);

    tokens.push({
      palavra,
      lema,
      pos,
      posDetalhada: pos,
      features,
      posicao: i,
    });
  }

  return tokens;
}

/**
 * Inferência avançada de POS usando regras gramaticais
 */
function inferPOSAdvanced(palavra: string, contexto: { anterior: string | null; proximo: string | null }): string {
  // 1. Verificar determinantes/artigos (prioridade alta)
  if (DETERMINERS.has(palavra)) {
    return 'DET';
  }

  // 2. Verificar preposições
  if (PREPOSITIONS.has(palavra)) {
    return 'ADP';
  }

  // 3. Verificar conjunções
  if (CONJUNCTIONS.coordenativas.has(palavra) || CONJUNCTIONS.subordinativas.has(palavra)) {
    return CONJUNCTIONS.subordinativas.has(palavra) ? 'SCONJ' : 'CCONJ';
  }

  // 4. Verificar pronomes
  if (PRONOUNS.pessoais.has(palavra) || PRONOUNS.obliquos.has(palavra) || 
      PRONOUNS.indefinidos.has(palavra) || PRONOUNS.relativos.has(palavra)) {
    return 'PRON';
  }
  if (PRONOUNS.possessivos.has(palavra) || PRONOUNS.demonstrativos.has(palavra)) {
    return 'DET'; // Pronomes possessivos/demonstrativos funcionam como determinantes
  }

  // 5. Verificar advérbios conhecidos
  if (ADVERBS.has(palavra)) {
    return 'ADV';
  }

  // 6. Advérbios terminados em -mente
  if (palavra.endsWith('mente')) {
    return 'ADV';
  }

  // 7. Verificar verbos irregulares (alta prioridade)
  if (CONJUGATED_TO_INFINITIVE[palavra]) {
    return AUXILIARY_VERBS.has(CONJUGATED_TO_INFINITIVE[palavra]) ? 'AUX' : 'VERB';
  }

  // 8. Padrões de verbos regulares
  if (palavra.match(/(ando|endo|indo)$/)) return 'VERB'; // Gerúndio
  if (palavra.match(/(ado|ido)$/)) return 'VERB'; // Particípio
  if (palavra.match(/^(des|re|pre|sobre|sub)/)) {
    // Prefixos verbais comuns
    if (palavra.match(/(ar|er|ir|ando|endo|indo|ado|ido)$/)) return 'VERB';
  }

  // 9. Padrões de conjugação verbal
  if (palavra.match(/(ei|ou|amos|aram|va|vam|rei|rá|rão)$/)) {
    return 'VERB';
  }

  // 10. Análise contextual: após determinante = substantivo ou adjetivo
  if (contexto.anterior && DETERMINERS.has(contexto.anterior)) {
    // Adjetivos terminados em -oso, -osa, -al, -ar, etc.
    if (palavra.match(/(oso|osa|ico|ica|al|ar|ário|ária|eiro|eira)$/)) {
      return 'ADJ';
    }
    return 'NOUN'; // Provavelmente substantivo
  }

  // 11. Padrões de adjetivos
  if (palavra.match(/(oso|osa|ável|ível|ante|ente|dor|dora)$/)) {
    return 'ADJ';
  }

  // 12. Padrões de substantivos
  if (palavra.match(/(ção|mento|dade|ez|eza|ismo|ista|agem|ura|ância|ência)$/)) {
    return 'NOUN';
  }

  // 13. Palavras capitalizadas (nomes próprios - no texto original)
  // Como normalizamos para lowercase, não podemos detectar aqui

  // 14. Plural em -s (substantivos ou adjetivos)
  if (palavra.endsWith('s') && palavra.length > 2) {
    if (palavra.match(/(oso|osa|ico|ica|ável)s$/)) return 'ADJ';
    return 'NOUN';
  }

  // 15. Default: substantivo (classe mais comum)
  return 'NOUN';
}

/**
 * Lematização avançada usando regras morfológicas
 */
function lemmatizeAdvanced(palavra: string, pos: string): string {
  // 1. Verbos irregulares
  if (pos === 'VERB' || pos === 'AUX') {
    const lemma = CONJUGATED_TO_INFINITIVE[palavra];
    if (lemma) return lemma;

    // Tentar remover terminações verbais
    if (palavra.endsWith('ando')) return palavra.slice(0, -4) + 'ar';
    if (palavra.endsWith('endo') || palavra.endsWith('indo')) {
      return palavra.slice(0, -4) + 'er';
    }
    if (palavra.endsWith('ado')) return palavra.slice(0, -3) + 'ar';
    if (palavra.endsWith('ido')) return palavra.slice(0, -3) + 'er';
    
    // Preterito perfeito
    if (palavra.endsWith('ou')) return palavra.slice(0, -2) + 'ar';
    if (palavra.endsWith('eu')) return palavra.slice(0, -2) + 'er';
    if (palavra.endsWith('iu')) return palavra.slice(0, -2) + 'ir';
    
    // Presente do indicativo
    if (palavra.endsWith('o') && palavra.length > 2) {
      // Pode ser 1ª pessoa
      return palavra.slice(0, -1) + 'ar'; // tentativa
    }
  }

  // 2. Substantivos e adjetivos: remover plural
  if (pos === 'NOUN' || pos === 'ADJ') {
    if (palavra.endsWith('ões')) return palavra.slice(0, -3) + 'ão';
    if (palavra.endsWith('ães')) return palavra.slice(0, -3) + 'ão';
    if (palavra.endsWith('ãos')) return palavra.slice(0, -2);
    if (palavra.endsWith('ais')) return palavra.slice(0, -2) + 'al';
    if (palavra.endsWith('eis')) return palavra.slice(0, -2) + 'el';
    if (palavra.endsWith('óis')) return palavra.slice(0, -2) + 'ol';
    if (palavra.endsWith('is') && palavra.length > 3) return palavra.slice(0, -1);
    if (palavra.endsWith('es') && palavra.length > 3) return palavra.slice(0, -2);
    if (palavra.endsWith('s') && palavra.length > 2) return palavra.slice(0, -1);
  }

  // 3. Advérbios em -mente: extrair adjetivo base
  if (pos === 'ADV' && palavra.endsWith('mente')) {
    const base = palavra.slice(0, -5);
    // Converter feminino para masculino se necessário
    if (base.endsWith('a')) return base.slice(0, -1) + 'o';
    return base;
  }

  return palavra;
}

/**
 * Inferir características morfológicas
 */
function inferFeaturesAdvanced(palavra: string, pos: string): Record<string, string> {
  const features: Record<string, string> = {};

  if (pos === 'VERB' || pos === 'AUX') {
    // Tempo verbal
    if (palavra.endsWith('ando') || palavra.endsWith('endo') || palavra.endsWith('indo')) {
      features.VerbForm = 'Ger';
    } else if (palavra.endsWith('ado') || palavra.endsWith('ido')) {
      features.VerbForm = 'Part';
    } else if (palavra.match(/(ei|ou|amos|aram|i|eu|iu)$/)) {
      features.Tense = 'Past';
    } else if (palavra.match(/(rei|rá|rão|remos)$/)) {
      features.Tense = 'Fut';
    } else if (palavra.match(/(va|vam|ia|iam)$/)) {
      features.Tense = 'Imp';
    } else {
      features.Tense = 'Pres';
    }

    // Pessoa
    if (palavra.endsWith('o') && !palavra.endsWith('ando')) {
      features.Person = '1';
      features.Number = 'Sing';
    } else if (palavra.endsWith('amos') || palavra.endsWith('emos') || palavra.endsWith('imos')) {
      features.Person = '1';
      features.Number = 'Plur';
    } else if (palavra.endsWith('am') || palavra.endsWith('em')) {
      features.Person = '3';
      features.Number = 'Plur';
    }
  }

  if (pos === 'NOUN' || pos === 'ADJ') {
    // Número
    if (palavra.endsWith('s')) {
      features.Number = 'Plur';
    } else {
      features.Number = 'Sing';
    }

    // Gênero
    if (palavra.match(/[ao]s?$/)) {
      features.Gender = palavra.match(/[a]s?$/) ? 'Fem' : 'Masc';
    }
  }

  return features;
}
