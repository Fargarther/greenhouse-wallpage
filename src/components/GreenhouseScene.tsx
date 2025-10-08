'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Float } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

type LayerProps = {
  color: string;
  position: [number, number, number];
  size: [number, number];
  outline?: string;
};

type PlantProps = {
  baseColor: string;
  highlightColor: string;
  position: [number, number, number];
  scale?: number;
  swayOffset?: number;
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

function Layer({ color, position, size, outline }: LayerProps) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshToonMaterial color={color} gradientMap={gradientTexture} />
      {outline ? <Edges linewidth={1} color={outline} /> : null}
    </mesh>
  );
}

function MarbleTable() {
  return (
    <group position={[0, -0.65, 0]}>
      <mesh position={[0, 0.2, 0]} scale={[2.8, 0.36, 1.6]}>
        <boxGeometry />
        <meshToonMaterial color="#f1eae2" gradientMap={gradientTexture} />
        <Edges color="#cfc3b6" />
      </mesh>
      <mesh position={[0, 0.42, 0]} scale={[3.1, 0.08, 1.9]}>
        <boxGeometry />
        <meshToonMaterial color="#e8dfd3" gradientMap={gradientTexture} />
        <Edges color="#cfc3b6" />
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
        <Edges color="#5b4238" />
      </mesh>
      <mesh position={[0, 0.12, -0.18]} scale={[0.58, 0.24, 0.12]}>
        <boxGeometry />
        <meshToonMaterial color="#ae8573" gradientMap={gradientTexture} />
        <Edges color="#5b4238" />
      </mesh>
    </group>
  );
}

function Plant({ baseColor, highlightColor, position, scale = 1, swayOffset = 0 }: PlantProps) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!group.current) return;

    const sway = Math.sin(t / 3 + swayOffset) * 0.06;
    const bob = Math.sin(t / 4 + swayOffset) * 0.04;
    group.current.rotation.z = sway;
    group.current.position.y = position[1] + bob;
  });

  return (
    <group ref={group} position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.4, 0]} scale={[0.16, 0.8, 0.02]}>
        <boxGeometry />
        <meshToonMaterial color={baseColor} gradientMap={gradientTexture} />
      </mesh>
      <mesh position={[0, 0.85, 0]} scale={[0.4, 0.45, 0.02]}>
        <boxGeometry />
        <meshToonMaterial color={highlightColor} gradientMap={gradientTexture} />
      </mesh>
    </group>
  );
}

function DustParticles({ count = 28, area = [6, 4, 1.5] }: DustProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      return {
        offset: index * 0.2,
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
        <Float
          key={index}
          speed={particle.speed}
          rotationIntensity={0.1}
          floatIntensity={0.05}
          floatingRange={[0.04, 0.08]}
        >
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

function GreenhouseInterior() {
  return (
    <>
      <Layer color="#f2ede4" outline="#d1c8bc" position={[0, 0, -2.4]} size={[26, 16]} />
      <Layer color="#e0d7cb" outline="#c3b9aa" position={[0, 0.02, -1.4]} size={[20, 12]} />
      <Layer color="#d6cec2" outline="#b3aa9f" position={[0, 0.01, -0.7]} size={[15, 9]} />

      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshToonMaterial color="#eae3d8" gradientMap={gradientTexture} />
        <Edges color="#cfc3b6" />
      </mesh>

      <MarbleTable />
      <Backpack />

      <group position={[-1.6, -0.2, 0.25]}>
        <Plant baseColor="#88a88f" highlightColor="#a2c0a5" position={[0, 0, 0]} swayOffset={0} />
        <Plant
          baseColor="#7c9f8a"
          highlightColor="#b1cbb2"
          position={[0.38, 0.25, -0.12]}
          scale={0.95}
          swayOffset={1.2}
        />
      </group>

      <group position={[0.55, -0.18, 0.32]}>
        <Plant
          baseColor="#90b19c"
          highlightColor="#bfd7c5"
          position={[0, 0, 0]}
          scale={1.15}
          swayOffset={2.1}
        />
        <Plant
          baseColor="#7fa48f"
          highlightColor="#b7d1bc"
          position={[-0.34, 0.16, -0.12]}
          scale={0.88}
          swayOffset={2.7}
        />
      </group>

      <DustParticles />
    </>
  );
}

export function GreenhouseScene() {
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
        <GreenhouseInterior />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}

export default GreenhouseScene;
