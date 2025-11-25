import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  usasSystem, 
  versoAustralProposal, 
  criticalAnalysis,
  validationStrategy,
  calculateTotalImplementationTime,
  type USASMethod
} from "@/data/developer-logs/usas-methodology";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  GitCompare,
  Sparkles,
  ExternalLink
} from "lucide-react";

export function USASMethodologyViewer() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedMethods, setExpandedMethods] = useState<string[]>([]);

  const toggleMethod = (methodId: string) => {
    setExpandedMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Metodologia USAS & Proposta Verso Austral
              </CardTitle>
              <CardDescription className="text-base">
                Análise sistemática do pipeline de anotação semântica UCREL e proposta de otimização com tecnologias de 2025
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Versão 1.0.0 • 16/01/2025
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">91%</div>
              <div className="text-xs text-muted-foreground">Acurácia USAS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">94%</div>
              <div className="text-xs text-muted-foreground">Meta Verso Austral</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">7</div>
              <div className="text-xs text-muted-foreground">Métodos de Desambiguação</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">5</div>
              <div className="text-xs text-muted-foreground">Sprints de Implementação</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="usas-pipeline">Pipeline USAS</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="proposal">Proposta VA</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Sistema USAS Original (2004)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Instituição</h4>
                  <p className="text-sm text-muted-foreground">{usasSystem.institution}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {usasSystem.researchers.map((researcher, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {researcher}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Componentes Core</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Taxonomia:</span>
                      <Badge>{usasSystem.coreComponents.taxonomy.totalCategories} categorias</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Léxico:</span>
                      <Badge>{usasSystem.coreComponents.lexicon.size}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cobertura:</span>
                      <Badge variant="outline">{usasSystem.coreComponents.lexicon.coverage}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-semibold mb-3">Inovações Principais</h4>
                <div className="grid gap-2">
                  {usasSystem.keyInnovations.map((innovation, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{innovation}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-semibold mb-3">Limitações Identificadas</h4>
                <div className="grid gap-2">
                  {usasSystem.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Métricas de Performance (USAS 2004)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {(usasSystem.performanceMetrics.overallAccuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Acurácia Geral</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {(usasSystem.performanceMetrics.singleWordAccuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Palavras Únicas</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {(usasSystem.performanceMetrics.mweAccuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">MWEs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">
                    {(usasSystem.performanceMetrics.coverageRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Cobertura</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-bold text-orange-500">
                    {usasSystem.performanceMetrics.processingSpeed}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Velocidade</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Pipeline USAS Detalhado */}
        <TabsContent value="usas-pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taxonomia Semântica USAS</CardTitle>
              <CardDescription>{usasSystem.coreComponents.taxonomy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 border-b">
                    <span className="font-semibold">Estrutura:</span>
                    <span className="text-muted-foreground">{usasSystem.coreComponents.taxonomy.structure}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span className="font-semibold">Total de Categorias:</span>
                    <Badge>{usasSystem.coreComponents.taxonomy.totalCategories}</Badge>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span className="font-semibold">Níveis de Hierarquia:</span>
                    <Badge>{usasSystem.coreComponents.taxonomy.hierarchyLevels}</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm">Exemplos de Categorias:</h4>
                  <div className="space-y-1">
                    {usasSystem.coreComponents.taxonomy.examples.map((example, idx) => (
                      <div key={idx} className="text-xs p-2 bg-muted/50 rounded font-mono">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7 Métodos de Desambiguação (Pipeline Completo)</CardTitle>
              <CardDescription>
                Sequência de processamento do USAS para atribuição de tags semânticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {usasSystem.disambiguationMethods.map((method, idx) => (
                <Collapsible
                  key={method.id}
                  open={expandedMethods.includes(method.id)}
                  onOpenChange={() => toggleMethod(method.id)}
                >
                  <Card className="border-primary/20">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-left">
                            <Badge className="shrink-0">{idx + 1}</Badge>
                            <div>
                              <CardTitle className="text-base">{method.name}</CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {method.description}
                              </CardDescription>
                            </div>
                          </div>
                          {expandedMethods.includes(method.id) ? (
                            <ChevronUp className="h-5 w-5 shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="border-l-2 border-primary pl-4 space-y-3">
                          <div>
                            <h5 className="font-semibold text-sm mb-1">Propósito</h5>
                            <p className="text-sm text-muted-foreground">{method.purpose}</p>
                          </div>

                          <div>
                            <h5 className="font-semibold text-sm mb-1">Detalhes Técnicos</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {method.technicalDetails}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded">
                            <div>
                              <h5 className="font-semibold text-xs mb-1">Input</h5>
                              <p className="text-xs font-mono">{method.inputOutput.input}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold text-xs mb-1">Output</h5>
                              <p className="text-xs font-mono">{method.inputOutput.output}</p>
                            </div>
                          </div>

                          {method.performance && (
                            <div className="flex gap-3 flex-wrap">
                              {method.performance.accuracy && (
                                <Badge variant="outline">
                                  Acurácia: {(method.performance.accuracy * 100).toFixed(0)}%
                                </Badge>
                              )}
                              {method.performance.coverage && (
                                <Badge variant="outline">
                                  Cobertura: {(method.performance.coverage * 100).toFixed(0)}%
                                </Badge>
                              )}
                              {method.performance.speed && (
                                <Badge variant="outline">
                                  Velocidade: {method.performance.speed}
                                </Badge>
                              )}
                            </div>
                          )}

                          {method.limitations && method.limitations.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                Limitações
                              </h5>
                              <ul className="space-y-1">
                                {method.limitations.map((limitation, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground ml-5 list-disc">
                                    {limitation}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div>
                            <h5 className="font-semibold text-xs mb-1">Referências</h5>
                            <div className="space-y-1">
                              {method.references.map((ref, idx) => (
                                <div key={idx} className="text-xs text-muted-foreground italic">
                                  {ref}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Comparação */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Comparação: USAS (2004) vs Verso Austral (2025)
              </CardTitle>
              <CardDescription>
                Análise crítica das diferenças metodológicas e tecnológicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {versoAustralProposal.disambiguationMethodsComparison.map((comparison, idx) => (
                <div key={idx} className="border-l-4 border-primary pl-4 space-y-3">
                  <h4 className="font-semibold text-sm">{comparison.method}</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">USAS 2004</Badge>
                      <p className="text-sm text-muted-foreground">{comparison.usasApproach}</p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="default" className="text-xs">Verso Austral 2025</Badge>
                      <p className="text-sm font-medium">{comparison.versoAustralApproach}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm text-green-700 dark:text-green-400">
                          Melhoria
                        </div>
                        <div className="text-sm">{comparison.improvement}</div>
                      </div>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {comparison.technology}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Pontos Fortes do USAS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {criticalAnalysis.usasStrengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground ml-4 list-disc">
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Limitações do USAS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {criticalAnalysis.usasWeaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground ml-4 list-disc">
                      {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Proposta Verso Austral */}
        <TabsContent value="proposal" className="space-y-4">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Anotador Semântico Híbrido Gauchesco (ASHG)
              </CardTitle>
              <CardDescription>
                Sistema otimizado para corpus de música gaúcha usando LLMs e embeddings (2025)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Vantagens Tecnológicas</h4>
                <div className="grid gap-2">
                  {versoAustralProposal.technologicalAdvantages.map((advantage, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-primary/5 rounded">
                      <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{advantage}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <h4 className="font-semibold text-sm">Métricas Esperadas</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Acurácia Alvo:</span>
                      <Badge className="bg-green-500">
                        {(versoAustralProposal.expectedMetrics.targetAccuracy * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cobertura Alvo:</span>
                      <Badge className="bg-blue-500">
                        {(versoAustralProposal.expectedMetrics.targetCoverage * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Custo por Música:</span>
                      <Badge variant="outline">{versoAustralProposal.expectedMetrics.costPerSong}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Velocidade:</span>
                      <Badge variant="outline">{versoAustralProposal.expectedMetrics.processingSpeed}</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    <h4 className="font-semibold text-sm">Estimativa de Custo</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>35k músicas × $0.01:</span>
                      <span className="font-mono">$350</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Com cache 85%:</span>
                      <span className="font-mono text-green-600">$52.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Economia total:</span>
                      <Badge className="bg-green-500">85%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decisões Arquiteturais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versoAustralProposal.architecturalDecisions.map((decision, idx) => (
                  <div key={idx} className="border-l-2 border-primary/30 pl-4">
                    <h4 className="font-semibold text-sm mb-1">{decision.decision}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Razão:</strong> {decision.rationale}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Trade-off:</strong> {decision.tradeoff}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Roadmap de Implementação */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Roadmap de Implementação
              </CardTitle>
              <CardDescription>
                {versoAustralProposal.implementationRoadmap.length} sprints • {calculateTotalImplementationTime()} de desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {versoAustralProposal.implementationRoadmap.map((sprint) => (
                <Card key={sprint.sprint} className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge>{sprint.sprint}</Badge>
                          {sprint.name}
                        </CardTitle>
                        <CardDescription className="mt-1">{sprint.duration}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-sm mb-2">Entregas</h5>
                      <ul className="space-y-1">
                        {sprint.deliverables.map((deliverable, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground ml-4 list-disc">
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {sprint.dependencies.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-sm mb-2">Dependências</h5>
                        <div className="flex flex-wrap gap-1">
                          {sprint.dependencies.map((dep, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Fases do Pipeline Otimizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versoAustralProposal.optimizedPipeline.phases.map((phase, idx) => (
                  <div key={phase.id} className="border-l-4 border-primary pl-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{phase.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                      </div>
                      <Badge 
                        variant={
                          phase.priority === 'critical' ? 'destructive' :
                          phase.priority === 'high' ? 'default' : 'outline'
                        }
                        className="shrink-0 ml-2"
                      >
                        {phase.priority}
                      </Badge>
                    </div>

                    <div className="grid gap-2">
                      {phase.components.map((component, cIdx) => (
                        <div key={cIdx} className="p-3 bg-muted/30 rounded space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-sm">{component.name}</h5>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {component.technology}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{component.purpose}</p>
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <TrendingUp className="h-3 w-3" />
                            {component.improvement}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Estimativa: {phase.estimatedTime}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Estratégia de Validação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Gold Standard</h4>
                <div className="p-3 bg-muted/30 rounded space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Corpus:</span>
                    <span className="font-mono">{validationStrategy.goldStandard.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho:</span>
                    <Badge>{validationStrategy.goldStandard.size}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Anotadores:</span>
                    <span>{validationStrategy.goldStandard.annotators}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Concordância:</span>
                    <Badge variant="outline">{validationStrategy.goldStandard.interAnnotatorAgreement}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3">Métricas de Avaliação</h4>
                <div className="grid gap-2">
                  {validationStrategy.evaluationMetrics.map((metric, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{metric.metric}</span>
                        <Badge variant="outline">{metric.target}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{metric.definition}</p>
                      {'formula' in metric && (
                        <code className="text-xs bg-muted px-2 py-1 rounded">{metric.formula}</code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer com Referências */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Referências Científicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usasSystem.references.map((ref, idx) => (
              <div key={idx} className="text-xs text-muted-foreground p-2 border-l-2 border-primary/30 pl-3">
                {ref}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted/30 rounded text-xs">
            <strong>Fonte dos Dados:</strong> Extração sistemática dos PDFs fornecidos 
            (usas_lrec04ws.pdf, cl2005_estlex.pdf) realizada em 16/01/2025
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
