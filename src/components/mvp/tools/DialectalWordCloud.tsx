/**
 * ☁️ NUVEM DE PALAVRAS DIALETAIS
 * 
 * Visualização interativa onde:
 * - Tamanho = Score de dialectalidade
 * - Cor = Tipo (azul=regionalismo, âmbar=arcaísmo, roxo=platinismo)
 */

import { useState } from 'react';
import { EnrichedDialectalMark } from '@/data/types/dialectal-dictionary.types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { DialectalWordDetailModal } from './DialectalWordDetailModal';

interface DialectalWordCloudProps {
  marcas: EnrichedDialectalMark[];
  maxWords?: number;
}

const TIPO_COLORS = {
  regionalismo: {
    base: 'text-blue-600 hover:text-blue-700',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  arcaismo: {
    base: 'text-amber-600 hover:text-amber-700',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20'
  },
  platinismo: {
    base: 'text-purple-600 hover:text-purple-700',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20'
  },
  lexical: {
    base: 'text-slate-600 hover:text-slate-700',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20'
  },
  expressao: {
    base: 'text-green-600 hover:text-green-700',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20'
  }
};

export function DialectalWordCloud({ marcas, maxWords = 60 }: DialectalWordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<EnrichedDialectalMark | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWordClick = (marca: EnrichedDialectalMark) => {
    setSelectedMarca(marca);
    setIsModalOpen(true);
  };

  // Pega as top palavras e normaliza os scores
  const topMarcas = marcas
    .sort((a, b) => b.score - a.score)
    .slice(0, maxWords);

  const maxScore = Math.max(...topMarcas.map(m => m.score));
  const minScore = Math.min(...topMarcas.map(m => m.score));

  // Função para calcular o tamanho da fonte baseado no score
  const getFontSize = (score: number) => {
    const normalized = (score - minScore) / (maxScore - minScore);
    const minSize = 14;
    const maxSize = 48;
    return minSize + normalized * (maxSize - minSize);
  };

  // Função para calcular opacidade baseado no score
  const getOpacity = (score: number) => {
    const normalized = (score - minScore) / (maxScore - minScore);
    return 0.6 + normalized * 0.4;
  };

  // Gera posições pseudo-aleatórias mas consistentes
  const getPosition = (index: number) => {
    const seed = index * 137.508; // Número áureo para distribuição
    const angle = seed % (2 * Math.PI);
    const radius = 30 + (index % 5) * 15;
    
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    };
  };

  if (topMarcas.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Nenhuma marca dialetal disponível para visualização
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-background to-muted/20 rounded-lg border overflow-hidden">
      {/* Legenda */}
      <div className="absolute top-4 right-4 z-10 bg-card/95 backdrop-blur-sm border rounded-lg p-3 space-y-2 shadow-lg">
        <p className="text-xs font-semibold text-muted-foreground mb-2">TIPOS</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-xs">Regionalismo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-600" />
            <span className="text-xs">Arcaísmo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600" />
            <span className="text-xs">Platinismo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-600" />
            <span className="text-xs">Léxico</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Tamanho = Score de dialectalidade
        </p>
      </div>

      {/* Nuvem de palavras */}
      <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-3 p-8">
        <TooltipProvider delayDuration={200}>
          {topMarcas.map((marca, index) => {
            const fontSize = getFontSize(marca.score);
            const opacity = getOpacity(marca.score);
            const colors = TIPO_COLORS[marca.tipo];
            const isHovered = hoveredWord === marca.termo;

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className="inline-block cursor-pointer transition-all duration-300 ease-out hover:scale-110"
                    style={{
                      fontSize: `${fontSize}px`,
                      opacity: isHovered ? 1 : opacity,
                      transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                    }}
                    onMouseEnter={() => setHoveredWord(marca.termo)}
                    onMouseLeave={() => setHoveredWord(null)}
                    onClick={() => handleWordClick(marca)}
                  >
                    <span
                      className={`font-bold ${colors.base} transition-all duration-300 drop-shadow-sm hover:drop-shadow-md`}
                      style={{
                        textShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {marca.termo}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-sm bg-card border-2 shadow-xl z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{marca.termo}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${colors.bg} ${colors.border}`}
                      >
                        {marca.tipo}
                      </Badge>
                    </div>
                    
                    {marca.definicao && (
                      <p className="text-sm text-muted-foreground border-t pt-2">
                        {marca.definicao}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                      <div>
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-mono font-bold ml-1">{marca.score.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">LL:</span>
                        <span className="font-mono font-bold ml-1">{marca.ll.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {marca.origem && (
                      <div className="flex items-center gap-2 text-xs border-t pt-2">
                        <span className="text-muted-foreground">Origem:</span>
                        <Badge variant="secondary" className="text-xs">
                          {marca.origem}
                        </Badge>
                        {marca.statusTemporal && (
                          <Badge variant="outline" className="text-xs">
                            {marca.statusTemporal}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <span className="capitalize">
                        {marca.categoria.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Estatísticas no rodapé */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{topMarcas.length}</strong> palavras exibidas
          </span>
          <span>•</span>
          <span>
            Score máximo: <strong className="text-foreground">{maxScore.toFixed(1)}</strong>
          </span>
          <span>•</span>
          <span>
            Score mínimo: <strong className="text-foreground">{minScore.toFixed(1)}</strong>
          </span>
        </div>
      </div>

      {/* Modal de detalhes */}
      <DialectalWordDetailModal
        marca={selectedMarca}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMarca(null);
        }}
      />
    </div>
  );
}
