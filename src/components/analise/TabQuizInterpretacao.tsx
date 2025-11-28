import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDashboardAnaliseContext } from '@/contexts/DashboardAnaliseContext';
import { generateInterpretationQuestions, QuizQuestion } from '@/data/quizQuestionsInterpretacao';
import { Brain, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface TabQuizInterpretacaoProps {
  onComplete: () => void;
}

export function TabQuizInterpretacao({ onComplete }: TabQuizInterpretacaoProps) {
  const { processamentoData } = useDashboardAnaliseContext();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  useEffect(() => {
    if (processamentoData.analysisResults) {
      const generatedQuestions = generateInterpretationQuestions(
        processamentoData.analysisResults.dominios,
        processamentoData.analysisResults.keywords
      );
      setQuestions(generatedQuestions);
    }
  }, [processamentoData.analysisResults]);

  if (!processamentoData.isProcessed || questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Quiz de Interpretação
          </CardTitle>
          <CardDescription>
            Complete a análise de domínios para desbloquear o quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Processe um corpus na aba <strong>Processamento</strong> para gerar perguntas de interpretação dos dados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answerId: string) => {
    if (!showFeedback) {
      setSelectedAnswer(answerId);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const selectedOption = currentQuestion.options.find(opt => opt.id === selectedAnswer);
    const isCorrect = selectedOption?.isCorrect || false;

    setShowFeedback(true);
    setAnswers([...answers, isCorrect]);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowFeedback(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const selectedOption = currentQuestion.options.find(opt => opt.id === selectedAnswer);

  return (
    <div className="space-y-4">
      {/* Header do Quiz */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Quiz de Interpretação de Dados
              </CardTitle>
              <CardDescription>
                Teste sua compreensão sobre a análise estatística do corpus
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{score}/{questions.length}</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Questão Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty === 'easy' && 'Fácil'}
              {currentQuestion.difficulty === 'medium' && 'Médio'}
              {currentQuestion.difficulty === 'hard' && 'Difícil'}
            </Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={showFeedback}>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-start space-x-3 rounded-lg border-2 p-4 transition-all ${
                    selectedAnswer === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${
                    showFeedback && option.isCorrect
                      ? 'border-green-500 bg-green-50'
                      : showFeedback && selectedAnswer === option.id && !option.isCorrect
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer text-sm leading-relaxed"
                  >
                    {option.text}
                    {showFeedback && option.isCorrect && (
                      <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-600" />
                    )}
                    {showFeedback && selectedAnswer === option.id && !option.isCorrect && (
                      <XCircle className="inline ml-2 h-4 w-4 text-red-600" />
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Feedback após responder */}
          {showFeedback && (
            <Alert className={selectedOption?.isCorrect ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm leading-relaxed">
                <strong className="block mb-2">
                  {selectedOption?.isCorrect ? '✅ Correto!' : '📚 Explicação:'}
                </strong>
                {currentQuestion.explanation}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4">
            {!showFeedback ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                size="lg"
              >
                Responder
              </Button>
            ) : (
              <Button onClick={handleNext} size="lg">
                {isLastQuestion ? (
                  <>
                    Concluir Quiz
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Próxima Questão
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
