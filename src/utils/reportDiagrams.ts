/**
 * 📊 DIAGRAMAS TEXTUAIS PARA RELATÓRIO ABNT
 * Representações ASCII/Unicode de pipelines e fluxos
 */

import { Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

const ABNT_CONFIG = {
  font: 'Courier New',
  fontSize: 18, // 9pt para diagramas
  lineSpacing: 240, // Espaçamento simples
};

/**
 * Cria parágrafo de código/diagrama
 */
function createDiagramParagraph(text: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: ABNT_CONFIG.lineSpacing, after: 0 },
    children: [
      new TextRun({
        text,
        font: ABNT_CONFIG.font,
        size: ABNT_CONFIG.fontSize,
      }),
    ],
  });
}

/**
 * Cria legenda de figura (NBR 14724)
 */
function createFigureCaption(number: number, title: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 400 },
    children: [
      new TextRun({
        text: `Figura ${number} - ${title}`,
        font: 'Times New Roman',
        size: 20, // 10pt
        bold: true,
      }),
    ],
  });
}

/**
 * Cria fonte da figura
 */
function createFigureSource() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 400 },
    children: [
      new TextRun({
        text: 'Fonte: Elaborado pelo autor (2025).',
        font: 'Times New Roman',
        size: 20,
      }),
    ],
  });
}

/**
 * DIAGRAMA 1: Pipeline POS Tagging (3 camadas)
 */
