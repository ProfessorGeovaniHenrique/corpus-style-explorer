import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { CorpusType } from "@/data/types/corpus-tools.types";
import { AnnotationProgressModal } from "./AnnotationProgressModal";
import { AnnotationResultsView } from "./AnnotationResultsView";

interface AnnotationJob {
  id: string;
  corpus_type: string;
  status: string;
  progresso: number;
  palavras_processadas: number;
  total_palavras: number;
  palavras_anotadas: number;
  tempo_inicio: string;
  tempo_fim: string | null;
  erro_mensagem: string | null;
}

export function TabSemanticAnnotation() {
  const [selectedCorpus, setSelectedCorpus] = useState<CorpusType>('gaucho');
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentJob, setCurrentJob] = useState<AnnotationJob | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [completedJobId, setCompletedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentJob?.id) return;

    const channel = supabase
      .channel(`job-${currentJob.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'annotation_jobs',
          filter: `id=eq.${currentJob.id}`
        },
        (payload) => {
          const updated = payload.new as AnnotationJob;
          setCurrentJob(updated);
          
          if (updated.status === 'concluido') {
            setIsAnnotating(false);
            setCompletedJobId(updated.id);
            toast.success('Anotação concluída!', {
              description: `${updated.palavras_anotadas} palavras anotadas com sucesso.`
            });
          } else if (updated.status === 'erro') {
            setIsAnnotating(false);
            toast.error('Erro na anotação', {
              description: updated.erro_mensagem || 'Erro desconhecido'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJob?.id]);

  const startAnnotation = async () => {
    try {
      setIsAnnotating(true);
      setShowProgress(true);
      
      const { data, error } = await supabase.functions.invoke('annotate-semantic', {
        body: { corpus_type: selectedCorpus }
      });

      if (error) throw error;
      
      setCurrentJob(data.job);
      toast.success('Anotação iniciada', {
        description: 'O processamento está em andamento...'
      });
    } catch (error: any) {
      setIsAnnotating(false);
      setShowProgress(false);
      toast.error('Erro ao iniciar anotação', {
        description: error.message
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processando':
        return <Badge variant="default" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Processando</Badge>;
      case 'concluido':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" />Concluído</Badge>;
      case 'erro':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Anotação Semântica com IA</CardTitle>
          <CardDescription>
            Sistema híbrido: Léxico Base + Gemini 2.5 Flash para análise contextual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedCorpus} onValueChange={(v) => setSelectedCorpus(v as CorpusType)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gaucho">Corpus Gaúcho</SelectItem>
                <SelectItem value="nordestino">Corpus Nordestino</SelectItem>
                <SelectItem value="marenco-verso">Luiz Marenco - Verso Austral</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={startAnnotation}
              disabled={isAnnotating}
              className="gap-2"
            >
              {isAnnotating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Anotando...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Iniciar Anotação
                </>
              )}
            </Button>
          </div>

          {currentJob && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(currentJob.status)}
                </div>
                
                {currentJob.status === 'processando' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-mono">{currentJob.progresso}%</span>
                      </div>
                      <Progress value={currentJob.progresso} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Processadas:</span>
                        <div className="font-mono font-medium">{currentJob.palavras_processadas}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-mono font-medium">{currentJob.total_palavras}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Anotadas:</span>
                        <div className="font-mono font-medium">{currentJob.palavras_anotadas}</div>
                      </div>
                    </div>
                  </>
                )}

                {currentJob.status === 'concluido' && (
                  <div className="text-sm text-muted-foreground">
                    Concluído em {new Date(currentJob.tempo_fim!).toLocaleString('pt-BR')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {completedJobId && <AnnotationResultsView jobId={completedJobId} />}

      <AnnotationProgressModal 
        open={showProgress} 
        onOpenChange={setShowProgress}
        job={currentJob}
      />
    </div>
  );
}
