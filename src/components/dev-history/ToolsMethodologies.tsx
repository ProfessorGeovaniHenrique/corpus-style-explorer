import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cpu, 
  Database, 
  FileText, 
  Network, 
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Download,
  ChevronDown,
  ChevronUp,
  Beaker
} from "lucide-react";
import { 
  tools, 
  ecosystemMetrics, 
  getToolsByCategory, 
  getToolEvolutionData,
  type Tool 
} from "@/data/developer-logs/tools-methodologies";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const categoryIcons = {
  processamento: Cpu,
  lexicon: Database,
  corpus: FileText,
  visualizacao: Network,
  importacao: Upload
};

const categoryColors = {
  processamento: 'text-primary',
  lexicon: 'text-blue-500',
  corpus: 'text-green-500',
  visualizacao: 'text-purple-500',
  importacao: 'text-orange-500'
};

const categoryLabels = {
  processamento: 'Processamento Semântico',
  lexicon: 'Léxico Multifonte',
  corpus: 'Linguística de Corpus',
  visualizacao: 'Visualização',
  importacao: 'Importação e Validação'
};

const ToolCard = ({ tool }: { tool: Tool }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = categoryIcons[tool.category];
  const evolutionData = getToolEvolutionData(tool.id);
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg bg-muted ${categoryColors[tool.category]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">{tool.name}</CardTitle>
              <CardDescription className="mt-1">
                {categoryLabels[tool.category]} • v{tool.version}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={tool.status === 'production' ? 'default' : 'secondary'}>
              {tool.status === 'production' ? 'PRODUÇÃO' : tool.status.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {tool.reliability.accuracy}% acurácia
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Descrição e Propósito */}
        <div>
          <p className="text-muted-foreground">{tool.description}</p>
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">🎯 Propósito:</p>
            <p className="text-sm text-muted-foreground mt-1">{tool.purpose}</p>
          </div>
        </div>

        {/* Métricas de Confiabilidade */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-background border rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{tool.reliability.accuracy}%</div>
            <div className="text-xs text-muted-foreground mt-1">Acurácia</div>
          </div>
          <div className="p-3 bg-background border rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-500">{tool.reliability.precision}%</div>
            <div className="text-xs text-muted-foreground mt-1">Precisão</div>
          </div>
          <div className="p-3 bg-background border rounded-lg text-center">
            <div className="text-2xl font-bold text-green-500">{tool.reliability.recall}%</div>
            <div className="text-xs text-muted-foreground mt-1">Recall</div>
          </div>
        </div>

        {/* Botão de Expansão */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Ocultar Detalhes Técnicos
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Ver Detalhes Técnicos e Validação
            </>
          )}
        </Button>

        {/* Seção Expandida */}
        {expanded && (
          <div className="space-y-6 pt-4 border-t">
            <Tabs defaultValue="process" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="process">Processo</TabsTrigger>
                <TabsTrigger value="functioning">Funcionamento</TabsTrigger>
                <TabsTrigger value="validation">Validação</TabsTrigger>
                <TabsTrigger value="evolution">Evolução</TabsTrigger>
              </TabsList>

              {/* Tab: Processo de Criação */}
              <TabsContent value="process" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Problema Inicial
                  </h4>
                  <p className="text-sm text-muted-foreground">{tool.creationProcess.initialProblem}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Fase de Pesquisa
                  </h4>
                  <p className="text-sm text-muted-foreground">{tool.creationProcess.researchPhase}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-purple-500" />
                    Hipótese Científica
                  </h4>
                  <p className="text-sm text-muted-foreground italic">{tool.creationProcess.hypothesis}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📚 Embasamento Científico</h4>
                  <ul className="space-y-1">
                    {tool.scientificBasis.map((basis, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{basis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* Tab: Funcionamento Técnico */}
              <TabsContent value="functioning" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">🔄 Pipeline de Processamento</h4>
                  <ol className="space-y-2">
                    {tool.functioning.processingSteps.map((step, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 shrink-0">{idx + 1}</Badge>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">📥 Input</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                      {tool.functioning.inputData}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">📤 Output</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                      {tool.functioning.outputData}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">⚙️ Algoritmos Utilizados</h4>
                  <ul className="space-y-1">
                    {tool.functioning.algorithms.map((algo, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground bg-muted/30 p-2 rounded font-mono">
                        {algo}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Diagrama Mermaid */}
                {tool.functioning.dataFlow && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-3">📊 Fluxo de Dados</h4>
                    <pre className="text-xs overflow-x-auto">
                      <code>{tool.functioning.dataFlow}</code>
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Diagrama Mermaid - renderizar em ferramenta externa para visualização
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Validação */}
              <TabsContent value="validation" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">🔬 Metodologia de Validação</h4>
                  <p className="text-sm text-muted-foreground">{tool.validation.method}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">📊 Métricas de Performance</h4>
                  <div className="grid gap-2">
                    {tool.validation.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {metric.value} {metric.unit}
                          </Badge>
                          {metric.benchmark && (
                            <span className="text-xs text-muted-foreground">
                              ({metric.benchmark})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {tool.reliability.humanValidation && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Validação Humana
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {tool.reliability.humanValidation.samplesValidated}
                        </div>
                        <div className="text-xs text-muted-foreground">Amostras Validadas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {tool.reliability.humanValidation.agreementRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Taxa de Concordância</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">⚠️ Limitações Conhecidas</h4>
                  <ul className="space-y-2">
                    {tool.validation.limitations.map((limit, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <span>{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">💬 Interpretação de Confiabilidade</h4>
                  <p className="text-sm text-muted-foreground italic">{tool.reliability.confidence}</p>
                </div>
              </TabsContent>

              {/* Tab: Evolução */}
              <TabsContent value="evolution" className="space-y-4 mt-4">
                {evolutionData && evolutionData.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="version" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {evolutionData[0].accuracy > 0 && (
                          <Line 
                            type="monotone" 
                            dataKey="accuracy" 
                            stroke="hsl(var(--primary))" 
                            name="Acurácia (%)"
                          />
                        )}
                        {evolutionData[0].coverage > 0 && (
                          <Line 
                            type="monotone" 
                            dataKey="coverage" 
                            stroke="hsl(142 76% 36%)" 
                            name="Cobertura (%)"
                          />
                        )}
                        {evolutionData[0].performance > 0 && (
                          <Line 
                            type="monotone" 
                            dataKey="performance" 
                            stroke="hsl(221 83% 53%)" 
                            name="Performance"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-3">
                  {tool.evolution.map((version, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{version.version}</Badge>
                        <span className="text-xs text-muted-foreground">{version.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {version.improvements.map((improvement, iIdx) => (
                          <li key={iIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <TrendingUp className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Referências Científicas */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Referências Bibliográficas
              </h4>
              <ol className="space-y-2 text-xs text-muted-foreground">
                {tool.references.map((ref, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-medium text-primary">[{idx + 1}]</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ToolsMethodologies = () => {
  const [activeCategory, setActiveCategory] = useState<Tool['category'] | 'all'>('all');

  const filteredTools = activeCategory === 'all' 
    ? tools 
    : getToolsByCategory(activeCategory);

  const exportTechnicalReport = () => {
    const report = tools.map(tool => ({
      ...tool,
      evolutionData: getToolEvolutionData(tool.id)
    }));
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferramentas-metodologias-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">🔬 Ferramentas e Metodologias Científicas</CardTitle>
              <CardDescription className="mt-2">
                Documentação científica completa de todas as ferramentas desenvolvidas, incluindo 
                processo de criação, validação empírica, métricas de confiabilidade e evolução temporal.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={exportTechnicalReport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas do Ecossistema */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{ecosystemMetrics.totalTools}</div>
            <div className="text-sm text-muted-foreground mt-1">Ferramentas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">{ecosystemMetrics.productionTools}</div>
            <div className="text-sm text-muted-foreground mt-1">Em Produção</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-500">{ecosystemMetrics.avgReliability}%</div>
            <div className="text-sm text-muted-foreground mt-1">Acurácia Média</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-500">{ecosystemMetrics.totalValidations}</div>
            <div className="text-sm text-muted-foreground mt-1">Validações Humanas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-500">{ecosystemMetrics.totalReferences}</div>
            <div className="text-sm text-muted-foreground mt-1">Referências Únicas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros por Categoria */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveCategory('all')}
        >
          Todas ({ecosystemMetrics.totalTools})
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => {
          const Icon = categoryIcons[key as Tool['category']];
          return (
            <Button
              key={key}
              variant={activeCategory === key ? 'default' : 'outline'}
              onClick={() => setActiveCategory(key as Tool['category'])}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label} ({ecosystemMetrics.byCategory[key as Tool['category']]})
            </Button>
          );
        })}
      </div>

      {/* Lista de Ferramentas */}
      <div className="space-y-4">
        {filteredTools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Footer Científico */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">💡 Sobre Esta Documentação</h3>
          <p className="text-sm text-muted-foreground">
            Esta documentação segue padrões científicos de reprodutibilidade e transparência metodológica. 
            Todas as ferramentas foram validadas empiricamente com métricas documentadas. 
            O código-fonte está disponível no repositório do projeto, e os dados de validação podem 
            ser inspecionados via banco de dados.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Citação sugerida:</strong> "Sistema de Análise Estilística de Corpus Musical Gaúcho: 
            Ferramentas e Metodologias Validadas para Anotação Semântica Automatizada" (2024).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
