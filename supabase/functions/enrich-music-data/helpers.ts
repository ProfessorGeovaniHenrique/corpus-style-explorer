// Helper functions for music enrichment

interface YouTubeSearchResult {
  videoTitle: string;
  channelTitle: string;
  publishDate: string;
  description: string;
  videoId: string;
}

// Rate Limiter para controlar chamadas de API
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;
  private minDelay: number;
  private lastRequestTime = 0;

  constructor(maxConcurrent: number, minDelayMs: number) {
    this.maxConcurrent = maxConcurrent;
    this.minDelay = minDelayMs;
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.minDelay) {
            await new Promise(r => setTimeout(r, this.minDelay - timeSinceLastRequest));
          }

          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getRunningCount(): number {
    return this.running;
  }
}

// Lovable AI fallback removed due to hallucination issues

export async function searchYouTube(
  titulo: string,
  artista: string,
  apiKey: string,
  supabase: any
): Promise<YouTubeSearchResult | null> {
  const searchQuery = `${titulo} ${artista} official audio`;
  // Internal debug log - kept for ROI optimization
  console.log(`[YouTube] Searching for: "${searchQuery}"`);

  // Track quota usage BEFORE making API call
  if (supabase) {
    try {
      const { data: quotaData, error: quotaError } = await supabase.rpc('increment_youtube_quota');
      
      if (quotaError) {
        console.error('[YouTube] Error tracking quota:', quotaError);
      } else if (quotaData && quotaData > 10000) {
        console.error('[YouTube] Daily quota exceeded (10,000 queries)');
        return null;
      } else {
        console.log(`[YouTube] Quota usage: ${quotaData}/10,000 queries today`);
      }
    } catch (error) {
      console.error('[YouTube] Error checking quota:', error);
    }
  }

  try {
    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('youtube_cache')
      .select('video_id, video_title, channel_title, publish_date, description')
      .eq('search_query', searchQuery)
      .maybeSingle();

    if (cached && !cacheError) {
      console.log(`[YouTube] Cache HIT: "${searchQuery}"`);
      return {
        videoTitle: cached.video_title || '',
        channelTitle: cached.channel_title || '',
        publishDate: cached.publish_date || '',
        description: cached.description || '',
        videoId: cached.video_id
      };
    }

    console.log(`[YouTube] Cache MISS - Searching API: "${searchQuery}"`);

    // Search YouTube API
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${apiKey}`;
    const response = await fetch(url);

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        console.error('[YouTube] Daily quota exceeded - No fallback available');
        throw new Error('YOUTUBE_QUOTA_EXCEEDED'); // ✅ FIX: Propaga erro ao invés de return null
      }
    }

    if (!response.ok) {
      console.error(`[YouTube] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const firstResult = data.items?.[0];

    if (!firstResult) {
      console.log(`[YouTube] No results found for: "${searchQuery}"`);
      return null;
    }

    const snippet = firstResult.snippet;
    const result: YouTubeSearchResult = {
      videoTitle: snippet.title,
      channelTitle: snippet.channelTitle || snippet.channelName,
      publishDate: snippet.publishedAt,
      description: snippet.description || '',
      videoId: firstResult.id.videoId
    };

    console.log(`[YouTube] Found: "${result.videoTitle}" (${result.channelTitle})`);

    // Cache the result
    const { error: cacheSaveError } = await supabase.from('youtube_cache').insert({
      search_query: searchQuery,
      video_id: result.videoId,
      video_title: result.videoTitle,
      channel_title: result.channelTitle,
      publish_date: result.publishDate,
      description: result.description || '',
      hits_count: 0
    });

    if (cacheSaveError && !cacheSaveError.message.includes('duplicate')) {
      console.error('[YouTube] Cache save error:', cacheSaveError.message);
    }

    return result;

  } catch (error) {
    console.error('[YouTube] Search error:', error);
    return null;
  }
}

