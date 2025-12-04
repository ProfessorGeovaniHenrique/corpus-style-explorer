import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { InsigniaDistribution } from '@/hooks/useInsigniaStats';
import { INSIGNIAS_OPTIONS } from '@/data/types/cultural-insignia.types';

interface InsigniaDistributionChartProps {
  distribution: InsigniaDistribution[];
  totalWith: number;
  totalWithout: number;
  variant?: 'pie' | 'bar';
}

const COLORS = {
  'Gaúcho': 'hsl(var(--chart-1))',
  'Nordestino': 'hsl(var(--chart-2))',
  'Caipira': 'hsl(var(--chart-3))',
  'Platino': 'hsl(var(--chart-4))',
  'Indígena': 'hsl(var(--chart-5))',
  'Afro-Brasileiro': 'hsl(142, 71%, 45%)',
};

export function InsigniaDistributionChart({ 
  distribution, 
  totalWith, 
  totalWithout,
  variant = 'bar' 
}: InsigniaDistributionChartProps) {
  const getInsigniaLabel = (insignia: string) => {
    const option = INSIGNIAS_OPTIONS.find(o => o.value === insignia);
    return option?.label || insignia;
  };

  const chartData = distribution.map(d => ({
    name: getInsigniaLabel(d.insignia),
    value: d.count,
    percentage: d.percentage,
    fill: COLORS[d.insignia as keyof typeof COLORS] || 'hsl(var(--muted))',
  }));

  // Add "Sem Insígnia" to chart
  const coverageData = [
    { name: 'Com Insígnia', value: totalWith, fill: 'hsl(var(--primary))' },
    { name: 'Sem Insígnia', value: totalWithout, fill: 'hsl(var(--muted))' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Coverage Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cobertura de Insígnias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={coverageData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {coverageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-muted-foreground mt-2">
            {((totalWith / (totalWith + totalWithout)) * 100).toFixed(1)}% classificadas
          </div>
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribuição por Insígnia</CardTitle>
        </CardHeader>
        <CardContent>
          {variant === 'bar' ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [value.toLocaleString(), 'Palavras']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${percentage.toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
