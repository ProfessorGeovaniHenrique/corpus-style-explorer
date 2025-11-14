/**
 * Performance utilities for throttling and debouncing
 */

/**
 * Throttle function to limit execution to once per specified time period
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds (default 16ms for 60fps)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  };
}

/**
 * RequestAnimationFrame-based throttle for smooth animations
 * @param func - Function to throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T>;

  return function(this: any, ...args: Parameters<T>) {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, lastArgs);
        rafId = null;
      });
    }
  };
}

/**
 * Debounce function to delay execution until after wait period
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
