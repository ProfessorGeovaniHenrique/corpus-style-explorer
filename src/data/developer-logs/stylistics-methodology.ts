/**
 * Stylistic Tools Methodology - Leech & Short (2007) + Corpus Stylistics
 * Complete documentation of stylistic analysis framework and Verso Austral implementation
 */

export interface StylisticsTool {
  id: string;
  name: string;
  theoreticalBasis: string;
  purpose: string;
  implementation: string;
  metrics: string[];
  references: string[];
}

export interface StylisticsLevelDetail {
  name: string;
  description: string;
  pageReferences: string;
  conceptualExplanation: string;
  components: string[];
  examples?: string[];
  keyQuote?: string;
}

export interface StylisticsTheory {
  framework: string;
  keyWorks: string[];
  coreLevel: {
    name: string;
    description: string;
    components: string[];
  }[];
  principles: string[];
  references: string[];
}

export const leechShortTheory: StylisticsTheory = {
  framework: "Estilística Linguística de Leech & Short",
  keyWorks: [
    "Style in Fiction: A Linguistic Introduction to English Fictional Prose (2007)",
    "Corpus Stylistics: Speech, Writing and Thought Presentation in a Corpus of English Writing (2004)"
  ],
  coreLevel: [
    {
      name: "Nível Léxico",
      description: "Análise de vocabulário, riqueza lexical e campos semânticos",
      components: [
        "Type-Token Ratio (TTR)",
        "Densidade Lexical",
        "Hapax Legomena",
        "Razão Substantivo/Verbo",
        "Campos Semânticos Dominantes"
      ]
    },
    {
      name: "Nível Sintático",
      description: "Estruturas de sentenças, complexidade e padrões gramaticais",
      components: [
        "Comprimento Médio de Sentença",
        "Distribuição de POS",
        "Voz Ativa/Passiva",
        "Densidade de Modificadores",
        "Complexidade Sintática"
      ]
    },
    {
      name: "Figuras Retóricas",
      description: "Recursos estilísticos e padrões de repetição",
      components: [
        "Repetição Lexical",
        "Aliteração",
        "Assonância",
        "Anáfora",
        "Paralelismo Sintático"
      ]
    },
    {
      name: "Coesão Textual",
      description: "Elementos que conectam partes do texto",
      components: [
        "Conectivos (aditivos, adversativos, causais, etc.)",
        "Referências Anafóricas",
        "Cadeias Lexicais",
        "Densidade de Conectivos"
      ]
    },
    {
      name: "Speech & Thought Presentation",
      description: "Escalas de apresentação de fala e pensamento",
      components: [
        "DS/IS/FIS/FDS/NRSA (Fala)",
        "DT/IT/FIT/FDT/NRTA (Pensamento)",
        "Distribuição de Categorias",
        "Padrões Narrativos"
      ]
    },
    {
      name: "Mind Style",
      description: "Perspectiva cognitiva através de padrões linguísticos",
      components: [
        "Transitividade de Halliday",
        "Padrões de Agência",
        "Modalidade Epistêmica",
        "Dêixis (temporal, espacial, pessoal)"
      ]
    },
    {
      name: "Foregrounding",
      description: "Deautomatização e proeminência estilística",
      components: [
        "Desvio Interno",
        "Desvio Externo",
        "Paralelismo",
        "Scores de Proeminência"
      ]
    }
  ],
  principles: [
    "Análise objetiva e quantificável do estilo literário",
    "Integração de linguística formal com crítica literária",
    "Uso de corpora para comparação e validação estatística",
    "Foco em padrões recorrentes e sistematicidade",
    "Metodologia replicável e verificável"
  ],
  references: [
    "LEECH, Geoffrey; SHORT, Mick. Style in Fiction: A Linguistic Introduction to English Fictional Prose. 2nd ed. Harlow: Pearson, 2007.",
    "SEMINO, Elena; SHORT, Mick. Corpus Stylistics: Speech, Writing and Thought Presentation in a Corpus of English Writing. London: Routledge, 2004.",
    "HALLIDAY, M.A.K. An Introduction to Functional Grammar. London: Edward Arnold, 1985.",
    "SIMPSON, Paul. Stylistics: A Resource Book for Students. London: Routledge, 2004."
  ]
};

