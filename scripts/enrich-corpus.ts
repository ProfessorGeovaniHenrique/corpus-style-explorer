#!/usr/bin/env bun
/**
 * 🤖 Script CLI para Enriquecimento Automatizado de Corpus
 * 
 * Uso:
 *   bun run scripts/enrich-corpus.ts gaucho
 *   bun run scripts/enrich-corpus.ts nordestino
 * 
 * Features:
 * - Processamento em batch com rate limiting
 * - Auto-validação para confiança >= 85%
 * - CSV de revisão para casos duvidosos
 * - Backup automático antes de sobrescrever
 * - Logging detalhado no terminal
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================
// CONFIGURAÇÃO
// ============================

const CONFIG = {
  AUTO_VALIDATE_THRESHOLD: 85,  // Confiança mínima para auto-validação
  BATCH_SIZE: 10,                // Músicas por lote
  RATE_LIMIT_DELAY: 1200,        // ms entre requests (50/min = 1200ms)
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
};

// ============================
// TYPES
// ============================

interface SongMetadata {
  artista: string;
  compositor?: string;
  album: string;
  musica: string;
  ano?: string;
  fonte?: string;
}

interface ParsedSong {
  originalBlock: string;
  metadata: SongMetadata;
  letra: string;
  needsEnrichment: boolean;
}

interface EnrichmentResult {
  compositor?: string;
  artista?: string;
  album?: string;
  ano?: string;
  fonte: 'musicbrainz' | 'ai-inferred' | 'not-found';
  confianca: number;
  detalhes?: string;
}

interface ProcessedSong extends ParsedSong {
  enrichmentResult?: EnrichmentResult;
  status: 'validated' | 'review' | 'skipped' | 'error';
}

// ============================
// CORE FUNCTIONS
// ============================

async function enrichSong(
  artista: string,
  musica: string,
  album: string,
  ano: string | undefined,
  corpusType: 'gaucho' | 'nordestino',
  lyricsPreview: string
): Promise<EnrichmentResult> {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/enrich-corpus-metadata`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      artista,
      musica,
      album,
      ano,
      corpusType,
      lyricsPreview: lyricsPreview.slice(0, 500), // Primeiros 500 chars
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

function parseCorpus(content: string, corpusType: 'gaucho' | 'nordestino'): ParsedSong[] {
  const songs: ParsedSong[] = [];
  const blocks = content
    .split(/[-]{10,}/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  console.log(`📚 Parsing ${corpusType} corpus: ${blocks.length} blocos encontrados`);

  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim());
    
    if (lines.length < 2) continue;

    let artista: string;
    let compositor: string | undefined;
    let album: string;
    let musica: string;
    let ano: string | undefined;
    let lyricsLines: string[];

    const firstLine = lines[0];
    
    // Detectar formato Nordestino (sem separador de artista)
    if (!firstLine.includes(' - ') && !firstLine.includes('(Compositor:')) {
      const parts = firstLine.split('_');
      musica = parts[0]?.trim() || 'Sem título';
      ano = parts[1]?.trim();
      
      artista = 'Desconhecido';
      compositor = undefined;
      album = '';
      lyricsLines = lines.slice(1);
    } else {
      // Formato Gaúcho
      const compositorMatch = firstLine.match(/\(Compositor:\s*([^)]+)\)/);
      compositor = compositorMatch ? compositorMatch[1].trim() : undefined;
      
      const cleanLine = firstLine.replace(/\s*\(Compositor:[^)]+\)\s*/, '');
      const artistAlbumParts = cleanLine.split(' - ');
      artista = artistAlbumParts[0]?.trim() || 'Desconhecido';
      album = artistAlbumParts[1]?.trim() || '';
      
      const titleYear = lines[1]?.split('_') || [];
      musica = titleYear[0]?.trim() || 'Sem título';
      ano = titleYear[1]?.trim();
      
      lyricsLines = lines.slice(2);
    }

    const letra = lyricsLines.join('\n');
    const needsEnrichment = !compositor || !album || artista === 'Desconhecido';

    songs.push({
      originalBlock: block,
      metadata: { artista, compositor, album, musica, ano, fonte: 'original' },
      letra,
      needsEnrichment,
    });
  }

  return songs;
}

