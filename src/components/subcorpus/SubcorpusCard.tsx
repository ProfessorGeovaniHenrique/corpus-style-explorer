import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubcorpusMetadata } from "@/data/types/subcorpus.types";
import { Music, FileText, Hash, TrendingUp } from "lucide-react";

interface SubcorpusCardProps {
  metadata: SubcorpusMetadata;
  rank?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function SubcorpusCard({ metadata, rank, onClick, isSelected }: SubcorpusCardProps) {
  return (
    <Card 
      className={`relative cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      {rank && (
        <Badge className="absolute top-2 right-2 z-10" variant="secondary">
          #{rank}
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="h-5 w-5 text-primary" />
          {metadata.artista}
        </CardTitle>
        <Badge variant="outline" className="w-fit">
          {metadata.totalMusicas} {metadata.totalMusicas === 1 ? 'música' : 'músicas'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Total de Palavras</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {metadata.totalPalavras.toLocaleString('pt-BR')}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Riqueza Lexical</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {(metadata.riquezaLexical * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>Vocabulário Único</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {metadata.totalPalavrasUnicas.toLocaleString('pt-BR')}
            </p>
          </div>
          
          {metadata.anoInicio && metadata.anoFim && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-lg font-semibold text-foreground">
                {metadata.anoInicio === metadata.anoFim 
                  ? metadata.anoInicio 
                  : `${metadata.anoInicio}–${metadata.anoFim}`
                }
              </p>
            </div>
          )}
        </div>
        
        {metadata.albums.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">
              {metadata.albums.length} {metadata.albums.length === 1 ? 'álbum' : 'álbuns'}
            </p>
            <div className="flex flex-wrap gap-1">
              {metadata.albums.slice(0, 2).map((album, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {album.length > 20 ? album.slice(0, 20) + '...' : album}
                </Badge>
              ))}
              {metadata.albums.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.albums.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
