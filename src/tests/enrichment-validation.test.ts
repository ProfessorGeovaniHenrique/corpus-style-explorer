/**
 * 🧪 ENRICHMENT VALIDATION TEST SUITE
 * 
 * Valida persistência e UI updates para:
 * 1. Metadata enrichment (composer, release_year)
 * 2. YouTube enrichment (youtube_url)
 * 3. Biography enrichment (artist biography)
 */

import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  test: string;
  passed: boolean;
  details: string;
  data?: any;
}

/**
 * Test 1: Metadata Enrichment Persistence
 * Enriquece uma música e verifica se dados persistem no banco
 */
export async function testMetadataEnrichment(songId: string): Promise<ValidationResult> {
  console.log('🧪 [TEST 1] Starting metadata enrichment test', { songId });
  
  try {
    // Step 1: Get initial state
    const { data: beforeSong, error: beforeError } = await supabase
      .from('songs')
      .select('composer, release_year, confidence_score, status')
      .eq('id', songId)
      .single();

    if (beforeError) throw beforeError;

    console.log('📸 Before state:', beforeSong);

    // Step 2: Trigger enrichment
    console.log('🚀 Calling enrich-music-data edge function...');
    const { data: enrichResponse, error: enrichError } = await supabase.functions.invoke('enrich-music-data', {
      body: { songId, mode: 'metadata-only' }
    });

    if (enrichError) throw enrichError;

    console.log('📦 Enrichment response:', enrichResponse);

    // Step 3: Wait 2 seconds for database to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Query database to verify persistence
    const { data: afterSong, error: afterError } = await supabase
      .from('songs')
      .select('composer, release_year, confidence_score, status, enrichment_source, updated_at')
      .eq('id', songId)
      .single();

    if (afterError) throw afterError;

    console.log('📸 After state:', afterSong);

    // Step 5: Validation checks
    const hasComposer = afterSong.composer !== null && 
      afterSong.composer !== beforeSong.composer &&
      afterSong.composer !== 'Não Identificado';
    const hasYear = afterSong.release_year !== null && 
      afterSong.release_year !== beforeSong.release_year &&
      afterSong.release_year !== '0000';
    const statusChanged = afterSong.status === 'enriched' && beforeSong.status !== 'enriched';
    const confidenceIncreased = (afterSong.confidence_score || 0) > (beforeSong.confidence_score || 0);

    // Considerar sucesso se API respondeu E (dados mudaram OU sistema detectou corretamente que não há dados melhores)
    const hasRealChanges = hasComposer || hasYear || statusChanged || confidenceIncreased;
    const noChangesDetected = enrichResponse.noChanges === true;
    
    const passed = enrichResponse.success && (hasRealChanges || noChangesDetected);

    return {
      test: 'Metadata Enrichment Persistence',
      passed,
      details: passed 
        ? (hasRealChanges 
            ? `✅ Data persisted: composer=${afterSong.composer}, year=${afterSong.release_year}, status=${afterSong.status}` 
            : `✅ No changes but system correctly detected no better data available`)
        : `❌ No changes detected and no noChanges flag returned`,
      data: { before: beforeSong, after: afterSong, response: enrichResponse }
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      test: 'Metadata Enrichment Persistence',
      passed: false,
      details: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      data: { error }
    };
  }
}

/**
 * Test 2: YouTube Enrichment Persistence
 * Enriquece YouTube link e verifica persistência
 */
export async function testYouTubeEnrichment(songId: string): Promise<ValidationResult> {
  console.log('🧪 [TEST 2] Starting YouTube enrichment test', { songId });
  
  try {
    // Step 1: Get initial state
    const { data: beforeSong, error: beforeError } = await supabase
      .from('songs')
      .select('youtube_url, updated_at')
      .eq('id', songId)
      .single();

    if (beforeError) throw beforeError;

    console.log('📸 Before state:', beforeSong);

    // Step 2: Trigger YouTube enrichment
    console.log('🚀 Calling enrich-music-data with youtube-only mode...');
    const { data: enrichResponse, error: enrichError } = await supabase.functions.invoke('enrich-music-data', {
      body: { songId, mode: 'youtube-only' }
    });

    if (enrichError) throw enrichError;

    console.log('📦 YouTube enrichment response:', enrichResponse);

    // Step 3: Wait 2 seconds for database to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Query database to verify persistence
    const { data: afterSong, error: afterError } = await supabase
      .from('songs')
      .select('youtube_url, updated_at')
      .eq('id', songId)
      .single();

    if (afterError) throw afterError;

    console.log('📸 After state:', afterSong);

    // Step 5: Validation checks
    const hasYouTubeUrl = afterSong.youtube_url !== null && afterSong.youtube_url !== beforeSong.youtube_url;
    const responseHasVideoId = enrichResponse?.enrichedData?.youtubeVideoId;

    const passed = enrichResponse.success && hasYouTubeUrl && responseHasVideoId;

    return {
      test: 'YouTube Enrichment Persistence',
      passed,
      details: passed 
        ? `✅ YouTube URL persisted: ${afterSong.youtube_url}` 
        : `❌ YouTube URL not found or not persisted (response videoId: ${responseHasVideoId}, db url: ${afterSong.youtube_url})`,
      data: { before: beforeSong, after: afterSong, response: enrichResponse }
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      test: 'YouTube Enrichment Persistence',
      passed: false,
      details: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      data: { error }
    };
  }
}

