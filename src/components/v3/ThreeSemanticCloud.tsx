import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useState, useRef, useEffect } from 'react';
import { DomainSphere } from './DomainSphere';
import { WordText } from './WordText';
import { ConnectionLines } from './ConnectionLines';
import { VisualNode, DomainConnection } from '@/data/types/threeVisualization.types';
import * as THREE from 'three';
import { animateHoverCascade } from '@/lib/gsapAnimations';
import { COSMIC_STYLE } from '@/config/visualStyle';

interface ThreeSemanticCloudProps {
  nodes: VisualNode[];
  connections: DomainConnection[];
  font: string;
  autoRotate: boolean;
  bloomEnabled: boolean;
  showConnections: boolean;
  onWordClick: (node: VisualNode) => void;
  onWordHover: (node: VisualNode | null) => void;
  onDomainClick?: (node: VisualNode) => void;
  cameraRef?: React.MutableRefObject<any>;
  filteredNodeIds?: Set<string>;
}

function Scene({ 
  nodes, 
  connections,
  font, 
  autoRotate,
  showConnections,
  onWordClick, 
  onWordHover,
  onDomainClick,
  filteredNodeIds
}: Omit<ThreeSemanticCloudProps, 'bloomEnabled' | 'cameraRef'>) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [cascadeNodes, setCascadeNodes] = useState<Set<string>>(new Set());
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<Map<string, THREE.Group>>(new Map());
  
  // Rotação automática suave
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });
  
  const handlePointerOver = (node: VisualNode) => (e: any) => {
    e.stopPropagation();
    setHoveredNodeId(node.id);
    onWordHover(node);
    document.body.style.cursor = 'pointer';
    
    // Hover cascade effect usando GSAP
    animateHoverCascade(node.id, nodesRef.current, nodes, 'enter');
  };
  
  const handlePointerOut = () => {
    setHoveredNodeId(null);
    onWordHover(null);
    document.body.style.cursor = 'auto';
    
    // Reset hover cascade
    animateHoverCascade('', nodesRef.current, nodes, 'leave');
  };
  
  const handleClick = (node: VisualNode) => (e: any) => {
    e.stopPropagation();
    
    if (node.type === 'domain' && onDomainClick) {
      onDomainClick(node);
    } else if (node.type === 'word') {
      onWordClick(node);
    }
  };
  
  // Hover cascade agora é gerenciado por animateHoverCascade
  
  return (
    <>
      <group ref={groupRef}>
        {nodes.map(node => {
          const isFiltered = filteredNodeIds && !filteredNodeIds.has(node.id);
          const opacity = isFiltered ? 0.05 : node.baseOpacity;
          const isHovered = hoveredNodeId === node.id;
          
          return (
            <group 
              key={node.id} 
              ref={(ref) => {
                if (ref) nodesRef.current.set(node.id, ref);
              }}
            >
              {node.type === 'domain' ? (
                <DomainSphere
                  node={node}
                  isHovered={isHovered}
                  isSelected={false}
                  opacity={opacity}
                  onPointerOver={handlePointerOver(node)}
                  onPointerOut={handlePointerOut}
                  onClick={handleClick(node)}
                />
              ) : (
                <WordText
                  node={node}
                  isHovered={isHovered}
                  opacity={opacity}
                  onPointerOver={handlePointerOver(node)}
                  onPointerOut={handlePointerOut}
                  onClick={handleClick(node)}
                />
              )}
            </group>
          );
        })}
      </group>
      
      <ConnectionLines 
        connections={connections}
        nodes={nodes}
        visible={showConnections}
      />
    </>
  );
}

export function ThreeSemanticCloud({ 
  nodes,
  connections,
  font, 
  autoRotate, 
  bloomEnabled,
  showConnections,
  onWordClick, 
  onWordHover,
  onDomainClick,
  cameraRef,
  filteredNodeIds
}: ThreeSemanticCloudProps) {
  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas>
        {/* Câmera com posição inicial */}
        <PerspectiveCamera 
          makeDefault 
          position={[0, 15, 30]} 
          ref={cameraRef}
        />
        
        {/* Controles orbitais */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={10}
          maxDistance={80}
          autoRotate={false}
        />
        
        {/* Iluminação */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        
        {/* Background de estrelas e ambiente */}
        <Stars
          radius={COSMIC_STYLE.environment.backgroundStars.radius}
          depth={50}
          count={COSMIC_STYLE.environment.backgroundStars.count}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        <Environment preset={COSMIC_STYLE.environment.preset} />
        
        {/* Renderizar nós */}
        <Suspense fallback={null}>
          <Scene
            nodes={nodes}
            connections={connections}
            font={font}
            autoRotate={autoRotate}
            showConnections={showConnections}
            onWordClick={onWordClick}
            onWordHover={onWordHover}
            onDomainClick={onDomainClick}
            filteredNodeIds={filteredNodeIds}
          />
        </Suspense>
        
        {/* Post-processing: Bloom (glow effect) */}
        {bloomEnabled && (
          <EffectComposer>
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              height={300}
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
