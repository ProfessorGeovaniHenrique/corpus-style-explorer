import React, { useEffect, useRef, useState, useCallback } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';
import { KWICModal } from './KWICModal';
import { FilterToolbar, FilterState } from './FilterToolbar';
import { StatisticalTooltip } from './StatisticalTooltip';
import { VerticalZoomControls } from './VerticalZoomControls';

// Types
type ViewLevel = 'universe' | 'galaxy' | 'constellation';

interface SemanticDomain {
  id: string;
  name: string;
  color: string;
  words: Array<{
    word: string;
    frequency: number;
    strength: number;
    prosody: 'Positiva' | 'Neutra' | 'Negativa';
    significance: 'Alta' | 'Média' | 'Baixa';
  }>;
}

interface BreadcrumbItem {
  level: ViewLevel;
  label: string;
  domainId?: string;
}

// Orbital positioning utility
const positionOnOrbit = (index: number, total: number, radius: number) => {
  const angle = (index / total) * 2 * Math.PI;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle)
  };
};

// Dados extraídos da canção "A Calma do Tarumã" - Luiz Marenco
const SEMANTIC_DOMAINS: SemanticDomain[] = [
  {
    id: 'nature',
    name: 'Natureza',
    color: '#33a033',
    words: [
      { word: 'campo', frequency: 45, strength: 0.95, prosody: 'Positiva', significance: 'Alta' },
      { word: 'sombra', frequency: 32, strength: 0.92, prosody: 'Neutra', significance: 'Alta' },
      { word: 'tarumã', frequency: 18, strength: 0.93, prosody: 'Positiva', significance: 'Média' },
      { word: 'várzea', frequency: 18, strength: 0.90, prosody: 'Positiva', significance: 'Média' },
      { word: 'campanha', frequency: 15, strength: 0.82, prosody: 'Positiva', significance: 'Média' },
      { word: 'sol', frequency: 12, strength: 0.84, prosody: 'Positiva', significance: 'Média' },
      { word: 'horizonte', frequency: 12, strength: 0.85, prosody: 'Positiva', significance: 'Média' },
      { word: 'coxilha', frequency: 11, strength: 0.87, prosody: 'Positiva', significance: 'Média' },
      { word: 'primavera', frequency: 8, strength: 0.78, prosody: 'Positiva', significance: 'Baixa' }
    ]
  },
  {
    id: 'culture',
    name: 'Cultura Gaúcha',
    color: '#a06e33',
    words: [
      { word: 'galpão', frequency: 25, strength: 0.88, prosody: 'Positiva', significance: 'Alta' },
      { word: 'mate', frequency: 15, strength: 0.85, prosody: 'Positiva', significance: 'Média' },
      { word: 'campereada', frequency: 15, strength: 0.86, prosody: 'Neutra', significance: 'Média' },
      { word: 'gateada', frequency: 12, strength: 0.82, prosody: 'Neutra', significance: 'Média' },
      { word: 'querência', frequency: 12, strength: 0.87, prosody: 'Positiva', significance: 'Média' },
      { word: 'ramada', frequency: 11, strength: 0.90, prosody: 'Positiva', significance: 'Média' },
      { word: 'tropa', frequency: 9, strength: 0.81, prosody: 'Neutra', significance: 'Baixa' },
      { word: 'arreios', frequency: 6, strength: 0.80, prosody: 'Neutra', significance: 'Baixa' },
      { word: 'bomba', frequency: 6, strength: 0.78, prosody: 'Neutra', significance: 'Baixa' },
      { word: 'esporas', frequency: 4, strength: 0.79, prosody: 'Neutra', significance: 'Baixa' },
      { word: 'cuia', frequency: 3, strength: 0.83, prosody: 'Positiva', significance: 'Baixa' }
    ]
  },
  {
    id: 'temporal',
    name: 'Tempo',
    color: '#4f7cac',
    words: [
      { word: 'noite', frequency: 28, strength: 0.86, prosody: 'Neutra', significance: 'Alta' },
      { word: 'tarde', frequency: 15, strength: 0.88, prosody: 'Neutra', significance: 'Média' },
      { word: 'manhãs', frequency: 12, strength: 0.83, prosody: 'Positiva', significance: 'Média' },
      { word: 'madrugada', frequency: 11, strength: 0.85, prosody: 'Neutra', significance: 'Média' },
      { word: 'aurora', frequency: 8, strength: 0.80, prosody: 'Positiva', significance: 'Baixa' }
    ]
  },
  {
    id: 'emotion',
    name: 'Emoções',
    color: '#e08e33',
    words: [
      { word: 'saudades', frequency: 32, strength: 0.91, prosody: 'Negativa', significance: 'Alta' },
      { word: 'sonhos', frequency: 11, strength: 0.88, prosody: 'Positiva', significance: 'Média' },
      { word: 'calma', frequency: 22, strength: 0.89, prosody: 'Positiva', significance: 'Alta' },
      { word: 'tristeza', frequency: 9, strength: 0.84, prosody: 'Negativa', significance: 'Baixa' },
      { word: 'silêncio', frequency: 2, strength: 0.75, prosody: 'Neutra', significance: 'Baixa' }
    ]
  },
  {
    id: 'space',
    name: 'Espaço',
    color: '#7d4cdb',
    words: [
      { word: 'canto', frequency: 14, strength: 0.82, prosody: 'Neutra', significance: 'Média' },
      { word: 'potreiro', frequency: 10, strength: 0.79, prosody: 'Neutra', significance: 'Média' },
      { word: 'fronteira', frequency: 8, strength: 0.77, prosody: 'Neutra', significance: 'Baixa' },
      { word: 'taipas', frequency: 5, strength: 0.73, prosody: 'Neutra', significance: 'Baixa' }
    ]
  }
];

