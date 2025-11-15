import { create } from 'zustand';
import { VisualNode } from '@/data/types/threeVisualization.types';
import * as THREE from 'three';

// ===== INTERFACES =====
interface TooltipState {
  isVisible: boolean;
  data: TooltipData | null;
  position: { x: number; y: number };
}

interface TooltipData {
  title: string;
  domain: { name: string; color: string };
  frequency: { raw: number; normalized: number };
  prosody: { type: 'Positiva' | 'Negativa' | 'Neutra'; justification?: string };
  lexicalRichness?: number;
  textualWeight?: number;
  type: 'domain' | 'word';
}

interface ModalState {
  isOpen: boolean;
  node: VisualNode | null;
}

interface CameraState {
  isAnimating: boolean;
  target: THREE.Vector3;
  shouldReset: boolean;
}

interface HoverState {
  hoveredNodeId: string | null;
  hoveredType: 'word' | 'domain' | null;
}

interface InteractivityState {
  // Estado de visualização
  viewMode: 'constellation' | 'orbital';
  selectedDomainId: string | null;
  
  // Tooltip
  tooltip: TooltipState;
  
  // Modal
  modal: ModalState;
  
  // Câmera
  camera: CameraState;
  
  // Hover
  hover: HoverState;
  
  // Actions - View Mode
  setViewMode: (mode: 'constellation' | 'orbital') => void;
  setSelectedDomain: (domainId: string | null) => void;
  
  // Actions - Tooltip
  showTooltip: (data: TooltipData, position: { x: number; y: number }) => void;
  hideTooltip: () => void;
  updateTooltipPosition: (position: { x: number; y: number }) => void;
  
  // Actions - Modal
  openModal: (node: VisualNode) => void;
  closeModal: () => void;
  
  // Actions - Camera
  setCameraTarget: (target: THREE.Vector3) => void;
  setCameraAnimating: (isAnimating: boolean) => void;
  resetCamera: () => void;
  
  // Actions - Hover
  setHoveredNode: (nodeId: string | null, type: 'word' | 'domain' | null) => void;
  
  // Reset completo
  reset: () => void;
}

// ===== ESTADO INICIAL =====
const initialTooltipState: TooltipState = {
  isVisible: false,
  data: null,
  position: { x: 0, y: 0 },
};

const initialModalState: ModalState = {
  isOpen: false,
  node: null,
};

const initialCameraState: CameraState = {
  isAnimating: false,
  target: new THREE.Vector3(0, 0, 0),
  shouldReset: false,
};

const initialHoverState: HoverState = {
  hoveredNodeId: null,
  hoveredType: null,
};

// ===== ZUSTAND STORE =====
export const useInteractivityStore = create<InteractivityState>((set) => ({
  // Estado inicial
  viewMode: 'constellation',
  selectedDomainId: null,
  tooltip: initialTooltipState,
  modal: initialModalState,
  camera: initialCameraState,
  hover: initialHoverState,
  
  // View Mode Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSelectedDomain: (domainId) => set({ 
    selectedDomainId: domainId,
    viewMode: domainId ? 'orbital' : 'constellation'
  }),
  
  // Tooltip Actions
  showTooltip: (data, position) => set({
    tooltip: {
      isVisible: true,
      data,
      position,
    },
  }),
  
  hideTooltip: () => set({
    tooltip: initialTooltipState,
  }),
  
  updateTooltipPosition: (position) => set((state) => ({
    tooltip: {
      ...state.tooltip,
      position,
    },
  })),
  
  // Modal Actions
  openModal: (node) => set({
    modal: {
      isOpen: true,
      node,
    },
  }),
  
  closeModal: () => set({
    modal: initialModalState,
  }),
  
  // Camera Actions
  setCameraTarget: (target) => set((state) => ({
    camera: {
      ...state.camera,
      target,
      shouldReset: false,
    },
  })),
  
  setCameraAnimating: (isAnimating) => set((state) => ({
    camera: {
      ...state.camera,
      isAnimating,
    },
  })),
  
  resetCamera: () => set((state) => ({
    camera: {
      ...state.camera,
      shouldReset: true,
      target: new THREE.Vector3(0, 0, 0),
    },
    selectedDomainId: null,
    viewMode: 'constellation',
  })),
  
  // Hover Actions
  setHoveredNode: (nodeId, type) => set({
    hover: {
      hoveredNodeId: nodeId,
      hoveredType: type,
    },
  }),
  
  // Reset completo
  reset: () => set({
    viewMode: 'constellation',
    selectedDomainId: null,
    tooltip: initialTooltipState,
    modal: initialModalState,
    camera: initialCameraState,
    hover: initialHoverState,
  }),
}));

// ===== SELECTORS (para otimização de re-renders) =====
export const selectViewMode = (state: InteractivityState) => state.viewMode;
export const selectSelectedDomainId = (state: InteractivityState) => state.selectedDomainId;
export const selectTooltip = (state: InteractivityState) => state.tooltip;
export const selectModal = (state: InteractivityState) => state.modal;
export const selectCamera = (state: InteractivityState) => state.camera;
export const selectHover = (state: InteractivityState) => state.hover;