export const versoAustralStylisticsTools: StylisticsTool[] = [
  {
    id: "lexical-profile",
    name: "Perfil Léxico",
    theoreticalBasis: "Leech & Short (2007) Capítulos 2-3 sobre vocabulário e riqueza lexical",
    purpose: "Quantificar diversidade vocabular e identificar campos semânticos dominantes no corpus musical gaúcho",
    implementation: "Calcula TTR, densidade lexical, hapax legomena e distribui palavras em domínios semânticos usando taxonomia VA (13 N1 + subcategorias)",
    metrics: [
      "Type-Token Ratio: totalUniqueWords / totalWords",
      "Densidade Lexical: (NOUN + VERB + ADJ + ADV) / totalWords",
      "Hapax %: palavras únicas / total vocabulário",
      "Razão N/V: substantivos / verbos"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 3",
      "BAKER, Paul. Using Corpora in Discourse Analysis. 2006."
    ]
  },
  {
    id: "syntactic-profile",
    name: "Perfil Sintático",
    theoreticalBasis: "Leech & Short (2007) Capítulo 7 sobre sintaxe e estrutura",
    purpose: "Analisar complexidade sintática e padrões estruturais das letras de música",
    implementation: "Usa POS tagger híbrido de 3 camadas (VA Grammar → spaCy → Gemini) para anotar corpus e calcular métricas sintáticas",
    metrics: [
      "Comprimento médio de sentença",
      "Desvio padrão de comprimento",
      "Distribuição de POS (%)",
      "Razão Adj/Noun e Adv/Verb",
      "Complexidade sintática normalizada"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 7",
      "BIBER, Douglas. Variation across Speech and Writing. 1988."
    ]
  },
  {
    id: "rhetorical-figures",
    name: "Figuras Retóricas",
    theoreticalBasis: "Leech & Short (2007) Capítulo 7.7 sobre iconicidade e paralelismo",
    purpose: "Detectar recursos estilísticos tradicionais como repetição, aliteração e anáfora",
    implementation: "Pattern matching baseado em regras linguísticas para identificar 5 tipos de figuras retóricas",
    metrics: [
      "Contagem por tipo (repetição, aliteração, assonância, anáfora, paralelismo)",
      "Densidade: figuras por 100 palavras",
      "Distribuição por artista/música"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 7.7",
      "JAKOBSON, Roman. Linguistics and Poetics. 1960."
    ]
  },
  {
    id: "cohesion-analysis",
    name: "Análise de Coesão",
    theoreticalBasis: "Leech & Short (2007) Capítulo 7.8 sobre cross-reference e linkage",
    purpose: "Identificar elementos que conectam partes do texto criando coerência textual",
    implementation: "Detecção de conectivos por tipo semântico, referências anafóricas e cadeias lexicais",
    metrics: [
      "Densidade de conectivos por sentença",
      "Variação de conectivos (únicos)",
      "Distribuição por tipo (aditivo, adversativo, causal, temporal, conclusivo)"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 7.8",
      "HALLIDAY, M.A.K.; HASAN, Ruqaiya. Cohesion in English. 1976."
    ]
  },
  {
    id: "speech-thought-presentation",
    name: "Apresentação de Fala e Pensamento",
    theoreticalBasis: "Leech & Short (2007) Capítulo 10 + Semino & Short (2004) Corpus Stylistics",
    purpose: "Classificar instâncias de fala e pensamento nas escalas DS→NRSA e DT→NRTA",
    implementation: "Detecção baseada em padrões: aspas, verbos dicendi/mentais, backshift temporal, marcadores de discurso indireto livre",
    metrics: [
      "Distribuição de categorias de fala (DS, IS, FIS, FDS, NRSA)",
      "Distribuição de categorias de pensamento (DT, IT, FIT, FDT, NRTA)",
      "Categoria dominante",
      "Instâncias totais"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 10",
      "SEMINO & SHORT (2004), Corpus Stylistics",
      "MCINTYRE, Dan; WALKER, Brian. Corpus Stylistics: Theory and Practice. 2019."
    ]
  },
  {
    id: "mind-style-analyzer",
    name: "Analisador de Mind Style",
    theoreticalBasis: "Leech & Short (2007) Capítulo 6 sobre mind style + Halliday (1985) transitivity",
    purpose: "Revelar perspectiva cognitiva do texto através de padrões verbais, modalidade e agência",
    implementation: "Análise de transitividade (processos material/mental/relacional), padrões de agência, modalidade epistêmica e dêixis",
    metrics: [
      "Distribuição de processos de Halliday (%)",
      "Razão Percepção/Ação",
      "Indicadores de modalidade (certeza, incerteza, obrigação)",
      "Dêixis (temporal, espacial, pessoal)",
      "Estilo cognitivo classificado"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 6",
      "HALLIDAY, M.A.K. An Introduction to Functional Grammar. 1985.",
      "FOWLER, Roger. Linguistic Criticism. 1986."
    ]
  },
  {
    id: "foregrounding-detector",
    name: "Detector de Foregrounding",
    theoreticalBasis: "Escola de Praga (deautomatização) + Leech & Short (2007) Capítulo 4",
    purpose: "Identificar padrões linguísticos que chamam atenção do leitor por desvio ou paralelismo",
    implementation: "Detecção de desvio interno (vs. norma do texto), desvio externo (vs. norma geral) e estruturas paralelas com cálculo de scores de proeminência",
    metrics: [
      "Contagem de desvios internos/externos/paralelismos",
      "Score de proeminência (0-1)",
      "Significância estatística (σ)",
      "Padrões mais proeminentes"
    ],
    references: [
      "LEECH & SHORT (2007), Cap. 4.6",
      "MUKAROVSKY, Jan. Standard Language and Poetic Language. 1932.",
      "VAN PEER, Willie. Stylistics and Psychology. 1986."
    ]
  }
];

