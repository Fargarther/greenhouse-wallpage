"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import clsx from "clsx";

import { useSeeds } from "@/store/SeedsContext";
import type { Mood, SeedType } from "@/lib/types";

const seedSchema = z.object({
  title: z.string().min(1, "Title is required").max(80, "Keep it under 80 characters"),
  type: z.enum(["note", "dream", "recipe", "idea"]),
  mood: z.enum(["neutral", "calm", "excited", "melancholy", "curious"]),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

const defaultValues = {
  title: "",
  type: "note" as SeedType,
  mood: "neutral" as Mood,
  tags: "",
  notes: "",
};

type FormValues = typeof defaultValues;

type FormErrors = Partial<Record<keyof FormValues, string>>;

function parseTags(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function SeedForm() {
  const { addSeed } = useSeeds();
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<string | null>(null);

  const liveMessage = useMemo(() => status ?? "", [status]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const result = seedSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0];
        if (typeof field === "string") {
          fieldErrors[field as keyof FormValues] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const cleaned = result.data;
    addSeed({
      title: cleaned.title.trim(),
      type: cleaned.type,
      mood: cleaned.mood,
      tags: parseTags(cleaned.tags),
      body: cleaned.notes?.trim() ? cleaned.notes.trim() : undefined,
    });

    setErrors({});
    setValues(defaultValues);
    setStatus(`Seed planted: "${cleaned.title.trim()}".`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-emerald-200 bg-white/80 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur"
    >
      <div>
        <label htmlFor="seed-title" className="block text-sm font-medium text-emerald-900">
          Seed Title
        </label>
        <input
          id="seed-title"
          name="title"
          value={values.title}
          onChange={handleChange}
          required
          maxLength={80}
          className={clsx(
            "mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400",
            errors.title && "border-red-400 focus:ring-red-500",
          )}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "seed-title-error" : undefined}
        />
        {errors.title && (
          <p id="seed-title-error" className="mt-1 text-sm text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="seed-type" className="block text-sm font-medium text-emerald-900">
            Type
          </label>
          <select
            id="seed-type"
            name="type"
            value={values.type}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="note">Note</option>
            <option value="dream">Dream</option>
            <option value="recipe">Recipe</option>
            <option value="idea">Idea</option>
          </select>
        </div>
        <div>
          <label htmlFor="seed-mood" className="block text-sm font-medium text-emerald-900">
            Mood
          </label>
          <select
            id="seed-mood"
            name="mood"
            value={values.mood}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="neutral">Neutral</option>
            <option value="calm">Calm</option>
            <option value="excited">Excited</option>
            <option value="melancholy">Melancholy</option>
            <option value="curious">Curious</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="seed-tags" className="block text-sm font-medium text-emerald-900">
          Tags <span className="text-emerald-600">(comma separated)</span>
        </label>
        <input
          id="seed-tags"
          name="tags"
          value={values.tags}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="memory, gratitude"
        />
      </div>

      <div>
        <label htmlFor="seed-notes" className="block text-sm font-medium text-emerald-900">
          Notes
        </label>
        <textarea
          id="seed-notes"
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Plant Seed
        </button>
        <span className="text-xs text-emerald-700/70">Seeds grow only when you care for them.</span>
      </div>

      <p aria-live="polite" className="text-sm text-emerald-700" role="status">
        {liveMessage}
      </p>
    </form>
  );
}


