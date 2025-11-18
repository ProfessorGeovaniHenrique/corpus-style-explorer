import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings2, Trash2 } from 'lucide-react';
import { useTools } from '@/contexts/ToolsContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function KeywordsConfigPanel() {
  const { keywordsState, setKeywordsState, clearAllCache } = useTools();
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Configurar Análise
          </CardTitle>
          
          {/* Botão de Limpar Cache */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar Cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar Cache e Recarregar?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>Esta ação irá:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Remover todos os dados salvos do localStorage</li>
                    <li>Resetar todas as configurações para valores padrão</li>
                    <li>Recarregar a página automaticamente</li>
                  </ul>
                  <p className="font-semibold text-destructive mt-3">
                    ⚠️ Esta ação não pode ser desfeita!
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={clearAllCache}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sim, Limpar Tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
