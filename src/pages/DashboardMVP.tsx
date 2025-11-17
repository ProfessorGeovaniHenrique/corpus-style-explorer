import { MVPHeader } from "@/components/mvp/MVPHeader";
import { MVPFooter } from "@/components/mvp/MVPFooter";
import { TabApresentacao } from "@/components/mvp/TabApresentacao";
import { TabTools } from "@/components/mvp/TabTools";
import { TabValidation } from "@/components/mvp/TabValidation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wrench, FlaskConical } from "lucide-react";

export default function DashboardMVP() {
  return (
    <div className="min-h-screen bg-background" data-theme="academic">
      <MVPHeader />

      {/* Fixed Navigation Bar */}
      <div className="fixed top-32 left-0 right-0 z-40 bg-background border-b-2 border-[hsl(var(--va-verde-pampa))] shadow-sm animate-slide-down">
        <div className="container-academic py-4">
          <Tabs defaultValue="apresentacao" className="space-y-6">
            <TabsList className="tabs-academic grid w-full max-w-3xl mx-auto grid-cols-3">
              <TabsTrigger value="apresentacao" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Apresentação</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">Ferramentas</span>
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                <span className="hidden sm:inline">Testes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apresentacao">
              <TabApresentacao />
            </TabsContent>

            <TabsContent value="tools">
              <TabTools />
            </TabsContent>

            <TabsContent value="validation">
              <TabValidation />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Content with adjusted spacing */}
      <main className="container-academic py-8 mt-52">
        {/* Content will scroll behind the fixed navigation */}
      </main>

      <MVPFooter />
    </div>
  );
}
