#!/usr/bin/env node
/**
 * 📊 GERADOR DE RELATÓRIO DE TESTES
 * 
 * Gera relatório HTML dos resultados dos testes
 */

import * as fs from 'fs';
import * as path from 'path';

function generateHTMLReport() {
  const reportsDir = path.join(process.cwd(), 'test-reports');
  
  if (!fs.existsSync(reportsDir)) {
    console.error('❌ Diretório de relatórios não encontrado');
    process.exit(1);
  }
  
  // Buscar último relatório JSON
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('corpus-integrity-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error('❌ Nenhum relatório encontrado');
    process.exit(1);
  }
  
  const latestReport = JSON.parse(
    fs.readFileSync(path.join(reportsDir, files[0]), 'utf-8')
  );
  
  // Gerar HTML
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Testes - Corpus Gaúcho</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { 
      background: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: bold;
      margin-left: 1rem;
    }
    .status-success { background: #10b981; color: white; }
    .status-warning { background: #f59e0b; color: white; }
    .status-failed { background: #ef4444; color: white; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .stat-label { color: #666; font-size: 0.875rem; }
    .suite {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .suite-header { 
      font-size: 1.25rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .test {
      padding: 1rem;
      margin: 0.5rem 0;
      border-left: 4px solid;
      background: #f9fafb;
      border-radius: 4px;
    }
    .test-passed { border-left-color: #10b981; }
    .test-failed { border-left-color: #ef4444; background: #fef2f2; }
    .test-warning { border-left-color: #f59e0b; background: #fffbeb; }
    .test-name { font-weight: 600; margin-bottom: 0.25rem; }
    .test-message { color: #666; font-size: 0.875rem; }
    .footer { text-align: center; margin-top: 2rem; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        🧪 Relatório de Testes do Corpus Gaúcho
        <span class="status-badge status-${latestReport.summary.status}">
          ${latestReport.summary.status.toUpperCase()}
        </span>
      </h1>
      <p style="margin-top: 1rem; color: #666;">
        Executado em: ${new Date(latestReport.timestamp).toLocaleString('pt-BR')}
        | Ambiente: ${latestReport.environment}
      </p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${latestReport.summary.totalTests}</div>
        <div class="stat-label">Total de Testes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #10b981;">${latestReport.summary.passed}</div>
        <div class="stat-label">✅ Passaram</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #ef4444;">${latestReport.summary.failed}</div>
        <div class="stat-label">❌ Falharam</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #f59e0b;">${latestReport.summary.warnings}</div>
        <div class="stat-label">⚠️ Avisos</div>
      </div>
    </div>
    
    ${latestReport.suites.map(suite => `
      <div class="suite">
        <div class="suite-header">
          📦 ${suite.name}
          <span style="font-size: 0.875rem; color: #666;">
            (${suite.summary.passed}/${suite.summary.total})
          </span>
        </div>
        ${suite.tests.map(test => `
          <div class="test test-${test.status}">
            <div class="test-name">
              ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️'}
              ${test.name}
            </div>
            <div class="test-message">${test.message}</div>
          </div>
        `).join('')}
      </div>
    `).join('')}
    
    <div class="footer">
      <p>Gerado automaticamente pelo sistema de CI/CD</p>
      <p style="margin-top: 0.5rem;">Plataforma de Análise Cultural - Corpus Gaúcho</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(reportsDir, 'latest-report.html');
  fs.writeFileSync(htmlPath, html);
  
  console.log(`✅ Relatório HTML gerado: ${htmlPath}`);
}

if (require.main === module) {
  generateHTMLReport();
}

export { generateHTMLReport };