export const crossCorpusMethodology = {
  concept: "Análise Comparativa Cross-Corpus com Amostragem Proporcional",
  theoreticalBasis: [
    "Log-Likelihood Ratio para identificação de diferenças estatisticamente significativas",
    "Normalização por milhão de palavras para comparabilidade entre corpora de tamanhos diferentes",
    "Amostragem aleatória estratificada para balanceamento de tamanhos (Baker 2006)",
    "Chi-square test para cálculo de p-value e significância estatística"
  ],
  proportionalSampling: {
    purpose: "Permitir comparação estatisticamente válida entre corpora de tamanhos drasticamente diferentes",
    method: "Amostragem aleatória por música até atingir tamanho alvo baseado em proporção definida pelo usuário",
    ratios: [
      { value: 1, label: "1x - Tamanho igual ao corpus de estudo (comparação 1:1)" },
      { value: 3, label: "3x - 3 vezes maior (adequado para corpus médios)" },
      { value: 5, label: "5x - 5 vezes maior (RECOMENDADO - padrão estatístico)" },
      { value: 10, label: "10x - 10 vezes maior (para corpus muito pequenos)" }
    ],
    customRatio: "Usuário pode definir proporção personalizada (ex: 7.5x, 20x)"
  },
  implementation: "Integrado em todas as 7 ferramentas estilísticas via CrossCorpusSelectorWithRatio",
  references: [
    "BAKER, Paul. Using Corpora in Discourse Analysis. London: Continuum, 2006.",
    "MCINTYRE, Dan; WALKER, Brian. Corpus Stylistics: Theory and Practice. Edinburgh University Press, 2019."
  ]
};

