import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function TabGalaxy() {
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="section-header-academic flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Nuvem de Domínios Semânticos
          </CardTitle>
          <CardDescription className="section-description-academic">
            Visualização orbital interativa com KWIC - Em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border border-border">
            <p className="text-muted-foreground">
              Nuvem semântica será implementada no Sprint 3
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
