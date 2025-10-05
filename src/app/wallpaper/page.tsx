"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ArtStyleProvider } from "@/components/ArtStyleProvider";
import { CozyShelfScene } from "@/components/scenes/CozyShelfScene";
import { PlantSVG } from "@/components/PlantSVG";
import { SeedsProvider, useSeeds } from "@/store/SeedsContext";
import type { Seed } from "@/lib/types";

const SCENES = {
  "cozy-shelf": CozyShelfScene,
} as const;

type SceneKey = keyof typeof SCENES;

export default function WallpaperPage() {
  return (
    <Suspense fallback={<WallpaperFallback />}>
      <WallpaperClient />
    </Suspense>
  );
}

function WallpaperFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-100 text-emerald-800">
      <p role="status" className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-medium">
        Loading garden wallpaper...
      </p>
    </div>
  );
}

function WallpaperClient() {
  const searchParams = useSearchParams();
  const sceneParam = (searchParams?.get("scene") ?? "cozy-shelf").toLowerCase() as SceneKey | "grid";
  const sceneKey: SceneKey | "grid" = sceneParam in SCENES ? (sceneParam as SceneKey) : "grid";
  const styleParam = searchParams?.get("style")?.toLowerCase() ?? (sceneKey === "cozy-shelf" ? "cozy-shelf" : "monoline");
  const uiEnabled = searchParams?.get("ui") === "1";
  const animateParam = searchParams?.get("animate");
  const forceStatic = animateParam === "0";
  const animateDefault = forceStatic ? false : animateParam === "1" || animateParam === null;

  return (
    <SeedsProvider>
      <ArtStyleProvider styleName={styleParam}>
        <WallpaperContent
          sceneKey={sceneKey}
          forceStatic={forceStatic}
          uiEnabled={uiEnabled}
          animateDefault={animateDefault}
        />
      </ArtStyleProvider>
    </SeedsProvider>
  );
}

interface WallpaperContentProps {
  sceneKey: SceneKey | "grid";
  forceStatic: boolean;
  uiEnabled: boolean;
  animateDefault: boolean;
}

function WallpaperContent({ sceneKey, forceStatic, uiEnabled, animateDefault }: WallpaperContentProps) {
  const { seeds, careForSeed } = useSeeds();
  const [animatePlants, setAnimatePlants] = useState(forceStatic ? false : animateDefault);

  useEffect(() => {
    setAnimatePlants(forceStatic ? false : animateDefault);
  }, [animateDefault, forceStatic]);

  const SceneComponent = useMemo(() => {
    if (sceneKey === "grid") {
      return SimpleGridScene;
    }
    return SCENES[sceneKey];
  }, [sceneKey]);

  const growAll = () => {
    seeds.forEach((seed) => {
      careForSeed(seed.id, "water");
    });
  };

  const handleGrow = (id: string) => {
    careForSeed(id, "water");
  };

  const activeSeeds = useMemo(() => seeds.filter((seed) => !seed.deleted), [seeds]);
  const effectiveStatic = forceStatic ? true : !animatePlants;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-200/60 via-emerald-100 to-emerald-200/70 p-6">
      {uiEnabled && (
        <Toolbar
          onGrowAll={growAll}
          animate={animatePlants}
          onAnimateChange={setAnimatePlants}
          disabled={!activeSeeds.length}
          forceStatic={forceStatic}
        />
      )}
      <div className="w-full max-w-[1200px]">
        <SceneComponent
          seeds={activeSeeds}
          staticMode={effectiveStatic}
          onGrow={handleGrow}
          showGrowHints={uiEnabled}
        />
      </div>
    </div>
  );
}

interface ToolbarProps {
  onGrowAll: () => void;
  animate: boolean;
  onAnimateChange: (next: boolean) => void;
  disabled: boolean;
  forceStatic: boolean;
}

function Toolbar({ onGrowAll, animate, onAnimateChange, disabled, forceStatic }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Wallpaper controls"
      className="fixed left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm text-emerald-900 shadow-lg backdrop-blur"
    >
      <button
        type="button"
        onClick={onGrowAll}
        disabled={disabled}
        className="rounded-full bg-emerald-600 px-4 py-1.5 font-semibold text-white shadow-sm transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        Grow all
      </button>
      <label className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-emerald-300"
          checked={!forceStatic && animate}
          onChange={(event) => onAnimateChange(event.target.checked)}
          disabled={forceStatic}
        />
        Animate plants
      </label>
    </div>
  );
}

interface SimpleGridSceneProps {
  seeds: Seed[];
  staticMode: boolean;
  onGrow: (id: string) => void;
  showGrowHints: boolean;
}

function SimpleGridScene({ seeds, staticMode, onGrow, showGrowHints }: SimpleGridSceneProps) {
  return (
    <div className="grid grid-cols-1 gap-6 rounded-[3rem] bg-emerald-50/70 p-8 shadow-2xl md:grid-cols-2 lg:grid-cols-3">
      {seeds.length === 0 && (
        <p className="col-span-full rounded-2xl border border-dashed border-emerald-300 bg-white/70 p-6 text-sm text-emerald-800">
          No seeds planted yet. Add seeds in the main garden view.
        </p>
      )}
      {seeds.map((seed) => (
        <div key={seed.id} className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => onGrow(seed.id)}
            className="group rounded-[2.5rem] bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            aria-label={`Grow ${seed.title}`}
          >
            <span className="visually-hidden">Grow {seed.title}</span>
            <PlantSVG
              seed={seed}
              size={220}
              staticMode={staticMode}
              withPot
              potTone={seed.mood === "melancholy" ? "stone" : "terracotta"}
            />
          </button>
          <div className="text-center text-sm text-emerald-800">
            <p className="font-semibold">{seed.title}</p>
            <p>{Math.round(seed.growth)}% grown</p>
          </div>
          {showGrowHints && (
            <button
              type="button"
              onClick={() => onGrow(seed.id)}
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              🌱 Grow
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
