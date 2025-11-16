import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileText, Tag, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CorpusMetric {
  label: string;
  value: number;
  total: number;
  change: number;
  icon: typeof Database;
}

interface CorpusMetricsCardProps {
  metrics: CorpusMetric[];
}

export function CorpusMetricsCard({ metrics }: CorpusMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Métricas do Corpus
        </CardTitle>
        <CardDescription>Estatísticas atuais do corpus master</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const percentage = (metric.value / metric.total) * 100;
          const isPositive = metric.change >= 0;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {metric.value.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {metric.total.toLocaleString('pt-BR')}
                  </span>
                  <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <TrendingUp className={`h-3 w-3 ${!isPositive && 'rotate-180'}`} />
                    {Math.abs(metric.change)}%
                  </div>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {percentage.toFixed(1)}% completo
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
