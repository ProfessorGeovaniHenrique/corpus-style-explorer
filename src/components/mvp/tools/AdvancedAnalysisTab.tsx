/**
 * 🔬 ANÁLISE AVANÇADA
 * 
 * Agrupa ferramentas avançadas de análise:
 * - Keywords: Palavras-chave estatísticas
 * - Temporal: Evolução ao longo do tempo
 * - Dialetal: Marcas linguísticas regionais
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, MapPin, Calendar, List, Layers } from 'lucide-react';
import { KeywordsTool } from './KeywordsTool';
import { TemporalAnalysisTool } from './TemporalAnalysisTool';
import { DialectalAnalysisTool } from './DialectalAnalysisTool';
import { DialectalNGramsTool } from './DialectalNGramsTool';
import { POSAnalysisTool } from './POSAnalysisTool';

export function AdvancedAnalysisTab() {
  return (
    <Card className="card-academic">
      <CardHeader>
        <CardTitle className="section-header-academic flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Análise Avançada
        </CardTitle>
        <CardDescription className="section-description-academic">
          Keywords estatísticas, evolução temporal, marcas dialetais e análise morfossintática (POS)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="keywords" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="temporal" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Temporal
            </TabsTrigger>
            <TabsTrigger value="dialectal" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dialetal
            </TabsTrigger>
            <TabsTrigger value="ngrams-dialectal" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              N-grams Dialetais
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              POS Tagging
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="keywords">
            <KeywordsTool />
          </TabsContent>
          
          <TabsContent value="temporal">
            <TemporalAnalysisTool />
          </TabsContent>
          
          <TabsContent value="dialectal">
            <DialectalAnalysisTool />
          </TabsContent>
          
          <TabsContent value="ngrams-dialectal">
            <DialectalNGramsTool />
          </TabsContent>
          
          <TabsContent value="pos">
            <POSAnalysisTool />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
