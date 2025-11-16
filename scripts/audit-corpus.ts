#!/usr/bin/env node
/**
 * 🔍 SCRIPT DE AUDITORIA PARA CI/CD
 * 
 * Executa apenas a auditoria de dados (mais rápido que testes completos)
 */

import { auditCorpusData } from '../src/data/mockup/validation/auditCorpusData';

function main() {
  console.log('🔍 Executando auditoria de dados do corpus...\n');
  
  const report = auditCorpusData();
  
  console.log('\n📊 RESULTADO DA AUDITORIA:');
  console.log(`Status: ${report.summary.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(`Total de problemas: ${report.summary.totalIssues}`);
  
  if (report.summary.totalIssues > 0) {
    console.error('\n❌ Auditoria falhou! Corrija os problemas antes de fazer deploy.');
    process.exit(1);
  } else {
    console.log('\n✅ Auditoria passou! Dados do corpus estão íntegros.');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
