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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (node && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      });
      setDragging(nodeId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - offset.x;
      const newY = e.clientY - rect.top - offset.y;

      setNodes(prev =>
        prev.map(node =>
          node.id === dragging
            ? { ...node, x: Math.max(30, Math.min(rect.width - 30, newX)), y: Math.max(30, Math.min(rect.height - 30, newY)) }
            : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
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
          const size = isCenter ? "large" : node.distance < 0.25 ? "medium" : "small";
          
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
                if (!dragging) onWordClick(node.label);
              }}
            >
              <Badge
                className={`
                  ${isCenter ? 'text-lg px-6 py-3 font-bold border-2' : size === 'medium' ? 'text-base px-4 py-2 font-semibold' : 'text-sm px-3 py-1.5'}
                  shadow-lg cursor-pointer
                `}
                style={{
                  backgroundColor: prosodyColors[node.prosody],
                  color: 'white',
                  borderColor: isCenter ? 'white' : 'transparent',
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
