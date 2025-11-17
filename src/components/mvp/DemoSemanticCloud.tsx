import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export interface CloudNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  fontSize: number;
  color: string;
  type: 'domain' | 'keyword';
  frequency: number;
  domain: string;
  tooltip?: {
    nome?: string;
    palavra?: string;
    dominio?: string;
    ocorrencias?: number;
    frequencia?: number;
    ll?: number;
    mi?: number;
    percentual?: number;
    riquezaLexical?: number;
    avgLL?: number;
    significancia?: string;
    prosody?: number;
  };
}

interface DemoSemanticCloudProps {
  nodes: CloudNode[];
  onWordClick?: (node: CloudNode) => void;
  onDomainClick?: (domain: string) => void;
}

/**
 * Posicionamento em espiral (Golden Angle)
 */
function getSpiralPosition(
  index: number,
  spacing: number,
  centerX: number,
  centerY: number
): { x: number; y: number } {
  const goldenAngle = 137.5 * (Math.PI / 180);
  const angle = index * goldenAngle;
  const radius = spacing * Math.sqrt(index + 1);
  
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

/**
 * Posicionamento radial (ao redor de um ponto central)
 */
function getRadialPosition(
  index: number,
  total: number,
  minRadius: number,
  maxRadius: number,
  centerX: number,
  centerY: number,
  randomness: number = 0.3
): { x: number; y: number } {
  const angleStep = (2 * Math.PI) / total;
  const angle = index * angleStep + (Math.random() - 0.5) * randomness;
  const radiusVariation = minRadius + (maxRadius - minRadius) * (index / total);
  const radius = radiusVariation + (Math.random() - 0.5) * 50;
  
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

/**
 * Verifica colisão entre dois nós
 */
function hasCollision(
  x: number,
  y: number,
  size: number,
  existingNodes: CloudNode[],
  minDistance: number
): boolean {
  return existingNodes.some(node => {
    const dx = node.x - x;
    const dy = node.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const requiredDistance = (node.fontSize + size) / 2 + minDistance;
    return distance < requiredDistance;
  });
}

/**
 * Encontra posição disponível sem colisão
 */
function findAvailablePosition(
  existingNodes: CloudNode[],
  fontSize: number,
  centerX: number,
  centerY: number,
  minRadius: number,
  maxRadius: number,
  maxAttempts: number = 50
): { x: number; y: number } {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const angle = (attempt * 17 + Math.random() * 360) * (Math.PI / 180);
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    if (!hasCollision(x, y, fontSize, existingNodes, 8)) {
      return { x, y };
    }
  }
  
  // Se não encontrar, retornar posição aleatória
  const angle = Math.random() * 2 * Math.PI;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

export function DemoSemanticCloud({ 
  nodes, 
  onWordClick, 
  onDomainClick 
}: DemoSemanticCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<CloudNode | null>(null);
  const [density, setDensity] = useState([1.0]);
  const [regenerateKey, setRegenerateKey] = useState(0);
  
  // Processar e posicionar nós
  const positionedNodes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return [];
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const positioned: CloudNode[] = [];
    const densityFactor = density[0];
    
    // Separar domínios e palavras
    const domains = nodes.filter(n => n.type === 'domain');
    const keywords = nodes.filter(n => n.type === 'keyword');
    
    // FASE 1: Posicionar domínios no centro (raio 0-200px)
    domains.forEach((domain, index) => {
      const pos = getSpiralPosition(
        index,
        40 * densityFactor, // Espaçamento entre domínios
        centerX,
        centerY
      );
      
      // Limitar ao raio central
      const dx = pos.x - centerX;
      const dy = pos.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = 200;
      
      if (distance > maxRadius) {
        const scale = maxRadius / distance;
        pos.x = centerX + dx * scale;
        pos.y = centerY + dy * scale;
      }
      
      positioned.push({
        ...domain,
        x: pos.x,
        y: pos.y,
        z: 80 // Primeiro plano
      });
    });
    
    // FASE 2: Posicionar palavras-chave no entorno (raio 250-600px)
    keywords.forEach((keyword, index) => {
      const pos = findAvailablePosition(
        positioned,
        keyword.fontSize,
        centerX,
        centerY,
        250 * densityFactor,
        600 * densityFactor
      );
      
      positioned.push({
        ...keyword,
        x: pos.x,
        y: pos.y,
        z: 20 + Math.random() * 30 // Background variado
      });
    });
    
    return positioned;
  }, [nodes, density, regenerateKey]);
  
  const sortedNodes = positionedNodes().sort((a, b) => a.z - b.z);
  
  // Renderizar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas (fundo branco limpo)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Renderizar nós
    sortedNodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const opacity = 0.7 + (node.z / 100) * 0.3; // 0.7-1.0
      
      // Configurar fonte
      const weight = node.type === 'domain' ? 700 : 500;
      ctx.font = `${weight} ${node.fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Aplicar hover effect
      if (isHovered) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.scale(1.1, 1.1);
        ctx.translate(-node.x, -node.y);
      }
      
      // Desenhar texto
      ctx.fillStyle = node.color;
      ctx.globalAlpha = opacity;
      ctx.fillText(node.label, node.x, node.y);
      
      // Desenhar borda inferior no hover
      if (isHovered) {
        const metrics = ctx.measureText(node.label);
        const textWidth = metrics.width;
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.moveTo(node.x - textWidth / 2, node.y + node.fontSize / 2 + 4);
        ctx.lineTo(node.x + textWidth / 2, node.y + node.fontSize / 2 + 4);
        ctx.stroke();
      }
      
      if (isHovered) {
        ctx.restore();
      }
      
      ctx.globalAlpha = 1.0;
    });
  }, [sortedNodes, hoveredNode]);
  
  // Detectar nó sob o cursor
  const getNodeAtPosition = (x: number, y: number): CloudNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Verificar de trás para frente (nós com maior z primeiro)
    for (let i = sortedNodes.length - 1; i >= 0; i--) {
      const node = sortedNodes[i];
      const weight = node.type === 'domain' ? 700 : 500;
      ctx.font = `${weight} ${node.fontSize}px Inter, sans-serif`;
      const metrics = ctx.measureText(node.label);
      const textWidth = metrics.width;
      const textHeight = node.fontSize;
      
      const halfWidth = textWidth / 2;
      const halfHeight = textHeight / 2;
      
      if (
        x >= node.x - halfWidth &&
        x <= node.x + halfWidth &&
        y >= node.y - halfHeight &&
        y <= node.y + halfHeight
      ) {
        return node;
      }
    }
    
    return null;
  };
  
  // Event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = getNodeAtPosition(x, y);
    setHoveredNode(node);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = getNodeAtPosition(x, y);
    if (node) {
      if (node.type === 'keyword' && onWordClick) {
        onWordClick(node);
      } else if (node.type === 'domain' && onDomainClick) {
        onDomainClick(node.domain);
      }
    }
  };
  
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'nuvem-semantica.png';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Imagem exportada com sucesso');
    });
  };
  
  const handleRegenerate = () => {
    setRegenerateKey(prev => prev + 1);
    toast.success('Nuvem reorganizada');
  };
  
  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-4">
        <Button 
          variant="outline" 
          onClick={handleExportPNG}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar PNG
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleRegenerate}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reorganizar
        </Button>
        
        <div className="flex items-center gap-3 ml-auto">
          <Label className="text-sm font-medium">Densidade:</Label>
          <Slider 
            value={density} 
            onValueChange={setDensity} 
            min={0.5} 
            max={2} 
            step={0.1}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground min-w-[3ch]">
            {density[0].toFixed(1)}x
          </span>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="relative border rounded-lg shadow-sm overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={1400}
          height={700}
          className="w-full cursor-pointer"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredNode(null)}
        />
        
        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold text-lg" style={{ color: hoveredNode.color }}>
                {hoveredNode.label}
              </div>
              
              {hoveredNode.type === 'domain' && hoveredNode.tooltip && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {hoveredNode.tooltip.nome}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Ocorrências</div>
                      <div className="font-medium">{hoveredNode.tooltip.ocorrencias}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Percentual</div>
                      <div className="font-medium">{hoveredNode.tooltip.percentual?.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Riqueza Lexical</div>
                      <div className="font-medium">{hoveredNode.tooltip.riquezaLexical?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">LL Médio</div>
                      <div className="font-medium">{hoveredNode.tooltip.avgLL?.toFixed(1)}</div>
                    </div>
                  </div>
                </>
              )}
              
              {hoveredNode.type === 'keyword' && hoveredNode.tooltip && (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Domínio: </span>
                    <span className="font-medium">{hoveredNode.tooltip.dominio}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Frequência</div>
                      <div className="font-medium">{hoveredNode.tooltip.frequencia}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">LL Score</div>
                      <div className="font-medium">{hoveredNode.tooltip.ll?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">MI Score</div>
                      <div className="font-medium">{hoveredNode.tooltip.mi?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Significância</div>
                      <div className="font-medium">{hoveredNode.tooltip.significancia}</div>
                    </div>
                  </div>
                  {hoveredNode.tooltip.prosody !== undefined && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Prosódia: </span>
                      <span className="font-medium">
                        {hoveredNode.tooltip.prosody > 0 ? 'Positiva' : 
                         hoveredNode.tooltip.prosody < 0 ? 'Negativa' : 'Neutra'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
