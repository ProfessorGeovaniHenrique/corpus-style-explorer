import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Activity, FileText, Copy, BarChart3 } from 'lucide-react';
import { MVPHeader } from '@/components/mvp/MVPHeader';
import { MVPFooter } from '@/components/mvp/MVPFooter';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { LexiconStatusDashboardRefactored } from '@/components/advanced/lexicon-status/LexiconStatusDashboardRefactored';
import { SystemHealthDashboard } from '@/components/advanced/system-health/SystemHealthDashboard';
import { DictionaryImportInterface } from '@/components/advanced/DictionaryImportInterface';
import { DuplicateAnalysisDashboard } from '@/components/advanced/DuplicateAnalysisDashboard';
import { DataQualityDashboard } from '@/components/advanced/data-quality/DataQualityDashboard';

export default function AdminLexiconSetupRefactored() {
  return (
    <div className="min-h-screen bg-background">
      <MVPHeader />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <AdminBreadcrumb currentPage="Configuração de Léxico v2.0" />
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">
              <Database className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="health">
              <Activity className="h-4 w-4 mr-2" />
              Health
            </TabsTrigger>
            <TabsTrigger value="quality">
              <BarChart3 className="h-4 w-4 mr-2" />
              Qualidade
            </TabsTrigger>
            <TabsTrigger value="import">
              <FileText className="h-4 w-4 mr-2" />
              Importação
            </TabsTrigger>
            <TabsTrigger value="duplicates">
              <Copy className="h-4 w-4 mr-2" />
              Duplicatas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <LexiconStatusDashboardRefactored />
          </TabsContent>

          <TabsContent value="health">
            <SystemHealthDashboard />
          </TabsContent>

          <TabsContent value="quality">
            <DataQualityDashboard />
          </TabsContent>

          <TabsContent value="import">
            <DictionaryImportInterface />
          </TabsContent>

          <TabsContent value="duplicates">
            <DuplicateAnalysisDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <MVPFooter />
    </div>
  );
}
