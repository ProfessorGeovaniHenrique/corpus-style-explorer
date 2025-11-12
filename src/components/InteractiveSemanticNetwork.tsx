import { useState, useRef, useEffect } from "react";
import { Badge } from "./ui/badge";

interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  distance: number; // força de associação (0-1, menor = mais forte)
  prosody: "positive" | "neutral" | "melancholic" | "contemplative";
}

interface InteractiveSemanticNetworkProps {
  onWordClick: (word: string) => void;
}

const prosodyColors = {
  positive: "hsl(142, 71%, 45%)",
  neutral: "hsl(221, 83%, 53%)",
  melancholic: "hsl(45, 93%, 47%)",
  contemplative: "hsl(291, 64%, 42%)",
};

export function InteractiveSemanticNetwork({ onWordClick }: InteractiveSemanticNetworkProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: "verso", label: "verso", x: 300, y: 200, distance: 0, prosody: "contemplative" },
    { id: "tarumã", label: "tarumã", x: 180, y: 150, distance: 0.15, prosody: "neutral" },
    { id: "saudade", label: "saudade", x: 420, y: 160, distance: 0.18, prosody: "melancholic" },
    { id: "galpão", label: "galpão", x: 240, y: 280, distance: 0.25, prosody: "neutral" },
    { id: "várzea", label: "várzea", x: 360, y: 290, distance: 0.30, prosody: "positive" },
    { id: "sonhos", label: "sonhos", x: 150, y: 240, distance: 0.35, prosody: "contemplative" },
    { id: "gateada", label: "gateada", x: 450, y: 270, distance: 0.40, prosody: "neutral" },
  ]);

  const [dragging, setDragging] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setDragging(nodeId);
    setHasDragged(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && containerRef.current) {
      setHasDragged(true);
      const rect = containerRef.current.getBoundingClientRect();
      const centerNode = nodes.find(n => n.distance === 0);
      const draggedNode = nodes.find(n => n.id === dragging);
      
      if (!centerNode || !draggedNode || draggedNode.distance === 0) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calcula ângulo do mouse em relação ao centro
      const angle = Math.atan2(mouseY - centerNode.y, mouseX - centerNode.x);
      
      // Mantém a distância fixa baseada na força de associação
      const radius = draggedNode.distance * 200; // distância em pixels
      
      // Nova posição orbital mantendo a distância
      const newX = centerNode.x + Math.cos(angle) * radius;
      const newY = centerNode.y + Math.sin(angle) * radius;

      setNodes(prev =>
        prev.map(node =>
          node.id === dragging
            ? { ...node, x: newX, y: newY }
            : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleClick = (nodeId: string, label: string) => {
    if (!hasDragged) {
      onWordClick(label);
    }
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [dragging]);

  const centerNode = nodes.find(n => n.distance === 0);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative bg-muted/20 rounded-lg"
        style={{ width: "100%", height: "500px" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Linhas conectando ao nó central */}
          {centerNode && nodes.filter(n => n.id !== centerNode.id).map(node => (
            <line
              key={`line-${node.id}`}
              x1={centerNode.x}
              y1={centerNode.y}
              x2={node.x}
              y2={node.y}
              stroke={prosodyColors[node.prosody]}
              strokeWidth={Math.max(1, 4 - node.distance * 8)}
              opacity={0.3}
            />
          ))}
        </svg>

        {/* Nós da rede */}
        {nodes.map(node => {
          const isCenter = node.distance === 0;
          
          return (
            <div
              key={node.id}
              className={`absolute cursor-move select-none transition-transform ${dragging === node.id ? 'scale-110' : 'hover:scale-110'}`}
              style={{
                left: node.x,
                top: node.y,
                transform: "translate(-50%, -50%)",
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(node.id, node.label);
              }}
            >
              <Badge
                className={`
                  ${isCenter ? 'text-xl px-6 py-3 font-bold' : 'text-sm px-3 py-1.5 font-medium'}
                  shadow-lg cursor-pointer border-0
                `}
                style={{
                  backgroundColor: isCenter ? 'hsl(0, 0%, 20%)' : prosodyColors[node.prosody],
                  color: isCenter ? 'hsl(0, 0%, 85%)' : 'white',
                }}
              >
                {node.label}
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        💡 Arraste as palavras para reorganizar. A distância reflete a força de associação.
      </div>
    </div>
  );
}
