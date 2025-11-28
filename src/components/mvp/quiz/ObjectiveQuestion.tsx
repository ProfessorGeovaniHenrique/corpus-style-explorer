import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuizQuestion } from "@/types/quiz.types";

interface ObjectiveQuestionProps {
  question: QuizQuestion;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
}

export function ObjectiveQuestion({ question, selectedAnswer, onAnswerChange }: ObjectiveQuestionProps) {
  return (
    <RadioGroup value={selectedAnswer || undefined} onValueChange={onAnswerChange}>
      <div className="space-y-3">
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm">
              {option}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}
