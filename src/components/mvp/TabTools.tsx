import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Lock } from "lucide-react";
import { KeywordsTool } from "./tools/KeywordsTool";
import { KWICTool } from "./tools/KWICTool";
import { DispersionTool } from "./tools/DispersionTool";
import { NGramsTool } from "./tools/NGramsTool";

export function TabTools() {
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="section-header-academic flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Ferramentas de Estilística de Corpus
          </CardTitle>
          <CardDescription className="section-description-academic">
            Keywords, KWIC, Dispersão, N-grams e mais
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="keywords" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="keywords">
                Keywords
              </TabsTrigger>
              <TabsTrigger value="kwic">
                KWIC
              </TabsTrigger>
              <TabsTrigger value="dispersion">
                Dispersão
              </TabsTrigger>
              <TabsTrigger value="ngrams">
                N-grams
              </TabsTrigger>
              <TabsTrigger value="wordlist" disabled className="relative">
                Word List
                <Lock className="w-3 h-3 ml-1 absolute -top-1 -right-1" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="keywords" className="mt-6">
              <KeywordsTool />
            </TabsContent>
            
            <TabsContent value="kwic" className="mt-6">
              <KWICTool />
            </TabsContent>
            
            <TabsContent value="dispersion" className="mt-6">
              <DispersionTool />
            </TabsContent>
            
            <TabsContent value="ngrams" className="mt-6">
              <NGramsTool />
            </TabsContent>
            
            <TabsContent value="wordlist" className="mt-6">
              <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-border">
                <p className="text-muted-foreground">
                  Ferramenta Word List será implementada em breve
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
