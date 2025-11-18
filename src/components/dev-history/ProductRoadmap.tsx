import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  Target, 
  Users, 
  TrendingUp,
  Lightbulb,
  Rocket,
  AlertCircle
} from "lucide-react";
import {
  productVision,
  personas,
  mvpEpics,
  postMvpEpics,
  v2Epics,
  futureProspects,
  mvpMetrics,
  immediatePriorities,
  type Epic,
  type Story
} from "@/data/developer-logs/product-roadmap";

// Status Icon Component
const StatusIcon = ({ status }: { status: Epic['status'] }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'in-progress':
      return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    case 'planned':
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: Epic['priority'] }) => {
  const variants = {
    critical: 'destructive' as const,
    high: 'default' as const,
    medium: 'secondary' as const,
    low: 'outline' as const
  };
  
  return (
    <Badge variant={variants[priority]} className="ml-2">
      {priority.toUpperCase()}
    </Badge>
  );
};

// Story Item Component
const StoryItem = ({ story }: { story: Story }) => (
  <div className="flex items-start gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
    {story.implemented ? (
      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
    ) : (
      <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <p className={`text-sm ${story.implemented ? 'text-foreground' : 'text-muted-foreground'}`}>
        {story.title}
      </p>
      {story.notes && (
        <p className="text-xs text-muted-foreground mt-1 italic">{story.notes}</p>
      )}
    </div>
  </div>
);

// Epic Card Component
const EpicCard = ({ epic }: { epic: Epic }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={epic.status} />
          <div>
            <CardTitle className="text-lg">
              Épico {epic.number}: {epic.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {epic.phase}
            </CardDescription>
          </div>
        </div>
        <PriorityBadge priority={epic.priority} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{epic.completionPercentage}%</span>
          </div>
          <Progress value={epic.completionPercentage} className="h-2" />
        </div>
        
        <Separator />
        
        <div className="space-y-1">
          <p className="text-sm font-medium mb-2">Histórias de Usuário:</p>
          {epic.stories.map((story) => (
            <StoryItem key={story.id} story={story} />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ProductRoadmap() {
  const allEpics = [...mvpEpics, ...postMvpEpics, ...v2Epics];
  const implementedStories = allEpics.flatMap(e => e.stories).filter(s => s.implemented).length;
  const totalStories = allEpics.flatMap(e => e.stories).length;

  return (
    <div className="space-y-8">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6" />
            Status Geral do Projeto
          </CardTitle>
          <CardDescription>
            Progresso do MVP e Roadmap Completo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{mvpMetrics.overallCompletion}%</p>
              <p className="text-sm text-muted-foreground mt-1">Conclusão do MVP</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{implementedStories}/{totalStories}</p>
              <p className="text-sm text-muted-foreground mt-1">Histórias Implementadas</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{allEpics.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Épicos Totais</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="font-medium">Próximo Marco:</span>
            <span className="text-muted-foreground">{mvpMetrics.nextMilestone}</span>
          </div>
        </CardContent>
      </Card>

      {/* Product Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              O Problema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {productVision.problem}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              A Solução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {productVision.solution}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Público-Alvo (Personas)
          </CardTitle>
          <CardDescription>
            Usuários-chave que a plataforma atende
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <div 
                key={persona.name} 
                className={`p-4 rounded-lg border-2 ${
                  persona.type === 'primary' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold">{persona.name}</p>
                  {persona.type === 'primary' && (
                    <Badge variant="default" className="text-xs">Primária</Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-primary mb-1">{persona.role}</p>
                <p className="text-xs text-muted-foreground">{persona.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MVP Epics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">MVP - Produto Mínimo Viável</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mvpEpics.map((epic) => (
            <EpicCard key={epic.id} epic={epic} />
          ))}
        </div>
      </div>

      {/* Post-MVP Epics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Pós-MVP - Backlog Priorizado</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {postMvpEpics.map((epic) => (
            <EpicCard key={epic.id} epic={epic} />
          ))}
        </div>
      </div>

      {/* Immediate Priorities */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Prioridades Imediatas
          </CardTitle>
          <CardDescription>
            Features críticas para as próximas iterações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {immediatePriorities.map((priority, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{priority.epic} - {priority.story}</p>
                  <p className="text-sm text-muted-foreground mt-1">{priority.rationale}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">Esforço: {priority.effort}</Badge>
                    <Badge variant="outline" className="text-xs">Impacto: {priority.impact}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* V2.0 Vision */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold">Visão V2.0 - Módulo de Aprendizagem Guiada</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {v2Epics.map((epic) => (
            <EpicCard key={epic.id} epic={epic} />
          ))}
        </div>
      </div>

      {/* Future Prospects */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Prospecções e Roadmap Futuro
          </CardTitle>
          <CardDescription>
            Visão de longo prazo e possíveis expansões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {futureProspects.map((prospect) => (
              <div key={prospect.version} className="relative pl-8 pb-6 border-l-2 border-dashed border-purple-300 dark:border-purple-700 last:border-l-0 last:pb-0">
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {prospect.version.replace('V', '')}
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{prospect.version} - {prospect.name}</h3>
                    <Badge variant="secondary">{prospect.estimatedQuarter}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{prospect.description}</p>
                  {prospect.epics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prospect.epics.map((epic) => (
                        <Badge key={epic} variant="outline" className="text-xs">
                          {epic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
