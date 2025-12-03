import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Music2 } from 'lucide-react';
import type { ParsedMusic } from '@/lib/excelParser';

interface DuplicatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateGroups: Map<string, ParsedMusic[]>;
  totalRemoved: number;
}

export function DuplicatePreviewDialog({
  open,
  onOpenChange,
  duplicateGroups,
  totalRemoved
}: DuplicatePreviewDialogProps) {
  const groups = Array.from(duplicateGroups.entries());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-amber-500" />
            Duplicatas Identificadas
          </DialogTitle>
          <DialogDescription>
            {totalRemoved} músicas duplicadas foram identificadas e serão removidas da importação.
            A versão mais completa de cada música será mantida.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {groups.map(([key, versions], groupIndex) => {
              const [titulo, artista] = key.split('|');
              
              return (
                <div 
                  key={groupIndex} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Music2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{titulo}</p>
                        <p className="text-sm text-muted-foreground">{artista}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {versions.length} versões
                    </Badge>
                  </div>

                  <div className="space-y-2 pl-6">
                    {versions.map((version, versionIndex) => {
                      const isSelected = versionIndex === 0; // Primeira é a melhor (já ordenada)
                      const completeness = getCompletenessInfo(version);
                      
                      return (
                        <div 
                          key={versionIndex}
                          className={`flex items-center justify-between p-2 rounded text-sm ${
                            isSelected 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                              : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            <span className={isSelected ? 'font-medium' : 'text-muted-foreground'}>
                              Versão {versionIndex + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {completeness.map((info, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {info}
                              </Badge>
                            ))}
                            {isSelected && (
                              <Badge className="bg-green-600 text-xs">
                                Selecionada
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Critério de seleção: versão com mais dados completos (compositor, ano, artista)
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getCompletenessInfo(music: ParsedMusic): string[] {
  const info: string[] = [];
  if (music.compositor) info.push(`Compositor: ${music.compositor.slice(0, 15)}...`);
  if (music.ano) info.push(`Ano: ${music.ano}`);
  if (music.letra) info.push('Com letra');
  if (info.length === 0) info.push('Dados básicos');
  return info;
}
