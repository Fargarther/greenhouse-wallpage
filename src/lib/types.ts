export type SeedType = "note" | "dream" | "recipe" | "idea";

export type Mood = "neutral" | "calm" | "excited" | "melancholy" | "curious";

export type CareEventType = "water" | "reflect";

export interface Seed {
  id: string;
  title: string;
  body?: string;
  tags: string[];
  type: SeedType;
  mood: Mood;
  createdAt: number;
  edits: number;
  growth: number;
  deleted?: boolean;
}

export type SeedInput = Omit<Seed, "id" | "createdAt" | "edits" | "deleted" | "growth">;


