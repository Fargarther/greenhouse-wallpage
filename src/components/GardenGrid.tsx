"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { PlantSVG } from "@/components/PlantSVG";
import { useSeeds } from "@/store/SeedsContext";
import { useRovingFocus } from "@/hooks/useRovingFocus";

export function GardenGrid() {
  const { seeds, careForSeed, removeSeed, undoRemoveSeed } = useSeeds();
  const prefersReducedMotion = useReducedMotion();
  const activeSeeds = useMemo(() => seeds.filter((seed) => !seed.deleted), [seeds]);
  const removedSeeds = useMemo(() => seeds.filter((seed) => seed.deleted), [seeds]);
  const { getRovingProps } = useRovingFocus(activeSeeds.length);
  const [reflectDrafts, setReflectDrafts] = useState<Record<string, string>>({});
  const [openReflect, setOpenReflect] = useState<string | null>(null);

  const handleWater = (id: string) => {
    careForSeed(id, "water");
  };

  const handleReflectChange = (id: string, value: string) => {
    setReflectDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleReflectSubmit = (id: string) => {
    const note = (reflectDrafts[id] ?? "").trim();
    careForSeed(id, "reflect", { text: note });
    setReflectDrafts((prev) => ({ ...prev, [id]: "" }));
    setOpenReflect(null);
  };

  const variants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, scale: 0.96 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      };

  return (
    <section aria-label="Your planted seeds" className="space-y-4">
      {removedSeeds.length > 0 && (() => {
        const lastRemoved = removedSeeds[removedSeeds.length - 1];
        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>
              You have removed {removedSeeds.length} seed{removedSeeds.length > 1 ? "s" : ""}.{' '}
              <button
                type="button"
                onClick={() => undoRemoveSeed(lastRemoved.id)}
                className="font-semibold underline decoration-dotted decoration-amber-600 hover:decoration-solid"
              >
                Undo last remove
              </button>
            </p>
          </div>
        );
      })()}

      <div
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        role="list"
        aria-live="polite"
      >
        <AnimatePresence>
          {activeSeeds.map((seed, index) => {
            const roving = getRovingProps(index);
            const reflectOpen = openReflect === seed.id;
            const draft = reflectDrafts[seed.id] ?? "";

            return (
              <motion.article
                key={seed.id}
                role="listitem"
                layout={!prefersReducedMotion}
                initial={variants?.hidden}
                animate={variants?.visible}
                exit={variants?.exit}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex h-full flex-col justify-between rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur"
                tabIndex={roving.tabIndex}
                onFocus={roving.onFocus}
                onKeyDown={roving.onKeyDown}
                aria-label={`${seed.title}, ${Math.round(seed.growth)} percent grown`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-emerald-900">{seed.title}</h3>
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium uppercase tracking-wide text-emerald-700">
                      {seed.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700/80">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium">Mood: {seed.mood}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1">Care count: {seed.edits}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1">Growth: {Math.round(seed.growth)}%</span>
                  </div>
                  <div className="relative mx-auto max-w-[180px]">
                    <PlantSVG seed={seed} size={180} withPot potTone={seed.mood === "melancholy" ? "stone" : "terracotta"} />
                  </div>
                  {seed.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-emerald-700/80">
                      {seed.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-emerald-100 px-2 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {seed.body && (
                    <p className="rounded-lg bg-emerald-50/60 p-3 text-sm text-emerald-900/80">
                      {seed.body.split("\n")[0]}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100" role="presentation">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${clamp(seed.growth, 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleWater(seed.id)}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                      aria-label={`Water ${seed.title}`}
                    >
                      Water
                    </button>
                    <button
                      type="button"
                      onClick={() => (reflectOpen ? setOpenReflect(null) : setOpenReflect(seed.id))}
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                      aria-expanded={reflectOpen}
                      aria-controls={`reflect-${seed.id}`}
                      aria-label={`Reflect on ${seed.title}`}
                    >
                      Reflect
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSeed(seed.id)}
                      className="inline-flex items-center justify-center rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      aria-label={`Remove ${seed.title}`}
                    >
                      Remove
                    </button>
                  </div>
                  {reflectOpen && (
                    <div id={`reflect-${seed.id}`} className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <label htmlFor={`reflect-text-${seed.id}`} className="text-xs font-medium text-emerald-800">
                        Reflection note
                      </label>
                      <textarea
                        id={`reflect-text-${seed.id}`}
                        value={draft}
                        onChange={(event) => handleReflectChange(seed.id, event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <div className="flex items-center justify-end gap-2 text-xs text-emerald-700/80">
                        <span>{draft.length} chars</span>
                        <button
                          type="button"
                          onClick={() => handleReflectSubmit(seed.id)}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                          aria-label={`Submit reflection for ${seed.title}`}
                        >
                          Save reflection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {activeSeeds.length === 0 && (
        <p className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-sm text-emerald-800">
          Plant your first seed to begin the Memory Garden. Water and reflect to help it grow.
        </p>
      )}
    </section>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}


