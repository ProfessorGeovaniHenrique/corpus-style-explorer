import { useRef } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { VisualWordNode } from '@/data/types/threeVisualization.types';
import { COSMIC_STYLE } from '@/config/visualStyle';

interface WordTextProps {
  node: VisualWordNode;
  isHovered: boolean;
  opacity: number;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
}

export function WordText({
  node,
  isHovered,
  opacity,
  onPointerOver,
  onPointerOut,
  onClick,
}: WordTextProps) {
  const textRef = useRef<any>(null);
  
  const emissiveIntensity = isHovered 
    ? COSMIC_STYLE.hover.emissiveIntensity 
    : node.glowIntensity;
  
  return (
    <Billboard position={node.position}>
      <Text
        ref={textRef}
        fontSize={node.scale}
        color={node.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        {node.label}
        <meshStandardMaterial
          color={node.color}
          transparent
          opacity={opacity}
          emissive={node.color}
          emissiveIntensity={emissiveIntensity}
        />
      </Text>
    </Billboard>
  );
}
