import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSemanticReprocessing } from '@/hooks/useSemanticReprocessing';
import { RefreshCw, Play, Square, BarChart3 } from 'lucide-react';

export function ReprocessingPanel() {
  const {
    stats,
    job,
    isAnalyzing,
    isReprocessing,
    analyzeCandidates,
    startReprocessing,
    cancelReprocessing,
  } = useSemanticReprocessing();

  const [criteria, setCriteria] = useState({
    includeNC: true,
    includeLowConfidence: true,
    confidenceThreshold: 0.80,
    includeGenericN1: true,
  });

  const handleAnalyze = () => {
    analyzeCandidates(criteria);
  };

  const handleReprocess = () => {
    startReprocessing(criteria);
  };

  const progress = job 
    ? (job.processed / job.total_candidates) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Reprocessamento Inteligente
        </CardTitle>
        <CardDescription>
          Reclassifique palavras usando os domínios semânticos atualizados
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Critérios de seleção */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Critérios de Reprocessamento</h4>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nc"
              checked={criteria.includeNC}
              onCheckedChange={(checked) => 
                setCriteria({ ...criteria, includeNC: checked as boolean })
              }
            />
            <label htmlFor="nc" className="text-sm cursor-pointer">
              NC (Não Classificado)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowconf"
              checked={criteria.includeLowConfidence}
              onCheckedChange={(checked) => 
                setCriteria({ ...criteria, includeLowConfidence: checked as boolean })
              }
            />
            <label htmlFor="lowconf" className="text-sm cursor-pointer">
              Baixa Confiança ({'<'}0.80)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="generic"
              checked={criteria.includeGenericN1}
              onCheckedChange={(checked) => 
                setCriteria({ ...criteria, includeGenericN1: checked as boolean })
              }
            />
            <label htmlFor="generic" className="text-sm cursor-pointer">
              N1 Genérico (pode ter N2/N3 melhor)
            </label>
          </div>
        </div>

        {/* Estatísticas preview */}
        {stats && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de candidatos</span>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>• NC (Não Classificado)</span>
                <span>{stats.nc}</span>
              </div>
              <div className="flex justify-between">
                <span>• Baixa confiança</span>
                <span>{stats.lowConfidence}</span>
              </div>
              <div className="flex justify-between">
                <span>• N1 genérico</span>
                <span>{stats.genericN1}</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress durante reprocessamento */}
        {job && isReprocessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <Badge>
                {job.processed} / {job.total_candidates}
              </Badge>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 bg-green-500/10 rounded">
                <div className="text-green-600 font-medium">{job.improved}</div>
                <div className="text-muted-foreground">Melhoradas</div>
              </div>
              <div className="p-2 bg-gray-500/10 rounded">
                <div className="text-gray-600 font-medium">{job.unchanged}</div>
                <div className="text-muted-foreground">Inalteradas</div>
              </div>
              <div className="p-2 bg-red-500/10 rounded">
                <div className="text-red-600 font-medium">{job.failed}</div>
                <div className="text-muted-foreground">Falhas</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Chunks processados: {job.chunks_processed}
            </div>
          </div>
        )}

        {/* Job concluído */}
        {job && job.status === 'concluido' && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm font-medium text-green-600">
              ✅ Reprocessamento concluído!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {job.improved} palavras melhoradas, {job.unchanged} inalteradas
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!isReprocessing && (
          <>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="outline"
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analisando...' : 'Analisar'}
            </Button>
            
            <Button
              onClick={handleReprocess}
              disabled={!stats || isAnalyzing}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Reprocessar
            </Button>
          </>
        )}

        {isReprocessing && (
          <Button
            onClick={cancelReprocessing}
            variant="destructive"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
