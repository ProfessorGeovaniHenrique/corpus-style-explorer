/**
 * LexicalQuickStats
 * Sprint AUD-C1: Quick stats display in header area
 */

import { BookOpen, Layers, BarChart3 } from "lucide-react";

interface LexicalQuickStatsProps {
  totalTokens: number;
  uniqueTokens: number;
  dominiosCount: number;
}

export function LexicalQuickStats({ totalTokens, uniqueTokens, dominiosCount }: LexicalQuickStatsProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <strong className="text-foreground">{totalTokens.toLocaleString()}</strong> palavras
        </span>
        <span className="text-muted-foreground/40">•</span>
        <span className="flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          <strong className="text-foreground">{uniqueTokens.toLocaleString()}</strong> tipos
        </span>
        {dominiosCount > 0 && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <strong className="text-foreground">{dominiosCount}</strong> domínios
            </span>
          </>
        )}
      </div>
    </div>
  );
}
