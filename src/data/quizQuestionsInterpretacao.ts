import { DomainData, KeywordData } from '@/contexts/DashboardAnaliseContext';

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function generateInterpretationQuestions(
  dominios: DomainData[],
  keywords: KeywordData[]
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Q1: Qual domínio tem maior peso textual?
  if (dominios.length >= 3) {
    const sortedByPercentual = [...dominios].sort((a, b) => b.percentual - a.percentual);
    const top = sortedByPercentual[0];
    const decoys = sortedByPercentual.slice(1, 4);

    questions.push({
      id: 'peso_textual',
      question: 'Com base na análise de domínios semânticos, qual domínio apresenta o maior peso textual no corpus de estudo?',
      options: [
        {
          id: 'correct',
          text: `${top.dominio} (${top.percentual.toFixed(1)}%)`,
          isCorrect: true,
        },
        ...decoys.map((d, idx) => ({
          id: `decoy_${idx}`,
          text: `${d.dominio} (${d.percentual.toFixed(1)}%)`,
          isCorrect: false,
        })),
      ],
      explanation: `O domínio "${top.dominio}" possui o maior peso textual com ${top.percentual.toFixed(1)}% do corpus, indicando que este é o tema mais representativo na obra analisada. O peso textual mede a proporção de palavras pertencentes a cada domínio semântico.`,
      difficulty: 'easy',
    });
  }

  // Q2: Interpretação de Log-Likelihood
  if (dominios.length >= 2) {
    const highLL = dominios.find(d => d.avgLL > 10);
    const lowLL = dominios.find(d => d.avgLL < 3);

    if (highLL) {
      questions.push({
        id: 'log_likelihood',
        question: `O domínio "${highLL.dominio}" apresenta Log-Likelihood médio de ${highLL.avgLL.toFixed(2)}. O que isso indica estatisticamente?`,
        options: [
          {
            id: 'correct',
            text: 'Este domínio está super-representado no corpus de estudo em comparação ao corpus de referência',
            isCorrect: true,
          },
          {
            id: 'decoy_1',
            text: 'Este domínio está sub-representado no corpus de estudo',
            isCorrect: false,
          },
          {
            id: 'decoy_2',
            text: 'Este domínio tem distribuição equilibrada entre os corpus',
            isCorrect: false,
          },
          {
            id: 'decoy_3',
            text: 'O Log-Likelihood não indica nada sobre representatividade',
            isCorrect: false,
          },
        ],
        explanation: `Um Log-Likelihood (LL) alto (> 10) indica que o domínio "${highLL.dominio}" é estatisticamente super-representado no corpus de estudo comparado ao corpus de referência. Quanto maior o LL, maior a diferença estatística entre os corpus. Valores LL > 15.13 indicam significância estatística com p < 0.0001.`,
        difficulty: 'medium',
      });
    }
  }

  // Q3: Riqueza Lexical vs Frequência
  if (dominios.length >= 2) {
    const highRiqueza = [...dominios].sort((a, b) => b.riquezaLexical - a.riquezaLexical)[0];
    const highFreq = [...dominios].sort((a, b) => b.ocorrencias - a.ocorrencias)[0];

    if (highRiqueza && highFreq && highRiqueza.dominio !== highFreq.dominio) {
      questions.push({
        id: 'riqueza_vs_frequencia',
        question: `O domínio "${highRiqueza.dominio}" tem alta riqueza lexical (${highRiqueza.riquezaLexical} palavras únicas), mas "${highFreq.dominio}" tem mais ocorrências totais (${highFreq.ocorrencias}). Como interpretar essa diferença?`,
        options: [
          {
            id: 'correct',
            text: `"${highRiqueza.dominio}" usa vocabulário mais diversificado, enquanto "${highFreq.dominio}" repete mais as mesmas palavras`,
            isCorrect: true,
          },
          {
            id: 'decoy_1',
            text: 'Ambos os domínios têm o mesmo nível de diversidade vocabular',
            isCorrect: false,
          },
          {
            id: 'decoy_2',
            text: `"${highFreq.dominio}" é mais importante porque aparece mais vezes`,
            isCorrect: false,
          },
          {
            id: 'decoy_3',
            text: 'Riqueza lexical e frequência sempre andam juntas',
            isCorrect: false,
          },
        ],
        explanation: `A riqueza lexical mede a diversidade de palavras únicas (type), enquanto a frequência total mede repetições (tokens). "${highRiqueza.dominio}" com alta riqueza indica vocabulário rico e variado. "${highFreq.dominio}" com alta frequência mas menor riqueza indica que certas palavras são repetidas intensamente, revelando focos temáticos distintos: diversidade vs. insistência.`,
        difficulty: 'hard',
      });
    } else if (highRiqueza) {
      // Fallback se não houver diferença clara
      questions.push({
        id: 'riqueza_lexical',
        question: `O domínio "${highRiqueza.dominio}" apresenta riqueza lexical de ${highRiqueza.riquezaLexical} palavras únicas. O que isso revela sobre o texto?`,
        options: [
          {
            id: 'correct',
            text: 'O autor explora este tema com vocabulário diversificado e rico',
            isCorrect: true,
          },
          {
            id: 'decoy_1',
            text: 'O autor repete as mesmas palavras sobre este tema',
            isCorrect: false,
          },
          {
            id: 'decoy_2',
            text: 'Riqueza lexical não indica diversidade vocabular',
            isCorrect: false,
          },
          {
            id: 'decoy_3',
            text: 'Este domínio tem pouca relevância no texto',
            isCorrect: false,
          },
        ],
        explanation: `Riqueza lexical alta (${highRiqueza.riquezaLexical} palavras únicas) indica que o autor usa vocabulário diversificado ao abordar o tema "${highRiqueza.dominio}". Isso demonstra profundidade temática e variedade estilística, em contraste com domínios onde poucas palavras são repetidas intensamente.`,
        difficulty: 'medium',
      });
    }
  }

  return questions.slice(0, 3); // Retornar apenas 3 perguntas
}
