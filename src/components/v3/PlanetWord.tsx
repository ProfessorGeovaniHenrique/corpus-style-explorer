import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { SemanticWord } from '@/data/types/fogPlanetVisualization.types';
import { VisualWordNode } from '@/data/types/threeVisualization.types';
import { useInteractivityStore, selectHover, selectSelectedDomainId } from '@/store/interactivityStore';
import { getOrCreatePlanetTexture } from '@/lib/planetTextureGenerator';
import * as THREE from 'three';

interface PlanetWordProps {
  word: SemanticWord;
  domainColor: string;
  domainPosition: [number, number, number];
  opacity: number;
  isInSelectedDomain: boolean;
  preloadedTexture?: THREE.Texture; // Textura pré-carregada (otimização)
}

export function PlanetWord({ 
  word, 
  domainColor, 
  domainPosition, 
  opacity,
  isInSelectedDomain,
  preloadedTexture 
}: PlanetWordProps) {
  // Refs
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const orbitalAngleRef = useRef(word.orbitalAngle);
  
  // Three.js
  const { gl } = useThree();
  
  // Store
  const hover = useInteractivityStore(selectHover);
  const selectedDomainId = useInteractivityStore(selectSelectedDomainId);
  
  // States
  const isHovered = hover.hoveredNodeId === word.palavra;
  
  // ✅ FASE 2: Refatoração com useState + useEffect
  // Carregar textura bruta do planeta
  const rawTexture = useTexture(word.planetTexture) as THREE.Texture;
  
  // Estado para textura processada e status de carregamento
  const [processedTexture, setProcessedTexture] = useState<THREE.CanvasTexture | null>(null);
  const [isTextureReady, setIsTextureReady] = useState(false);
  
  // Processar textura quando estiver carregada
  useEffect(() => {
    if (!rawTexture?.image) return;
    
    const img = rawTexture.image as HTMLImageElement;
    
    // Aguardar carregamento completo da imagem
    if (img.complete && img.naturalWidth > 0) {
      const processed = getOrCreatePlanetTexture(rawTexture, word.planetTexture);
      
      if (processed) {
        console.log(`✅ Textura processada com sucesso: ${word.palavra}`);
        setProcessedTexture(processed);
        setIsTextureReady(true);
      }
    } else {
      // Imagem ainda não carregou - aguardar evento onload
      const handleLoad = () => {
        const processed = getOrCreatePlanetTexture(rawTexture, word.planetTexture);
        if (processed) {
          console.log(`✅ Textura carregada e processada: ${word.palavra}`);
          setProcessedTexture(processed);
          setIsTextureReady(true);
        }
      };
      
      img.addEventListener('load', handleLoad);
      return () => img.removeEventListener('load', handleLoad);
    }
  }, [rawTexture, word.planetTexture, word.palavra]);
  
  // Configurar anisotropia para máxima qualidade
  useEffect(() => {
    if (processedTexture && gl) {
      processedTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
      processedTexture.needsUpdate = true;
    }
  }, [processedTexture, gl]);
  
  // Converter cor HSL para THREE.Color
  const domainColorObj = useMemo(() => new THREE.Color(domainColor), [domainColor]);
  
  // Calcular tamanho do planeta baseado na frequência (+60% maior)
  const planetRadius = useMemo(() => {
    // Recalibrado para o range REAL do corpus gaúcho (1-28 ocorrências)
    const baseSize = 0.4;   // +60% (era 0.25)
    const maxSize = 1.0;    // +67% (era 0.6)
    const minSize = 0.25;   // +39% (era 0.18)
    
    // Normalizar para o range do corpus (max ~30 ocorrências)
    const normalizedFreq = Math.min(word.ocorrencias / 30, 1.0);
    
    // Curva de crescimento não-linear (raiz quadrada para amplificar diferenças pequenas)
    const scaleFactor = Math.sqrt(normalizedFreq);
    
    const calculatedSize = baseSize + (scaleFactor * (maxSize - baseSize));
    
    // Garantir tamanho mínimo visível
    return Math.max(calculatedSize, minSize);
  }, [word.ocorrencias]);
  
  // Movimento orbital em espiral
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Atualizar ângulo orbital
      orbitalAngleRef.current += word.orbitalSpeed * delta;
      
      // Calcular posição orbital ELÍPTICA (sem espiral)
      const a = word.orbitalRadius; // Semi-eixo maior
      const b = word.orbitalRadius * (1 - word.orbitalEccentricity); // Semi-eixo menor
      
      // Posição X e Z (órbita elíptica no plano horizontal)
      const x = domainPosition[0] + a * Math.cos(orbitalAngleRef.current);
      const z = domainPosition[2] + b * Math.sin(orbitalAngleRef.current);
      
      // Variação em Y AUMENTADA para evitar colisões verticais
      // Usar um offset único por palavra baseado no seu nome
      const wordHash = word.palavra.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const yOffset = ((wordHash % 100) / 100) * 1.2 - 0.6; // -0.6 a +0.6 (era -0.4 a +0.4)
      const y = domainPosition[1] + yOffset;
      
      groupRef.current.position.set(x, y, z);
    }
    
    // Rotação suave do planeta em seu próprio eixo
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });
  
  // Opacidade contextual com VARIAÇÃO por Prosódia
  const finalOpacity = useMemo(() => {
    let baseOpacity = opacity;
    
    // Palavras com prosódia positiva são mais opacas/visíveis
    if (word.prosody === 'Positiva') {
      baseOpacity = Math.min(opacity * 1.2, 1.0);
    } else if (word.prosody === 'Negativa') {
      baseOpacity = opacity * 0.85;
    }
    
    if (isHovered) return 1.0;
    if (selectedDomainId && !isInSelectedDomain) {
      return 0.2; // Palavras de outros domínios ficam bem transparentes
    }
    return baseOpacity;
  }, [isHovered, selectedDomainId, isInSelectedDomain, opacity, word.prosody]);
  
  // Animações de hover
  const springProps = useSpring({
    scale: isHovered ? 1.4 : 1.0,
    labelOpacity: isHovered ? 1.0 : 0.0,
    config: { tension: 300, friction: 20 },
  });
  
  // userData para raycasting
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.nodeId = word.palavra;
      groupRef.current.userData.nodeType = 'word';
      groupRef.current.userData.word = word;
    }
    if (meshRef.current) {
      meshRef.current.userData.nodeId = word.palavra;
      meshRef.current.userData.nodeType = 'word';
      meshRef.current.userData.word = word;
    }
  }, [word]);
  
  return (
    <animated.group ref={groupRef} scale={springProps.scale}>
      {/* Planeta com Material Corrigido */}
      <mesh 
        ref={meshRef}
        renderOrder={10}
        onClick={(e) => {
          e.stopPropagation();
          // Criar um VisualWordNode compatível a partir do SemanticWord
          const visualNode: VisualWordNode = {
            id: word.palavra,
            label: word.palavra,
            type: 'word',
            position: [0, 0, 0], // Posição será calculada dinamicamente
            scale: planetRadius,
            color: domainColor,
            opacity: finalOpacity,
            baseOpacity: opacity,
            glowIntensity: isHovered ? 0.4 : 0.2,
            domain: word.dominio,
            frequency: word.ocorrencias,
            prosody: word.prosody,
            rawData: {
              text: word.palavra,
              rawFrequency: word.ocorrencias,
              normalizedFrequency: word.ocorrencias,
              prosody: word.prosody
            }
          };
          useInteractivityStore.getState().openModal(visualNode);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = 'default';
        }}
      >
        {/* Planeta principal */}
        <sphereGeometry args={[planetRadius, 64, 64]} />
        {/* ✅ FASE 3: Indicador visual de carregamento */}
        <meshStandardMaterial
          map={isTextureReady ? processedTexture : null}
          color={
            isTextureReady 
              ? (isHovered ? '#ffffff' : new THREE.Color(domainColor).lerp(new THREE.Color('#ffffff'), 0.5))
              : '#444444' // Cinza escuro enquanto carrega
          }
          roughness={isTextureReady ? 0.7 : 0.9}
          metalness={isTextureReady ? 0.15 : 0.05}
          bumpMap={isTextureReady ? processedTexture : null}
          bumpScale={0.03}
          normalMap={isTextureReady ? processedTexture : null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          transparent
          opacity={isTextureReady ? finalOpacity : finalOpacity * 0.6}
          emissive={isTextureReady ? '#000000' : '#222222'} // Leve brilho enquanto carrega
        />
      </mesh>
        
      {/* Glow Ring para indicar prosódia */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.05, 32, 32]} />
          <meshBasicMaterial
            color={domainColor}
            transparent
            opacity={isHovered ? 0.3 : 0.15}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Debug: Grid helper para verificar cobertura de textura */}
        {import.meta.env.DEV && isHovered && (
          <lineSegments>
            <edgesGeometry args={[new THREE.SphereGeometry(planetRadius, 16, 16)]} />
            <lineBasicMaterial color="#00ff00" opacity={0.3} transparent />
          </lineSegments>
        )}
      
      {/* Label Flutuante (aparece no hover) */}
      {isHovered && (
        <Text
          position={[0, planetRadius + 0.3, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {word.palavra}
          <animated.meshBasicMaterial
            transparent
            opacity={springProps.labelOpacity}
          />
        </Text>
      )}
      
      {/* Indicador de Frequência (pequeno anel no hover) */}
      {isHovered && (
        <animated.mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planetRadius * 1.2, planetRadius * 1.3, 32]} />
          <animated.meshBasicMaterial
            color={domainColor}
            transparent
            opacity={springProps.labelOpacity.to(o => o * 0.6)}
            side={THREE.DoubleSide}
          />
        </animated.mesh>
      )}
    </animated.group>
  );
}
