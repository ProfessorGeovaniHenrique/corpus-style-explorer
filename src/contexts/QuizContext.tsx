import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { QuizQuestion, QuizState, QuizAnswer } from "@/types/quiz.types";
import { quizQuestions } from "@/data/quizQuestions";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY_INTERMEDIARIO = "verso-austral-quiz-intermediario";
const STORAGE_KEY_FINAL = "verso-austral-quiz-final";
const STORAGE_KEY_PASSED = "verso-austral-quiz-passed";
const QUESTIONS_CACHE_KEY = "quiz-questions-cache";
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutos

function selectBalancedQuestions(allQuestions: QuizQuestion[], categories?: string[]): QuizQuestion[] {
  const filteredQuestions = categories 
    ? allQuestions.filter(q => categories.includes(q.category))
    : allQuestions;
  const shuffle = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const easy = filteredQuestions.filter(q => q.difficulty === 'easy');
  const medium = filteredQuestions.filter(q => q.difficulty === 'medium');
  const hard = filteredQuestions.filter(q => q.difficulty === 'hard');

  return [
    ...shuffle(easy).slice(0, 2),
    ...shuffle(medium).slice(0, 2),
    ...shuffle(hard).slice(0, 1),
  ];
}

interface QuizContextValue {
  quizState: QuizState | null;
  isOpen: boolean;
  hasPassedQuiz: boolean; // Mantido para compatibilidade = hasPassedFinal
  hasPassedIntermediario: boolean;
  hasPassedFinal: boolean;
  currentQuizType: 'intermediario' | 'final' | null;
  startQuiz: (quizType: 'intermediario' | 'final') => void;
  submitAnswer: (userAnswers: string[]) => void;
  resetQuiz: () => void;
  closeQuiz: () => void;
  openQuiz: (quizType: 'intermediario' | 'final') => void;
  goToPreviousQuestion: () => void;
  onQuizClose?: (passed: boolean) => void;
  setOnQuizClose: (callback: ((passed: boolean) => void) | undefined) => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [dbQuestions, setDbQuestions] = useState<QuizQuestion[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuizType, setCurrentQuizType] = useState<'intermediario' | 'final' | null>(null);
  const [hasPassedIntermediario, setHasPassedIntermediario] = useState(false);
  const [hasPassedFinal, setHasPassedFinal] = useState(false);
  const [onQuizCloseCallback, setOnQuizCloseCallback] = useState<((passed: boolean) => void) | undefined>();
  const { trackFeatureUsage } = useAnalytics();