/**
 * Test 3: Biography Enrichment Persistence
 * Enriquece biografia de artista e verifica persistência
 */
export async function testBiographyEnrichment(artistId: string): Promise<ValidationResult> {
  console.log('🧪 [TEST 3] Starting biography enrichment test', { artistId });
  
  try {
    // Step 1: Get artist initial state
    const { data: beforeArtist, error: beforeError } = await supabase
      .from('artists')
      .select('name, biography, biography_source, biography_updated_at')
      .eq('id', artistId)
      .single();

    if (beforeError) throw beforeError;

    console.log('📸 Before state:', beforeArtist);

    // Step 2: Trigger biography enrichment
    console.log('🚀 Calling generate-artist-bio edge function...');
    const { data: bioResponse, error: bioError } = await supabase.functions.invoke('generate-artist-bio', {
      body: { 
        artistId,
        artistName: beforeArtist.name 
      }
    });

    if (bioError) throw bioError;

    console.log('📦 Biography response:', bioResponse);

    // Step 3: Wait 2 seconds for database to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Query database to verify persistence
    const { data: afterArtist, error: afterError } = await supabase
      .from('artists')
      .select('biography, biography_source, biography_updated_at')
      .eq('id', artistId)
      .single();

    if (afterError) throw afterError;

    console.log('📸 After state:', afterArtist);

    // Step 5: Validation checks
    const responseHasBio = bioResponse?.biography && bioResponse.biography.trim().length >= 50;
    const biographyChanged = afterArtist.biography !== beforeArtist.biography;
    const timestampUpdated = afterArtist.biography_updated_at !== beforeArtist.biography_updated_at;
    const sourceRecorded = afterArtist.biography_source !== null;
    const biographyNotEmpty = afterArtist.biography && afterArtist.biography.trim().length >= 50;

    // API deve retornar success apenas se biografia foi encontrada E tem conteúdo
    if (bioResponse.success && !responseHasBio) {
      return {
        test: 'Biography Enrichment Persistence',
        passed: false,
        details: `❌ API retornou sucesso mas biografia está vazia (length: ${bioResponse.biography?.length || 0})`,
        data: { before: beforeArtist, after: afterArtist, response: bioResponse }
      };
    }

    const passed = responseHasBio && biographyChanged && timestampUpdated && sourceRecorded && biographyNotEmpty;

    return {
      test: 'Biography Enrichment Persistence',
      passed,
      details: passed 
        ? `✅ Biography persisted: source=${afterArtist.biography_source}, length=${afterArtist.biography?.length || 0}` 
        : `❌ Biography not persisted (changed: ${biographyChanged}, timestamp: ${timestampUpdated}, source: ${sourceRecorded}, notEmpty: ${biographyNotEmpty})`,
      data: { before: beforeArtist, after: afterArtist, response: bioResponse }
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      test: 'Biography Enrichment Persistence',
      passed: false,
      details: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      data: { error }
    };
  }
}

/**
 * Test 4: UI Update After Enrichment
 * Verifica se componentes React re-renderizam com dados atualizados
 */
