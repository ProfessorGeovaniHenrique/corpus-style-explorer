import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function NCWordsPanel() {
  const { data: ncWords, isLoading, refetch } = useQuery({
    queryKey: ['nc-words'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('semantic_disambiguation_cache')
        .select('palavra, confianca, contexto_hash')
        .eq('tagset_codigo', 'NC')
        .order('palavra')
        .limit(50);

      if (error) throw error;
      return data;
    }
  });

  const handleReclassify = async () => {
    try {
      toast.info('Iniciando reclassificação de palavras NC...');
      
      const { data, error } = await supabase.functions.invoke('reprocess-unclassified', {
        body: { mode: 'reprocess', criteria: { includeNC: true } }
      });

      if (error) throw error;
      
      toast.success(`Reclassificação iniciada: ${data.message}`);
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Reclassification error:', error);
      toast.error('Erro ao iniciar reclassificação');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Palavras Não Classificadas (NC)
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReclassify}
            disabled={!ncWords || ncWords.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reclassificar Todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando palavras NC...
          </div>
        ) : !ncWords || ncWords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            ✅ Nenhuma palavra NC encontrada
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              {ncWords.length} palavras não classificadas (mostrando até 50)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
              {ncWords.map((word, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between border rounded p-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm font-mono">{word.palavra}</span>
                  <Badge variant="destructive" className="text-xs">
                    {(word.confianca * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
