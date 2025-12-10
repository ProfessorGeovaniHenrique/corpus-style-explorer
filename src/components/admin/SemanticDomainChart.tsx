import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DomainData {
  tagset: string;
  count: number;
  percentage: number;
}

interface SemanticDomainChartProps {
  data: DomainData[];
}

export function SemanticDomainChart({ data }: SemanticDomainChartProps) {
  const getBarColor = (tagset: string) => {
    if (tagset === 'NC') return 'hsl(var(--destructive))';
    if (tagset === 'MG') return 'hsl(var(--muted))';
    return 'hsl(var(--primary))';
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold leading-none tracking-tight">Distribuição de Domínios Semânticos</h2>
      </CardHeader>
      <CardContent>
        <div 
          role="img" 
          aria-label={`Gráfico de barras mostrando distribuição de ${data.length} domínios semânticos`}
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
              <XAxis type="number" />
              <YAxis dataKey="tagset" type="category" width={80} />
              <Tooltip 
                formatter={(value: number) => `${value} palavras`}
                labelFormatter={(label) => `Domínio: ${label}`}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.tagset)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="text-sm text-muted-foreground">Legenda:</div>
          <div className="flex flex-wrap gap-4 text-sm" role="list" aria-label="Legenda do gráfico">
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} aria-hidden="true" />
              <span>Classificados</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} aria-hidden="true" />
              <span>NC (Não Classificados)</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }} aria-hidden="true" />
              <span>MG (Morfologia Gramatical)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
