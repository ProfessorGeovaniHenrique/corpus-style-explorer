import { motion } from "framer-motion";
import { MVPHeader } from "@/components/mvp/MVPHeader";
import { MVPFooter } from "@/components/mvp/MVPFooter";
import { TabApresentacao } from "@/components/mvp/TabApresentacao";
import { useAuthContext } from "@/contexts/AuthContext";
import { CorpusProvider } from "@/contexts/CorpusContext";
import { SubcorpusProvider } from "@/contexts/SubcorpusContext";

export default function DashboardMVPDefinitivo() {
  const { user, loading, hasToolsAccess, hasTestsAccess } = useAuthContext();

  return (
    <CorpusProvider>
      <SubcorpusProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <MVPHeader 
            isAuthenticated={!!user}
            isLoading={loading}
            hasToolsAccess={hasToolsAccess()}
            hasTestsAccess={hasTestsAccess()}
          />
          
          <main className="container-academic py-4 md:py-8 mt-[180px] md:mt-[200px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TabApresentacao />
            </motion.div>
          </main>

          <MVPFooter />
        </div>
      </SubcorpusProvider>
    </CorpusProvider>
  );
}
