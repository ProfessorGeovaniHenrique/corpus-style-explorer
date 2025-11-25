# 🚀 SPRINT 3: LAYER 3 (GEMINI FLASH) FALLBACK

## **📊 ESTADO ATUAL (Pós-Sprint 2)**

| Métrica | Valor Atual | Meta Sprint 3 |
|---------|-------------|---------------|
| **Cobertura Layer 1** | 70-85% | 70-85% (mantém) |
| **Cobertura Layer 1+2** | 85-95% | 85-95% (mantém) |
| **Unknown Words** | 5-15% | 0-5% ⬇️ |
| **Latência Média** | <500ms | <800ms |
| **Custo por Token** | $0 | $0.0001 (Gemini Flash) |

---

## **🎯 OBJETIVO DO SPRINT 3**

Eliminar os últimos 5-15% de palavras desconhecidas usando **Gemini Flash** como fallback final para:
- Neologismos (ex: "tuitou", "zapeou")
- Palavras raras do corpus gaúcho não cobertas por spaCy
- Erros de spaCy em contextos específicos
- Casos de baixa confiança (<90%) de Layer 2

---

## **🏗️ ARQUITETURA ATUALIZADA (3 LAYERS)**

```
┌────────────────────────────────────────────────────────────────┐
│               ANNOTATE-POS EDGE FUNCTION (3-Layer)              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📍 INPUT: fullText + palavras[]                               │
│  ↓                                                              │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ LAYER 1: VA GRAMMAR (Zero Cost, 100% Precision)     │     │
│  │ - 50+ irregular verbs                                 │     │
│  │ - Gaúcho MWEs (mate amargo, cavalo gateado)         │     │
│  │ - Intelligent cache (palavra:contexto)               │     │
│  │ - Cobertura: 70-85%                                  │     │
│  └──────────────────────────────────────────────────────┘     │
│  ↓ Unknown tokens (~20-30%)                                    │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ LAYER 2: SPACY FALLBACK (External Microservice)     │     │
│  │ - HTTP POST → Python microservice                    │     │
│  │ - Model: pt_core_news_lg                            │     │
│  │ - Timeout: 5s + retry 1x                            │     │
│  │ - Cobertura adicional: +10-15%                      │     │
│  └──────────────────────────────────────────────────────┘     │
│  ↓ Still unknown (~5-15%)                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ LAYER 3: GEMINI FLASH (AI Fallback) ⭐ SPRINT 3     │     │
│  │ - Model: gemini-2.5-flash-002                       │     │
│  │ - Context: sentença completa + palavra target       │     │
│  │ - Prompt: few-shot examples (5 samples)             │     │
│  │ - Cache: palavra:sentença → resultado                │     │
│  │ - Custo: ~$0.0001 por token                         │     │
│  │ - Cobertura final: +5-10%                           │     │
│  └──────────────────────────────────────────────────────┘     │
│  ↓                                                              │
│  📤 OUTPUT: 95-100% cobertura POS                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## **⚙️ IMPLEMENTAÇÃO DETALHADA**

### **FASE 3.1: Criar Gemini Flash Annotator (2h)**

#### **Arquivo: `supabase/functions/_shared/gemini-pos-annotator.ts`**

```typescript
import type { AnnotatedToken } from './hybrid-pos-annotator.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash-002';
const GEMINI_TIMEOUT_MS = 10000; // 10s timeout (Gemini pode ser mais lento)

interface GeminiPOSResponse {
  palavra: string;
  lema: string;
  pos: string; // Universal POS tag
  posDetalhada: string;
  features: {
    tempo?: string;
    numero?: string;
    pessoa?: string;
    genero?: string;
  };
  confianca: number;
  justificativa: string;
}

/**
 * Prompt de few-shot learning para Gemini
 */
