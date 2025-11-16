import { useState } from "react";
import { Search, Download, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useFullTextCorpus } from "@/hooks/useFullTextCorpus";
import { generateNGrams, exportNGramsToCSV } from "@/services/ngramsService";
import { NGramAnalysis } from "@/data/types/full-text-corpus.types";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function NGramsTool() {
  const [corpusType, setCorpusType] = useState<'gaucho' | 'nordestino'>('gaucho');
  const [nSize, setNSize] = useState(2);
  const [minFreq, setMinFreq] = useState(2);
  const [maxResults, setMaxResults] = useState(100);
  const [analysis, setAnalysis] = useState<NGramAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { corpus, isLoading, error, progress } = useFullTextCorpus(corpusType);
  
  const handleGenerate = () => {
    if (!corpus) {
      toast.error('Corpus ainda não carregado');
      return;
    }
    
    setIsProcessing(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const result = generateNGrams(corpus, nSize, minFreq, maxResults);
        setAnalysis(result);
        setIsProcessing(false);
        
        if (result.ngrams.length === 0) {
          toast.warning(`Nenhum ${nSize}-gram encontrado com frequência mínima de ${minFreq}`);
        } else {
          toast.success(`${result.ngrams.length} ${nSize}-grams gerados`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao gerar N-grams');
        setIsProcessing(false);
      }
    }, 100);
  };
  
  const handleExport = () => {
    if (!analysis) {
      toast.error('Nenhuma análise para exportar');
      return;
    }
    
    const csv = exportNGramsToCSV(analysis);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nSize}grams_${corpusType}.csv`;
    link.click();
    
    toast.success('N-grams exportados com sucesso');
  };
  
  const getNGramLabel = (n: number) => {
    switch(n) {
      case 2: return 'Bigramas';
      case 3: return 'Trigramas';
      case 4: return 'Quadrigramas';
      case 5: return 'Pentagramas';
      default: return `${n}-gramas`;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de N-grams</CardTitle>
          <CardDescription>
            Identifique sequências de palavras mais frequentes no corpus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando corpus...
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Corpus</Label>
              <Select value={corpusType} onValueChange={(v) => setCorpusType(v as 'gaucho' | 'nordestino')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaucho">🎸 Corpus Gaúcho</SelectItem>
                  <SelectItem value="nordestino">🪘 Corpus Nordestino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tamanho do N-gram</Label>
              <Select value={nSize.toString()} onValueChange={(v) => setNSize(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2-grams (Bigramas)</SelectItem>
                  <SelectItem value="3">3-grams (Trigramas)</SelectItem>
                  <SelectItem value="4">4-grams (Quadrigramas)</SelectItem>
                  <SelectItem value="5">5-grams (Pentagramas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência Mínima</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={minFreq}
                onChange={(e) => setMinFreq(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Máximo de Resultados</Label>
              <Input
                type="number"
                min={10}
                max={1000}
                step={10}
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando N-grams...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Gerar N-grams
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleExport} 
              variant="outline"
              disabled={!analysis}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {getNGramLabel(analysis.n)}
            </CardTitle>
            <CardDescription>
              {analysis.ngrams.length} {getNGramLabel(analysis.n).toLowerCase()} únicos
              {' '}(de {analysis.ngramsUnicos.toLocaleString()} totais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead className="w-[40%]">N-gram</TableHead>
                    <TableHead className="w-[120px]">Frequência</TableHead>
                    <TableHead>Exemplo de Contexto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.ngrams.map((ng, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-muted-foreground">
                        #{idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {ng.ngram}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ng.frequencia}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="line-clamp-1">
                            {ng.ocorrencias[0]?.contexto}
                          </div>
                          <div className="text-xs">
                            {ng.ocorrencias[0]?.metadata.artista} - {ng.ocorrencias[0]?.metadata.musica}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {analysis.ngrams.length >= maxResults && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Mostrando {maxResults} de {analysis.ngramsUnicos} N-grams únicos. 
                Aumente o limite para ver mais.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