export async function searchWithAI(
  titulo: string,
  artista: string,
  lovableApiKey: string | undefined,
  geminiApiKey?: string
): Promise<{ compositor: string; ano: string; fonte?: string }> {
  const searchPrompt = `Você é um especialista em metadados musicais brasileiros.

Música: "${titulo}"
Artista: "${artista}"

Sua tarefa:
1. Identifique o COMPOSITOR ORIGINAL (não o intérprete)
2. Identifique o ANO DE LANÇAMENTO ORIGINAL (não de regravações)

REGRAS CRÍTICAS:
- Se for cover/regravação, retorne dados da versão ORIGINAL
- Retorne APENAS informações verificáveis e precisas
- Se não tiver certeza, retorne "Não Identificado" para compositor e "0000" para ano
- Priorize música brasileira (forró, piseiro, sertanejo, gaúcha)

REGRAS PARA COMPOSITORES:
- Se houver MÚLTIPLOS compositores, liste TODOS separados por " / "
- Não confunda intérprete com compositor
- Formato: "Compositor 1 / Compositor 2 / Compositor 3"
- Exemplo: "Luiz Marenco / Gujo Teixeira"

Retorne APENAS um objeto JSON válido:
{
  "compositor": "Nome(s) do(s) Compositor(es) separados por ' / ' se houver mais de um",
  "ano": "YYYY",
  "fonte": "Base de Conhecimento Digital"
}`;

  // Use Google API directly
  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: searchPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 300,
              responseMimeType: "application/json"
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawText) {
          const parsedData = JSON.parse(rawText);
          console.log('[searchWithAI] ✅ Google API (Gemini Pro) success');
          return {
            compositor: parsedData.compositor || 'Não Identificado',
            ano: validateYear(parsedData.ano),
            fonte: parsedData.fonte || 'Base de Conhecimento Digital'
          };
        }
      }
    } catch (error) {
      console.error('[searchWithAI] Google API failed:', error);
    }
  }

  return { compositor: 'Não Identificado', ano: '0000' };
}

export function validateYear(year: any): string {
  if (!year) return '0000';

  const yearStr = String(year).trim();

  if (/^\d{4}$/.test(yearStr)) {
    const yearNum = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();
    if (yearNum >= 1900 && yearNum <= currentYear + 1) {
      return yearStr;
    }
  }

  const match = yearStr.match(/\d{4}/);
  if (match) {
    const yearNum = parseInt(match[0], 10);
    const currentYear = new Date().getFullYear();
    if (yearNum >= 1900 && yearNum <= currentYear + 1) {
      return match[0];
    }
  }

  return '0000';
}

