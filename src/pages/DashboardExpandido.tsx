import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createLogger } from "@/lib/loggerFactory";
import { MVPFooter } from "@/components/mvp/MVPFooter";
import { TabTools } from "@/components/mvp/TabTools";
import { TabFerramentasEstilisticas } from "@/components/expanded/TabFerramentasEstilisticas";
import { SongProcessingTab } from "@/components/expanded/SongProcessingTab";
import { useAuthContext } from "@/contexts/AuthContext";
import { CorpusProvider } from "@/contexts/CorpusContext";
import { SubcorpusProvider } from "@/contexts/SubcorpusContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const log = createLogger('DashboardExpandido');

type TabType = 'ferramentas' | 'estilisticas' | 'processamento';

export default function DashboardExpandido() {
  const [activeTab, setActiveTab] = useState<TabType>('ferramentas');
  const { user, loading, hasToolsAccess } = useAuthContext();

  return (
    <CorpusProvider>
      <SubcorpusProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <div className="border-b bg-card">
            <div className="container-academic">
              <div className="flex items-center justify-between py-4">
                <h1 className="text-2xl font-bold">Dashboard Expandido</h1>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'ferramentas' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('ferramentas')}
                  >
                    Ferramentas
                  </Button>
                  <Button
                    variant={activeTab === 'estilisticas' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('estilisticas')}
                  >
                    Ferramentas Estilísticas
                  </Button>
                  <Button
                    variant={activeTab === 'processamento' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('processamento')}
                  >
                    Processamento Individual
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <main className="container-academic py-4 md:py-8 mt-[180px] md:mt-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'ferramentas' && (
                  hasToolsAccess() ? (
                    <TabTools />
                  ) : (
                    <Alert className="max-w-2xl mx-auto">
                      <Lock className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        Faça login para acessar as ferramentas de análise.
                      </AlertDescription>
                    </Alert>
                  )
                )}

                {activeTab === 'estilisticas' && (
                  hasToolsAccess() ? (
                    <TabFerramentasEstilisticas />
                  ) : (
                    <Alert className="max-w-2xl mx-auto">
                      <Lock className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        Faça login para acessar as ferramentas estilísticas.
                      </AlertDescription>
                    </Alert>
                  )
                )}

                {activeTab === 'processamento' && (
                  hasToolsAccess() ? (
                    <SongProcessingTab />
                  ) : (
                    <Alert className="max-w-2xl mx-auto">
                      <Lock className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        Faça login para acessar o processamento individual.
                      </AlertDescription>
                    </Alert>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <MVPFooter />
        </div>
      </SubcorpusProvider>
    </CorpusProvider>
  );
}
