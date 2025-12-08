/**
 * LexicalProfileHeader
 * Sprint AUD-C1: Header component for TabLexicalProfile
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Loader2, PlayCircle, Trash2 } from "lucide-react";
import { LexicalProfile } from "@/data/types/stylistic-analysis.types";

interface LexicalProfileHeaderProps {
  studyArtist?: string;
  userCorpusName?: string;
  studyProfile: LexicalProfile | null;
  referenceProfile: LexicalProfile | null;
  isAnalyzing: boolean;
  isProcessing: boolean;
  onAnalyze: () => void;
  onExport: () => void;
  onClearCache: () => void;
}

export function LexicalProfileHeader({
  studyArtist,
  userCorpusName,
  studyProfile,
  referenceProfile,
  isAnalyzing,
  isProcessing,
  onAnalyze,
  onExport,
  onClearCache,
}: LexicalProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Perfil Léxico</h2>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            Análise de vocabulário e riqueza lexical
            {studyArtist && (
              <Badge variant="secondary">{studyArtist}</Badge>
            )}
            {userCorpusName && (
              <Badge variant="outline">📄 {userCorpusName}</Badge>
            )}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          onClick={onClearCache} 
          variant="ghost" 
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive"
          disabled={!studyProfile && !referenceProfile}
        >
          <Trash2 className="w-4 h-4" />
          Limpar Cache
        </Button>
        
        <Button 
          onClick={onAnalyze} 
          disabled={isAnalyzing || isProcessing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4" />
          )}
          {isAnalyzing ? 'Analisando...' : 'Analisar Corpus'}
        </Button>
        
        {studyProfile && (
          <Button onClick={onExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        )}
      </div>
    </div>
  );
}
