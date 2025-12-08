/**
 * 🌉 CONTEXT BRIDGE (Sprint AUD-C2: Refatorado com useReducer)
 * 
 * Sincroniza AnalysisToolsContext com os contextos legados (SubcorpusContext, ToolsContext)
 * Permite que as ferramentas existentes funcionem na nova página sem refatoração
 * 
 * ARQUITETURA:
 * - useReducer para gerenciamento de estado previsível
 * - Logger estruturado em vez de console.log
 * - Usa APENAS SubcorpusContext (Sistema B) para carregamento de corpus
 */

import React, { useEffect, useReducer, useRef, ReactNode, useCallback } from 'react';
import { useAnalysisTools, CorpusSelection } from '@/contexts/AnalysisToolsContext';
import { useSubcorpus } from '@/contexts/SubcorpusContext';
import { useTools } from '@/contexts/ToolsContext';
import { CorpusType } from '@/data/types/corpus-tools.types';
import { toast } from 'sonner';
import { userCorpusToCorpusCompleto } from '@/utils/userCorpusConverter';
import { createLogger } from '@/lib/loggerFactory';

const logger = createLogger('ContextBridge');

// ============================================================================
// TYPES & STATE
// ============================================================================

interface BridgeState {
  /** Chave do último corpus de estudo sincronizado */
  lastStudyKey: string | null;
  /** Chave do último stylistic sincronizado */
  lastStylisticKey: string | null;
  /** Chave do último corpus carregado */
  lastLoadedKey: string | null;
  /** Chave do último keywords ref sincronizado */
  lastKeywordsRefKey: string | null;
  /** Chave do último keywords study sincronizado */
  lastKeywordsStudyKey: string | null;
  /** Se está carregando corpus */
  isLoadingCorpus: boolean;
}

type BridgeAction =
  | { type: 'SET_STUDY_KEY'; payload: string }
  | { type: 'SET_STYLISTIC_KEY'; payload: string }
  | { type: 'SET_LOADED_KEY'; payload: string }
  | { type: 'SET_KEYWORDS_REF_KEY'; payload: string }
  | { type: 'SET_KEYWORDS_STUDY_KEY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: BridgeState = {
  lastStudyKey: null,
  lastStylisticKey: null,
  lastLoadedKey: null,
  lastKeywordsRefKey: null,
  lastKeywordsStudyKey: null,
  isLoadingCorpus: false
};

