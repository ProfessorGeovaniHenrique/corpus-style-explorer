import React, { useState, useEffect } from "react";
import { Search, Download, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateKWIC, exportKWICToCSV } from "@/services/kwicService";
import { KWICContext, CorpusCompleto } from "@/data/types/full-text-corpus.types";
import { CorpusType } from "@/data/types/corpus-tools.types";
import { toast } from "sonner";
import { useTools } from "@/contexts/ToolsContext";
import { useSubcorpus } from "@/contexts/SubcorpusContext";
import { loadSpecificCorpus } from "@/contexts/CorpusContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useFeatureTour } from "@/hooks/useFeatureTour";
import { kwicTourSteps } from "./KWICTool.tour";

const KWICTableComponent = React.memo(({ results }: { results: any[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contexto Esquerdo</TableHead>
          <TableHead className="text-center font-bold">Palavra-Chave</TableHead>
          <TableHead>Contexto Direito</TableHead>
          <TableHead>Fonte</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, idx) => (
          <TableRow key={idx}>
            <TableCell className="text-right text-muted-foreground">
              {result.esquerda}
            </TableCell>
            <TableCell className="text-center font-bold">
              {result.palavra}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {result.direita}
            </TableCell>
            <TableCell className="text-sm">
              {result.artista} - {result.musica}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}, (prevProps, nextProps) => {
  return prevProps.results === nextProps.results;
});

export function KWICTool() {
  useFeatureTour('kwic', kwicTourSteps);
  
  const { selectedWord, kwicState, setKwicState } = useTools();
  const { getFilteredCorpus, currentMetadata } = useSubcorpus();
  const [isProcessing, setIsProcessing] = useState(false);
  const [corpus, setCorpus] = useState<CorpusCompleto | null>(null);
  const [isLoadingCorpus, setIsLoadingCorpus] = useState(false);
  const [tempCorpusContext, setTempCorpusContext] = useState<{
    corpusBase: CorpusType;
    mode: 'complete' | 'single';
    artistaA: string | null;
  } | null>(null);
  
  // Usar estado do context
  const palavra = kwicState.palavra;
  const setPalavra = (val: string) => setKwicState({ palavra: val });
  const contextoEsquerdaSize = kwicState.contextoEsquerdo;
  const setContextoEsquerdaSize = (val: number) => setKwicState({ contextoEsquerdo: val });
  const contextoDireitaSize = kwicState.contextoDireito;
  const setContextoDireitaSize = (val: number) => setKwicState({ contextoDireito: val });
  const results = kwicState.results;
  const setResults = (val: KWICContext[]) => setKwicState({ results: val });
  
  // Consumir contexto temporário do sessionStorage (apenas uma vez no mount)
  useEffect(() => {
    const tempContext = sessionStorage.getItem('kwic-temp-context');
    
    if (tempContext) {
      try {
        const parsed = JSON.parse(tempContext);
        
        // Validar idade do contexto (máximo 5 segundos)
        if (Date.now() - parsed.timestamp < 5000) {
          setTempCorpusContext({
            corpusBase: parsed.corpusBase,
            mode: parsed.mode,
            artistaA: parsed.artistaA
          });
          
          console.log('✅ Contexto temporário carregado:', parsed);
          
          const corpusDesc = parsed.mode === 'single' && parsed.artistaA
            ? parsed.artistaA
            : `${parsed.corpusBase} (completo)`;
          
          toast.info('Busca contextual ativada', {
            description: `Usando corpus: ${corpusDesc}`,
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Erro ao parsear contexto temporário:', error);
      } finally {
        // SEMPRE limpar após consumir
        sessionStorage.removeItem('kwic-temp-context');
      }
    }
  }, []);
  
  // Carregar corpus (contextual ou global)
  useEffect(() => {
    const loadCorpus = async () => {
      setIsLoadingCorpus(true);
      try {
        let filteredCorpus: CorpusCompleto;
        
        // Priorizar contexto temporário (busca pontual)
        if (tempCorpusContext) {
          console.log('📦 Carregando corpus contextual:', tempCorpusContext);
          filteredCorpus = await loadSpecificCorpus(tempCorpusContext);
          
          // Limpar após usar (não persiste)
          setTempCorpusContext(null);
        } else {
          // Comportamento padrão: usar SubcorpusContext global
          filteredCorpus = await getFilteredCorpus();
        }
        
        setCorpus(filteredCorpus);
      } catch (error) {
        console.error('Erro ao carregar corpus:', error);
        toast.error('Erro ao carregar corpus');
      } finally {
        setIsLoadingCorpus(false);
      }
    };
    loadCorpus();
  }, [getFilteredCorpus, tempCorpusContext]);
  
  useEffect(() => {
    if (selectedWord) {
      setPalavra(selectedWord);
      
      // Busca automática com debounce de 300ms
      const timer = setTimeout(() => {
        if (corpus && selectedWord.trim()) {
          setIsProcessing(true);
          
          try {
            const contexts = generateKWIC(corpus, selectedWord, contextoEsquerdaSize, contextoDireitaSize);
            setResults(contexts);
            toast.success(`${contexts.length} ocorrências encontradas para "${selectedWord}"`, {
              description: 'Busca disparada automaticamente. Ajuste o contexto se necessário.',
              duration: 4000
            });
          } catch (error) {
            console.error('Erro na busca automática:', error);
            toast.error('Erro ao buscar concordâncias');
          } finally {
            setIsProcessing(false);
          }
        } else if (!corpus) {
          toast.info(`Palavra "${selectedWord}" carregada`, {
            description: 'Aguarde o carregamento do corpus para buscar',
            duration: 3000
          });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [selectedWord, corpus, contextoEsquerdaSize, contextoDireitaSize]);
  
  const handleSearch = () => {
    if (!palavra.trim()) {
      toast.error('Digite uma palavra para buscar');
      return;
    }
    if (!corpus) {
      toast.error('Corpus ainda não carregado');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const contexts = generateKWIC(corpus, palavra, contextoEsquerdaSize, contextoDireitaSize);
      setResults(contexts);
      setIsProcessing(false);
      toast.success(`${contexts.length} ocorrências encontradas`);
    }, 100);
  };
  
  const handleExport = () => {
    if (results.length === 0) {
      toast.error('Nenhum resultado para exportar');
      return;
    }
    const csv = exportKWICToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const subcorpusLabel = currentMetadata ? `_${currentMetadata.artista.replace(/\s+/g, '_')}` : '';
    link.download = `kwic_${palavra}${subcorpusLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('KWIC exportado com sucesso');
  };
  
  return (
    <div className="space-y-6">
      {currentMetadata && (
        <Alert className="border-primary/20 bg-primary/5">
          <Music className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-3">
            <span>Analisando subcorpus: <strong className="text-primary">{currentMetadata.artista}</strong></span>
            <Badge variant="outline">{currentMetadata.totalMusicas} músicas</Badge>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoadingCorpus && (
        <Card><CardContent className="pt-6"><Progress value={50} /></CardContent></Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Configuração KWIC</CardTitle>
          <CardDescription>Configure a busca de concordâncias no corpus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2" data-tour="kwic-input">
            <Label>Palavra de busca</Label>
            <Input value={palavra} onChange={(e) => setPalavra(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Contexto à Esquerda</Label>
                  <Badge variant="outline" className="font-mono text-xs">{contextoEsquerdaSize} palavras</Badge>
                </div>
                <Slider value={[contextoEsquerdaSize]} onValueChange={([v]) => setContextoEsquerdaSize(v)} min={1} max={15} step={1} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Contexto à Direita</Label>
                  <Badge variant="outline" className="font-mono text-xs">{contextoDireitaSize} palavras</Badge>
                </div>
                <Slider value={[contextoDireitaSize]} onValueChange={([v]) => setContextoDireitaSize(v)} min={1} max={15} step={1} />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" onClick={() => {
                const avg = Math.round((contextoEsquerdaSize + contextoDireitaSize) / 2);
                setContextoEsquerdaSize(avg);
                setContextoDireitaSize(avg);
                toast.info(`Contexto simétrico: ${avg} palavras`);
              }}>⚖️ Igualar Contextos</Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isProcessing || !corpus}>
              {isProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando...</> : <><Search className="h-4 w-4 mr-2" />Buscar</>}
            </Button>
            {results.length > 0 && <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar</Button>}
          </div>
        </CardContent>
      </Card>
      
      {results.length > 0 && (
        <Card data-tour="kwic-results">
          <CardHeader><CardTitle>{results.length} ocorrências encontradas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%] text-right">Contexto Esquerdo</TableHead>
                  <TableHead className="w-[15%] text-center">Palavra-Chave</TableHead>
                  <TableHead className="w-[35%]">Contexto Direito</TableHead>
                  <TableHead className="w-[15%]">Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.slice(0, 100).map((ctx, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-right text-muted-foreground">{ctx.contextoEsquerdo}</TableCell>
                    <TableCell className="text-center font-bold text-primary">{ctx.palavra}</TableCell>
                    <TableCell className="text-muted-foreground">{ctx.contextoDireito}</TableCell>
                    <TableCell className="text-xs">{ctx.metadata.artista} - {ctx.metadata.musica}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {results.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Mostrando 100 de {results.length} resultados. Exporte o CSV para ver todos.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
