import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AnnotationDemoAlertProps {
  onEnableDemo: () => void;
}

export function AnnotationDemoAlert({ onEnableDemo }: AnnotationDemoAlertProps) {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500">Modo Demonstração Disponível</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm text-muted-foreground">
          A anotação semântica requer autenticação para salvar seus dados permanentemente.
          Para testar sem criar uma conta, você pode usar o <strong>Modo Demonstração</strong>.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            ✓ Teste gratuito sem cadastro
          </div>
          <div className="flex items-center gap-1">
            ✓ Dados temporários (não salvos)
          </div>
          <div className="flex items-center gap-1">
            ✓ Todas as funcionalidades
          </div>
        </div>
        <Button onClick={onEnableDemo} variant="outline" size="sm" className="mt-2">
          Ativar Modo Demonstração
        </Button>
      </AlertDescription>
    </Alert>
  );
}
