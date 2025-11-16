#!/usr/bin/env tsx

/**
 * 📝 Gerador de Changelog Automático
 * 
 * Analisa mensagens de commit Conventional Commits e gera um CHANGELOG.md
 * formatado com categorias, links e agrupamento por versão
 * 
 * Uso:
 * - npm run changelog:generate             # Gera changelog completo
 * - npm run changelog:generate -- --from v1.0.0  # Desde uma tag específica
 * - npm run changelog:generate -- --version v1.1.0  # Para versão específica
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface Commit {
  hash: string;
  shortHash: string;
  type: string;
  scope?: string;
  subject: string;
  body: string;
  breaking: boolean;
  date: string;
  author: string;
}

interface ChangelogSection {
  version: string;
  date: string;
  breaking: Commit[];
  features: Commit[];
  fixes: Commit[];
  other: Commit[];
}

// Configurações
const REPO_URL = getRepoUrl();
const COMMIT_URL = REPO_URL ? `${REPO_URL}/commit` : '';

function getRepoUrl(): string | null {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    // Converter SSH para HTTPS
    if (remoteUrl.startsWith('git@github.com:')) {
      return remoteUrl
        .replace('git@github.com:', 'https://github.com/')
        .replace(/\.git$/, '');
    }

    // Remover .git do final se existir
    return remoteUrl.replace(/\.git$/, '');
  } catch {
    return null;
  }
}

function getCurrentVersion(): string {
  const versionPath = resolve(process.cwd(), 'VERSION');
  try {
    return readFileSync(versionPath, 'utf-8').trim();
  } catch {
    return '0.0.0';
  }
}

function getGitTags(): string[] {
  try {
    const tags = execSync('git tag --sort=-version:refname', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    
    return tags ? tags.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getCommitsBetween(from?: string, to: string = 'HEAD'): string {
  try {
    const range = from ? `${from}..${to}` : to;
    const format = '%H|%h|%s|%b|%ai|%an';
    
    return execSync(`git log ${range} --pretty=format:"${format}"`, {
      encoding: 'utf-8',
    });
  } catch {
    return '';
  }
}

function parseCommit(line: string): Commit | null {
  const [hash, shortHash, subject, body, date, author] = line.split('|');
  
  if (!subject) return null;

  // Regex para Conventional Commits: type(scope)?: subject
  const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(([^)]+)\))?(!)?: *(.+)$/;
  const match = subject.match(conventionalRegex);

  if (!match) {
    // Commit não segue Conventional Commits
    return {
      hash,
      shortHash,
      type: 'other',
      subject,
      body: body || '',
      breaking: subject.includes('BREAKING CHANGE') || body?.includes('BREAKING CHANGE'),
      date,
      author,
    };
  }

  const [, type, , scope, breakingMarker, commitSubject] = match;

  return {
    hash,
    shortHash,
    type,
    scope,
    subject: commitSubject.trim(),
    body: body || '',
    breaking: !!breakingMarker || body?.includes('BREAKING CHANGE'),
    date,
    author,
  };
}

function groupCommitsByVersion(): Map<string, Commit[]> {
  const tags = getGitTags();
  const grouped = new Map<string, Commit[]>();

  if (tags.length === 0) {
    // Sem tags, pegar todos os commits
    const commits = getCommitsBetween()
      .split('\n')
      .map(parseCommit)
      .filter((c): c is Commit => c !== null);
    
    grouped.set('Unreleased', commits);
    return grouped;
  }

  // Commits desde a última tag (unreleased)
  const unreleasedCommits = getCommitsBetween(tags[0])
    .split('\n')
    .map(parseCommit)
    .filter((c): c is Commit => c !== null);

  if (unreleasedCommits.length > 0) {
    grouped.set('Unreleased', unreleasedCommits);
  }

  // Commits de cada tag
  for (let i = 0; i < tags.length; i++) {
    const currentTag = tags[i];
    const previousTag = tags[i + 1];

    const commits = getCommitsBetween(previousTag, currentTag)
      .split('\n')
      .map(parseCommit)
      .filter((c): c is Commit => c !== null);

    if (commits.length > 0) {
      grouped.set(currentTag, commits);
    }
  }

  return grouped;
}

function organizeSectionCommits(commits: Commit[]): ChangelogSection {
  const section: ChangelogSection = {
    version: '',
    date: '',
    breaking: [],
    features: [],
    fixes: [],
    other: [],
  };

  commits.forEach(commit => {
    if (commit.breaking) {
      section.breaking.push(commit);
    } else if (commit.type === 'feat') {
      section.features.push(commit);
    } else if (commit.type === 'fix') {
      section.fixes.push(commit);
    } else {
      section.other.push(commit);
    }
  });

  // Data do commit mais recente
  if (commits.length > 0) {
    section.date = commits[0].date.split(' ')[0];
  }

  return section;
}

function formatCommit(commit: Commit): string {
  const scopeText = commit.scope ? `**${commit.scope}**: ` : '';
  const commitLink = COMMIT_URL 
    ? `[\`${commit.shortHash}\`](${COMMIT_URL}/${commit.hash})`
    : `\`${commit.shortHash}\``;
  
  return `- ${scopeText}${commit.subject} (${commitLink})`;
}

function formatBreakingChange(commit: Commit): string {
  const scopeText = commit.scope ? `**${commit.scope}**: ` : '';
  const commitLink = COMMIT_URL 
    ? `[\`${commit.shortHash}\`](${COMMIT_URL}/${commit.hash})`
    : `\`${commit.shortHash}\``;
  
  // Extrair detalhes do BREAKING CHANGE do body
  let breakingDetails = '';
  if (commit.body) {
    const breakingMatch = commit.body.match(/BREAKING CHANGE:\s*(.+)/s);
    if (breakingMatch) {
      breakingDetails = `\n  ${breakingMatch[1].trim()}`;
    }
  }
  
  return `- ${scopeText}${commit.subject} (${commitLink})${breakingDetails}`;
}

function generateSectionMarkdown(version: string, section: ChangelogSection): string {
  let markdown = '';

  // Header da versão
  if (version === 'Unreleased') {
    markdown += `## [Unreleased]\n\n`;
  } else {
    const versionNumber = version.startsWith('v') ? version.slice(1) : version;
    const compareUrl = REPO_URL ? `${REPO_URL}/releases/tag/${version}` : '';
    
    if (compareUrl) {
      markdown += `## [${versionNumber}](${compareUrl}) - ${section.date}\n\n`;
    } else {
      markdown += `## ${versionNumber} - ${section.date}\n\n`;
    }
  }

  // Breaking Changes
  if (section.breaking.length > 0) {
    markdown += `### 💥 BREAKING CHANGES\n\n`;
    section.breaking.forEach(commit => {
      markdown += formatBreakingChange(commit) + '\n';
    });
    markdown += '\n';
  }

  // Features
  if (section.features.length > 0) {
    markdown += `### ✨ Features\n\n`;
    section.features.forEach(commit => {
      markdown += formatCommit(commit) + '\n';
    });
    markdown += '\n';
  }

  // Bug Fixes
  if (section.fixes.length > 0) {
    markdown += `### 🐛 Bug Fixes\n\n`;
    section.fixes.forEach(commit => {
      markdown += formatCommit(commit) + '\n';
    });
    markdown += '\n';
  }

  // Other (opcional - apenas se tiver algo relevante)
  const relevantOther = section.other.filter(c => 
    ['perf', 'refactor', 'docs'].includes(c.type)
  );
  
  if (relevantOther.length > 0) {
    markdown += `### 🔧 Other Changes\n\n`;
    relevantOther.forEach(commit => {
      markdown += formatCommit(commit) + '\n';
    });
    markdown += '\n';
  }

  return markdown;
}

function generateChangelog(): string {
  const grouped = groupCommitsByVersion();
  
  let changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

  // Gerar seções para cada versão
  for (const [version, commits] of grouped) {
    const section = organizeSectionCommits(commits);
    section.version = version;
    
    changelog += generateSectionMarkdown(version, section);
  }

  // Footer com links
  if (REPO_URL) {
    changelog += `---\n\n`;
    changelog += `**Full Changelog**: ${REPO_URL}/commits/main\n`;
  }

  return changelog;
}

function generateChangelogForVersion(version: string, fromTag?: string): string {
  const toTag = version.startsWith('v') ? version : `v${version}`;
  
  const commits = getCommitsBetween(fromTag, toTag)
    .split('\n')
    .map(parseCommit)
    .filter((c): c is Commit => c !== null);

  if (commits.length === 0) {
    console.log('⚠️  Nenhum commit encontrado para esta versão');
    return '';
  }

  const section = organizeSectionCommits(commits);
  const versionNumber = version.replace(/^v/, '');
  
  let markdown = `## [${versionNumber}] - ${new Date().toISOString().split('T')[0]}\n\n`;

  if (section.breaking.length > 0) {
    markdown += `### 💥 BREAKING CHANGES\n\n`;
    section.breaking.forEach(commit => {
      markdown += formatBreakingChange(commit) + '\n';
    });
    markdown += '\n';
  }

  if (section.features.length > 0) {
    markdown += `### ✨ Features\n\n`;
    section.features.forEach(commit => {
      markdown += formatCommit(commit) + '\n';
    });
    markdown += '\n';
  }

  if (section.fixes.length > 0) {
    markdown += `### 🐛 Bug Fixes\n\n`;
    section.fixes.forEach(commit => {
      markdown += formatCommit(commit) + '\n';
    });
    markdown += '\n';
  }

  return markdown;
}

// Main
function main() {
  console.log('📝 Gerador de Changelog Automático\n');

  const args = process.argv.slice(2);
  const fromIndex = args.indexOf('--from');
  const versionIndex = args.indexOf('--version');
  const outputIndex = args.indexOf('--output');

  const fromTag = fromIndex !== -1 ? args[fromIndex + 1] : undefined;
  const specificVersion = versionIndex !== -1 ? args[versionIndex + 1] : undefined;
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : 'CHANGELOG.md';

  let changelog: string;

  if (specificVersion) {
    console.log(`📦 Gerando changelog para versão ${specificVersion}...`);
    changelog = generateChangelogForVersion(specificVersion, fromTag);
    
    if (!changelog) {
      process.exit(1);
    }
    
    console.log('\n' + changelog);
    process.exit(0);
  } else {
    console.log('📚 Gerando changelog completo...\n');
    changelog = generateChangelog();
  }

  // Salvar arquivo
  const fullPath = resolve(process.cwd(), outputPath);
  writeFileSync(fullPath, changelog, 'utf-8');

  console.log(`✅ Changelog gerado: ${outputPath}`);
  console.log(`📊 Tamanho: ${(changelog.length / 1024).toFixed(2)} KB`);
  
  // Estatísticas
  const lines = changelog.split('\n').length;
  const sections = (changelog.match(/^##\s/gm) || []).length;
  
  console.log(`📝 Linhas: ${lines}`);
  console.log(`📦 Versões: ${sections}`);
  
  if (REPO_URL) {
    console.log(`\n🔗 Repositório: ${REPO_URL}`);
  }
}

main();
