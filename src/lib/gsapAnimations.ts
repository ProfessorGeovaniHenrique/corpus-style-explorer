import gsap from 'gsap';
import { ANIMATION_CONFIG } from '@/config/animationConfig';
import { COSMIC_STYLE } from '@/config/visualStyle';
import * as THREE from 'three';

/**
 * Anima câmera e background ao fazer zoom em domínio
 */
export function animateDomainZoom(
  camera: THREE.Camera,
  target: THREE.Vector3,
  domainPosition: [number, number, number],
  domainName: string,
  scene: THREE.Scene
) {
  const config = ANIMATION_CONFIG.domainZoom;
  
  // Timeline GSAP para sincronizar animações
  const timeline = gsap.timeline();
  
  // 1. Mover câmera
  timeline.to(camera.position, {
    x: domainPosition[0] + config.camera.offsetX,
    y: domainPosition[1] + config.camera.offsetY,
    z: domainPosition[2] + config.camera.offsetZ,
    duration: config.camera.duration,
    ease: config.camera.ease,
  });
  
  // Mover target dos controles
  timeline.to(target, {
    x: domainPosition[0],
    y: domainPosition[1],
    z: domainPosition[2],
    duration: config.camera.duration,
    ease: config.camera.ease,
  }, 0);
  
  // 2. Animar cor do background (ao mesmo tempo)
  const backgroundTint = COSMIC_STYLE.backgroundTints[domainName];
  if (backgroundTint && scene.background instanceof THREE.Color) {
    timeline.to(scene.background, {
      r: backgroundTint.r,
      g: backgroundTint.g,
      b: backgroundTint.b,
      duration: config.background.duration,
      ease: config.background.ease,
    }, config.background.delay);
  }
  
  return timeline;
}

/**
 * Anima reset de câmera
 */
export function animateCameraReset(
  camera: THREE.Camera,
  target: THREE.Vector3,
  defaultPosition: THREE.Vector3,
  defaultTarget: THREE.Vector3,
  scene: THREE.Scene
) {
  const config = ANIMATION_CONFIG.cameraReset;
  
  const timeline = gsap.timeline();
  
  // Voltar câmera para posição original
  timeline.to(camera.position, {
    x: defaultPosition.x,
    y: defaultPosition.y,
    z: defaultPosition.z,
    duration: config.duration,
    ease: config.ease,
  });
  
  // Voltar target para posição original
  timeline.to(target, {
    x: defaultTarget.x,
    y: defaultTarget.y,
    z: defaultTarget.z,
    duration: config.duration,
    ease: config.ease,
  }, 0);
  
  // Voltar background para cor original
  if (scene.background instanceof THREE.Color) {
    timeline.to(scene.background, {
      r: 0.01,
      g: 0.01,
      b: 0.05,
      duration: config.duration,
      ease: config.ease,
    }, 0);
  }
  
  return timeline;
}

/**
 * Anima opacidade de nós para filtros
 */
export function animateFilterTransition(
  nodes: any[],
  getTargetOpacity: (node: any) => number
) {
  const config = ANIMATION_CONFIG.filterTransition;
  
  nodes.forEach(node => {
    if (node.material) {
      gsap.to(node.material, {
        opacity: getTargetOpacity(node),
        duration: config.duration,
        ease: config.ease,
      });
    }
  });
}

/**
 * Anima hover cascade effect com GSAP
 */
export function animateHoverCascade(
  nodeId: string,
  nodes: Map<string, THREE.Group>,
  allNodesData: any[],
  action: 'enter' | 'leave'
) {
  const config = ANIMATION_CONFIG.hoverCascade;
  
  if (action === 'enter') {
    const hoveredData = allNodesData.find(n => n.id === nodeId);
    if (!hoveredData) return;
    
    allNodesData.forEach(nodeData => {
      const nodeGroup = nodes.get(nodeData.id);
      if (!nodeGroup) return;
      
      const billboard = nodeGroup.children[0];
      if (billboard && billboard.children[0]) {
        const textMesh = billboard.children[0] as THREE.Mesh;
        if (textMesh.material) {
          let targetOpacity = nodeData.baseOpacity;
          
          if (nodeData.id === nodeId) {
            targetOpacity = 1.0;
          } else if (nodeData.domain === hoveredData.domain) {
            targetOpacity = config.sameDomainFade.opacity;
          } else {
            targetOpacity = config.otherDomainFade.opacity;
          }
          
          gsap.to(textMesh.material, {
            opacity: targetOpacity,
            duration: config.sameDomainFade.duration,
          });
        }
      }
    });
  } else {
    // Reset ao sair do hover
    allNodesData.forEach(nodeData => {
      const nodeGroup = nodes.get(nodeData.id);
      if (nodeGroup) {
        const billboard = nodeGroup.children[0];
        if (billboard && billboard.children[0]) {
          const textMesh = billboard.children[0] as THREE.Mesh;
          if (textMesh.material) {
            gsap.to(textMesh.material, {
              opacity: nodeData.baseOpacity,
              duration: config.sameDomainFade.duration,
            });
          }
        }
      }
    });
  }
}
