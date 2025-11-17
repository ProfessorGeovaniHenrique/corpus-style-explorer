/**
 * 🎯 VALIDAÇÃO DE KWIC
 * 
 * Script para validar que todas as palavras-chave têm entradas KWIC
 */

import { palavrasChaveData } from '@/data/mockup/palavras-chave';
import { kwicDataMap } from '@/data/mockup/kwic';

export interface KWICValidationResult {
  totalWords: number;
  wordsWithKWIC: number;
  wordsWithoutKWIC: string[];
  coverage: number;
}

/**
 * Valida todas as palavras-chave e retorna relatório
 */
export function validateAllKWIC(): KWICValidationResult {
  const missingKWIC: string[] = [];
  let foundCount = 0;

  palavrasChaveData.forEach(palavra => {
    // Tentar palavra exata
    const kwicKey = palavra.palavra.toLowerCase();
    const lemaKey = palavra.lema?.toLowerCase();
    
    const hasKWIC = 
      kwicDataMap[kwicKey] || 
      kwicDataMap[palavra.palavra] ||
      (lemaKey && kwicDataMap[lemaKey]) ||
      (palavra.lema && kwicDataMap[palavra.lema]);

    if (hasKWIC) {
      foundCount++;
    } else {
      missingKWIC.push(palavra.palavra);
    }
  });

  const coverage = (foundCount / palavrasChaveData.length) * 100;

  return {
    totalWords: palavrasChaveData.length,
    wordsWithKWIC: foundCount,
    wordsWithoutKWIC: missingKWIC,
    coverage
  };
}

/**
 * Imprime relatório de validação no console
 */
export function printKWICValidationReport(): void {
  const result = validateAllKWIC();
  
  console.log('\n🔍 RELATÓRIO DE VALIDAÇÃO KWIC\n');
  console.log(`Total de palavras-chave: ${result.totalWords}`);
  console.log(`Palavras COM KWIC: ${result.wordsWithKWIC}`);
  console.log(`Palavras SEM KWIC: ${result.wordsWithoutKWIC.length}`);
  console.log(`Cobertura: ${result.coverage.toFixed(2)}%\n`);

  if (result.wordsWithoutKWIC.length > 0) {
    console.log('❌ Palavras SEM KWIC:');
    result.wordsWithoutKWIC.forEach(palavra => {
      console.log(`  - ${palavra}`);
    });
  } else {
    console.log('✅ Todas as palavras-chave têm entradas KWIC!');
  }
}

/**
 * Busca KWIC para uma palavra (com fallbacks inteligentes)
 */
export function getKWICForWord(palavra: string): any[] {
  // Tentar palavra exata
  if (kwicDataMap[palavra]) return kwicDataMap[palavra];
  
  // Tentar lowercase
  const lowerKey = palavra.toLowerCase();
  if (kwicDataMap[lowerKey]) return kwicDataMap[lowerKey];
  
  // Tentar buscar lema da palavra
  const wordData = palavrasChaveData.find(p => 
    p.palavra.toLowerCase() === lowerKey
  );
  
  if (wordData?.lema) {
    const lemaKey = wordData.lema.toLowerCase();
    if (kwicDataMap[lemaKey]) return kwicDataMap[lemaKey];
    if (kwicDataMap[wordData.lema]) return kwicDataMap[wordData.lema];
  }
  
  return [];
}
