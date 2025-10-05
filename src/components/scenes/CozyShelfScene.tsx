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

interface LayoutConfig {
  width: number;
  height: number;
  horizontalPadding: number;
  rows: Record<RowKey, { baseline: number }>;
}

const layout: LayoutConfig = {
  width: 1200,
  height: 720,
  horizontalPadding: 140,
  rows: {
    top: { baseline: 210 },
    middle: { baseline: 350 },
    bottom: { baseline: 560 },
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computePlacements(seeds: Seed[]): Placement[] {
  const filtered = seeds.filter((seed) => !seed.deleted);
  const ordered = [...filtered].sort((a, b) => hashString(a.id) - hashString(b.id));

  const buckets: Record<RowKey, Seed[]> = {
    top: [],
    middle: [],
    bottom: [],
  };

  ordered.forEach((seed, index) => {
    const bucket = index % 3;
    if (bucket === 0) buckets.top.push(seed);
    else if (bucket === 1) buckets.middle.push(seed);
    else buckets.bottom.push(seed);
  });

  const placements: Placement[] = [];

  (Object.keys(buckets) as RowKey[]).forEach((rowKey) => {
    const rowSeeds = buckets[rowKey];
    const row = layout.rows[rowKey];
    const slotCount = rowSeeds.length;

    rowSeeds.forEach((seed, index) => {
      const baseRandom = mulberry32(hashString(`${seed.id}-${rowKey}`));
      const growthFactor = clamp(seed.growth / 100, 0, 1);
      const baseSize = rowKey === "bottom" ? 200 : rowKey === "middle" ? 180 : 160;
      const size = baseSize + growthFactor * 90;
      const ratio = slotCount > 1 ? index / (slotCount - 1) : 0.5;
      const jitter = (baseRandom() - 0.5) * 0.18;
      const paddingRatio = layout.horizontalPadding / layout.width;
      const xRatio = clamp(paddingRatio + ratio * (1 - paddingRatio * 2) + jitter, 0.12, 0.88);
      const baseline = row.baseline + randIn(baseRandom(), -6, 4);
      const top = baseline - size;

      placements.push({
        seed,
        row: rowKey,
        leftPercent: xRatio * 100,
        topPercent: (top / layout.height) * 100,
        size,
      });
    });
  });

  return placements;
}

export function CozyShelfScene({ seeds, staticMode = false, onGrow, showGrowHints = false }: CozyShelfSceneProps) {
  const placements = useMemo(() => computePlacements(seeds), [seeds]);

  return (
    <div className="relative h-full w-full min-h-[720px] overflow-hidden rounded-[3rem] bg-emerald-100/80 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/60 via-emerald-100 to-emerald-200/70" />

      <div className="absolute inset-x-10 top-8 h-[540px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 540" aria-hidden="true">
          <defs>
            <pattern id="tile-dots" width="28" height="24" patternUnits="userSpaceOnUse">
              <circle cx="6" cy="6" r="2.2" fill="rgba(255,255,255,0.35)" />
              <circle cx="20" cy="12" r="2.2" fill="rgba(255,255,255,0.2)" />
              <circle cx="6" cy="18" r="2.2" fill="rgba(255,255,255,0.28)" />
            </pattern>
          </defs>
          <path
            d="M0 540 V190 Q0 0 400 0 Q800 0 800 190 V540 Z M96 540 V210 Q96 68 400 68 Q704 68 704 210 V540 Z"
            fill="url(#tile-dots)"
            fillRule="evenodd"
            opacity="0.4"
          />
        </svg>
        <div className="absolute inset-6 rounded-[260px] bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 shadow-[0_40px_90px_-40px_rgba(32,64,36,0.55)]" />
        <div className="absolute left-1/2 top-[18%] h-[220px] w-[360px] -translate-x-1/2 rounded-[3rem] border border-emerald-200/60 bg-gradient-to-b from-sky-100 via-sky-50 to-sky-100 shadow-inner">
          <div className="absolute inset-[14%] rounded-[2.2rem] border border-white/50" />
          <div className="absolute inset-x-[48%] top-0 h-full border-l border-white/50" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/40" />
        </div>
      </div>

      <div className="absolute left-24 right-24 top-[43%] h-4 rounded-full bg-emerald-300/80 shadow-[0_16px_24px_-16px_rgba(15,40,24,0.4)]" />
      <div className="absolute left-32 right-32 top-[54%] h-4 rounded-full bg-emerald-400/70 shadow-[0_18px_28px_-16px_rgba(15,40,24,0.4)]" />

      <div className="absolute left-20 right-20 bottom-36 h-28 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50 shadow-[0_30px_50px_-20px_rgba(12,30,20,0.35)]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 140" aria-hidden="true">
          <path
            d="M0 94 Q200 64 380 94 T760 94"
            fill="none"
            stroke="rgba(92,112,104,0.25)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="absolute bottom-12 left-16 h-32 w-36 rounded-3xl bg-emerald-400/70 shadow-[0_25px_45px_-18px_rgba(20,40,24,0.45)]" />
      <div className="absolute bottom-14 right-20 h-28 w-14 rounded-[24px] bg-emerald-500/80 shadow-[0_22px_38px_-18px_rgba(10,30,18,0.45)]" />

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
