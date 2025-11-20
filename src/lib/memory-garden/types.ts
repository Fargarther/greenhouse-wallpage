import type { Vector3, Vector3Tuple } from 'three';

export type SpeciesKey = 'fern' | 'flower' | 'vine';

export type MemoryMood = 'calm' | 'happy' | 'melancholy' | 'celebration';
export type MemoryImportance = 'low' | 'medium' | 'high';

export interface MemoryMetadata {
  mood?: MemoryMood;
  importance?: MemoryImportance;
  note?: string;
  tags?: string[];
}

export interface MemorySeed {
  id: string;
  species: SpeciesKey;
  plantedAt: number;
  position: Vector3Tuple;
  metadata: MemoryMetadata;
}

export interface RuntimePlant extends MemorySeed {
  growthStage: number;
  targetStage: number;
}

export interface BranchSegment {
  start: Vector3Tuple;
  end: Vector3Tuple;
  radius: number;
}

export interface LeafInstance {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
  color: string;
}

export interface BloomInstance {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
  color: string;
}

export interface PlantStructure {
  segments: BranchSegment[];
  leaves: LeafInstance[];
  blooms: BloomInstance[];
}

export interface LSystemPreset {
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  segmentLength: number;
  radius: number;
  iterations: number;
  randomness?: number;
  leafColor: string;
  bloomColor?: string;
}

export interface SpaceColonizationPreset {
  attractorCount: number;
  influenceRadius: number;
  killRadius: number;
  stepSize: number;
  baseRadius: number;
  leafColor: string;
}

export type SpeciesPreset =
  | { method: 'lsystem'; preset: LSystemPreset }
  | { method: 'space'; preset: SpaceColonizationPreset };

export interface DropRequest {
  id: string;
  screen: { x: number; y: number };
}

export interface DropResult {
  id: string;
  point: Vector3 | null;
}
