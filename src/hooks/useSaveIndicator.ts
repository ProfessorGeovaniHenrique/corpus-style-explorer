import { useState, useCallback } from 'react';

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useSaveIndicator() {
  const [status, setStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null
  });

  const startSaving = useCallback(() => {
    setStatus(prev => ({ ...prev, isSaving: true, error: null }));
  }, []);

  const completeSaving = useCallback(() => {
    setStatus({
      isSaving: false,
      lastSaved: new Date(),
      error: null
    });
  }, []);

  const setSaveError = useCallback((error: string) => {
    setStatus({
      isSaving: false,
      lastSaved: null,
      error
    });
  }, []);

  return {
    status,
    startSaving,
    completeSaving,
    setSaveError
  };
}