// ===== CAMADA 1: Extração Inteligente de Metadados do YouTube =====
export function extractMetadataFromYouTube(youtubeResult: YouTubeSearchResult): {
  composer?: string;
  album?: string;
  year?: string;
} {
  const description = youtubeResult.description || '';
  const title = youtubeResult.videoTitle || '';
  
  const result: { composer?: string; album?: string; year?: string } = {};
  
  // ===== COMPOSITOR =====
  const composerPatterns = [
    /Compositor(?:es)?:\s*([^\n\r]+)/i,
    /Compos(?:ição|er):\s*([^\n\r]+)/i,
    /Written by:\s*([^\n\r]+)/i,
    /Escrita por:\s*([^\n\r]+)/i,
    /Autor(?:es)?:\s*([^\n\r]+)/i,
    /Letrista:\s*([^\n\r]+)/i,
    /Letra:\s*([^\n\r]+)/i,
    /Music by:\s*([^\n\r]+)/i,
    /Lyrics by:\s*([^\n\r]+)/i,
    /Música e letra:\s*([^\n\r]+)/i
    // ❌ REMOVIDO: padrão problemático /℗.*?([A-ZÁÉÍÓÚ]...)/ que capturava "Released", "Gravadora"
  ];
  
  // Lista de palavras inválidas que não são compositores
  const invalidComposerWords = [
    'released', 'gravadora', 'records', 'music', 'entertainment', 
    'produções', 'studio', 'label', 'editora', 'distribuidora',
    'copyright', 'rights', 'reserved', 'ltd', 'inc', 'ltda'
  ];
  
  for (const pattern of composerPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      let composer = match[1].trim();
      
      // Verificar se contém palavras inválidas
      const composerLower = composer.toLowerCase();
      const isInvalid = invalidComposerWords.some(word => composerLower.includes(word));
      
      if (isInvalid) {
        continue; // Pular para o próximo padrão
      }
      
      // Limpar: remover "and", "e", vírgulas no final
      composer = composer.replace(/\s+and\s+/gi, ' / ').replace(/\s+e\s+/gi, ' / ').replace(/[,;]$/, '');
      
      if (composer.length > 3 && composer.length < 100) {
        result.composer = composer;
        break;
      }
    }
  }
  
  // ===== ÁLBUM =====
  const albumPatterns = [
    /Álbum:\s*["']?([^"'\n\r]+)["']?/i,
    /Album:\s*["']?([^"'\n\r]+)["']?/i,
    /CD:\s*["']?([^"'\n\r]+)["']?/i,
    /Do álbum:\s*["']?([^"'\n\r]+)["']?/i,
    /From the album:\s*["']?([^"'\n\r]+)["']?/i,
    /LP:\s*["']?([^"'\n\r]+)["']?/i,
    /\(([^)]*(?:CD|Album|Álbum)[^)]*)\)/i
  ];
  
  for (const pattern of albumPatterns) {
    const match = description.match(pattern) || title.match(pattern);
    if (match && match[1]) {
      let album = match[1].trim();
      album = album.replace(/^["']|["']$/g, '').trim();
      if (album.length > 2 && album.length < 100) {
        result.album = album;
        break;
      }
    }
  }
  
  // ===== ANO =====
  const yearPatterns = [
    /℗\s*(\d{4})/,
    /©\s*(\d{4})/,
    /Lançamento:\s*(\d{4})/i,
    /Released:\s*(\d{4})/i,
    /Ano:\s*(\d{4})/i,
    /\b(19[89]\d|20[0-2]\d)\b/
  ];
  
  for (const pattern of yearPatterns) {
    const match = description.match(pattern) || title.match(pattern);
    if (match && match[1]) {
      const year = validateYear(match[1]);
      if (year !== '0000') {
        result.year = year;
        break;
      }
    }
  }
  
  // Fallback: usar publishDate do vídeo
  if (!result.year && youtubeResult.publishDate) {
    const publishYear = new Date(youtubeResult.publishDate).getFullYear();
    if (publishYear >= 1900 && publishYear <= new Date().getFullYear()) {
      result.year = String(publishYear);
    }
  }
  
  return result;
}

// ===== CAMADA 2: Gemini + Google Search Grounding (Web Search Real) =====
export async function searchWithGoogleGrounding(
  titulo: string,
  artista: string,
  geminiApiKey: string
): Promise<{
  compositor?: string;
  ano?: string;
  album?: string;
  fontes?: string[];
  confidence: 'high' | 'medium' | 'low';
}> {
  const prompt = `Busque informações sobre a música "${titulo}" do artista "${artista}".

Retorne APENAS um JSON com:
- compositor: Nome(s) do(s) compositor(es) original(is), separados por " / " se múltiplos
- ano: Ano de lançamento original (YYYY)
- album: Nome do álbum original

REGRAS:
- Priorize fontes oficiais (Wikipedia, Discogs, AllMusic, site oficial do artista)
- Se for cover/regravação, retorne dados da versão ORIGINAL
- Se não encontrar com certeza, retorne null para o campo
- Para compositores múltiplos use formato: "Nome 1 / Nome 2"

Retorne JSON sem explicações ou markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{
            google_search_retrieval: {
              dynamic_retrieval_config: {
                mode: "MODE_DYNAMIC",
                dynamic_threshold: 0.6
              }
            }
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('[GoogleGrounding] API error:', response.status);
      return { confidence: 'low' };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      return { confidence: 'low' };
    }

    const parsed = JSON.parse(rawText);
    
    // Extrair fontes do grounding metadata (se disponível)
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const fontes: string[] = [];
    
    if (groundingMetadata?.searchEntryPoint?.renderedContent) {
      fontes.push('google_search_grounding');
    }
    
    // Determinar confidence baseado na presença de grounding
    let confidence: 'high' | 'medium' | 'low' = 'low';
    const hasGrounding = groundingMetadata?.searchEntryPoint || groundingMetadata?.groundingChunks;
    const hasMultipleFields = [parsed.compositor, parsed.ano, parsed.album].filter(Boolean).length;
    
    if (hasGrounding && hasMultipleFields >= 2) {
      confidence = 'high';
    } else if (hasGrounding || hasMultipleFields >= 2) {
      confidence = 'medium';
    }
    
    console.log(`[GoogleGrounding] Found: compositor=${parsed.compositor}, ano=${parsed.ano}, album=${parsed.album}, confidence=${confidence}`);
    
    return {
      compositor: parsed.compositor || undefined,
      ano: parsed.ano ? validateYear(parsed.ano) : undefined,
      album: parsed.album || undefined,
      fontes: fontes.length > 0 ? fontes : undefined,
      confidence
    };
    
  } catch (error) {
    console.error('[GoogleGrounding] Search error:', error);
    return { confidence: 'low' };
  }
}
