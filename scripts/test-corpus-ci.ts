#!/usr/bin/env node
/**
 * 🔧 SCRIPT DE TESTES PARA CI/CD
 * 
 * Executa os testes do corpus master em ambiente CI/CD
 * e retorna exit code apropriado para bloquear deploys
 */

import { runAllTests } from '../src/data/mockup/validation/corpusTests';
import { auditCorpusData } from '../src/data/mockup/validation/auditCorpusData';
import * as fs from 'fs';
import * as path from 'path';

interface CIReport {
  timestamp: string;
  environment: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
    status: 'success' | 'failed' | 'warning';
  };
  suites: any[];
  audit: any;
}

/**
 * Cores para output no terminal
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

/**
 * Formata mensagem colorida
 */
function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Executa os testes e gera relatório
 */
function runTestsForCI(): CIReport {
  console.log(colorize('\n🧪 EXECUTANDO TESTES DE INTEGRIDADE DO CORPUS\n', 'bold'));
  
  // Executar auditoria
  console.log(colorize('1️⃣ Executando auditoria de dados...', 'blue'));
  const audit = auditCorpusData();
  
  // Executar testes
  console.log(colorize('\n2️⃣ Executando suites de testes...', 'blue'));
  const suites = runAllTests();
  
  // Calcular estatísticas
  const totalTests = suites.reduce((acc, s) => acc + s.summary.total, 0);
  const passed = suites.reduce((acc, s) => acc + s.summary.passed, 0);
  const failed = suites.reduce((acc, s) => acc + s.summary.failed, 0);
  const warnings = suites.reduce((acc, s) => acc + s.summary.warnings, 0);
  
  const status = failed > 0 ? 'failed' : warnings > 0 ? 'warning' : 'success';
  
  // Exibir resumo
  console.log(colorize('\n📊 RESUMO DOS TESTES\n', 'bold'));
  console.log(`Total de testes:     ${totalTests}`);
  console.log(colorize(`✅ Passaram:         ${passed}`, 'green'));
  console.log(colorize(`❌ Falharam:         ${failed}`, 'red'));
  console.log(colorize(`⚠️  Avisos:           ${warnings}`, 'yellow'));
  
  // Exibir detalhes de falhas
  if (failed > 0) {
    console.log(colorize('\n❌ FALHAS ENCONTRADAS:\n', 'red'));
    suites.forEach(suite => {
      const failedTests = suite.tests.filter(t => t.status === 'failed');
      if (failedTests.length > 0) {
        console.log(colorize(`\n📦 ${suite.name}`, 'bold'));
        failedTests.forEach(test => {
          console.log(colorize(`  ✗ ${test.name}`, 'red'));
          console.log(`    ${test.message}`);
          if (test.details) {
            console.log(`    Detalhes: ${JSON.stringify(test.details, null, 2)}`);
          }
        });
      }
    });
  }
  
  // Exibir avisos
  if (warnings > 0) {
    console.log(colorize('\n⚠️  AVISOS ENCONTRADOS:\n', 'yellow'));
    suites.forEach(suite => {
      const warningTests = suite.tests.filter(t => t.status === 'warning');
      if (warningTests.length > 0) {
        console.log(colorize(`\n📦 ${suite.name}`, 'bold'));
        warningTests.forEach(test => {
          console.log(colorize(`  ⚠  ${test.name}`, 'yellow'));
          console.log(`    ${test.message}`);
        });
      }
    });
  }
  
  // Exibir problemas da auditoria
  if (audit.summary.totalIssues > 0) {
    console.log(colorize('\n🔍 PROBLEMAS NA AUDITORIA:\n', 'red'));
    console.log(`Total de problemas encontrados: ${audit.summary.totalIssues}`);
    
    if (audit.issues.palavrasSemLema.length > 0) {
      console.log(colorize(`\n  ❌ Palavras sem lema (${audit.issues.palavrasSemLema.length}):`, 'red'));
      console.log(`     ${audit.issues.palavrasSemLema.join(', ')}`);
    }
    
    if (audit.issues.palavrasSemDominio.length > 0) {
      console.log(colorize(`\n  ❌ Palavras sem domínio (${audit.issues.palavrasSemDominio.length}):`, 'red'));
      console.log(`     ${audit.issues.palavrasSemDominio.slice(0, 10).join(', ')}`);
      if (audit.issues.palavrasSemDominio.length > 10) {
        console.log(`     ... e mais ${audit.issues.palavrasSemDominio.length - 10}`);
      }
    }
    
    if (audit.issues.lemasSemProsodia.length > 0) {
      console.log(colorize(`\n  ❌ Lemas sem prosódia (${audit.issues.lemasSemProsodia.length}):`, 'red'));
      console.log(`     ${audit.issues.lemasSemProsodia.join(', ')}`);
    }
  }
  
  // Status final
  console.log('\n' + '='.repeat(60));
  if (status === 'success') {
    console.log(colorize('✅ STATUS: SUCESSO - Todos os testes passaram!', 'green'));
  } else if (status === 'warning') {
    console.log(colorize('⚠️  STATUS: AVISO - Testes passaram mas há avisos', 'yellow'));
  } else {
    console.log(colorize('❌ STATUS: FALHA - Deploy bloqueado!', 'red'));
  }
  console.log('='.repeat(60) + '\n');
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.CI ? 'CI' : 'local',
    summary: {
      totalTests,
      passed,
      failed,
      warnings,
      status
    },
    suites,
    audit
  };
}

/**
 * Salva relatório em JSON
 */
function saveReport(report: CIReport): void {
  const reportsDir = path.join(process.cwd(), 'test-reports');
  
  // Criar diretório se não existir
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Salvar relatório JSON
  const filename = `corpus-integrity-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(reportsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  console.log(colorize(`📄 Relatório salvo em: ${filepath}`, 'blue'));
  
  // Salvar warnings.txt se houver avisos
  if (report.summary.warnings > 0) {
    const warningsFile = path.join(reportsDir, 'warnings.txt');
    fs.writeFileSync(warningsFile, `${report.summary.warnings} avisos encontrados`);
  }
  
  // Criar badge de status
  const badgeColor = report.summary.status === 'success' ? 'green' : 
                      report.summary.status === 'warning' ? 'yellow' : 'red';
  const badge = {
    schemaVersion: 1,
    label: 'corpus tests',
    message: `${report.summary.passed}/${report.summary.totalTests}`,
    color: badgeColor
  };
  fs.writeFileSync(path.join(reportsDir, 'badge.json'), JSON.stringify(badge));
}

/**
 * Execução principal
 */
function main() {
  try {
    const report = runTestsForCI();
    saveReport(report);
    
    // Exit code baseado no status
    if (report.summary.failed > 0) {
      process.exit(1); // Bloquear deploy
    } else if (report.summary.warnings > 0) {
      process.exit(0); // Permitir deploy mas com avisos
    } else {
      process.exit(0); // Sucesso total
    }
  } catch (error) {
    console.error(colorize('\n❌ ERRO FATAL AO EXECUTAR TESTES:', 'red'));
    console.error(error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

export { runTestsForCI, saveReport };
