import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { LexiconEntry } from '@/hooks/useBackendLexicon';

interface VerbeteCardProps {
  entry: LexiconEntry;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (entry: LexiconEntry) => void;
  isSelected?: boolean;
}

export function VerbeteCard({ entry, onApprove, onReject, onEdit, isSelected }: VerbeteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const confidence = (entry.confianca || 0) * 100;
  const isValidated = entry.validado;
  const definitions = entry.definicoes || [];
  const displayDefinitions = isExpanded ? definitions : definitions.slice(0, 2);

  return (
    <Card className={cn(
      "transition-all hover:shadow-lg cursor-pointer",
      isSelected && "ring-2 ring-primary",
      isValidated && "bg-green-50/50 dark:bg-green-950/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {entry.verbete || entry.palavra}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {entry.classe_gramatical || entry.pos || 'N/A'}
              </Badge>
              {definitions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {definitions.length} {definitions.length === 1 ? 'definição' : 'definições'}
                </span>
              )}
            </div>
          </div>
          <Badge 
            variant={isValidated ? "default" : "secondary"}
            className={cn(
              "flex-shrink-0",
              isValidated && "bg-green-500 hover:bg-green-600"
            )}
          >
            {isValidated ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Validado
              </>
            ) : (
              "Pendente"
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Definições */}
        {definitions.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-1">
              {displayDefinitions.map((def: any, idx: number) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  {idx + 1}. {def.texto}
                </p>
              ))}
            </div>
            {definitions.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Ver mais {definitions.length - 2}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Barra de Confiança */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Confiança</span>
            <span className="font-medium">{confidence.toFixed(0)}%</span>
          </div>
          <Progress 
            value={confidence} 
            className={cn(
              "h-2",
              confidence >= 90 && "bg-green-200 [&>div]:bg-green-500",
              confidence >= 70 && confidence < 90 && "bg-yellow-200 [&>div]:bg-yellow-500",
              confidence < 70 && "bg-red-200 [&>div]:bg-red-500"
            )}
          />
        </div>

        {/* Botões de Ação */}
        {!isValidated && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(entry.id);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onReject(entry.id);
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
