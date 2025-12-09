import { useCallback, useEffect, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  /** Enable arrow key navigation */
  arrowKeys?: boolean;
  /** Enable home/end keys */
  homeEndKeys?: boolean;
  /** Wrap around when reaching start/end */
  wrap?: boolean;
  /** Orientation of navigation */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Callback when selection changes */
  onSelectionChange?: (index: number) => void;
}

/**
 * Hook for keyboard navigation in lists, grids, and other collections
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  itemCount: number,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    arrowKeys = true,
    homeEndKeys = true,
    wrap = true,
    orientation = 'vertical',
    onSelectionChange,
  } = options;

  const containerRef = useRef<T>(null);
  const currentIndexRef = useRef(0);

  const setCurrentIndex = useCallback((index: number) => {
    let newIndex = index;
    
    if (wrap) {
      if (newIndex < 0) newIndex = itemCount - 1;
      if (newIndex >= itemCount) newIndex = 0;
    } else {
      newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
    }
    
    currentIndexRef.current = newIndex;
    onSelectionChange?.(newIndex);
    
    // Focus the new item
    const container = containerRef.current;
    if (container) {
      const items = container.querySelectorAll('[data-nav-item]');
      const targetItem = items[newIndex] as HTMLElement;
      targetItem?.focus();
    }
  }, [itemCount, wrap, onSelectionChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!arrowKeys && !homeEndKeys) return;

    const currentIndex = currentIndexRef.current;
    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        if (arrowKeys && (orientation === 'vertical' || orientation === 'both')) {
          setCurrentIndex(currentIndex - 1);
          handled = true;
        }
        break;
      case 'ArrowDown':
        if (arrowKeys && (orientation === 'vertical' || orientation === 'both')) {
          setCurrentIndex(currentIndex + 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (arrowKeys && (orientation === 'horizontal' || orientation === 'both')) {
          setCurrentIndex(currentIndex - 1);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (arrowKeys && (orientation === 'horizontal' || orientation === 'both')) {
          setCurrentIndex(currentIndex + 1);
          handled = true;
        }
        break;
      case 'Home':
        if (homeEndKeys) {
          setCurrentIndex(0);
          handled = true;
        }
        break;
      case 'End':
        if (homeEndKeys) {
          setCurrentIndex(itemCount - 1);
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [arrowKeys, homeEndKeys, orientation, setCurrentIndex, itemCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
    currentIndex: currentIndexRef.current,
    setCurrentIndex,
    getItemProps: (index: number) => ({
      'data-nav-item': true,
      tabIndex: index === currentIndexRef.current ? 0 : -1,
      'aria-selected': index === currentIndexRef.current,
    }),
  };
}

/**
 * Hook for focus management within a component
 */
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
  };
}

/**
 * Hook for handling Escape key to close modals/dialogs
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
