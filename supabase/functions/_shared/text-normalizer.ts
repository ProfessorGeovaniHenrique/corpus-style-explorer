/**
 * Text Normalizer - Pre-Tokenization Cleanup
 * 
 * Corrige erros de digitação, separa clíticos e normaliza texto
 * antes da tokenização para melhorar qualidade da anotação semântica
 * 
 * Sprint AUD-P5: Expandido com 100+ correções baseadas em análise de NC words
 */

// ============================================
// DICIONÁRIO DE CORREÇÕES CONHECIDAS (100+)
// ============================================
const KNOWN_CORRECTIONS: Record<string, string> = {
  // ==========================================
  // CORREÇÕES EXISTENTES (manter)
  // ==========================================
  'pusme': 'pus me',
  'missioneiranoel': 'missioneira noel',
  'pilaatrás': 'pila atrás',
  'iêassim': 'iê assim',
  'forrozarquando': 'forrozar quando',
  'coraçãoeu': 'coração eu',
  'saudadesdo': 'saudades do',
  'querênciaminha': 'querência minha',
  'galpãovelho': 'galpão velho',
  'campeirode': 'campeiro de',
  'chimarãoquente': 'chimarão quente',
  'gaúchoque': 'gaúcho que',
  'prendaminha': 'prenda minha',
  'pagoadorado': 'pago adorado',
  
  // ==========================================
  // CONCATENAÇÕES COM PRONOMES PESSOAIS
  // ==========================================
  'passadoeu': 'passado eu',
  'penaeu': 'pena eu',
  'cantoeu': 'canto eu',
  'fãeu': 'fã eu',
  'ajudarmeu': 'ajudar meu',
  'pertencereu': 'pertencer eu',
  'vidaeu': 'vida eu',
  'mundoeu': 'mundo eu',
  'amortu': 'amor tu',
  'bemtu': 'bem tu',
  'quetu': 'que tu',
  'paramim': 'para mim',
  'pormim': 'por mim',
  'commigo': 'comigo',
  'comtigo': 'contigo',
  'denós': 'de nós',
  'paranós': 'para nós',
  'vocêsabe': 'você sabe',
  'vocêvem': 'você vem',
  'vocêvai': 'você vai',
  'eleveio': 'ele veio',
  'elafoi': 'ela foi',
  'elaé': 'ela é',
  'eleé': 'ele é',
  
  // ==========================================
  // CONCATENAÇÕES COM "DEUS"
  // ==========================================
  'coraçãodeus': 'coração deus',
  'mimdeus': 'mim deus',
  'saídadeus': 'saída deus',
  'graçasdeus': 'graças deus',
  'nomedeus': 'nome deus',
  'amordeus': 'amor deus',
  'pordeus': 'por deus',
  'ohdeus': 'oh deus',
  'meudeus': 'meu deus',
  
  // ==========================================
  // CONCATENAÇÕES COM ADVÉRBIOS
  // ==========================================
  'aquientão': 'aqui então',
  'bemmais': 'bem mais',
  'vidahoje': 'vida hoje',
  'bolaagora': 'bola agora',
  'maisna': 'mais na',
  'maisum': 'mais um',
  'maisuma': 'mais uma',
  'bemagora': 'bem agora',
  'tãobem': 'tão bem',
  'tãomal': 'tão mal',
  'muitobem': 'muito bem',
  'muitomal': 'muito mal',
  'poraí': 'por aí',
  'porlá': 'por lá',
  'porcá': 'por cá',
  'porali': 'por ali',
  'poraqui': 'por aqui',
  'lásempre': 'lá sempre',
  'aquinunca': 'aqui nunca',
  'jáfoi': 'já foi',
  'aindanão': 'ainda não',
  'nãomais': 'não mais',
  'sempreque': 'sempre que',
  'nuncamais': 'nunca mais',
  
  // ==========================================
  // CONCATENAÇÕES COM PREPOSIÇÕES/ARTIGOS
  // ==========================================
  'nãome': 'não me',
  'nãote': 'não te',
  'nãose': 'não se',
  'nãoé': 'não é',
  'nãofoi': 'não foi',
  'nãovai': 'não vai',
  'nãovem': 'não vem',
  'nãosei': 'não sei',
  'nãotem': 'não tem',
  'águaminha': 'água minha',
  'chãominha': 'chão minha',
  'terraminha': 'terra minha',
  'casaminha': 'casa minha',
  'vidaminha': 'vida minha',
  'almaminha': 'alma minha',
  'denossa': 'de nossa',
  'davida': 'da vida',
  'doamor': 'do amor',
  'nocéu': 'no céu',
  'nachão': 'na chão',
  'navida': 'na vida',
  'nocoração': 'no coração',
  'naalminha': 'na alminha',
  'nomundo': 'no mundo',
  'aovento': 'ao vento',
  'aosol': 'ao sol',
  'àlua': 'à lua',
  'ànoite': 'à noite',
  
  // ==========================================
  // CONCATENAÇÕES LONGAS DETECTADAS EM NC
  // ==========================================
  'trásporquê': 'trás porquê',
  'mourãono': 'mourão no',
  'bocamesmo': 'boca mesmo',
  'coraçãoestrela': 'coração estrela',
  'acontecerpasso': 'acontecer passo',
  'ninguempensei': 'ninguém pensei',
  'chorarfeito': 'chorar feito',
  'morreudinheiro': 'morreu dinheiro',
  'elase': 'ela se',
  'torrena': 'torre na',
  'cercadochorei': 'cercado chorei',
  'enfeitiçadodaquele': 'enfeitiçado daquele',
  'salãoinvejosos': 'salão invejosos',
  'vidapassou': 'vida passou',
  'tempovoou': 'tempo voou',
  'amormeu': 'amor meu',
  'coraçãomeu': 'coração meu',
  'saudademinha': 'saudade minha',
  'campomeu': 'campo meu',
  'galpãomeu': 'galpão meu',
  
  // ==========================================
  // CONCATENAÇÕES COM VERBOS
  // ==========================================
  'querfalar': 'quer falar',
  'querver': 'quer ver',
  'quervir': 'quer vir',
  'querir': 'quer ir',
  'podeser': 'pode ser',
  'podever': 'pode ver',
  'podevir': 'pode vir',
  'podeir': 'pode ir',
  'vaiser': 'vai ser',
  'vaiver': 'vai ver',
  'vaivir': 'vai vir',
  'vaiir': 'vai ir',
  'veioser': 'veio ser',
  'veiover': 'veio ver',
  'veiovir': 'veio vir',
  'foisembora': 'foi embora',
  'vouembora': 'vou embora',
  'vaiembora': 'vai embora',
  'ficaaqui': 'fica aqui',
  'ficaalí': 'fica ali',
  'ficalá': 'fica lá',
  'estaaqui': 'está aqui',
  'estaalí': 'está ali',
  'estalá': 'está lá',
  
  // ==========================================
  // VERBOS COM CLÍTICOS COLADOS
  // ==========================================
  'ergueuse': 'ergueu se',
  'levantouse': 'levantou se',
  'sentouse': 'sentou se',
  'deitouse': 'deitou se',
  'acordouse': 'acordou se',
  'virame': 'vira me',
  'virate': 'vira te',
  'olhame': 'olha me',
  'olhate': 'olha te',
  'deixame': 'deixa me',
  'deixate': 'deixa te',
  'damme': 'dá me',
  'datte': 'dá te',
  'fazme': 'faz me',
  'fazte': 'faz te',
  'dizme': 'diz me',
  'dizte': 'diz te',
  'vemme': 'vem me',
  'vaime': 'vai me',
  
  // ==========================================
  // REGIONALISMOS CONCATENADOS
  // ==========================================
  'tchêbah': 'tchê bah',
  'bahtchê': 'bah tchê',
  'eitabah': 'eita bah',
  'oxeeita': 'oxe eita',
  'uaieita': 'uai eita',
  
  // ==========================================
  // OUTROS PADRÕES COMUNS
  // ==========================================
  'nãoquero': 'não quero',
  'nãoposso': 'não posso',
  'nãodevo': 'não devo',
  'nãopreciso': 'não preciso',
  'nãoconsigo': 'não consigo',
  'queropoder': 'quero poder',
  'possoquerer': 'posso querer',
  'devopoder': 'devo poder',
  'precisopoder': 'preciso poder',
  'temque': 'tem que',
  'tinhaquer': 'tinha quer',
  'haviade': 'havia de',
};

