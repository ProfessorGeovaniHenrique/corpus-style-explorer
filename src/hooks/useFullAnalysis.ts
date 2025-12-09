/**
 * useFullAnalysis
 * Sprint PERSIST-1: Hook para processar todas as 7 ferramentas de análise
 * Sprint PERSIST-2: Correções de bugs e validação
 */

import { useState, useCallback, useRef } from 'react';
import { useSubcorpus } from '@/contexts/SubcorpusContext';
import { useAnalysisTools, ToolKey } from '@/contexts/AnalysisToolsContext';
import { toast } from 'sonner';

// Services
import { calculateLexicalProfile } from '@/services/lexicalAnalysisService';
import { calculateSyntacticProfile } from '@/services/syntacticAnalysisService';
import { detectRhetoricalFigures } from '@/services/rhetoricalAnalysisService';
import { analyzeCohesion } from '@/services/cohesionAnalysisService';
import { analyzeSpeechThoughtPresentation } from '@/services/speechThoughtAnalysisService';
import { analyzeMindStyle } from '@/services/mindStyleAnalysisService';
import { analyzeForegrounding } from '@/services/foregroundingAnalysisService';
import { annotatePOSForCorpus } from '@/services/posAnnotationService';

export interface ToolStatus {
  key: ToolKey;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface FullAnalysisState {
  isProcessing: boolean;
  currentToolIndex: number;
  tools: ToolStatus[];
  startedAt?: Date;
  completedAt?: Date;
}

const TOOL_CONFIGS: { key: ToolKey; label: string }[] = [
  { key: 'lexical', label: 'Perfil Léxico' },
  { key: 'syntactic', label: 'Perfil Sintático' },
  { key: 'rhetorical', label: 'Figuras Retóricas' },
  { key: 'cohesion', label: 'Análise de Coesão' },
  { key: 'speech', label: 'Fala e Pensamento' },
  { key: 'mind', label: 'Mind Style' },
  { key: 'foregrounding', label: 'Foregrounding' },
];

const createInitialToolsState = (): ToolStatus[] => TOOL_CONFIGS.map(config => ({
  ...config,
  status: 'pending' as const,
}));

export function useFullAnalysis() {
  const { loadedCorpus } = useSubcorpus();
  const { setToolCache, currentCorpusHash } = useAnalysisTools();
  
  const [state, setState] = useState<FullAnalysisState>({
    isProcessing: false,
    currentToolIndex: -1,
    tools: createInitialToolsState(),
  });
  
  // Usar ref para cancelamento (evita stale closure)
  const isCancelledRef = useRef(false);

  const updateToolStatus = useCallback((index: number, status: ToolStatus['status'], error?: string) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.map((tool, i) => 
        i === index ? { ...tool, status, error } : tool
      ),
    }));
  }, []);

  const processAnalysis = useCallback(async () => {
    if (!loadedCorpus) {
      toast.error('Nenhum corpus carregado');
      return;
    }

    isCancelledRef.current = false;
    setState({
      isProcessing: true,
      currentToolIndex: 0,
      tools: createInitialToolsState(),
      startedAt: new Date(),
    });

    // Pre-process: POS annotation for syntactic analysis
    let annotatedCorpus: any = null;
    let completedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < TOOL_CONFIGS.length; i++) {
      // Verificar cancelamento via ref (evita stale closure)
      if (isCancelledRef.current) {
        toast.info(`Análise cancelada após ${completedCount} ferramentas`);
        break;
      }
      
      const tool = TOOL_CONFIGS[i];
      setState(prev => ({ ...prev, currentToolIndex: i }));
      updateToolStatus(i, 'processing');

      try {
        let result: any;

        switch (tool.key) {
          case 'lexical':
            result = calculateLexicalProfile(loadedCorpus, []);
            break;
            
          case 'syntactic':
            // POS annotation needed
            if (!annotatedCorpus) {
              try {
                annotatedCorpus = await annotatePOSForCorpus(loadedCorpus);
              } catch (posError) {
                console.warn('POS annotation failed, using fallback:', posError);
                // Fallback: usar corpus sem anotação POS
                annotatedCorpus = loadedCorpus;
              }
            }
            result = calculateSyntacticProfile(annotatedCorpus);
            break;
            
          case 'rhetorical':
            result = detectRhetoricalFigures(loadedCorpus);
            break;
            
          case 'cohesion':
            result = analyzeCohesion(loadedCorpus);
            break;
            
          case 'speech':
            result = analyzeSpeechThoughtPresentation(loadedCorpus);
            break;
            
          case 'mind':
            result = analyzeMindStyle(loadedCorpus);
            break;
            
          case 'foregrounding':
            result = analyzeForegrounding(loadedCorpus);
            break;
        }

        // Verificar cancelamento após processamento
        if (isCancelledRef.current) {
          break;
        }

        // Salvar no cache
        if (result) {
          setToolCache(tool.key, {
            data: result,
            corpusHash: currentCorpusHash,
            timestamp: Date.now(),
            isStale: false,
          });
          completedCount++;
        }

        updateToolStatus(i, 'completed');
      } catch (error) {
        console.error(`Erro ao processar ${tool.label}:`, error);
        updateToolStatus(i, 'error', error instanceof Error ? error.message : 'Erro desconhecido');
        errorCount++;
      }
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
      completedAt: new Date(),
    }));

    // Exibir toast de conclusão apropriado
    if (!isCancelledRef.current) {
      if (errorCount > 0) {
        toast.warning(`Análise concluída com ${errorCount} erros. ${completedCount}/${TOOL_CONFIGS.length} ferramentas processadas.`);
      } else {
        toast.success(`Análise completa! ${completedCount}/${TOOL_CONFIGS.length} ferramentas processadas.`);
      }
    }
  }, [loadedCorpus, setToolCache, currentCorpusHash, updateToolStatus]);

  const cancelAnalysis = useCallback(() => {
    isCancelledRef.current = true;
    setState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      currentToolIndex: -1,
      tools: createInitialToolsState(),
    });
    isCancelledRef.current = false;
  }, []);

  // Calcular progresso corretamente
  const completedTools = state.tools.filter(t => t.status === 'completed').length;
  const progress = state.isProcessing 
    ? Math.round((state.currentToolIndex / TOOL_CONFIGS.length) * 100)
    : completedTools === TOOL_CONFIGS.length 
      ? 100 
      : Math.round((completedTools / TOOL_CONFIGS.length) * 100);

  return {
    state,
    progress,
    processAnalysis,
    cancelAnalysis,
    resetState,
    canProcess: !!loadedCorpus && !state.isProcessing,
    hasResults: state.tools.some(t => t.status === 'completed'),
  };
}