const SONG_DATA = {
  title: 'A Calma do Tarumã',
  artist: 'Luiz Marenco'
};

// KWIC data extraídos da letra
const kwicData: Record<string, Array<{
  leftContext: string;
  keyword: string;
  rightContext: string;
  source: string;
}>> = {
  'tarumã': [
    {
      leftContext: 'A calma do',
      keyword: 'tarumã',
      rightContext: ', ganhou sombra mais copada',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    },
    {
      leftContext: 'E o verso sonhou ser várzea com sombra de',
      keyword: 'tarumã',
      rightContext: '',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    }
  ],
  'campo': [
    {
      leftContext: 'Daí um verso de',
      keyword: 'campo',
      rightContext: 'se chegou da campereada',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    }
  ],
  'galpão': [
    {
      leftContext: 'E uma saudade redomona pelos cantos do',
      keyword: 'galpão',
      rightContext: '',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    }
  ],
  'saudades': [
    {
      leftContext: 'A mansidão da campanha traz',
      keyword: 'saudades',
      rightContext: 'feito açoite',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    }
  ],
  'sombra': [
    {
      leftContext: 'ganhou',
      keyword: 'sombra',
      rightContext: 'mais copada',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    }
  ]
};

const getMockKWICData = (word: string) => {
  return kwicData[word.toLowerCase()] || [
    {
      leftContext: 'Contexto da palavra',
      keyword: word,
      rightContext: 'na canção',
      source: `${SONG_DATA.artist} - ${SONG_DATA.title}`
    }
  ];
};