// Clíticos pronominais que devem ser separados
const CLITICS = [
  'me', 'te', 'se', 'lhe', 'lhes', 'nos', 'vos',
  'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las'
];

// Padrões de concatenação comuns em letras de música
const CONCAT_SUFFIX_PATTERNS = [
  { suffix: 'eu', minBase: 3 },
  { suffix: 'tu', minBase: 3 },
  { suffix: 'minha', minBase: 3 },
  { suffix: 'meu', minBase: 3 },
  { suffix: 'deus', minBase: 3 },
  { suffix: 'então', minBase: 3 },
  { suffix: 'agora', minBase: 3 },
  { suffix: 'hoje', minBase: 3 },
  { suffix: 'mais', minBase: 3 },
  { suffix: 'quando', minBase: 3 },
  { suffix: 'sempre', minBase: 3 },
  { suffix: 'nunca', minBase: 3 },
  { suffix: 'mesmo', minBase: 3 },
  { suffix: 'feito', minBase: 3 },
];

const CONCAT_PREFIX_PATTERNS = [
  { prefix: 'não', minRest: 2 },
  { prefix: 'bem', minRest: 3 },
  { prefix: 'mais', minRest: 2 },
  { prefix: 'tão', minRest: 3 },
  { prefix: 'muito', minRest: 3 },
  { prefix: 'por', minRest: 2 },
  { prefix: 'para', minRest: 2 },
];

