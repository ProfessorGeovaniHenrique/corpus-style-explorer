import { useLexiconStats } from '@/hooks/useLexiconStats';
import { DictionaryStatusCard } from './DictionaryStatusCard';
import { ClearDictionariesCard } from './ClearDictionariesCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, TrendingUp, Database, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function LexiconStatusDashboardRefactored() {
  const { data: stats, isLoading, refetch, isRefetching } = useLexiconStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || !stats.gaucho || !stats.navarro || !stats.gutenberg || !stats.rochaPombo || !stats.overall) {
    return (
      <Alert>
        <AlertDescription>Nenhuma estatística disponível ou estrutura de dados incompleta</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Status dos Léxicos</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real dos dicionários importados</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* ⚠️ CARD DE LIMPEZA - OPERAÇÃO CRÍTICA */}
      <ClearDictionariesCard stats={stats} onSuccess={refetch} />

      {/* ✅ UPGRADE V2.0: Métricas Gerais com Progresso Visual */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total de Entradas</p>
                <Database className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold">{stats.overall.total_entries.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {stats.overall.unique_words?.toLocaleString() || 'N/A'} palavras únicas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Validação</p>
                <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold">{(stats.overall.validation_rate * 100).toFixed(1)}%</p>
              <Progress value={stats.overall.validation_rate * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Última Importação</p>
                <Clock className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-bold">
                {stats.overall.last_import 
                  ? new Date(stats.overall.last_import).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.overall.last_import 
                  ? new Date(stats.overall.last_import).toLocaleTimeString('pt-BR')
                  : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Progresso Geral</p>
                <Users className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold">
                {Math.round((stats.overall.total_entries / 707000) * 100)}%
              </p>
              <Progress value={(stats.overall.total_entries / 707000) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Status por Dicionário</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ✅ Card Gaúcho com barra de progresso */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Gaúcho Unificado</h4>
                <Badge variant={stats.gaucho.total === 0 ? 'destructive' : stats.gaucho.confianca_media < 0.7 ? 'secondary' : 'default'}>
                  {stats.gaucho.total === 0 ? 'Vazio' : stats.gaucho.confianca_media < 0.7 ? 'Atenção' : 'OK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{stats.gaucho.total} / 7,000</span>
                </div>
                <Progress value={(stats.gaucho.total / 7000) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Validados</p>
                  <p className="font-bold">{stats.gaucho.validados}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confiança</p>
                  <p className="font-bold">{(stats.gaucho.confianca_media * 100).toFixed(1)}%</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/admin/dictionary-validation/gaucho_unificado')}
              >
                Validar Entradas
              </Button>
            </CardContent>
          </Card>

          {/* ✅ Card Navarro com barra de progresso */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Navarro 2014</h4>
                <Badge variant={stats.navarro.total === 0 ? 'destructive' : stats.navarro.total < 10000 ? 'secondary' : 'default'}>
                  {stats.navarro.total === 0 ? 'Vazio' : stats.navarro.total < 10000 ? 'Parcial' : 'OK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{stats.navarro.total} / 15,000</span>
                </div>
                <Progress value={(stats.navarro.total / 15000) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Validados</p>
                  <p className="font-bold">{stats.navarro.validados}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confiança</p>
                  <p className="font-bold">{(stats.navarro.confianca_media * 100).toFixed(1)}%</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/admin/navarro-validation')}
              >
                Validar Entradas
              </Button>
            </CardContent>
          </Card>

          {/* ✅ Card Rocha Pombo com barra de progresso */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Rocha Pombo (ABL)</h4>
                <Badge variant={stats.rochaPombo.total === 0 ? 'destructive' : stats.rochaPombo.total < 15000 ? 'secondary' : 'default'}>
                  {stats.rochaPombo.total === 0 ? 'Vazio' : stats.rochaPombo.total < 15000 ? 'Parcial' : 'OK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{stats.rochaPombo.total} / 20,000</span>
                </div>
                <Progress value={(stats.rochaPombo.total / 20000) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Validados</p>
                  <p className="font-bold">{stats.rochaPombo.validados}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sinônimos</p>
                  <p className="font-bold">{stats.rochaPombo.total}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/admin/dictionary-validation/rocha_pombo')}
              >
                Validar Entradas
              </Button>
            </CardContent>
          </Card>

          {/* ✅ Card Gutenberg com barra de progresso */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Gutenberg</h4>
                <Badge variant={stats.gutenberg.total === 0 ? 'destructive' : stats.gutenberg.total < 10000 ? 'destructive' : stats.gutenberg.total < 500000 ? 'secondary' : 'default'}>
                  {stats.gutenberg.total === 0 ? 'Vazio' : stats.gutenberg.total < 10000 ? 'Crítico' : stats.gutenberg.total < 500000 ? 'Parcial' : 'OK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{(stats.gutenberg.total / 1000).toFixed(0)}k / 700k</span>
                </div>
                <Progress value={(stats.gutenberg.total / 700000) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Validados</p>
                  <p className="font-bold">{stats.gutenberg.validados}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confiança</p>
                  <p className="font-bold">{(stats.gutenberg.confianca_media * 100).toFixed(1)}%</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/admin/dictionary-validation/gutenberg')}
              >
                Validar Entradas
              </Button>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
