import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SubcorpusProvider, useSubcorpus } from '@/contexts/SubcorpusContext';
import React from 'react';

// Helper para aguardar mudança de estado
const waitForState = (callback: () => boolean, timeout = 3000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      if (callback()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for state change'));
      } else {
        setTimeout(checkCondition, 50);
      }
    };
    checkCondition();
  });
};

describe('SubcorpusContext - localStorage validation', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadSavedSelection - Validação robusta', () => {
    it('deve retornar null se localStorage estiver vazio', () => {
      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Estado inicial deve usar valores padrão
      expect(result.current.selection.mode).toBe('complete');
      expect(result.current.selection.artistaA).toBeNull();
      expect(result.current.selection.artistaB).toBeNull();
    });

    it('deve retornar null se JSON estiver corrompido', () => {
      // Simular JSON corrompido
      localStorage.setItem('subcorpus-selection', 'invalid-json{corrupted');

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Deve usar valores padrão e limpar localStorage
      expect(result.current.selection.mode).toBe('complete');
      expect(localStorage.getItem('subcorpus-selection')).toBeNull();
    });

    it('deve retornar null se faltarem campos obrigatórios', () => {
      // Objeto sem campos obrigatórios
      localStorage.setItem('subcorpus-selection', JSON.stringify({ foo: 'bar' }));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Deve usar valores padrão
      expect(result.current.selection.mode).toBe('complete');
      expect(result.current.selection.corpusBase).toBe('gaucho');
    });

    it('deve retornar null se corpus base for inválido', () => {
      const invalidData = {
        mode: 'complete',
        corpusBase: 'invalid-corpus',
        artistaA: null,
        artistaB: null
      };
      localStorage.setItem('subcorpus-selection', JSON.stringify(invalidData));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Deve usar corpus base padrão
      expect(result.current.selection.corpusBase).toBe('gaucho');
    });

    it('deve normalizar modo inválido para "complete"', () => {
      const dataWithInvalidMode = {
        mode: 'invalid-mode-xyz',
        corpusBase: 'gaucho',
        artistaA: null,
        artistaB: null
      };
      localStorage.setItem('subcorpus-selection', JSON.stringify(dataWithInvalidMode));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Mode inválido deve ser normalizado
      expect(result.current.selection.mode).toBe('complete');
    });

    it('deve limpar artistaA se não existir mais no corpus', async () => {
      const dataWithInvalidArtist = {
        mode: 'single' as const,
        corpusBase: 'gaucho' as const,
        artistaA: 'Artista Inexistente Que Nunca Existiu',
        artistaB: null
      };
      localStorage.setItem('subcorpus-selection', JSON.stringify(dataWithInvalidArtist));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Aguardar carregamento do corpus
      await waitForState(() => !result.current.isLoading);

      // artistaA inválido deve ser limpo e mode normalizado
      expect(result.current.selection.artistaA).toBeNull();
      expect(result.current.selection.mode).toBe('complete');
    });

    it('deve limpar artistaB se não existir mais', async () => {
      const dataWithInvalidArtistB = {
        mode: 'compare' as const,
        corpusBase: 'gaucho' as const,
        artistaA: 'Luiz Marenco',
        artistaB: 'Artista B Inexistente'
      };
      localStorage.setItem('subcorpus-selection', JSON.stringify(dataWithInvalidArtistB));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      await waitForState(() => !result.current.isLoading);

      // artistaB inválido deve ser limpo
      expect(result.current.selection.artistaB).toBeNull();
    });

    it('deve aceitar seleção válida completa', async () => {
      const validData = {
        mode: 'single' as const,
        corpusBase: 'gaucho' as const,
        artistaA: 'Luiz Marenco',
        artistaB: null
      };
      localStorage.setItem('subcorpus-selection', JSON.stringify(validData));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      await waitForState(() => !result.current.isLoading);

      // Seleção válida deve ser aceita
      expect(result.current.selection.artistaA).toBe('Luiz Marenco');
      expect(result.current.selection.mode).toBe('single');
    });

    it('deve limpar localStorage quando detectar corrupção', () => {
      localStorage.setItem('subcorpus-selection', 'corrupted-non-json-data');

      renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // localStorage corrupto deve ser removido
      expect(localStorage.getItem('subcorpus-selection')).toBeNull();
    });
  });

  describe('setSelection - Persistência', () => {
    it('deve salvar seleção no localStorage ao chamar setSelection', async () => {
      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      await waitForState(() => !result.current.isLoading);

      // Alterar seleção
      const newSelection = {
        mode: 'single' as const,
        corpusBase: 'gaucho' as const,
        artistaA: 'Luiz Marenco',
        artistaB: null
      };

      result.current.setSelection(newSelection);

      // Verificar se foi salvo no localStorage
      const saved = localStorage.getItem('subcorpus-selection');
      expect(saved).not.toBeNull();
      
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.artistaA).toBe('Luiz Marenco');
        expect(parsed.mode).toBe('single');
      }
    });

    it('deve lidar com erro de quota exceeded', async () => {
      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      await waitForState(() => !result.current.isLoading);

      // Simular localStorage cheio
      const originalSetItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Tentar salvar não deve quebrar a aplicação
      expect(() => {
        result.current.setSelection({
          mode: 'single',
          corpusBase: 'gaucho',
          artistaA: 'Luiz Marenco',
          artistaB: null
        });
      }).not.toThrow();

      // Restaurar implementação original
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Restauração de seleção ao carregar', () => {
    it('deve restaurar seleção salva ao montar provider', async () => {
      const savedSelection = {
        mode: 'compare' as const,
        corpusBase: 'gaucho' as const,
        artistaA: 'Luiz Marenco',
        artistaB: 'Noel Guarany'
      };
      localStorage.setItem('subcorpus-selection', JSON.stringify(savedSelection));

      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      await waitForState(() => !result.current.isLoading);

      // Seleção deve ser restaurada
      expect(result.current.selection.artistaA).toBe('Luiz Marenco');
      expect(result.current.selection.artistaB).toBe('Noel Guarany');
      expect(result.current.selection.mode).toBe('compare');
    });

    it('deve usar valores padrão se não houver seleção salva', () => {
      const { result } = renderHook(() => useSubcorpus(), {
        wrapper: ({ children }) => React.createElement(SubcorpusProvider, null, children),
      });

      // Estado inicial deve usar valores padrão
      expect(result.current.selection.mode).toBe('complete');
      expect(result.current.selection.corpusBase).toBe('gaucho');
      expect(result.current.selection.artistaA).toBeNull();
      expect(result.current.selection.artistaB).toBeNull();
    });
  });
});
