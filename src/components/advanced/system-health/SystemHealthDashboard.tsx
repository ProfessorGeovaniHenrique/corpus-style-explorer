import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Database, Wrench, Shield } from 'lucide-react';
import { HealthCheckCategoryGroup } from './HealthCheckCategoryGroup';

export function SystemHealthDashboard() {
  const { data: health, isLoading, refresh, isRefreshing } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!health) return null;

  const statusConfig = {
    healthy: { color: 'text-green-600', icon: CheckCircle2 },
    warning: { color: 'text-yellow-600', icon: AlertTriangle },
    critical: { color: 'text-red-600', icon: AlertTriangle },
  };

  const config = statusConfig[health.overall_status];
  const StatusIcon = config.icon;

  // ✅ UPGRADE V2.0: Agrupar checks por categoria
  const dictionaryChecks = health.results.filter(r => 
    ['gaucho_unificado', 'navarro_2014', 'gutenberg', 'rocha_pombo'].includes(r.check_type)
  );

  const systemChecks = health.results.filter(r => 
    ['system_jobs', 'recent_imports'].includes(r.check_type)
  );

  const integrityChecks = health.results.filter(r => 
    ['data_integrity'].includes(r.check_type)
  );

  const overallCheck = health.results.find(r => r.check_type === 'system_overall');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Health Check do Sistema</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitoramento abrangente da saúde dos léxicos</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Verificar Agora
        </Button>
      </div>

      {/* Status Geral */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-6 w-6 ${config.color}`} />
            Status Geral do Sistema
            <Badge variant={health.overall_status === 'healthy' ? 'default' : 'destructive'} className="ml-2">
              {health.overall_status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-red-600">{health.critical_count}</p>
              <p className="text-sm text-muted-foreground">Problemas Críticos</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-yellow-600">{health.warning_count}</p>
              <p className="text-sm text-muted-foreground">Avisos</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-green-600">
                {health.results.length - health.critical_count - health.warning_count - 1}
              </p>
              <p className="text-sm text-muted-foreground">Checks Saudáveis</p>
            </div>
          </div>
          {overallCheck && (
            <p className="text-center text-sm text-muted-foreground mt-4 border-t pt-4">
              {overallCheck.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ✅ UPGRADE V2.0: Checks agrupados por categoria */}
      <div className="space-y-4">
        {dictionaryChecks.length > 0 && (
          <HealthCheckCategoryGroup 
            category="Dicionários" 
            checks={dictionaryChecks}
          />
        )}

        {systemChecks.length > 0 && (
          <HealthCheckCategoryGroup 
            category="Sistema" 
            checks={systemChecks}
          />
        )}

        {integrityChecks.length > 0 && (
          <HealthCheckCategoryGroup 
            category="Integridade" 
            checks={integrityChecks}
          />
        )}
      </div>

      {/* Cache Info */}
      {health.cached && health.results[0]?.checked_at && (
        <p className="text-xs text-muted-foreground text-center">
          📦 Dados em cache (última verificação: {new Date(health.results[0].checked_at).toLocaleString('pt-BR')})
        </p>
      )}
    </div>
  );
}
