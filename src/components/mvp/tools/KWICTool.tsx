import { useState, useEffect } from "react";
import { Search, Download, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateKWIC, exportKWICToCSV } from "@/services/kwicService";
import { KWICContext, CorpusCompleto } from "@/data/types/full-text-corpus.types";
import { toast } from "sonner";
import { useTools } from "@/contexts/ToolsContext";
import { useSubcorpus } from "@/contexts/SubcorpusContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useFeatureTour } from "@/hooks/useFeatureTour";
import { kwicTourSteps } from "./KWICTool.tour";

export function KWICTool() {
  useFeatureTour('kwic', kwicTourSteps);
  
  const { selectedWord } = useTools();
  const { getFilteredCorpus, currentMetadata } = useSubcorpus();
  const [palavra, setPalavra] = useState('');
  const [contextoSize, setContextoSize] = useState(5);
  const [results, setResults] = useState<KWICContext[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [corpus, setCorpus] = useState<CorpusCompleto | null>(null);
  const [isLoadingCorpus, setIsLoadingCorpus] = useState(false);
  
  useEffect(() => {
    const loadCorpus = async () => {
      setIsLoadingCorpus(true);
      try {
        const filteredCorpus = await getFilteredCorpus();
        setCorpus(filteredCorpus);
      } catch (error) {
        console.error('Erro ao carregar corpus:', error);
        toast.error('Erro ao carregar corpus');
      } finally {
        setIsLoadingCorpus(false);
      }
    };
    loadCorpus();
  }, [getFilteredCorpus]);
  
  useEffect(() => {
    if (selectedWord) setPalavra(selectedWord);
  }, [selectedWord]);
  
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
      const contexts = generateKWIC(corpus, palavra, contextoSize);
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
          <div className="space-y-2">
            <Label>Palavra de busca</Label>
            <Input value={palavra} onChange={(e) => setPalavra(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <div className="space-y-2">
            <Label>Tamanho do contexto: {contextoSize} palavras</Label>
            <Slider value={[contextoSize]} onValueChange={([v]) => setContextoSize(v)} min={3} max={15} step={1} />
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
        <Card>
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
