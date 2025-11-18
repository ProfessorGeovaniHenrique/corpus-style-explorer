import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { KeywordEntry, CorpusType } from '@/data/types/corpus-tools.types';
import { DispersionAnalysis, NGramAnalysis, KWICContext, SongMetadata } from '@/data/types/full-text-corpus.types';
import { Collocation } from '@/services/collocationService';
import { debounce } from '@/lib/performanceUtils';
import { useNavigate } from 'react-router-dom';

// ==================== INTERFACES DE ESTADO ====================

interface KeywordsState {
  estudoCorpusBase: CorpusType;
  estudoMode: 'complete' | 'artist';
  estudoArtist: string | null;
  refCorpusBase: CorpusType;
  refMode: 'complete' | 'artist';
  refArtist: string | null;
  keywords: KeywordEntry[];
  searchTerm: string;
  significanceFilter: 'all' | 'positive' | 'negative';
  effectFilter: 'all' | 'small' | 'medium' | 'large';
  llFilter: number;
  sortColumn: 'palavra' | 'keyword' | 'll' | 'freqEstudo' | 'freqReferencia' | 'freqRef' | 'effect' | 'efeito';
  sortDirection: 'asc' | 'desc';
  isProcessed: boolean;
  analysisConfig: {
    generateKeywordsList: boolean;
    generateScatterPlot: boolean;
    generateComparisonChart: boolean;
    generateDispersion: boolean;
  };
}

interface WordlistState {
  wordlist: Array<{ palavra: string; frequencia: number; frequenciaNormalizada: number }>;
  searchTerm: string;
  sortColumn: 'frequencia' | 'palavra';
  sortDirection: 'asc' | 'desc';
}

interface KWICState {
  palavra: string;
  contextoEsquerdo: number;
  contextoDireito: number;
  results: KWICContext[];
  selectedArtists: string[];
  selectedMusicas: SongMetadata[];
  anoInicio: number | null;
  anoFim: number | null;
  janelaColocacional: number;
  minFreqColocacao: number;
  colocacoes: Collocation[];
  dispersionAnalysis: DispersionAnalysis | null;
}

interface DispersionState {
  palavra: string;
  analysis: DispersionAnalysis | null;
}

interface NgramsState {
  ngramSize: 2 | 3 | 4 | 5;
  minFrequencia: string;
  maxResults: string;
  analysis: NGramAnalysis | null;
}

