import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import type { LSystemPreset, PlantStructure } from './types';
import type { RandomFn } from './random';

interface TurtleState {
  position: Vector3;
  rotation: Quaternion;
  depth: number;
  length: number;
  radius: number;
}

const plus = new Quaternion();
const minus = new Quaternion();
const pitchUp = new Quaternion();
const pitchDown = new Quaternion();
const rollLeft = new Quaternion();
const rollRight = new Quaternion();

function configureRotations(angleDeg: number) {
  const angle = MathUtils.degToRad(angleDeg);
  plus.setFromAxisAngle(new Vector3(0, 0, 1), angle);
  minus.setFromAxisAngle(new Vector3(0, 0, 1), -angle);
  pitchUp.setFromAxisAngle(new Vector3(1, 0, 0), angle);
  pitchDown.setFromAxisAngle(new Vector3(1, 0, 0), -angle);
  rollLeft.setFromAxisAngle(new Vector3(0, 1, 0), angle);
  rollRight.setFromAxisAngle(new Vector3(0, 1, 0), -angle);
}

export function expandLSystem(
  axiom: string,
  rules: Record<string, string>,
  depth: number,
  randomness = 0,
  rng?: RandomFn
) {
  let current = axiom;
  for (let iteration = 0; iteration < depth; iteration += 1) {
    let next = '';
    for (const token of current) {
      const replacement = rules[token];
      if (!replacement) {
        next += token;
        continue;
      }
      if (randomness > 0 && replacement.includes('|')) {
        const parts = replacement.split('|');
        const source = rng ?? Math.random;
        const index = Math.floor(source() * parts.length);
        next += parts[index];
      } else {
        next += replacement;
      }
    }
    current = next;
  }
  return current;
}

export function generateLSystemStructure(preset: LSystemPreset, stage: number, rng?: RandomFn): PlantStructure {
  const iterations = Math.min(Math.max(stage, 1), preset.iterations);
  configureRotations(preset.angle);
  const directives = expandLSystem(preset.axiom, preset.rules, iterations, preset.randomness ?? 0, rng);

  const direction = new Vector3(0, 1, 0);
  const stack: TurtleState[] = [];
  const segments: PlantStructure['segments'] = [];
  const leaves: PlantStructure['leaves'] = [];
  const blooms: PlantStructure['blooms'] = [];

  let state: TurtleState = {
    position: new Vector3(0, 0, 0),
    rotation: new Quaternion(),
    depth: 0,
    length: preset.segmentLength,
    radius: preset.radius,
  };

  const radiusDecay = 0.8;
  const lengthDecay = 0.88;

  for (let idx = 0; idx < directives.length; idx += 1) {
    const command = directives[idx];
    switch (command) {
      case 'F': {
        const start = state.position.clone();
        const localDir = direction.clone().applyQuaternion(state.rotation);
        const length = state.length;
        const end = state.position.clone().addScaledVector(localDir, length);
        segments.push({
          start: [start.x, start.y, start.z],
          end: [end.x, end.y, end.z],
          radius: Math.max(state.radius, 0.01),
        });
        state = {
          ...state,
          position: end,
        };

        const peek = directives[idx + 1];
        if (!peek || peek === ']' || peek === '+') {
          // terminal tip leaf
          const source = rng ?? Math.random;
          leaves.push({
            position: [end.x, end.y, end.z],
            rotation: [(source() - 0.5) * 0.6, (source() - 0.5) * 0.6, (source() - 0.5) * 0.6],
            scale: Math.max(0.6 * state.length, 0.2),
            color: preset.leafColor,
          });
        }
        break;
      }
      case '+':
        state = {
          ...state,
          rotation: state.rotation.clone().multiply(plus),
        };
        break;
      case '-':
        state = {
          ...state,
          rotation: state.rotation.clone().multiply(minus),
        };
        break;
      case '&':
        state = {
          ...state,
          rotation: state.rotation.clone().multiply(pitchUp),
        };
        break;
      case '^':
        state = {
          ...state,
          rotation: state.rotation.clone().multiply(pitchDown),
        };
        break;
      case '\\':
        state = {
          ...state,
          rotation: state.rotation.clone().multiply(rollLeft),
        };
        break;
      case '/':
        state = {
          ...state,
          rotation: state.rotation.clone().multiply(rollRight),
        };
        break;
      case '[':
        stack.push(state);
        state = {
          position: state.position.clone(),
          rotation: state.rotation.clone(),
          depth: state.depth + 1,
          length: state.length * lengthDecay,
          radius: state.radius * radiusDecay,
        };
        break;
      case ']': {
        const popped = stack.pop();
        if (popped) {
          state = popped;
        }
        break;
      }
      case '*': {
        // add bloom at current position
        const pos = state.position.clone();
        const rotation = new Euler(
          ((rng ?? Math.random)() - 0.5) * Math.PI,
          ((rng ?? Math.random)() - 0.5) * Math.PI,
          ((rng ?? Math.random)() - 0.5) * Math.PI
        );
        blooms.push({
          position: [pos.x, pos.y, pos.z],
          rotation: [rotation.x, rotation.y, rotation.z],
          scale: Math.max(state.radius * 3, 0.3),
          color: preset.bloomColor ?? '#ef798a',
        });
        break;
      }
      default:
        break;
    }
  }

  return { segments, leaves, blooms };
}
