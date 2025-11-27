import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, X, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Job {
  id: string;
  artist_name: string;
  status: string;
  processed_words: number;
  total_words: number;
  progress: number;
  tempo_inicio: string;
  tempo_fim: string | null;
  erro_mensagem: string | null;
}

interface AnnotationJobsTableProps {
  jobs: Job[];
  onRefresh: () => void;
}

export function AnnotationJobsTable({ jobs, onRefresh }: AnnotationJobsTableProps) {
  const handleCancel = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('semantic_annotation_jobs')
        .update({ status: 'cancelado' })
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Job cancelado com sucesso');
      onRefresh();
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Erro ao cancelar job');
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('semantic_annotation_jobs')
        .update({ status: 'processando' })
        .eq('id', jobId);

      if (error) throw error;

      // Trigger edge function to resume
      await supabase.functions.invoke('annotate-artist-songs', {
        body: { jobId, resume: true }
      });

      toast.success('Job retomado');
      onRefresh();
    } catch (error) {
      console.error('Error resuming job:', error);
      toast.error('Erro ao retomar job');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processando: { label: '🔄 Processando', variant: 'default' as const },
      pausado: { label: '⏸️ Pausado', variant: 'secondary' as const },
      pendente: { label: '⏳ Pendente', variant: 'outline' as const },
      completo: { label: '✅ Completo', variant: 'default' as const },
      erro: { label: '❌ Erro', variant: 'destructive' as const },
      cancelado: { label: '🚫 Cancelado', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateETA = (job: Job) => {
    if (job.status !== 'processando' || job.processed_words === 0) return 'N/A';
    
    const elapsed = Date.now() - new Date(job.tempo_inicio).getTime();
    const wordsPerMs = job.processed_words / elapsed;
    const remainingWords = job.total_words - job.processed_words;
    const etaMs = remainingWords / wordsPerMs;
    
    return formatDistanceToNow(new Date(Date.now() + etaMs), { 
      locale: ptBR,
      addSuffix: false 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs de Anotação Semântica</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum job ativo no momento
            </p>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{job.artist_name}</h4>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.processed_words.toLocaleString()} / {job.total_words.toLocaleString()} palavras
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Iniciado {formatDistanceToNow(new Date(job.tempo_inicio), { locale: ptBR, addSuffix: true })}
                      {job.status === 'processando' && ` • ETA: ${calculateETA(job)}`}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {job.status === 'pausado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResume(job.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {(job.status === 'processando' || job.status === 'pausado') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(job.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Progress value={job.progress} className="h-2" />
                
                {job.erro_mensagem && (
                  <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                    {job.erro_mensagem}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