function generateUpdatedBlock(song: ProcessedSong): string {
  const { metadata, letra } = song;
  const result = song.enrichmentResult;
  
  // Se foi enriquecida, usar novos dados
  if (result && song.status === 'validated') {
    const finalArtist = result.artista || metadata.artista;
    const finalComposer = result.compositor || metadata.compositor;
    const finalAlbum = result.album || metadata.album;
    const finalYear = result.ano || metadata.ano;
    
    const compositorPart = finalComposer ? ` (Compositor: ${finalComposer})` : '';
    const headerLine = `${finalArtist}${compositorPart} - ${finalAlbum}`;
    const titleLine = `${metadata.musica}${finalYear ? '_' + finalYear : ''}`;
    
    return `${headerLine}\n${titleLine}\n${letra}`;
  }
  
  // Caso contrário, manter original
  return song.originalBlock;
}

function generateReviewCSV(songs: ProcessedSong[]): string {
  const headers = [
    'Artista Original',
    'Música',
    'Álbum Original',
    'Compositor Sugerido',
    'Artista Sugerido',
    'Álbum Sugerido',
    'Ano Sugerido',
    'Fonte',
    'Confiança (%)',
    'Detalhes',
  ];
  
  const rows = songs.map(s => {
    const r = s.enrichmentResult!;
    return [
      s.metadata.artista,
      s.metadata.musica,
      s.metadata.album,
      r.compositor || '',
      r.artista || '',
      r.album || '',
      r.ano || '',
      r.fonte,
      r.confianca.toString(),
      r.detalhes || '',
    ].map(field => `"${field.replace(/"/g, '""')}"`).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================
// MAIN SCRIPT
// ============================

async function main() {
  const corpusType = process.argv[2] as 'gaucho' | 'nordestino';
  
  if (!corpusType || !['gaucho', 'nordestino'].includes(corpusType)) {
    console.error('❌ Uso: bun run scripts/enrich-corpus.ts [gaucho|nordestino]');
    process.exit(1);
  }

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.error('❌ Variáveis de ambiente não configuradas');
    process.exit(1);
  }

  console.log('\n🚀 ════════════════════════════════════════════════════════');
  console.log(`   ENRIQUECIMENTO AUTOMATIZADO: ${corpusType.toUpperCase()}`);
  console.log('════════════════════════════════════════════════════════\n');

  // 1. Carregar corpus
  const corpusPath = join('public/corpus/full-text', `${corpusType}-completo.txt`);
  
  if (!existsSync(corpusPath)) {
    console.error(`❌ Arquivo não encontrado: ${corpusPath}`);
    process.exit(1);
  }

  console.log(`📂 Carregando: ${corpusPath}`);
  const content = readFileSync(corpusPath, 'utf-8');
  
  // 2. Parsear corpus
  const songs = parseCorpus(content, corpusType);
  const toEnrich = songs.filter(s => s.needsEnrichment);
  
  console.log(`\n📊 ESTATÍSTICAS INICIAIS`);
  console.log(`   Total de músicas: ${songs.length}`);
  console.log(`   Precisam enriquecimento: ${toEnrich.length}`);
  console.log(`   Já completas: ${songs.length - toEnrich.length}\n`);

  if (toEnrich.length === 0) {
    console.log('✅ Corpus já está completo!');
    return;
  }

  // 3. Processar em lotes
  const processed: ProcessedSong[] = [];
  const validated: ProcessedSong[] = [];
  const forReview: ProcessedSong[] = [];
  const errors: ProcessedSong[] = [];
  
  console.log('⚙️  PROCESSANDO EM LOTES\n');
  
  for (let i = 0; i < toEnrich.length; i += CONFIG.BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toEnrich.length / CONFIG.BATCH_SIZE);
    
    console.log(`📦 Lote ${batchNum}/${totalBatches} (${batch.length} músicas)`);
    
    for (const song of batch) {
      const { artista, musica, album, ano } = song.metadata;
      
      try {
        process.stdout.write(`   🎵 ${artista} - ${musica}... `);
        
        const result = await enrichSong(
          artista,
          musica,
          album,
          ano,
          corpusType,
          song.letra
        );
        
        const processedSong: ProcessedSong = {
          ...song,
          enrichmentResult: result,
          status: result.confianca >= CONFIG.AUTO_VALIDATE_THRESHOLD ? 'validated' : 'review',
        };
        
        processed.push(processedSong);
        
        if (processedSong.status === 'validated') {
          validated.push(processedSong);
          console.log(`✅ ${result.confianca}% (auto-validada)`);
        } else {
          forReview.push(processedSong);
          console.log(`⚠️  ${result.confianca}% (revisar)`);
        }
        
        await delay(CONFIG.RATE_LIMIT_DELAY);
        
      } catch (error) {
        const errorSong: ProcessedSong = {
          ...song,
          status: 'error',
        };
        errors.push(errorSong);
        console.log(`❌ ERRO: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      }
    }
    
    console.log('');
  }

  // 4. Estatísticas finais
  console.log('📊 RESULTADOS FINAIS\n');
  console.log(`   ✅ Auto-validadas: ${validated.length}`);
  console.log(`   ⚠️  Para revisão: ${forReview.length}`);
  console.log(`   ❌ Erros: ${errors.length}\n`);

  // 5. Salvar CSV de revisão
  if (forReview.length > 0) {
    const reviewDir = join('scripts', 'review');
    if (!existsSync(reviewDir)) {
      mkdirSync(reviewDir, { recursive: true });
    }
    
    const csvPath = join(reviewDir, `${corpusType}-review.csv`);
    const csv = generateReviewCSV(forReview);
    writeFileSync(csvPath, csv, 'utf-8');
    console.log(`📄 CSV de revisão salvo: ${csvPath}\n`);
  }

  // 6. Gerar corpus atualizado
  console.log('🔧 GERANDO CORPUS ATUALIZADO\n');
  
  const updatedBlocks: string[] = [];
  
  for (const song of songs) {
    const processedSong = processed.find(
      p => p.metadata.artista === song.metadata.artista && 
           p.metadata.musica === song.metadata.musica
    );
    
    if (processedSong && processedSong.status === 'validated') {
      updatedBlocks.push(generateUpdatedBlock(processedSong));
    } else {
      updatedBlocks.push(song.originalBlock);
    }
  }
  
  const updatedContent = updatedBlocks.join('\n---------------\n') + '\n---------------\n';

  // 7. Backup + Sobrescrever
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join('scripts', 'backups', `${corpusType}-backup-${timestamp}.txt`);
  
  const backupDir = join('scripts', 'backups');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  
  writeFileSync(backupPath, content, 'utf-8');
  console.log(`💾 Backup criado: ${backupPath}`);
  
  writeFileSync(corpusPath, updatedContent, 'utf-8');
  console.log(`✅ Corpus atualizado: ${corpusPath}\n`);

  // 8. Resumo final
  console.log('════════════════════════════════════════════════════════');
  console.log('🎉 ENRIQUECIMENTO CONCLUÍDO!\n');
  console.log(`   📈 ${validated.length} músicas atualizadas automaticamente`);
  if (forReview.length > 0) {
    console.log(`   📋 ${forReview.length} músicas aguardam revisão manual`);
  }
  if (errors.length > 0) {
    console.log(`   ⚠️  ${errors.length} erros durante processamento`);
  }
  console.log('════════════════════════════════════════════════════════\n');
}

// Run
main().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
});
