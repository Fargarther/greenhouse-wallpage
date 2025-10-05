"use client";

import { useMemo } from "react";

import { PlantSVG } from "@/components/PlantSVG";
import { hashString, mulberry32, randIn } from "@/lib/hash";
import type { Seed } from "@/lib/types";

interface CozyShelfSceneProps {
  seeds: Seed[];
  staticMode?: boolean;
  onGrow?: (id: string) => void;
  showGrowHints?: boolean;
}

type RowKey = "top" | "middle" | "bottom";

interface Placement {
  seed: Seed;
  leftPercent: number;
  topPercent: number;
  size: number;
  row: RowKey;
}

interface RowLayout {
  baseline: number;
  baseSize: number;
  growthBoost: number;
  xPositions: number[];
}

interface LayoutConfig {
  width: number;
  height: number;
  horizontalPadding: number;
  rows: Record<RowKey, RowLayout>;
}

const layout: LayoutConfig = {
  width: 1200,
  height: 720,
  horizontalPadding: 120,
  rows: {
    top: {
      baseline: 230,
      baseSize: 150,
      growthBoost: 60,
      xPositions: [0.18, 0.36, 0.54, 0.72, 0.86],
    },
    middle: {
      baseline: 360,
      baseSize: 180,
      growthBoost: 70,
      xPositions: [0.16, 0.32, 0.48, 0.64, 0.8],
    },
    bottom: {
      baseline: 555,
      baseSize: 210,
      growthBoost: 90,
      xPositions: [0.12, 0.28, 0.44, 0.6, 0.76, 0.9],
    },
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function assignRows(seeds: Seed[]): Record<RowKey, Seed[]> {
  const cycle: RowKey[] = ["bottom", "middle", "bottom", "top"];
  const buckets: Record<RowKey, Seed[]> = {
    top: [],
    middle: [],
    bottom: [],
  };

  seeds.forEach((seed, index) => {
    const rowKey = cycle[index % cycle.length];
    buckets[rowKey].push(seed);
  });

  return buckets;
}

function computePlacements(seeds: Seed[]): Placement[] {
  const filtered = seeds.filter((seed) => !seed.deleted);
  if (filtered.length === 0) {
    return [];
  }

  const ordered = [...filtered].sort((a, b) => hashString(a.id) - hashString(b.id));
  const buckets = assignRows(ordered);
  const placements: Placement[] = [];

  (Object.keys(buckets) as RowKey[]).forEach((rowKey) => {
    const rowSeeds = buckets[rowKey];
    const row = layout.rows[rowKey];
    if (rowSeeds.length === 0) {
      return;
    }

    rowSeeds.forEach((seed, index) => {
      const rng = mulberry32(hashString(`${seed.id}-${rowKey}`));
      const growthFactor = clamp(seed.growth / 100, 0, 1);
      const size = row.baseSize + growthFactor * row.growthBoost;
      const slotIndex = index % row.xPositions.length;
      const wraps = Math.floor(index / row.xPositions.length);
      const jitter = (rng() - 0.5) * (0.05 + wraps * 0.02);
      const baseRatio = row.xPositions[slotIndex];
      const xRatio = clamp(baseRatio + jitter, 0.08, 0.92);
      const baselineOffset = randIn(rng(), -10, 8);
      const top = row.baseline + baselineOffset - size;

      placements.push({
        seed,
        row: rowKey,
        leftPercent: xRatio * 100,
        topPercent: (top / layout.height) * 100,
        size,
      });
    });
  });

  return placements.sort((a, b) => (a.row === b.row ? a.leftPercent - b.leftPercent : a.row === "bottom" ? 1 : -1));
}

export function CozyShelfScene({ seeds, staticMode = false, onGrow, showGrowHints = false }: CozyShelfSceneProps) {
  const placements = useMemo(() => computePlacements(seeds), [seeds]);

  return (
    <div className="relative h-full w-full min-h-[720px] overflow-hidden rounded-[3rem] bg-emerald-100/80 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200" />

      <div className="absolute inset-0">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 720" aria-hidden="true">
          <defs>
            <pattern id="mosaic" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none" />
              <circle cx="12" cy="14" r="9" fill="rgba(222, 237, 228, 0.6)" />
              <circle cx="28" cy="6" r="9" fill="rgba(202, 219, 208, 0.5)" />
              <circle cx="30" cy="28" r="10" fill="rgba(200, 214, 202, 0.45)" />
              <circle cx="8" cy="30" r="11" fill="rgba(210, 228, 214, 0.55)" />
            </pattern>
          </defs>
          <path
            d="M0 720 V180 Q0 0 600 0 Q1200 0 1200 180 V720 Z M140 720 V220 Q140 60 600 60 Q1060 60 1060 220 V720 Z"
            fill="url(#mosaic)"
            fillRule="evenodd"
            opacity="0.65"
          />
        </svg>
      </div>

      <div className="absolute inset-12 rounded-[280px] bg-gradient-to-br from-emerald-200/40 via-emerald-100 to-emerald-200/70" />

      <div className="absolute left-1/2 top-[16%] h-[240px] w-[420px] -translate-x-1/2 rounded-[3rem] border border-emerald-300/70 bg-gradient-to-b from-sky-100 via-sky-50 to-sky-100 shadow-inner">
        <div className="absolute inset-[14%] rounded-[2.5rem] border border-white/60" />
        <div className="absolute inset-x-[48%] top-0 h-full border-l border-white/50" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/50" />
        <div className="absolute left-0 right-0 top-[20%] h-px bg-white/30" />
      </div>

      <div className="absolute left-24 right-24 top-[38%] h-5 rounded-full bg-[#a26c3c] shadow-[0_22px_35px_-20px_rgba(50,35,10,0.45)]" />
      <div className="absolute left-28 right-28 top-[52%] h-5 rounded-full bg-[#b7773f] shadow-[0_24px_36px_-20px_rgba(52,32,12,0.4)]" />

      <div className="absolute left-24 right-24 bottom-[136px] h-32 rounded-[2.5rem] bg-gradient-to-br from-white via-white to-emerald-50 shadow-[0_35px_60px_-28px_rgba(20,30,20,0.45)]">
        <div className="absolute inset-0 rounded-[2.5rem] border border-emerald-200/60" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 140" aria-hidden="true">
          <path
            d="M0 102 Q220 72 400 94 T800 102"
            fill="none"
            stroke="rgba(120,140,132,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="absolute bottom-24 left-20 h-40 w-40 rounded-[26px] bg-emerald-400/75 shadow-[0_32px_48px_-22px_rgba(20,50,30,0.45)]">
        <div className="absolute inset-4 rounded-[20px] border-2 border-emerald-500/50" />
        <div className="absolute inset-x-6 bottom-6 h-3 rounded-full bg-emerald-600/40" />
      </div>

      <div className="absolute bottom-[72px] right-28 h-36 w-16 rounded-[26px] bg-emerald-500/80 shadow-[0_26px_42px_-20px_rgba(12,42,24,0.5)]" />
      <div className="absolute bottom-12 right-60 h-48 w-18 rounded-[32px] bg-[#c9934d]/85 shadow-[0_30px_40px_-24px_rgba(80,40,10,0.4)]" />

      <div className="absolute bottom-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border-4 border-[#d8b077]/70" />
      <div className="absolute bottom-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full border-4 border-[#e5c08a]/60" />

      <div className="absolute left-16 top-[40%] h-[180px] w-[150px] rounded-[26px] border-4 border-emerald-300/70 bg-emerald-200/35">
        <div className="absolute inset-4 grid grid-cols-2 gap-3 p-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[14px] border border-emerald-300/60 bg-emerald-100/70" />
          ))}
        </div>
      </div>

      <div className="absolute right-20 top-[32%] flex flex-col gap-6">
        <div className="h-16 w-36 rounded-[18px] bg-[#b7773f] shadow-[0_22px_28px_-18px_rgba(60,35,12,0.4)]" />
        <div className="h-16 w-40 rounded-[18px] bg-[#b7773f] shadow-[0_22px_28px_-18px_rgba(60,35,12,0.4)]" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col items-stretch">
        <div className="relative flex-1">
          {placements.map((entry) => {
            const tone = entry.seed.mood === "melancholy" ? "stone" : "terracotta";
            const plant = (
              <PlantSVG
                seed={entry.seed}
                size={entry.size}
                staticMode={staticMode}
                withPot
                potTone={tone}
              />
            );

            return (
              <div
                key={entry.seed.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${entry.leftPercent}%`,
                  top: `${entry.topPercent}%`,
                  width: entry.size,
                  transform: "translate(-50%, 0)",
                }}
              >
                {onGrow ? (
                  <button
                    type="button"
                    onClick={() => onGrow(entry.seed.id)}
                    className="group relative w-full rounded-[2.5rem] bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    aria-label={`Grow ${entry.seed.title}`}
                  >
                    <span className="visually-hidden">Grow {entry.seed.title}</span>
                    {plant}
                  </button>
                ) : (
                  plant
                )}
                {showGrowHints && onGrow && (
                  <button
                    type="button"
                    onClick={() => onGrow(entry.seed.id)}
                    className="mt-2 inline-flex items-center rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    🌱 Grow
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

