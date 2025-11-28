import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizState } from "@/types/quiz.types";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface QuizResultsProps {
  quizState: QuizState;
  onRestart: () => void;
  onClose: () => void;
}

export function QuizResults({ quizState, onRestart, onClose }: QuizResultsProps) {
  const percentage = Math.round((quizState.score / quizState.questions.length) * 100);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Resultado Final: {quizState.score}/{quizState.questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-5xl font-bold text-primary">{percentage}%</div>
            <p className="text-muted-foreground">
              {percentage >= 80 && "Excelente! Você dominou o conteúdo! 🎉"}
              {percentage >= 60 && percentage < 80 && "Bom trabalho! Revise alguns pontos. 👍"}
              {percentage < 60 && "Continue estudando! Revise as abas anteriores. 📚"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Revisão das Respostas</h3>
        {quizState.questions.map((question, index) => {
          const answer = quizState.answers[index];
          return (
            <Card key={question.id} className={answer.isCorrect ? "border-green-500/50" : "border-red-500/50"}>
              <CardHeader>
                <CardTitle className="text-sm flex items-start gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{question.question}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Sua resposta: </span>
                  <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                    {answer.userAnswers.join(", ")}
                  </span>
                </div>
                {!answer.isCorrect && (
                  <div>
                    <span className="font-medium">Resposta correta: </span>
                    <span className="text-green-600">{question.correctAnswers.join(", ")}</span>
                  </div>
                )}
                {question.explanation && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">💡 Explicação: </span>
                    <span className="text-muted-foreground">{question.explanation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button onClick={onRestart} className="flex-1" variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
        <Button onClick={onClose} className="flex-1">
          Voltar ao Conteúdo
        </Button>
      </div>
    </div>
  );
}
