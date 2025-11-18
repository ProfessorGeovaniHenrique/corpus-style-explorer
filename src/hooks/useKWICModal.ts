import { useState, useCallback, useRef } from 'react';
import { useFullTextCorpus } from './useFullTextCorpus';
import { generateKWIC } from '@/services/kwicService';
import { toast } from 'sonner';
import { CorpusType } from '@/data/types/corpus-tools.types';

export interface KWICData {
  leftContext: string;
  keyword: string;
  rightContext: string;
  source: string;
}

// Format compatible with KWICModal component
export interface KWICModalData {
  leftContext: string;
  keyword: string;
  rightContext: string;
  source: string;
}

export function useKWICModal(corpusType: CorpusType = 'gaucho') {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [kwicData, setKwicData] = useState<KWICData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastRequestedWord = useRef<string>('');
  
  const { corpus, isReady } = useFullTextCorpus(corpusType);
  
  const openModal = useCallback(async (word: string) => {
    lastRequestedWord.current = word;
    setSelectedWord(word);
    setIsOpen(true);
    setIsLoading(true);
    
    try {
      if (corpus && isReady) {
        const contexts = generateKWIC(corpus, word, 5);
        
        // Validar se ainda é a última busca solicitada
        if (lastRequestedWord.current !== word) {
          return;
        }
        
        const formatted: KWICData[] = contexts.map(ctx => ({
          leftContext: ctx.contextoEsquerdo,
          keyword: ctx.palavra,
          rightContext: ctx.contextoDireito,
          source: `${ctx.metadata.artista} - ${ctx.metadata.musica}`
        }));
        
        setKwicData(formatted);
        
        if (formatted.length === 0) {
          toast.info(`Nenhuma ocorrência encontrada para "${word}"`);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar KWIC:', error);
      toast.error('Erro ao buscar concordâncias');
    } finally {
      // Apenas desativar loading se ainda for a busca atual
      if (lastRequestedWord.current === word) {
        setIsLoading(false);
      }
    }
  }, [corpus, isReady]);
  
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedWord('');
    setKwicData([]);
  }, []);
  
  return { 
    isOpen, 
    closeModal,
    selectedWord, 
    kwicData, 
    isLoading, 
    openModal 
  };
}
