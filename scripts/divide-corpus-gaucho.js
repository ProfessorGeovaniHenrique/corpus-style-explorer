/**
 * Script para dividir gaucho-completo.txt em 3 partes
 * 
 * Pontos de corte identificados:
 * - Parte 1: linhas 1 a 298001 (termina com ---------------) 
 * - Parte 2: linhas 298002 a 596048 (termina com ---------------)
 * - Parte 3: linhas 596049 a 894135 (termina com ---------------) 
 * 
 * Executar: node scripts/divide-corpus-gaucho.js
 */

import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, '../public/corpus/full-text/gaucho-completo.txt');
const outputDir = join(__dirname, '../public/corpus/full-text');

const parte1Path = join(outputDir, 'gaucho-parte-01.txt');
const parte2Path = join(outputDir, 'gaucho-parte-02.txt');
const parte3Path = join(outputDir, 'gaucho-parte-03.txt');

let lineNumber = 0;
let currentWriter = createWriteStream(parte1Path, { encoding: 'utf8' });
let currentParte = 1;

console.log('🔄 Iniciando divisão do corpus gaúcho...\n');
console.log(`📂 Arquivo de entrada: ${inputFile}`);
console.log(`📁 Diretório de saída: ${outputDir}\n`);

const rl = createInterface({
  input: createReadStream(inputFile),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  lineNumber++;
  
  // Escrever a linha no arquivo atual
  currentWriter.write(line + '\n');
  
  // Trocar para próxima parte nos pontos de corte
  if (lineNumber === 298001) {
    console.log(`✅ Parte 1 concluída: linhas 1-298001`);
    currentWriter.end();
    currentWriter = createWriteStream(parte2Path, { encoding: 'utf8' });
    currentParte = 2;
    console.log('🔄 Iniciando Parte 2...');
  } else if (lineNumber === 596048) {
    console.log(`✅ Parte 2 concluída: linhas 298002-596048`);
    currentWriter.end();
    currentWriter = createWriteStream(parte3Path, { encoding: 'utf8' });
    currentParte = 3;
    console.log('🔄 Iniciando Parte 3...');
  }
  
  // Progresso a cada 50k linhas
  if (lineNumber % 50000 === 0) {
    console.log(`   ⏳ Processadas ${lineNumber.toLocaleString()} linhas (Parte ${currentParte})...`);
  }
});

rl.on('close', () => {
  currentWriter.end();
  console.log(`✅ Parte 3 concluída: linhas 596049-894135`);
  console.log(`\n✨ Divisão concluída! Total de ${lineNumber.toLocaleString()} linhas processadas.`);
  console.log('\n📦 Arquivos criados:');
  console.log(`   - gaucho-parte-01.txt`);
  console.log(`   - gaucho-parte-02.txt`);
  console.log(`   - gaucho-parte-03.txt`);
  console.log('\n⚠️  PRÓXIMO PASSO: Execute o upload via interface Admin!');
});

rl.on('error', (err) => {
  console.error('❌ Erro ao processar arquivo:', err);
  process.exit(1);
});
