# 🤖 Script de Enriquecimento Automatizado de Corpus

## Uso Rápido

```bash
# Enriquecer corpus gaúcho
bun run scripts/enrich-corpus.ts gaucho

# Enriquecer corpus nordestino
bun run scripts/enrich-corpus.ts nordestino
```

## O que o script faz?

1. **Carrega** o corpus completo do arquivo `public/corpus/full-text/`
2. **Identifica** músicas sem compositor/álbum/artista
3. **Processa** todas automaticamente usando MusicBrainz + Lovable AI
4. **Auto-valida** resultados com confiança >= 85%
5. **Salva** músicas com confiança < 85% em CSV de revisão
6. **Gera** corpus atualizado automaticamente
7. **Cria** backup antes de sobrescrever

## Features

✅ **Zero interação manual** para alta confiança  
✅ **Processamento em batch** com rate limiting  
✅ **Backup automático** antes de cada atualização  
✅ **CSV de revisão** para casos duvidosos  
✅ **Logs detalhados** no terminal  

## Configuração

O script usa as seguintes constantes (editáveis em `scripts/enrich-corpus.ts`):

```typescript
const CONFIG = {
  AUTO_VALIDATE_THRESHOLD: 85,  // Confiança mínima para auto-validação
  BATCH_SIZE: 10,                // Músicas por lote
  RATE_LIMIT_DELAY: 1200,        // ms entre requests (50/min)
};
```

## Estrutura de Diretórios

Após execução, o script cria:

```
scripts/
├── enrich-corpus.ts       # Script principal
├── backups/               # Backups automáticos
│   └── gaucho-backup-2025-11-19T19-30-00.txt
└── review/                # CSVs de revisão
    └── gaucho-review.csv
```

## CSV de Revisão

Contém músicas que precisam de validação manual (confiança < 85%):

| Coluna | Descrição |
|--------|-----------|
| Artista Original | Nome do artista no corpus original |
| Música | Nome da música |
| Compositor Sugerido | Compositor encontrado pela IA |
| Confiança (%) | Nível de confiança do enriquecimento |
| Detalhes | Informações adicionais |

## Fluxo Completo

```
1. Carregar corpus
   ↓
2. Parsear músicas (1.247 encontradas)
   ↓
3. Identificar músicas sem metadados (847 precisam enriquecimento)
   ↓
4. Processar em lotes de 10
   ├─ Rate limit: 1200ms entre requests
   ├─ Auto-validar confiança >= 85%
   └─ Marcar confiança < 85% para revisão
   ↓
5. Estatísticas finais
   ├─ 780 auto-validadas
   └─ 67 para revisão
   ↓
6. Gerar CSV de revisão (scripts/review/gaucho-review.csv)
   ↓
7. Criar backup (scripts/backups/gaucho-backup-2025-11-19.txt)
   ↓
8. Sobrescrever corpus atualizado
   ↓
9. ✅ Concluído!
```

## Exemplo de Saída

```
🚀 ════════════════════════════════════════════════════════
   ENRIQUECIMENTO AUTOMATIZADO: GAUCHO
════════════════════════════════════════════════════════

📂 Carregando: public/corpus/full-text/gaucho-completo.txt
📚 Parsing gaucho corpus: 1247 blocos encontrados

📊 ESTATÍSTICAS INICIAIS
   Total de músicas: 1247
   Precisam enriquecimento: 847
   Já completas: 400

⚙️  PROCESSANDO EM LOTES

📦 Lote 1/85 (10 músicas)
   🎵 Adair de Freitas - Ausência... ✅ 100% (auto-validada)
   🎵 Adair de Freitas - Bailanta e Carpeta... ✅ 95% (auto-validada)
   ...

📊 RESULTADOS FINAIS
   ✅ Auto-validadas: 780
   ⚠️  Para revisão: 67
   ❌ Erros: 0

📄 CSV de revisão salvo: scripts/review/gaucho-review.csv

🔧 GERANDO CORPUS ATUALIZADO
💾 Backup criado: scripts/backups/gaucho-backup-2025-11-19T19-30-00.txt
✅ Corpus atualizado: public/corpus/full-text/gaucho-completo.txt

════════════════════════════════════════════════════════
🎉 ENRIQUECIMENTO CONCLUÍDO!
   📈 780 músicas atualizadas automaticamente
   📋 67 músicas aguardam revisão manual
════════════════════════════════════════════════════════
```

## Rollback

Se algo der errado, restaure o backup:

```bash
# Listar backups
ls scripts/backups/

# Restaurar backup
cp scripts/backups/gaucho-backup-2025-11-19T19-30-00.txt public/corpus/full-text/gaucho-completo.txt
```

## Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
- Certifique-se que `.env` contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`

### Erro: "Rate limit exceeded"
- Aumente `RATE_LIMIT_DELAY` no script (ex: 2000ms)

### Erro: "Arquivo não encontrado"
- Verifique que o corpus existe em `public/corpus/full-text/`

## Próximos Passos

Após executar o script:

1. **Revisar CSV** (`scripts/review/gaucho-review.csv`)
2. **Validar manualmente** casos duvidosos (opcional, usando interface web)
3. **Executar para o outro corpus** (nordestino)
4. **Commit** das mudanças no corpus
