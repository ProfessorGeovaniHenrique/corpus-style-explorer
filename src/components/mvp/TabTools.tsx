import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export function TabTools() {
  return (
    <div className="space-y-6">
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="section-header-academic flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Ferramentas de Estilística de Corpus
          </CardTitle>
          <CardDescription className="section-description-academic">
            Wordlist, Keywords, N-grams, Dispersão, KWIC - Em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border border-border">
            <p className="text-muted-foreground">
              Ferramentas de corpus serão implementadas nos Sprints 7 e 8
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
