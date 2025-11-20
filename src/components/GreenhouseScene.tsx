'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Float } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { speciesPresets } from '@/lib/memory-garden/presets';
import { createSeedHash } from '@/lib/memory-garden/random';
import { generateLSystemStructure } from '@/lib/memory-garden/lsystem';
import { generateVineStructure } from '@/lib/memory-garden/space-colonization';
import type { DropRequest, DropResult, MemoryMood, RuntimePlant } from '@/lib/memory-garden/types';

type GreenhouseSceneProps = {
  plants: RuntimePlant[];
  onSoilReady?: (mesh: THREE.Mesh) => void;
  dropRequest?: DropRequest | null;
  onDropResolved?: (result: DropResult) => void;
};

type LayerProps = {
  color: string;
  position: [number, number, number];
  size: [number, number];
  outline?: string;
};

type DustProps = {
  count?: number;
  area?: [number, number, number];
};

const cameraDistance = 8;

function createGradientTexture(stops: string[]) {
  const colors = stops.map((hex) => new THREE.Color(hex));
  const data = new Uint8Array(colors.length * 3);

  colors.forEach((color, index) => {
    const stride = index * 3;
    data[stride] = Math.floor(color.r * 255);
    data[stride + 1] = Math.floor(color.g * 255);
    data[stride + 2] = Math.floor(color.b * 255);
  });

  const texture = new THREE.DataTexture(data, colors.length, 1, THREE.RGBFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

const gradientTexture = createGradientTexture(['#f7f2ea', '#dcd3c2', '#b0a899']);

function adjustHexColor(hex: string, adjustments: { h?: number; s?: number; l?: number }) {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  const nextH = THREE.MathUtils.euclideanModulo(hsl.h + (adjustments.h ?? 0), 1);
  const nextS = THREE.MathUtils.clamp(hsl.s + (adjustments.s ?? 0), 0, 1);
  const nextL = THREE.MathUtils.clamp(hsl.l + (adjustments.l ?? 0), 0, 1);
  color.setHSL(nextH, nextS, nextL);
  return `#${color.getHexString()}`;
}

function deriveMoodPalette(
  baseLeaf: string,
  baseBloom: string | undefined,
  baseBranch: string,
  mood?: MemoryMood
) {
  let leaf = baseLeaf;
  let bloom = baseBloom;
  let branch = baseBranch;

  switch (mood) {
    case 'calm':
      leaf = adjustHexColor(leaf, { h: -0.015, s: -0.08, l: 0.05 });
      branch = adjustHexColor(branch, { s: -0.06, l: 0.04 });
      if (bloom) bloom = adjustHexColor(bloom, { s: -0.05, l: 0.06 });
      break;
    case 'happy':
      leaf = adjustHexColor(leaf, { h: 0.02, s: 0.18, l: 0.08 });
      branch = adjustHexColor(branch, { s: 0.12, l: 0.05 });
      if (bloom) bloom = adjustHexColor(bloom, { s: 0.22, l: 0.1 });
      break;
    case 'melancholy':
      leaf = adjustHexColor(leaf, { h: -0.03, s: -0.22, l: -0.05 });
      branch = adjustHexColor(branch, { s: -0.12, l: -0.05 });
      if (bloom) bloom = adjustHexColor(bloom, { s: -0.12, l: -0.06 });
      break;
    case 'celebration':
      leaf = adjustHexColor(leaf, { h: 0.04, s: 0.25, l: 0.06 });
      branch = adjustHexColor(branch, { s: 0.18, l: 0.02 });
      if (bloom) bloom = adjustHexColor(bloom, { s: 0.25, l: 0.08 });
      break;
    default:
      break;
  }

  return { leaf, bloom, branch };
}

function Layer({ color, position, size, outline }: LayerProps) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshToonMaterial color={color} gradientMap={gradientTexture} />
      {outline ? <Edges color={outline} /> : null}
    </mesh>
  );
}

function MarbleTable() {
  return (
    <group position={[0, -0.65, 0]}>
      <mesh position={[0, 0.2, 0]} scale={[2.8, 0.36, 1.6]}>
        <boxGeometry />
        <meshToonMaterial color="#f1eae2" gradientMap={gradientTexture} />
      </mesh>
      <mesh position={[0, 0.42, 0]} scale={[3.1, 0.08, 1.9]}>
        <boxGeometry />
        <meshToonMaterial color="#e8dfd3" gradientMap={gradientTexture} />
      </mesh>
    </group>
  );
}

