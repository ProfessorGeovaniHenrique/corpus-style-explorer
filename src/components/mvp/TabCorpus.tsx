import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function TabCorpus() {
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="section-header-academic flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Constelação de Domínios
          </CardTitle>
          <CardDescription className="section-description-academic">
            Visualização orbital interativa - Em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border border-border">
            <p className="text-muted-foreground">
              Visualização orbital será implementada no Sprint 4
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