const GEMINI_POS_PROMPT = `Você é um especialista em anotação morfossintática de português brasileiro.

Dada uma palavra dentro de um contexto, retorne a análise POS detalhada em JSON.

EXEMPLOS:

Entrada: palavra="estava", contexto="eu estava caminhando no campo"
Saída: {
  "palavra": "estava",
  "lema": "estar",
  "pos": "AUX",
  "posDetalhada": "AUX",
  "features": { "tempo": "Imperf", "numero": "Sing", "pessoa": "1" },
  "confianca": 0.95,
  "justificativa": "Verbo auxiliar 'estar' no pretérito imperfeito, 1ª pessoa singular"
}

Entrada: palavra="tuitou", contexto="ela tuitou sobre o assunto ontem"
Saída: {
  "palavra": "tuitou",
  "lema": "tuitar",
  "pos": "VERB",
  "posDetalhada": "VERB",
  "features": { "tempo": "Perf", "numero": "Sing", "pessoa": "3" },
  "confianca": 0.90,
  "justificativa": "Neologismo derivado de 'Twitter', verbo regular terminação -ou (pretérito perfeito 3ª pessoa)"
}

Entrada: palavra="aquerenciou", contexto="o verso aquerenciou a saudade"
Saída: {
  "palavra": "aquerenciou",
  "lema": "aquerenciar",
  "pos": "VERB",
  "posDetalhada": "VERB",
  "features": { "tempo": "Perf", "numero": "Sing", "pessoa": "3" },
  "confianca": 0.92,
  "justificativa": "Verbo regional gaúcho derivado de 'querência', pretérito perfeito 3ª pessoa"
}

Entrada: palavra="zapeou", contexto="ele zapeou pelos canais rapidamente"
Saída: {
  "palavra": "zapeou",
  "lema": "zapear",
  "pos": "VERB",
  "posDetalhada": "VERB",
  "features": { "tempo": "Perf", "numero": "Sing", "pessoa": "3" },
  "confianca": 0.88,
  "justificativa": "Neologismo do inglês 'zap' (trocar canais), verbo regular -ar, pretérito perfeito 3ª pessoa"
}

Entrada: palavra="cuia", contexto="tomou mate na cuia amarga"
Saída: {
  "palavra": "cuia",
  "lema": "cuia",
  "pos": "NOUN",
  "posDetalhada": "NOUN",
  "features": { "genero": "Fem", "numero": "Sing" },
  "confianca": 0.98,
  "justificativa": "Substantivo feminino singular, objeto cultural gaúcho para tomar mate"
}

TAGS POS UNIVERSAIS PERMITIDAS:
- VERB (verbo principal)
- AUX (verbo auxiliar)
- NOUN (substantivo)
- ADJ (adjetivo)
- ADV (advérbio)
- PRON (pronome)
- DET (determinante/artigo)
- ADP (preposição)
- CCONJ (conjunção coordenativa)
- SCONJ (conjunção subordinativa)
- NUM (numeral)
- PART (partícula)
- INTJ (interjeição)
- PROPN (nome próprio)
- PUNCT (pontuação)
- X (outros)

IMPORTANTE:
- Use lematização correta do português brasileiro
- Considere o contexto completo da sentença
- Para neologismos, identifique o radical e a terminação
- Para regionalismos, use o contexto cultural quando disponível
- Se não tiver certeza, use confiança < 0.80

Agora analise a palavra abaixo:`;

/**
 * Anota tokens desconhecidos usando Gemini Flash
 */
export async function annotateWithGemini(
  unknownTokens: AnnotatedToken[],
  fullText: string
): Promise<AnnotatedToken[]> {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY não configurado - pulando Layer 3');
    return unknownTokens;
  }

  if (unknownTokens.length === 0) {
    return [];
  }

  console.log(`✨ Layer 3 (Gemini): processando ${unknownTokens.length} tokens...`);

  const annotatedResults: AnnotatedToken[] = [];

  // Processar em batches de 5 (otimizar custo vs. latência)
  const BATCH_SIZE = 5;
  for (let i = 0; i < unknownTokens.length; i += BATCH_SIZE) {
    const batch = unknownTokens.slice(i, i + BATCH_SIZE);
    
    try {
      const batchPromises = batch.map(token => 
        annotateTokenWithGemini(token, fullText)
      );
      
      const batchResults = await Promise.all(batchPromises);
      annotatedResults.push(...batchResults);
      
    } catch (error) {
      console.error(`❌ Erro no batch ${i}-${i + BATCH_SIZE}:`, error);
      // Fallback: retornar tokens originais para este batch
      annotatedResults.push(...batch);
    }
  }

  const geminiCovered = annotatedResults.filter(t => t.pos !== 'UNKNOWN').length;
  console.log(`✅ Layer 3 (Gemini): ${geminiCovered}/${unknownTokens.length} tokens cobertos`);

  return annotatedResults;
}

