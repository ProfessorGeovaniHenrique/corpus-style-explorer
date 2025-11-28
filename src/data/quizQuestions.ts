import { QuizQuestion } from "@/types/quiz.types";

export const quizQuestions: QuizQuestion[] = [
  // INTRODUÇÃO + GLOSSÁRIO (8 perguntas)
  {
    id: "intro-1",
    type: "objective",
    difficulty: "easy",
    category: "introducao",
    question: "O que é uma 'coxilha' no contexto gaúcho?",
    options: [
      "Uma árvore típica do pampa",
      "Uma elevação suave e ondulada do pampa",
      "Um tipo de dança regional",
      "Um equipamento de montaria"
    ],
    correctAnswers: ["Uma elevação suave e ondulada do pampa"],
    explanation: "Coxilha é uma elevação suave e ondulada típica do pampa gaúcho, característica da paisagem sul-rio-grandense."
  },
  {
    id: "intro-2",
    type: "matching",
    difficulty: "medium",
    category: "introducao",
    question: "Relacione os termos gaúchos com suas definições:",
    matchingPairs: [
      { left: "Tarumã", right: "Árvore nativa do Sul com sombra generosa" },
      { left: "Querência", right: "Lugar de origem, onde o coração pertence" },
      { left: "Prenda", right: "Mulher gaúcha, companheira" },
      { left: "Galpão", right: "Construção típica da estância, local de convívio" }
    ],
    correctAnswers: ["Tarumã:Árvore nativa do Sul com sombra generosa", "Querência:Lugar de origem, onde o coração pertence", "Prenda:Mulher gaúcha, companheira", "Galpão:Construção típica da estância, local de convívio"],
    explanation: "Esses termos são fundamentais para compreender o universo cultural gaúcho presente na canção."
  },
  {
    id: "intro-3",
    type: "checkbox",
    difficulty: "medium",
    category: "introducao",
    question: "Quais desses termos estão relacionados ao chimarrão?",
    options: ["Cuia", "Bomba", "Gateado", "Pura-folha", "Coxilha", "Jujado"],
    correctAnswers: ["Cuia", "Bomba", "Pura-folha", "Jujado"],
    explanation: "Cuia (recipiente), bomba (canudo de metal), pura-folha (erva de qualidade) e jujado (temperado) são todos relacionados ao ritual do chimarrão."
  },
  {
    id: "intro-4",
    type: "objective",
    difficulty: "easy",
    category: "introducao",
    question: "O que significa 'encilhar' no vocabulário gaúcho?",
    options: [
      "Preparar o chimarrão",
      "Colocar a sela e arreios no cavalo",
      "Fechar a porteira da estância",
      "Acender o fogo no galpão"
    ],
    correctAnswers: ["Colocar a sela e arreios no cavalo"],
    explanation: "Encilhar é o ato de preparar o cavalo para montar, colocando a sela (cilha) e os arreios. O oposto é desencilhar."
  },
  {
    id: "intro-5",
    type: "objective",
    difficulty: "medium",
    category: "introducao",
    question: "Na canção, o que significa dizer que uma saudade é 'redomona'?",
    options: [
      "Uma saudade tranquila e suave",
      "Uma saudade rebelde, difícil de domar",
      "Uma saudade antiga e esquecida",
      "Uma saudade alegre e festiva"
    ],
    correctAnswers: ["Uma saudade rebelde, difícil de domar"],
    explanation: "Redomona se refere a um cavalo ainda não totalmente domado. Por extensão poética, uma 'saudade redomona' é rebelde, indomável."
  },
  {
    id: "intro-6",
    type: "checkbox",
    difficulty: "hard",
    category: "introducao",
    question: "Quais elementos da letra demonstram a relação do gaúcho com a natureza?",
    options: [
      "Sombra do tarumã",
      "Sol da tarde caindo",
      "Verso que sonhou ser várzea",
      "Arreios suados",
      "Galo para as manhãs",
      "Esporas em silêncio"
    ],
    correctAnswers: ["Sombra do tarumã", "Sol da tarde caindo", "Verso que sonhou ser várzea", "Galo para as manhãs"],
    explanation: "Esses elementos naturais (árvore, sol, planície alagadiça, galo) mostram como a identidade gaúcha está entrelaçada com a paisagem do pampa."
  },
  {
    id: "intro-7",
    type: "objective",
    difficulty: "easy",
    category: "introducao",
    question: "O que é uma 'cancela' no contexto da estância gaúcha?",
    options: [
      "Um tipo de dança",
      "Uma porteira de madeira",
      "Um instrumento musical",
      "Uma peça do arreio do cavalo"
    ],
    correctAnswers: ["Uma porteira de madeira"],
    explanation: "Cancela é a porteira típica das estâncias gaúchas, geralmente feita de madeira, que delimita os campos."
  },
  {
    id: "intro-8",
    type: "objective",
    difficulty: "medium",
    category: "introducao",
    question: "Por que a canção 'Quando o Verso Vem pras Casa' foi escolhida para o projeto VersoAustral?",
    options: [
      "Por ser a música gaúcha mais antiga",
      "Por ter sido a primeira música gaúcha que o pesquisador ouviu",
      "Por ser a mais tocada no Rio Grande do Sul",
      "Por ter a letra mais longa"
    ],
    correctAnswers: ["Por ter sido a primeira música gaúcha que o pesquisador ouviu"],
    explanation: "A escolha parte de um profundo vínculo afetivo do pesquisador, que teve seu fascínio despertado por essa canção."
  },

  // APRENDIZADO (8 perguntas)
  {
    id: "apr-1",
    type: "objective",
    difficulty: "easy",
    category: "aprendizado",
    question: "Qual é o compasso característico do chamamé?",
    options: ["2/4 (binário)", "3/4 (ternário)", "4/4 (quaternário)", "6/8 (composto)"],
    correctAnswers: ["3/4 (ternário)"],
    explanation: "O chamamé é escrito em compasso ternário 3/4, podendo também ser notado em 6/8 (binário composto) para refletir subdivisões rítmicas específicas."
  },
  {
    id: "apr-2",
    type: "objective",
    difficulty: "medium",
    category: "aprendizado",
    question: "O que diferencia ritmicamente o chamamé da rancheira?",
    options: [
      "O chamamé tem acentuação no 1° tempo, rancheira no 3°",
      "O chamamé tem acentuação no 3° tempo, rancheira no 1°",
      "Ambos têm a mesma acentuação",
      "O chamamé não tem acentuação definida"
    ],
    correctAnswers: ["O chamamé tem acentuação no 3° tempo, rancheira no 1°"],
    explanation: "A 'puxada' de fole do acordeão no chamamé cria acentuação no 3° tempo do compasso, enquanto a rancheira acentua o 1° tempo."
  },
  {
    id: "apr-3",
    type: "checkbox",
    difficulty: "easy",
    category: "aprendizado",
    question: "Quais instrumentos formam a base típica do chamamé?",
    options: ["Acordeão", "Violão", "Bombo leguero", "Piano", "Violino", "Bateria"],
    correctAnswers: ["Acordeão", "Violão", "Bombo leguero"],
    explanation: "O acordeón (trazido pelos italianos), o violão e o bombo leguero (percussão argentina) são os instrumentos base do chamamé."
  },
  {
    id: "apr-4",
    type: "matching",
    difficulty: "medium",
    category: "aprendizado",
    question: "Relacione cada etnia com sua contribuição para a música gaúcha:",
    matchingPairs: [
      { left: "Italianos", right: "Introdução do acordeão" },
      { left: "Espanhóis", right: "Violão e bombo leguero" },
      { left: "Portugueses", right: "Primeiros colonizadores" },
      { left: "Rio da Prata", right: "Influência cultural platina" }
    ],
    correctAnswers: ["Italianos:Introdução do acordeão", "Espanhóis:Violão e bombo leguero", "Portugueses:Primeiros colonizadores", "Rio da Prata:Influência cultural platina"],
    explanation: "Cada grupo étnico contribuiu com elementos específicos para formar a rica diversidade musical gaúcha."
  },
  {
    id: "apr-5",
    type: "checkbox",
    difficulty: "medium",
    category: "aprendizado",
    question: "Quais são características gerais dos gêneros musicais gaúchos?",
    options: [
      "Preferência pelo modo Maior",
      "Tonalidades com sustenidos (especialmente Mi Maior)",
      "Uso exclusivo de modo Menor",
      "Melodia simples por graus conjuntos",
      "Harmonia complexa com sétimas e nonas",
      "Compassos binários e ternários"
    ],
    correctAnswers: ["Preferência pelo modo Maior", "Tonalidades com sustenidos (especialmente Mi Maior)", "Melodia simples por graus conjuntos", "Compassos binários e ternários"],
    explanation: "A música gaúcha caracteriza-se pela simplicidade melódica, preferência por tonalidades maiores com sustenidos, e compassos simples."
  },
  {
    id: "apr-6",
    type: "objective",
    difficulty: "hard",
    category: "aprendizado",
    question: "Por que o chamamé pode ser notado tanto em 3/4 quanto em 6/8?",
    options: [
      "São notações completamente equivalentes sem diferença",
      "3/4 é usado para iniciantes, 6/8 para profissionais",
      "6/8 reflete subdivisões guaranis, 3/4 é mais moderno",
      "Apenas 3/4 é correto, 6/8 é um erro"
    ],
    correctAnswers: ["6/8 reflete subdivisões guaranis, 3/4 é mais moderno"],
    explanation: "A notação em 6/8 reflete subdivisões rítmicas herdadas das tradições guaranis, enquanto 3/4 é mais comum em partituras modernas, mas ambas preservam a acentuação característica."
  },
  {
    id: "apr-7",
    type: "checkbox",
    difficulty: "easy",
    category: "aprendizado",
    question: "Quais danças fazem parte do fandango gaúcho?",
    options: ["Vaneira", "Chamamé", "Samba", "Milonga", "Forró", "Rancheira"],
    correctAnswers: ["Vaneira", "Chamamé", "Milonga", "Rancheira"],
    explanation: "Vaneira, chamamé, milonga e rancheira são algumas das danças de fandango tradicionais do Rio Grande do Sul."
  },
  {
    id: "apr-8",
    type: "objective",
    difficulty: "medium",
    category: "aprendizado",
    question: "Qual a função harmônica predominante na música gaúcha?",
    options: [
      "Tônica, dominante e subdominante",
      "Apenas tônica e dominante",
      "Acordes dissonantes modernos",
      "Sem harmonia definida"
    ],
    correctAnswers: ["Tônica, dominante e subdominante"],
    explanation: "A harmonia na música gaúcha é tradicionalmente simples, baseada nas três funções harmônicas principais: tônica, dominante e subdominante."
  },

  // ORIGENS (8 perguntas)
  {
    id: "ori-1",
    type: "objective",
    difficulty: "easy",
    category: "origens",
    question: "De onde vem a palavra 'chamamé'?",
    options: [
      "Do espanhol 'chamar'",
      "Do guarani 'che amó memé' (eu también soy, yo soy de aquí)",
      "Do português 'chamariz'",
      "Do italiano 'chiamare'"
    ],
    correctAnswers: ["Do guarani 'che amó memé' (eu también soy, yo soy de aquí)"],
    explanation: "A etimologia guarani 'che amó memé' revela a essência identitária do chamamé: uma música que diz 'eu também sou, eu sou daqui'."
  },
  {
    id: "ori-2",
    type: "checkbox",
    difficulty: "medium",
    category: "origens",
    question: "Quais elementos culturais indígenas estão presentes no chamamé?",
    options: [
      "Língua guarani em expressões",
      "Instrumentos de percussão tradicionais",
      "Escalas pentatônicas",
      "Rituais xamânicos",
      "Narrativas orais",
      "Cosmologia ameríndia"
    ],
    correctAnswers: ["Língua guarani em expressões", "Instrumentos de percussão tradicionais", "Narrativas orais"],
    explanation: "O chamamé preserva a língua guarani, instrumentos percussivos tradicionais e a tradição oral narrativa dos povos originários."
  },
  {
    id: "ori-3",
    type: "matching",
    difficulty: "medium",
    category: "origens",
    question: "Relacione os países platinos com suas características culturais:",
    matchingPairs: [
      { left: "Argentina", right: "Berço principal do chamamé" },
      { left: "Uruguai", right: "Influência cultural compartilhada" },
      { left: "Paraguai", right: "Raízes guaranis fortes" },
      { left: "Brasil (RS)", right: "Absorção e adaptação regional" }
    ],
    correctAnswers: ["Argentina:Berço principal do chamamé", "Uruguai:Influência cultural compartilhada", "Paraguai:Raízes guaranis fortes", "Brasil (RS):Absorção e adaptação regional"],
    explanation: "A região platina compartilha uma identidade cultural que atravessa fronteiras políticas, com cada país contribuindo para o chamamé."
  },
  {
    id: "ori-4",
    type: "objective",
    difficulty: "medium",
    category: "origens",
    question: "Qual o papel das reduções jesuíticas na formação do chamamé?",
    options: [
      "Proibiram a música guarani completamente",
      "Criaram síntese entre música sacra europeia e tradições guaranis",
      "Não tiveram influência na música regional",
      "Apenas ensinaram música europeia aos indígenas"
    ],
    correctAnswers: ["Criaram síntese entre música sacra europeia e tradições guaranis"],
    explanation: "As reduções jesuíticas foram espaços de encontro cultural onde a música sacra europeia se mesclou com as tradições musicais guaranis."
  },
  {
    id: "ori-5",
    type: "objective",
    difficulty: "hard",
    category: "origens",
    question: "O que o Rio da Prata representa geograficamente?",
    options: [
      "Um rio que nasce no Rio Grande do Sul",
      "Um estuário formado pelos rios Paraná e Uruguai",
      "Uma baía no litoral argentino",
      "Um lago compartilhado entre países platinos"
    ],
    correctAnswers: ["Um estuário formado pelos rios Paraná e Uruguai"],
    explanation: "O Rio da Prata é um estuário (encontro de rios com o oceano) formado pelos rios Paraná e Uruguai, localizado entre Uruguai e Argentina."
  },
  {
    id: "ori-6",
    type: "checkbox",
    difficulty: "easy",
    category: "origens",
    question: "Quais povos contribuíram para a música sul-rio-grandense?",
    options: ["Portugueses", "Alemães", "Italianos", "Japoneses", "Ingleses", "Africanos"],
    correctAnswers: ["Portugueses", "Alemães", "Italianos", "Japoneses", "Africanos"],
    explanation: "Portugueses, alemães, italianos, japoneses, africanos, indígenas, espanhóis, poloneses e franceses contribuíram para a diversidade musical gaúcha."
  },
  {
    id: "ori-7",
    type: "objective",
    difficulty: "medium",
    category: "origens",
    question: "Quando os imigrantes espanhóis chegaram ao Brasil trazendo instrumentos musicais?",
    options: [
      "Século XVII",
      "Final do século XIX e início do XX",
      "Metade do século XVIII",
      "Após a Segunda Guerra Mundial"
    ],
    correctAnswers: ["Final do século XIX e início do XX"],
    explanation: "Os espanhóis chegaram ao Brasil principalmente no final do século XIX e início do século XX, trazendo violão e bombo leguero."
  },
  {
    id: "ori-8",
    type: "checkbox",
    difficulty: "hard",
    category: "origens",
    question: "Quais características do chamamé refletem a herança guarani?",
    options: [
      "Uso de instrumentos de percussão tradicionais",
      "Subdivisões rítmicas específicas (notadas em 6/8)",
      "Acordeão como instrumento principal",
      "Expressões linguísticas guaranis",
      "Compasso binário 2/4",
      "Narrativas e cosmologia nas letras"
    ],
    correctAnswers: ["Uso de instrumentos de percussão tradicionais", "Subdivisões rítmicas específicas (notadas em 6/8)", "Expressões linguísticas guaranis", "Narrativas e cosmologia nas letras"],
    explanation: "A herança guarani manifesta-se em múltiplas camadas: instrumentos, ritmo, língua e cosmovisão narrativa."
  },

  // INSTRUMENTOS (6 perguntas)
  {
    id: "inst-1",
    type: "objective",
    difficulty: "easy",
    category: "instrumentos",
    question: "Qual é o instrumento predecessor do violão no chamamé, de origem guarani?",
    options: ["Bandoneón", "Mbaracá", "Charango", "Cuatro"],
    correctAnswers: ["Mbaracá"],
    explanation: "O Mbaracá era um instrumento de cordas guarani pré-hispânico, feito de cabaça, que antecedeu o violão na região."
  },
  {
    id: "inst-2",
    type: "objective",
    difficulty: "medium",
    category: "instrumentos",
    question: "O que é o 'Toque de Tupã' no contexto do chamamé?",
    options: [
      "Uma dança tradicional",
      "Uma técnica ritual de tocar violão para concentração e transe",
      "Um tipo de acordeão especial",
      "Um gênero musical derivado do chamamé"
    ],
    correctAnswers: ["Uma técnica ritual de tocar violão para concentração e transe"],
    explanation: "O 'Toque de Tupã' é uma técnica sagrada de execução do violão no chamamé, usada para concentração e transe espiritual."
  },
  {
    id: "inst-3",
    type: "objective",
    difficulty: "medium",
    category: "instrumentos",
    question: "O que é o 'rasguear chamamecero' no violão?",
    options: [
      "Uma afinação especial das cordas",
      "Uma técnica de dedilhado suave",
      "Um rasgueado percussivo que divide bordões e primas",
      "Um tipo de harmônico artificial"
    ],
    correctAnswers: ["Um rasgueado percussivo que divide bordões e primas"],
    explanation: "O rasguear chamamecero é uma técnica percussiva desenvolvida por Nicolas Antonio Niz, que cria efeito rítmico dividindo bordões e primas."
  },
  {
    id: "inst-4",
    type: "checkbox",
    difficulty: "easy",
    category: "instrumentos",
    question: "Quais características definem o acordeão no contexto gaúcho?",
    options: [
      "Trazido por imigrantes italianos",
      "Chamado de 'gaita'",
      "Instrumento central do chamamé",
      "Usado apenas em músicas religiosas",
      "Substituiu completamente o violão",
      "Fundamental para o timbre da música gaúcha"
    ],
    correctAnswers: ["Trazido por imigrantes italianos", "Chamado de 'gaita'", "Instrumento central do chamamé", "Fundamental para o timbre da música gaúcha"],
    explanation: "O acordeão (gaita) foi trazido por italianos e tornou-se o instrumento central do chamamé, definindo o timbre da música gaúcha."
  },
  {
    id: "inst-5",
    type: "objective",
    difficulty: "hard",
    category: "instrumentos",
    question: "Qual tonalidade especial é associada ao violão no chamamé segundo a tradição?",
    options: ["Dó Maior", "Sol Maior", "Fá Maior", "Lá Maior"],
    correctAnswers: ["Fá Maior"],
    explanation: "A tonalidade de Fá Maior possui uma conexão especial com a tradição do violão no chamamé, conforme documentado por Brittes (2021)."
  },
  {
    id: "inst-6",
    type: "matching",
    difficulty: "medium",
    category: "instrumentos",
    question: "Relacione os instrumentos com suas origens culturais:",
    matchingPairs: [
      { left: "Violão", right: "Herança espanhola" },
      { left: "Acordeão", right: "Imigração italiana" },
      { left: "Bombo leguero", right: "Tradição argentina" },
      { left: "Mbaracá", right: "Cultura guarani pré-hispânica" }
    ],
    correctAnswers: ["Violão:Herança espanhola", "Acordeão:Imigração italiana", "Bombo leguero:Tradição argentina", "Mbaracá:Cultura guarani pré-hispânica"],
    explanation: "Cada instrumento carrega a história de um povo ou cultura que contribuiu para a formação da música gaúcha."
  }
];
