"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { nanoid } from "nanoid";

import type { CareEventType, Seed, SeedInput } from "@/lib/types";
import { loadSeeds, onSeedsStorageChange, saveSeeds } from "@/lib/storage";

interface CarePayload {
  text?: string;
}

type SeedsAction =
  | { type: "hydrate"; seeds: Seed[] }
  | { type: "add"; seed: Seed }
  | { type: "update"; id: string; updates: Partial<Seed> }
  | { type: "remove"; id: string }
  | { type: "undo-remove"; id: string }
  | { type: "care"; id: string; careType: CareEventType; payload?: CarePayload };

interface SeedsContextValue {
  seeds: Seed[];
  addSeed: (input: SeedInput) => Seed;
  updateSeed: (id: string, updates: Partial<Seed>) => void;
  removeSeed: (id: string) => void;
  undoRemoveSeed: (id: string) => void;
  careForSeed: (id: string, careType: CareEventType, payload?: CarePayload) => void;
}

const SeedsContext = createContext<SeedsContextValue | undefined>(undefined);

function clampGrowth(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatReflectEntry(text: string): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  return `[${stamp}] ${text}`.trim();
}

function growthDeltaForCare(careType: CareEventType, payload?: CarePayload): number {
  if (careType === "water") {
    return 3;
  }

  const note = (payload?.text ?? "").trim();
  const length = note.length;

  if (length >= 300) return 20;
  if (length >= 120) return 16;
  if (length >= 40) return 12;
  return 8;
}

function seedsReducer(state: Seed[], action: SeedsAction): Seed[] {
  switch (action.type) {
    case "hydrate": {
      if (!Array.isArray(action.seeds)) {
        return state;
      }
      return action.seeds;
    }
    case "add": {
      return [action.seed, ...state];
    }
    case "update": {
      return state.map((seed) => {
        if (seed.id !== action.id) {
          return seed;
        }
        return {
          ...seed,
          ...action.updates,
          edits: seed.edits + 1,
        };
      });
    }
    case "remove": {
      return state.map((seed) =>
        seed.id === action.id
          ? {
              ...seed,
              deleted: true,
              edits: seed.edits + 1,
            }
          : seed,
      );
    }
    case "undo-remove": {
      return state.map((seed) =>
        seed.id === action.id
          ? {
              ...seed,
              deleted: false,
              edits: seed.edits + 1,
            }
          : seed,
      );
    }
    case "care": {
      return state.map((seed) => {
        if (seed.id !== action.id || seed.deleted) {
          return seed;
        }

        const delta = growthDeltaForCare(action.careType, action.payload);
        const nextGrowth = clampGrowth(seed.growth + delta);

        if (action.careType === "reflect") {
          const entry = formatReflectEntry(action.payload?.text ?? "");
          const nextBody = entry ? `${entry}\n${seed.body ?? ""}`.trim() : seed.body;
          return {
            ...seed,
            body: nextBody,
            growth: nextGrowth,
            edits: seed.edits + 1,
          };
        }

        return {
          ...seed,
          growth: nextGrowth,
          edits: seed.edits + 1,
        };
      });
    }
    default:
      return state;
  }
}

const initialState: Seed[] = [];

export function SeedsProvider({ children }: { children: ReactNode }) {
  const [seeds, dispatch] = useReducer(seedsReducer, initialState);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    const saved = loadSeeds<Seed>();
    dispatch({ type: "hydrate", seeds: saved });
    isHydratedRef.current = true;

    return onSeedsStorageChange((payload) => {
      if (!Array.isArray(payload)) {
        return;
      }
      dispatch({ type: "hydrate", seeds: payload as Seed[] });
    });
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) {
      return;
    }
    saveSeeds(seeds);
  }, [seeds]);

  const value = useMemo<SeedsContextValue>(() => {
    const addSeed = (input: SeedInput): Seed => {
      const seed: Seed = {
        ...input,
        id: nanoid(),
        createdAt: Date.now(),
        edits: 0,
        growth: 0,
      };
      dispatch({ type: "add", seed });
      return seed;
    };

    const updateSeed = (id: string, updates: Partial<Seed>) => {
      dispatch({ type: "update", id, updates });
    };

    const removeSeed = (id: string) => {
      dispatch({ type: "remove", id });
    };

    const undoRemoveSeed = (id: string) => {
      dispatch({ type: "undo-remove", id });
    };

    const careForSeed = (id: string, careType: CareEventType, payload?: CarePayload) => {
      dispatch({ type: "care", id, careType, payload });
    };

    return {
      seeds,
      addSeed,
      updateSeed,
      removeSeed,
      undoRemoveSeed,
      careForSeed,
    };
  }, [seeds]);

  return <SeedsContext.Provider value={value}>{children}</SeedsContext.Provider>;
}

export function useSeeds(): SeedsContextValue {
  const context = useContext(SeedsContext);
  if (!context) {
    throw new Error("useSeeds must be used within a SeedsProvider");
  }
  return context;
}

