import { Suspense } from 'react';
import GreenhouseScene from '@/components/GreenhouseScene';

export default function HomePage() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-[var(--mg-background)]">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[var(--mg-background)]">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--mg-muted)]">Warming the greenhouse…</p>
          </div>
        }
      >
        <GreenhouseScene />
      </Suspense>
    </main>
  );
}
