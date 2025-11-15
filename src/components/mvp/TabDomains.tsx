import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export function TabDomains() {
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="section-header-academic flex items-center gap-2">
            <Database className="w-5 h-5" />
            Análise de Domínios Semânticos
          </CardTitle>
          <CardDescription className="section-description-academic">
            Tabelas e cards com estatísticas detalhadas - Em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border border-border">
            <p className="text-muted-foreground">
              Análise de domínios será implementada no Sprint 5
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
