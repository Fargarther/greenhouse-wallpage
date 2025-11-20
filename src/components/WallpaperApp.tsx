'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import dynamic from 'next/dynamic';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { nanoid } from 'nanoid';
import type {
  DropRequest,
  DropResult,
  MemoryImportance,
  MemoryMetadata,
  MemoryMood,
  RuntimePlant,
  SpeciesKey,
} from '@/lib/memory-garden/types';
import { getSpeciesMaxStage } from '@/lib/memory-garden/presets';

const GreenhouseScene = dynamic(() => import('@/components/GreenhouseScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--mg-background)]">
      <p className="text-sm uppercase tracking-[0.35em] text-[var(--mg-muted)]">Warming the greenhouse...</p>
    </div>
  ),
});

const SPECIES: Array<{ key: SpeciesKey; label: string; description: string }> = [
  { key: 'fern', label: 'Fern', description: 'Fractal fronds that unfold over time.' },
  { key: 'flower', label: 'Bloom', description: 'Stems that blossom into vibrant petals.' },
  { key: 'vine', label: 'Vine', description: 'Climbing tendrils that seek the skylight.' },
];

const MOODS: Array<{ key: MemoryMood; label: string }> = [
  { key: 'calm', label: 'Calm' },
  { key: 'happy', label: 'Joy' },
  { key: 'melancholy', label: 'Soft' },
  { key: 'celebration', label: 'Glow' },
];

const IMPORTANCE: Array<{ key: MemoryImportance; label: string }> = [
  { key: 'low', label: 'Whisper' },
  { key: 'medium', label: 'Story' },
  { key: 'high', label: 'Legend' },
];

const STORAGE_KEY = 'memory-garden-plants';

const BASE_GROWTH_INTERVAL_MS: Record<SpeciesKey, number> = {
  fern: 1000 * 50,
  flower: 1000 * 60,
  vine: 1000 * 75,
};

function getGrowthInterval(species: SpeciesKey, metadata: MemoryMetadata) {
  let interval = BASE_GROWTH_INTERVAL_MS[species] ?? 1000 * 60;
  switch (metadata.mood) {
    case 'happy':
      interval *= 0.7;
      break;
    case 'calm':
      interval *= 0.85;
      break;
    case 'melancholy':
      interval *= 1.2;
      break;
    case 'celebration':
      interval *= 0.65;
      break;
    default:
      break;
  }
  switch (metadata.importance) {
    case 'high':
      interval *= 0.8;
      break;
    case 'low':
      interval *= 1.25;
      break;
    default:
      break;
  }
  return interval;
}

function computeStageForPlant(plant: RuntimePlant, now: number) {
  const interval = getGrowthInterval(plant.species, plant.metadata);
  if (interval <= 0) return plant.targetStage;
  const elapsed = now - plant.plantedAt;
  const steps = Math.floor(elapsed / interval);
  const stage = 1 + steps;
  return Math.min(stage, plant.targetStage);
}

