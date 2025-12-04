import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Sparkles, Check, ChevronDown, X, AlertTriangle } from 'lucide-react';
import { MultiSelectInsignias } from '@/components/ui/multi-select-insignias';
import { INSIGNIAS_OPTIONS } from '@/data/types/cultural-insignia.types';
import { InsigniaCurationEntry } from '@/hooks/useInsigniaCuration';
import { useAnalyzeSingleInsignia, useApplyAnalysisSuggestion, InsigniaAnalysisResult } from '@/hooks/useInsigniaAnalysis';
import { useUpdateInsignias, useValidateInsignia } from '@/hooks/useInsigniaCuration';

interface InsigniaCurationRowProps {
  entry: InsigniaCurationEntry;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  corpusName?: string;
}

export function InsigniaCurationRow({ entry, isSelected, onSelectionChange, corpusName }: InsigniaCurationRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInsignias, setEditedInsignias] = useState<string[]>(entry.insignias_culturais || []);
  const [analysis, setAnalysis] = useState<InsigniaAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeMutation = useAnalyzeSingleInsignia();
  const applyMutation = useApplyAnalysisSuggestion();
  const updateMutation = useUpdateInsignias();
  const validateMutation = useValidateInsignia();

  const currentInsignias = entry.insignias_culturais || [];
  const isValidated = entry.fonte === 'manual';

  const getInsigniaLabel = (insignia: string) => {
    const option = INSIGNIAS_OPTIONS.find(o => o.value === insignia);
    return option?.label || insignia;
  };

  const handleAnalyze = async () => {
    const result = await analyzeMutation.mutateAsync({ 
      palavra: entry.palavra, 
      corpus: corpusName 
    });
    setAnalysis(result);
    setShowAnalysis(true);
  };

  const handleApplySuggestion = async () => {
    if (!analysis) return;
    await applyMutation.mutateAsync({ 
      id: entry.id, 
      insignias: analysis.insignias_sugeridas 
    });
    setShowAnalysis(false);
    setAnalysis(null);
  };

  const handleRejectSuggestion = () => {
    setShowAnalysis(false);
    setAnalysis(null);
  };

  const handleSaveEdit = async () => {
    await updateMutation.mutateAsync({ id: entry.id, insignias: editedInsignias });
    setIsEditing(false);
  };

  const handleValidate = async () => {
    await validateMutation.mutateAsync(entry.id);
  };

  const isLoading = analyzeMutation.isPending || applyMutation.isPending || updateMutation.isPending || validateMutation.isPending;

  return (
    <tr className={`border-b transition-colors hover:bg-muted/50 ${isValidated ? 'bg-green-50/30 dark:bg-green-950/10' : ''} ${isSelected ? 'bg-primary/5' : ''}`}>
      {/* Checkbox */}
      <td className="p-3 w-10">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelectionChange}
          disabled={isLoading}
        />
      </td>

      {/* Palavra */}
      <td className="p-3 font-medium">
        <div className="flex items-center gap-2">
          {entry.palavra}
          {isValidated && (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
              ✓ Validado
            </Badge>
          )}
        </div>
      </td>

      {/* Insígnias Atuais */}
      <td className="p-3">
        <div className="flex flex-wrap gap-1">
          {currentInsignias.length > 0 ? (
            currentInsignias.map(insignia => (
              <Badge key={insignia} variant="secondary" className="text-xs">
                {getInsigniaLabel(insignia)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Nenhuma</span>
          )}
        </div>

        {/* Analysis Result Inline */}
        {showAnalysis && analysis && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 mb-1">
                  <Sparkles className="h-3 w-3" />
                  Sugestão Gemini ({(analysis.confianca * 100).toFixed(0)}%):
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {analysis.insignias_sugeridas.length > 0 ? (
                    analysis.insignias_sugeridas.map(i => (
                      <Badge key={i} className="text-xs bg-blue-100 text-blue-700">
                        {getInsigniaLabel(i)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem insígnias culturais</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{analysis.justificativa}</p>
                {analysis.conflito_detectado && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Possível conflito com corpus
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 text-green-600"
                  onClick={handleApplySuggestion}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={handleRejectSuggestion}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </td>

      {/* Corpus */}
      <td className="p-3 text-sm text-muted-foreground">
        {corpusName || '-'}
      </td>

      {/* Confiança */}
      <td className="p-3 text-sm">
        {entry.confianca ? `${(entry.confianca * 100).toFixed(0)}%` : '-'}
      </td>

      {/* Ações */}
      <td className="p-3">
        <div className="flex items-center gap-1">
          {/* Analisar */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAnalyze}
            disabled={isLoading || showAnalysis}
            className="h-8 px-2 text-xs"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Analisar
              </>
            )}
          </Button>

          {/* Validar */}
          {!isValidated && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleValidate}
              disabled={isLoading}
              className="h-8 px-2 text-xs text-green-600 hover:text-green-700"
            >
              {validateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Validar
                </>
              )}
            </Button>
          )}

          {/* Editar */}
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="h-8 px-2 text-xs"
              >
                Editar
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <MultiSelectInsignias 
                  value={editedInsignias} 
                  onChange={setEditedInsignias} 
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </td>
    </tr>
  );
}
