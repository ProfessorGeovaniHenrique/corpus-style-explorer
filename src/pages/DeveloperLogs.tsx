import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FileText, ArrowLeft, Download, Bug, Bot, Zap, Wrench, BarChart3, Shield, Database,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportDeveloperLogsToPDF } from "@/utils/exportDeveloperLogs";
import { useState } from "react";
import {
  AIAssistant,
  AIAssistantROIDashboard,
  CodeScannerInterface,
  ConstructionLogManager,
  TemporalEvolutionDashboard,
  CreditsSavingsIndicator,
  AIAnalysisReview,
  AnnotationDebugPanel,
  SubcorpusDebugPanel
} from '@/components/devlogs';
import { SentrySmokeTest } from '@/components/SentrySmokeTest';
import { projectStats } from "@/data/developer-logs/construction-log";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Definição das tabs com tooltips
const devLogTabs = [
  { 
    value: 'ai-assistant', 
    label: 'IA Assistant', 
    icon: Bot, 
    tooltip: 'Assistente de IA para análise de logs e sugestões de correção' 
  },
  { 
    value: 'ai-roi', 
    label: 'ROI', 
    icon: BarChart3, 
    tooltip: 'Dashboard de retorno sobre investimento das análises de IA' 
  },
  { 
    value: 'ai-review', 
    label: 'AI Review', 
    icon: Bot, 
    tooltip: 'Validação humana das sugestões geradas automaticamente' 
  },
  { 
    value: 'annotation-debug', 
    label: 'Request Monitor', 
    icon: Shield, 
    tooltip: 'Monitor de requisições de anotação semântica com status de autenticação' 
  },
  { 
    value: 'code-scanner', 
    label: 'Scanner', 
    icon: Bug, 
    tooltip: 'Scanner de código para detectar problemas e padrões ruins' 
  },
  { 
    value: 'construction-manager', 
    label: 'Log Manager', 
    icon: Wrench, 
    tooltip: 'Gerenciador do log de construção do projeto' 
  },
  { 
    value: 'temporal-evolution', 
    label: 'Evolução', 
    icon: BarChart3, 
    tooltip: 'Evolução temporal das métricas e issues do projeto' 
  },
  { 
    value: 'subcorpus-debug', 
    label: 'Subcorpus', 
    icon: Database, 
    tooltip: 'Debug avançado do contexto de subcorpus (desenvolvimento)' 
  },
];

export default function DeveloperLogs() {
  const navigate = useNavigate();
  const [triggerAnalysis, setTriggerAnalysis] = useState<'audit' | 'performance' | 'errors' | null>(null);
  const [activeTab, setActiveTab] = useState('ai-assistant');

  const handleExportReport = () => {
    exportDeveloperLogsToPDF();
  };

  const handleQuickAnalysis = (type: 'audit' | 'performance' | 'errors') => {
    setActiveTab('ai-assistant');
    setTriggerAnalysis(type);
  };

  const handleAnalysisComplete = () => {
    setTriggerAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard-mvp-definitivo")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">📋 Developer Logs</h1>
                <p className="text-muted-foreground mt-1">
                  Documentação completa do processo de construção da plataforma
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleQuickAnalysis('audit')} 
                variant="outline"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Analisar Logs
              </Button>
              
              <Button 
                onClick={() => handleQuickAnalysis('performance')} 
                variant="secondary"
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Analisar Performance
              </Button>
              
              <Button onClick={handleExportReport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar Relatório
              </Button>
              
              <Button 
                onClick={() => setActiveTab('code-scanner')}
                variant="destructive" 
                className="gap-2"
              >
                <Bug className="w-4 h-4" />
                🔍 Escanear Código
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Fases Totais</CardDescription>
                <CardTitle className="text-2xl">{projectStats.totalPhases}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Concluídas</CardDescription>
                <CardTitle className="text-2xl text-green-600">{projectStats.completedPhases}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Em Progresso</CardDescription>
                <CardTitle className="text-2xl text-blue-600">{projectStats.inProgressPhases}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Decisões</CardDescription>
                <CardTitle className="text-2xl">{projectStats.totalDecisions}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Credits Savings Indicator */}
          <CreditsSavingsIndicator />
        </div>

        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-6 container mx-auto px-4 pb-8">
            <TabsList className="grid w-full grid-cols-8 lg:w-auto">
              {devLogTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Tooltip key={tab.value}>
                    <TooltipTrigger asChild>
                      <TabsTrigger value={tab.value} className="gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{tab.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TabsList>

            {/* TAB AI: IA Assistant */}
            <TabsContent value="ai-assistant">
              <AIAssistant 
                triggerAnalysis={triggerAnalysis}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </TabsContent>

            {/* TAB AI ROI: Dashboard de ROI Real */}
            <TabsContent value="ai-roi">
              <AIAssistantROIDashboard />
            </TabsContent>

            {/* TAB AI REVIEW: Validação Humana das Análises */}
            <TabsContent value="ai-review">
              <AIAnalysisReview />
            </TabsContent>

            {/* TAB ANNOTATION DEBUG (antes Auth Debug): Monitor de Requisições */}
            <TabsContent value="annotation-debug">
              <AnnotationDebugPanel />
            </TabsContent>

            {/* TAB CODE SCANNER: Real-time Code Scanner */}
            <TabsContent value="code-scanner">
              <CodeScannerInterface />
            </TabsContent>

            {/* TAB SENTRY TESTS: Smoke Tests para Sentry */}
            <TabsContent value="sentry-tests">
              <Card>
                <CardHeader>
                  <CardTitle>Testes de Integração Sentry</CardTitle>
                  <CardDescription>
                    Ferramentas para testar a captura de erros frontend e backend pelo Sentry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SentrySmokeTest />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONSTRUCTION MANAGER: Construction Log Manager */}
            <TabsContent value="construction-manager">
              <ConstructionLogManager />
            </TabsContent>

            {/* TAB TEMPORAL EVOLUTION: Dashboard de Evolução */}
            <TabsContent value="temporal-evolution">
              <TemporalEvolutionDashboard />
            </TabsContent>

            {/* TAB SUBCORPUS DEBUG: Debug do SubcorpusContext */}
            <TabsContent value="subcorpus-debug">
              <SubcorpusDebugPanel />
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      </div>
    </div>
  );
}