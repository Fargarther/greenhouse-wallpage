import type { SpeciesKey, SpeciesPreset } from './types';

export const speciesPresets: Record<SpeciesKey, SpeciesPreset> = {
  fern: {
    method: 'lsystem',
    preset: {
      axiom: 'X',
      rules: {
        X: 'F[-X][X]F[-X]+X',
        F: 'FF',
      },
      angle: 22.5,
      segmentLength: 0.6,
      radius: 0.08,
      iterations: 5,
      randomness: 0.12,
      leafColor: '#8fbf8f',
    },
  },
  flower: {
    method: 'lsystem',
    preset: {
      axiom: 'X',
      rules: {
        X: 'F[+X][-X]F*',
        F: 'FF',
      },
      angle: 28,
      segmentLength: 0.5,
      radius: 0.09,
      iterations: 4,
      randomness: 0.08,
      leafColor: '#9bc6a4',
      bloomColor: '#f5a9b8',
    },
  },
  vine: {
    method: 'space',
    preset: {
      attractorCount: 45,
      influenceRadius: 1.8,
      killRadius: 0.4,
      stepSize: 0.55,
      baseRadius: 0.07,
      leafColor: '#9ac997',
    },
  },
};

export function getSpeciesMaxStage(species: SpeciesKey) {
  const preset = speciesPresets[species];
  if (preset.method === 'lsystem') {
    return preset.preset.iterations;
  }
  return Math.max(4, Math.ceil(preset.preset.attractorCount / 6));
}