interface ToolsContextType {
  selectedWord: string;
  setSelectedWord: (word: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigateToKWIC: (word: string) => void;
  
  // Estados das ferramentas
  keywordsState: KeywordsState;
  setKeywordsState: (state: Partial<KeywordsState>) => void;
  clearKeywordsState: () => void;
  
  wordlistState: WordlistState;
  setWordlistState: (state: Partial<WordlistState>) => void;
  clearWordlistState: () => void;
  
  kwicState: KWICState;
  setKwicState: (state: Partial<KWICState>) => void;
  clearKwicState: () => void;
  
  dispersionState: DispersionState;
  setDispersionState: (state: Partial<DispersionState>) => void;
  clearDispersionState: () => void;
  
  ngramsState: NgramsState;
  setNgramsState: (state: Partial<NgramsState>) => void;
  clearNgramsState: () => void;
  
  saveStatus: {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
  };
}

// ==================== ESTADOS INICIAIS ====================

const INITIAL_KEYWORDS_STATE: KeywordsState = {
  estudoCorpusBase: 'gaucho',
  estudoMode: 'complete',
  estudoArtist: null,
  refCorpusBase: 'nordestino',
  refMode: 'complete',
  refArtist: null,
  keywords: [],
  searchTerm: '',
  significanceFilter: 'all',
  effectFilter: 'all',
  llFilter: 0,
  sortColumn: 'll',
  sortDirection: 'desc',
  isProcessed: false,
  analysisConfig: {
    generateKeywordsList: true,
    generateScatterPlot: false,
    generateComparisonChart: false,
    generateDispersion: false,
  }
};

const INITIAL_WORDLIST_STATE: WordlistState = {
  wordlist: [],
  searchTerm: '',
  sortColumn: 'frequencia',
  sortDirection: 'desc'
};

const INITIAL_KWIC_STATE: KWICState = {
  palavra: '',
  contextoEsquerdo: 5,
  contextoDireito: 5,
  results: [],
  selectedArtists: [],
  selectedMusicas: [],
  anoInicio: null,
  anoFim: null,
  janelaColocacional: 3,
  minFreqColocacao: 3,
  colocacoes: [],
  dispersionAnalysis: null
};

const INITIAL_DISPERSION_STATE: DispersionState = {
  palavra: '',
  analysis: null
};

const INITIAL_NGRAMS_STATE: NgramsState = {
  ngramSize: 2,
  minFrequencia: '2',
  maxResults: '100',
  analysis: null
};

// ==================== STORAGE HELPERS ====================

const STORAGE_KEYS = {
  keywords: 'tools_keywords_state',
  wordlist: 'tools_wordlist_state',
  kwic: 'tools_kwic_state',
  dispersion: 'tools_dispersion_state',
  ngrams: 'tools_ngrams_state'
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
}

/**
 * Comprime dados grandes antes de salvar no localStorage
 * Remove dados desnecessários para reduzir tamanho
 */
function compressStateForStorage<T>(value: T, key: string): T {
  // Se for keywords e contiver arrays grandes de dados visuais, comprimir
  if (key === STORAGE_KEYS.keywords && typeof value === 'object' && value !== null) {
    const keywordsState = value as unknown as KeywordsState;
    
    // Manter apenas dados essenciais se análises visuais estão desabilitadas
    const compressed = { ...keywordsState };
    
    // Não salvar keywords se lista não está ativa (mas manter se já processado)
    if (!keywordsState.analysisConfig.generateKeywordsList && !keywordsState.isProcessed) {
      compressed.keywords = [];
    }
    
    return compressed as unknown as T;
  }
  
  return value;
}

/**
 * Salva no localStorage de forma não-bloqueante com feedback visual
 */
function saveToStorageIdle<T>(
  key: string, 
  value: T, 
  setSaveStatus: (status: any) => void
): void {
  setSaveStatus((prev: any) => ({ ...prev, isSaving: true }));
  
  try {
    const compressed = compressStateForStorage(value, key);
    const serialized = JSON.stringify(compressed);
    
    // Usar requestIdleCallback se disponível (não bloqueia a UI)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        try {
          localStorage.setItem(key, serialized);
          setSaveStatus({
            isSaving: false,
            lastSaved: new Date(),
            error: null
          });
        } catch (error) {
          console.error(`Failed to save ${key}:`, error);
          setSaveStatus({
            isSaving: false,
            lastSaved: null,
            error: 'Erro ao salvar dados'
          });
        }
      }, { timeout: 2000 });
    } else {
      // Fallback para navegadores sem requestIdleCallback
      localStorage.setItem(key, serialized);
      setSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        error: null
      });
    }
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
    setSaveStatus({
      isSaving: false,
      lastSaved: null,
      error: 'Erro ao salvar dados'
    });
  }
}

