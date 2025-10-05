"use client";

import { ArtStyleProvider } from "@/components/ArtStyleProvider";
import { GrainOverlay } from "@/components/GrainOverlay";
import { GardenGrid } from "@/components/GardenGrid";
import { SeedForm } from "@/components/SeedForm";
import { SeedsProvider } from "@/store/SeedsContext";

export function GardenApp() {
  return (
    <SeedsProvider>
      <ArtStyleProvider styleName="cozy-shelf">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-emerald-100/60 to-emerald-200/40 p-8 shadow-xl">
          <GrainOverlay className="mix-blend-soft-light opacity-60" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
            <div className="space-y-6">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700/80">The Memory Garden</p>
                <h2 className="text-3xl font-bold text-emerald-950">Plant a seed and nurture it with care.</h2>
                <p className="text-sm text-emerald-800/80">
                  Each seed grows only when you water or reflect on it. The garden remembers your tending and stays put between visits.
                </p>
              </header>
              <SeedForm />
            </div>
            <GardenGrid />
          </div>
        </div>
      </ArtStyleProvider>
    </SeedsProvider>
  );
}

