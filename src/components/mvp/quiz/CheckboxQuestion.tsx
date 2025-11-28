import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { QuizQuestion } from "@/types/quiz.types";

interface CheckboxQuestionProps {
  question: QuizQuestion;
  selectedAnswers: string[];
  onAnswerChange: (answers: string[]) => void;
}

export function CheckboxQuestion({ question, selectedAnswers, onAnswerChange }: CheckboxQuestionProps) {
  const handleToggle = (option: string) => {
    const newAnswers = selectedAnswers.includes(option)
      ? selectedAnswers.filter(a => a !== option)
      : [...selectedAnswers, option];
    onAnswerChange(newAnswers);
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <Checkbox
            id={`checkbox-${index}`}
            checked={selectedAnswers.includes(option)}
            onCheckedChange={() => handleToggle(option)}
          />
          <Label htmlFor={`checkbox-${index}`} className="flex-1 cursor-pointer text-sm">
            {option}
          </Label>
        </div>
      ))}
    </div>
  );
}
