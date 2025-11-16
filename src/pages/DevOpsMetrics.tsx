import { WorkflowStatusCard } from "@/components/devops/WorkflowStatusCard";
import { TestHistoryChart } from "@/components/devops/TestHistoryChart";
import { CoverageChart } from "@/components/devops/CoverageChart";
import { CorpusMetricsCard } from "@/components/devops/CorpusMetricsCard";
import { ReleasesTimeline } from "@/components/devops/ReleasesTimeline";
import { Database, FileText, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data - Em produção, esses dados viriam de APIs ou arquivos gerados pelo CI/CD
const workflowsData = [
  {
    name: "Quality Gate",
    status: "success" as const,
    lastRun: "há 2 horas",
    duration: "3m 45s",
    url: "https://github.com/user/repo/actions",
    branch: "main",
  },
  {
    name: "Test Corpus Integrity",
    status: "success" as const,
    lastRun: "há 2 horas",
    duration: "1m 12s",
    url: "https://github.com/user/repo/actions",
    branch: "main",
  },
  {
    name: "Auto Version",
    status: "success" as const,
    lastRun: "há 5 horas",
    duration: "45s",
    url: "https://github.com/user/repo/actions",
    branch: "main",
  },
  {
    name: "Update Badges",
    status: "in_progress" as const,
    lastRun: "há 10 minutos",
    duration: "1m 30s",
    url: "https://github.com/user/repo/actions",
    branch: "main",
  },
];

const testHistoryData = [
  { date: "01/11", passed: 40, failed: 2, total: 42, coverage: 93 },
  { date: "05/11", passed: 41, failed: 1, total: 42, coverage: 95 },
  { date: "08/11", passed: 42, failed: 0, total: 42, coverage: 97 },
  { date: "10/11", passed: 42, failed: 1, total: 43, coverage: 96 },
  { date: "12/11", passed: 43, failed: 0, total: 43, coverage: 98 },
  { date: "14/11", passed: 44, failed: 1, total: 45, coverage: 97 },
  { date: "16/11", passed: 45, failed: 0, total: 45, coverage: 100 },
];

const coverageData = [
  { name: "Validação", value: 15, color: "hsl(var(--primary))" },
  { name: "Integridade", value: 12, color: "hsl(var(--chart-2))" },
  { name: "Consistência", value: 10, color: "hsl(var(--chart-3))" },
  { name: "Estatísticas", value: 8, color: "hsl(var(--chart-4))" },
];

const corpusMetrics = [
  {
    label: "Palavras no Corpus",
    value: 4250,
    total: 5000,
    change: 5.2,
    icon: Database,
  },
  {
    label: "Lemas Validados",
    value: 3890,
    total: 4250,
    change: 3.1,
    icon: FileText,
  },
  {
    label: "Domínios Semânticos",
    value: 42,
    total: 50,
    change: 2.4,
    icon: Tag,
  },
];

const releasesData = [
  {
    version: "1.3.0",
    date: "16 Nov 2024",
    type: "minor" as const,
    features: 5,
    fixes: 3,
    breaking: 0,
    url: "https://github.com/user/repo/releases/tag/v1.3.0",
  },
  {
    version: "1.2.1",
    date: "10 Nov 2024",
    type: "patch" as const,
    features: 0,
    fixes: 4,
    breaking: 0,
    url: "https://github.com/user/repo/releases/tag/v1.2.1",
  },
  {
    version: "1.2.0",
    date: "05 Nov 2024",
    type: "minor" as const,
    features: 8,
    fixes: 2,
    breaking: 0,
    url: "https://github.com/user/repo/releases/tag/v1.2.0",
  },
  {
    version: "1.1.0",
    date: "28 Out 2024",
    type: "minor" as const,
    features: 6,
    fixes: 5,
    breaking: 0,
    url: "https://github.com/user/repo/releases/tag/v1.1.0",
  },
  {
    version: "1.0.0",
    date: "15 Out 2024",
    type: "major" as const,
    features: 12,
    fixes: 0,
    breaking: 3,
    url: "https://github.com/user/repo/releases/tag/v1.0.0",
  },
];

export default function DevOpsMetrics() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">DevOps Metrics</h1>
            <p className="text-muted-foreground">
              Dashboard de métricas de CI/CD, testes e qualidade
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Última atualização: há 10 min
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Taxa de Sucesso</CardDescription>
            <CardTitle className="text-3xl text-green-500">100%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Todos os workflows passaram
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cobertura de Testes</CardDescription>
            <CardTitle className="text-3xl text-primary">97.8%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              45 de 46 testes passando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tempo Médio CI</CardDescription>
            <CardTitle className="text-3xl">2m 15s</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              15% mais rápido que ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Última Release</CardDescription>
            <CardTitle className="text-3xl">v1.3.0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Publicada há 2 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Status */}
        <WorkflowStatusCard workflows={workflowsData} />

        {/* Corpus Metrics */}
        <CorpusMetricsCard metrics={corpusMetrics} />

        {/* Test History Chart */}
        <div className="lg:col-span-2">
          <TestHistoryChart data={testHistoryData} />
        </div>

        {/* Coverage Chart */}
        <CoverageChart data={coverageData} totalCoverage={97.8} />

        {/* Releases Timeline */}
        <ReleasesTimeline releases={releasesData} />
      </div>
    </div>
  );
}
