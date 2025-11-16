import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { 
  irregularVerbs, 
  regularVerbPatterns,
  verbalAspect,
  pluralRules,
  adverbialSuffix,
  adverbialClasses,
  personalPronouns,
  demonstrativePronouns,
  thematicDomains,
  semanticCategories
} from "@/data/grammatical-knowledge";

export function TabGrammarRules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Função para buscar informações sobre uma palavra
  const analyzeWord = (word: string) => {
    const lower = word.toLowerCase();
    const results: any = {
      word: lower,
      found: false,
      category: null,
      lemma: null,
      rules: [],
      examples: [],
    };

    // Verificar verbos irregulares
    if (irregularVerbs[lower]) {
      results.found = true;
      results.category = 'Verbo Irregular';
      results.lemma = irregularVerbs[lower].infinitivo;
      results.rules.push({
        type: 'conjugacao',
        description: `Verbo irregular "${irregularVerbs[lower].infinitivo}"`,
        forms: irregularVerbs[lower].presente,
      });
    }

    // Buscar em formas conjugadas
    Object.entries(irregularVerbs).forEach(([infinitive, data]) => {
      if (data.presente.includes(lower) || data.preterito.includes(lower)) {
        results.found = true;
        results.category = 'Forma Verbal';
        results.lemma = infinitive;
        results.rules.push({
          type: 'lematizacao',
          description: `"${lower}" é uma forma do verbo "${infinitive}"`,
        });
      }
    });

    // Verificar sufixo -mente (advérbios)
    if (lower.endsWith('mente')) {
      results.found = true;
      results.category = 'Advérbio';
      results.rules.push({
        type: 'derivacao',
        description: 'Advérbio formado com sufixo -mente',
        rule: adverbialSuffix.rule,
        examples: adverbialSuffix.examples,
      });
    }

    // Verificar pronomes
    Object.entries(personalPronouns).forEach(([type, pronouns]) => {
      if (typeof pronouns === 'object' && !Array.isArray(pronouns)) {
        Object.values(pronouns).forEach((list: any) => {
          if (Array.isArray(list) && list.includes(lower)) {
            results.found = true;
            results.category = 'Pronome Pessoal';
            results.rules.push({
              type: 'pronome',
              description: `Pronome pessoal (${type})`,
            });
          }
        });
      }
    });

    // Verificar aspectos verbais
    Object.entries(verbalAspect).forEach(([aspect, verbs]) => {
      if (verbs.includes(lower)) {
        results.found = true;
        results.rules.push({
          type: 'aspecto',
          description: `Aspecto verbal: ${aspect}`,
        });
      }
    });

    // Verificar domínios temáticos
    Object.entries(thematicDomains).forEach(([domain, words]) => {
      if (words.includes(lower)) {
        results.found = true;
        results.rules.push({
          type: 'semantico',
          description: `Domínio semântico: ${domain.replace('_', ' ')}`,
        });
      }
    });

    return results;
  };

  const handleSearch = (word: string) => {
    if (word.trim()) {
      setSelectedWord(word.trim());
    }
  };

  const wordAnalysis = selectedWord ? analyzeWord(selectedWord) : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho e busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Base de Conhecimento Gramatical
          </CardTitle>
          <CardDescription>
            Explore regras morfossintáticas do Português Brasileiro aplicadas na análise POS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite uma palavra para analisar (ex: correndo, casa, felizmente)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                className="pl-10"
              />
            </div>
            <button
              onClick={() => handleSearch(searchTerm)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Analisar
            </button>
          </div>

          {/* Resultado da análise */}
          {wordAnalysis && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{wordAnalysis.word}</h3>
                {wordAnalysis.found ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Encontrado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Não catalogado
                  </Badge>
                )}
              </div>

              {wordAnalysis.found && (
                <>
                  {wordAnalysis.category && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Categoria:</strong> {wordAnalysis.category}
                        {wordAnalysis.lemma && (
                          <span className="ml-2">
                            | <strong>Lema:</strong> {wordAnalysis.lemma}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {wordAnalysis.rules.map((rule: any, index: number) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            <Badge variant="outline">{rule.type}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm">{rule.description}</p>
                          {rule.rule && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Regra:</strong> {rule.rule}
                            </p>
                          )}
                          {rule.forms && (
                            <div>
                              <p className="text-sm font-medium mb-1">Formas:</p>
                              <div className="flex flex-wrap gap-1">
                                {rule.forms.map((form: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {form}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {rule.examples && (
                            <div>
                              <p className="text-sm font-medium mb-1">Exemplos:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {rule.examples.map((ex: any, i: number) => (
                                  <li key={i}>
                                    {ex.adjective || ex} → {ex.adverb || ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {!wordAnalysis.found && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Palavra não encontrada na base de conhecimento. 
                    O sistema utilizará regras morfológicas heurísticas para classificá-la.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explorador de regras */}
      <Card>
        <CardHeader>
          <CardTitle>Explorador de Regras</CardTitle>
          <CardDescription>
            Navegue pelas categorias gramaticais e suas regras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="verbs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="verbs">Verbos</TabsTrigger>
              <TabsTrigger value="adverbs">Advérbios</TabsTrigger>
              <TabsTrigger value="pronouns">Pronomes</TabsTrigger>
              <TabsTrigger value="semantic">Semântica</TabsTrigger>
            </TabsList>

            <TabsContent value="verbs" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Verbos Irregulares Catalogados</h3>
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.keys(irregularVerbs).map((verb) => (
                      <Badge
                        key={verb}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setSearchTerm(verb);
                          handleSearch(verb);
                        }}
                      >
                        {verb}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Classes Acionais</h3>
                <div className="space-y-2">
                  {Object.entries(verbalAspect).map(([aspect, verbs]) => (
                    <Card key={aspect}>
                      <CardHeader>
                        <CardTitle className="text-sm capitalize">{aspect}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {verbs.slice(0, 10).map((verb) => (
                            <Badge key={verb} variant="outline" className="text-xs">
                              {verb}
                            </Badge>
                          ))}
                          {verbs.length > 10 && (
                            <Badge variant="secondary" className="text-xs">
                              +{verbs.length - 10} mais
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="adverbs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Formação com -mente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Regra:</strong> {adverbialSuffix.rule}
                  </p>
                  <div className="space-y-1">
                    {adverbialSuffix.examples.map((ex, i) => (
                      <p key={i} className="text-sm">
                        {ex.adjective} → <strong>{ex.adverb}</strong>
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {Object.entries(adverbialClasses).map(([category, adverbs]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {adverbs.map((adv) => (
                        <Badge key={adv} variant="outline" className="text-xs">
                          {adv}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pronouns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sistema Pronominal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(personalPronouns.retos).map(([person, pronouns]) => (
                    <div key={person}>
                      <p className="text-sm font-medium mb-1">{person}:</p>
                      <div className="flex flex-wrap gap-1">
                        {pronouns.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Demonstrativos</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(demonstrativePronouns.proximidade).map(([distance, forms]) => (
                    <div key={distance} className="mb-2">
                      <p className="text-sm font-medium capitalize mb-1">
                        {distance.replace('_', ' ')}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {forms.map((form) => (
                          <Badge key={form} variant="outline" className="text-xs">
                            {form}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="semantic" className="space-y-4">
              <h3 className="text-lg font-semibold">Domínios Temáticos do Corpus</h3>
              {Object.entries(thematicDomains).map(([domain, words]) => (
                <Card key={domain}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize">
                      {domain.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {words.slice(0, 20).map((word) => (
                        <Badge key={word} variant="outline" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                      {words.length > 20 && (
                        <Badge variant="secondary" className="text-xs">
                          +{words.length - 20} palavras
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer com citação */}
      <footer className="text-xs text-muted-foreground text-center py-4 border-t">
        Base de conhecimento gramatical consolidada a partir de regras linguísticas 
        do Português Brasileiro para análise morfossintática computacional.
      </footer>
    </div>
  );
}