// ==================== CONTEXT ====================

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [selectedWord, setSelectedWord] = useState('');
  const [activeTab, setActiveTab] = useState('basicas');
  
  // Estado do indicador de salvamento
  const [saveStatus, setSaveStatus] = useState<{
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
  }>({
    isSaving: false,
    lastSaved: null,
    error: null
  });
  
  // Estados das ferramentas com persistência
  const [keywordsState, setKeywordsStateInternal] = useState<KeywordsState>(() =>
    loadFromStorage(STORAGE_KEYS.keywords, INITIAL_KEYWORDS_STATE)
  );
  
  const [wordlistState, setWordlistStateInternal] = useState<WordlistState>(() =>
    loadFromStorage(STORAGE_KEYS.wordlist, INITIAL_WORDLIST_STATE)
  );
  
  const [kwicState, setKwicStateInternal] = useState<KWICState>(() =>
    loadFromStorage(STORAGE_KEYS.kwic, INITIAL_KWIC_STATE)
  );
  
  const [dispersionState, setDispersionStateInternal] = useState<DispersionState>(() =>
    loadFromStorage(STORAGE_KEYS.dispersion, INITIAL_DISPERSION_STATE)
  );
  
  const [ngramsState, setNgramsStateInternal] = useState<NgramsState>(() =>
    loadFromStorage(STORAGE_KEYS.ngrams, INITIAL_NGRAMS_STATE)
  );

  // ✅ Funções debounced para salvamento otimizado
  const debouncedSaveKeywords = useMemo(
    () => debounce((state: KeywordsState) => {
      saveToStorageIdle(STORAGE_KEYS.keywords, state, setSaveStatus);
    }, 500),
    []
  );

  const debouncedSaveWordlist = useMemo(
    () => debounce((state: WordlistState) => {
      saveToStorageIdle(STORAGE_KEYS.wordlist, state, setSaveStatus);
    }, 500),
    []
  );

  const debouncedSaveKwic = useMemo(
    () => debounce((state: KWICState) => {
      saveToStorageIdle(STORAGE_KEYS.kwic, state, setSaveStatus);
    }, 500),
    []
  );

  const debouncedSaveDispersion = useMemo(
    () => debounce((state: DispersionState) => {
      saveToStorageIdle(STORAGE_KEYS.dispersion, state, setSaveStatus);
    }, 500),
    []
  );

  const debouncedSaveNgrams = useMemo(
    () => debounce((state: NgramsState) => {
      saveToStorageIdle(STORAGE_KEYS.ngrams, state, setSaveStatus);
    }, 500),
    []
  );
  
  // ✅ Sync com localStorage OTIMIZADO (com debounce + feedback)
  useEffect(() => {
    debouncedSaveKeywords(keywordsState);
  }, [keywordsState, debouncedSaveKeywords]);

  useEffect(() => {
    debouncedSaveWordlist(wordlistState);
  }, [wordlistState, debouncedSaveWordlist]);

  useEffect(() => {
    debouncedSaveKwic(kwicState);
  }, [kwicState, debouncedSaveKwic]);

  useEffect(() => {
    debouncedSaveDispersion(dispersionState);
  }, [dispersionState, debouncedSaveDispersion]);

  useEffect(() => {
    debouncedSaveNgrams(ngramsState);
  }, [ngramsState, debouncedSaveNgrams]);
  
  // Setters com merge parcial
  const setKeywordsState = (partial: Partial<KeywordsState>) => {
    setKeywordsStateInternal(prev => ({ ...prev, ...partial }));
  };
  
  const setWordlistState = (partial: Partial<WordlistState>) => {
    setWordlistStateInternal(prev => ({ ...prev, ...partial }));
  };
  
  const setKwicState = (partial: Partial<KWICState>) => {
    setKwicStateInternal(prev => ({ ...prev, ...partial }));
  };
  
  const setDispersionState = (partial: Partial<DispersionState>) => {
    setDispersionStateInternal(prev => ({ ...prev, ...partial }));
  };
  
  const setNgramsState = (partial: Partial<NgramsState>) => {
    setNgramsStateInternal(prev => ({ ...prev, ...partial }));
  };
  
  // Clear functions
  const clearKeywordsState = () => {
    setKeywordsStateInternal(INITIAL_KEYWORDS_STATE);
    localStorage.removeItem(STORAGE_KEYS.keywords);
  };
  
  const clearWordlistState = () => {
    setWordlistStateInternal(INITIAL_WORDLIST_STATE);
    localStorage.removeItem(STORAGE_KEYS.wordlist);
  };
  
  const clearKwicState = () => {
    setKwicStateInternal(INITIAL_KWIC_STATE);
    localStorage.removeItem(STORAGE_KEYS.kwic);
  };
  
  const clearDispersionState = () => {
    setDispersionStateInternal(INITIAL_DISPERSION_STATE);
    localStorage.removeItem(STORAGE_KEYS.dispersion);
  };
  
  const clearNgramsState = () => {
    setNgramsStateInternal(INITIAL_NGRAMS_STATE);
    localStorage.removeItem(STORAGE_KEYS.ngrams);
  };

  const navigateToKWIC = (word: string) => {
    setSelectedWord(word);
    setActiveTab('basicas');
  };

  const navigate = useNavigate();
  
  return (
    <ToolsContext.Provider value={{
      selectedWord,
      setSelectedWord,
      activeTab,
      setActiveTab,
      navigateToKWIC,
      keywordsState,
      setKeywordsState,
      clearKeywordsState,
      wordlistState,
      setWordlistState,
      clearWordlistState,
      kwicState,
      setKwicState,
      clearKwicState,
      dispersionState,
      setDispersionState,
      clearDispersionState,
      ngramsState,
      setNgramsState,
      clearNgramsState,
      saveStatus
    }}>
      {children}
    </ToolsContext.Provider>
  );
}

export function useTools() {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error('useTools must be used within ToolsProvider');
  }
  return context;
}