// Detalhamento dos níveis estilísticos com referências de página de Leech & Short (2007)
export const leechShortLevelsDetailed: StylisticsLevelDetail[] = [
  {
    name: "Nível Léxico",
    description: "Análise de vocabulário, riqueza lexical e campos semânticos",
    pageReferences: "Leech & Short (2007), Cap. 3, pp. 61-88",
    conceptualExplanation: "O nível léxico examina as escolhas vocabulares do autor, focando em padrões de frequência, diversidade e campos semânticos. A análise quantifica riqueza lexical (Type-Token Ratio), identifica palavras-chave estatisticamente significativas e mapeia domínios semânticos recorrentes. No corpus gaúcho, permite identificar o 'léxico cultural' específico (ex: mate, galpão, coxilha) e comparar perfis lexicais entre artistas.",
    components: [
      "Type-Token Ratio (TTR) - diversidade vocabular",
      "Densidade Lexical - proporção de palavras de conteúdo",
      "Hapax Legomena - palavras que aparecem uma única vez",
      "Razão Substantivo/Verbo - tendência para descrição vs. ação",
      "Campos Semânticos Dominantes - temas recorrentes no texto"
    ],
    examples: [
      "Alto TTR indica vocabulário variado (estilo 'rico')",
      "Baixo TTR indica repetição deliberada (ex: poesia minimalista)",
      "Dominância de substantivos concretos vs. abstratos revela foco material ou filosófico"
    ],
    keyQuote: "The vocabulary of a text reflects the writer's choices from the total resources of the language available... Lexical analysis reveals the 'aboutness' of a text through its semantic fields and keywords."
  },
  {
    name: "Nível Sintático",
    description: "Estruturas de sentenças, complexidade e padrões gramaticais",
    pageReferences: "Leech & Short (2007), Cap. 4, pp. 103-142",
    conceptualExplanation: "O nível sintático analisa como as palavras se combinam em estruturas frasais e oracionais. Examina comprimento de sentenças, distribuição de classes gramaticais (POS), uso de voz ativa/passiva e densidade de modificadores. Sentenças longas e complexas (hipotaxe) sugerem elaboração intelectual, enquanto sentenças curtas (parataxe) criam ritmo e urgência. No corpus musical, sintaxe pode refletir oralidade (frases curtas, coordenação) ou estilo literário (subordinação complexa).",
    components: [
      "Comprimento Médio de Sentença (MSL) - complexidade estrutural",
      "Distribuição de POS (NOUN, VERB, ADJ, ADV) - perfil gramatical",
      "Voz Ativa vs. Passiva - perspectiva e agência narrativa",
      "Densidade de Modificadores (adjetivos/advérbios) - nível de detalhamento",
      "Complexidade Sintática - subordinação vs. coordenação"
    ],
    examples: [
      "Hemingway: sentenças curtas (MSL ~15 palavras), coordenação, voz ativa",
      "Proust: sentenças longas (MSL >40 palavras), múltiplas subordinadas",
      "Voz passiva remove agente → efeito de distanciamento ou impessoalidade"
    ],
    keyQuote: "Syntax is not merely a matter of correctness, but of choice... The way sentences are structured affects not just what is said, but how it is said and perceived."
  },
  {
    name: "Figuras Retóricas",
    description: "Recursos estilísticos e padrões de repetição sonora/visual",
    pageReferences: "Leech & Short (2007), Cap. 7, pp. 187-218",
    conceptualExplanation: "Figuras retóricas são padrões formais que criam efeitos expressivos através de repetição, paralelismo ou iconicidade. Incluem recursos sonoros (aliteração, assonância) e sintáticos (anáfora, epífora, paralelismo). Na música gaúcha, aliteração reforça musicalidade ('saudade suave'), paralelismo cria ritmo ('vim do campo, volto ao campo') e anáfora enfatiza temas ('querência minha, querência linda').",
    components: [
      "Repetição Lexical - recorrência intencional de palavras-chave",
      "Aliteração - repetição de sons consonantais (ex: 'prateada pela lua')",
      "Assonância - repetição de sons vocálicos (ex: 'mate amargo')",
      "Anáfora - repetição no início de versos/frases",
      "Paralelismo Sintático - estruturas gramaticais espelhadas"
    ],
    examples: [
      "Aliteração em 'suave sombra serena' cria efeito melódico",
      "Anáfora 'Eu vim... Eu vi... Eu venci' enfatiza progressão",
      "Paralelismo 'amor de mãe / mãe do amor' cria simetria conceitual"
    ],
    keyQuote: "Rhetorical schemes work by foregrounding language through patterned deviation or parallelism, drawing attention to the form as well as the content of expression."
  },
  {
    name: "Coesão Textual",
    description: "Elementos que conectam partes do texto e criam unidade",
    pageReferences: "Leech & Short (2007), Cap. 6, pp. 163-186",
    conceptualExplanation: "Coesão refere-se aos recursos linguísticos que criam conectividade e fluxo textual. Halliday & Hasan (1976) identificam 5 tipos: referência (anafórica/catafórica), substituição, elipse, conjunção e coesão lexical (cadeias semânticas). Alta densidade de conectivos causais indica argumentação lógica, enquanto conectivos aditivos indicam acumulação descritiva. Na música, coesão pode ser 'frouxa' (versos isolados como snapshots) ou 'densa' (narrativa linear).",
    components: [
      "Conectivos Lógicos - aditivos (e, também), adversativos (mas, porém), causais (porque, então)",
      "Referências Anafóricas - pronomes e demonstrativos remetendo a antecedentes",
      "Cadeias Lexicais - repetição de palavras relacionadas semanticamente",
      "Densidade de Conectivos - frequência de marcadores de coesão",
      "Elipse e Substituição - omissão/substituição para evitar repetição"
    ],
    examples: [
      "Alta densidade de 'mas' e 'porém' indica contraste/conflito temático",
      "Cadeia lexical 'pampas → campo → várzea → coxilha' mantém foco na paisagem",
      "Anáfora pronominal 'ele' sem antecedente claro cria ambiguidade estilística"
    ],
    keyQuote: "Cohesion refers to relations of meaning that exist within the text, and that define it as a text... It is the resource which language has for creating texture."
  },
  {
    name: "Speech & Thought Presentation",
    description: "Escalas de apresentação de fala e pensamento dos personagens",
    pageReferences: "Leech & Short (2007), Cap. 10, pp. 255-281",
    conceptualExplanation: "A apresentação de fala e pensamento opera em escalas que variam de relatório narrativo (NRSA/NRTA) a discurso direto (DS/DT), passando por formas intermediárias (IS/IT, FIS/FIT). Discurso Direto preserva palavras exatas ('Ele disse: Vou embora'), Discurso Indireto Livre (FIS/FIT) mistura voz do narrador com voz do personagem, criando ambiguidade e empatia. Em letras de música, prevalece DS (citação direta) e FIS (voz lírica fundida com voz de personagem imaginado).",
    components: [
      "DS/IS/FIS/FDS/NRSA - escala de apresentação de FALA",
      "DT/IT/FIT/FDT/NRTA - escala de apresentação de PENSAMENTO",
      "Distribuição de Categorias - frequência de cada modo no corpus",
      "Padrões Narrativos - quando cada modo é escolhido e por quê"
    ],
    examples: [
      "DS (Discurso Direto): 'Ela gritou: Não vou!' - preserva palavras exatas",
      "IS (Indireto): 'Ela disse que não iria' - paráfrase do narrador",
      "FIS (Indireto Livre): 'Não, ela não iria. Impossível!' - fusão narrador/personagem",
      "NRSA: 'Ela recusou' - resumo sem conteúdo específico"
    ],
    keyQuote: "The representation of speech and thought in narrative is not simply a matter of reporting what was said or thought, but of choosing how much access to give the reader to the character's words or consciousness."
  },
  {
    name: "Mind Style",
    description: "Perspectiva cognitiva através de padrões linguísticos recorrentes",
    pageReferences: "Leech & Short (2007), Cap. 5, pp. 150-162",
    conceptualExplanation: "Mind Style refere-se à visão de mundo (worldview) de um narrador ou personagem revelada através de escolhas linguísticas sistemáticas. Baseia-se na Gramática Funcional de Halliday (transitividade, agência, modalidade). Um narrador que usa muitos verbos materiais ('correr', 'pegar') tem perspectiva ativa/física; uso de verbos mentais ('pensar', 'sentir') indica introspecção. Modalidade epistêmica ('talvez', 'certamente') revela grau de certeza/dúvida. No corpus gaúcho, pode revelar visão 'pampeana' (materialista, concreta) vs. 'lírica' (abstrata, emotiva).",
    components: [
      "Transitividade de Halliday - tipos de processos (material, mental, relacional, verbal)",
      "Padrões de Agência - quem faz o quê? Agentes animados ou inanimados?",
      "Modalidade Epistêmica - grau de certeza (pode, deve, talvez, certamente)",
      "Dêixis - temporal (ontem/amanhã), espacial (aqui/lá), pessoal (eu/você)"
    ],
    examples: [
      "Criança narradora em 'Flowers for Algernon': sintaxe simples, vocabulário limitado = mind style cognitivamente restrito",
      "Narrador de 'The Sound and the Fury' (Benjy): sem marcadores temporais claros = mind style desorientado",
      "Dominância de processos relacionais ('ser', 'estar') = worldview estática vs. material ('fazer', 'correr') = dinâmica"
    ],
    keyQuote: "Mind style is the linguistic presentation of an individual mental self... It is the sum of the linguistic choices which add up to a consistent point of view."
  },
  {
    name: "Foregrounding",
    description: "Deautomatização e proeminência estilística através de desvio ou paralelismo",
    pageReferences: "Leech & Short (2007), Cap. 4, pp. 110-131",
    conceptualExplanation: "Foregrounding (termo da Escola de Praga) é a proeminência estilística criada por DESVIO (violação de normas linguísticas) ou PARALELISMO (padrões formais inesperados). Desvio pode ser interno (violação de padrões do próprio texto) ou externo (violação da norma linguística geral). Ex: neologismo, sintaxe inusitada, metáfora surpreendente. Paralelismo cria expectativa e ritmo através de repetição estrutural. Foregrounding 'deautomatiza' percepção, forçando leitor a processar linguagem conscientemente ao invés de automaticamente.",
    components: [
      "Desvio Interno - violação de padrões estabelecidos no próprio texto",
      "Desvio Externo - violação da norma linguística padrão (neologismo, sintaxe inusitada)",
      "Paralelismo - repetição de estruturas formais (fonológico, sintático, semântico)",
      "Scores de Proeminência - quantificação de intensidade do foregrounding"
    ],
    examples: [
      "Desvio lexical: 'verdura' (criança) - neologismo de Guimarães Rosa",
      "Desvio sintático: 'verde que te quero verde' (García Lorca) - ordem inusitada",
      "Paralelismo: 'It was the best of times, it was the worst of times' (Dickens) - estrutura espelhada",
      "Desvio semântico (metáfora): 'tempo é dinheiro' - conceito abstrato como concreto"
    ],
    keyQuote: "Foregrounding is the artistically motivated deviation from the linguistic norm... It is the aesthetic function of language, making the message itself perceptible by drawing attention to its own form."
  }
];