export async function testUIUpdateAfterEnrichment(songId: string): Promise<ValidationResult> {
  console.log('🧪 [TEST 4] Starting UI update test', { songId });
  
  try {
    // Step 1: Query initial data
    const { data: beforeData, error: beforeError } = await supabase
      .from('songs')
      .select('title, composer, release_year, youtube_url, updated_at')
      .eq('id', songId)
      .single();

    if (beforeError) throw beforeError;

    console.log('📸 Initial DB state:', beforeData);

    // Step 2: Trigger enrichment
    const { data: enrichResponse, error: enrichError } = await supabase.functions.invoke('enrich-music-data', {
      body: { songId, mode: 'full' }
    });

    if (enrichError) throw enrichError;

    // Step 3: Wait for database update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Re-query to simulate component re-render
    const { data: afterData, error: afterError } = await supabase
      .from('songs')
      .select('title, composer, release_year, youtube_url, updated_at')
      .eq('id', songId)
      .single();

    if (afterError) throw afterError;

    console.log('📸 Final DB state:', afterData);

    // Step 5: Simulate what UI component would see
    const uiWouldSeeNewComposer = afterData.composer !== beforeData.composer && 
      afterData.composer !== 'Não Identificado';
    const uiWouldSeeNewYear = afterData.release_year !== beforeData.release_year && 
      afterData.release_year !== '0000';
    const uiWouldSeeNewYouTube = afterData.youtube_url !== beforeData.youtube_url;
    const timestampUpdated = afterData.updated_at !== beforeData.updated_at;

    const hasRealChanges = uiWouldSeeNewComposer || uiWouldSeeNewYear || uiWouldSeeNewYouTube;
    const noChangesDetected = enrichResponse.noChanges === true;
    
    const passed = enrichResponse.success && timestampUpdated && (hasRealChanges || noChangesDetected);

    return {
      test: 'UI Update After Enrichment',
      passed,
      details: passed 
        ? (hasRealChanges
            ? `✅ UI would re-render with: composer=${uiWouldSeeNewComposer}, year=${uiWouldSeeNewYear}, youtube=${uiWouldSeeNewYouTube}`
            : `✅ No UI changes but system correctly detected no better data (noChanges: ${noChangesDetected})`)
        : `❌ UI would not detect changes and no noChanges flag (timestamp updated: ${timestampUpdated})`,
      data: { before: beforeData, after: afterData, response: enrichResponse }
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      test: 'UI Update After Enrichment',
      passed: false,
      details: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      data: { error }
    };
  }
}

/**
 * Run all validation tests
 */
export async function runAllEnrichmentValidations(songId: string, artistId: string) {
  console.log('🎯 Starting complete enrichment validation suite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const results: ValidationResult[] = [];

  // Test 1: Metadata
  const test1 = await testMetadataEnrichment(songId);
  results.push(test1);
  console.log(`\n${test1.passed ? '✅' : '❌'} ${test1.test}: ${test1.details}\n`);

  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: YouTube
  const test2 = await testYouTubeEnrichment(songId);
  results.push(test2);
  console.log(`\n${test2.passed ? '✅' : '❌'} ${test2.test}: ${test2.details}\n`);

  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 3: Biography
  const test3 = await testBiographyEnrichment(artistId);
  results.push(test3);
  console.log(`\n${test3.passed ? '✅' : '❌'} ${test3.test}: ${test3.details}\n`);

  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 4: UI Update
  const test4 = await testUIUpdateAfterEnrichment(songId);
  results.push(test4);
  console.log(`\n${test4.passed ? '✅' : '❌'} ${test4.test}: ${test4.details}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 VALIDATION SUMMARY:');
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Passed: ${results.filter(r => r.passed).length}`);
  console.log(`   Failed: ${results.filter(r => !r.passed).length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
}

/**
 * Quick validation helper to check current enrichment status
 */
export async function quickEnrichmentStatusCheck() {
  console.log('🔍 Quick Enrichment Status Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check songs with enrichment data
  const { data: enrichedSongs, error: songsError } = await supabase
    .from('songs')
    .select('id, title, composer, release_year, youtube_url, status, confidence_score')
    .eq('status', 'enriched')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (songsError) {
    console.error('❌ Error fetching songs:', songsError);
  } else {
    console.log(`\n📊 Last 5 enriched songs:`);
    enrichedSongs?.forEach((song, i) => {
      console.log(`   ${i + 1}. ${song.title}`);
      console.log(`      - Composer: ${song.composer || '❌ null'}`);
      console.log(`      - Year: ${song.release_year || '❌ null'}`);
      console.log(`      - YouTube: ${song.youtube_url ? '✅ yes' : '❌ null'}`);
      console.log(`      - Confidence: ${song.confidence_score}%`);
    });
  }

  // Check artists with biography
  const { data: artistsWithBio, error: artistsError } = await supabase
    .from('artists')
    .select('id, name, biography, biography_source, biography_updated_at')
    .not('biography', 'is', null)
    .order('biography_updated_at', { ascending: false })
    .limit(5);

  if (artistsError) {
    console.error('❌ Error fetching artists:', artistsError);
  } else {
    console.log(`\n📚 Last 5 artists with biography:`);
    artistsWithBio?.forEach((artist, i) => {
      console.log(`   ${i + 1}. ${artist.name}`);
      console.log(`      - Source: ${artist.biography_source}`);
      console.log(`      - Length: ${artist.biography?.length || 0} chars`);
      console.log(`      - Updated: ${artist.biography_updated_at ? new Date(artist.biography_updated_at).toLocaleString() : 'never'}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