  // Carregar perguntas do banco
  useEffect(() => {
    const loadQuestionsFromDB = async () => {
      try {
        const cached = localStorage.getItem(QUESTIONS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setDbQuestions(data);
            setQuestionsLoaded(true);
            return;
          }
        }

        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        if (data && data.length > 0) {
          const transformed = data.map(q => ({
            id: q.question_id,
            type: q.type as any,
            difficulty: q.difficulty as any,
            category: q.category as any,
            question: q.question,
            options: q.options as string[] | undefined,
            correctAnswers: q.correct_answers as string[],
            matchingPairs: q.matching_pairs as any,
            explanation: q.explanation,
          }));

          setDbQuestions(transformed);
          localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify({ data: transformed, timestamp: Date.now() }));
        } else {
          setDbQuestions(quizQuestions);
        }
      } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        setDbQuestions(quizQuestions);
      } finally {
        setQuestionsLoaded(true);
      }
    };

    loadQuestionsFromDB();
  }, []);

  // Carregar estados de aprovação do localStorage
  useEffect(() => {
    const savedPassed = localStorage.getItem(STORAGE_KEY_PASSED);
    if (savedPassed) {
      try {
        const { intermediario, final } = JSON.parse(savedPassed);
        setHasPassedIntermediario(!!intermediario);
        setHasPassedFinal(!!final);
      } catch (e) {
        console.error("Failed to parse passed state:", e);
      }
    }
  }, []);

  // Salvar estados de aprovação quando mudam
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PASSED, JSON.stringify({
      intermediario: hasPassedIntermediario,
      final: hasPassedFinal
    }));
  }, [hasPassedIntermediario, hasPassedFinal]);

  // Carregar estado do quiz atual baseado no tipo
  const loadQuizState = useCallback((quizType: 'intermediario' | 'final') => {
    const storageKey = quizType === 'intermediario' ? STORAGE_KEY_INTERMEDIARIO : STORAGE_KEY_FINAL;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored) as QuizState;
      } catch (e) {
        console.error("Failed to parse quiz state:", e);
      }
    }
    return null;
  }, []);

  // Salvar estado do quiz
  const saveQuizState = useCallback((state: QuizState | null, quizType: 'intermediario' | 'final') => {
    const storageKey = quizType === 'intermediario' ? STORAGE_KEY_INTERMEDIARIO : STORAGE_KEY_FINAL;
    if (state) {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, []);

  const startQuiz = useCallback((quizType: 'intermediario' | 'final') => {
    if (!questionsLoaded) return;
    
    setCurrentQuizType(quizType);
    
    // Verificar se já existe um estado salvo para este quiz
    const existingState = loadQuizState(quizType);
    if (existingState && !existingState.isComplete) {
      setQuizState(existingState);
      setIsOpen(true);
      return;
    }
    
    const categories = quizType === 'intermediario' 
      ? ['introducao', 'aprendizado', 'origens']
      : ['instrumentos'];
    
    const selectedQuestions = selectBalancedQuestions(dbQuestions.length > 0 ? dbQuestions : quizQuestions, categories);
    const newState: QuizState = {
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false,
      score: 0,
    };
    
    setQuizState(newState);
    saveQuizState(newState, quizType);
    setIsOpen(true);
    trackFeatureUsage(quizType === 'intermediario' ? 'quiz_intermediario' : 'quiz_final');
  }, [trackFeatureUsage, dbQuestions, questionsLoaded, loadQuizState, saveQuizState]);

  const submitAnswer = useCallback((userAnswers: string[]) => {
    if (!quizState || !currentQuizType) return;

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    
    let isCorrect = false;
    if (currentQuestion.type === 'objective') {
      isCorrect = userAnswers[0] === currentQuestion.correctAnswers[0];
    } else if (currentQuestion.type === 'checkbox') {
      const sorted1 = [...userAnswers].sort();
      const sorted2 = [...currentQuestion.correctAnswers].sort();
      isCorrect = sorted1.length === sorted2.length && 
                  sorted1.every((val, idx) => val === sorted2[idx]);
    } else if (currentQuestion.type === 'matching') {
      isCorrect = userAnswers.length === currentQuestion.correctAnswers.length &&
                  userAnswers.every(pair => currentQuestion.correctAnswers.includes(pair));
    }

    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      userAnswers,
      isCorrect,
    };

    const newAnswers = [...quizState.answers, answer];
    const nextIndex = quizState.currentQuestionIndex + 1;
    const isComplete = nextIndex >= quizState.questions.length;
    const newScore = quizState.score + (isCorrect ? 1 : 0);

    const newState: QuizState = {
      ...quizState,
      currentQuestionIndex: nextIndex,
      answers: newAnswers,
      isComplete,
      score: newScore,
    };

    setQuizState(newState);
    saveQuizState(newState, currentQuizType);

    // Verificar aprovação quando quiz completo
    if (isComplete) {
      const percentage = (newScore / quizState.questions.length) * 100;
      const passed = percentage >= 70;
      
      if (passed) {
        if (currentQuizType === 'intermediario') {
          trackFeatureUsage('quiz_intermediario_passed');
          setHasPassedIntermediario(true);
        } else if (currentQuizType === 'final') {
          trackFeatureUsage('quiz_final_passed');
          setHasPassedFinal(true);
        }
      }
    }
  }, [quizState, currentQuizType, trackFeatureUsage, saveQuizState]);

  const resetQuiz = useCallback(() => {
    if (currentQuizType) {
      saveQuizState(null, currentQuizType);
    }
    setQuizState(null);
    setIsOpen(false);
  }, [currentQuizType, saveQuizState]);

  const closeQuiz = useCallback(() => {
    setIsOpen(false);
    
    // Trigger callback somente para quiz final
    if (quizState?.isComplete && onQuizCloseCallback && currentQuizType === 'final') {
      const percentage = (quizState.score / quizState.questions.length) * 100;
      const passed = percentage >= 70;
      onQuizCloseCallback(passed);
    }
  }, [quizState, onQuizCloseCallback, currentQuizType]);

  const openQuiz = useCallback((quizType: 'intermediario' | 'final') => {
    setCurrentQuizType(quizType);
    
    // Carregar estado existente para este tipo de quiz
    const existingState = loadQuizState(quizType);
    if (existingState) {
      setQuizState(existingState);
      setIsOpen(true);
    } else {
      startQuiz(quizType);
    }
  }, [loadQuizState, startQuiz]);

  const goToPreviousQuestion = useCallback(() => {
    if (!quizState || quizState.currentQuestionIndex === 0 || !currentQuizType) return;

    const previousAnswer = quizState.answers[quizState.answers.length - 1];
    const newAnswers = quizState.answers.slice(0, -1);
    const newScore = quizState.score - (previousAnswer.isCorrect ? 1 : 0);

    const newState: QuizState = {
      ...quizState,
      currentQuestionIndex: quizState.currentQuestionIndex - 1,
      answers: newAnswers,
      score: newScore,
    };
    
    setQuizState(newState);
    saveQuizState(newState, currentQuizType);
  }, [quizState, currentQuizType, saveQuizState]);

  const setOnQuizClose = useCallback((callback: ((passed: boolean) => void) | undefined) => {
    setOnQuizCloseCallback(() => callback);
  }, []);

  return (
    <QuizContext.Provider value={{
      quizState,
      isOpen,
      hasPassedQuiz: hasPassedFinal, // Compatibilidade: apenas quiz final conta
      hasPassedIntermediario,
      hasPassedFinal,
      currentQuizType,
      startQuiz,
      submitAnswer,
      resetQuiz,
      closeQuiz,
      openQuiz,
      goToPreviousQuestion,
      onQuizClose: onQuizCloseCallback,
      setOnQuizClose,
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuizContext must be used within QuizProvider");
  }
  return context;
}