"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { artPresets } from "@/lib/style";
import type { ArtStyleTokens } from "@/lib/style";

const DEFAULT_STYLE = "cozy-shelf";

const ArtStyleContext = createContext<ArtStyleTokens>(artPresets[DEFAULT_STYLE]);

interface ArtStyleProviderProps {
  styleName?: string;
  children: ReactNode;
}

export function ArtStyleProvider({ styleName = DEFAULT_STYLE, children }: ArtStyleProviderProps) {
  const tokens = useMemo<ArtStyleTokens>(() => artPresets[styleName] ?? artPresets[DEFAULT_STYLE], [styleName]);

  return <ArtStyleContext.Provider value={tokens}>{children}</ArtStyleContext.Provider>;
}

export function useArtStyle(): ArtStyleTokens {
  const value = useContext(ArtStyleContext);
  if (!value) {
    throw new Error("useArtStyle must be used within ArtStyleProvider");
  }
  return value;
}

