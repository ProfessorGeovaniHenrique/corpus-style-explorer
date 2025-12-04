import { useState } from "react";
import { ChevronRight, ChevronDown, Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface QuizOptionsTreeProps {
  type: 'objective' | 'checkbox' | 'matching';
  options?: string[];
  correctAnswers: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  defaultOpen?: boolean;
}

export function QuizOptionsTree({ 
  type, 
  options = [], 
  correctAnswers, 
  matchingPairs = [],
  defaultOpen = false 
}: QuizOptionsTreeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const renderOptionsSummary = () => {
    if (type === 'matching') {
      return `${matchingPairs.filter(p => p.left && p.right).length} pares`;
    }
    const correctCount = options.filter(opt => correctAnswers.includes(opt)).length;
    return `${options.filter(Boolean).length} opções (${correctCount} correta${correctCount !== 1 ? 's' : ''})`;
  };

  const renderOptions = () => {
    if (type === 'matching') {
      return (
        <div className="space-y-1 mt-2 ml-4">
          {matchingPairs.filter(p => p.left || p.right).map((pair, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              <span className="px-2 py-0.5 bg-primary/10 rounded text-primary font-medium">
                {pair.left || '(vazio)'}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="px-2 py-0.5 bg-secondary/50 rounded">
                {pair.right || '(vazio)'}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1 mt-2 ml-4">
        {options.filter(Boolean).map((opt, i) => {
          const isCorrect = correctAnswers.includes(opt);
          return (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-2 text-sm py-1 px-2 rounded",
                isCorrect ? "bg-green-500/10" : "bg-muted/50"
              )}
            >
              {isCorrect ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={cn(isCorrect && "font-medium text-green-700 dark:text-green-400")}>
                {opt}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{renderOptionsSummary()}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {renderOptions()}
      </CollapsibleContent>
    </Collapsible>
  );
}
