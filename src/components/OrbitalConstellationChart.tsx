import { Badge } from "@/components/ui/badge";
import { useState, useRef, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface WordData {
  word: string;
  strength: number;
  category: string;
  color: string;
}
interface OrbitalSystem {
  centerWord: string;
  words: WordData[];
}
interface OrbitalConstellationChartProps {
  songName?: string;
  artistName?: string;
}
export const OrbitalConstellationChart = ({
  songName = "Quando o verso vem pras casa",
  artistName = "Luiz Marenco"
}: OrbitalConstellationChartProps) => {
  const [viewMode, setViewMode] = useState<'mother' | 'systems' | 'zoomed'>('mother');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Estados para drag and drop
  const [customAngles, setCustomAngles] = useState<Record<string, number>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Cores da análise de prosódia semântica
  const centerWordColors: Record<string, string> = {
    "verso": "hsl(var(--primary))",
    "saudade": "hsl(var(--destructive))",
    "sonhos": "#a855f7",
    "cansado": "#f59e0b",
    "silêncio": "#64748b",
    "arreios": "#3b82f6"
  };

  // Definição dos 6 sistemas orbitais
  const orbitalSystems: OrbitalSystem[] = [{
    centerWord: "verso",
    words: [{
      word: "campereada",
      strength: 92,
      category: "Protagonista Personificado",
      color: "hsl(var(--primary))"
    }, {
      word: "desencilhou",
      strength: 88,
      category: "Protagonista Personificado",
      color: "hsl(var(--primary))"
    }, {
      word: "sonhos",
      strength: 85,
      category: "Protagonista Personificado",
      color: "hsl(var(--primary))"
    }, {
      word: "campeira",
      strength: 82,
      category: "Protagonista Personificado",
      color: "hsl(var(--primary))"
    }]
  }, {
    centerWord: "saudade",
    words: [{
      word: "açoite",
      strength: 95,
      category: "Dor e Nostalgia",
      color: "hsl(var(--destructive))"
    }, {
      word: "redomona",
      strength: 93,
      category: "Dor e Nostalgia",
      color: "hsl(var(--destructive))"
    }, {
      word: "galpão",
      strength: 87,
      category: "Dor e Nostalgia",
      color: "hsl(var(--destructive))"
    }, {
      word: "olhos negros",
      strength: 81,
      category: "Dor e Nostalgia",
      color: "hsl(var(--destructive))"
    }]
  }, {
    centerWord: "sonhos",
    words: [{
      word: "várzea",
      strength: 89,
      category: "Refúgio e Frustração",
      color: "#a855f7"
    }, {
      word: "prenda",
      strength: 86,
      category: "Refúgio e Frustração",
      color: "#a855f7"
    }, {
      word: "gateado",
      strength: 84,
      category: "Refúgio e Frustração",
      color: "#a855f7"
    }, {
      word: "desgarrou",
      strength: 78,
      category: "Refúgio e Frustração",
      color: "#a855f7"
    }]
  }, {
    centerWord: "cansado",
    words: [{
      word: "caindo",
      strength: 91,
      category: "Fim de Ciclo",
      color: "#f59e0b"
    }, {
      word: "lonjuras",
      strength: 88,
      category: "Fim de Ciclo",
      color: "#f59e0b"
    }, {
      word: "tarde",
      strength: 85,
      category: "Fim de Ciclo",
      color: "#f59e0b"
    }, {
      word: "ramada",
      strength: 78,
      category: "Fim de Ciclo",
      color: "#f59e0b"
    }]
  }, {
    centerWord: "silêncio",
    words: [{
      word: "desgarrou",
      strength: 94,
      category: "Solidão e Abandono",
      color: "#64748b"
    }, {
      word: "esporas",
      strength: 90,
      category: "Solidão e Abandono",
      color: "#64748b"
    }, {
      word: "encostada",
      strength: 86,
      category: "Solidão e Abandono",
      color: "#64748b"
    }, {
      word: "recostada",
      strength: 82,
      category: "Solidão e Abandono",
      color: "#64748b"
    }]
  }, {
    centerWord: "arreios",
    words: [{
      word: "suados",
      strength: 93,
      category: "Extensão de Identidade",
      color: "#3b82f6"
    }, {
      word: "gateada",
      strength: 88,
      category: "Extensão de Identidade",
      color: "#3b82f6"
    }, {
      word: "respeito",
      strength: 85,
      category: "Extensão de Identidade",
      color: "#3b82f6"
    }, {
      word: "querência",
      strength: 79,
      category: "Extensão de Identidade",
      color: "#3b82f6"
    }]
  }];

  // Calcula a órbita baseado na força
  const getOrbit = (strength: number) => {
    if (strength >= 90) return 1;
    if (strength >= 80) return 2;
    if (strength >= 70) return 3;
    return 4;
  };
  const orbitRadii = {
    1: 35,
    2: 55,
    3: 75,
    4: 95
  };

  // Handlers de drag and drop
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGGElement>, wordKey: string, centerX: number, centerY: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedWord(wordKey);

    // Armazena dados do centro no elemento para uso no mousemove
    const target = e.currentTarget;
    target.dataset.centerX = centerX.toString();
    target.dataset.centerY = centerY.toString();
  }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWord || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    // Recupera os dados do centro do elemento sendo arrastado
    const draggedElement = svg.querySelector(`[data-word-key="${draggedWord}"]`);
    if (!draggedElement) return;
    const centerX = parseFloat(draggedElement.getAttribute('data-center-x') || '0');
    const centerY = parseFloat(draggedElement.getAttribute('data-center-y') || '0');

    // Calcula o ângulo do mouse em relação ao centro
    const dx = svgP.x - centerX;
    const dy = svgP.y - centerY;
    const angle = Math.atan2(dy, dx);
    setCustomAngles(prev => ({
      ...prev,
      [draggedWord]: angle
    }));
  }, [draggedWord]);
  const handleMouseUp = useCallback(() => {
    setDraggedWord(null);
  }, []);

  // Adiciona listeners globais para mousemove e mouseup
  useState(() => {
    if (draggedWord) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  // Efeito para gerenciar eventos de drag
  useState(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedWord) {
        handleMouseMove(e);
      }
    };
    const handleGlobalMouseUp = () => {
      if (draggedWord) {
        handleMouseUp();
      }
    };
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  });

  // Renderiza um sistema orbital individual
  const renderOrbitalSystem = (system: OrbitalSystem, centerX: number, centerY: number, isZoomed: boolean = false) => {
    const scale = isZoomed ? 2.5 : 1;
    const orbitRadiiScaled = {
      1: 35 * scale,
      2: 55 * scale,
      3: 75 * scale,
      4: 95 * scale
    };

    // Organiza palavras por órbita
    const wordsByOrbit = system.words.reduce((acc, word) => {
      const orbit = getOrbit(word.strength);
      if (!acc[orbit]) acc[orbit] = [];
      acc[orbit].push(word);
      return acc;
    }, {} as Record<number, WordData[]>);

    // Calcula posição de cada palavra
    const getWordPosition = (word: WordData, index: number, totalInOrbit: number) => {
      const orbit = getOrbit(word.strength);
      const radius = orbitRadiiScaled[orbit as keyof typeof orbitRadiiScaled];
      const wordKey = `${system.centerWord}-${word.word}`;

      // Usa ângulo customizado ou calcula o padrão
      const angle = customAngles[wordKey] !== undefined ? customAngles[wordKey] : index / totalInOrbit * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        radius,
        angle
      };
    };
    return <g key={system.centerWord}>
        {/* Órbitas */}
        {[1, 2, 3].map(orbit => <circle key={`orbit-${orbit}`} cx={centerX} cy={centerY} r={orbitRadiiScaled[orbit as keyof typeof orbitRadiiScaled]} fill="none" stroke="hsl(var(--border))" strokeWidth={isZoomed ? "1" : "0.5"} strokeDasharray="2 2" opacity={0.2} />)}

        {/* Linhas conectando ao centro */}
        {Object.entries(wordsByOrbit).map(([orbit, wordsInOrbit]) => wordsInOrbit.map((word, index) => {
        const pos = getWordPosition(word, index, wordsInOrbit.length);
        return <line key={`line-${system.centerWord}-${word.word}-${index}`} x1={centerX} y1={centerY} x2={pos.x} y2={pos.y} stroke={word.color} strokeWidth={isZoomed ? "1" : "0.5"} opacity="0.15" />;
      }))}

        {/* Palavra central */}
        <g>
          <circle cx={centerX} cy={centerY} r={18 * scale} fill={centerWordColors[system.centerWord]} opacity="0.9" />
          <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground font-bold" style={{
          fontSize: `${14 * scale}px`,
          pointerEvents: 'none'
        }}>
            {system.centerWord}
          </text>
        </g>

        {/* Palavras orbitando */}
        {Object.entries(wordsByOrbit).map(([orbit, wordsInOrbit]) => wordsInOrbit.map((word, index) => {
        const pos = getWordPosition(word, index, wordsInOrbit.length);
        const wordKey = `${system.centerWord}-${word.word}`;
        const isBeingDragged = draggedWord === wordKey;
        return <g key={`word-${wordKey}`} data-word-key={wordKey} data-center-x={centerX} data-center-y={centerY} style={{
          cursor: isZoomed ? isBeingDragged ? 'grabbing' : 'grab' : 'default'
        }} onMouseDown={e => isZoomed && handleMouseDown(e, wordKey, centerX, centerY)}>
                {/* Glow effect */}
                <circle cx={pos.x} cy={pos.y} r={6 * scale} fill={word.color} opacity="0.2" style={{
            pointerEvents: 'none'
          }} />
                <circle cx={pos.x} cy={pos.y} r={4 * scale} fill={word.color} opacity="1" stroke="hsl(var(--background))" strokeWidth={0.5 * scale} style={{
            pointerEvents: 'none'
          }} />
                <text x={pos.x} y={pos.y - 9 * scale} textAnchor="middle" className="fill-foreground font-medium" style={{
            fontSize: `${8 * scale}px`,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
                  {word.word}
                </text>
                <text x={pos.x} y={pos.y + 13 * scale} textAnchor="middle" className="fill-muted-foreground" style={{
            fontSize: `${7 * scale}px`,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
                  {word.strength}%
                </text>
              </g>;
      }))}
      </g>;
  };

  // Renderiza o gráfico mãe
  const renderMotherOrbital = () => {
    const centerX = 600;
    const centerY = 400;
    const allWords = orbitalSystems.flatMap(system => system.words.map(word => ({
      ...word,
      system: system.centerWord
    })));
    const wordsByOrbit = allWords.reduce((acc, word) => {
      const orbit = getOrbit(word.strength);
      if (!acc[orbit]) acc[orbit] = [];
      acc[orbit].push(word);
      return acc;
    }, {} as Record<number, typeof allWords>);
    const motherOrbitRadii = {
      1: 150,
      2: 220,
      3: 290,
      4: 360
    };
    return;
  };

  // Renderiza grid de sistemas
  const renderSystemsGrid = () => {
    return <>
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <h3 className="text-lg font-semibold">Sistemas Orbitais - Prosódia Semântica</h3>
          <button onClick={() => setViewMode('mother')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao gráfico geral
          </button>
        </div>
        <svg width="1200" height="700" viewBox="0 0 1200 700" className="w-full h-auto animate-fade-in">
          {orbitalSystems.map((system, index) => {
          const col = index % 3;
          const row = Math.floor(index / 3);
          const x = 200 + col * 400;
          const y = 180 + row * 350;
          return <g key={system.centerWord} className="cursor-pointer transition-all duration-200 hover:opacity-80" onClick={() => {
            setSelectedSystem(system.centerWord);
            setViewMode('zoomed');
          }}>
                {renderOrbitalSystem(system, x, y)}
              </g>;
        })}
        </svg>
      </>;
  };

  // Renderiza sistema com zoom
  const renderZoomedSystem = () => {
    const system = orbitalSystems.find(s => s.centerWord === selectedSystem);
    if (!system) return null;
    return <>
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full" style={{
              backgroundColor: centerWordColors[system.centerWord]
            }} />
              Sistema Orbital: {system.centerWord}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Arraste as palavras para reposicioná-las na órbita
            </p>
          </div>
          <button onClick={() => setViewMode('systems')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar aos sistemas
          </button>
        </div>
        <svg ref={svgRef} width="800" height="600" viewBox="0 0 800 600" className="w-full h-auto animate-scale-in" style={{
        userSelect: draggedWord ? 'none' : 'auto'
      }}>
          {renderOrbitalSystem(system, 400, 300, true)}
        </svg>
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2">Palavras por Força de Associação</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {system.words.sort((a, b) => b.strength - a.strength).map(word => <div key={word.word} className="flex items-center justify-between">
                  <span className="font-medium">{word.word}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full" style={{
                  width: `${word.strength}%`,
                  backgroundColor: word.color
                }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{word.strength}%</span>
                  </div>
                </div>)}
          </div>
        </div>
      </>;
  };

  // Handlers de zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
    }
  };
  const handleZoomIn = () => setZoomLevel(prev => Math.min(2, prev + 0.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.2));
  const handleResetZoom = () => setZoomLevel(1);
  return <div className="space-y-4">
      <div className="relative w-full bg-gradient-to-br from-background to-muted/20 rounded-lg border p-4 overflow-hidden transition-all duration-500" onWheel={handleWheel}>
        {/* Controles de Zoom */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors" title="Zoom In (Ctrl + Scroll Up)">
            <span className="text-lg font-bold">+</span>
          </button>
          <button onClick={handleResetZoom} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors text-xs" title="Reset Zoom">
            {Math.round(zoomLevel * 100)}%
          </button>
          <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors" title="Zoom Out (Ctrl + Scroll Down)">
            <span className="text-lg font-bold">−</span>
          </button>
        </div>

        <div className={`transition-all duration-300 ${viewMode === 'mother' ? 'opacity-100' : 'opacity-0 hidden'}`} style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center'
      }}>
          {viewMode === 'mother' && renderMotherOrbital()}
        </div>
        <div className={`transition-all duration-300 ${viewMode === 'systems' ? 'opacity-100' : 'opacity-0 hidden'}`} style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center'
      }}>
          {viewMode === 'systems' && renderSystemsGrid()}
        </div>
        <div className={`transition-all duration-300 ${viewMode === 'zoomed' ? 'opacity-100' : 'opacity-0 hidden'}`} style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center'
      }}>
          {viewMode === 'zoomed' && renderZoomedSystem()}
        </div>
      </div>

      {/* Legenda */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
          <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: "hsl(var(--primary))"
        }} />
          <span>Protagonista Personificado</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
          <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: "hsl(var(--destructive))"
        }} />
          <span>Dor e Nostalgia</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
          <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: "#a855f7"
        }} />
          <span>Refúgio e Frustração</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
          <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: "#f59e0b"
        }} />
          <span>Fim de Ciclo</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
          <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: "#64748b"
        }} />
          <span>Solidão e Abandono</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
          <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: "#3b82f6"
        }} />
          <span>Extensão de Identidade</span>
        </div>
      </div>

      {/* Explicação das órbitas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-muted/30">
          <div className="font-semibold mb-1">Órbita Interna</div>
          <div className="text-muted-foreground">90-100%</div>
        </div>
        <div className="p-2 rounded bg-muted/30">
          <div className="font-semibold mb-1">Órbita Intermediária</div>
          <div className="text-muted-foreground">80-89%</div>
        </div>
        <div className="p-2 rounded bg-muted/30">
          <div className="font-semibold mb-1">Órbita Externa</div>
          <div className="text-muted-foreground">70-79%</div>
        </div>
        <div className="p-2 rounded bg-muted/30">
          <div className="font-semibold mb-1">Órbita Periférica</div>
          <div className="text-muted-foreground">&lt;70%</div>
        </div>
      </div>
    </div>;
};