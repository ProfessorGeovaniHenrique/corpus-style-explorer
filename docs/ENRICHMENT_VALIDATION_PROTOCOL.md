# 🧪 Enrichment Validation Protocol

## Objetivo

Este documento descreve o protocolo de validação obrigatório para o pipeline de enrichment (metadata, YouTube, biography). Garante que todos os dados persistem corretamente no banco de dados e que a UI atualiza adequadamente.

---

## Fluxo de Validação Obrigatório

### ✅ Para QUALQUER mudança no enrichment pipeline:

1. **Persistência no Banco**
   - ✅ Dados salvos na tabela correta (songs/artists)
   - ✅ Timestamp `updated_at` atualizado
   - ✅ Campos enriquecidos não-null

2. **Resposta da Edge Function**
   - ✅ `success: true` retornado
   - ✅ Dados enriquecidos presentes no response body
   - ✅ Confidence score calculado

3. **UI Re-render**
   - ✅ Componente React re-consulta banco após enrichment
   - ✅ Novos dados exibidos na UI
   - ✅ Loading states corretos

4. **Error Handling**
   - ✅ Erros de API capturados
   - ✅ Toast notifications apropriadas
   - ✅ Status da música revertido em caso de falha

---

## Testes Automatizados

### Script: `src/tests/enrichment-validation.test.ts`

Executa 4 testes end-to-end:

#### **Test 1: Metadata Enrichment Persistence**
```typescript
testMetadataEnrichment(songId) 
```
- Chama `enrich-music-data` com `mode: 'metadata-only'`
- Verifica se `composer` e `release_year` persistem no banco
- Valida que `status` muda para 'enriched'
- Confirma que `confidence_score` aumenta

#### **Test 2: YouTube Enrichment Persistence**
```typescript
testYouTubeEnrichment(songId)
```
- Chama `enrich-music-data` com `mode: 'youtube-only'`
- Verifica se `youtube_url` persiste no banco
- Valida formato da URL (https://www.youtube.com/watch?v=...)
- Confirma que response contém `youtubeVideoId`

#### **Test 3: Biography Enrichment Persistence**
```typescript
testBiographyEnrichment(artistId)
```
- Chama `generate-artist-bio` edge function
- Verifica se `biography` persiste na tabela `artists`
- Valida que `biography_source` é registrado
- Confirma que `biography_updated_at` é atualizado

#### **Test 4: UI Update After Enrichment**
```typescript
testUIUpdateAfterEnrichment(songId)
```
- Simula fluxo completo: query antes → enrich → query depois
- Verifica se os dados mudaram entre as queries
- Valida que componente React veria dados atualizados
- Confirma que `updated_at` mudou (trigger para re-render)

---

## Como Executar

### Opção 1: Via UI Component (Recomendado)

1. Adicione o componente em qualquer página:
```tsx
import { EnrichmentValidationPanel } from '@/components/EnrichmentValidationPanel';

// ...

<EnrichmentValidationPanel />
```

2. **Quick Check**: Clique no botão para verificar estado atual (não modifica dados)

3. **Full Suite**: 
   - Cole um `songId` de teste
   - Cole um `artistId` de teste
   - Clique "Executar Todos os Testes"
   - Aguarde ~15-20 segundos
   - Veja resultados detalhados

### Opção 2: Via Console (Para Debug)

```javascript
import { runAllEnrichmentValidations, quickEnrichmentStatusCheck } from '@/tests/enrichment-validation.test';

// Quick check (não modifica dados)
await quickEnrichmentStatusCheck();

// Full validation (faz chamadas reais às APIs)
const results = await runAllEnrichmentValidations(
  'UUID-DA-MUSICA-AQUI',
  'UUID-DO-ARTISTA-AQUI'
);

console.table(results);
```

---

## Interpretação dos Resultados

### ✅ Teste PASSOU (Green Badge)
- Dados persistiram corretamente no banco
- Edge function retornou sucesso
- Dados visíveis após re-query
- ✅ **Pipeline está funcionando**

### ❌ Teste FALHOU (Red Badge)
Possíveis causas:

#### 1. **Edge function retornou erro**
   - Verificar logs da edge function
   - Validar API keys (YOUTUBE_API_KEY, GEMINI_API_KEY, LOVABLE_API_KEY)
   - Checar quotas das APIs

#### 2. **Dados não persistiram**
   - Edge function pode ter retornado sucesso mas não salvou no banco
   - Verificar SQL UPDATE na edge function
   - Checar RLS policies da tabela

#### 3. **UI não atualizaria**
   - Timestamp `updated_at` não mudou
   - Componente React não está re-consultando banco após enrichment
   - Missing `reload()` call após enrichment

---

## Checklist de Validação Manual

Antes de marcar qualquer feature de enrichment como "completa":

- [ ] **Persistência confirmada**: Query direta ao banco mostra dados salvos
- [ ] **Response validado**: Edge function response contém os dados enriquecidos
- [ ] **UI atualizada**: Componente React mostra os novos dados após enrichment
- [ ] **Erros tratados**: Falhas de API geram toast notifications apropriadas
- [ ] **Loading states**: Spinners/loaders exibidos durante processamento
- [ ] **Rate limiting**: Batch enrichment respeita 1 req/segundo

---

## Dados de Teste Sugeridos

### Songs com diferentes estados:

```sql
-- Música pendente (sem enrichment)
SELECT id, title, artist_id FROM songs WHERE status = 'pending' LIMIT 1;

-- Música parcialmente enriquecida (só metadata)
SELECT id, title, artist_id FROM songs 
WHERE status = 'enriched' AND youtube_url IS NULL LIMIT 1;

-- Música completamente enriquecida
SELECT id, title, artist_id FROM songs 
WHERE status = 'enriched' AND youtube_url IS NOT NULL LIMIT 1;
```

### Artists para biografia:

```sql
-- Artista sem biografia
SELECT id, name FROM artists WHERE biography IS NULL LIMIT 1;

-- Artista com biografia existente (para testar atualização)
SELECT id, name FROM artists WHERE biography IS NOT NULL LIMIT 1;
```

---

## Problemas Conhecidos (Identificados)

### ❌ YouTube Enrichment
**Sintoma:** Todas as músicas têm `youtube_url: null` após enrichment  
**Status:** Investigação pendente  
**Possíveis causas:**
- API key do YouTube não configurada
- Quota do YouTube API esgotada
- Edge function não está salvando youtube_url mesmo quando encontra videoId
- Formato do URL incorreto

### ⚠️ Biography Source
**Sintoma:** Biografias mostram mensagem de fallback "(Fonte: Base de Conhecimento Digital)"  
**Status:** Funcional mas genérico  
**Causa:** Biografias sendo geradas por AI quando Wikipedia não encontra artista  
**Solução futura:** Expandir fontes de biografia (MusicBrainz, Last.fm API)

---

## Próximos Passos

1. ✅ Executar Quick Check para baseline do estado atual
2. ✅ Executar Full Suite com 3-5 músicas de teste
3. ✅ Documentar todos os resultados
4. ✅ Corrigir falhas identificadas (priorizar YouTube)
5. ✅ Re-executar testes após correções
6. ✅ Marcar pipeline como "validado" apenas após 100% dos testes passarem

---

## Contato

Para dúvidas sobre este protocolo ou para reportar novos bugs no enrichment:
- Consulte `memories` do projeto
- Busque por `enrichment-data-flow-verification-protocol`
- Revise PRD: História 8 (Concordância KWIC) e Épico 5 (YouTube links)
