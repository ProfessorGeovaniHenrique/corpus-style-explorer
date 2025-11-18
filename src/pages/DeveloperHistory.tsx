import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb";
import { PhaseTimeline } from "@/components/dev-history/PhaseTimeline";
import { ScientificEvolution } from "@/components/dev-history/ScientificEvolution";
import { CorrectionsTable } from "@/components/dev-history/CorrectionsTable";
import { ProjectStats } from "@/components/dev-history/ProjectStats";
import { UpdateStatusButton } from "@/components/dev-history/UpdateStatusButton";
import { ProductRoadmap } from "@/components/dev-history/ProductRoadmap";
import { toast } from "sonner";

export default function DeveloperHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("timeline");

  const handleExportPDF = () => {
    toast.info("Funcionalidade de exportação será implementada em breve");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <AdminBreadcrumb currentPage="Developer History" />
            <h1 className="text-3xl font-bold tracking-tight">Developer History</h1>
            <p className="text-muted-foreground">
              Registro histórico completo do desenvolvimento da ferramenta
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <UpdateStatusButton />
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <ProjectStats />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="timeline">Timeline de Construção</TabsTrigger>
            <TabsTrigger value="scientific">Evolução Científica</TabsTrigger>
            <TabsTrigger value="corrections">Correções Críticas</TabsTrigger>
            <TabsTrigger value="methodologies">Metodologias</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap & MVP</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4 mt-6">
            <PhaseTimeline />
          </TabsContent>

          <TabsContent value="scientific" className="space-y-4 mt-6">
            <ScientificEvolution />
          </TabsContent>

          <TabsContent value="corrections" className="space-y-4 mt-6">
            <CorrectionsTable />
          </TabsContent>

          <TabsContent value="methodologies" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <ScientificEvolution showMethodologies />
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-4 mt-6">
            <ProductRoadmap />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
