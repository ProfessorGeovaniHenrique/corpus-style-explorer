import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, Music, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MusicImportProgressModalProps {
  open: boolean;
  totalSongs: number;
  isProcessing?: boolean;
  result?: { songsCreated: number; artistsCreated: number } | null;
  error?: string | null;
}

export function MusicImportProgressModal({
  open,
  totalSongs,
  isProcessing = false,
  result = null,
  error = null
}: MusicImportProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [simulatedSongs, setSimulatedSongs] = useState(0);
  const [simulatedArtists, setSimulatedArtists] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset quando fechar
      setProgress(0);
      setSimulatedSongs(0);
      setSimulatedArtists(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    if (isProcessing && !result && !error) {
      // Simular progresso enquanto processa
      setProgress(5);
      
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          // Progresso mais rápido no início, mais lento perto do fim
          const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 90 ? 1 : 0.5;
          const next = Math.min(95, prev + increment);
          
          // Atualizar músicas e artistas simulados
          const songProgress = Math.floor((next / 100) * totalSongs);
          setSimulatedSongs(songProgress);
          setSimulatedArtists(Math.floor(songProgress * 0.3)); // ~30% de artistas únicos
          
          return next;
        });
      }, 400);
    } else if (result) {
      // Completar progresso quando tiver resultado
      setProgress(100);
      setSimulatedSongs(result.songsCreated);
      setSimulatedArtists(result.artistsCreated);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [open, isProcessing, result, error, totalSongs]);

  const getStageMessage = () => {
    if (error) return 'Erro na importação';
    if (result) return 'Importação concluída!';
    if (progress < 20) return 'Preparando importação...';
    if (progress < 50) return 'Criando artistas e músicas...';
    if (progress < 90) return 'Finalizando importação...';
    return 'Concluindo processo...';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Importação Concluída
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                Erro na Importação
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Importando Músicas
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {getStageMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% completo
            </p>
          </div>

          {/* Stats Grid */}
          {progress > 10 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
                <Music className="h-5 w-5 mx-auto text-primary" />
                <div className="text-2xl font-bold">{simulatedSongs}</div>
                <div className="text-xs text-muted-foreground">
                  {result ? 'Músicas Importadas' : 'Processando...'}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
                <Users className="h-5 w-5 mx-auto text-blue-500" />
                <div className="text-2xl font-bold">{simulatedArtists}</div>
                <div className="text-xs text-muted-foreground">
                  {result ? 'Artistas Criados' : 'Criando...'}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {result && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {result.songsCreated} músicas e {result.artistsCreated} artistas foram importados com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
