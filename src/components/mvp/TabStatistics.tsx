import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function TabStatistics() {
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="section-header-academic flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estatísticas Linguísticas
          </CardTitle>
          <CardDescription className="section-description-academic">
            Gráficos de Log-Likelihood, MI Score e Lematização - Em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border border-border">
            <p className="text-muted-foreground">
              Estatísticas serão implementadas no Sprint 6
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
