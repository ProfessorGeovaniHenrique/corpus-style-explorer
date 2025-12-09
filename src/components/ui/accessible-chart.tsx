import * as React from "react";
import { cn } from "@/lib/utils";

interface AccessibleChartWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  /** Data summary for screen readers */
  dataSummary?: string;
}

/**
 * Wrapper component that adds accessibility features to charts
 * - Provides aria-label and aria-describedby
 * - Adds keyboard focus support
 * - Includes hidden data summary for screen readers
 */
export function AccessibleChartWrapper({
  children,
  title,
  description,
  className,
  dataSummary,
}: AccessibleChartWrapperProps) {
  const descriptionId = React.useId();
  const summaryId = React.useId();

  return (
    <div
      role="img"
      aria-label={title}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={0}
      className={cn(
        "relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
        className
      )}
    >
      {/* Hidden description for screen readers */}
      {description && (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}
      
      {/* Hidden data summary for screen readers */}
      {dataSummary && (
        <span id={summaryId} className="sr-only">
          Resumo dos dados: {dataSummary}
        </span>
      )}
      
      {children}
    </div>
  );
}

interface ChartDataTableProps {
  data: Array<Record<string, string | number>>;
  columns: Array<{ key: string; label: string }>;
  caption: string;
  className?: string;
}

/**
 * Accessible data table alternative for charts
 * Hidden visually but available to screen readers
 */
export function ChartDataTable({
  data,
  columns,
  caption,
  className,
}: ChartDataTableProps) {
  return (
    <table className={cn("sr-only", className)}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} scope="col">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Skip link for keyboard navigation
 * Allows users to skip directly to main content
 */
export function SkipLink({ 
  href = "#main-content", 
  children = "Pular para o conteúdo principal" 
}: { 
  href?: string; 
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

/**
 * Focus trap for modals and dialogs
 * Ensures keyboard focus stays within the container
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}

/**
 * Announce content to screen readers
 */
export function useAnnounce() {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
}
