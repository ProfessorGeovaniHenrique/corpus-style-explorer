import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ThumbsUp, ThumbsDown, MessageSquare, Filter, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { SectionLoading } from '@/components/ui/loading-spinner';
import { useAIAnalysisHistory, useSuggestionStatus } from '@/hooks/useAIAnalysisHistory';
import { useAIAnalysisFeedback } from '@/hooks/useAIAnalysisFeedback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'ai-review-progress';

interface ReviewProgress {
  selectedAnalysisId: string | null;
  reviewedSuggestions: string[];
  lastUpdated: string;
}

export function AIAnalysisReview() {
  const { analyses, isLoading: analysesLoading } = useAIAnalysisHistory();
  
  // Restaurar progresso do localStorage
  const getSavedProgress = (): ReviewProgress | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedProgress = getSavedProgress();
  
  // Auto-selecionar última análise ou restaurar do localStorage
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    savedProgress?.selectedAnalysisId || null
  );
  const [reviewingSuggestionId, setReviewingSuggestionId] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  
  // Filtros
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Auto-selecionar última análise quando carregar
  useEffect(() => {
    if (!selectedAnalysisId && analyses.length > 0) {
      // Verificar se há análise salva válida
      if (savedProgress?.selectedAnalysisId && analyses.find(a => a.id === savedProgress.selectedAnalysisId)) {
        setSelectedAnalysisId(savedProgress.selectedAnalysisId);
      } else {
        // Selecionar análise mais recente
        setSelectedAnalysisId(analyses[0].id);
      }
    }
  }, [analyses, selectedAnalysisId, savedProgress?.selectedAnalysisId]);

  const { suggestions, stats: suggestionStats, isLoading: suggestionsLoading } = useSuggestionStatus(selectedAnalysisId || undefined);
  const { feedback, stats: feedbackStats, submitFeedback, isSubmitting } = useAIAnalysisFeedback(
    selectedAnalysisId || undefined
  );

  // Persistir progresso no localStorage
  useEffect(() => {
    if (selectedAnalysisId) {
      const progress: ReviewProgress = {
        selectedAnalysisId,
        reviewedSuggestions: feedback.map(f => f.suggestion_id),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [selectedAnalysisId, feedback]);

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);
  const reviewingSuggestion = suggestions.find(s => s.suggestion_id === reviewingSuggestionId);

  // Filtrar sugestões
  const filteredSuggestions = suggestions.filter(suggestion => {
    const hasFeedback = feedback.some(f => f.suggestion_id === suggestion.suggestion_id);
    
    if (severityFilter && suggestion.severity !== severityFilter) return false;
    if (statusFilter === 'pending' && hasFeedback) return false;
    if (statusFilter === 'reviewed' && !hasFeedback) return false;
    
    return true;
  });

  const handleSubmitFeedback = (verdict: 'valid' | 'false_positive' | 'already_fixed') => {
    if (!reviewingSuggestionId) return;

    submitFeedback(
      {
        suggestionId: reviewingSuggestionId,
        verdict,
        notes: feedbackNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReviewingSuggestionId(null);
          setFeedbackNotes('');
        },
      }
    );
  };

  const getVerificationBadge = (suggestion: typeof suggestions[0]) => {
    const feedbackItem = feedback.find(f => f.suggestion_id === suggestion.suggestion_id);
    
    if (feedbackItem) {
      if (feedbackItem.human_verdict === 'valid') {
        return <Badge variant="default" className="gap-1"><ThumbsUp className="w-3 h-3" /> Válido</Badge>;
      }
      if (feedbackItem.human_verdict === 'false_positive') {
        return <Badge variant="destructive" className="gap-1"><ThumbsDown className="w-3 h-3" /> Falso Positivo</Badge>;
      }
      return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Já Corrigido</Badge>;
    }

    if (suggestion.verification_status === 'human-verified') {
      return <Badge variant="default" className="gap-1"><ThumbsUp className="w-3 h-3" /> Verificado</Badge>;
    }
    if (suggestion.verification_status === 'auto-verified') {
      return <Badge variant="outline" className="gap-1"><AlertTriangle className="w-3 h-3" /> Auto-Verificado</Badge>;
    }
    if (suggestion.verification_status === 'false-positive') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Falso Positivo</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const getConfidenceBadge = (score: number | null) => {
    if (score === null || score === undefined) return null;
    
    let variant: 'default' | 'secondary' | 'destructive' = 'default';
    if (score < 60) variant = 'destructive';
    else if (score < 80) variant = 'secondary';

    return (
      <Badge variant={variant} className="gap-1">
        {score}% confiança
      </Badge>
    );
  };

  // Loading state padronizado
  if (analysesLoading) {
    return <SectionLoading text="Carregando análises..." />;
  }

  // Empty state informativo
  if (!analyses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review de Análises Automáticas
          </CardTitle>
          <CardDescription>Validação humana das sugestões geradas pelo sistema</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma análise disponível</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Execute uma análise no painel de IA Assistant para gerar sugestões que podem ser revisadas aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com seletor de análise e estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review de Análise Automática
          </CardTitle>
          <CardDescription>
            Validação humana das sugestões geradas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletor de Análise */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Análise:
            </label>
            <Select value={selectedAnalysisId || ''} onValueChange={setSelectedAnalysisId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma análise" />
              </SelectTrigger>
              <SelectContent>
                {analyses.map((analysis) => (
                  <SelectItem key={analysis.id} value={analysis.id}>
                    {analysis.logs_type} - {new Date(analysis.created_at).toLocaleDateString('pt-BR')} ({analysis.total_issues} issues)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estatísticas */}
          {suggestionsLoading ? (
            <SectionLoading text="Carregando sugestões..." />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total de Sugestões</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{suggestionStats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Validadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{feedbackStats.valid}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Falsos Positivos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">{feedbackStats.falsePositives}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Já Corrigidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{feedbackStats.alreadyFixed}</p>
                  </CardContent>
                </Card>
              </div>

              {suggestionStats.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Review</span>
                    <span>{Math.round((feedbackStats.total / suggestionStats.total) * 100)}%</span>
                  </div>
                  <Progress value={(feedbackStats.total / suggestionStats.total) * 100} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="reviewed">Revisados</SelectItem>
              </SelectContent>
            </Select>

            {(severityFilter || statusFilter) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSeverityFilter('');
                  setStatusFilter('');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de sugestões para review */}
      {filteredSuggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {statusFilter === 'pending' ? 'Todas revisadas!' : 'Nenhuma sugestão encontrada'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {statusFilter === 'pending' 
                ? 'Parabéns! Você revisou todas as sugestões desta análise.'
                : 'Ajuste os filtros para ver mais sugestões.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion) => {
            const hasFeedback = feedback.some(f => f.suggestion_id === suggestion.suggestion_id);

            return (
              <Card key={suggestion.id} className={hasFeedback ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={suggestion.severity === 'Crítico' ? 'destructive' : 'outline'}>
                          {suggestion.severity}
                        </Badge>
                        <Badge variant="secondary">{suggestion.category}</Badge>
                        {getConfidenceBadge(suggestion.confidence_score)}
                        {getVerificationBadge(suggestion)}
                      </div>
                    </div>
                    {!hasFeedback && (
                      <Button
                        size="sm"
                        onClick={() => setReviewingSuggestionId(suggestion.suggestion_id)}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Review */}
      <Dialog open={!!reviewingSuggestionId} onOpenChange={() => setReviewingSuggestionId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review da Sugestão</DialogTitle>
            <DialogDescription>
              Valide se esta sugestão computacional é precisa e relevante
            </DialogDescription>
          </DialogHeader>

          {reviewingSuggestion && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{reviewingSuggestion.title}</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={reviewingSuggestion.severity === 'Crítico' ? 'destructive' : 'outline'}>
                    {reviewingSuggestion.severity}
                  </Badge>
                  <Badge variant="secondary">{reviewingSuggestion.category}</Badge>
                  {getConfidenceBadge(reviewingSuggestion.confidence_score)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notas (opcional)
                </label>
                <Textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta sugestão..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmitFeedback('already_fixed')}
              disabled={isSubmitting}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Já Corrigido
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleSubmitFeedback('false_positive')}
              disabled={isSubmitting}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Falso Positivo
            </Button>
            <Button
              onClick={() => handleSubmitFeedback('valid')}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Válido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
