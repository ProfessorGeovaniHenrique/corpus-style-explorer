import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench } from "lucide-react";
import { ToolsProvider, useTools } from "@/contexts/ToolsContext";
import { CorpusProvider } from "@/contexts/CorpusContext";
import { WordlistTool } from "./tools/WordlistTool";
import { KeywordsTool } from "./tools/KeywordsTool";
import { KWICTool } from "./tools/KWICTool";
import { DispersionTool } from "./tools/DispersionTool";
import { NGramsTool } from "./tools/NGramsTool";
import { AdvancedAnalysisTab } from "./tools/AdvancedAnalysisTab";

function TabToolsContent() {
  const { activeTab, setActiveTab } = useTools();

  return (
    <Card className="card-academic">
      <CardHeader>
        <CardTitle className="section-header-academic flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Ferramentas de Estilística de Corpus
        </CardTitle>
        <CardDescription className="section-description-academic">
          Wordlist, KWIC, Dispersão, N-grams e Análise Avançada (Keywords, Temporal, Dialetal)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="wordlist">
              Word List
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
            <TabsTrigger value="advanced">
              Análise Avançada
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wordlist" className="mt-6">
            <WordlistTool />
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
          
          <TabsContent value="advanced" className="mt-6">
            <AdvancedAnalysisTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function TabTools() {
  return (
    <CorpusProvider>
      <ToolsProvider>
        <div className="space-y-6">
          <TabToolsContent />
        </div>
      </ToolsProvider>
    </CorpusProvider>
  );
}
