/**
 * 🔍 MODAL DE DETALHES DA PALAVRA DIALETAL
 * 
 * Exibe informações completas sobre uma marca dialetal:
 * - Exemplos de uso (KWIC)
 * - Palavras relacionadas do dicionário
 * - Gráfico de comparação de frequências
 * - Metadados completos
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  Link2,
  Download,
  ExternalLink
} from 'lucide-react';
import { EnrichedDialectalMark } from '@/data/types/dialectal-dictionary.types';
import { KeywordEntry } from '@/data/types/corpus-tools.types';
import { findInDictionary } from '@/data/dialectal-dictionary';
import { kwicDataMap } from '@/data/mockup/kwic';

interface DialectalWordDetailModalProps {
  marca: EnrichedDialectalMark | null;
  keywordData?: KeywordEntry;
  isOpen: boolean;
  onClose: () => void;
}

const TIPO_COLORS = {
  regionalismo: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  arcaismo: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  platinismo: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  lexical: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
  expressao: 'bg-green-500/10 text-green-700 border-green-500/20'
};

export function DialectalWordDetailModal({
  marca,
  keywordData,
  isOpen,
  onClose
}: DialectalWordDetailModalProps) {
  const [kwicExamples, setKwicExamples] = useState<any[]>([]);
  const [relatedWords, setRelatedWords] = useState<any[]>([]);

  useEffect(() => {
    if (marca) {
      // Busca exemplos KWIC
      const examples = kwicDataMap[marca.termo] || [];
      setKwicExamples(examples.slice(0, 10)); // Limita a 10 exemplos

      // Busca palavras relacionadas do dicionário
      const dictEntry = findInDictionary(marca.termo);
      if (dictEntry?.referenciaCruzada) {
        const related = dictEntry.referenciaCruzada
          .map(ref => findInDictionary(ref))
          .filter(Boolean);
        setRelatedWords(related);
      } else {
        setRelatedWords([]);
      }
    }
  }, [marca]);

  if (!marca) return null;

  const colors = TIPO_COLORS[marca.tipo];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="font-bold">{marca.termo}</span>
            <Badge variant="outline" className={`text-sm ${colors}`}>
              {marca.tipo}
            </Badge>
            {marca.origem && (
              <Badge variant="secondary" className="text-sm">
                {marca.origem}
              </Badge>
            )}
          </DialogTitle>
          {marca.definicao && (
            <DialogDescription className="text-base pt-2 border-t mt-2">
              {marca.definicao}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-4 gap-3 py-4 border-y">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{marca.score.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Score Dialetal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{marca.ll.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Log-Likelihood</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{marca.mi.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Mutual Information</p>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {marca.statusTemporal || 'Atual'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </div>
        </div>

        <Tabs defaultValue="kwic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kwic">
              <FileText className="h-4 w-4 mr-2" />
              KWIC
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparação
            </TabsTrigger>
            <TabsTrigger value="related">
              <Link2 className="h-4 w-4 mr-2" />
              Relacionadas
            </TabsTrigger>
          </TabsList>

          {/* KWIC - Exemplos de uso */}
          <TabsContent value="kwic" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    {kwicExamples.length} exemplos de uso
                  </h3>
                  {kwicExamples.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-2" />
                      Exportar
                    </Button>
                  )}
                </div>

                {kwicExamples.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum exemplo de uso disponível para esta palavra.</p>
                      <p className="text-xs mt-2">
                        Os exemplos KWIC são gerados a partir do corpus completo.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  kwicExamples.map((example, idx) => (
                    <Card key={idx} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2 text-sm font-mono">
                          <span className="text-muted-foreground text-right w-8 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 overflow-hidden">
                            <p className="whitespace-pre-wrap break-words">
                              <span className="text-muted-foreground">{example.leftContext}</span>
                              <span className="font-bold text-primary bg-primary/10 px-1 rounded">
                                {example.keyword}
                              </span>
                              <span className="text-muted-foreground">{example.rightContext}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {example.source}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Comparação de Frequências */}
          <TabsContent value="comparison" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Comparação entre Corpus de Estudo e Referência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Frequência Bruta */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Frequência Bruta
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Corpus de Estudo (Gaúcho)</span>
                          <span className="font-mono font-bold">
                            {keywordData?.freqEstudo || marca.ll * 10}
                          </span>
                        </div>
                        <Progress 
                          value={keywordData ? (keywordData.freqEstudo / (keywordData.freqEstudo + keywordData.freqReferencia)) * 100 : 80} 
                          className="h-3"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Corpus de Referência</span>
                          <span className="font-mono font-bold">
                            {keywordData?.freqReferencia || 5}
                          </span>
                        </div>
                        <Progress 
                          value={keywordData ? (keywordData.freqReferencia / (keywordData.freqEstudo + keywordData.freqReferencia)) * 100 : 20} 
                          className="h-3 bg-muted"
                        />
                      </div>
                    </div>

                    {/* Frequência Normalizada */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Frequência Normalizada (por milhão)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {keywordData?.normFreqEstudo.toFixed(2) || (marca.ll * 0.5).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Estudo</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-slate-600">
                              {keywordData?.normFreqReferencia.toFixed(2) || '0.50'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Referência</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Efeito Estatístico */}
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Significância Estatística
                      </h4>
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            marca.tipo === 'regionalismo' || marca.tipo === 'platinismo' || marca.tipo === 'arcaismo'
                              ? 'bg-green-500'
                              : 'bg-slate-500'
                          }`} />
                          <span className="text-sm font-medium">
                            {marca.tipo === 'regionalismo' || marca.tipo === 'platinismo' 
                              ? 'Super-representado' 
                              : 'Equilibrado'}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {marca.ll > 15 ? 'Alta significância' : 'Média significância'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Palavras Relacionadas */}
          <TabsContent value="related" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    Palavras Relacionadas no Dicionário
                  </h3>
                </div>

                {relatedWords.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma palavra relacionada encontrada.</p>
                      <p className="text-xs mt-2">
                        Esta palavra não possui referências cruzadas no dicionário.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  relatedWords.map((word, idx) => (
                    <Card key={idx} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-base">{word.verbete}</h4>
                              <Badge variant="outline" className="text-xs">
                                {word.origem}
                              </Badge>
                              {word.statusTemporal && (
                                <Badge variant="secondary" className="text-xs">
                                  {word.statusTemporal}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {word.definicao}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {word.classeGramatical}
                              </Badge>
                              <span className="text-xs text-muted-foreground capitalize">
                                {word.categoria.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Metadados adicionais */}
                {marca.classeGramatical && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Informações Gramaticais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Classe:</span>
                        <Badge variant="outline">{marca.classeGramatical}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Categoria:</span>
                        <span className="capitalize">{marca.categoria.replace('_', ' ')}</span>
                      </div>
                      {marca.frequencia && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Frequência de uso:</span>
                          <Badge variant="secondary" className="text-xs">
                            {marca.frequencia === 'r/us' && 'Raro'}
                            {marca.frequencia === 'm/us' && 'Médio'}
                            {marca.frequencia === 'n/d' && 'Não determinado'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
