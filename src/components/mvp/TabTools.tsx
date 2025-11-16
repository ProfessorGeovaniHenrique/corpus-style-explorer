import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Lock } from "lucide-react";
import { KeywordsTool } from "./tools/KeywordsTool";

export function TabTools() {
  const [selectedCorpus, setSelectedCorpus] = useState<'canção' | 'gaúcho'>('gaúcho');
  
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="section-header-academic flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Ferramentas de Estilística de Corpus
              </CardTitle>
              <CardDescription className="section-description-academic">
                Wordlist, Keywords, N-grams, Dispersão
              </CardDescription>
            </div>
            
            {/* Corpus Selector */}
            <Select value={selectedCorpus} onValueChange={(v) => setSelectedCorpus(v as 'canção' | 'gaúcho')}>
              <SelectTrigger className="w-full md:w-[350px]">
                <SelectValue placeholder="Selecione o corpus de estudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canção" disabled>
                  🎵 "Quando o verso vem pras casa" (142 palavras) - Em breve
                </SelectItem>
                <SelectItem value="gaúcho">
                  🎸 Corpus de Músicas Gaúchas (5.001 palavras)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="keywords" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="wordlist" disabled className="relative">
                Word List
                <Lock className="w-3 h-3 ml-1 absolute -top-1 -right-1" />
              </TabsTrigger>
              <TabsTrigger value="keywords">
                Keywords ✨
              </TabsTrigger>
              <TabsTrigger value="dispersion" disabled className="relative">
                Dispersão
                <Lock className="w-3 h-3 ml-1 absolute -top-1 -right-1" />
              </TabsTrigger>
              <TabsTrigger value="ngrams" disabled className="relative">
                N-grams
                <Lock className="w-3 h-3 ml-1 absolute -top-1 -right-1" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="wordlist" className="mt-6">
              <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-border">
                <p className="text-muted-foreground">
                  Ferramenta Word List será implementada em breve
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="keywords" className="mt-6">
              <KeywordsTool corpus={selectedCorpus} />
            </TabsContent>
            
            <TabsContent value="dispersion" className="mt-6">
              <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-border">
                <p className="text-muted-foreground">
                  Ferramenta de Dispersão será implementada em breve
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="ngrams" className="mt-6">
              <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-border">
                <p className="text-muted-foreground">
                  Ferramenta de N-grams será implementada em breve
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
