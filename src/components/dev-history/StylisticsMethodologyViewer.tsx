import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leechShortTheory, leechShortLevelsDetailed, versoAustralStylisticsTools, versoAustralStylisticsRoadmap, StylisticsLevelDetail } from "@/data/developer-logs/stylistics-methodology";
import { BookOpen, Wrench, TrendingUp, CheckCircle2, Clock, Play, Info } from "lucide-react";
import { StylisticsLevelModal } from "./StylisticsLevelModal";

export function StylisticsMethodologyViewer() {
  const [selectedLevel, setSelectedLevel] = useState<StylisticsLevelDetail | null>(null);

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="text-2xl">Ferramentas de Estilística - Leech & Short</CardTitle>
          <CardDescription>
            Framework de análise estilística linguística aplicado ao corpus musical gaúcho
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="theory">Teoria Short</TabsTrigger>
          <TabsTrigger value="proposal">Proposta VA</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Framework Teórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leechShortTheory.keyWorks.map((work, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-1 text-primary shrink-0" />
                  <span className="text-sm">{work}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theory" className="space-y-4">
          {leechShortLevelsDetailed.map((level, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-base">{level.name}</CardTitle>
                  <CardDescription>{level.description}</CardDescription>
                  <Badge variant="outline" className="text-xs mt-2">
                    📖 {level.pageReferences}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className="ml-4 shrink-0"
                >
                  <Info className="h-4 w-4 mr-1" />
                  Detalhes
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {level.components.slice(0, 3).map((comp, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{comp}</span>
                    </div>
                  ))}
                  {level.components.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      + {level.components.length - 3} componentes adicionais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          {versoAustralStylisticsTools.map((tool, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {tool.name}
                </CardTitle>
                <CardDescription>{tool.theoreticalBasis}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Propósito</h4>
                  <p className="text-sm text-muted-foreground">{tool.purpose}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Implementação</h4>
                  <p className="text-sm text-muted-foreground">{tool.implementation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Métricas</h4>
                  <div className="space-y-1">
                    {tool.metrics.map((metric, i) => (
                      <Badge key={i} variant="secondary" className="text-xs mr-1">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          {Object.entries(versoAustralStylisticsRoadmap).map(([key, phase]: [string, any]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{phase.name}</CardTitle>
                  <Badge variant={phase.status === 'complete' ? 'default' : phase.status === 'in-progress' ? 'secondary' : 'outline'}>
                    {phase.status === 'complete' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : phase.status === 'in-progress' ? <Play className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {phase.status}
                  </Badge>
                </div>
                <CardDescription>Duração: {phase.duration}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {phase.deliverables.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${phase.status === 'complete' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <StylisticsLevelModal 
        level={selectedLevel}
        isOpen={!!selectedLevel}
        onClose={() => setSelectedLevel(null)}
      />
    </div>
  );
}