function bridgeReducer(state: BridgeState, action: BridgeAction): BridgeState {
  switch (action.type) {
    case 'SET_STUDY_KEY':
      return { ...state, lastStudyKey: action.payload };
    case 'SET_STYLISTIC_KEY':
      return { ...state, lastStylisticKey: action.payload };
    case 'SET_LOADED_KEY':
      return { ...state, lastLoadedKey: action.payload };
    case 'SET_KEYWORDS_REF_KEY':
      return { ...state, lastKeywordsRefKey: action.payload };
    case 'SET_KEYWORDS_STUDY_KEY':
      return { ...state, lastKeywordsStudyKey: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoadingCorpus: action.payload };
    default:
      return state;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

interface ContextBridgeProps {
  children: ReactNode;
}

/**
 * Converte CorpusSelection (novo formato) para formato legado do SubcorpusContext
 */
function corpusSelectionToLegacy(selection: CorpusSelection | null): {
  corpusBase: CorpusType;
  mode: 'complete' | 'single';
  artistaA: string | null;
  artistaB: string | null;
} {
  if (!selection || selection.type === 'user') {
    return {
      corpusBase: 'gaucho',
      mode: 'complete',
      artistaA: null,
      artistaB: null
    };
  }
  
  return {
    corpusBase: selection.platformCorpus || 'gaucho',
    mode: selection.platformArtist ? 'single' : 'complete',
    artistaA: selection.platformArtist || null,
    artistaB: null
  };
}

/**
 * Converte CorpusSelection para formato stylisticSelection do SubcorpusContext
 */
function corpusSelectionToStylistic(
  studySelection: CorpusSelection | null,
  referenceSelection: CorpusSelection | null
) {
  if (!studySelection || studySelection.type === 'user') {
    return null;
  }
  
  return {
    study: {
      corpusType: studySelection.platformCorpus || 'gaucho',
      mode: studySelection.platformArtist ? 'artist' : 'complete' as const,
      artist: studySelection.platformArtist || undefined,
      estimatedSize: 0
    },
    reference: referenceSelection && referenceSelection.type === 'platform' ? {
      corpusType: referenceSelection.platformCorpus || 'nordestino',
      mode: referenceSelection.platformArtist ? 'artist' : 'complete' as const,
      artist: referenceSelection.platformArtist || undefined,
      targetSize: 0,
      sizeRatio: 1
    } : {
      corpusType: 'nordestino' as CorpusType,
      mode: 'complete' as const,
      targetSize: 0,
      sizeRatio: 1
    },
    isComparative: !!referenceSelection
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook para sincronização unidirecional de contextos usando useReducer
 */
export function useCorpusSyncEffect() {
  const { studyCorpus, referenceCorpus } = useAnalysisTools();
  const { selection, setSelection, setStylisticSelection, getFilteredCorpus, loadedCorpus, isReady, setLoadedCorpusDirectly } = useSubcorpus();
  const { setKeywordsState } = useTools();
  
  const [state, dispatch] = useReducer(bridgeReducer, initialState);
  
  // Refs estáveis para funções que mudam de referência
  const getFilteredCorpusRef = useRef(getFilteredCorpus);
  const setLoadedCorpusDirectlyRef = useRef(setLoadedCorpusDirectly);
  const setKeywordsStateRef = useRef(setKeywordsState);
  
  useEffect(() => { getFilteredCorpusRef.current = getFilteredCorpus; }, [getFilteredCorpus]);
  useEffect(() => { setLoadedCorpusDirectlyRef.current = setLoadedCorpusDirectly; }, [setLoadedCorpusDirectly]);
  useEffect(() => { setKeywordsStateRef.current = setKeywordsState; }, [setKeywordsState]);

  // PASSO 1: Sincroniza studyCorpus → SubcorpusContext.selection (apenas para corpus de plataforma)
  useEffect(() => {
    if (!studyCorpus || studyCorpus.type !== 'platform') return;
    
    const legacy = corpusSelectionToLegacy(studyCorpus);
    const studyKey = JSON.stringify(legacy);
    
    if (state.lastStudyKey === studyKey) return;
    
    logger.debug('Sincronizando selection', { legacy });
    dispatch({ type: 'SET_STUDY_KEY', payload: studyKey });
    setSelection({
      corpusBase: legacy.corpusBase,
      mode: legacy.mode,
      artistaA: legacy.artistaA,
      artistaB: legacy.artistaB
    });
  }, [studyCorpus, setSelection, state.lastStudyKey]);

  // PASSO 1.5: Converte e injeta corpus do usuário diretamente
  useEffect(() => {
    if (!studyCorpus || studyCorpus.type !== 'user' || !studyCorpus.userCorpus) {
      return;
    }
    
    const userCorpusKey = `user:${studyCorpus.userCorpus.id}:${studyCorpus.userCorpus.textType}`;
    
    if (state.lastLoadedKey === userCorpusKey) {
      logger.debug('Corpus do usuário já carregado', { key: userCorpusKey });
      return;
    }
    
    logger.info('Convertendo corpus do usuário', {
      id: studyCorpus.userCorpus.id,
      name: studyCorpus.userCorpus.name,
      textType: studyCorpus.userCorpus.textType
    });
    
    try {
      const converted = userCorpusToCorpusCompleto(studyCorpus.userCorpus);
      setLoadedCorpusDirectlyRef.current(converted);
      dispatch({ type: 'SET_LOADED_KEY', payload: userCorpusKey });
      
      logger.success('Corpus do usuário injetado', {
        totalMusicas: converted.totalMusicas,
        totalPalavras: converted.totalPalavras
      });
      
      toast.success(`Corpus "${studyCorpus.userCorpus.name}" carregado com sucesso`);
    } catch (error) {
      logger.error('Erro ao converter corpus do usuário', error);
      toast.error('Erro ao processar corpus do usuário');
    }
  }, [studyCorpus, state.lastLoadedKey]);

  // PASSO 2: Carrega corpus quando selection muda E é válido (apenas para plataforma)
  useEffect(() => {
    if (studyCorpus?.type === 'user') {
      logger.debug('Corpus do usuário tratado no PASSO 1.5');
      return;
    }
    
    if (!isReady) {
      logger.debug('Aguardando availableCorpora...');
      return;
    }
    
    if (!studyCorpus || studyCorpus.type !== 'platform') {
      logger.debug('Nenhuma seleção de plataforma válida');
      return;
    }
    
    const loadKey = JSON.stringify({
      corpusBase: selection.corpusBase,
      mode: selection.mode,
      artistaA: selection.artistaA
    });
    
    if (state.lastLoadedKey === loadKey && loadedCorpus && loadedCorpus.musicas.length > 0) {
      logger.debug('Corpus já carregado', { key: loadKey });
      return;
    }
    
    let cancelled = false;
    
    const loadCorpus = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      logger.info('Carregando corpus', { key: loadKey });
      
      try {
        const result = await getFilteredCorpusRef.current();
        if (!cancelled) {
          dispatch({ type: 'SET_LOADED_KEY', payload: loadKey });
          logger.success('Corpus carregado', { totalMusicas: result?.totalMusicas || 0 });
        }
      } catch (error) {
        logger.error('Erro ao carregar corpus', error);
        if (!cancelled) {
          toast.error('Erro ao carregar corpus. Tente novamente.');
        }
      } finally {
        if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadCorpus();
    
    return () => { cancelled = true; };
  }, [isReady, studyCorpus, selection.corpusBase, selection.mode, selection.artistaA, loadedCorpus, state.lastLoadedKey]);

  // PASSO 3: Sincroniza studyCorpus + referenceCorpus → stylisticSelection
  useEffect(() => {
    const stylistic = corpusSelectionToStylistic(studyCorpus, referenceCorpus);
    if (stylistic) {
      const newValue = JSON.stringify(stylistic);
      
      if (state.lastStylisticKey !== newValue) {
        dispatch({ type: 'SET_STYLISTIC_KEY', payload: newValue });
        setStylisticSelection(stylistic);
      }
    }
  }, [studyCorpus, referenceCorpus, setStylisticSelection, state.lastStylisticKey]);

  // PASSO 4: Sincroniza referenceCorpus → ToolsContext.keywordsState
  useEffect(() => {
    if (referenceCorpus && referenceCorpus.type === 'platform') {
      const newKeywords = {
        refCorpusBase: referenceCorpus.platformCorpus || 'nordestino',
        refMode: (referenceCorpus.platformArtist ? 'artist' : 'complete') as 'artist' | 'complete',
        refArtist: referenceCorpus.platformArtist || null
      };
      
      const newValue = JSON.stringify(newKeywords);
      if (state.lastKeywordsRefKey !== newValue) {
        dispatch({ type: 'SET_KEYWORDS_REF_KEY', payload: newValue });
        setKeywordsStateRef.current(newKeywords);
      }
    }
  }, [referenceCorpus, state.lastKeywordsRefKey]);

  // PASSO 5: Sincroniza studyCorpus → ToolsContext.keywordsState
  useEffect(() => {
    if (studyCorpus && studyCorpus.type === 'platform') {
      const newKeywords = {
        estudoCorpusBase: studyCorpus.platformCorpus || 'gaucho',
        estudoMode: (studyCorpus.platformArtist ? 'artist' : 'complete') as 'artist' | 'complete',
        estudoArtist: studyCorpus.platformArtist || null
      };
      
      const newValue = JSON.stringify(newKeywords);
      if (state.lastKeywordsStudyKey !== newValue) {
        dispatch({ type: 'SET_KEYWORDS_STUDY_KEY', payload: newValue });
        setKeywordsStateRef.current(newKeywords);
      }
    }
  }, [studyCorpus, state.lastKeywordsStudyKey]);

  return { isLoadingCorpus: state.isLoadingCorpus };
}

/**
 * Hook para obter status da sincronização
 */
export function useCorpusSyncStatus() {
  const { studyCorpus, referenceCorpus } = useAnalysisTools();
  
  return {
    hasStudyCorpus: !!studyCorpus,
    hasReferenceCorpus: !!referenceCorpus,
    studyType: studyCorpus?.type || null,
    referenceType: referenceCorpus?.type || null,
    isReady: !!studyCorpus
  };
}

interface AnalysisToolsBridgeRenderProps {
  isLoadingCorpus: boolean;
}

interface ContextBridgePropsWithRender {
  children: ReactNode | ((props: AnalysisToolsBridgeRenderProps) => ReactNode);
}

/**
 * Provider wrapper que automaticamente sincroniza contextos
 */
export function AnalysisToolsBridge({ children }: ContextBridgePropsWithRender) {
  const { isLoadingCorpus } = useCorpusSyncEffect();
  
  if (typeof children === 'function') {
    return <>{children({ isLoadingCorpus })}</>;
  }
  
  return <>{children}</>;
}

export { corpusSelectionToLegacy };