export default function WallpaperApp() {
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesKey>('fern');
  const [selectedMood, setSelectedMood] = useState<MemoryMood>('calm');
  const [selectedImportance, setSelectedImportance] = useState<MemoryImportance>('medium');
  const [note, setNote] = useState('');
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [plants, setPlants] = useState<RuntimePlant[]>(() => [
    {
      id: 'sample-fern',
      species: 'fern',
      plantedAt: Date.now() - 1000 * 60 * 60 * 24,
      position: [-1.4, -0.6, 0.2],
      metadata: { mood: 'calm', importance: 'medium' },
      growthStage: 4,
      targetStage: 4,
    },
    {
      id: 'sample-flower',
      species: 'flower',
      plantedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      position: [0.2, -0.55, 0.1],
      metadata: { mood: 'happy', importance: 'high' },
      growthStage: 3,
      targetStage: 4,
    },
    {
      id: 'sample-vine',
      species: 'vine',
      plantedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      position: [1.4, -0.7, -0.2],
      metadata: { mood: 'celebration', importance: 'medium' },
      growthStage: 5,
      targetStage: 6,
    },
  ]);
  const [dropRequest, setDropRequest] = useState<DropRequest | null>(null);
  const [isDraggingCan, setIsDraggingCan] = useState(false);
  const [canPosition, setCanPosition] = useState({ x: 96, y: 420 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed: RuntimePlant[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setPlants(parsed);
      }
    } catch (error) {
      console.warn('Failed to load memory garden state', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCanPosition({
      x: Math.min(120, window.innerWidth - 120),
      y: Math.max(window.innerHeight - 180, 160),
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateStages = () => {
      const now = Date.now();
      setPlants((prev) =>
        prev.map((plant) => {
          const computed = computeStageForPlant(plant, now);
          if (computed !== plant.growthStage) {
            return { ...plant, growthStage: computed };
          }
          return plant;
        })
      );
    };
    updateStages();
    const interval = window.setInterval(updateStages, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const speciesCopy = useMemo(() => SPECIES.find((item) => item.key === selectedSpecies), [selectedSpecies]);

  const clampPosition = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };
    return {
      x: Math.min(Math.max(x, 0), window.innerWidth - 96),
      y: Math.min(Math.max(y, 120), window.innerHeight - 96),
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingCan(true);
      dragOffsetRef.current = {
        x: event.clientX - canPosition.x,
        y: event.clientY - canPosition.y,
      };
    },
    [canPosition.x, canPosition.y]
  );

  useEffect(() => {
    if (!isDraggingCan) return;
    const handleMove = (event: PointerEvent) => {
      const next = clampPosition(event.clientX - dragOffsetRef.current.x, event.clientY - dragOffsetRef.current.y);
      setCanPosition(next);
    };
    const handleUp = (event: PointerEvent) => {
      const dropId = nanoid();
      setDropRequest({ id: dropId, screen: { x: event.clientX, y: event.clientY } });
      setIsDraggingCan(false);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
    window.addEventListener('pointercancel', handleUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [clampPosition, isDraggingCan]);

  const handleDropResolved = useCallback(
    (result: DropResult) => {
      setDropRequest((prev) => (prev && prev.id === result.id ? null : prev));
      if (!result.point) return;
      const maxStage = getSpeciesMaxStage(selectedSpecies);
      const importanceDelta = selectedImportance === 'high' ? 1 : selectedImportance === 'low' ? -1 : 0;
      const targetStage = Math.max(1, Math.min(maxStage, maxStage + importanceDelta));
      const plantedAt = Date.now();
      const basePlant: RuntimePlant = {
        id: `seed-${result.id}`,
        species: selectedSpecies,
        plantedAt,
        position: [Number(result.point.x.toFixed(3)), Number(result.point.y.toFixed(3)), Number(result.point.z.toFixed(3))],
        metadata: {
          mood: selectedMood,
          importance: selectedImportance,
          note: note.trim() ? note.trim() : undefined,
        },
        growthStage: 1,
        targetStage,
      };
      const initialStage = computeStageForPlant(basePlant, plantedAt);
      const newPlant = { ...basePlant, growthStage: initialStage };
      setPlants((prev) => [...prev, newPlant]);
      setNote('');
    },
    [note, selectedImportance, selectedMood, selectedSpecies]
  );

  return (
    <main className="relative h-dvh w-dvw select-none overflow-hidden bg-[var(--mg-background)] font-sans">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[var(--mg-background)]">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--mg-muted)]">Preparing greenhouse...</p>
          </div>
        }
      >
        <GreenhouseScene plants={plants} dropRequest={dropRequest} onDropResolved={handleDropResolved} />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsla(110,45%,96%,0.9)]" />

      {isUiVisible ? (
        <aside className="pointer-events-auto absolute right-8 top-8 w-80 rounded-3xl border border-[hsla(158,24%,20%,0.15)] bg-[hsla(0,0%,100%,0.6)] p-6 shadow-xl backdrop-blur-lg transition-opacity duration-500">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--mg-muted)]">Memory Garden</p>
              <h1 className="mt-2 text-lg font-semibold text-[var(--mg-foreground)]">Plant a new memory</h1>
            </div>
            <button
              type="button"
              className="rounded-full border border-[hsla(158,24%,20%,0.2)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--mg-muted)] transition hover:border-[hsla(158,24%,20%,0.4)] hover:text-[var(--mg-foreground)]"
              onClick={() => setIsUiVisible(false)}
            >
              Hide
            </button>
          </header>

          <section className="mt-5 space-y-3">
            {SPECIES.map((species) => {
              const isActive = selectedSpecies === species.key;
              return (
                <button
                  key={species.key}
                  type="button"
                  onClick={() => setSelectedSpecies(species.key)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-100/40 text-emerald-900'
                      : 'border-transparent bg-white/50 text-slate-700 hover:border-[hsla(158,24%,20%,0.2)] hover:bg-white/70'
                  }`}
                >
                  <span className="mt-1">
                    <SparklesIcon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </span>
                  <span>
                    <span className="text-sm font-semibold uppercase tracking-[0.28em]">{species.label}</span>
                    <span className="mt-1 block text-xs text-slate-600">{species.description}</span>
                  </span>
                </button>
              );
            })}
          </section>

          <section className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--mg-muted)]">Mood</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const isActive = selectedMood === mood.key;
                return (
                  <button
                    key={mood.key}
                    type="button"
                    onClick={() => setSelectedMood(mood.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      isActive
                        ? 'bg-emerald-200/70 text-emerald-900'
                        : 'bg-white/70 text-slate-600 hover:bg-white/90 hover:text-emerald-800'
                    }`}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--mg-muted)]">Importance</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {IMPORTANCE.map((importance) => {
                const isActive = selectedImportance === importance.key;
                return (
                  <button
                    key={importance.key}
                    type="button"
                    onClick={() => setSelectedImportance(importance.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      isActive
                        ? 'bg-amber-200/70 text-amber-900'
                        : 'bg-white/70 text-slate-600 hover:bg-white/90 hover:text-amber-800'
                    }`}
                  >
                    {importance.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-[var(--mg-muted)]" htmlFor="memory-note">
              Note
            </label>
            <textarea
              id="memory-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional whisper for this seed..."
              className="mt-2 h-20 w-full resize-none rounded-2xl border border-[hsla(158,24%,20%,0.15)] bg-white/70 p-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </section>

          {speciesCopy ? (
            <footer className="mt-5 rounded-2xl bg-white/70 px-4 py-3 text-xs text-slate-600">
              <p className="uppercase tracking-[0.3em] text-[var(--mg-muted)]">Active Species</p>
              <p className="mt-1 text-sm font-medium text-[var(--mg-foreground)]">{speciesCopy.label}</p>
              <p className="mt-2 leading-relaxed text-slate-600">
                {speciesCopy.description} Drag the watering can over the soil and release to nurture a new memory.
              </p>
            </footer>
          ) : null}
        </aside>
      ) : (
        <button
          type="button"
          className="pointer-events-auto absolute right-8 top-8 rounded-full border border-[hsla(158,24%,20%,0.25)] bg-[hsla(0,0%,100%,0.45)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--mg-muted)] shadow-lg backdrop-blur hover:border-[hsla(158,24%,20%,0.4)] hover:text-[var(--mg-foreground)]"
          onClick={() => setIsUiVisible(true)}
        >
          Show Controls
        </button>
      )}

      <div
        className={`pointer-events-auto absolute left-0 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 select-none ${
          isDraggingCan ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ transform: `translate(${canPosition.x}px, ${canPosition.y}px)` }}
        onPointerDown={handlePointerDown}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full border border-[hsla(158,24%,20%,0.2)] bg-[hsla(158,70%,90%,0.8)] shadow-lg backdrop-blur hover:border-[hsla(158,24%,20%,0.35)]">
          <span className="text-3xl">💧</span>
        </div>
        <p className="mt-1 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--mg-muted)]">Water</p>
      </div>
    </main>
  );
}
