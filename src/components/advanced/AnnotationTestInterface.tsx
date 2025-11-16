import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, BookOpen, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const LETRA_TESTE = `A calma do tarumã, ganhou sombra mais copada
Pela várzea espichada com o sol da tarde caindo
Um pañuelo maragato se abriu no horizonte
Trazendo um novo reponte, prá um fim de tarde bem lindo
Daí um verso de campo se chegou da campereada
No lombo de uma gateada frente aberta de respeito
Desencilhou na ramada, já cansado das lonjuras
Mas estampando a figura, campeira, bem do seu jeito
Cevou um mate pura-folha, jujado de maçanilha
E um ventito da coxilha trouxe coplas entre as asas
Prá querência galponeira, onde o verso é mais caseiro
Templado a luz de candeeiro e um "quarto gordo nas brasa"
A mansidão da campanha traz saudades feito açoite
Com os olhos negros de noite que ela mesmo aquerenciou
E o verso que tinha sonhos prá rondar na madrugada
Deixou a cancela encostada e a tropa se desgarrou
E o verso sonhou ser várzea com sombra de tarumã
Ser um galo prás manhãs, ou um gateado prá encilha
Sonhou com os olhos da prenda vestidos de primavera
Adormecidos na espera do sol pontear na coxilha
Ficaram arreios suados e o silencio de esporas
Um cerne com cor de aurora queimando em fogo de chão
Uma cuia e uma bomba recostada na cambona
E uma saudade redomona pelos cantos do galpão`;

interface AnnotationResult {
  palavra: string;
  tagset_codigo: string;
  prosody: number;
  confianca: number;
  fonte: string;
  contexto_enriquecido?: string;
}

export function AnnotationTestInterface() {
  const [texto, setTexto] = useState(LETRA_TESTE);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [results, setResults] = useState<AnnotationResult[]>([]);
  const [palavrasDialectais, setPalavrasDialectais] = useState<string[]>([]);

  const startAnnotation = async () => {
    setIsAnnotating(true);
    setResults([]);
    setPalavrasDialectais([]);
    setProgresso(0);
    
    try {
      toast.info('Iniciando anotação semântica com IA...');

      const { data, error } = await supabase.functions.invoke('annotate-semantic', {
        body: { 
          corpus_type: 'marenco-verso',
          custom_text: texto 
        }
      });

      if (error) throw error;

      setJobId(data.job.id);
      toast.success('Anotação iniciada! Acompanhe o progresso...');

      // Monitorar progresso
      const checkProgress = setInterval(async () => {
        const { data: jobData } = await supabase
          .from('annotation_jobs')
          .select('*')
          .eq('id', data.job.id)
          .single();

        if (jobData) {
          setProgresso(Math.round((jobData.progresso || 0) * 100));

          if (jobData.status === 'completed') {
            clearInterval(checkProgress);
            await loadResults(data.job.id);
            setIsAnnotating(false);
            toast.success('Anotação concluída!');
          } else if (jobData.status === 'failed') {
            clearInterval(checkProgress);
            setIsAnnotating(false);
            toast.error('Erro na anotação: ' + jobData.erro_mensagem);
          }
        }
      }, 2000);

      // Timeout de 5 minutos
      setTimeout(() => {
        clearInterval(checkProgress);
        if (isAnnotating) {
          setIsAnnotating(false);
          toast.error('Timeout: anotação excedeu o tempo limite');
        }
      }, 300000);

    } catch (error) {
      console.error('Erro ao anotar:', error);
      toast.error('Erro ao iniciar anotação');
      setIsAnnotating(false);
    }
  };

  const loadResults = async (jobId: string) => {
    try {
      const { data: annotatedData, error } = await supabase
        .from('annotated_corpus')
        .select('*')
        .eq('job_id', jobId)
        .order('posicao_no_corpus', { ascending: true });

      if (error) throw error;

      if (annotatedData) {
        setResults(annotatedData as any);

        // Identificar palavras dialectais (confiança alta + categorias específicas)
        const dialectais = annotatedData
          .filter((d: any) => {
            const metadata = d.metadata as any;
            return metadata?.is_dialectal || 
                   metadata?.origem_regionalista?.includes('BRAS') ||
                   metadata?.origem_regionalista?.includes('PLAT');
          })
          .map((d: any) => d.palavra);

        setPalavrasDialectais(dialectais);
      }
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
    }
  };

  const getProsodyColor = (prosody: number) => {
    if (prosody >= 2) return 'text-green-600 dark:text-green-400';
    if (prosody >= 1) return 'text-green-500 dark:text-green-300';
    if (prosody > -1) return 'text-gray-600 dark:text-gray-400';
    if (prosody > -2) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Área de entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Teste de Anotação Semântica com IA
          </CardTitle>
          <CardDescription>
            Teste a anotação enriquecida com contexto dos 4 dicionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Texto para Anotação (Letra: "Quando o Verso Vem Pras Casa")
            </label>
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Cole o texto aqui..."
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {texto.split(/\s+/).filter(w => w).length} palavras
            </p>
            <Button
              onClick={startAnnotation}
              disabled={isAnnotating || !texto.trim()}
            >
              {isAnnotating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Anotando... {progresso}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Iniciar Anotação com IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Anotadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{results.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Palavras Dialectais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{palavrasDialectais.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Identificadas com contexto regionalista
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(results.reduce((acc, r) => acc + (r.confianca || 0), 0) / results.length * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prosódia Média</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${getProsodyColor(
                  results.reduce((acc, r) => acc + (r.prosody || 0), 0) / results.length
                )}`}>
                  {(results.reduce((acc, r) => acc + (r.prosody || 0), 0) / results.length).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Palavras Dialectais Destacadas */}
          {palavrasDialectais.length > 0 && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Palavras com Contexto Regionalista Gaúcho
                </CardTitle>
                <CardDescription>
                  Enriquecidas com dados do Dicionário da Cultura Pampeana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {palavrasDialectais.map((palavra, i) => (
                    <Badge key={i} variant="default" className="text-sm">
                      {palavra}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Anotações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resultados da Anotação Semântica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {results.slice(0, 50).map((result, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold">{result.palavra}</span>
                          <Badge variant="outline">{result.tagset_codigo}</Badge>
                          {palavrasDialectais.includes(result.palavra) && (
                            <Badge variant="default" className="text-xs">
                              Dialectal
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${getProsodyColor(result.prosody)}`}>
                            {result.prosody > 0 ? '+' : ''}{result.prosody}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(result.confianca * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Domínio Semântico:</p>
                            <p className="font-medium">{result.tagset_codigo}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Prosódia:</p>
                            <p className={`font-medium ${getProsodyColor(result.prosody)}`}>
                              {result.prosody} (
                              {result.prosody >= 2 ? 'Muito positivo' :
                               result.prosody >= 1 ? 'Positivo' :
                               result.prosody > -1 ? 'Neutro' :
                               result.prosody > -2 ? 'Negativo' :
                               'Muito negativo'}
                              )
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Confiança:</p>
                            <p className="font-medium">{(result.confianca * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fonte:</p>
                            <p className="font-medium capitalize">{result.fonte}</p>
                          </div>
                        </div>

                        {result.contexto_enriquecido && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-xs font-semibold mb-2">Contexto Enriquecido (Dicionários):</p>
                            <p className="text-xs whitespace-pre-wrap font-mono">
                              {result.contexto_enriquecido}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {results.length > 50 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Mostrando 50 de {results.length} resultados
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
