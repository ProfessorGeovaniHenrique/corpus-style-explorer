/**
 * AnnotationProgressCard
 * Sprint AUD-C1: Progress display for user corpus annotation
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface AnnotationProgressCardProps {
  step: 'idle' | 'pos' | 'semantic' | 'calculating';
  progress: number;
  message: string;
}

export function AnnotationProgressCard({ step, progress, message }: AnnotationProgressCardProps) {
  if (step === 'idle') return null;
  
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            <Progress value={progress} className="mt-2 h-2" />
          </div>
          <Badge variant="outline">{progress}%</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {step === 'pos' && 'Anotando classes gramaticais com IA...'}
          {step === 'semantic' && 'Classificando domínios semânticos...'}
          {step === 'calculating' && 'Finalizando cálculos de métricas...'}
        </p>
      </CardContent>
    </Card>
  );
}