// Orbital Rings Component
const OrbitalRings: React.FC<{ isPaused: boolean }> = ({ isPaused }) => {
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        <style>{`
          .orbit-ring {
            transform-origin: 50% 50%;
            animation: rotate-orbit 120s linear infinite;
          }
          .orbit-ring.inner-orbit {
            animation-duration: 80s;
          }
          .orbit-ring.middle-orbit {
            animation-duration: 100s;
          }
          .orbit-ring.outer-orbit {
            animation-duration: 120s;
          }
          .orbit-ring.paused {
            animation-play-state: paused;
          }
          @keyframes rotate-orbit {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </defs>
      <circle 
        cx="50%" 
        cy="50%" 
        r="120" 
        fill="none" 
        stroke="rgba(255,255,255,0.15)" 
        strokeWidth="1" 
        strokeDasharray="5,5"
        className={`orbit-ring inner-orbit ${isPaused ? 'paused' : ''}`}
      />
      <circle 
        cx="50%" 
        cy="50%" 
        r="200" 
        fill="none" 
        stroke="rgba(255,255,255,0.12)" 
        strokeWidth="1" 
        strokeDasharray="8,4"
        className={`orbit-ring middle-orbit ${isPaused ? 'paused' : ''}`}
      />
      <circle 
        cx="50%" 
        cy="50%" 
        r="280" 
        fill="none" 
        stroke="rgba(255,255,255,0.08)" 
        strokeWidth="1" 
        strokeDasharray="12,6"
        className={`orbit-ring outer-orbit ${isPaused ? 'paused' : ''}`}
      />
    </svg>
  );
};

export const SigmaSemanticNetwork: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<any>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [viewLevel, setViewLevel] = useState<ViewLevel>('universe');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: 'universe', label: 'Universo Semântico' }
  ]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [kwicModalOpen, setKwicModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    word: string | null;
    position: { x: number; y: number };
    stats: any | null;
  }>({
    visible: false,
    word: null,
    position: { x: 0, y: 0 },
    stats: null
  });
  
  const allCategories = SEMANTIC_DOMAINS.map(d => d.name);
  const [filters, setFilters] = useState<FilterState>({
    minFrequency: 1,
    prosody: ['positive', 'neutral', 'negative'],
    categories: allCategories,
    searchQuery: '',
  });

  // Filter words based on active filters
  const shouldShowWord = useCallback((wordData: any, domainName: string) => {
    if (wordData.frequency < filters.minFrequency) return false;
    if (!filters.categories.includes(domainName)) return false;
    
    const prosodyMap = { 'Positiva': 'positive', 'Neutra': 'neutral', 'Negativa': 'negative' };
    if (!filters.prosody.includes(prosodyMap[wordData.prosody] as any)) return false;
    
    if (filters.searchQuery && !wordData.word.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  }, [filters]);

  // Build Universe view with orbital positioning
  const buildUniverseView = (graph: any) => {
    graph.clear();

    // Center: Song node with glow
    graph.addNode('song', {
      label: SONG_DATA.title,
      x: 0,
      y: 0,
      size: 35,
      color: '#f0b500'
    });

    // Collect all words with their domains
    const allWords: Array<{word: any, domain: SemanticDomain}> = [];
    SEMANTIC_DOMAINS.forEach(domain => {
      domain.words.forEach(word => {
        if (shouldShowWord(word, domain.name)) {
          allWords.push({ word, domain });
        }
      });
    });

    // Distribute words across 3 orbits
    const orbitSizes = [120, 200, 280];
    const wordsPerOrbit = Math.ceil(allWords.length / 3);
    
    allWords.forEach((item, index) => {
      const orbitIndex = Math.floor(index / wordsPerOrbit);
      const posInOrbit = index % wordsPerOrbit;
      const wordsInThisOrbit = Math.min(wordsPerOrbit, allWords.length - orbitIndex * wordsPerOrbit);
      const radius = orbitSizes[Math.min(orbitIndex, 2)];
      
      const pos = positionOnOrbit(posInOrbit, wordsInThisOrbit, radius);
      
      // Size based on frequency (8-15px)
      const size = 8 + (item.word.frequency / 45) * 7;
      
      graph.addNode(item.word.word, {
        label: item.word.word,
        x: pos.x,
        y: pos.y,
        size: size,
        color: item.domain.color
      });

      graph.addEdge('song', item.word.word, {
        size: 1,
        color: item.domain.color + '40'
      });
    });
  };

  // Build Galaxy view with 5 domain stars (no orbits)
  const buildGalaxyView = (graph: any) => {
    graph.clear();

    const positions = [
      { x: -200, y: -100 },  // Natureza
      { x: 200, y: -100 },   // Cultura
      { x: 0, y: 150 },      // Emoções
      { x: -150, y: 200 },   // Tempo
      { x: 150, y: 200 }     // Espaço
    ];

    SEMANTIC_DOMAINS.forEach((domain, index) => {
      if (index < positions.length) {
        graph.addNode(domain.id, {
          label: domain.name,
          x: positions[index].x,
          y: positions[index].y,
          size: 25,
          color: domain.color
        });
      }
    });
  };

  // Build Constellation view with orbital positioning
  const buildConstellationView = (graph: any, domainId: string) => {
    graph.clear();

    const domain = SEMANTIC_DOMAINS.find(d => d.id === domainId);
    if (!domain) return;

    // Center: Domain node
    graph.addNode(domainId, {
      label: domain.name,
      x: 0,
      y: 0,
      size: 30,
      color: domain.color
    });

    // Words in orbits
    const filteredWords = domain.words.filter(w => shouldShowWord(w, domain.name));
    const radius = 120;

    filteredWords.forEach((word, index) => {
      const pos = positionOnOrbit(index, filteredWords.length, radius);
      const size = 8 + (word.frequency / 45) * 7;
      
      graph.addNode(word.word, {
        label: word.word,
        x: pos.x,
        y: pos.y,
        size: size,
        color: domain.color
      });

      graph.addEdge(domainId, word.word, {
        size: 1,
        color: domain.color + '40'
      });
    });
  };

  // Initialize Sigma
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      console.log('🚀 Inicializando Sigma.js...');

      const graph = new Graph();
      graphRef.current = graph;

      buildUniverseView(graph);

      const sigma = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: true,
        renderLabels: true,
        labelSize: 12,
        labelColor: { color: '#FFFFFF' },
        defaultNodeColor: '#f0b500',
        minCameraRatio: 0.1,
        maxCameraRatio: 10
      });

      sigmaRef.current = sigma;

      // Hover handlers
      sigma.on('enterNode', ({ node }) => {
        setHoveredNode(node);
        setIsPaused(true);
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
        }
      });

      sigma.on('leaveNode', () => {
        setHoveredNode(null);
        pauseTimeoutRef.current = setTimeout(() => {
          setIsPaused(false);
        }, 2000);
      });

      // Click handler
      sigma.on('clickNode', ({ node }) => {
        if (viewLevel === 'universe' && node === 'song') {
          console.log('🌌 Navegando para Galáxia');
          setViewLevel('galaxy');
          setBreadcrumbs([
            { level: 'universe', label: 'Universo Semântico' },
            { level: 'galaxy', label: 'Galáxia de Domínios' }
          ]);
        } else if (viewLevel === 'galaxy') {
          const domain = SEMANTIC_DOMAINS.find(d => d.id === node);
          if (domain) {
            console.log(`🔄 Navegando para Constelação: ${node}`);
            setSelectedDomain(node);
            setViewLevel('constellation');
            setBreadcrumbs([
              { level: 'universe', label: 'Universo Semântico' },
              { level: 'galaxy', label: 'Galáxia de Domínios' },
              { level: 'constellation', label: `Sistema: ${domain.name}`, domainId: node }
            ]);
          }
        } else if (viewLevel === 'constellation' && node !== selectedDomain) {
          console.log(`📝 Palavra selecionada: ${node}`);
          setSelectedWord(node);
          setKwicModalOpen(true);
        } else if (viewLevel === 'universe' && node !== 'song') {
          console.log(`📝 Palavra selecionada: ${node}`);
          setSelectedWord(node);
          setKwicModalOpen(true);
        }
      });

      console.log('✅ Sigma inicializado com sucesso!');

      return () => {
        console.log('🧹 Limpando instância Sigma...');
        sigma.kill();
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar Sigma:', error);
    }
  }, []);

  // Update view when level changes
  useEffect(() => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    
    if (!graph || !sigma) return;

    switch (viewLevel) {
      case 'universe':
        buildUniverseView(graph);
        break;
      case 'galaxy':
        buildGalaxyView(graph);
        break;
      case 'constellation':
        if (selectedDomain) {
          buildConstellationView(graph, selectedDomain);
        }
        break;
    }

    sigma.refresh();
    handleResetView();
  }, [viewLevel, selectedDomain, filters]);

  // Navigation handlers
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    setViewLevel(item.level);
    if (item.level === 'constellation' && item.domainId) {
      setSelectedDomain(item.domainId);
    }
    const index = breadcrumbs.findIndex(b => b.level === item.level);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const lastItem = newBreadcrumbs[newBreadcrumbs.length - 1];
      setBreadcrumbs(newBreadcrumbs);
      setViewLevel(lastItem.level);
      if (lastItem.domainId) {
        setSelectedDomain(lastItem.domainId);
      }
    }
  };

  const handleZoomIn = useCallback(() => {
    const camera = sigmaRef.current?.getCamera();
    if (camera) {
      camera.animatedZoom({ duration: 300 });
      setZoomLevel(prev => Math.min(200, prev + 10));
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const camera = sigmaRef.current?.getCamera();
    if (camera) {
      camera.animatedUnzoom({ duration: 300 });
      setZoomLevel(prev => Math.max(50, prev - 10));
    }
  }, []);

  const handleResetView = useCallback(() => {
    const camera = sigmaRef.current?.getCamera();
    if (camera) {
      camera.animatedReset({ duration: 500 });
      setZoomLevel(100);
    }
  }, []);

  const handleFitToScreen = useCallback(() => {
    const camera = sigmaRef.current?.getCamera();
    if (camera) {
      camera.animatedReset({ duration: 500 });
      setZoomLevel(100);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;

    switch (viewLevel) {
      case 'universe':
        buildUniverseView(graph);
        break;
      case 'galaxy':
        buildGalaxyView(graph);
        break;
      case 'constellation':
        if (selectedDomain) {
          buildConstellationView(graph, selectedDomain);
        }
        break;
    }

    sigma.refresh();
  }, [viewLevel, selectedDomain]);

  const handleZoomChange = useCallback((value: number) => {
    const camera = sigmaRef.current?.getCamera();
    if (camera) {
      const ratio = value / 100;
      camera.animatedZoom({ duration: 200, factor: ratio / camera.getState().ratio });
      setZoomLevel(value);
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[800px] rounded-lg overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, #161622 0%, #0a0a15 100%)'
        }}
      />

      {/* Breadcrumbs Navigation */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {breadcrumbs.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="bg-[#2d2d2d]/90 hover:bg-[#3d3d3d] text-white border border-border/50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        )}
        
        <div className="bg-[#2d2d2d]/90 px-4 py-2 rounded-lg border border-border/50 flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground" />
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.level}>
              {index > 0 && <span className="text-muted-foreground">›</span>}
              <button
                onClick={() => handleBreadcrumbClick(crumb)}
                className={`text-sm hover:text-primary transition-colors ${
                  index === breadcrumbs.length - 1 ? 'text-white font-semibold' : 'text-muted-foreground'
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="absolute top-4 right-4 left-[200px] z-20">
        <FilterToolbar
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          categories={allCategories}
        />
      </div>

      {/* Pause Indicator */}
      {isPaused && (
        <div className="absolute top-20 right-4 z-20 bg-[#2d2d2d]/90 px-3 py-1.5 rounded-lg border border-border/50 text-sm text-muted-foreground">
          ⏸️ Pausado
        </div>
      )}

      {/* Orbital Rings (only for Universe and Constellation) */}
      {(viewLevel === 'universe' || viewLevel === 'constellation') && (
        <OrbitalRings isPaused={isPaused} />
      )}

      {/* Sigma Container with glow */}
      <div 
        ref={containerRef}
        className="absolute inset-0"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(240, 181, 0, 0.3))',
          zIndex: 2
        }}
      />

      {/* Vertical Zoom Controls */}
      <VerticalZoomControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        onFit={handleFitToScreen}
        onRefresh={handleRefresh}
        onZoomChange={handleZoomChange}
        onPauseToggle={togglePause}
        isPaused={isPaused}
        onFullscreen={handleFullscreen}
      />

      {/* KWIC Modal */}
      {selectedWord && (
        <KWICModal
          open={kwicModalOpen}
          onOpenChange={(open) => {
            setKwicModalOpen(open);
            if (!open) setSelectedWord(null);
          }}
          word={selectedWord}
          data={getMockKWICData(selectedWord)}
        />
      )}

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 20px #f0b500) drop-shadow(0 0 40px #f0b500);
            transform: scale(1);
          }
          50% { 
            filter: drop-shadow(0 0 30px #f0b500) drop-shadow(0 0 50px #f0b500);
            transform: scale(1.05);
          }
        }
        
        ${!isPaused ? `
          #sigma-container {
            animation: shimmer 3s ease-in-out infinite;
          }
        ` : ''}
      `}</style>
    </div>
  );
};
