/**
 * Utilitários de Validação Pré-Importação
 * FASE 3 - BLOCO 2: Observabilidade
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sampleValidationRate?: number;
  metadata?: Record<string, any>;
}

/**
 * Valida arquivo do Dicionário Dialectal antes de processar
 */
export function validateDialectalFile(content: string, volumeNum: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar tamanho mínimo
  if (content.length < 1000) {
    errors.push('Arquivo muito pequeno (< 1KB)');
  }
  
  // Verificar presença de marcadores de origem esperados
  const origemRegex = /\((BRAS|PLAT|CAST|QUER|PORT)\)/g;
  const origemMatches = content.match(origemRegex);
  
  if (!origemMatches || origemMatches.length === 0) {
    errors.push('Arquivo não contém marcadores de origem (BRAS/PLAT/CAST/QUER/PORT)');
  }
  
  // Verificar formato de verbetes (amostragem nas primeiras 100 linhas)
  const lines = content.split('\n').slice(0, 100).filter(l => l.trim());
  let validEntries = 0;
  
  for (const line of lines) {
    // Formato esperado: PALAVRA (ORIGEM) POS - Definição
    if (/^[A-ZÁÀÃÉÊÍÓÔÚÇ].*\((BRAS|PLAT|CAST|QUER|PORT)\)/.test(line)) {
      validEntries++;
    }
  }
  
  const sampleValidationRate = lines.length > 0 ? (validEntries / lines.length) * 100 : 0;
  
  if (sampleValidationRate < 20) {
    warnings.push(`Taxa de validação baixa: ${sampleValidationRate.toFixed(1)}% nas primeiras 100 linhas`);
  }
  
  // Verificar volume
  if (!['I', 'II'].includes(volumeNum)) {
    errors.push(`Volume inválido: "${volumeNum}". Deve ser "I" ou "II"`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sampleValidationRate,
    metadata: {
      fileSize: content.length,
      origemMarkersFound: origemMatches?.length || 0,
      linesInSample: lines.length,
      validEntriesInSample: validEntries
    }
  };
}

/**
 * Valida arquivo do Dicionário Gutenberg antes de processar
 */
export function validateGutenbergFile(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar tamanho mínimo
  if (content.length < 5000) {
    errors.push('Arquivo muito pequeno (< 5KB)');
  }
  
  // Verificar presença de marcadores de verbete (*palavra*)
  const verbeteRegex = /\n\*[A-Za-záàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ\-]+\*/g;
  const verbeteMatches = content.match(verbeteRegex);
  
  if (!verbeteMatches || verbeteMatches.length === 0) {
    errors.push('Arquivo não contém marcadores de verbete (*palavra*)');
  }
  
  // Verificar presença de classes gramaticais (_classe_)
  const classeRegex = /_[a-z\s\.]+_/gi;
  const classeMatches = content.match(classeRegex);
  
  if (!classeMatches || classeMatches.length === 0) {
    warnings.push('Poucas classes gramaticais encontradas (formato: _classe_)');
  }
  
  // Amostragem de qualidade
  const entries = content.split(/(?=\n\*[A-Za-záàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ\-]+\*)/).slice(0, 50);
  let validEntries = 0;
  
  for (const entry of entries) {
    // Formato mínimo esperado: *palavra* seguido de algum conteúdo
    if (/\*[A-Za-z]+\*.*\n.{10,}/.test(entry)) {
      validEntries++;
    }
  }
  
  const sampleValidationRate = entries.length > 0 ? (validEntries / entries.length) * 100 : 0;
  
  if (sampleValidationRate < 50) {
    warnings.push(`Taxa de validação moderada: ${sampleValidationRate.toFixed(1)}% nas primeiras 50 entradas`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sampleValidationRate,
    metadata: {
      fileSize: content.length,
      verbeteMarkersFound: verbeteMatches?.length || 0,
      classeMarkersFound: classeMatches?.length || 0,
      entriesInSample: entries.length,
      validEntriesInSample: validEntries
    }
  };
}

/**
 * Valida arquivo do Dicionário Houaiss antes de processar
 */
export function validateHouaissFile(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar tamanho mínimo
  if (content.length < 5000) {
    errors.push('Arquivo muito pequeno (< 5KB)');
  }
  
  // Verificar presença de marcadores Houaiss (« »)
  const hasOpenMarker = content.includes('«');
  const hasCloseMarker = content.includes('»');
  
  if (!hasOpenMarker && !hasCloseMarker) {
    errors.push('Arquivo não contém marcadores Houaiss (« »)');
  }
  
  // Verificar presença de separadores (: para sinônimos, > para antônimos)
  const hasSeparators = content.includes(':') || content.includes('>');
  if (!hasSeparators) {
    warnings.push('Poucas estruturas de sinônimos/antônimos encontradas (: >)');
  }
  
  // Amostragem de qualidade
  const lines = content.split('\n').slice(0, 100).filter(l => l.trim() && !l.startsWith('#'));
  let validEntries = 0;
  
  for (const line of lines) {
    // Formato esperado: palavra « pos » conteúdo
    if (/\S+\s*=?\s*«/.test(line)) {
      validEntries++;
    }
  }
  
  const sampleValidationRate = lines.length > 0 ? (validEntries / lines.length) * 100 : 0;
  
  if (sampleValidationRate < 40) {
    warnings.push(`Taxa de validação baixa: ${sampleValidationRate.toFixed(1)}% nas primeiras 100 linhas`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sampleValidationRate,
    metadata: {
      fileSize: content.length,
      hasMarkers: hasOpenMarker && hasCloseMarker,
      hasSeparators,
      linesInSample: lines.length,
      validEntriesInSample: validEntries
    }
  };
}

/**
 * Valida arquivo do Dicionário UNESP antes de processar
 */
export function validateUNESPFile(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar tamanho mínimo
  if (content.length < 5000) {
    errors.push('Arquivo muito pequeno (< 5KB)');
  }
  
  // Verificar presença de classes gramaticais (s.m., s.f., adj., etc.)
  const posRegex = /(s\.m\.|s\.f\.|adj\.|v\.|adv\.|prep\.|conj\.|interj\.)/gi;
  const posMatches = content.match(posRegex);
  
  if (!posMatches || posMatches.length < 10) {
    errors.push('Arquivo não contém classes gramaticais suficientes (s.m., s.f., adj., etc.)');
  }
  
  // Verificar excesso de metadados (sinal de arquivo não limpo)
  const metadataIndicators = [
    /Notice/gi,
    /Page \d+/gi,
    /Project Gutenberg/gi,
    /This eBook/gi
  ];
  
  let metadataCount = 0;
  for (const indicator of metadataIndicators) {
    const matches = content.match(indicator);
    if (matches) metadataCount += matches.length;
  }
  
  if (metadataCount > 50) {
    warnings.push(`Arquivo contém muitos metadados (${metadataCount} ocorrências). Pré-processamento será aplicado.`);
  }
  
  // Amostragem de qualidade
  const lines = content.split('\n')
    .filter(l => l.trim() && !/^(Notice|Page|===|\*\*\*)/.test(l))
    .slice(0, 100);
  
  let validEntries = 0;
  
  for (const line of lines) {
    // Formato esperado: Palavra s.m./s.f./adj./etc. definição
    if (/^[A-ZÁÀÃÉÊÍÓÔÚÇ][a-záàãéêíóôúç\-]+\s+(s\.m\.|s\.f\.|adj\.|v\.|adv\.)/i.test(line)) {
      validEntries++;
    }
  }
  
  const sampleValidationRate = lines.length > 0 ? (validEntries / lines.length) * 100 : 0;
  
  if (sampleValidationRate < 30) {
    warnings.push(`Taxa de validação baixa: ${sampleValidationRate.toFixed(1)}% nas primeiras 100 linhas limpas`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sampleValidationRate,
    metadata: {
      fileSize: content.length,
      posMarkersFound: posMatches?.length || 0,
      metadataIndicatorsFound: metadataCount,
      linesInSample: lines.length,
      validEntriesInSample: validEntries
    }
  };
}

/**
 * Helper para logar resultados de validação
 */
export function logValidationResult(fonte: string, result: ValidationResult): void {
  if (!result.valid) {
    console.error(`
❌ [${fonte}] Validação FALHOU:
${result.errors.map(e => `   • ${e}`).join('\n')}
`);
    return;
  }
  
  console.log(`
✅ [${fonte}] Validação APROVADA
   📊 Taxa de validação: ${result.sampleValidationRate?.toFixed(1)}%
   📦 Tamanho do arquivo: ${(result.metadata?.fileSize / 1024).toFixed(1)}KB
`);
  
  if (result.warnings.length > 0) {
    console.warn(`
⚠️  [${fonte}] Avisos:
${result.warnings.map(w => `   • ${w}`).join('\n')}
`);
  }
}
