import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { createEdgeLogger } from "../_shared/unified-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRequest {
  jobId?: string;  // ✅ NOVO: ID do job existente (opcional)
  fileContent?: string;
  offsetInicial?: number;
}

interface ParsedEntry {
  verbete: string;
  verbete_normalizado: string;
  tipo_dicionario: string; // ✅ Identificador único do dicionário
  classe_gramatical: string | null;
  origem_regionalista: string[];
  variantes: string[];
  definicoes: string[];
  entry_type: 'word' | 'mwe';
  volume_fonte: string;
  confianca_extracao: number;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('process-nordestino-navarro', requestId);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { jobId, fileContent, offsetInicial = 0 }: ProcessRequest = await req.json();
    
    let job: any;
    let jobIdFinal: string;

    if (jobId) {
      // ✅ Se jobId fornecido, usar job existente
      log.info('Using existing job', { jobId });
      const { data, error } = await supabase
        .from('dictionary_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error || !data) {
        throw new Error(`Job ${jobId} não encontrado: ${error?.message}`);
      }
      job = data;
      jobIdFinal = job.id;
    } else {
      // ✅ Se não fornecido, criar novo job (compatibilidade)
      log.info('Creating new job');
      const { data, error: jobError } = await supabase
        .from('dictionary_import_jobs')
        .insert({
          tipo_dicionario: 'navarro_nordeste_2014',
          status: 'iniciado',
          offset_inicial: offsetInicial,
          metadata: {
            fonte: 'Dicionário do Nordeste - Fred Navarro - 2014 (Limpo)',
            url_github: 'https://github.com/ProfessorGeovaniHenrique/estilisticadecorpus/blob/main/public/dictionaries/NAVARROCLEAN.txt'
          }
        })
        .select()
        .single();
      
      if (jobError) throw jobError;
      job = data;
      jobIdFinal = job.id;
    }

    log.info('Job initialized', { jobId: jobIdFinal, offset: offsetInicial });

    // Usar conteúdo do body ou buscar do GitHub
    let content: string;
    if (fileContent) {
      log.info('Using provided file content');
      content = fileContent;
    } else {
      log.info('Fetching file from GitHub');
      const githubUrl = 'https://raw.githubusercontent.com/ProfessorGeovaniHenrique/estilisticadecorpus/main/public/dictionaries/NAVARROCLEAN.txt';
      const response = await fetch(githubUrl);
      if (!response.ok) throw new Error(`Erro ao buscar arquivo: ${response.statusText}`);
      content = await response.text();
    }
    
    const lines = content.split('\n').filter(line => line.trim());
    log.info('Lines parsed', { totalLines: lines.length });

