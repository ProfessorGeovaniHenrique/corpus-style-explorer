import { ProsodiaType } from './corpus.types';

// ===== DADOS BRUTOS (do corpus) =====
export interface RawDomainData {
  id: string;
  name: string;
  rawFrequency: number;
  normalizedFrequency: number;
  lexicalRichness: number;
  textualWeight: number; // percentualTematico
  comparisonStatus: 'super-representado' | 'equilibrado' | 'sub-representado';
  color: string;
  textColor: string;
  words: RawWordData[];
}

export interface RawWordData {
  text: string;
  rawFrequency: number;
  normalizedFrequency: number;
  prosody: ProsodiaType;
  lemma?: string;
}

// ===== DADOS VISUAIS (para renderização 3D) =====
export interface VisualDomainNode {
  id: string;
  label: string;
  type: 'domain';
  position: [number, number, number];
  scale: number;
  color: string;
  glowIntensity: number;
  pulseSpeed: number;
  baseOpacity: number;
  // Referência aos dados brutos
  rawData: RawDomainData;
}

export interface VisualWordNode {
  id: string;
  label: string;
  type: 'word';
  position: [number, number, number];
  scale: number;
  color: string;
  opacity: number;
  baseOpacity: number;
  glowIntensity: number;
  domain: string;
  frequency: number;
  prosody: ProsodiaType;
  // Referência aos dados brutos
  rawData: RawWordData;
}

export type VisualNode = VisualDomainNode | VisualWordNode;

// ===== CONEXÕES =====
export interface DomainConnection {
  from: string;
  to: string;
  strength: number; // 0-1
}

// ===== MODOS DE VISUALIZAÇÃO =====
export type ViewMode = 'constellation' | 'orbital';
