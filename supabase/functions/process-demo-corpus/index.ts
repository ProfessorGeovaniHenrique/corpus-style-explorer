/**
 * 🎯 PROCESS DEMO CORPUS
 * 
 * Processa a música "Quando o Verso Vem pras Casa" e gera:
 * - Análises estatísticas (LL/MI scores)
 * - Domínios semânticos
 * - Prosódia
 * - Dados para visualizações
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Corpus da música "Quando o Verso Vem pras Casa"
const DEMO_CORPUS = [
  { palavra: "verso", freq: 5 }, { palavra: "campo", freq: 2 }, { palavra: "coxilha", freq: 2 },
  { palavra: "saudade", freq: 2 }, { palavra: "tarumã", freq: 2 }, { palavra: "várzea", freq: 2 },
  { palavra: "sombra", freq: 2 }, { palavra: "galpão", freq: 2 }, { palavra: "sol", freq: 2 },
  { palavra: "gateado", freq: 2 }, { palavra: "casa", freq: 1 }, { palavra: "calma", freq: 1 },
  { palavra: "pañuelo", freq: 1 }, { palavra: "maragato", freq: 1 }, { palavra: "horizonte", freq: 1 },
  { palavra: "campereada", freq: 1 }, { palavra: "lombo", freq: 1 }, { palavra: "galpão", freq: 1 },
  { palavra: "mate", freq: 1 }, { palavra: "maçanilha", freq: 1 }, { palavra: "coplas", freq: 1 },
  { palavra: "querência", freq: 1 }, { palavra: "galponeira", freq: 1 }, { palavra: "candeeiro", freq: 1 },
  { palavra: "campanha", freq: 1 }, { palavra: "açoite", freq: 1 }, { palavra: "tropa", freq: 1 },
  { palavra: "encilha", freq: 1 }, { palavra: "prenda", freq: 1 }, { palavra: "arreios", freq: 1 },
  { palavra: "esporas", freq: 1 }, { palavra: "bomba", freq: 1 }, { palavra: "cambona", freq: 1 },
  { palavra: "redomona", freq: 1 }
];

const TOTAL_TOKENS_GAUCHO = 143;
const TOTAL_TOKENS_NORDESTINO = 50000; // Corpus de referência estimado

// Frequências estimadas no corpus nordestino
const NORDESTINO_FREQS: Record<string, number> = {
  "verso": 8, "campo": 15, "coxilha": 0, "saudade": 25, "tarumã": 0,
  "várzea": 2, "sombra": 18, "galpão": 0, "sol": 30, "gateado": 0,
  "casa": 45, "calma": 12, "pañuelo": 0, "maragato": 0, "horizonte": 8,
  "campereada": 0, "lombo": 3, "mate": 1, "maçanilha": 0, "coplas": 0,
  "querência": 0, "galponeira": 0, "candeeiro": 2, "campanha": 4, "açoite": 0,
  "tropa": 5, "encilha": 0, "prenda": 0, "arreios": 1, "esporas": 2,
  "bomba": 8, "cambona": 0, "redomona": 0
};

// Domínios semânticos principais
const DOMAIN_MAPPING: Record<string, { domain: string; color: string; prosody: number }> = {
  "verso": { domain: "Poesia", color: "#8b5cf6", prosody: 1 },
  "campo": { domain: "Natureza", color: "#22c55e", prosody: 1 },
  "coxilha": { domain: "Paisagem Gaúcha", color: "#86efac", prosody: 1 },
  "saudade": { domain: "Sentimento", color: "#ef4444", prosody: -1 },
  "tarumã": { domain: "Flora Regional", color: "#10b981", prosody: 1 },
  "várzea": { domain: "Paisagem", color: "#34d399", prosody: 0 },
  "sombra": { domain: "Natureza", color: "#22c55e", prosody: 0 },
  "galpão": { domain: "Arquitetura Rural", color: "#f59e0b", prosody: 1 },
  "sol": { domain: "Natureza", color: "#22c55e", prosody: 1 },
  "gateado": { domain: "Fauna/Cavalo", color: "#eab308", prosody: 1 },
  "mate": { domain: "Cultura Gaúcha", color: "#8b5cf6", prosody: 1 },
  "querência": { domain: "Identidade Regional", color: "#ec4899", prosody: 1 },
  "galponeira": { domain: "Cultura Gaúcha", color: "#8b5cf6", prosody: 1 },
  "campanha": { domain: "Paisagem Gaúcha", color: "#86efac", prosody: 1 },
  "tropa": { domain: "Lida Campeira", color: "#f59e0b", prosody: 0 },
  "prenda": { domain: "Cultura Gaúcha", color: "#8b5cf6", prosody: 1 },
  "bomba": { domain: "Artefato Cultural", color: "#f59e0b", prosody: 0 }
};

/**
 * Calcula Log-Likelihood
 */
