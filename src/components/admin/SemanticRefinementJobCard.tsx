import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useSemanticRefinementJob } from '@/hooks/useSemanticRefinementJob';

interface Props {
  mgCount: number;
  dsCount: number;
}

export function SemanticRefinementJobCard({ mgCount, dsCount }: Props) {
  const {
    activeJob,
    isLoading,
    progress,
    eta,
    startJob,
    pauseJob,
    resumeJob,
    cancelJob,
  } = useSemanticRefinementJob();

  const [selectedDomain, setSelectedDomain] = useState<'MG' | 'DS' | 'all'>('MG');
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt5'>('gemini');

  const totalCount = mgCount + dsCount;

  const getCountForDomain = (domain: 'MG' | 'DS' | 'all') => {
    if (domain === 'MG') return mgCount;
    if (domain === 'DS') return dsCount;
    return totalCount;
  };

  const handleStart = () => {
    const filter = selectedDomain === 'all' ? null : selectedDomain;
    startJob(filter, selectedModel);
  };

  const getStatusBadge = () => {
    if (!activeJob) return null;

    const statusConfig = {
      pendente: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      processando: { label: 'Processando', variant: 'default' as const, icon: RefreshCw },
      pausado: { label: 'Pausado', variant: 'outline' as const, icon: Pause },
      concluido: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      erro: { label: 'Erro', variant: 'destructive' as const, icon: AlertTriangle },
      cancelado: { label: 'Cancelado', variant: 'secondary' as const, icon: Square },
    };

    const config = statusConfig[activeJob.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${activeJob.status === 'processando' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const getDomainLabel = (filter: string | null) => {
    if (filter === 'MG') return 'MG (Marcadores Gramaticais)';
    if (filter === 'DS') return 'DS (Domínios Semânticos)';
    return 'Todos os domínios';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refinamento Automático
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Job Display */}
        {activeJob && activeJob.status !== 'concluido' && activeJob.status !== 'cancelado' ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {getDomainLabel(activeJob.domain_filter)} • {activeJob.model === 'gpt5' ? 'GPT-5' : 'Gemini'}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{activeJob.processed.toLocaleString()} / {activeJob.total_words.toLocaleString()}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded">
                <div className="font-medium text-green-600">{activeJob.refined.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Refinados</div>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <div className="font-medium text-red-600">{activeJob.errors}</div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <div className="font-medium">{eta || '-'}</div>
                <div className="text-xs text-muted-foreground">Tempo restante</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {activeJob.status === 'processando' ? (
                <Button variant="outline" size="sm" onClick={pauseJob} className="flex-1">
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              ) : activeJob.status === 'pausado' ? (
                <Button variant="default" size="sm" onClick={resumeJob} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
              ) : null}
              <Button variant="destructive" size="sm" onClick={cancelJob}>
                <Square className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          /* Start New Job Form */
          <div className="space-y-4">
            {/* Domain Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Domínio a refinar</Label>
              <RadioGroup 
                value={selectedDomain} 
                onValueChange={(v) => setSelectedDomain(v as 'MG' | 'DS' | 'all')}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MG" id="domain-mg" />
                  <Label htmlFor="domain-mg" className="text-sm cursor-pointer">
                    MG ({mgCount.toLocaleString()})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DS" id="domain-ds" />
                  <Label htmlFor="domain-ds" className="text-sm cursor-pointer">
                    Outros ({dsCount.toLocaleString()})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="domain-all" />
                  <Label htmlFor="domain-all" className="text-sm cursor-pointer">
                    Todos ({totalCount.toLocaleString()})
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Modelo de IA</Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('gemini')}
                  className={selectedModel === 'gemini' ? 'bg-primary' : ''}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Gemini (rápido)
                </Button>
                <Button
                  variant={selectedModel === 'gpt5' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('gpt5')}
                  className={selectedModel === 'gpt5' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  GPT-5 (preciso)
                </Button>
              </div>
            </div>

            {/* Estimation */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              Tempo estimado: ~{Math.ceil(getCountForDomain(selectedDomain) / 50 * 2)} minutos 
              ({Math.ceil(getCountForDomain(selectedDomain) / 50)} chunks de 50 palavras)
            </div>

            {/* Start Button */}
            <Button 
              onClick={handleStart} 
              disabled={isLoading || getCountForDomain(selectedDomain) === 0}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Refinamento Automático
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
