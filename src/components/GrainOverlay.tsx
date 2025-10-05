"use client";

import { useId } from "react";
import clsx from "clsx";

import { useArtStyle } from "@/components/ArtStyleProvider";

interface GrainOverlayProps {
  className?: string;
}

export function GrainOverlay({ className }: GrainOverlayProps) {
  const tokens = useArtStyle();
  const id = useId();

  if (!tokens.grain?.enabled) {
    return null;
  }

  const filterId = `${id}-grain`;

  return (
    <svg
      aria-hidden="true"
      className={clsx("pointer-events-none absolute inset-0 opacity-70", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence baseFrequency="0.9" numOctaves="3" type="fractalNoise" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
        </filter>
      </defs>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${filterId})`}
        style={{ opacity: tokens.grain.opacity }}
        fill="currentColor"
      />
    </svg>
  );
}

