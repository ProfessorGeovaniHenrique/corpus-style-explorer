// Orbital Constellation Chart - Semantic visualization component
import { useState, useRef, useCallback, useEffect } from "react";
import { KWICModal } from "./KWICModal";
import { ZoomControlBar } from "@/components/ZoomControlBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
interface WordData {
  word: string;
  strength: number;
  category: string;
  color: string;
}
interface OrbitalSystem {
  centerWord: string;
  category: string;
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
  // View modes: overview -> universe -> galaxy -> constellation (individual)
  const [viewMode, setViewMode] = useState<'overview' | 'universe' | 'galaxy' | 'constellation'>('overview');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState({
    x: 0,
    y: 0
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({
    x: 0,
    y: 0
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customAngles, setCustomAngles] = useState<Record<string, number>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [orbitProgress, setOrbitProgress] = useState<Record<string, number>>({});
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [kwicModalOpen, setKwicModalOpen] = useState(false);
  const [selectedWordForKwic, setSelectedWordForKwic] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // KWIC data baseado na letra da música
  const getMockKWICData = (word: string) => {
    const kwicData: Record<string, Array<{
      leftContext: string;
      keyword: string;
      rightContext: string;
      source: string;
    }>> = {
      "verso": [{
        leftContext: "Daí um",
        keyword: "verso",
        rightContext: "de campo se chegou da campereada",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "Prá querência galponeira, onde o",
        keyword: "verso",
        rightContext: "é mais caseiro",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "E o",
        keyword: "verso",
        rightContext: "que tinha sonhos prá rondar na madrugada",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "E o",
        keyword: "verso",
        rightContext: "sonhou ser várzea com sombra de tarumã",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "campereada": [{
        leftContext: "Daí um verso de campo se chegou da",
        keyword: "campereada",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "desencilhou": [{
        leftContext: "",
        keyword: "Desencilhou",
        rightContext: "na ramada, já cansado das lonjuras",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "sonhos": [{
        leftContext: "E o verso que tinha",
        keyword: "sonhos",
        rightContext: "prá rondar na madrugada",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "E o verso",
        keyword: "sonhou",
        rightContext: "ser várzea com sombra de tarumã",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "",
        keyword: "Sonhou",
        rightContext: "com os olhos da prenda vestidos de primavera",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "campeira": [{
        leftContext: "Mas estampando a figura,",
        keyword: "campeira",
        rightContext: ", bem do seu jeito",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "açoite": [{
        leftContext: "A mansidão da campanha traz saudades feito",
        keyword: "açoite",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "redomona": [{
        leftContext: "E uma saudade",
        keyword: "redomona",
        rightContext: "pelos cantos do galpão",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "galpão": [{
        leftContext: "E uma saudade redomona pelos cantos do",
        keyword: "galpão",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "olhos negros": [{
        leftContext: "Com os",
        keyword: "olhos negros",
        rightContext: "de noite que ela mesmo aquerenciou",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "várzea": [{
        leftContext: "Pela",
        keyword: "várzea",
        rightContext: "espichada com o sol da tarde caindo",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "E o verso sonhou ser",
        keyword: "várzea",
        rightContext: "com sombra de tarumã",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "prenda": [{
        leftContext: "Sonhou com os olhos da",
        keyword: "prenda",
        rightContext: "vestidos de primavera",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "gateado": [{
        leftContext: "Ser um galo prás manhãs, ou um",
        keyword: "gateado",
        rightContext: "prá encilha",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "desgarrou": [{
        leftContext: "Deixou a cancela encostada e a tropa se",
        keyword: "desgarrou",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "caindo": [{
        leftContext: "Pela várzea espichada com o sol da tarde",
        keyword: "caindo",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "lonjuras": [{
        leftContext: "Desencilhou na ramada, já cansado das",
        keyword: "lonjuras",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "tarde": [{
        leftContext: "Pela várzea espichada com o sol da",
        keyword: "tarde",
        rightContext: "caindo",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }, {
        leftContext: "Trazendo um novo reponte, prá um fim de",
        keyword: "tarde",
        rightContext: "bem lindo",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "ramada": [{
        leftContext: "Desencilhou na",
        keyword: "ramada",
        rightContext: ", já cansado das lonjuras",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "esporas": [{
        leftContext: "Ficaram arreios suados e o silencio de",
        keyword: "esporas",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "encostada": [{
        leftContext: "Deixou a cancela",
        keyword: "encostada",
        rightContext: "e a tropa se desgarrou",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "recostada": [{
        leftContext: "Uma cuia e uma bomba",
        keyword: "recostada",
        rightContext: "na cambona",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "arreios": [{
        leftContext: "Ficaram",
        keyword: "arreios",
        rightContext: "suados e o silencio de esporas",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "suados": [{
        leftContext: "Ficaram arreios",
        keyword: "suados",
        rightContext: "e o silencio de esporas",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "gateada": [{
        leftContext: "No lombo de uma",
        keyword: "gateada",
        rightContext: "frente aberta de respeito",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "respeito": [{
        leftContext: "No lombo de uma gateada frente aberta de",
        keyword: "respeito",
        rightContext: "",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "querência": [{
        leftContext: "Prá",
        keyword: "querência",
        rightContext: "galponeira, onde o verso é mais caseiro",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "saudade": [{
        leftContext: "E uma",
        keyword: "saudade",
        rightContext: "redomona pelos cantos do galpão",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "silêncio": [{
        leftContext: "Ficaram arreios suados e o",
        keyword: "silencio",
        rightContext: "de esporas",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }],
      "cansado": [{
        leftContext: "Desencilhou na ramada, já",
        keyword: "cansado",
        rightContext: "das lonjuras",
        source: "Quando o verso vem pras casa - Luiz Marenco"
      }]
    };
    return kwicData[word.toLowerCase()] || [];
  };

  // Estatísticas de palavras
  const palavraStats: Record<string, {
    frequenciaBruta: number;
    frequenciaNormalizada: number;
    prosodia: "positiva" | "negativa" | "neutra";
  }> = {
    "verso": {
      frequenciaBruta: 4,
      frequenciaNormalizada: 23.5,
      prosodia: "positiva"
    },
    "campereada": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "desencilhou": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "sonhos": {
      frequenciaBruta: 3,
      frequenciaNormalizada: 17.6,
      prosodia: "positiva"
    },
    "campeira": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "positiva"
    },
    "galpão": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "querência": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "positiva"
    },
    "saudade": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "negativa"
    },
    "açoite": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "negativa"
    },
    "redomona": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "caindo": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "desgarrou": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "negativa"
    },
    "esporas": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "suados": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "negativa"
    },
    "ramada": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "cansado": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "negativa"
    },
    "lonjuras": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "encostada": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "recostada": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "gateada": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "respeito": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "positiva"
    },
    "tarde": {
      frequenciaBruta: 2,
      frequenciaNormalizada: 11.8,
      prosodia: "neutra"
    },
    "olhos negros": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "positiva"
    },
    "várzea": {
      frequenciaBruta: 2,
      frequenciaNormalizada: 11.8,
      prosodia: "positiva"
    },
    "prenda": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "positiva"
    },
    "gateado": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    },
    "silêncio": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "negativa"
    },
    "arreios": {
      frequenciaBruta: 1,
      frequenciaNormalizada: 5.9,
      prosodia: "neutra"
    }
  };

  // Cores por sistema
  const systemColors: Record<string, string> = {
    "Protagonista Personificado": "hsl(var(--primary))",
    "Dor e Nostalgia": "hsl(var(--destructive))",
    "Refúgio e Frustração": "#a855f7",
    "Fim de Ciclo": "#f59e0b",
    "Solidão e Abandono": "#64748b",
    "Extensão de Identidade": "#3b82f6"
  };

  // Definição dos sistemas semânticos
  const orbitalSystems: OrbitalSystem[] = [{
    centerWord: "verso",
    category: "Protagonista Personificado",
    words: [{
      word: "campereada",
      strength: 92,
      category: "Protagonista Personificado",
      color: systemColors["Protagonista Personificado"]
    }, {
      word: "desencilhou",
      strength: 88,
      category: "Protagonista Personificado",
      color: systemColors["Protagonista Personificado"]
    }, {
      word: "sonhos",
      strength: 85,
      category: "Protagonista Personificado",
      color: systemColors["Protagonista Personificado"]
    }, {
      word: "campeira",
      strength: 82,
      category: "Protagonista Personificado",
      color: systemColors["Protagonista Personificado"]
    }]
  }, {
    centerWord: "saudade",
    category: "Dor e Nostalgia",
    words: [{
      word: "açoite",
      strength: 95,
      category: "Dor e Nostalgia",
      color: systemColors["Dor e Nostalgia"]
    }, {
      word: "redomona",
      strength: 93,
      category: "Dor e Nostalgia",
      color: systemColors["Dor e Nostalgia"]
    }, {
      word: "galpão",
      strength: 87,
      category: "Dor e Nostalgia",
      color: systemColors["Dor e Nostalgia"]
    }, {
      word: "olhos negros",
      strength: 81,
      category: "Dor e Nostalgia",
      color: systemColors["Dor e Nostalgia"]
    }]
  }, {
    centerWord: "sonhos",
    category: "Refúgio e Frustração",
    words: [{
      word: "várzea",
      strength: 89,
      category: "Refúgio e Frustração",
      color: systemColors["Refúgio e Frustração"]
    }, {
      word: "prenda",
      strength: 86,
      category: "Refúgio e Frustração",
      color: systemColors["Refúgio e Frustração"]
    }, {
      word: "gateado",
      strength: 84,
      category: "Refúgio e Frustração",
      color: systemColors["Refúgio e Frustração"]
    }, {
      word: "desgarrou",
      strength: 78,
      category: "Refúgio e Frustração",
      color: systemColors["Refúgio e Frustração"]
    }]
  }, {
    centerWord: "cansado",
    category: "Fim de Ciclo",
    words: [{
      word: "caindo",
      strength: 91,
      category: "Fim de Ciclo",
      color: systemColors["Fim de Ciclo"]
    }, {
      word: "lonjuras",
      strength: 88,
      category: "Fim de Ciclo",
      color: systemColors["Fim de Ciclo"]
    }, {
      word: "tarde",
      strength: 85,
      category: "Fim de Ciclo",
      color: systemColors["Fim de Ciclo"]
    }, {
      word: "ramada",
      strength: 78,
      category: "Fim de Ciclo",
      color: systemColors["Fim de Ciclo"]
    }]
  }, {
    centerWord: "silêncio",
    category: "Solidão e Abandono",
    words: [{
      word: "desgarrou",
      strength: 94,
      category: "Solidão e Abandono",
      color: systemColors["Solidão e Abandono"]
    }, {
      word: "esporas",
      strength: 90,
      category: "Solidão e Abandono",
      color: systemColors["Solidão e Abandono"]
    }, {
      word: "encostada",
      strength: 86,
      category: "Solidão e Abandono",
      color: systemColors["Solidão e Abandono"]
    }, {
      word: "recostada",
      strength: 82,
      category: "Solidão e Abandono",
      color: systemColors["Solidão e Abandono"]
    }]
  }, {
    centerWord: "arreios",
    category: "Extensão de Identidade",
    words: [{
      word: "suados",
      strength: 93,
      category: "Extensão de Identidade",
      color: systemColors["Extensão de Identidade"]
    }, {
      word: "gateada",
      strength: 88,
      category: "Extensão de Identidade",
      color: systemColors["Extensão de Identidade"]
    }, {
      word: "respeito",
      strength: 85,
      category: "Extensão de Identidade",
      color: systemColors["Extensão de Identidade"]
    }, {
      word: "querência",
      strength: 79,
      category: "Extensão de Identidade",
      color: systemColors["Extensão de Identidade"]
    }]
  }];

  // Calcula órbita baseado na força
  const getOrbit = (strength: number) => {
    if (strength >= 90) return 1;
    if (strength >= 80) return 2;
    if (strength >= 70) return 3;
    return 4;
  };

  // Handler para mudança de progresso na órbita
  const handleOrbitProgressChange = (wordKey: string, progress: number) => {
    setOrbitProgress(prev => ({
      ...prev,
      [wordKey]: progress
    }));
  };

  // Handlers de drag para palavras
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGGElement>, wordKey: string, centerX: number, centerY: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedWord(wordKey);
    setIsDragging(false);
    const target = e.currentTarget;
    target.dataset.centerX = centerX.toString();
    target.dataset.centerY = centerY.toString();
  }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWord || !svgRef.current) return;
    setIsDragging(true);
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const draggedElement = svg.querySelector(`[data-word-key="${draggedWord}"]`);
    if (!draggedElement) return;
    const centerX = parseFloat(draggedElement.getAttribute('data-center-x') || '0');
    const centerY = parseFloat(draggedElement.getAttribute('data-center-y') || '0');
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

  // Efeito para gerenciar eventos de drag
  useEffect(() => {
    if (draggedWord) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedWord, handleMouseMove, handleMouseUp]);

  // Handlers de Pan
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'svg' || target.classList.contains('pan-area')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  }, [panOffset]);
  const handleCanvasPanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, panStart]);
  const handleCanvasPanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handlers de zoom melhorados
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Posição do cursor relativa ao container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calcula novo zoom
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
    
    // Ajusta pan para manter o foco no cursor
    const zoomRatio = newZoom / zoomLevel;
    const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
    const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;
    
    setZoomLevel(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoomLevel, panOffset]);

  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newZoom = Math.min(2, zoomLevel + 0.2);
    const zoomRatio = newZoom / zoomLevel;
    
    const newPanX = centerX - (centerX - panOffset.x) * zoomRatio;
    const newPanY = centerY - (centerY - panOffset.y) * zoomRatio;
    
    setZoomLevel(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newZoom = Math.max(0.5, zoomLevel - 0.2);
    const zoomRatio = newZoom / zoomLevel;
    
    const newPanX = centerX - (centerX - panOffset.x) * zoomRatio;
    const newPanY = centerY - (centerY - panOffset.y) * zoomRatio;
    
    setZoomLevel(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomChange = (newZoom: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const zoomRatio = newZoom / zoomLevel;
    const newPanX = centerX - (centerX - panOffset.x) * zoomRatio;
    const newPanY = centerY - (centerY - panOffset.y) * zoomRatio;
    
    setZoomLevel(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // NÍVEL 1: Overview - Sistemas orbitando o título da música
  const renderSystemsOverview = () => {
    const centerX = 575;
    const centerY = 400;
    const systemRadius = 280;
    return <svg width="1150" height="800" viewBox="0 0 1150 800" className="w-full h-auto animate-fade-in">
        {/* Órbita dos sistemas */}
        <circle cx={centerX} cy={centerY} r={systemRadius} fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="12 8" opacity={0.25} />
        
        {/* Órbita animada */}
        <circle cx={centerX} cy={centerY} r={systemRadius} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray={`${2 * Math.PI * systemRadius * 0.2} ${2 * Math.PI * systemRadius * 0.8}`} opacity={0.4} style={{
        animation: 'orbit-slide 15s linear infinite',
        transformOrigin: `${centerX}px ${centerY}px`
      }} />

        {/* Botão central - Título da música */}
        <g style={{
        cursor: 'pointer'
      }} onClick={() => setViewMode('universe')}>
          <circle cx={centerX} cy={centerY} r={85} fill="hsl(var(--primary))" opacity="0.08" className="animate-pulse" />
          <circle cx={centerX} cy={centerY} r={72} fill="hsl(var(--primary))" opacity="0.15" />
          <circle cx={centerX} cy={centerY} r={60} fill="hsl(var(--primary))" opacity="0.92" style={{
          filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.35))'
        }} />
          <circle cx={centerX} cy={centerY} r={60} fill="none" stroke="hsl(var(--background))" strokeWidth="3" opacity="0.5" />
          <text x={centerX} y={centerY - 10} textAnchor="middle" className="fill-primary-foreground font-bold text-[15px] pointer-events-none">
            {songName}
          </text>
          <text x={centerX} y={centerY + 8} textAnchor="middle" className="fill-primary-foreground text-[12px] pointer-events-none">
            {artistName}
          </text>
          <text x={centerX} y={centerY + 25} textAnchor="middle" className="fill-primary-foreground/80 text-[9px] italic pointer-events-none">
            Clique para explorar →
          </text>
        </g>

        {/* Sistemas semânticos orbitando */}
        {orbitalSystems.map((system, index) => {
        const angle = index / orbitalSystems.length * 2 * Math.PI - Math.PI / 2;
        const x = centerX + systemRadius * Math.cos(angle);
        const y = centerY + systemRadius * Math.sin(angle);
        const systemColor = systemColors[system.category];
        return <Popover key={system.category}>
              <PopoverTrigger asChild>
                <g style={{
              cursor: 'pointer'
            }} onMouseEnter={() => setHoveredSystem(system.category)} onMouseLeave={() => setHoveredSystem(null)}>
                  {/* Linha conectando ao centro */}
                  <line x1={centerX} y1={centerY} x2={x} y2={y} stroke={systemColor} strokeWidth="1.5" opacity="0.2" />

                  {/* Glow effects */}
                  <circle cx={x} cy={y} r={55} fill={systemColor} opacity="0.06" className="animate-pulse" />
                  <circle cx={x} cy={y} r={46} fill={systemColor} opacity="0.12" />
                  
                  {/* Botão principal do sistema */}
                  <circle cx={x} cy={y} r={38} fill={systemColor} opacity={hoveredSystem === system.category ? "0.95" : "0.88"} className="transition-all" style={{
                filter: 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.35))'
              }} />
                  <circle cx={x} cy={y} r={38} fill="none" stroke="hsl(var(--background))" strokeWidth="2.5" opacity="0.5" />

                  {/* Contador de palavras */}
                  <circle cx={x + 24} cy={y - 24} r={10} fill="hsl(var(--background))" stroke={systemColor} strokeWidth="2" />
                  <text x={x + 24} y={y - 24} textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-[11px] pointer-events-none">
                    {system.words.length}
                  </text>

                  {/* Nome da categoria */}
                  <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground font-bold text-[13px] pointer-events-none">
                    {system.category}
                  </text>
                  <text x={x} y={y + 12} textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground/70 text-[9px] pointer-events-none italic">
                    {system.centerWord}
                  </text>
                </g>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" side="top">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm" style={{
                color: systemColor
              }}>
                    {system.category}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Palavra central: <span className="font-medium">{system.centerWord}</span>
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Palavras desta aura semântica:</p>
                    <div className="flex flex-wrap gap-1">
                      {system.words.map(word => <span key={word.word} className="text-xs px-2 py-0.5 rounded-full" style={{
                    backgroundColor: `${systemColor}20`,
                    color: systemColor
                  }}>
                          {word.word}
                        </span>)}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>;
      })}
      </svg>;
  };

  // NÍVEL 2: Universe - Todas as palavras distribuídas
  const renderUniverseView = () => {
    const centerX = 575;
    const centerY = 400;
    const allWords = orbitalSystems.flatMap(system => system.words.map(word => ({
      ...word,
      system: system.centerWord,
      systemColor: systemColors[system.category]
    })));
    const wordsByOrbit = allWords.reduce((acc, word) => {
      const orbit = getOrbit(word.strength);
      if (!acc[orbit]) acc[orbit] = [];
      acc[orbit].push(word);
      return acc;
    }, {} as Record<number, typeof allWords>);
    const universeOrbitRadii = {
      1: 160,
      2: 235,
      3: 310,
      4: 385
    };
    return <div className="relative">
        {/* Botão flutuante no canto superior esquerdo */}
        <Button onClick={() => setViewMode('galaxy')} className="absolute top-4 left-4 z-10 shadow-lg" variant="default">
          Explorar Galáxia de Constelações →
        </Button>

        <svg width="1150" height="800" viewBox="0 0 1150 800" className="w-full h-auto animate-fade-in">
          {/* Órbitas */}
          {[1, 2, 3, 4].map(orbit => {
          const radius = universeOrbitRadii[orbit as keyof typeof universeOrbitRadii];
          const circumference = 2 * Math.PI * radius;
          return <g key={`universe-orbit-${orbit}`}>
                <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="8 8" opacity={0.2} />
                <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`} opacity={0.3} style={{
              animation: `orbit-slide ${12 + orbit * 2}s linear infinite`,
              transformOrigin: `${centerX}px ${centerY}px`
            }} />
              </g>;
        })}

          {/* Centro */}
          <g>
            <circle cx={centerX} cy={centerY} r={60} fill="hsl(var(--primary))" opacity="0.05" className="animate-pulse" />
            <circle cx={centerX} cy={centerY} r={52} fill="hsl(var(--primary))" opacity="0.1" />
            <circle cx={centerX} cy={centerY} r={45} fill="hsl(var(--primary))" opacity="0.9" style={{
            filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.3))'
          }} />
            <circle cx={centerX} cy={centerY} r={45} fill="none" stroke="hsl(var(--background))" strokeWidth="2" opacity="0.4" />
            <text x={centerX} y={centerY - 4} textAnchor="middle" className="fill-primary-foreground font-bold text-[13px]">
              {songName}
            </text>
            <text x={centerX} y={centerY + 9} textAnchor="middle" className="fill-primary-foreground text-[11px]">
              {artistName}
            </text>
          </g>

          {/* Palavras */}
          {Object.entries(wordsByOrbit).map(([orbit, wordsInOrbit]) => wordsInOrbit.map((word, index) => {
          const radius = universeOrbitRadii[parseInt(orbit) as keyof typeof universeOrbitRadii];
          const angle = index / wordsInOrbit.length * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const stats = palavraStats[word.word];
          return <g key={`universe-word-${word.system}-${word.word}-${index}`} style={{
            cursor: 'pointer'
          }} onClick={e => {
            e.stopPropagation();
            if (!isDragging) {
              setSelectedWordForKwic(word.word);
              setKwicModalOpen(true);
            }
          }}>
                  <line x1={centerX} y1={centerY} x2={x} y2={y} stroke={word.systemColor} strokeWidth="1" opacity="0.15" />
                  <circle cx={x} cy={y} r={26} fill={word.systemColor} opacity="0.05" className="animate-pulse" />
                  <circle cx={x} cy={y} r={22} fill={word.systemColor} opacity="0.1" />
                  <circle cx={x} cy={y} r={18} fill={word.systemColor} opacity="0.15" />
                  <circle cx={x} cy={y} r={14} fill={word.systemColor} opacity="0.85" stroke="hsl(var(--background))" strokeWidth="2" style={{
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
              transition: 'all 0.2s ease'
            }} className="hover:opacity-100" />
                  <circle cx={x} cy={y} r={30} fill="transparent">
                    {stats && <title>
                        {`${word.word}\nForça: ${word.strength}%\nFreq. Bruta: ${stats.frequenciaBruta}\nFreq. Normalizada: ${stats.frequenciaNormalizada}\nProsódia: ${stats.prosodia === 'positiva' ? 'Positiva ✓' : stats.prosodia === 'negativa' ? 'Negativa ✗' : 'Neutra −'}\nSistema: ${word.system}\n\nClique para ver concordância (KWIC)`}
                      </title>}
                  </circle>
                  <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground font-bold text-[10px] pointer-events-none">
                    {word.word}
                  </text>
                </g>;
        }))}
        </svg>
      </div>;
  };

  // NÍVEL 3: Galaxy - Grade de todas as constelações
  const renderGalaxyView = () => {
    const renderMiniConstellation = (system: OrbitalSystem, centerX: number, centerY: number, scale: number = 1, index: number) => {
      const orbitRadii = {
        1: 25 * scale,
        2: 40 * scale,
        3: 55 * scale,
        4: 70 * scale
      };

      const wordsByOrbit = system.words.reduce((acc, word) => {
        const orbit = getOrbit(word.strength);
        if (!acc[orbit]) acc[orbit] = [];
        acc[orbit].push(word);
        return acc;
      }, {} as Record<number, WordData[]>);

      return (
        <g 
          className="cursor-pointer transition-all duration-200 hover:opacity-80"
          onClick={() => {
            setSelectedSystem(system.centerWord);
            setViewMode('constellation');
          }}
        >
          {/* Órbitas */}
          {[1, 2, 3, 4].map(orbit => {
            const radius = orbitRadii[orbit as keyof typeof orbitRadii];
            return (
              <circle 
                key={`orbit-${orbit}`} 
                cx={centerX} 
                cy={centerY} 
                r={radius} 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="1" 
                opacity="0.15" 
              />
            );
          })}

          {/* Centro */}
          <circle cx={centerX} cy={centerY} r={20 * scale} fill={systemColors[system.category]} opacity="0.1" className="animate-pulse" />
          <circle cx={centerX} cy={centerY} r={16 * scale} fill={systemColors[system.category]} opacity="0.2" />
          <circle cx={centerX} cy={centerY} r={13 * scale} fill={systemColors[system.category]} opacity="0.85" style={{
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))'
          }} />
          <circle cx={centerX} cy={centerY} r={13 * scale} fill="none" stroke="hsl(var(--background))" strokeWidth="1.5" opacity="0.5" />
          
          {/* Nome da categoria */}
          <text 
            x={centerX} 
            y={centerY - 4} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="fill-primary-foreground font-bold text-[9px]"
          >
            {system.category}
          </text>
          <text 
            x={centerX} 
            y={centerY + 6} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="fill-primary-foreground/70 text-[7px] italic"
          >
            {system.centerWord}
          </text>

          {/* Palavras */}
          {/* Palavras orbitando com animação */}
          {Object.entries(wordsByOrbit).map(([orbit, wordsInOrbit]) =>
            wordsInOrbit.map((word, idx) => {
              const radius = orbitRadii[parseInt(orbit) as keyof typeof orbitRadii];
              
              // Duração da animação varia por palavra (15s a 30s)
              const duration = 15 + (idx * 3);
              
              return (
                <g key={`word-${word.word}-${idx}`}>
                  {/* Planeta com animação orbital */}
                  <g
                    style={{ 
                      cursor: 'pointer',
                      animation: `orbit-slide ${duration}s linear infinite`,
                      transformOrigin: `${centerX}px ${centerY}px`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSystem(system.centerWord);
                      setViewMode('constellation');
                    }}
                  >
                    <g transform={`translate(${radius}, 0)`}>
                      {/* Glow effect */}
                      <circle cx={0} cy={0} r={5 * scale} fill={word.color} opacity="0.08" className="animate-pulse" />
                      <circle cx={0} cy={0} r={4 * scale} fill={word.color} opacity="0.15" />
                      {/* Planeta principal */}
                      <circle cx={0} cy={0} r={3.5 * scale} fill={word.color} opacity="0.85" style={{
                        filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))'
                      }} />
                      {/* Label da palavra-chave */}
                      <text
                        x={0}
                        y={-6 * scale}
                        textAnchor="middle"
                        className="fill-foreground font-bold pointer-events-none"
                        style={{
                          fontSize: `${7 * scale}px`,
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                        }}
                      >
                        {word.word}
                      </text>
                    </g>
                  </g>
                </g>
              );
            })
          )}
        </g>
      );
    };

    return (
      <div className="relative">
        <div className="px-4 pt-4">
          <svg width="1150" height="680" viewBox="0 0 1150 680" className="w-full h-auto animate-fade-in">
            {orbitalSystems.map((system, index) => {
              const col = index % 3;
              const row = Math.floor(index / 3);
              const x = 200 + col * 320;
              const y = 180 + row * 280;
              return renderMiniConstellation(system, x, y, 1.5, index);
            })}
          </svg>
        </div>
      </div>
    );
  };

  // NÍVEL 4: Constellation - Sistema individual ampliado
  const renderConstellationView = () => {
    const centerX = 575;
    const centerY = 400;
    const scale = 2.2;
    const orbitRadii = {
      1: 45 * scale,
      2: 70 * scale,
      3: 95 * scale,
      4: 120 * scale
    };

    // Sistema atualmente selecionado para visualização
    const currentSystemIndex = orbitalSystems.findIndex(s => s.centerWord === selectedSystem);
    const system = currentSystemIndex >= 0 ? orbitalSystems[currentSystemIndex] : orbitalSystems[0];
    
    // Se não houver sistema selecionado, seleciona o primeiro
    if (!selectedSystem) {
      setSelectedSystem(orbitalSystems[0].centerWord);
    }

    const wordsByOrbit = system.words.reduce((acc, word) => {
      const orbit = getOrbit(word.strength);
      if (!acc[orbit]) acc[orbit] = [];
      acc[orbit].push(word);
      return acc;
    }, {} as Record<number, WordData[]>);

    const getWordPosition = (word: WordData, index: number, totalInOrbit: number) => {
      const orbit = getOrbit(word.strength);
      const radius = orbitRadii[orbit as keyof typeof orbitRadii];
      const wordKey = `${system.centerWord}-${word.word}`;
      
      let angle: number;
      if (orbitProgress[wordKey] !== undefined) {
        angle = (orbitProgress[wordKey] / 100) * 2 * Math.PI - Math.PI / 2;
      } else if (customAngles[wordKey] !== undefined) {
        angle = customAngles[wordKey];
      } else {
        angle = (index / totalInOrbit) * 2 * Math.PI - Math.PI / 2;
      }
      
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        radius,
        angle
      };
    };

    return (
      <div className="relative px-4 pt-4">
        <svg 
          ref={svgRef} 
          width="1150" 
          height="800" 
          viewBox="0 0 1150 800" 
          className="w-full h-auto animate-scale-in"
          style={{ userSelect: isPanning ? 'none' : 'auto' }}
        >
          {/* Órbitas */}
          {[1, 2, 3, 4].map(orbit => {
            const radius = orbitRadii[orbit as keyof typeof orbitRadii];
            const circumference = 2 * Math.PI * radius;
            return (
              <g key={`orbit-${orbit}`}>
                <circle 
                  cx={centerX} 
                  cy={centerY} 
                  r={radius} 
                  fill="none" 
                  stroke="hsl(var(--border))" 
                  strokeWidth="2" 
                  opacity={0.15} 
                />
                <circle 
                  cx={centerX} 
                  cy={centerY} 
                  r={radius} 
                  fill="none" 
                  stroke={systemColors[system.category]} 
                  strokeWidth="2" 
                  strokeDasharray={`${circumference * 0.1} ${circumference * 0.9}`} 
                  opacity={0.4}
                  style={{
                    animation: 'orbit-slide 8s linear infinite',
                    transformOrigin: `${centerX}px ${centerY}px`
                  }}
                />
              </g>
            );
          })}

          {/* Linhas conectando ao centro */}
          {Object.entries(wordsByOrbit).map(([orbit, wordsInOrbit]) =>
            wordsInOrbit.map((word, index) => {
              const pos = getWordPosition(word, index, wordsInOrbit.length);
              return (
                <line
                  key={`line-${system.centerWord}-${word.word}`}
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={word.color}
                  strokeWidth="1.5"
                  opacity="0.15"
                />
              );
            })
          )}

          {/* Centro */}
          <g>
            <circle cx={centerX} cy={centerY} r={32 * scale} fill={systemColors[system.category]} opacity="0.1" className="animate-pulse" />
            <circle cx={centerX} cy={centerY} r={26 * scale} fill={systemColors[system.category]} opacity="0.2" />
            <circle cx={centerX} cy={centerY} r={20 * scale} fill={systemColors[system.category]} opacity="0.85" style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))'
            }} />
            <circle cx={centerX} cy={centerY} r={20 * scale} fill="none" stroke="hsl(var(--background))" strokeWidth={1.5 * scale} opacity="0.5" />
            <text 
              x={centerX} 
              y={centerY} 
              textAnchor="middle" 
              dominantBaseline="middle" 
              className="fill-primary-foreground font-bold"
              style={{
                fontSize: `${16 * scale}px`,
                pointerEvents: 'none'
              }}
            >
              {system.centerWord}
            </text>
          </g>

          {/* Palavras */}
          {Object.entries(wordsByOrbit).map(([orbit, wordsInOrbit]) =>
            wordsInOrbit.map((word, index) => {
              const pos = getWordPosition(word, index, wordsInOrbit.length);
              const wordKey = `${system.centerWord}-${word.word}`;
              const isBeingDragged = draggedWord === wordKey;
              const stats = palavraStats[word.word];

              return (
                <g
                  key={`word-${wordKey}`}
                  data-word-key={wordKey}
                  data-center-x={centerX}
                  data-center-y={centerY}
                  style={{ cursor: isBeingDragged ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleMouseDown(e, wordKey, centerX, centerY)}
                >
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={10 * scale} 
                    fill={word.color} 
                    opacity="0.08" 
                    className="animate-pulse"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={7 * scale} 
                    fill={word.color} 
                    opacity="0.15"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={5 * scale} 
                    fill={word.color} 
                    opacity="0.85"
                    style={{
                      pointerEvents: 'none',
                      filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))'
                    }}
                  />
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={5 * scale} 
                    fill="none" 
                    stroke="hsl(var(--background))" 
                    strokeWidth={0.5 * scale} 
                    opacity="0.5"
                    style={{ pointerEvents: 'none' }}
                  />
                  
                  {/* Área clicável com tooltip nativo (apenas dados estatísticos) */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={15 * scale} 
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredWord(word.word)}
                    onMouseLeave={() => setHoveredWord(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDragging) {
                        setSelectedWordForKwic(word.word);
                        setKwicModalOpen(true);
                      }
                    }}
                  >
                    {stats && (
                      <title>
                        {`${word.word}\nForça: ${word.strength}%\nFreq. Bruta: ${stats.frequenciaBruta}\nFreq. Normalizada: ${stats.frequenciaNormalizada}\nProsódia: ${stats.prosodia === 'positiva' ? 'Positiva ✓' : stats.prosodia === 'negativa' ? 'Negativa ✗' : 'Neutra −'}\n\nClique para ver concordância (KWIC)`}
                      </title>
                    )}
                  </circle>
                  
                  <text 
                    x={pos.x} 
                    y={pos.y - 2 * scale} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-foreground font-bold"
                    style={{
                      fontSize: `${8 * scale}px`,
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {word.word}
                  </text>
                  <text 
                    x={pos.x} 
                    y={pos.y + 7 * scale} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-muted-foreground font-semibold"
                    style={{
                      fontSize: `${6.5 * scale}px`,
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {word.strength}%
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
    );
  };

  return <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Cabeçalho fixo - visível em todos os níveis */}
      <div className="fixed top-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-sm border-b border-border shadow-md">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button onClick={() => setViewMode('overview')} className="px-4 py-2 text-sm rounded-lg transition-colors font-medium bg-muted hover:bg-muted/80">
              ← Visão Geral
            </button>
            <button onClick={() => setViewMode('universe')} className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${viewMode === 'universe' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80'}`}>
              Universo Semântico
            </button>
            <button onClick={() => setViewMode('galaxy')} className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${viewMode === 'galaxy' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80'}`}>
              Galáxia de Constelações
            </button>
            {selectedSystem && (
              <button onClick={() => setViewMode('constellation')} className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${viewMode === 'constellation' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80'}`}>
                Constelação: {selectedSystem}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Zoom fixa - logo abaixo do cabeçalho */}
      <div className="fixed top-[60px] left-4 right-4 z-[999] flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <ZoomControlBar
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToScreen={handleFitToScreen}
            onResetZoom={handleResetZoom}
          />
        </div>
      </div>

      <div 
        ref={containerRef} 
        className={`w-full bg-gradient-to-br from-background to-muted/20 overflow-hidden transition-all duration-500 ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`} 
        style={{
          marginTop: '120px', // Espaço para cabeçalho + barra de zoom
          height: isFullscreen ? 'calc(100vh - 120px)' : 'calc(100vh - 120px)',
          userSelect: isPanning ? 'none' : 'auto'
        }} 
        onWheel={handleWheel} 
        onMouseDown={handleCanvasMouseDown} 
        onMouseMove={handleCanvasPanMove} 
        onMouseUp={handleCanvasPanEnd} 
        onMouseLeave={handleCanvasPanEnd}
      >

        <div className="pan-area" style={{
        pointerEvents: 'none'
      }}>
          <div className={`transition-all duration-300 ${viewMode === 'overview' ? 'opacity-100' : 'opacity-0 hidden'}`} style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'top left',
          pointerEvents: 'auto'
        }}>
            {viewMode === 'overview' && renderSystemsOverview()}
          </div>

          <div className={`transition-all duration-300 ${viewMode === 'universe' ? 'opacity-100' : 'opacity-0 hidden'}`} style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'top left',
          pointerEvents: 'auto'
        }}>
            {viewMode === 'universe' && renderUniverseView()}
          </div>

          <div className={`transition-all duration-300 ${viewMode === 'galaxy' ? 'opacity-100' : 'opacity-0 hidden'}`} style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'top left',
            pointerEvents: 'auto'
          }}>
            {viewMode === 'galaxy' && renderGalaxyView()}
          </div>

          {viewMode === 'constellation' && (
            <div style={{ pointerEvents: 'auto' }}>
              {renderConstellationView()}
            </div>
          )}
        </div>
      </div>

      <KWICModal open={kwicModalOpen} onOpenChange={setKwicModalOpen} word={selectedWordForKwic} data={getMockKWICData(selectedWordForKwic)} />
    </div>;
};