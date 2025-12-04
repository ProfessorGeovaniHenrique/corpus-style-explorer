import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface UpdateProgressCardProps {
  currentChunk: number;
  totalChunks: number;
  songsProcessed: number;
  totalSongs: number;
  songsUpdated: number;
  songsNotFound: number;
  startTime: number;
}

export function UpdateProgressCard({
  currentChunk,
  totalChunks,
  songsProcessed,
  totalSongs,
  songsUpdated,
  songsNotFound,
  startTime
}: UpdateProgressCardProps) {
  const progressPercent = totalSongs > 0 ? Math.round((songsProcessed / totalSongs) * 100) : 0;
  
  // Calcular tempo estimado restante
  const elapsedMs = Date.now() - startTime;
  const songsPerMs = songsProcessed > 0 ? songsProcessed / elapsedMs : 0;
  const remainingSongs = totalSongs - songsProcessed;
  const estimatedRemainingMs = songsPerMs > 0 ? remainingSongs / songsPerMs : 0;
  
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '0s';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          Atualizando Metadados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Estatísticas em Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Chunk</div>
            <div className="font-semibold">{currentChunk} / {totalChunks}</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Processadas</div>
            <div className="font-semibold">{songsProcessed.toLocaleString()} / {totalSongs.toLocaleString()}</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
              <CheckCircle2 className="h-3 w-3" />
              Atualizadas
            </div>
            <div className="font-semibold text-green-700 dark:text-green-300">{songsUpdated.toLocaleString()}</div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-1">
              <AlertCircle className="h-3 w-3" />
              Não Encontradas
            </div>
            <div className="font-semibold text-amber-700 dark:text-amber-300">{songsNotFound.toLocaleString()}</div>
          </div>
        </div>

        {/* Tempo Estimado */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <Clock className="h-4 w-4" />
          <span>Tempo restante estimado: <strong>{formatTime(estimatedRemainingMs)}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}