export function createPOSPipelineDiagram(): Paragraph[] {
  return [
    createFigureCaption(1, 'Pipeline de Anotação Morfossintática (POS) - 3 Camadas'),
    createDiagramParagraph('┌─────────────────────────────────────────────────────────────────┐'),
    createDiagramParagraph('│                    PIPELINE POS - 3 CAMADAS                     │'),
    createDiagramParagraph('├─────────────────────────────────────────────────────────────────┤'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │   ENTRADA       │  Tokenização → Normalização → Contexto    │'),
    createDiagramParagraph('│  │   (Texto)       │                                            │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  • 57 verbos irregulares conjugados        │'),
    createDiagramParagraph('│  │ CAMADA 1        │  • 7 verbos regionais gaúchos              │'),
    createDiagramParagraph('│  │ VA Grammar      │  • Pronomes, determinantes, preposições   │'),
    createDiagramParagraph('│  │ (Zero Custo)    │  • 15 templates MWE (expressões multi.)   │'),
    createDiagramParagraph('│  │ Cobertura: 85%  │                                            │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Não encontrado?                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  • spaCy pt_core_news_lg                   │'),
    createDiagramParagraph('│  │ CAMADA 2        │  • Modelo estatístico português           │'),
    createDiagramParagraph('│  │ spaCy           │  • Treinado em corpus jornalístico        │'),
    createDiagramParagraph('│  │ (Fallback)      │  • Latência: ~10ms/token                  │'),
    createDiagramParagraph('│  │ Cobertura: +10% │                                            │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Confiança < 80%?                                    │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  • Gemini Flash via Lovable AI Gateway     │'),
    createDiagramParagraph('│  │ CAMADA 3        │  • Batch de 15 palavras por request       │'),
    createDiagramParagraph('│  │ Gemini Flash    │  • Contexto bilateral (±2 palavras)       │'),
    createDiagramParagraph('│  │ (LLM Final)     │  • Cache persistente por contexto_hash    │'),
    createDiagramParagraph('│  │ Cobertura: +5%  │                                            │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │    SAÍDA        │  {palavra, pos, lema, confianca, fonte}   │'),
    createDiagramParagraph('│  │ (Token Anotado) │                                            │'),
    createDiagramParagraph('│  └─────────────────┘                                            │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  Precisão Final: 98%  │  Redução de API Calls: 85%              │'),
    createDiagramParagraph('└─────────────────────────────────────────────────────────────────┘'),
    createFigureSource(),
  ];
}

/**
 * DIAGRAMA 2: Pipeline Semântico (6 níveis de lookup)
 */
export function createSemanticPipelineDiagram(): Paragraph[] {
  return [
    createFigureCaption(2, 'Pipeline de Anotação Semântica - 6 Níveis de Lookup'),
    createDiagramParagraph('┌─────────────────────────────────────────────────────────────────┐'),
    createDiagramParagraph('│              PIPELINE SEMÂNTICO - 6 NÍVEIS DE LOOKUP            │'),
    createDiagramParagraph('├─────────────────────────────────────────────────────────────────┤'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  ENTRADA: palavra + contexto + POS                              │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │ NÍVEL 1         │  Palavras já classificadas                │'),
    createDiagramParagraph('│  │ Cache Semântico │  PostgreSQL: semantic_disambiguation_cache │'),
    createDiagramParagraph('│  │ ~16.000 entries │  Latência: ~5ms                           │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Miss?                                               │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │ NÍVEL 2         │  Léxico dialectal gaúcho                  │'),
    createDiagramParagraph('│  │ Dialectal       │  Nunes & Nunes, Rocha Pombo               │'),
    createDiagramParagraph('│  │ ~4.500 verbetes │  Com categorias temáticas pré-mapeadas    │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Miss?                                               │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │ NÍVEL 3         │  Propagação por sinonímia                 │'),
    createDiagramParagraph('│  │ Sinônimos       │  "galpão" → "rancho" herda domínio        │'),
    createDiagramParagraph('│  │ Rocha Pombo     │  Confiança reduzida: 0.85                 │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Miss?                                               │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │ NÍVEL 4         │  Dicionário português geral               │'),
    createDiagramParagraph('│  │ Gutenberg       │  64.392 verbetes com classe gramatical    │'),
    createDiagramParagraph('│  │ (POS → Domain)  │  Mapeamento POS → domínio genérico        │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Miss?                                               │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │ NÍVEL 5         │  Sufixos e prefixos produtivos            │'),
    createDiagramParagraph('│  │ Regras Morfol.  │  -eiro → Profissão, -mente → Modo         │'),
    createDiagramParagraph('│  │ (700+ regras)   │  Confiança: 0.75                          │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │ Miss?                                               │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐                                            │'),
    createDiagramParagraph('│  │ NÍVEL 6         │  Classificação contextual por LLM         │'),
    createDiagramParagraph('│  │ Gemini Flash    │  Prompt com taxonomia hierárquica         │'),
    createDiagramParagraph('│  │ (LLM Final)     │  Batch de 15 palavras, cache resultado    │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  SAÍDA: {tagset_n1, n2, n3, n4, confianca, fonte, prosody}     │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  Cobertura: 92%  │  Redução API: 70%  │  Precisão: 94%         │'),
    createDiagramParagraph('└─────────────────────────────────────────────────────────────────┘'),
    createFigureSource(),
  ];
}

/**
 * DIAGRAMA 3: Fluxo MVP Didático (2 etapas)
 */
export function createMVPFlowDiagram(): Paragraph[] {
  return [
    createFigureCaption(3, 'Fluxo da Atividade Didática MVP - 2 Etapas'),
    createDiagramParagraph('┌─────────────────────────────────────────────────────────────────┐'),
    createDiagramParagraph('│           ATIVIDADE DIDÁTICA MVP - FLUXO COMPLETO               │'),
    createDiagramParagraph('├─────────────────────────────────────────────────────────────────┤'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  ══════════════════════════════════════════════════════════════ │'),
    createDiagramParagraph('│  ETAPA 1: LETRAMENTO LITEROMUSICAL (7 abas sequenciais)         │'),
    createDiagramParagraph('│  ══════════════════════════════════════════════════════════════ │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  [1] Introdução ────► [2] Chamamé ────► [3] Origens            │'),
    createDiagramParagraph('│      │                    │                  │                  │'),
    createDiagramParagraph('│      │ Desbloqueio        │ Desbloqueio      │ Desbloqueio     │'),
    createDiagramParagraph('│      │ progressivo        │ progressivo      │ progressivo     │'),
    createDiagramParagraph('│      ▼                    ▼                  ▼                  │'),
    createDiagramParagraph('│  ┌─────────┐         ┌─────────┐        ┌─────────┐            │'),
    createDiagramParagraph('│  │ Contexto│         │ Gênero  │        │ História│            │'),
    createDiagramParagraph('│  │ cultural│         │ musical │        │ e raízes│            │'),
    createDiagramParagraph('│  │ gaúcho  │         │ chamamé │        │ platinas│            │'),
    createDiagramParagraph('│  └─────────┘         └─────────┘        └─────────┘            │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  [4] Instrumentos ────► [5] Glossário ────► [6] Escuta        │'),
    createDiagramParagraph('│      │                      │                    │              │'),
    createDiagramParagraph('│      ▼                      ▼                    ▼              │'),
    createDiagramParagraph('│  ┌─────────┐           ┌─────────┐          ┌─────────┐        │'),
    createDiagramParagraph('│  │Acordeão │           │ Termos  │          │ YouTube │        │'),
    createDiagramParagraph('│  │Violão   │           │regionais│          │ embed   │        │'),
    createDiagramParagraph('│  │Gaita    │           │gauchescos│         │ player  │        │'),
    createDiagramParagraph('│  └─────────┘           └─────────┘          └─────────┘        │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  [7] Quiz Interpretativo                                        │'),
    createDiagramParagraph('│      │                                                          │'),
    createDiagramParagraph('│      ▼                                                          │'),
    createDiagramParagraph('│  ┌─────────────────────────────────────────┐                    │'),
    createDiagramParagraph('│  │ • 5 perguntas aleatórias (30 no banco)  │                    │'),
    createDiagramParagraph('│  │ • 3 tipos: objetiva, checkbox, matching │                    │'),
    createDiagramParagraph('│  │ • Threshold: 70% para conquista         │                    │'),
    createDiagramParagraph('│  │ • Conquista: "Chamamecero" 🎸           │                    │'),
    createDiagramParagraph('│  └─────────────────────────────────────────┘                    │'),
    createDiagramParagraph('│                         │                                       │'),
    createDiagramParagraph('│                         │ ≥70%? Transição gamificada           │'),
    createDiagramParagraph('│                         ▼                                       │'),
    createDiagramParagraph('│  ══════════════════════════════════════════════════════════════ │'),
    createDiagramParagraph('│  ETAPA 2: ANÁLISE CIENTÍFICA (5 abas de ferramentas)            │'),
    createDiagramParagraph('│  ══════════════════════════════════════════════════════════════ │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  [1] Processamento ──► [2] Domínios ──► [3] Estatísticas       │'),
    createDiagramParagraph('│      │                     │                  │                 │'),
    createDiagramParagraph('│      ▼                     ▼                  ▼                 │'),
    createDiagramParagraph('│  ┌─────────┐          ┌─────────┐        ┌─────────┐           │'),
    createDiagramParagraph('│  │Seleção  │          │Nuvem de │        │Log-Like │           │'),
    createDiagramParagraph('│  │corpus   │          │domínios │        │Keywords │           │'),
    createDiagramParagraph('│  │referênc.│          │semântic.│        │TTR/MLU  │           │'),
    createDiagramParagraph('│  └─────────┘          └─────────┘        └─────────┘           │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  [4] Visualizações ──────► [5] Exportação                      │'),
    createDiagramParagraph('│      │                          │                               │'),
    createDiagramParagraph('│      ▼                          ▼                               │'),
    createDiagramParagraph('│  ┌─────────┐               ┌─────────┐                          │'),
    createDiagramParagraph('│  │Gráficos │               │CSV/PNG  │                          │'),
    createDiagramParagraph('│  │interativ│               │DOCX/PDF │                          │'),
    createDiagramParagraph('│  │Filtros  │               │ABNT     │                          │'),
    createDiagramParagraph('│  └─────────┘               └─────────┘                          │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('└─────────────────────────────────────────────────────────────────┘'),
    createFigureSource(),
  ];
}

/**
 * DIAGRAMA 4: Pipeline de Enriquecimento (5 camadas)
 */
export function createEnrichmentPipelineDiagram(): Paragraph[] {
  return [
    createFigureCaption(4, 'Pipeline de Enriquecimento de Metadados - 5 Camadas'),
    createDiagramParagraph('┌─────────────────────────────────────────────────────────────────┐'),
    createDiagramParagraph('│            PIPELINE DE ENRIQUECIMENTO - 5 CAMADAS               │'),
    createDiagramParagraph('├─────────────────────────────────────────────────────────────────┤'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  ENTRADA: {título, artista, youtube_url}                        │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  Regex na descrição do vídeo               │'),
    createDiagramParagraph('│  │ CAMADA 1        │  Padrões: "Compositor:", "Autor:",        │'),
    createDiagramParagraph('│  │ YouTube API     │  "℗", "(p)" para ano                       │'),
    createDiagramParagraph('│  │                 │  Limite: 2000 chars descrição              │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  GPT-5 via Lovable AI Gateway              │'),
    createDiagramParagraph('│  │ CAMADA 2        │  Consulta base de conhecimento             │'),
    createDiagramParagraph('│  │ GPT-5 Knowledge │  max_completion_tokens: 800                │'),
    createDiagramParagraph('│  │                 │  Fallback para Gemini se vazio             │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  Gemini com googleSearch tool              │'),
    createDiagramParagraph('│  │ CAMADA 3        │  Busca web em tempo real                   │'),
    createDiagramParagraph('│  │ Google Search   │  Retorna fontes verificáveis               │'),
    createDiagramParagraph('│  │ Grounding       │                                            │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  Compara respostas das camadas             │'),
    createDiagramParagraph('│  │ CAMADA 4        │  2+ fontes concordam → 90%+ confiança      │'),
    createDiagramParagraph('│  │ Cross-Validation│  1 fonte apenas → 50-70% confiança         │'),
    createDiagramParagraph('│  │ Engine          │  Conflito → marcado para revisão           │'),
    createDiagramParagraph('│  └────────┬────────┘                                            │'),
    createDiagramParagraph('│           │                                                     │'),
    createDiagramParagraph('│           ▼                                                     │'),
    createDiagramParagraph('│  ┌─────────────────┐  Salva com rastreabilidade                 │'),
    createDiagramParagraph('│  │ CAMADA 5        │  enrichment_source: array de fontes        │'),
    createDiagramParagraph('│  │ Persistence     │  enrichment_confidence: 0-100              │'),
    createDiagramParagraph('│  │                 │  enriched_at: timestamp                    │'),
    createDiagramParagraph('│  └─────────────────┘                                            │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('│  SAÍDA: {compositor, ano, álbum, confiança, fontes[]}          │'),
    createDiagramParagraph('│                                                                 │'),
    createDiagramParagraph('└─────────────────────────────────────────────────────────────────┘'),
    createFigureSource(),
  ];
}

/**
 * Cria tabela de domínios semânticos para o relatório
 */
export function createSemanticDomainsTable(domains: Array<{codigo: string; nome: string; descricao: string | null; nivel_profundidade: number}>): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Código', bold: true, font: 'Times New Roman', size: 20 })] })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Nome', bold: true, font: 'Times New Roman', size: 20 })] })],
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Descrição', bold: true, font: 'Times New Roman', size: 20 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Nível', bold: true, font: 'Times New Roman', size: 20 })] })],
      }),
    ],
  });

  const dataRows = domains.map(d => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: d.codigo, font: 'Times New Roman', size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: d.nome, font: 'Times New Roman', size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: d.descricao || '-', font: 'Times New Roman', size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `N${d.nivel_profundidade}`, font: 'Times New Roman', size: 20 })] })],
      }),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}
