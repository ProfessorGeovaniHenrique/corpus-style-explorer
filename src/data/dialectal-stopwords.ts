/**
 * 🚫 LISTA DE FALSOS POSITIVOS PARA ANÁLISE DIALETAL
 * 
 * Palavras gramaticais, funcionais e termos comuns que não são marcas dialetais,
 * mas podem ter alta distintividade estatística por outros motivos.
 */

export const DIALECTAL_STOPWORDS = new Set([
  // Artigos
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  
  // Preposições
  'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
  'por', 'para', 'pra', 'pro', 'pras', 'pros', 'com', 'sem',
  'à', 'ao', 'aos', 'às', 'dum', 'duma', 'num', 'numa',
  'pelo', 'pela', 'pelos', 'pelas', 'neste', 'nesta', 'nestes', 'nestas',
  'deste', 'desta', 'destes', 'destas', 'nesse', 'nessa', 'nesses', 'nessas',
  'desse', 'dessa', 'desses', 'dessas', 'naquele', 'naquela', 'naqueles', 'naquelas',
  'daquele', 'daquela', 'daqueles', 'daquelas',
  
  // Pronomes
  'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
  'me', 'te', 'se', 'lhe', 'nos', 'vos', 'lhes',
  'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas',
  'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
  'esse', 'essa', 'esses', 'essas', 'este', 'esta', 'estes', 'estas',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
  'qual', 'quais', 'que', 'quem', 'onde', 'quando', 'como',
  
  // Conjunções
  'e', 'ou', 'mas', 'porém', 'contudo', 'todavia', 'entretanto',
  'porque', 'pois', 'logo', 'portanto', 'então', 'assim',
  'se', 'caso', 'embora', 'conquanto', 'ainda', 'já',
  
  // Verbos auxiliares e comuns
  'ser', 'sou', 'és', 'é', 'somos', 'sois', 'são',
  'era', 'eras', 'éramos', 'éreis', 'eram',
  'fui', 'foi', 'fomos', 'foram', 'seria', 'seriam',
  'estar', 'estou', 'está', 'estão', 'estava', 'estavam',
  'ter', 'tenho', 'tem', 'temos', 'têm', 'tinha', 'tinham',
  'haver', 'há', 'havia', 'houve',
  'fazer', 'faz', 'fazem', 'fez', 'fizeram',
  'ir', 'vou', 'vai', 'vamos', 'vão', 'fui', 'foi', 'foram',
  'dar', 'dá', 'dão', 'deu', 'deram',
  'ver', 'vê', 'veem', 'viu', 'viram',
  'dizer', 'diz', 'dizem', 'disse', 'disseram',
  'poder', 'posso', 'pode', 'podem', 'podia', 'podiam',
  'querer', 'quer', 'querem', 'quis', 'quiseram',
  'saber', 'sei', 'sabe', 'sabem', 'sabia', 'sabiam',
  
  // Advérbios comuns
  'não', 'sim', 'talvez', 'nunca', 'sempre', 'muito', 'pouco',
  'mais', 'menos', 'tão', 'também', 'bem', 'mal', 'só', 'apenas',
  'aqui', 'aí', 'ali', 'lá', 'cá', 'hoje', 'ontem', 'amanhã',
  'agora', 'depois', 'antes', 'logo', 'cedo', 'tarde',
  
  // Substantivos abstratos/genéricos comuns (NÃO dialetais)
  'alma', 'vida', 'amor', 'mundo', 'tempo', 'dia', 'noite',
  'coração', 'olhar', 'sonho', 'morte', 'destino', 'caminho',
  'casa', 'lugar', 'momento', 'hora', 'vez', 'gente', 'pessoa',
  'coisa', 'parte', 'lado', 'forma', 'jeito', 'modo',
  
  // Adjetivos comuns (NÃO dialetais)
  'grande', 'pequeno', 'novo', 'velho', 'bom', 'ruim', 'mau',
  'bonito', 'feio', 'forte', 'fraco', 'claro', 'escuro',
  'alto', 'baixo', 'longo', 'curto', 'largo', 'estreito',
  'primeiro', 'último', 'único', 'todo', 'cada', 'outro', 'mesmo',
  'próprio', 'certo', 'verdadeiro', 'falso', 'real', 'possível',
  
  // Números
  'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'primeiro', 'segundo', 'terceiro',
  
  // Interjeições básicas (não regionais)
  'ah', 'oh', 'ei', 'oi', 'olá', 'tchau', 'adeus',
  
  // Outros funcionais
  'grupo', 'tipo', 'exemplo', 'nome', 'ano', 'anos',
  'vez', 'vezes', 'tudo', 'nada', 'algo', 'alguém', 'ninguém',
  'qualquer', 'vários', 'diversos', 'alguns', 'muitos', 'poucos',
  'toda', 'todas', 'todo', 'todos',
]);

/**
 * Verifica se uma palavra é um falso positivo (não é marca dialetal)
 */
export function isDialectalStopword(word: string): boolean {
  return DIALECTAL_STOPWORDS.has(word.toLowerCase().trim());
}

/**
 * Filtra uma lista de palavras removendo falsos positivos
 */
export function filterDialectalStopwords(words: string[]): string[] {
  return words.filter(word => !isDialectalStopword(word));
}

/**
 * Verifica se uma palavra tem características dialetais baseado em padrões
 */
export function hasDialectalCharacteristics(word: string): boolean {
  const w = word.toLowerCase();
  
  // Palavras muito curtas (< 3 letras) geralmente não são dialetais
  if (w.length < 3) return false;
  
  // Palavras com padrões dialetais típicos
  const dialectalPatterns = [
    /ão$/, // terminações gaúchas: facão, gauchão, chimarrão
    /eira$/, // campeira, tropeira
    /eiro$/, // campeiro, tropeiro, domador
    /ito$/, // pampito, gauchito
    /aço$/, // bagaço, facaço
    /ear$/, // campear, laçar
    /gua/, // guasca, guaiaca
    /chi/, // chimango, chiripá
    /tch/, // tchê
  ];
  
  return dialectalPatterns.some(pattern => pattern.test(w));
}
