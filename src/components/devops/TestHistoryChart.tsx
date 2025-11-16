import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TestHistoryData {
  date: string;
  passed: number;
  failed: number;
  total: number;
  coverage: number;
}

interface TestHistoryChartProps {
  data: TestHistoryData[];
}

export function TestHistoryChart({ data }: TestHistoryChartProps) {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  const passRate = ((latestData.passed / latestData.total) * 100).toFixed(1);
  const previousPassRate = previousData 
    ? ((previousData.passed / previousData.total) * 100).toFixed(1)
    : passRate;
  
  const trend = parseFloat(passRate) >= parseFloat(previousPassRate);
  const TrendIcon = trend ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Testes</CardTitle>
            <CardDescription>Tendência de aprovação dos últimos 30 dias</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold">{passRate}%</div>
              <div className={`text-sm flex items-center gap-1 ${trend ? 'text-green-500' : 'text-red-500'}`}>
                <TrendIcon className="h-4 w-4" />
                {trend ? 'Melhorando' : 'Piorando'}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="passed" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Aprovados"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Falharam"
              dot={{ fill: 'hsl(var(--destructive))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