function calculateLL(o1: number, n1: number, o2: number, n2: number): number {
  const e1 = n1 * (o1 + o2) / (n1 + n2);
  const e2 = n2 * (o1 + o2) / (n1 + n2);
  
  const ll = 2 * (
    (o1 > 0 ? o1 * Math.log(o1 / e1) : 0) +
    (o2 > 0 ? o2 * Math.log(o2 / e2) : 0)
  );
  
  return ll;
}

/**
 * Calcula Mutual Information
 */
function calculateMI(o1: number, n1: number, o2: number, n2: number): number {
  const p1 = o1 / n1;
  const pTotal = (o1 + o2) / (n1 + n2);
  
  if (p1 === 0 || pTotal === 0) return 0;
  
  return Math.log2(p1 / pTotal);
}

/**
 * Processa o corpus demo
 */
function processDemoCorpus() {
  const keywords = DEMO_CORPUS.map(item => {
    const o1 = item.freq;
    const o2 = NORDESTINO_FREQS[item.palavra] || 0;
    
    const ll = calculateLL(o1, TOTAL_TOKENS_GAUCHO, o2, TOTAL_TOKENS_NORDESTINO);
    const mi = calculateMI(o1, TOTAL_TOKENS_GAUCHO, o2, TOTAL_TOKENS_NORDESTINO);
    
    const mapping = DOMAIN_MAPPING[item.palavra] || {
      domain: "Geral",
      color: "#94a3b8",
      prosody: 0
    };
    
    return {
      palavra: item.palavra,
      frequencia: item.freq,
      ll: parseFloat(ll.toFixed(2)),
      mi: parseFloat(mi.toFixed(2)),
      significancia: ll > 15.13 ? "Alta" : ll > 6.63 ? "Média" : "Baixa",
      dominio: mapping.domain,
      cor: mapping.color,
      prosody: mapping.prosody
    };
  }).sort((a, b) => b.ll - a.ll);

  // Agregar por domínio
  const dominioStats = keywords.reduce((acc, kw) => {
    if (!acc[kw.dominio]) {
      acc[kw.dominio] = {
        dominio: kw.dominio,
        cor: kw.cor,
        palavras: [],
        ocorrencias: 0,
        avgLL: 0,
        avgMI: 0
      };
    }
    
    acc[kw.dominio].palavras.push(kw.palavra);
    acc[kw.dominio].ocorrencias += kw.frequencia;
    acc[kw.dominio].avgLL += kw.ll;
    acc[kw.dominio].avgMI += kw.mi;
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular médias
  const dominios = Object.values(dominioStats).map((d: any) => ({
    ...d,
    avgLL: parseFloat((d.avgLL / d.palavras.length).toFixed(2)),
    avgMI: parseFloat((d.avgMI / d.palavras.length).toFixed(2)),
    riquezaLexical: d.palavras.length,
    percentual: parseFloat(((d.ocorrencias / TOTAL_TOKENS_GAUCHO) * 100).toFixed(2))
  })).sort((a, b) => b.avgLL - a.avgLL);

  // Dados para nuvem
  const cloudData = dominios.map(d => ({
    codigo: d.dominio.substring(0, 3).toUpperCase(),
    nome: d.dominio,
    size: d.avgLL * 3,
    color: d.cor,
    wordCount: d.palavras.length,
    avgScore: d.avgLL
  }));

  return {
    keywords,
    dominios,
    cloudData,
    estatisticas: {
      totalPalavras: TOTAL_TOKENS_GAUCHO,
      palavrasUnicas: DEMO_CORPUS.length,
      dominiosIdentificados: dominios.length,
      palavrasChaveSignificativas: keywords.filter(k => k.significancia === "Alta").length
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 Processando corpus demo...');
    
    const result = processDemoCorpus();
    
    console.log(`✅ Processamento concluído: ${result.keywords.length} palavras-chave, ${result.dominios.length} domínios`);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao processar corpus demo:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
