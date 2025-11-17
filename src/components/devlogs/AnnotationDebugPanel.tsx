import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Bug, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  Shield,
  RefreshCw,
  Filter,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useAnnotationDebugLogs, useAnnotationDebugStats } from "@/hooks/useAnnotationDebugLogs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnnotationDebugPanel() {
  const [authFilter, setAuthFilter] = useState<string>("");
  const [corpusFilter, setCorpusFilter] = useState<string>("");
  const [demoFilter, setDemoFilter] = useState<boolean | undefined>(undefined);

  const { data: logs, isLoading, refetch } = useAnnotationDebugLogs({
    limit: 100,
    authStatusFilter: authFilter || undefined,
    corpusTypeFilter: corpusFilter || undefined,
    demoOnly: demoFilter,
  });

  const { data: stats } = useAnnotationDebugStats();

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {status}
      </Badge>;
    }
    if (status >= 400) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="w-3 h-3 mr-1" />
        {status}
      </Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getAuthStatusBadge = (authStatus: string) => {
    const colors: Record<string, string> = {
      'demo': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'authenticated': 'bg-green-500/10 text-green-600 border-green-500/20',
      'unauthorized': 'bg-red-500/10 text-red-600 border-red-500/20',
      'invalid_token': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    };
    
    return (
      <Badge variant="outline" className={colors[authStatus] || ''}>
        {authStatus}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Debug de Anotação Semântica
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real de requisições e autenticação
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Logs de Requisições</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4 mt-6">
              {stats && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total de Requisições
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Taxa de Sucesso
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <div className="text-2xl font-bold text-green-600">
                            {stats.successRate.toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Demo vs Auth
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          <div>Demo: <strong>{stats.demoRequests}</strong></div>
                          <div>Auth: <strong>{stats.authenticatedRequests}</strong></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Taxa de Erro
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <div className="text-2xl font-bold text-red-600">
                            {stats.errorRate.toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Status de Autenticação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.byAuthStatus).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              {getAuthStatusBadge(status)}
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Por Tipo de Corpus</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.byCorpusType).map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <Badge variant="outline">{type}</Badge>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-4 mt-6">
              {/* Filtros */}
              <div className="flex gap-2 items-center flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={authFilter} onValueChange={setAuthFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Auth Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="authenticated">Authenticated</SelectItem>
                    <SelectItem value="unauthorized">Unauthorized</SelectItem>
                    <SelectItem value="invalid_token">Invalid Token</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={corpusFilter} onValueChange={setCorpusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Corpus Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="gaucho">Gaúcho</SelectItem>
                    <SelectItem value="nordestino">Nordestino</SelectItem>
                    <SelectItem value="marenco-verso">Marenco Verso</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={demoFilter === undefined ? "" : demoFilter.toString()} 
                  onValueChange={(v) => setDemoFilter(v === "" ? undefined : v === "true")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Modo Demo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="true">Apenas Demo</SelectItem>
                    <SelectItem value="false">Apenas Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Carregando logs...</AlertTitle>
                </Alert>
              )}

              {!isLoading && logs && logs.length === 0 && (
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertTitle>Nenhum log encontrado</AlertTitle>
                  <AlertDescription>
                    Não há registros de debug para os filtros selecionados.
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && logs && logs.length > 0 && (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Corpus</TableHead>
                        <TableHead>Auth Status</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Demo</TableHead>
                        <TableHead>Tempo (ms)</TableHead>
                        <TableHead>Palavras</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {formatDistanceToNow(new Date(log.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.corpus_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {getAuthStatusBadge(log.auth_status)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.response_status)}
                          </TableCell>
                          <TableCell>
                            {log.demo_mode ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                                <Shield className="w-3 h-3 mr-1" />
                                Demo
                              </Badge>
                            ) : (
                              <Badge variant="outline">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.processing_time_ms || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.words_processed || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
