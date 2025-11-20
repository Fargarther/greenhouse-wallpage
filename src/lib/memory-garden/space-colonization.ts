import { Vector3 } from 'three';
import type { PlantStructure, SpaceColonizationPreset } from './types';
import type { RandomFn } from './random';

interface Node {
  position: Vector3;
  parentIndex: number | null;
  depth: number;
  radius: number;
}

export function generateVineStructure(
  preset: SpaceColonizationPreset,
  stage: number,
  rng: RandomFn,
  bloomColor = '#d4f1cd'
): PlantStructure {
  const attractors: Vector3[] = [];
  for (let i = 0; i < preset.attractorCount; i += 1) {
    const theta = rng() * Math.PI * 2;
    const radius = 1.5 + rng() * 2.5;
    const height = 1 + rng() * 5;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    attractors.push(new Vector3(x, height, z));
  }

  const nodes: Node[] = [
    {
      position: new Vector3(0, 0, 0),
      parentIndex: null,
      depth: 0,
      radius: preset.baseRadius,
    },
  ];
  let activeTipIndices = new Set<number>([0]);

  const segments: PlantStructure['segments'] = [];
  const leaves: PlantStructure['leaves'] = [];
  const blooms: PlantStructure['blooms'] = [];

  const maxSteps = Math.max(8, stage * 16);
  const influenceRadiusSq = preset.influenceRadius ** 2;
  const killRadiusSq = preset.killRadius ** 2;

  for (let step = 0; step < maxSteps; step += 1) {
    if (!attractors.length || activeTipIndices.size === 0) break;

    const assignments = new Map<
      number,
      {
        direction: Vector3;
        count: number;
      }
    >();

    const removalIndices: number[] = [];

    attractors.forEach((attractor, attractorIndex) => {
      let closestTip: number | null = null;
      let closestDistanceSq = Infinity;

      activeTipIndices.forEach((tipIndex) => {
        const tip = nodes[tipIndex];
        const distanceSq = attractor.distanceToSquared(tip.position);
        if (distanceSq < killRadiusSq) {
          // attractor reached, mark for deletion and skip
          removalIndices.push(attractorIndex);
          closestTip = null;
          closestDistanceSq = distanceSq;
          return;
        }
        if (distanceSq <= influenceRadiusSq && distanceSq < closestDistanceSq) {
          closestDistanceSq = distanceSq;
          closestTip = tipIndex;
        }
      });

      if (closestTip !== null) {
        const tip = nodes[closestTip];
        const dir = attractor.clone().sub(tip.position).normalize();
        const entry = assignments.get(closestTip);
        if (entry) {
          entry.direction.add(dir);
          entry.count += 1;
        } else {
          assignments.set(closestTip, { direction: dir, count: 1 });
        }
      }
    });

    // remove satisfied attractors
    removalIndices
      .sort((a, b) => b - a)
      .forEach((idx) => {
        attractors.splice(idx, 1);
      });

    if (assignments.size === 0) break;

    const newTips: number[] = [];
    assignments.forEach((assignment, tipIndex) => {
      const tip = nodes[tipIndex];
      const direction = assignment.direction.normalize();
      const segmentLength = preset.stepSize * Math.max(0.4, 1 - tip.depth * 0.05);
      const newPosition = tip.position.clone().addScaledVector(direction, segmentLength);

      const newNode: Node = {
        position: newPosition,
        parentIndex: tipIndex,
        depth: tip.depth + 1,
        radius: Math.max(tip.radius * 0.92, 0.02),
      };
      const newIndex = nodes.length;
      nodes.push(newNode);
      newTips.push(newIndex);

      segments.push({
        start: [tip.position.x, tip.position.y, tip.position.z],
        end: [newPosition.x, newPosition.y, newPosition.z],
        radius: newNode.radius,
      });

      if (rng() > 0.4) {
        const offset = new Vector3((rng() - 0.5) * 0.3, (rng() - 0.5) * 0.2, (rng() - 0.5) * 0.3);
        const leafPos = newPosition.clone().add(offset);
        leaves.push({
          position: [leafPos.x, leafPos.y, leafPos.z],
          rotation: [(rng() - 0.5) * 0.8, (rng() - 0.5) * 0.8, (rng() - 0.5) * 0.8],
          scale: 0.25 + rng() * 0.35,
          color: preset.leafColor,
        });
      }
    });

    // update active tips
    activeTipIndices = new Set(newTips);
  }

  if (nodes.length > 1) {
    const lastNode = nodes[nodes.length - 1];
    blooms.push({
      position: [lastNode.position.x, lastNode.position.y, lastNode.position.z],
      rotation: [(rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6],
      scale: 0.2 + rng() * 0.4,
      color: bloomColor,
    });
  }

  return { segments, leaves, blooms };
}