/**
 * Anota um único token usando Gemini Flash
 */
async function annotateTokenWithGemini(
  token: AnnotatedToken,
  fullText: string
): Promise<AnnotatedToken> {
  try {
    // Extrair contexto (sentença contendo a palavra)
    const sentenceContext = extractSentence(fullText, token.palavra);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${GEMINI_POS_PROMPT}\n\npalavra="${token.palavra}"\ncontexto="${sentenceContext}"`
            }]
          }],
          generationConfig: {
            temperature: 0.1, // Baixa criatividade (mais determinístico)
            maxOutputTokens: 200,
          }
        })
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parsear JSON da resposta
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini não retornou JSON válido');
    }
    
    const parsed: GeminiPOSResponse = JSON.parse(jsonMatch[0]);
    
    return {
      ...token,
      lema: parsed.lema,
      pos: parsed.pos,
      posDetalhada: parsed.posDetalhada,
      features: parsed.features,
      source: 'gemini',
      confianca: parsed.confianca
    };
    
  } catch (error) {
    console.error(`❌ Erro ao anotar "${token.palavra}" com Gemini:`, error);
    return token; // Retornar inalterado
  }
}

/**
 * Extrai sentença contendo a palavra target
 */
function extractSentence(fullText: string, targetWord: string): string {
  // Dividir por pontuação forte
  const sentences = fullText.split(/[.!?]\s+/);
  
  // Encontrar sentença contendo a palavra
  const sentence = sentences.find(s => 
    s.toLowerCase().includes(targetWord.toLowerCase())
  );
  
  return sentence || fullText.substring(0, 200); // Fallback: primeiros 200 chars
}
```

---

### **FASE 3.2: Integrar Layer 3 no Pipeline (1h)**

#### **Modificações em `annotate-pos/index.ts`:**

```typescript
import { annotateWithGemini } from '../_shared/gemini-pos-annotator.ts';

// DENTRO DA FUNÇÃO processText, após Layer 2:

// Layer 3: Gemini Flash para casos remanescentes
let finalAnnotations = annotations;
let layer3Time = 0;

const stillUnknown = annotations.filter(t => t.pos === 'UNKNOWN' || (t.confianca && t.confianca < 0.90));

if (stillUnknown.length > 0) {
  console.log(`✨ Layer 3 (Gemini): processando ${stillUnknown.length} tokens...`);
  const startLayer3 = Date.now();
  const geminiAnnotations = await annotateWithGemini(stillUnknown, inputText);
  layer3Time = Date.now() - startLayer3;
  
  // Substituir tokens com baixa confiança por resultados Gemini
  const geminiMap = new Map(geminiAnnotations.map(t => [t.palavra, t]));
  finalAnnotations = annotations.map(t => 
    geminiMap.has(t.palavra) ? geminiMap.get(t.palavra)! : t
  );
  
  const geminiCovered = geminiAnnotations.filter(t => t.pos !== 'UNKNOWN').length;
  console.log(`✅ Layer 3 (Gemini): ${geminiCovered}/${stillUnknown.length} tokens cobertos (${layer3Time}ms)`);
}

// Atualizar response com layer3Time
return new Response(JSON.stringify({
  // ... existente
  performance: {
    layer1Time,
    layer2Time,
    layer3Time,
    totalTime: layer1Time + layer2Time + layer3Time
  }
}));
```

---

### **FASE 3.3: UI Updates (1h)**

#### **Modificações em `POSAnnotatorTest.tsx`:**

1. **Adicionar badge Gemini:**
```typescript
{token.source === 'gemini' && (
  <Badge variant="outline" className="gap-1">
    ✨ Gemini
  </Badge>
)}
```

2. **Adicionar estatísticas Layer 3:**
```typescript
{performance.layer3Time > 0 && (
  <div className="flex justify-between">
    <span className="text-muted-foreground">✨ Layer 3 (Gemini):</span>
    <span className="font-mono font-semibold">{performance.layer3Time}ms</span>
  </div>
)}
```

3. **Adicionar filtro por fonte:**
```typescript
const [sourceFilter, setSourceFilter] = useState<string[]>([]);

// Permitir filtrar anotações por: VA Grammar, spaCy, Gemini, Cache
```

---

### **FASE 3.4: Caching Inteligente (1h)**

#### **Tabela de Cache:**
```sql
CREATE TABLE gemini_pos_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra TEXT NOT NULL,
  contexto_hash TEXT NOT NULL, -- Hash da sentença
  lema TEXT,
  pos TEXT,
  pos_detalhada TEXT,
  features JSONB,
  confianca NUMERIC,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  hits_count INT DEFAULT 0,
  UNIQUE(palavra, contexto_hash)
);

CREATE INDEX idx_gemini_pos_cache_palavra ON gemini_pos_cache(palavra);
CREATE INDEX idx_gemini_pos_cache_hash ON gemini_pos_cache(contexto_hash);
```

#### **Lógica de Cache:**
```typescript
// Antes de chamar Gemini, verificar cache
const cacheKey = `${palavra}:${hashContext(sentenceContext)}`;
const cached = await checkGeminiPOSCache(cacheKey);

if (cached) {
  console.log(`💾 Cache hit: ${palavra}`);
  return cached;
}

// Após resposta Gemini, salvar no cache
await saveToGeminiPOSCache(cacheKey, geminiResult);
```

---

### **FASE 3.5: Monitoramento e Custos (30min)**

#### **Tabela de Uso da API:**
```sql
CREATE TABLE gemini_pos_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT DEFAULT 'annotate-pos',
  tokens_annotated INT,
  tokens_input INT,
  tokens_output INT,
  cost_usd NUMERIC, -- Estimado
  cached_hits INT,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Dashboard de Custos:**
Adicionar em `SpacyHealthDashboard.tsx`:
- Total de tokens anotados por Gemini
- Custo estimado acumulado
- Taxa de cache hit (economia)
- Latência média Layer 3

---

## **📊 MÉTRICAS DE SUCESSO**

| Métrica | Meta | Como Validar |
|---------|------|--------------|
| **Cobertura Final** | ≥95% | Testar em 100 canções aleatórias |
| **Unknown Words** | ≤5% | Count de tokens `pos: 'UNKNOWN'` após Layer 3 |
| **Latência Layer 3** | <500ms | Timer `startLayer3` → `endLayer3` |
| **Custo por Canção** | <$0.005 | Tokens Gemini × $0.00025 |
| **Cache Hit Rate** | ≥60% | `cached_hits / total_gemini_calls` |
| **Precisão Gemini** | ≥90% | Validação manual de 50 anotações |

---

## **🚨 RISCOS E MITIGAÇÕES**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Gemini retorna JSON inválido** | Média (30%) | Alto | Retry com prompt refinado, fallback para UNKNOWN |
| **Custo API > orçamento** | Baixa (10%) | Alto | Cache agressivo (60%+ hit rate), batch processing |
| **Latência >1s** | Média (20%) | Médio | Timeout 10s, processar apenas tokens críticos |
| **Quota Gemini excedida** | Baixa (5%) | Médio | Monitorar uso diário, fallback graceful |
| **Precisão Gemini <90%** | Média (25%) | Médio | Few-shot examples + validação humana |

---

## **📅 TIMELINE DETALHADO**

| Fase | Tarefa | Duração | Bloqueador? |
|------|--------|---------|-------------|
| 3.1.1 | Criar `gemini-pos-annotator.ts` | 1h 30min | Não |
| 3.1.2 | Testar Gemini API standalone | 30min | Sim (validar resposta) |
| 3.2.1 | Integrar Layer 3 no pipeline | 45min | Não |
| 3.2.2 | Ajustar ordem de fallback | 15min | Não |
| 3.3.1 | UI updates (badges, stats) | 45min | Não |
| 3.3.2 | Adicionar filtro por fonte | 15min | Não |
| 3.4.1 | Criar tabela de cache | 20min | Não |
| 3.4.2 | Implementar lógica de cache | 40min | Não |
| 3.5.1 | Criar tabela de API usage | 15min | Não |
| 3.5.2 | Dashboard de custos | 15min | Não |
| **TOTAL SPRINT 3** | | **5h 30min** | |

---

## **✅ CHECKLIST DE APROVAÇÃO - SPRINT 3**

Antes de considerar Sprint 3 completo:
- [ ] Gemini Flash anotando corretamente tokens unknown
- [ ] Cobertura final ≥ 95% em corpus de teste
- [ ] Latência Layer 3 < 500ms
- [ ] Cache funcionando (hit rate > 60%)
- [ ] Custo por canção < $0.005
- [ ] Zero crashes com Gemini timeout/erro
- [ ] Dashboard mostrando custos e estatísticas
- [ ] Validação manual: 50 anotações Gemini com ≥90% precisão
- [ ] Documentação atualizada

---

## **🎯 RESULTADO ESPERADO (Fim do Sprint 3)**

```typescript
// EXEMPLO DE OUTPUT FINAL:

{
  "success": true,
  "annotations": [
    { "palavra": "estava", "lema": "estar", "pos": "AUX", "source": "va_grammar", "confianca": 1.0 },
    { "palavra": "caminhando", "lema": "caminhar", "pos": "VERB", "source": "spacy", "confianca": 0.85 },
    { "palavra": "tuitou", "lema": "tuitar", "pos": "VERB", "source": "gemini", "confianca": 0.90 }
  ],
  "stats": {
    "totalTokens": 100,
    "coveredByVA": 75,
    "coverageRate": 98.5, // ⬆️ Aumentou de ~90% para ~98%
    "unknownWords": ["xpto123"], // ⬇️ Reduziu para ~1-2%
    "sourceDistribution": {
      "va_grammar": 75,
      "spacy": 15,
      "gemini": 9,
      "cache": 1
    }
  },
  "performance": {
    "layer1Time": 50,
    "layer2Time": 200,
    "layer3Time": 450,
    "totalTime": 700 // ⬆️ Aumentou, mas cobertura compensou
  },
  "costs": {
    "gemini_tokens_used": 180,
    "estimated_cost_usd": 0.000045 // <$0.0001 por canção
  }
}
```

---

## **📚 PRÓXIMOS SPRINTS (PÓS-LAYER 3)**

### **Sprint 4: Dashboard de Monitoramento POS**
- Gráficos históricos de cobertura
- Análise de palavras problemáticas
- Ranking de precisão por fonte
- Export de relatórios

### **Sprint 5: Feedback Loop Humano**
- Interface para corrigir anotações incorretas
- Sistema de votação (upvote/downvote)
- Atualização automática de rankings
- Fine-tuning de prompts Gemini baseado em correções

### **Sprint 6: Otimização e Produção**
- Batch processing paralelo (100 canções/vez)
- Vector search para contextos similares
- Cost tracking em tempo real
- Alertas de quota/custo
- Documentação completa

---

## **💰 ESTIMATIVA DE CUSTOS (Layer 3 - Gemini Flash)**

### **Modelo de Precificação:**
- **Input:** $0.00025 / 1k tokens
- **Output:** $0.00025 / 1k tokens (mesmo preço Flash)

### **Exemplo de Canção (200 palavras):**
- Layer 1+2 cobrem: 180 palavras (90%)
- Layer 3 processa: 20 palavras desconhecidas
- Tokens médios por palavra: ~30 tokens (input + output)
- **Custo por canção:** 20 × 30 × $0.00025 / 1000 = **$0.00015**

### **Corpus Completo (30k canções):**
- **Custo total estimado:** 30,000 × $0.00015 = **$4.50**
- Com cache 60% hit rate: **$1.80**

### **Conclusão:** Extremamente acessível para MVP! 🎉

---

## **🔗 RECURSOS**

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Few-shot Learning Best Practices](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [Universal POS Tags](https://universaldependencies.org/u/pos/)

---

**STATUS:** 📋 PRONTO PARA IMPLEMENTAÇÃO  
**PRIORIDADE:** 🟡 MÉDIA (após validar Layer 1+2 em corpus real)  
**OWNER:** Backend Team

---

*Documento criado: 2025-11-25*  
*Última atualização: Sprint 2 completo*