/**
 * Normaliza texto antes da tokenização
 */
export function normalizeText(text: string): string {
  let normalized = text;

  // 1. Aplicar correções conhecidas
  normalized = applyKnownCorrections(normalized);

  // 2. Separar clíticos
  normalized = separateClitics(normalized);

  // 3. Detectar e corrigir CamelCase acidental
  normalized = fixAccidentalCamelCase(normalized);

  // 4. Corrigir palavras coladas (heurística aprimorada)
  normalized = fixStuckWords(normalized);

  return normalized;
}

/**
 * Aplica correções conhecidas do dicionário
 */
function applyKnownCorrections(text: string): string {
  let result = text;
  
  for (const [wrong, correct] of Object.entries(KNOWN_CORRECTIONS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    result = result.replace(regex, correct);
  }
  
  return result;
}

/**
 * Separa clíticos pronominais
 * Exemplo: "ergueu-se" → "ergueu se"
 */
function separateClitics(text: string): string {
  let result = text;
  
  // Padrão: palavra-clítico
  for (const clitic of CLITICS) {
    const regex = new RegExp(`(\\w+)-(${clitic})\\b`, 'gi');
    result = result.replace(regex, '$1 $2');
  }
  
  return result;
}

/**
 * Detecta e corrige CamelCase acidental
 * Exemplo: "coraçãoEu" → "coração Eu"
 */
function fixAccidentalCamelCase(text: string): string {
  // Detectar minúscula seguida de maiúscula (não no início da palavra)
  return text.replace(/([a-zà-ú])([A-ZÀ-Ú])/g, '$1 $2');
}

/**
 * Heurística aprimorada para detectar palavras coladas
 * Critério: palavras > 12 caracteres sem hífen ou espaço
 */
function fixStuckWords(text: string): string {
  const words = text.split(/\s+/);
  const fixed: string[] = [];

  for (const word of words) {
    // Palavras muito longas sem hífen são suspeitas (threshold reduzido para 12)
    if (word.length > 12 && !word.includes('-')) {
      const separated = trySmartSplit(word);
      fixed.push(separated);
    } else {
      fixed.push(word);
    }
  }

  return fixed.join(' ');
}

/**
 * Tenta dividir palavra longa de forma inteligente
 */
function trySmartSplit(word: string): string {
  const lowerWord = word.toLowerCase();
  
  // Heurística 1: Verificar padrões de sufixo conhecidos
  for (const { suffix, minBase } of CONCAT_SUFFIX_PATTERNS) {
    if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + minBase) {
      const base = word.slice(0, -suffix.length);
      if (base.length >= minBase) {
        return `${base} ${word.slice(-suffix.length)}`;
      }
    }
  }
  
  // Heurística 2: Verificar padrões de prefixo conhecidos
  for (const { prefix, minRest } of CONCAT_PREFIX_PATTERNS) {
    if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length + minRest) {
      const rest = word.slice(prefix.length);
      if (rest.length >= minRest) {
        return `${word.slice(0, prefix.length)} ${rest}`;
      }
    }
  }
  
  // Heurística 3: Dividir antes de substantivo próprio (maiúscula no meio)
  const upperMatch = word.match(/^([a-zà-ú]+)([A-ZÀ-Ú][a-zà-ú]+)$/);
  if (upperMatch) {
    return `${upperMatch[1]} ${upperMatch[2]}`;
  }

  // Heurística 4: Dividir em sufixos comuns de palavras portuguesas
  const suffixes = ['mente', 'ção', 'dade', 'ismo', 'ista', 'agem', 'ância', 'ência'];
  for (const suffix of suffixes) {
    if (lowerWord.endsWith(suffix) && word.length > suffix.length + 5) {
      const base = word.slice(0, -suffix.length);
      // Verificar se base tem tamanho razoável e não é apenas o sufixo
      if (base.length >= 5) {
        return `${base} ${suffix}`;
      }
    }
  }

  // Se não conseguiu dividir, retornar original
  return word;
}

