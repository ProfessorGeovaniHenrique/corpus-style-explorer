import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, PlayCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkflowStatus {
  name: string;
  status: "success" | "failure" | "in_progress" | "pending";
  lastRun: string;
  duration: string;
  url: string;
  branch: string;
}

interface WorkflowStatusCardProps {
  workflows: WorkflowStatus[];
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Success",
  },
  failure: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Failed",
  },
  in_progress: {
    icon: PlayCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Running",
  },
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Pending",
  },
};

export function WorkflowStatusCard({ workflows }: WorkflowStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Workflow Status
        </CardTitle>
        <CardDescription>Status atual dos workflows do GitHub Actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {workflows.map((workflow, index) => {
          const config = statusConfig[workflow.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{workflow.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {workflow.branch}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{workflow.lastRun}</span>
                    <span>•</span>
                    <span>{workflow.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={workflow.status === "success" ? "default" : "destructive"}>
                  {config.label}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <a href={workflow.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