export const versoAustralStylisticsRoadmap = {
  phase1: {
    name: "Ferramentas Base (COMPLETO)",
    duration: "3 semanas",
    status: "complete",
    deliverables: [
      "Perfil Léxico com comparação de corpora",
      "Perfil Sintático com POS tagger híbrido",
      "Figuras Retóricas (5 tipos)",
      "Análise de Coesão"
    ]
  },
  phase2: {
    name: "Ferramentas Avançadas (COMPLETO)",
    duration: "2 semanas",
    status: "complete",
    deliverables: [
      "Speech & Thought Presentation Tool",
      "Mind Style Analyzer",
      "Foregrounding Detector",
      "Integração completa com UnifiedCorpusSelector em todas as ferramentas"
    ]
  },
  phase3: {
    name: "Análise Comparativa Cross-Corpus",
    duration: "1 semana",
    status: "complete",
    deliverables: [
      "CrossCorpusSelectorWithRatio - seletor unificado com controle de proporção (1x, 3x, 5x, 10x)",
      "proportionalSamplingService - amostragem aleatória proporcional com validação estatística",
      "Integração em todas as 7 ferramentas estilísticas (Léxico, Sintático, Retórico, Coesão, Speech/Thought, Mind Style, Foregrounding)",
      "ComparisonRadarChart - gráficos radar comparativos",
      "SignificanceIndicator - badges de significância estatística (Chi-square test)",
      "ProportionalSampleInfo - card informativo sobre amostragem aplicada"
    ]
  },
  phase4: {
    name: "Dashboards Interativos",
    duration: "2 semanas",
    status: "planned",
    deliverables: [
      "Visualizações 3D de foregrounding",
      "Heat maps de densidade estilística",
      "Timeline de evolução estilística",
      "Export completo multi-formato"
    ]
  }
};
