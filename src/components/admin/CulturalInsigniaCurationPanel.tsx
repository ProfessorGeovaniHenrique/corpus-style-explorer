import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useInsigniaStats } from '@/hooks/useInsigniaStats';
import { InsigniaDistributionChart } from './InsigniaDistributionChart';
import { InsigniaOperationsPanel } from './InsigniaOperationsPanel';
import { InsigniaCurationTable } from './InsigniaCurationTable';
import { Loader2 } from 'lucide-react';

export function CulturalInsigniaCurationPanel() {
  const { data: stats, isLoading } = useInsigniaStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-destructive">
        Erro ao carregar estatísticas de insígnias
      </div>
    );
  }

  const coveragePercentage = stats.totalWithInsignias + stats.totalWithoutInsignias > 0
    ? ((stats.totalWithInsignias / (stats.totalWithInsignias + stats.totalWithoutInsignias)) * 100).toFixed(1)
    : '0';

  const validationPercentage = stats.validatedCount + stats.pendingValidation > 0
    ? ((stats.validatedCount / (stats.validatedCount + stats.pendingValidation)) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Insígnias</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalWithInsignias.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {coveragePercentage}% do cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Insígnias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.totalWithoutInsignias.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Palavras pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.validatedCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {validationPercentage}% validados humanamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingValidation.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando curadoria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <InsigniaDistributionChart
        distribution={stats.distribution}
        totalWith={stats.totalWithInsignias}
        totalWithout={stats.totalWithoutInsignias}
      />

      {/* Operations Panel */}
      <InsigniaOperationsPanel />

      {/* Curation Table */}
      <InsigniaCurationTable />
    </div>
  );
}
