/**
 * Dashboard de Análise de Mesclagem de Tagsets
 * Detecta sobreposições e sugere ações via IA
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, GitMerge, Sparkles, AlertCircle, Info } from "lucide-react";
import { detectOverlappingTagsets, detectCrossOverlaps, OverlapPair } from "@/lib/tagsetOverlapDetection";
import { MergeSuggestionDialog } from "./MergeSuggestionDialog";
import { useTagsetMerge } from "@/hooks/useTagsetMerge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tagset } from "@/hooks/useTagsets";

interface Props {
  tagsets: Tagset[];
  onMergeApplied: () => void;
}

type AnalysisMode = 'active-vs-active' | 'pending-vs-pending' | 'pending-vs-active';

interface MergeSuggestion {
  recommendation: 'merge' | 'keep_separate' | 'reorganize' | 'split' | 'incorporate' | 'enhance' | 'reject_pending';
  confidence: number;
  justification: string;
  mergeStrategy?: any;
  splitStrategy?: any;
  reorganizeStrategy?: any;
  incorporateStrategy?: any;
  enhanceStrategy?: any;
  warnings: string[];
}

export const TagsetMergeAnalysisDashboard = ({ tagsets, onMergeApplied }: Props) => {
  const [mode, setMode] = useState<AnalysisMode>('active-vs-active');
  const [threshold, setThreshold] = useState(0.3);
  const [overlaps, setOverlaps] = useState<OverlapPair[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPair, setSelectedPair] = useState<OverlapPair | null>(null);
  const [suggestion, setSuggestion] = useState<MergeSuggestion | null>(null);
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mergeTagsets, splitTagset, incorporateIntoPending, rejectAsDuplicate, isMerging, isSplitting, isIncorporating, isRejecting } = useTagsetMerge();

  // Filtrar tagsets por status
  const activeTagsets = useMemo(
    () => tagsets.filter(t => t.status === 'ativo'),
    [tagsets]
  );
  
  const pendingTagsets = useMemo(
    () => tagsets.filter(t => t.status === 'proposto'),
    [tagsets]
  );

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    let detected: OverlapPair[] = [];
    
    if (mode === 'active-vs-active') {
      detected = detectOverlappingTagsets(activeTagsets, threshold);
    } else if (mode === 'pending-vs-pending') {
      detected = detectOverlappingTagsets(pendingTagsets, threshold);
    } else if (mode === 'pending-vs-active') {
      detected = detectCrossOverlaps(pendingTagsets, activeTagsets, threshold);
    }
    
    setOverlaps(detected);
    setIsAnalyzing(false);
    toast.success(`Encontrados ${detected.length} pares com sobreposição`);
  };

  const handleRequestSuggestion = async (pair: OverlapPair) => {
    setSelectedPair(pair);
    setIsFetchingSuggestion(true);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-tagset-merge', {
        body: {
          tagsetA: pair.tagsetA,
          tagsetB: pair.tagsetB,
          similarity: pair.similarity,
          allTagsets: activeTagsets,
          analysisMode: mode
        }
      });

      if (error) throw error;

      setSuggestion(data as MergeSuggestion);
      setDialogOpen(true);
    } catch (error) {
      console.error('Erro ao buscar sugestão:', error);
      toast.error('Erro ao buscar sugestão da IA');
    } finally {
      setIsFetchingSuggestion(false);
    }
  };

  const handleApplyMerge = async (
    survivorId: string,
    absorbedId: string,
    mergedData: Partial<Tagset>
  ) => {
    try {
      await mergeTagsets({ survivorId, absorbedId, mergedData });
      setDialogOpen(false);
      setSelectedPair(null);
      setSuggestion(null);
      onMergeApplied();
      // Re-analisar após aplicar
      handleAnalyze();
    } catch (error) {
      console.error('Erro ao aplicar mesclagem:', error);
    }
  };

  const handleApplySplit = async (
    originalId: string,
    newTagsets: any[],
    rejectionReason: string
  ) => {
    try {
      await splitTagset({ originalId, newTagsets, rejectionReason });
      setDialogOpen(false);
      setSelectedPair(null);
      setSuggestion(null);
      onMergeApplied();
      handleAnalyze();
    } catch (error) {
      console.error('Erro ao aplicar divisão:', error);
    }
  };

  const handleApplyIncorporate = async (
    activeId: string,
    pendingId: string,
    newExamples: string[],
    enhancedDescription: string
  ) => {
    try {
      await incorporateIntoPending({ activeId, pendingId, newExamples, enhancedDescription });
      setDialogOpen(false);
      setSelectedPair(null);
      setSuggestion(null);
      onMergeApplied();
      handleAnalyze();
    } catch (error) {
      console.error('Erro ao incorporar:', error);
    }
  };

  const handleApplyReject = async (pendingId: string, reason: string) => {
    try {
      await rejectAsDuplicate({ pendingId, reason });
      setDialogOpen(false);
      setSelectedPair(null);
      setSuggestion(null);
      onMergeApplied();
      handleAnalyze();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  // Agrupar por tipo de sobreposição
  const groupedOverlaps = useMemo(() => {
    return {
      high: overlaps.filter(o => o.overlapType === 'high'),
      medium: overlaps.filter(o => o.overlapType === 'medium'),
      low: overlaps.filter(o => o.overlapType === 'low'),
    };
  }, [overlaps]);

  // Estatísticas por modo
  const modeStats = useMemo(() => {
    if (mode === 'active-vs-active') {
      return {
        label: 'Ativos vs Ativos',
        description: 'Consolidar domínios validados redundantes',
        count: activeTagsets.length
      };
    } else if (mode === 'pending-vs-pending') {
      return {
        label: 'Pendentes vs Pendentes',
        description: 'Reduzir duplicados ANTES da validação',
        count: pendingTagsets.length
      };
    } else {
      return {
        label: 'Pendentes vs Ativos',
        description: 'Enriquecer domínios validados com novos exemplos',
        count: `${pendingTagsets.length} pendentes × ${activeTagsets.length} ativos`
      };
    }
  }, [mode, activeTagsets.length, pendingTagsets.length]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Análise de Sobreposições de Domínios Semânticos
          </CardTitle>
          <CardDescription>
            Detecte tagsets redundantes ou sobrepostos e receba sugestões da IA para consolidação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modo de Análise */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <Label className="text-sm font-semibold">Modo de Análise</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as AnalysisMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active-vs-active" id="mode-active" />
                <Label htmlFor="mode-active" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      ✓ Validados
                    </Badge>
                    <span>vs</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      ✓ Validados
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({activeTagsets.length} domínios)
                    </span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending-vs-pending" id="mode-pending" />
                <Label htmlFor="mode-pending" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      ⏳ Pendentes
                    </Badge>
                    <span>vs</span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      ⏳ Pendentes
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({pendingTagsets.length} domínios)
                    </span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending-vs-active" id="mode-cross" />
                <Label htmlFor="mode-cross" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      ⏳ Pendentes
                    </Badge>
                    <span>vs</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      ✓ Validados
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({pendingTagsets.length} × {activeTagsets.length} comparações)
                    </span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
            <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <div>
                <strong>{modeStats.label}:</strong> {modeStats.description}
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || (mode === 'active-vs-active' && activeTagsets.length < 2) || (mode === 'pending-vs-pending' && pendingTagsets.length < 2) || (mode === 'pending-vs-active' && (pendingTagsets.length === 0 || activeTagsets.length === 0))}
            >
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analisar Sobreposições
            </Button>
            
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm text-muted-foreground">Threshold:</span>
              <Slider
                value={[threshold * 100]}
                onValueChange={(v) => setThreshold(v[0] / 100)}
                min={10}
                max={90}
                step={5}
                className="flex-1 max-w-xs"
              />
              <Badge variant="outline">{(threshold * 100).toFixed(0)}%</Badge>
            </div>
          </div>

          {/* Resultados */}
          {overlaps.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  📊 Encontrados: {overlaps.length} pares com sobreposição
                </h3>

                {/* Alta sobreposição */}
                {groupedOverlaps.high.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                      🔴 Alta (&gt;70%) - {groupedOverlaps.high.length} pares
                    </h4>
                    {groupedOverlaps.high.map((pair, idx) => (
                      <OverlapCard
                        key={idx}
                        pair={pair}
                        mode={mode}
                        onRequestSuggestion={handleRequestSuggestion}
                        isLoading={isFetchingSuggestion && selectedPair === pair}
                      />
                    ))}
                  </div>
                )}

                {/* Média sobreposição */}
                {groupedOverlaps.medium.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                      🟡 Média (40-70%) - {groupedOverlaps.medium.length} pares
                    </h4>
                    {groupedOverlaps.medium.map((pair, idx) => (
                      <OverlapCard
                        key={idx}
                        pair={pair}
                        mode={mode}
                        onRequestSuggestion={handleRequestSuggestion}
                        isLoading={isFetchingSuggestion && selectedPair === pair}
                      />
                    ))}
                  </div>
                )}

                {/* Baixa sobreposição */}
                {groupedOverlaps.low.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                      🟢 Baixa (30-40%) - {groupedOverlaps.low.length} pares
                    </h4>
                    {groupedOverlaps.low.map((pair, idx) => (
                      <OverlapCard
                        key={idx}
                        pair={pair}
                        mode={mode}
                        onRequestSuggestion={handleRequestSuggestion}
                        isLoading={isFetchingSuggestion && selectedPair === pair}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {overlaps.length === 0 && !isAnalyzing && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Clique em "Analisar Sobreposições" para detectar tagsets redundantes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Sugestão */}
      <MergeSuggestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tagsetA={selectedPair?.tagsetA!}
        tagsetB={selectedPair?.tagsetB!}
        suggestion={suggestion}
        mode={mode}
        onApplyMerge={handleApplyMerge}
        onApplySplit={handleApplySplit}
        onApplyIncorporate={handleApplyIncorporate}
        onApplyReject={handleApplyReject}
        isProcessing={isMerging || isSplitting || isIncorporating || isRejecting}
      />
    </>
  );
};

interface OverlapCardProps {
  pair: OverlapPair;
  mode: AnalysisMode;
  onRequestSuggestion: (pair: OverlapPair) => void;
  isLoading: boolean;
}

const OverlapCard = ({ pair, mode, onRequestSuggestion, isLoading }: OverlapCardProps) => {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pair.tagsetA.codigo}</Badge>
            <span className="font-semibold">{pair.tagsetA.nome}</span>
            <Badge 
              variant="outline" 
              className={pair.tagsetA.status === 'ativo' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}
            >
              {pair.tagsetA.status === 'ativo' ? '✓' : '⏳'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {pair.tagsetA.descricao?.substring(0, 100)}...
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center px-4">
          <GitMerge className="h-6 w-6 text-muted-foreground mb-1" />
          <Badge className="bg-primary text-primary-foreground">
            {(pair.similarity * 100).toFixed(0)}%
          </Badge>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pair.tagsetB.codigo}</Badge>
            <span className="font-semibold">{pair.tagsetB.nome}</span>
            <Badge 
              variant="outline" 
              className={pair.tagsetB.status === 'ativo' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}
            >
              {pair.tagsetB.status === 'ativo' ? '✓' : '⏳'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {pair.tagsetB.descricao?.substring(0, 100)}...
          </div>
        </div>
      </div>

      {/* Detalhes de sobreposição */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div>
          <strong>Exemplos comuns:</strong>{' '}
          {pair.commonExamples.length > 0 
            ? pair.commonExamples.slice(0, 3).join(', ') 
            : 'Nenhum'}
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div>
          <strong>Palavras comuns:</strong> {pair.commonWords.length}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => onRequestSuggestion(pair)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Sugerir Mesclagem (IA)
        </Button>
      </div>
    </div>
  );
};
