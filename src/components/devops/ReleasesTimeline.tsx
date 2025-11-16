import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Tag, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Release {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  features: number;
  fixes: number;
  breaking: number;
  url: string;
}

interface ReleasesTimelineProps {
  releases: Release[];
}

const typeConfig = {
  major: {
    color: "destructive",
    label: "Major",
  },
  minor: {
    color: "default",
    label: "Minor",
  },
  patch: {
    color: "secondary",
    label: "Patch",
  },
};

export function ReleasesTimeline({ releases }: ReleasesTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Timeline de Releases
        </CardTitle>
        <CardDescription>Histórico de versões publicadas</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative space-y-6">
            {/* Timeline line */}
            <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-border" />

            {releases.map((release, index) => {
              const config = typeConfig[release.type];
              const isLatest = index === 0;

              return (
                <div key={index} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1 w-7 h-7 rounded-full border-4 border-background ${
                    isLatest ? 'bg-primary' : 'bg-muted'
                  } flex items-center justify-center`}>
                    <Tag className={`h-3 w-3 ${isLatest ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>

                  <Card className={isLatest ? 'border-primary shadow-md' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold">v{release.version}</h4>
                          {isLatest && (
                            <Badge variant="default" className="text-xs">
                              Latest
                            </Badge>
                          )}
                          <Badge variant={config.color as any} className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={release.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="h-3 w-3" />
                        <time>{release.date}</time>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {release.breaking > 0 && (
                          <div className="text-center p-3 rounded-lg bg-destructive/10">
                            <div className="text-2xl font-bold text-destructive">
                              {release.breaking}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Breaking
                            </div>
                          </div>
                        )}
                        {release.features > 0 && (
                          <div className="text-center p-3 rounded-lg bg-primary/10">
                            <div className="text-2xl font-bold text-primary">
                              {release.features}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Features
                            </div>
                          </div>
                        )}
                        {release.fixes > 0 && (
                          <div className="text-center p-3 rounded-lg bg-muted">
                            <div className="text-2xl font-bold">
                              {release.fixes}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Fixes
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
