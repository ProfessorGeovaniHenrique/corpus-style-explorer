/**
 * Text Normalizer - Pre-Tokenization Cleanup
 * 
 * Corrige erros de digitação, separa clíticos e normaliza texto
 * antes da tokenização para melhorar qualidade da anotação semântica
 */

// Dicionário de correções conhecidas
const KNOWN_CORRECTIONS: Record<string, string> = {
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
  'tropeiros': 'tropeiros',
  'chimarãoquente': 'chimarão quente',
  'bombacha': 'bombacha',
  'gaúchoque': 'gaúcho que',
  'prendaminha': 'prenda minha',
  'pagoadorado': 'pago adorado',
  // Adicionar mais conforme detectados
};

// Clíticos pronominais que devem ser separados
const CLITICS = [
  'me', 'te', 'se', 'lhe', 'lhes', 'nos', 'vos',
  'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las'
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

  // 4. Corrigir palavras coladas (heurística)
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
 * Heurística para detectar palavras coladas
 * Critério: palavras > 15 caracteres sem hífen ou espaço
 */
function fixStuckWords(text: string): string {
  const words = text.split(/\s+/);
  const fixed: string[] = [];

  for (const word of words) {
    // Palavras muito longas sem hífen são suspeitas
    if (word.length > 15 && !word.includes('-')) {
      // Tentar detectar padrão comum: substantivo + adjetivo
      // Ex: "missioneiranoel" → "missioneira noel"
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
  // Heurística 1: Dividir antes de substantivo próprio (maiúscula no meio)
  const upperMatch = word.match(/^([a-zà-ú]+)([A-ZÀ-Ú][a-zà-ú]+)$/);
  if (upperMatch) {
    return `${upperMatch[1]} ${upperMatch[2]}`;
  }

  // Heurística 2: Dividir em sufixos comuns
  const suffixes = ['mente', 'ção', 'dade', 'ismo', 'ista', 'agem', 'ância'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 5) {
      const base = word.slice(0, -suffix.length);
      // Verificar se base tem tamanho razoável
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
