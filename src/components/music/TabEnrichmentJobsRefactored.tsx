/**
 * TabEnrichmentJobsRefactored - Aba de Enriquecimento desmembrada
 * 
 * REFATORAÇÃO: Substituição da TabEnrichmentJobs original
 * - Divide em duas sub-abas: Jobs Ativos e Cobertura & Curadoria
 * - Usa EnrichmentJobsContext centralizado
 * - Lazy loading para componentes pesados
 */

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Activity, Brain } from 'lucide-react';
import { EnrichmentJobsProvider } from '@/contexts/EnrichmentJobsContext';
import { TabActiveJobs } from './catalog/TabActiveJobs';
import { TabCoverageAnalysis } from './catalog/TabCoverageAnalysis';

export function TabEnrichmentJobsRefactored() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'coverage'>('jobs');

  return (
    <EnrichmentJobsProvider>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'jobs' | 'coverage')}>
        <TabsList className="mb-4">
          <TabsTrigger value="jobs" className="gap-2">
            <Activity className="h-4 w-4" />
            Jobs Ativos
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-2">
            <Brain className="h-4 w-4" />
            Cobertura & Curadoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <TabActiveJobs />
        </TabsContent>

        <TabsContent value="coverage">
          <TabCoverageAnalysis isActive={activeTab === 'coverage'} />
        </TabsContent>
      </Tabs>
    </EnrichmentJobsProvider>
  );
}
