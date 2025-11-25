import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QualityMetrics {
  totalEntries: number;
  byValidationStatus: {
    pending: number;
    approved: number;
    rejected: number;
    corrected: number;
  };
  lowConfidence: number;
  byPOS: Record<string, number>;
  fieldCoverage: {
    withEtymology: number;
    withSynonyms: number;
    withExamples: number;
  };
  qualityScore: number;
}

async function fetchQualityMetrics(): Promise<QualityMetrics> {
  // Fetch dialectal data
  const { data: dialectalData } = await supabase
    .from('dialectal_lexicon')
    .select('validation_status, confianca_extracao, classe_gramatical, definicoes, sinonimos');

  // Fetch gutenberg data
  const { data: gutenbergData } = await supabase
    .from('gutenberg_lexicon')
    .select('validation_status, confianca_extracao, classe_gramatical, definicoes, sinonimos, etimologia, exemplos');

  const allData = [...(dialectalData || []), ...(gutenbergData || [])];
  const totalEntries = allData.length;

  // Count by validation status
  const byValidationStatus = {
    pending: allData.filter(d => !d.validation_status || d.validation_status === 'pending').length,
    approved: allData.filter(d => d.validation_status === 'approved').length,
    rejected: allData.filter(d => d.validation_status === 'rejected').length,
    corrected: allData.filter(d => d.validation_status === 'corrected').length,
  };

  // Count low confidence
  const lowConfidence = allData.filter(d => (d.confianca_extracao || 0) < 0.7).length;

  // Count by POS
  const byPOS: Record<string, number> = {};
  allData.forEach(d => {
    const pos = d.classe_gramatical || 'indefinido';
    byPOS[pos] = (byPOS[pos] || 0) + 1;
  });

  // Field coverage (only gutenberg has these fields)
  const gutenbergTotal = gutenbergData?.length || 1;
  const fieldCoverage = {
    withEtymology: gutenbergData?.filter(d => d.etimologia).length || 0,
    withSynonyms: allData.filter(d => d.sinonimos && Array.isArray(d.sinonimos) && d.sinonimos.length > 0).length,
    withExamples: gutenbergData?.filter(d => d.exemplos && Array.isArray(d.exemplos) && d.exemplos.length > 0).length || 0,
  };

  // Calculate quality score (0-100)
  const validationScore = (byValidationStatus.approved / totalEntries) * 40;
  const confidenceScore = ((totalEntries - lowConfidence) / totalEntries) * 30;
  const coverageScore = ((fieldCoverage.withSynonyms / totalEntries) * 15) + ((fieldCoverage.withEtymology / gutenbergTotal) * 15);
  const qualityScore = Math.round(validationScore + confidenceScore + coverageScore);

  return {
    totalEntries,
    byValidationStatus,
    lowConfidence,
    byPOS,
    fieldCoverage,
    qualityScore,
  };
}

export function DataQualityDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['data-quality-metrics'],
    queryFn: fetchQualityMetrics,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertDescription>Não foi possível carregar métricas de qualidade</AlertDescription>
      </Alert>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-6 w-6 text-yellow-600" />;
    return <AlertTriangle className="h-6 w-6 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Qualidade de Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">Análise profunda da qualidade dos dados lexicográficos</p>
      </div>

      {/* Score Geral */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getScoreIcon(metrics.qualityScore)}
            Score de Qualidade Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${getScoreColor(metrics.qualityScore)}`}>
              {metrics.qualityScore}
            </div>
            <div className="flex-1">
              <Progress value={metrics.qualityScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {metrics.qualityScore >= 80 ? 'Excelente qualidade de dados' :
                 metrics.qualityScore >= 60 ? 'Qualidade satisfatória, melhorias recomendadas' :
                 'Qualidade necessita atenção urgente'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Validação</p>
              <p className="text-xl font-bold">{((metrics.byValidationStatus.approved / metrics.totalEntries) * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alta Confiança</p>
              <p className="text-xl font-bold">{(((metrics.totalEntries - metrics.lowConfidence) / metrics.totalEntries) * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cobertura</p>
              <p className="text-xl font-bold">{((metrics.fieldCoverage.withSynonyms / metrics.totalEntries) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Status de Validação */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status de Validação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Pendentes</span>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.byValidationStatus.pending / metrics.totalEntries) * 100} className="w-32" />
                <Badge variant="secondary">{metrics.byValidationStatus.pending}</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Aprovados</span>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.byValidationStatus.approved / metrics.totalEntries) * 100} className="w-32" />
                <Badge className="bg-green-600">{metrics.byValidationStatus.approved}</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Corrigidos</span>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.byValidationStatus.corrected / metrics.totalEntries) * 100} className="w-32" />
                <Badge variant="outline">{metrics.byValidationStatus.corrected}</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Rejeitados</span>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.byValidationStatus.rejected / metrics.totalEntries) * 100} className="w-32" />
                <Badge variant="destructive">{metrics.byValidationStatus.rejected}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problemas de Confiança */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Confiança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={metrics.lowConfidence > metrics.totalEntries * 0.2 ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{metrics.lowConfidence}</strong> entradas com confiança &lt; 70%
                <br />
                <span className="text-xs">
                  ({((metrics.lowConfidence / metrics.totalEntries) * 100).toFixed(1)}% do total)
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Distribuição de Confiança</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Alta (&gt;90%)</span>
                <span>Média (70-90%)</span>
                <span>Baixa (&lt;70%)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-500/20 rounded p-2 text-center">
                  <p className="text-lg font-bold">{metrics.totalEntries - metrics.lowConfidence - Math.floor(metrics.totalEntries * 0.2)}</p>
                </div>
                <div className="bg-yellow-500/20 rounded p-2 text-center">
                  <p className="text-lg font-bold">{Math.floor(metrics.totalEntries * 0.2)}</p>
                </div>
                <div className="bg-red-500/20 rounded p-2 text-center">
                  <p className="text-lg font-bold">{metrics.lowConfidence}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Classe Gramatical */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Classe Gramatical</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(metrics.byPOS)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([pos, count]) => (
                <div key={pos} className="border rounded p-3 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">{pos}</p>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {((count / metrics.totalEntries) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Cobertura de Campos */}
      <Card>
        <CardHeader>
          <CardTitle>Cobertura de Campos Enriquecidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sinônimos</span>
              <span className="font-medium">{((metrics.fieldCoverage.withSynonyms / metrics.totalEntries) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(metrics.fieldCoverage.withSynonyms / metrics.totalEntries) * 100} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Etimologia</span>
              <span className="font-medium">{((metrics.fieldCoverage.withEtymology / metrics.totalEntries) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(metrics.fieldCoverage.withEtymology / metrics.totalEntries) * 100} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exemplos de Uso</span>
              <span className="font-medium">{((metrics.fieldCoverage.withExamples / metrics.totalEntries) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(metrics.fieldCoverage.withExamples / metrics.totalEntries) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Resumo Estatístico */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total de Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalEntries.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Qualidade Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${getScoreColor(metrics.qualityScore)}`}>
              {metrics.qualityScore}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Classes Gramaticais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(metrics.byPOS).length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Cobertura Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(((metrics.fieldCoverage.withSynonyms + metrics.fieldCoverage.withEtymology + metrics.fieldCoverage.withExamples) / (metrics.totalEntries * 3)) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}