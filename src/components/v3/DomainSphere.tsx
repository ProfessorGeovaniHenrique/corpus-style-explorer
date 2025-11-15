import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text } from '@react-three/drei';
import { VisualDomainNode } from '@/data/types/threeVisualization.types';
import { HIERARCHY_CONFIG } from '@/config/hierarchyConfig';
import { COSMIC_STYLE } from '@/config/visualStyle';
import { shouldPulseDomain } from '@/lib/visualNormalization';
import * as THREE from 'three';

interface DomainSphereProps {
  node: VisualDomainNode;
  isHovered: boolean;
  isSelected: boolean;
  opacity: number;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
}

export function DomainSphere({
  node,
  isHovered,
  isSelected,
  opacity,
  onPointerOver,
  onPointerOut,
  onClick,
}: DomainSphereProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  
  // Animação de pulso para domínios super-representados
  const shouldPulse = shouldPulseDomain(
    node.rawData.textualWeight,
    HIERARCHY_CONFIG.domainPulse.threshold
  );
  
  useFrame((state) => {
    if (shouldPulse && sphereRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * node.pulseSpeed) * 
                    HIERARCHY_CONFIG.domainPulse.amplitude;
      sphereRef.current.scale.setScalar(pulse);
    }
  });
  
  const emissiveIntensity = isHovered 
    ? COSMIC_STYLE.hover.emissiveIntensity 
    : node.glowIntensity;
  
  return (
    <group position={node.position}>
      {/* Esfera do domínio */}
      <Sphere
        ref={sphereRef}
        args={[node.scale, 64, 64]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={node.color}
          transparent
          opacity={opacity}
          emissive={node.color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Halo externo (efeito de glow) */}
      {isHovered && (
        <Sphere args={[node.scale * 1.3, 32, 32]}>
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={0.15}
          />
        </Sphere>
      )}
      
      {/* Texto do domínio */}
      <Text
        ref={textRef}
        position={[0, node.scale + 0.5, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.label}
      </Text>
    </group>
  );
}
