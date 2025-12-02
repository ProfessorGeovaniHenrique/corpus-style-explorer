import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubcorpus } from "@/contexts/SubcorpusContext";
import { Database, Music, TrendingUp, HardDrive, Trash2, AlertTriangle, Settings } from "lucide-react";
import { toast } from "sonner";
import { SectionLoading } from "@/components/ui/loading-spinner";

export function SubcorpusDebugPanel() {
  const { 
    selection, 
    currentMetadata, 
    availableArtists, 
    subcorpora,
    isLoading 
  } = useSubcorpus();

  // Tentar carregar localStorage raw para debug
  const rawLocalStorage = localStorage.getItem('subcorpus-selection');
  let parsedLocalStorage = null;
  let parseError = null;

  try {
    if (rawLocalStorage) {
      parsedLocalStorage = JSON.parse(rawLocalStorage);
    }
  } catch (error) {
    parseError = error instanceof Error ? error.message : 'Unknown error';
  }

  const handleClearCache = () => {
    // Limpar todos os caches relacionados ao subcorpus
    const keysToRemove = [
      'subcorpus-selection',
      'stylistic-selection',
      'dashboard-analise-cache',
      'ai-review-progress',
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    toast.success('Cache limpo com sucesso', {
      description: 'Recarregue a página para aplicar as mudanças.',
    });
  };

  const handleClearAllCache = () => {
    // Limpar todo o localStorage (cuidado!)
    const keysRemoved: string[] = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('sb-')) { // Preservar tokens do Supabase
        localStorage.removeItem(key);
        keysRemoved.push(key);
      }
    }
    
    toast.success(`${keysRemoved.length} itens removidos do cache`, {
      description: 'Recarregue a página para aplicar as mudanças.',
    });
  };

  // Aviso para ambiente de desenvolvimento
  const isProduction = import.meta.env.PROD;
  
  return (
    <div className="space-y-6">
      {/* Aviso de ambiente */}
      {isProduction && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ambiente de Produção</AlertTitle>
          <AlertDescription>
            Este painel de debug está sendo exibido em produção. 
            Considere ocultar esta aba para usuários finais.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                SubcorpusContext Debug Panel
              </CardTitle>
              <CardDescription>
                Ferramentas avançadas para diagnóstico do sistema de subcorpus
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCache}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Cache
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearAllCache}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Reset Total
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SectionLoading text="Carregando dados do contexto..." />
          ) : (
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="current">Estado Atual</TabsTrigger>
                <TabsTrigger value="subcorpora">Subcorpora</TabsTrigger>
                <TabsTrigger value="localStorage">localStorage</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Aba 1: Estado Atual */}
              <TabsContent value="current" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Seleção Ativa</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Modo:</span>
                        <Badge variant={selection.mode === 'complete' ? 'default' : 'secondary'}>
                          {selection.mode}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Corpus Base:</span>
                        <Badge variant="outline">{selection.corpusBase}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Artista A:</span>
                        <span className="font-mono text-sm">
                          {selection.artistaA || <em className="text-muted-foreground">null</em>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Artista B:</span>
                        <span className="font-mono text-sm">
                          {selection.artistaB || <em className="text-muted-foreground">null</em>}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {currentMetadata ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Metadados do Subcorpus
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Artista:</span>
                          <span className="font-semibold">{currentMetadata.artista}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Músicas:</span>
                          <span className="font-mono">{currentMetadata.totalMusicas}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Palavras:</span>
                          <span className="font-mono">{currentMetadata.totalPalavras.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Riqueza Lexical:</span>
                          <span className="font-mono">{(currentMetadata.riquezaLexical * 100).toFixed(2)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum subcorpus selecionado</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Aba 2: Todos os Subcorpora */}
              <TabsContent value="subcorpora" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total de artistas: <strong>{availableArtists.length}</strong>
                    </span>
                    <Badge variant="outline">
                      {isLoading ? 'Carregando...' : 'Carregado'}
                    </Badge>
                  </div>
                  
                  {subcorpora.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum subcorpus disponível</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
                      {subcorpora.map(sub => (
                        <Card key={sub.artista} className="p-3 hover:bg-accent/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                <Music className="w-4 h-4 text-primary" />
                                {sub.artista}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {sub.totalMusicas} músicas • {sub.totalPalavras.toLocaleString()} palavras
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {(sub.riquezaLexical * 100).toFixed(1)}% riqueza
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba 3: localStorage Raw */}
              <TabsContent value="localStorage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Raw localStorage Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2 text-muted-foreground">
                        Conteúdo bruto:
                      </div>
                      <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono max-h-48 overflow-y-auto">
                        {rawLocalStorage || '<vazio>'}
                      </pre>
                    </div>
                    
                    {rawLocalStorage && (
                      <div>
                        <div className="text-sm font-medium mb-2 text-muted-foreground">
                          JSON Parsed:
                        </div>
                        {parseError ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erro ao fazer parse do JSON</AlertTitle>
                            <AlertDescription>
                              <pre className="text-xs mt-2">{parseError}</pre>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono max-h-48 overflow-y-auto">
                            {JSON.stringify(parsedLocalStorage, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-2 text-muted-foreground">
                        Validação:
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {rawLocalStorage ? (
                            <Badge variant="default" className="text-xs">✓</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">○</Badge>
                          )}
                          <span>localStorage contém dados</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {!parseError ? (
                            <Badge variant="default" className="text-xs">✓</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">✗</Badge>
                          )}
                          <span>JSON válido</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {parsedLocalStorage?.mode && parsedLocalStorage?.corpusBase ? (
                            <Badge variant="default" className="text-xs">✓</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">○</Badge>
                          )}
                          <span>Campos obrigatórios presentes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba 4: Performance Metrics */}
              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Cache Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant={isLoading ? "secondary" : "default"}>
                          {isLoading ? 'Loading' : 'Cached'}
                        </Badge>
                        {!isLoading && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Subcorpora Extracted</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{subcorpora.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">artistas disponíveis</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">localStorage Size</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-mono">
                        {rawLocalStorage ? `${rawLocalStorage.length} bytes` : '0 bytes'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rawLocalStorage ? 'Dados persistidos' : 'Sem dados salvos'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Context Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Corpus carregado:</span>
                      <Badge variant={subcorpora.length > 0 ? "default" : "secondary"}>
                        {subcorpora.length > 0 ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Seleção restaurada:</span>
                      <Badge variant={rawLocalStorage ? "default" : "secondary"}>
                        {rawLocalStorage ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Metadados computados:</span>
                      <Badge variant={currentMetadata ? "default" : "secondary"}>
                        {currentMetadata ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
