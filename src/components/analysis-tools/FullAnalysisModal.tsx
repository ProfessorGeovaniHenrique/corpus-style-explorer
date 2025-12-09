/**
 * FullAnalysisModal
 * Sprint PERSIST-1: Modal de progresso para processamento completo
 * Sprint PERSIST-2: Melhorias de UX e feedback visual
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Loader2, 
  Clock, 
  AlertCircle,
  Microscope,
  X,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useFullAnalysis, ToolStatus } from '@/hooks/useFullAnalysis';
import { useProgressWithETA } from '@/hooks/useProgressWithETA';
import { cn } from '@/lib/utils';

interface FullAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ToolStatusRow({ tool, isCurrent }: { tool: ToolStatus; isCurrent: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg transition-all duration-200",
      isCurrent && "bg-accent/50 ring-1 ring-primary/20",
      tool.status === 'completed' && "bg-green-500/5",
      tool.status === 'error' && "bg-destructive/5"
    )}>
      <div className="flex items-center gap-2">
        {tool.status === 'completed' && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {tool.status === 'processing' && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        {tool.status === 'pending' && (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
        {tool.status === 'error' && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <span className={cn(
          "text-sm transition-colors",
          tool.status === 'completed' && "text-green-600 dark:text-green-400",
          tool.status === 'processing' && "font-medium",
          tool.status === 'error' && "text-destructive",
          tool.status === 'pending' && "text-muted-foreground"
        )}>
          {tool.label}
        </span>
      </div>
      <Badge 
        variant={
          tool.status === 'completed' ? 'default' :
          tool.status === 'processing' ? 'secondary' :
          tool.status === 'error' ? 'destructive' :
          'outline'
        } 
        className={cn(
          "text-xs transition-all",
          tool.status === 'completed' && "bg-green-500/10 text-green-600 border-green-500/20"
        )}
      >
        {tool.status === 'completed' && 'Concluído'}
        {tool.status === 'processing' && 'Processando...'}
        {tool.status === 'pending' && 'Pendente'}
        {tool.status === 'error' && 'Erro'}
      </Badge>
    </div>
  );
}

export function FullAnalysisModal({ open, onOpenChange }: FullAnalysisModalProps) {
  const { 
    state, 
    progress, 
    processAnalysis, 
    cancelAnalysis, 
    resetState,
    canProcess,
    hasResults 
  } = useFullAnalysis();
  
  const progressETA = useProgressWithETA(progress, state.startedAt);
  const formattedETA = progressETA?.remainingFormatted;

  const handleStart = () => {
    processAnalysis();
  };

  const handleClose = () => {
    if (state.isProcessing) {
      cancelAnalysis();
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    resetState();
  };

  const completedCount = state.tools.filter(t => t.status === 'completed').length;
  const errorCount = state.tools.filter(t => t.status === 'error').length;
  const totalCount = state.tools.length;
  const allCompleted = completedCount === totalCount && !state.isProcessing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {allCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Microscope className="h-5 w-5" />
            )}
            {state.isProcessing 
              ? 'Processando Análise Completa' 
              : allCompleted 
                ? 'Análise Completa ✓'
                : 'Análise Completa'}
          </DialogTitle>
          <DialogDescription>
            {state.isProcessing 
              ? 'Processando todas as 7 ferramentas de análise estilística...'
              : allCompleted 
                ? 'Todas as análises foram concluídas. Navegue entre as abas para visualizar os resultados.'
                : hasResults 
                  ? `${completedCount} análises concluídas. Você pode reprocessar para atualizar os dados.`
                  : 'Execute todas as análises de uma vez e navegue livremente entre as abas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lista de ferramentas */}
          <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
            {state.tools.map((tool, index) => (
              <ToolStatusRow 
                key={tool.key} 
                tool={tool} 
                isCurrent={state.isProcessing && state.currentToolIndex === index}
              />
            ))}
          </div>

          {/* Barra de progresso geral */}
          {(state.isProcessing || hasResults) && (
            <div className="space-y-2">
              <Progress 
                value={progress} 
                className={cn(
                  "h-2 transition-all",
                  allCompleted && "bg-green-500/20"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {completedCount}/{totalCount} ferramentas
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                      {errorCount} erro{errorCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </span>
                {state.isProcessing && formattedETA && (
                  <span className="text-primary">{formattedETA}</span>
                )}
                {allCompleted && (
                  <span className="text-green-600 font-medium">Completo ✓</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2">
          {state.isProcessing ? (
            <Button variant="destructive" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          ) : (
            <>
              {hasResults && (
                <Button variant="ghost" onClick={handleReset} size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={handleStart} disabled={!canProcess}>
                <Microscope className="h-4 w-4 mr-2" />
                {hasResults ? 'Reprocessar' : 'Iniciar Análise'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