/**
 * Adiciona correção ao dicionário (para uso em NC Word Correction Tool)
 */
export function addKnownCorrection(wrong: string, correct: string): void {
  KNOWN_CORRECTIONS[wrong.toLowerCase()] = correct.toLowerCase();
}

/**
 * Lista todas as correções conhecidas
 */
export function getKnownCorrections(): Record<string, string> {
  return { ...KNOWN_CORRECTIONS };
}

/**
 * Retorna estatísticas sobre as correções
 */
export function getCorrectionStats(): { total: number; categories: Record<string, number> } {
  const total = Object.keys(KNOWN_CORRECTIONS).length;
  return {
    total,
    categories: {
      'pronomes_pessoais': Object.keys(KNOWN_CORRECTIONS).filter(k => 
        k.includes('eu') || k.includes('tu') || k.includes('mim') || k.includes('você')
      ).length,
      'deus': Object.keys(KNOWN_CORRECTIONS).filter(k => k.includes('deus')).length,
      'adverbios': Object.keys(KNOWN_CORRECTIONS).filter(k => 
        k.includes('então') || k.includes('agora') || k.includes('hoje') || k.includes('mais')
      ).length,
      'preposicoes': Object.keys(KNOWN_CORRECTIONS).filter(k => 
        k.includes('não') || k.includes('para') || k.includes('por')
      ).length,
      'verbos': Object.keys(KNOWN_CORRECTIONS).filter(k => 
        k.includes('quer') || k.includes('pode') || k.includes('vai') || k.includes('vem')
      ).length,
    }
  };
}
