import { useEffect } from 'react';

interface ValidationShortcutsConfig {
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  enabled?: boolean;
}

export function useValidationShortcuts({
  onApprove,
  onReject,
  onEdit,
  onNext,
  onPrevious,
  enabled = true
}: ValidationShortcutsConfig) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar se estiver em um input ou textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          onApprove?.();
          break;
        case 'r':
          e.preventDefault();
          onReject?.();
          break;
        case 'e':
          e.preventDefault();
          onEdit?.();
          break;
        case 'arrowdown':
          e.preventDefault();
          onNext?.();
          break;
        case 'arrowup':
          e.preventDefault();
          onPrevious?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onApprove, onReject, onEdit, onNext, onPrevious, enabled]);
}