    // Processar em background
    processInBackground(supabase, jobIdFinal, lines, offsetInicial);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: jobIdFinal,
        message: 'Importação iniciada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    log.error('Error in process-nordestino-navarro', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ✅ Validação simplificada de verbete
function isValidVerbete(verbete: string): boolean {
  if (verbete.length === 0 || verbete.length > 50) {
    return false;
  }
  return true;
}

// ✅ Detectar classes gramaticais comuns
function detectGrammarClass(text: string): string | null {
  const posPatterns = ['s.m.', 's.f.', 's.2g.', 'v.t.d.', 'v.t.i.', 'v.int.', 'v.pron.', 'adj.', 'adv.', 'loc.', 'fraseol.'];
  for (const pattern of posPatterns) {
    if (text.toLowerCase().includes(pattern)) {
      return text;
    }
  }
  return null;
}

// ✅ Detectar região por código de estado ou "n.e."
function detectRegion(text: string): string | null {
  // Códigos de estado: ba, ce, pe, etc.
  if (text.match(/^[a-z]{2}$/i)) {
    return text.toUpperCase();
  }
  // Nordeste abreviado
  if (text.toLowerCase() === 'n.e.') {
    return 'NORDESTE';
  }
  return null;
}

// ✅ PARSER SIMPLIFICADO E DIRETO POR ÍNDICE
function parseNordestinoEntry(line: string): ParsedEntry | null {
  // ✅ Split por bullet point
  const parts = line.split('•').map(p => p.trim()).filter(p => p);
  
  if (parts.length < 2) return null;
  
  // ✅ MAPEAMENTO DIRETO POR ÍNDICE
  const verbete = parts[0]; // Índice 0: verbete
  
  if (!isValidVerbete(verbete)) {
    return null;
  }
  
  // ✅ Índice 1: classe gramatical (se existir)
  const classe_gramatical = parts.length > 1 ? detectGrammarClass(parts[1]) : null;
  
  // ✅ Índice 2: região (se existir)
  let origem_regionalista: string[] = [];
  if (parts.length > 2) {
    const region = detectRegion(parts[2]);
    if (region) {
      origem_regionalista.push(region);
    }
  }
  
  // Se não detectou região, assumir NORDESTE
  if (origem_regionalista.length === 0) {
    origem_regionalista.push('NORDESTE');
  }
  
  // ✅ ÍNDICE 3 EM DIANTE: DEFINIÇÃO COMPLETA (concatenar preservando estrutura)
  let definicaoCompleta = '';
  if (parts.length > 3) {
    // Preservar TODA a estrutura: acepções numeradas, aspas, colchetes, etc.
    definicaoCompleta = parts.slice(3).join(' • ');
  } else if (parts.length === 3) {
    // Caso especial: se só tem 3 partes, a definição pode estar no índice 2
    if (!detectRegion(parts[2])) {
      definicaoCompleta = parts[2];
    }
  }
  
  // Se não há definição, descartar entrada
  if (!definicaoCompleta || definicaoCompleta.trim().length === 0) {
    return null;
  }
  
  const entry_type = verbete.includes(' ') ? 'mwe' : 'word';
  
  return {
    verbete,
    verbete_normalizado: verbete.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    tipo_dicionario: 'navarro_2014',
    classe_gramatical,
    origem_regionalista,
    variantes: [], // Variantes podem ser extraídas futuramente se necessário
    definicoes: [definicaoCompleta], // ✅ Array com UMA string contendo TODA a definição
    entry_type,
    volume_fonte: 'Navarro 2014',
    confianca_extracao: 0.92
  };
}

async function processInBackground(supabase: any, jobId: string, lines: string[], offsetInicial: number) {
  const BATCH_SIZE = 100;
  let processados = offsetInicial;
  let inseridos = 0;
  let erros = 0;

  try {
    await supabase
      .from('dictionary_import_jobs')
      .update({ 
        status: 'processando',
        tempo_inicio: new Date().toISOString()
      })
      .eq('id', jobId);

    const verbetes: any[] = [];

    for (let i = offsetInicial; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Validação básica - arquivo já está limpo
      if (!line || !line.includes('•')) continue;

      try {
        // ✅ PRÉ-PROCESSAMENTO: Dividir linhas com // (múltiplas entradas)
        const subLines = line.includes('//') 
          ? line.split('//').map(s => s.trim()).filter(s => s)
          : [line];
        
        // Processar cada sub-linha como entrada independente
        for (const subLine of subLines) {
          const parsedEntry = parseNordestinoEntry(subLine);
          if (parsedEntry) {
            verbetes.push(parsedEntry);
            // Log de amostra para debug (apenas primeiros 5 verbetes)
            if (verbetes.length <= 5) {
              console.log(`✅ Verbete: ${parsedEntry.verbete} | Def: ${parsedEntry.definicoes[0]?.substring(0, 80)}...`);
            }
          }
        }
      } catch (parseError) {
        console.error(`Erro ao parsear linha ${i}:`, line, parseError);
        erros++;
      }

      // Processar em lotes
      if (verbetes.length >= BATCH_SIZE) {
        const { error: insertError } = await supabase
          .from('dialectal_lexicon')
          .upsert(verbetes, { 
            onConflict: 'verbete_normalizado,volume_fonte',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error('Erro ao inserir lote:', insertError);
          erros += verbetes.length;
        } else {
          inseridos += verbetes.length;
        }

        processados = i + 1;
        const progresso = (processados / lines.length) * 100;

        await supabase
          .from('dictionary_import_jobs')
          .update({
            total_verbetes: lines.length,
            verbetes_processados: processados,
            verbetes_inseridos: inseridos,
            erros,
            progresso,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', jobId);

        verbetes.length = 0;
      }
    }

    // Processar últimos verbetes
    if (verbetes.length > 0) {
      const { error: insertError } = await supabase
        .from('dialectal_lexicon')
        .upsert(verbetes, { 
          onConflict: 'verbete_normalizado,volume_fonte',
          ignoreDuplicates: false 
        });

      if (!insertError) {
        inseridos += verbetes.length;
      } else {
        erros += verbetes.length;
      }
    }

    await supabase
      .from('dictionary_import_jobs')
      .update({
        status: 'concluido',
        tempo_fim: new Date().toISOString(),
        total_verbetes: lines.length,
        verbetes_processados: lines.length,
        verbetes_inseridos: inseridos,
        erros,
        progresso: 100,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`✅ Importação concluída: ${inseridos} verbetes inseridos, ${erros} erros`);

  } catch (error: any) {
    console.error('❌ Erro no processamento:', error);
    
    await supabase
      .from('dictionary_import_jobs')
      .update({
        status: 'erro',
        erro_mensagem: error.message,
        tempo_fim: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}
