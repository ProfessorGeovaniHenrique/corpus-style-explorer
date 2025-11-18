import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { useTools } from '@/contexts/ToolsContext';

export function KeywordsConfigPanel() {
  const { keywordsState, setKeywordsState } = useTools();
  const { analysisConfig } = keywordsState;

  const handleToggle = (key: keyof typeof analysisConfig) => {
    setKeywordsState({
      analysisConfig: {
        ...analysisConfig,
        [key]: !analysisConfig[key]
      }
    });
  };

  const activeCount = Object.values(analysisConfig).filter(Boolean).length;

  return (
    <Card className="mb-4 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4" />
          Configurar Análise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="keywords-list"
            checked={analysisConfig.generateKeywordsList}
            disabled
          />
          <Label htmlFor="keywords-list" className="cursor-not-allowed opacity-70">
            Lista de Keywords (obrigatório)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="scatter-plot"
            checked={analysisConfig.generateScatterPlot}
            onCheckedChange={() => handleToggle('generateScatterPlot')}
          />
          <Label htmlFor="scatter-plot" className="cursor-pointer">
            Gráfico de Dispersão (LL vs Frequência)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="comparison-chart"
            checked={analysisConfig.generateComparisonChart}
            onCheckedChange={() => handleToggle('generateComparisonChart')}
          />
          <Label htmlFor="comparison-chart" className="cursor-pointer">
            Gráfico Comparativo (Estudo vs Referência)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="dispersion"
            checked={analysisConfig.generateDispersion}
            onCheckedChange={() => handleToggle('generateDispersion')}
          />
          <Label htmlFor="dispersion" className="cursor-pointer">
            Análise de Dispersão de Palavras
          </Label>
        </div>

        <div className="pt-2 text-xs text-muted-foreground border-t">
          {activeCount} de 4 análises ativas
        </div>
      </CardContent>
    </Card>
  );
}
