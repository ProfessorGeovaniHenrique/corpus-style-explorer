/**
 * ExistingJobCard
 * Sprint AUD-C1: UI for existing annotation job management
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Loader2, Trash2 } from "lucide-react";

interface ExistingJobCardProps {
  job: {
    id: string;
    artist_name: string;
    status: string;
    processed_words: number;
    total_words: number;
  };
  onResume: () => void;
  onCancel: () => void;
  onRestart: () => void;
  onClear: () => void;
  isResuming: boolean;
}

export function ExistingJobCard({
  job,
  onResume,
  onCancel,
  onRestart,
  onClear,
  isResuming,
}: ExistingJobCardProps) {
  const progressPercent = ((job.processed_words / job.total_words) * 100).toFixed(1);
  
  return (
    <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="w-5 h-5" />
          Processamento em Andamento
        </CardTitle>
        <CardDescription>
          {job.artist_name} - {job.status === 'pausado' ? 'Pausado' : 'Em progresso'} ({progressPercent}% completo)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button 
          onClick={onResume} 
          variant="default" 
          size="sm"
          disabled={isResuming}
        >
          {isResuming ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : '▶️'} 
          {isResuming ? 'Retomando...' : 'Retomar'}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" disabled={isResuming}>
          ❌ Cancelar
        </Button>
        <Button 
          onClick={onRestart} 
          variant="secondary" 
          size="sm"
          disabled={isResuming}
        >
          🔄 Iniciar Novo
        </Button>
        <Button 
          onClick={onClear} 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      </CardContent>
    </Card>
  );
}
