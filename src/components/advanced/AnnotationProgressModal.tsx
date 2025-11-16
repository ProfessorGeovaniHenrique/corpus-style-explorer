import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

interface AnnotationProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: AnnotationJob | null;
}

export function AnnotationProgressModal({ open, onOpenChange, job }: AnnotationProgressModalProps) {
  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'processando':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'concluido':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'erro':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Progresso da Anotação Semântica
          </DialogTitle>
          <DialogDescription>
            Corpus: {job.corpus_type.charAt(0).toUpperCase() + job.corpus_type.slice(1)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso Geral</span>
              <span className="font-mono text-lg font-bold">{job.progresso}%</span>
            </div>
            <Progress value={job.progresso} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Palavras Processadas</div>
              <div className="text-2xl font-bold font-mono">{job.palavras_processadas}</div>
              <div className="text-xs text-muted-foreground">de {job.total_palavras}</div>
            </div>

            <div className="space-y-1 p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Palavras Anotadas</div>
              <div className="text-2xl font-bold font-mono text-primary">{job.palavras_anotadas}</div>
              <div className="text-xs text-muted-foreground">
                {job.palavras_processadas > 0 
                  ? `${Math.round((job.palavras_anotadas / job.palavras_processadas) * 100)}% de cobertura`
                  : 'Calculando...'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={job.status === 'concluido' ? 'default' : 'secondary'}>
                {job.status === 'processando' && 'Processando'}
                {job.status === 'concluido' && 'Concluído'}
                {job.status === 'erro' && 'Erro'}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Iniciado em</span>
              <span className="font-mono">{new Date(job.tempo_inicio).toLocaleTimeString('pt-BR')}</span>
            </div>

            {job.tempo_fim && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Concluído em</span>
                <span className="font-mono">{new Date(job.tempo_fim).toLocaleTimeString('pt-BR')}</span>
              </div>
            )}

            {job.erro_mensagem && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <strong>Erro:</strong> {job.erro_mensagem}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