function Backpack() {
  return (
    <group position={[1.7, -0.4, 0.25]} rotation={[0, 0.18, 0]}>
      <mesh position={[0, 0.5, 0]} scale={[0.7, 0.9, 0.22]}>
        <boxGeometry />
        <meshToonMaterial color="#9c7564" gradientMap={gradientTexture} />
      </mesh>
      <mesh position={[0, 0.12, -0.18]} scale={[0.58, 0.24, 0.12]}>
        <boxGeometry />
        <meshToonMaterial color="#ae8573" gradientMap={gradientTexture} />
      </mesh>
    </group>
  );
}

function DustParticles({ count = 28, area = [6, 4, 1.5] }: DustProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => {
      return {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * area[0],
          Math.random() * area[1],
          (Math.random() - 0.5) * area[2]
        ),
        speed: 0.5 + Math.random() * 0.8,
        size: 0.02 + Math.random() * 0.03,
        opacity: 0.2 + Math.random() * 0.3,
      };
    });
  }, [area, count]);

  return (
    <group>
      {particles.map((particle, index) => (
        <Float key={index} speed={particle.speed} rotationIntensity={0.1} floatIntensity={0.05} floatingRange={[0.04, 0.08]}>
          <mesh position={particle.position}>
            <sphereGeometry args={[particle.size, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={particle.opacity} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function CameraRig() {
  const target = useRef(new THREE.Vector3());

  useFrame((state) => {
    const pointer = state.pointer;
    target.current.x = THREE.MathUtils.lerp(target.current.x, pointer.x * 0.4, 0.05);
    target.current.y = THREE.MathUtils.lerp(target.current.y, pointer.y * 0.3, 0.05);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, target.current.x, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, target.current.y, 0.08);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function SoilPlane({ onReady }: { onReady?: (mesh: THREE.Mesh) => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (mesh.current && onReady) onReady(mesh.current);
  }, [onReady]);
  return (
    <mesh ref={mesh} position={[0, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 6]} />
      <meshToonMaterial color="#eae3d8" gradientMap={gradientTexture} />
    </mesh>
  );
}

function DropProjector({
  request,
  soil,
  onComplete,
}: {
  request: DropRequest | null | undefined;
  soil: THREE.Object3D | null;
  onComplete?: (result: DropResult) => void;
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    if (!request || !soil || !onComplete) return;
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((request.screen.x - rect.left) / rect.width) * 2 - 1,
      -(((request.screen.y - rect.top) / rect.height) * 2 - 1)
    );
    raycaster.setFromCamera(ndc, camera);
    const intersections = raycaster.intersectObject(soil, true);
    const point = intersections.length > 0 ? intersections[0].point.clone() : null;
    onComplete({ id: request.id, point });
  }, [camera, gl, onComplete, raycaster, request, soil]);

  return null;
}

function ProceduralPlant({ plant }: { plant: RuntimePlant }) {
  const preset = speciesPresets[plant.species];
  const groupRef = useRef<THREE.Group>(null);
  const baseSeed = useMemo(() => createSeedHash(plant.id), [plant.id]);
  const phase = useMemo(() => baseSeed(), [baseSeed]);
  const stage = Math.min(Math.max(1, plant.growthStage), plant.targetStage);

  const palette = useMemo(() => {
    const baseLeaf = preset.preset.leafColor;
    const baseBloom =
      preset.method === 'lsystem' ? preset.preset.bloomColor : '#d4f1cd';
    const baseBranch = preset.method === 'lsystem' ? '#806d59' : '#5f7d5d';
    let { leaf, bloom, branch } = deriveMoodPalette(
      baseLeaf,
      baseBloom,
      baseBranch,
      plant.metadata.mood
    );
    if (plant.metadata.importance === 'high') {
      branch = adjustHexColor(branch, { l: -0.06, s: 0.05 });
      leaf = adjustHexColor(leaf, { l: -0.02, s: 0.04 });
      if (bloom) bloom = adjustHexColor(bloom, { s: 0.06, l: 0.04 });
    } else if (plant.metadata.importance === 'low') {
      branch = adjustHexColor(branch, { l: 0.05, s: -0.05 });
      leaf = adjustHexColor(leaf, { l: 0.07, s: -0.05 });
      if (bloom) bloom = adjustHexColor(bloom, { s: -0.05 });
    }
    return { leaf, bloom, branch };
  }, [plant.metadata.importance, plant.metadata.mood, preset]);

  const structure = useMemo(() => {
    const rng = createSeedHash(`${plant.id}-${stage}`);
    if (preset.method === 'lsystem') {
      const config = {
        ...preset.preset,
        leafColor: palette.leaf,
        bloomColor: palette.bloom ?? preset.preset.bloomColor,
      };
      return generateLSystemStructure(config, stage, rng);
    }
    const config = { ...preset.preset, leafColor: palette.leaf };
    return generateVineStructure(config, stage, rng, palette.bloom ?? '#d4f1cd');
  }, [palette, plant.id, preset, stage]);

  const branchMaterial = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: palette.branch,
        gradientMap: gradientTexture,
      }),
    [palette.branch]
  );
  useEffect(() => () => branchMaterial.dispose(), [branchMaterial]);

  const leafGeometry = useMemo(() => new THREE.PlaneGeometry(0.4, 0.9, 1, 1), []);
  useEffect(() => () => leafGeometry.dispose(), [leafGeometry]);

  const bloomGeometry = useMemo(() => new THREE.SphereGeometry(0.25, 12, 12), []);
  useEffect(() => () => bloomGeometry.dispose(), [bloomGeometry]);

  const swayStrength = useMemo(() => {
    switch (plant.metadata.mood) {
      case 'calm':
        return 0.035;
      case 'happy':
        return 0.075;
      case 'melancholy':
        return 0.025;
      case 'celebration':
        return 0.09;
      default:
        return 0.05;
    }
  }, [plant.metadata.mood]);

  const importanceScale =
    plant.metadata.importance === 'high'
      ? 1.18
      : plant.metadata.importance === 'low'
        ? 0.92
        : 1;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.12 + phase * Math.PI * 2) * swayStrength;
    groupRef.current.rotation.x = Math.sin(t * 0.1 + phase) * swayStrength * 0.4;
  });

  return (
    <group ref={groupRef} position={plant.position} scale={[importanceScale, importanceScale, importanceScale]}>
      {structure.segments.map((segment, index) => {
        const start = new THREE.Vector3(...segment.start);
        const end = new THREE.Vector3(...segment.end);
        const delta = end.clone().sub(start);
        const length = delta.length();
        const midPoint = start.clone().addScaledVector(delta, 0.5);
        const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
        return (
          <mesh key={`branch-${plant.id}-${index}`} position={midPoint} quaternion={orientation} material={branchMaterial}>
            <cylinderGeometry args={[segment.radius * 0.8, segment.radius, length, 6]} />
          </mesh>
        );
      })}

      {structure.leaves.map((leaf, index) => (
        <mesh
          key={`leaf-${plant.id}-${index}`}
          position={leaf.position}
          rotation={leaf.rotation}
          scale={[leaf.scale, leaf.scale, leaf.scale]}
        >
          <primitive object={leafGeometry} attach="geometry" />
          <meshToonMaterial color={leaf.color} gradientMap={gradientTexture} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {structure.blooms.map((bloom, index) => (
        <mesh
          key={`bloom-${plant.id}-${index}`}
          position={bloom.position}
          rotation={bloom.rotation}
          scale={[bloom.scale, bloom.scale, bloom.scale]}
        >
          <primitive object={bloomGeometry} attach="geometry" />
          <meshToonMaterial color={bloom.color} gradientMap={gradientTexture} />
        </mesh>
      ))}
    </group>
  );
}

function GreenhouseInterior({
  plants,
  onSoilReady,
}: {
  plants: RuntimePlant[];
  onSoilReady?: (mesh: THREE.Mesh) => void;
}) {
  return (
    <>
      <Layer color="#f2ede4" outline="#d1c8bc" position={[0, 0, -2.4]} size={[26, 16]} />
      <Layer color="#e0d7cb" outline="#c3b9aa" position={[0, 0.02, -1.4]} size={[20, 12]} />
      <Layer color="#d6cec2" outline="#b3aa9f" position={[0, 0.01, -0.7]} size={[15, 9]} />

      <SoilPlane onReady={onSoilReady} />

      <MarbleTable />
      <Backpack />

      {plants.map((plant) => (
        <ProceduralPlant key={plant.id} plant={plant} />
      ))}

      <DustParticles />
    </>
  );
}

export function GreenhouseScene({ plants, onSoilReady, dropRequest, onDropResolved }: GreenhouseSceneProps) {
  const [soilMesh, setSoilMesh] = useState<THREE.Mesh | null>(null);

  const handleSoilReady = (mesh: THREE.Mesh) => {
    setSoilMesh(mesh);
    onSoilReady?.(mesh);
  };

  const handleDrop = (result: DropResult) => {
    onDropResolved?.(result);
  };

  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, cameraDistance], zoom: 60 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#f7f2ea']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} color="#fff9f4" />
      <Suspense fallback={null}>
        <GreenhouseInterior plants={plants} onSoilReady={handleSoilReady} />
      </Suspense>
      <DropProjector request={dropRequest} soil={soilMesh} onComplete={handleDrop} />
      <CameraRig />
    </Canvas>
  );
}

export default GreenhouseScene;
