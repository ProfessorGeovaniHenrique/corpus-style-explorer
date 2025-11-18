import { useState, useMemo } from "react";
import { useKeywords } from "@/hooks/useKeywords";
import { useFeatureTour } from "@/hooks/useFeatureTour";
import { keywordsTourSteps } from "./KeywordsTool.tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Search, Play, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, MousePointerClick, Music } from "lucide-react";
import { KeywordEntry, CorpusType, CORPUS_CONFIG } from "@/data/types/corpus-tools.types";
import { useTools } from "@/contexts/ToolsContext";
import { useSubcorpus } from "@/contexts/SubcorpusContext";
import { toast } from "sonner";

export function KeywordsTool() {
  useFeatureTour('keywords', keywordsTourSteps);
  
  const [corpusEstudo, setCorpusEstudo] = useState<CorpusType>('gaucho');
  const [corpusReferencia, setCorpusReferencia] = useState<CorpusType>('nordestino');
  const { keywords, isLoading, error, isProcessed, processKeywords } = useKeywords();
  const { navigateToKWIC } = useTools();
  const { currentMetadata, selection } = useSubcorpus();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSignificancia, setFilterSignificancia] = useState({
    Alta: true,
    Média: true,
    Baixa: true
  });
  const [filterEfeito, setFilterEfeito] = useState({
    'super-representado': true,
    'sub-representado': true
  });
  const [sortColumn, setSortColumn] = useState<keyof KeywordEntry>('ll');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [minLLFilter, setMinLLFilter] = useState<number>(3.84);
  
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter(kw => {
        if (searchTerm && !kw.palavra.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (!filterSignificancia[kw.significancia]) return false;
        if (!filterEfeito[kw.efeito]) return false;
        if (kw.ll < minLLFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
  }, [keywords, searchTerm, filterSignificancia, filterEfeito, sortColumn, sortDirection, minLLFilter]);
  
  const handleSort = (column: keyof KeywordEntry) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  const handleExportCSV = () => {
    const estudoLabel = CORPUS_CONFIG[corpusEstudo].label;
    const referenciaLabel = CORPUS_CONFIG[corpusReferencia].label;
    
    const csv = [
      ['Rank', 'Palavra', 'Freq Estudo', 'Freq Referência', 'Norm Freq Estudo', 'Norm Freq Referência', 'Log-Likelihood', 'MI Score', 'Efeito', 'Significância'].join(','),
      ...filteredKeywords.map((kw, idx) => [
        idx + 1, kw.palavra, kw.freqEstudo, kw.freqReferencia,
        kw.normFreqEstudo.toFixed(2), kw.normFreqReferencia.toFixed(2),
        kw.ll.toFixed(2), kw.mi.toFixed(3), kw.efeito, kw.significancia
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `keywords_${corpusEstudo}_vs_${corpusReferencia}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Keywords exportadas com sucesso!');
  };
  
  const handleWordClick = (palavra: string) => {
    navigateToKWIC(palavra);
    toast.success(`Buscando "${palavra}" no KWIC...`);
  };
  
  return (
    <div className="space-y-6">
      {(currentMetadata || selection.mode === 'compare') && (
        <Alert className="border-primary/20 bg-primary/5">
          <Music className="h-4 w-4" />
          <AlertDescription>
            {selection.mode === 'compare' && selection.artistaA ? (
              <span className="flex items-center gap-2">
                Comparando: <strong className="text-primary">{selection.artistaA}</strong> vs <strong className="text-primary">{selection.artistaB || 'Resto do Corpus'}</strong>
              </span>
            ) : currentMetadata ? (
              <span className="flex items-center gap-3">
                Analisando subcorpus: <strong className="text-primary">{currentMetadata.artista}</strong>
                <Badge variant="outline">{currentMetadata.totalMusicas} músicas</Badge>
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
      
      {selection.mode === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Análise</CardTitle>
            <CardDescription>Selecione os corpora de estudo e referência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Corpus de Estudo</Label>
                <Select value={corpusEstudo} onValueChange={(v) => setCorpusEstudo(v as CorpusType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaucho">Gaúcho Consolidado</SelectItem>
                    <SelectItem value="nordestino">Nordestino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Corpus de Referência</Label>
                <Select value={corpusReferencia} onValueChange={(v) => setCorpusReferencia(v as CorpusType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaucho">Gaúcho Consolidado</SelectItem>
                    <SelectItem value="nordestino">Nordestino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => processKeywords(corpusEstudo, corpusReferencia)} disabled={isLoading || corpusEstudo === corpusReferencia}>
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : <><Play className="h-4 w-4 mr-2" />Gerar Keywords</>}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {selection.mode !== 'complete' && (
        <Button onClick={() => processKeywords(corpusEstudo, corpusReferencia)} disabled={isLoading}>
          {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : <><TrendingUp className="h-4 w-4 mr-2" />Gerar Keywords</>}
        </Button>
      )}
      
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      
      {isProcessed && keywords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{filteredKeywords.length} palavras-chave encontradas</CardTitle>
                <CardDescription>Estatísticas de comparação entre corpora</CardDescription>
              </div>
              <Button variant="outline" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label><Search className="inline h-4 w-4 mr-2" />Buscar palavra</Label>
                  <Input placeholder="Digite para filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>LL Mínimo: {minLLFilter.toFixed(2)}</Label>
                  <Input type="number" step="0.1" value={minLLFilter} onChange={(e) => setMinLLFilter(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label>Significância</Label>
                  <div className="flex gap-2">
                    {['Alta', 'Média', 'Baixa'].map(sig => (
                      <div key={sig} className="flex items-center gap-2">
                        <Checkbox checked={filterSignificancia[sig as keyof typeof filterSignificancia]} onCheckedChange={(checked) => setFilterSignificancia(prev => ({ ...prev, [sig]: checked }))} />
                        <span className="text-sm">{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Efeito</Label>
                  <div className="flex gap-2">
                    {[{ key: 'super-representado', label: 'Super-rep.' }, { key: 'sub-representado', label: 'Sub-rep.' }].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox checked={filterEfeito[key as keyof typeof filterEfeito]} onCheckedChange={(checked) => setFilterEfeito(prev => ({ ...prev, [key]: checked }))} />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('palavra')} className="p-0 h-auto font-semibold">
                      Palavra {sortColumn === 'palavra' && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => handleSort('ll')} className="p-0 h-auto font-semibold ml-auto">
                      LL {sortColumn === 'll' && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Efeito</TableHead>
                  <TableHead className="text-center">Significância</TableHead>
                  <TableHead className="w-20 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.slice(0, 100).map((kw, idx) => (
                  <TableRow key={kw.palavra}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium">{kw.palavra}</TableCell>
                    <TableCell className="text-right">{kw.ll.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={kw.efeito === 'super-representado' ? 'default' : 'secondary'} className="gap-1">
                        {kw.efeito === 'super-representado' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {kw.efeito === 'super-representado' ? 'Super-rep.' : 'Sub-rep.'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={kw.significancia === 'Alta' ? 'destructive' : kw.significancia === 'Média' ? 'default' : 'secondary'}>
                        {kw.significancia}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleWordClick(kw.palavra)} className="h-8 w-8">
                              <MousePointerClick className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver no KWIC</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredKeywords.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Mostrando 100 de {filteredKeywords.length} keywords. Exporte o CSV para ver todos.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
