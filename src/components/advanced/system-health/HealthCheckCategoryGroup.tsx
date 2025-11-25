import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface HealthCheckResult {
  check_type: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
  metrics?: any;
}

interface HealthCheckCategoryGroupProps {
  category: string;
  checks: HealthCheckResult[];
}

const statusConfig = {
  healthy: { color: 'text-green-600', icon: CheckCircle2, bg: 'bg-green-500/10', badgeVariant: 'default' as const },
  warning: { color: 'text-yellow-600', icon: AlertTriangle, bg: 'bg-yellow-500/10', badgeVariant: 'secondary' as const },
  critical: { color: 'text-red-600', icon: AlertTriangle, bg: 'bg-red-500/10', badgeVariant: 'destructive' as const },
};

const checkTypeLabels: Record<string, string> = {
  'gaucho_unificado': 'Gaúcho Unificado',
  'navarro_2014': 'Navarro 2014',
  'gutenberg': 'Gutenberg',
  'rocha_pombo': 'Rocha Pombo',
  'data_integrity': 'Integridade de Dados',
  'system_jobs': 'Jobs do Sistema',
  'recent_imports': 'Importações Recentes',
};

export function HealthCheckCategoryGroup({ category, checks }: HealthCheckCategoryGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  const criticalCount = checks.filter(c => c.status === 'critical').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const healthyCount = checks.filter(c => c.status === 'healthy').length;

  const categoryStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';
  const config = statusConfig[categoryStatus];
  const CategoryIcon = config.icon;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <CategoryIcon className={`h-5 w-5 ${config.color}`} />
              {category}
              <Badge variant={config.badgeVariant} className="ml-2">
                {criticalCount > 0 && `${criticalCount} críticos`}
                {criticalCount === 0 && warningCount > 0 && `${warningCount} avisos`}
                {criticalCount === 0 && warningCount === 0 && `${healthyCount} OK`}
              </Badge>
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {checks.map((result) => {
              const resultConfig = statusConfig[result.status];
              const ResultIcon = resultConfig.icon;
              
              return (
                <Alert key={result.check_type} className={resultConfig.bg}>
                  <ResultIcon className={`h-4 w-4 ${resultConfig.color}`} />
                  <AlertTitle className={resultConfig.color}>
                    {checkTypeLabels[result.check_type] || result.check_type}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>{result.message}</p>
                      {result.metrics && (
                        <div className="text-xs text-muted-foreground mt-2 space-x-3">
                          {result.metrics.total !== undefined && (
                            <span>Total: {result.metrics.total}</span>
                          )}
                          {result.metrics.completion !== undefined && (
                            <span>Progresso: {result.metrics.completion.toFixed(1)}%</span>
                          )}
                          {result.metrics.avgConfidence !== undefined && (
                            <span>Confiança: {(result.metrics.avgConfidence * 100).toFixed(1)}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}