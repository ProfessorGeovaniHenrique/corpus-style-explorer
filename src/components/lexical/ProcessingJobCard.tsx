/**
 * ProcessingJobCard
 * Sprint AUD-C1: UI for in-progress annotation job
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProcessingJobCardProps {
  job: {
    id: string;
    artist_name: string;
    status: string;
    chunks_processed: number;
    processed_words: number;
    total_words: number;
    new_words: number;
    cached_words: number;
  };
  progress: number;
  eta?: string;
  wordsPerSecond?: number;
  onCancel: () => void;
}

export function ProcessingJobCard({
  job,
  progress,
  eta,
  wordsPerSecond,
  onCancel,
}: ProcessingJobCardProps) {
  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div className="flex-1">
            <CardTitle className="text-lg">Processando Anotação Semântica</CardTitle>
            <CardDescription className="mt-1">
              {job.artist_name} - Chunk {job.chunks_processed} • {job.status === 'iniciado' ? 'Iniciando...' : 'Processando em auto-invocação'}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {job.processed_words.toLocaleString()} / {job.total_words.toLocaleString()}
          </Badge>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onCancel}
          >
            ⏹️ Interromper
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{job.new_words.toLocaleString()} novas</span>
              <span className="text-muted-foreground/60">•</span>
              <span>{job.cached_words.toLocaleString()} em cache</span>
              {wordsPerSecond && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{wordsPerSecond.toFixed(1)} palavras/s</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>{progress.toFixed(1)}%</span>
              {eta && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-primary font-medium">ETA: {eta}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
