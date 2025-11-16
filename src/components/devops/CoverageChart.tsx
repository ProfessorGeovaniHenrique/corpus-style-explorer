import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Target } from "lucide-react";

interface CoverageData {
  name: string;
  value: number;
  color: string;
}

interface CoverageChartProps {
  data: CoverageData[];
  totalCoverage: number;
}

export function CoverageChart({ data, totalCoverage }: CoverageChartProps) {
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return "text-green-500";
    if (coverage >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  const getCoverageLabel = (coverage: number) => {
    if (coverage >= 90) return "Excelente";
    if (coverage >= 80) return "Boa";
    if (coverage >= 70) return "Aceitável";
    return "Precisa melhorar";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Cobertura de Testes
            </CardTitle>
            <CardDescription>Distribuição da cobertura por categoria</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getCoverageColor(totalCoverage)}`}>
              {totalCoverage}%
            </div>
            <div className="text-sm text-muted-foreground">
              {getCoverageLabel(totalCoverage)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.value} testes</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
