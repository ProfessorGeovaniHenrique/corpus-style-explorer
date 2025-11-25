# 🔬 PASSO A PASSO: Implementação Sistema POS Híbrido (Layer 1 - VA Grammar)

## ✅ CONCLUÍDO (Layer 1 - Fundação)

### 1. Arquivos Criados
- ✅ `src/data/grammatical-knowledge/gaucho-mwe.ts` - Templates de MWEs gaúchas
- ✅ `src/services/posAnnotationCache.ts` - Sistema de cache inteligente
- ✅ `src/services/hybridPOSAnnotator.ts` - Anotador híbrido Layer 1

### 2. Documentação Atualizada
- ✅ `src/data/developer-logs/usas-methodology.ts` - Proposta VA com hybridPOSSystem

---

## 🚀 PRÓXIMOS PASSOS (Integração Backend)

### Sprint 1: Integrar Layer 1 no Edge Function (2h)

**Arquivo:** `supabase/functions/annotate-pos/index.ts`

#### Passo 1.1: Importar módulos VA Grammar
```typescript
// Adicionar no topo do arquivo (após imports existentes)
import { detectGauchoMWEs } from '../_shared/gaucho-mwe.ts';
import { annotateWithVAGrammar } from '../_shared/hybrid-pos-annotator.ts';
```

#### Passo 1.2: Copiar arquivos para _shared
```bash
# Copiar lógica para edge function context
cp src/data/grammatical-knowledge/gaucho-mwe.ts supabase/functions/_shared/
cp src/services/hybridPOSAnnotator.ts supabase/functions/_shared/
cp src/data/grammatical-knowledge/verbal-morphology.ts supabase/functions/_shared/
cp src/data/grammatical-knowledge/pronoun-system.ts supabase/functions/_shared/
```

#### Passo 1.3: Modificar processText() para usar VA Grammar
```typescript
// Substituir lógica atual por:
async function processText(texto: string) {
  // Layer 1: VA Grammar (prioridade)
  const vaAnnotated = await annotateWithVAGrammar(texto);
  
  // Filtrar tokens desconhecidos (confidence < 0.8)
  const unknownTokens = vaAnnotated.filter(t => t.confidence < 0.8);
  
  logger.info(`Layer 1 (VA Grammar): ${vaAnnotated.length - unknownTokens.length}/${vaAnnotated.length} tokens (${((1 - unknownTokens.length / vaAnnotated.length) * 100).toFixed(1)}% cobertura)`);
  
  // TODO Sprint 2: Processar unknownTokens com Layer 2 (spaCy) ou Layer 3 (Gemini)
  // Por enquanto, retornar apenas Layer 1
  
  return vaAnnotated.map(t => ({
    palavra: t.palavra,
    lema: t.lema,
    pos: t.pos,
    posDetalhada: t.posDetalhada,
    features: t.features,
    posicao: t.posicao,
  }));
}
```

#### Passo 1.4: Adicionar endpoint de estatísticas
```typescript
// Adicionar rota GET /stats para monitorar cobertura
if (req.method === 'GET' && url.pathname.endsWith('/stats')) {
  // Retornar estatísticas do cache
  const stats = getCacheStatistics();
  return new Response(JSON.stringify(stats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

### Sprint 2: Adicionar Layer 2 - spaCy Fallback (4h)

#### Opção A: Microserviço Python separado
```python
# supabase/functions/spacy-service/main.py
from fastapi import FastAPI
import spacy

nlp = spacy.load("pt_core_news_lg")
app = FastAPI()

@app.post("/annotate")
async def annotate(text: str):
    doc = nlp(text)
    return [{"palavra": token.text, "lema": token.lemma_, "pos": token.pos_} for token in doc]
```

#### Opção B: stanza-js (TypeScript nativo)
```typescript
// Instalar: npm install stanza-js
import { Pipeline } from 'stanza-js';

const pipeline = new Pipeline('pt');
const result = await pipeline.process(texto);
```

#### Passo 2.2: Integrar no processText()
```typescript
// Layer 2: spaCy/Stanza para tokens desconhecidos
if (unknownTokens.length > 0) {
  const spacyResults = await callSpaCyService(unknownTokens);
  // Merge com vaAnnotated
}
```

---

### Sprint 3: Adicionar Layer 3 - Gemini AI Fallback (2h)

#### Passo 3.1: Criar prompt de POS tagging
```typescript
const promptPOSTagging = `Você é um linguista especializado em português brasileiro.

Analise a palavra "${palavra}" no contexto:
"${leftContext} **${palavra}** ${rightContext}"

Retorne:
1. POS tag (NOUN, VERB, ADJ, ADV, etc.)
2. Lema (forma canônica)
3. Features morfológicas (tempo, número, pessoa, gênero)

Formato JSON: {"pos": "VERB", "lema": "correr", "features": {"tempo": "Pres", "pessoa": "3"}}`;
```

#### Passo 3.2: Integrar no processText()
```typescript
// Layer 3: Gemini para casos com baixa confiança
if (token.confidence < 0.6) {
  const geminiResult = await callGeminiPOSTagging(token, context);
  // Sobrescrever resultado
}
```

---

## 📊 Métricas de Sucesso

### Layer 1 Esperado
- Cobertura: **70-80%** dos tokens (palavras funcionais + verbos comuns)
- Precisão: **98%+** (gramática explícita)
- Custo: **$0** (zero API calls)
- Velocidade: **<100ms** por música

### Pipeline Completo Esperado
- Cobertura: **95%+** dos tokens
- Precisão: **93%+** (combinado)
- Custo: **<$0.001** por música (cache reduz 70% calls)
- Velocidade: **<1s** por música

---

## 🧪 Como Testar

### Teste 1: Verificar Layer 1 Coverage
```typescript
const texto = "A calma do tarumã ganhou sombra mais copada";
const result = await annotateWithVAGrammar(texto);
const coverage = calculateVAGrammarCoverage(result);

console.log(`Cobertura Layer 1: ${coverage.coverageRate}%`);
console.log(`Palavras desconhecidas: ${coverage.unknownWords.join(', ')}`);
```

### Teste 2: Validar MWE Detection
```typescript
const texto = "Cevou um mate amargo no galpão";
const mwes = detectGauchoMWEs(texto);

// Esperado: [{text: "mate amargo", pos: "NOUN_COMPOUND"}]
```

### Teste 3: Verificar Cache
```typescript
// Anotar mesma frase 2x
const result1 = await annotateWithVAGrammar(texto);
const result2 = await annotateWithVAGrammar(texto);

// result2 deve usar cache (source: 'cache')
const cacheStats = getCacheStatistics();
console.log(`Cache hit rate: ${cacheStats.hitRate}`);
```

---

## ⚠️ Próximas Decisões Críticas

1. **spaCy vs. Skip para Gemini?**
   - spaCy adiciona complexidade (Python microservice)
   - Gemini pode cobrir Layer 2+3 simultaneamente
   - **Recomendação:** Testar Layer 1+3 primeiro, adicionar spaCy só se Gemini custar muito

2. **Cache em IndexedDB?**
   - Atualmente: memória (perde ao recarregar)
   - Migração simples para persistência local
   - **Recomendação:** Implementar após Sprint 1

3. **Supabase cache table?**
   - Compartilhar cache entre usuários
   - Requer schema migration
   - **Recomendação:** Sprint 4 (otimização)
