#!/usr/bin/env tsx

/**
 * 🔄 Atualizador de Changelog
 * 
 * Adiciona uma nova versão ao CHANGELOG.md existente,
 * mantendo o histórico anterior
 * 
 * Uso: npm run changelog:update -- --version v1.2.0
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface NewSection {
  version: string;
  date: string;
  content: string;
}

function getLatestTag(): string | null {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return tag;
  } catch {
    return null;
  }
}

function generateNewSection(version: string): string {
  // Executar o gerador para esta versão específica
  try {
    const previousTag = getLatestTag();
    const fromArg = previousTag ? `--from ${previousTag}` : '';
    
    const output = execSync(
      `tsx scripts/generate-changelog.ts --version ${version} ${fromArg}`,
      { encoding: 'utf-8' }
    );

    // Extrair apenas o conteúdo da versão (após a mensagem de log)
    const lines = output.split('\n');
    const startIndex = lines.findIndex(line => line.startsWith('## '));
    
    if (startIndex === -1) {
      throw new Error('Formato de saída inválido');
    }

    return lines.slice(startIndex).join('\n').trim();
  } catch (error) {
    console.error('❌ Erro ao gerar seção da versão:', error);
    throw error;
  }
}

function updateChangelog(newVersion: string): void {
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  
  console.log(`🔄 Atualizando CHANGELOG.md com versão ${newVersion}...\n`);

  // Verificar se CHANGELOG existe
  if (!existsSync(changelogPath)) {
    console.log('📝 CHANGELOG.md não existe. Criando novo...');
    execSync('tsx scripts/generate-changelog.ts', { stdio: 'inherit' });
    return;
  }

  // Ler changelog existente
  const existingChangelog = readFileSync(changelogPath, 'utf-8');

  // Gerar nova seção
  const newSection = generateNewSection(newVersion);

  // Encontrar onde inserir (após o cabeçalho, antes da primeira versão)
  const lines = existingChangelog.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## '));

  if (insertIndex === -1) {
    console.error('❌ Formato de CHANGELOG inválido');
    process.exit(1);
  }

  // Verificar se versão já existe
  const versionNumber = newVersion.replace(/^v/, '');
  if (existingChangelog.includes(`## [${versionNumber}]`) || 
      existingChangelog.includes(`## ${versionNumber}`)) {
    console.log(`⚠️  Versão ${versionNumber} já existe no CHANGELOG`);
    console.log('💡 Use --force para substituir');
    
    if (!process.argv.includes('--force')) {
      process.exit(0);
    }
    
    console.log('🔄 Substituindo versão existente...');
    // Remover seção antiga
    const sectionStart = existingChangelog.indexOf(`## [${versionNumber}]`);
    const nextSection = existingChangelog.indexOf('\n## ', sectionStart + 1);
    const before = existingChangelog.slice(0, sectionStart);
    const after = nextSection !== -1 
      ? existingChangelog.slice(nextSection + 1) 
      : '';
    
    const updatedChangelog = before + newSection + '\n\n' + after;
    writeFileSync(changelogPath, updatedChangelog, 'utf-8');
  } else {
    // Inserir nova seção
    const before = lines.slice(0, insertIndex).join('\n');
    const after = lines.slice(insertIndex).join('\n');
    
    const updatedChangelog = `${before}\n\n${newSection}\n\n${after}`;
    writeFileSync(changelogPath, updatedChangelog, 'utf-8');
  }

  console.log('✅ CHANGELOG.md atualizado com sucesso!');
  console.log(`\n📝 Nova seção adicionada:`);
  console.log(newSection.split('\n').slice(0, 5).join('\n'));
  console.log('...\n');
}

// Main
function main() {
  console.log('🔄 Atualizador de Changelog\n');

  const args = process.argv.slice(2);
  const versionIndex = args.indexOf('--version');

  if (versionIndex === -1 || !args[versionIndex + 1]) {
    console.error('❌ Uso: npm run changelog:update -- --version v1.2.0');
    process.exit(1);
  }

  const version = args[versionIndex + 1];
  updateChangelog(version);
}

main();
