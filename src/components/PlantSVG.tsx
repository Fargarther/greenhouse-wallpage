"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { Seed } from "@/lib/types";
import { hashString, mulberry32, randIn } from "@/lib/hash";
import { useArtStyle } from "@/components/ArtStyleProvider";

interface PlantSVGProps {
  seed: Seed;
  size?: number;
  staticMode?: boolean;
  withPot?: boolean;
  potTone?: "terracotta" | "stone";
}

interface LeafSpec {
  cx: number;
  cy: number;
  angle: number;
  length: number;
  width: number;
}

interface StemSpec {
  path: string;
  topX: number;
  topY: number;
  leaves: LeafSpec[];
}

const potPalette = {
  terracotta: {
    body: "hsl(18 60% 58%)",
    lip: "hsl(18 62% 68%)",
    shadow: "hsl(18 40% 38%)",
  },
  stone: {
    body: "hsl(200 10% 70%)",
    lip: "hsl(200 12% 78%)",
    shadow: "hsl(200 6% 52%)",
  },
};

const moodHue: Record<Seed["mood"], number> = {
  neutral: 130,
  calm: 160,
  excited: 95,
  melancholy: 200,
  curious: 50,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function leafPath(shape: "ellipse" | "teardrop" | "diamond", length: number, width: number): string {
  const half = length / 2;
  switch (shape) {
    case "ellipse":
      return `M 0 0 C ${width} ${-half}, ${width} ${-length}, 0 ${-length} C ${-width} ${-length}, ${-width} ${-half}, 0 0 Z`;
    case "diamond":
      return `M 0 0 L ${width} ${-half} L 0 ${-length} L ${-width} ${-half} Z`;
    case "teardrop":
    default:
      return `M 0 0 C ${width * 0.8} ${-half * 0.6}, ${width * 0.6} ${-length}, 0 ${-length} C ${-width * 0.6} ${-length}, ${-width * 0.8} ${-half * 0.6}, 0 0 Z`;
  }
}

function buildStems(seed: Seed, withPot: boolean): StemSpec[] {
  const random = mulberry32(hashString(seed.id));
  const growthFactor = clamp(seed.growth / 100, 0, 1);
  const soilY = withPot ? 148 : 184;
  const stemCount = Math.max(2, Math.round(3 + growthFactor * 3));
  const stems: StemSpec[] = [];

  for (let index = 0; index < stemCount; index += 1) {
    const baseX = randIn(random(), 60, 140);
    const height = randIn(random(), 42, 92) + growthFactor * 60;
    const topY = soilY - height;
    const sway = randIn(random(), -22, 22);
    const ctrl1Y = soilY - height * randIn(random(), 0.35, 0.55);
    const ctrl2Y = soilY - height * randIn(random(), 0.7, 0.92);
    const ctrl1X = baseX + sway * randIn(random(), 0.2, 0.45);
    const ctrl2X = baseX + sway * randIn(random(), 0.6, 0.95);
    const topX = baseX + sway;

    const leafCount = Math.max(2, Math.round(randIn(random(), 2, 4) + growthFactor * 2.2));
    const leaves: LeafSpec[] = [];

    for (let i = 0; i < leafCount; i += 1) {
      const offset = randIn(random(), 0.22, 0.9);
      const cy = soilY - height * offset;
      const side = random() > 0.5 ? 1 : -1;
      const spread = randIn(random(), 10, 26);
      const cx = baseX + sway * offset + side * spread;
      const length = randIn(random(), 18, 32) + growthFactor * 14;
      const width = length * randIn(random(), 0.25, 0.48);
      const angle = side === 1 ? randIn(random(), -15, -46) : randIn(random(), 15, 46);

      leaves.push({ cx, cy, angle, length, width });
    }

    const path = `M ${baseX.toFixed(2)} ${soilY.toFixed(2)} C ${ctrl1X.toFixed(2)} ${ctrl1Y.toFixed(2)}, ${ctrl2X.toFixed(2)} ${ctrl2Y.toFixed(2)}, ${topX.toFixed(2)} ${topY.toFixed(2)}`;
    stems.push({ path, topX, topY, leaves });
  }

  return stems.sort((a, b) => a.topY - b.topY);
}

export function PlantSVG({ seed, size = 180, staticMode = false, withPot = false, potTone }: PlantSVGProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !staticMode && !prefersReducedMotion;
  const tokens = useArtStyle();

  const { stems, fillColor, strokeColor, strokeOpacity, leafStrokeWidth, bloomColor, bloomCount, patternId, patternDef, shadowId, shadowDef } = useMemo(() => {
    const builtStems = buildStems(seed, withPot);
    const growthFactor = clamp(seed.growth / 100, 0, 1);
    const hue = moodHue[seed.mood] ?? 130;
    const saturation = clamp(40 + tokens.fill.saturationBoost + growthFactor * 16, 18, 92);
    const lightness = clamp(tokens.fill.lightnessBase - growthFactor * 8 + (seed.type === "dream" ? 6 : 0), 26, 78);
    const alpha = tokens.fill.alpha ?? 1;
    const fill = `hsl(${hue} ${saturation}% ${lightness}% / ${alpha})`;

    const bloomHue = clamp(hue + (seed.type === "idea" ? 28 : seed.type === "recipe" ? -16 : 12), 0, 360);
    const bloomLightness = clamp(lightness + 20, 40, 88);
    const bloom = `hsl(${bloomHue} ${Math.min(96, saturation + 24)}% ${bloomLightness}%)`;
    const flowers = seed.growth > 45 ? Math.round(clamp(1 + growthFactor * 3.2, 1, 5)) : 0;

    const patternKey = tokens.fill.pattern;
    const patternIdentifier = patternKey ? `pattern-${hashString(`${seed.id}-${patternKey}`)}` : undefined;
    const patternDefinition = (() => {
      if (!patternKey || !patternIdentifier) {
        return undefined;
      }
      if (patternKey === "hatch") {
        return (
          <pattern id={patternIdentifier} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(12)">
            <rect width="8" height="8" fill="none" />
            <path d="M -2 2 L 10 2" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M -2 6 L 10 6" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          </pattern>
        );
      }
      if (patternKey === "dots") {
        return (
          <pattern id={patternIdentifier} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill="none" />
            <circle cx="1.5" cy="1.5" r="0.6" fill="rgba(255,255,255,0.25)" />
            <circle cx="4.5" cy="4.5" r="0.5" fill="rgba(0,0,0,0.1)" />
          </pattern>
        );
      }
      return undefined;
    })();

    const shadowIdentifier = tokens.shadow?.enabled ? `shadow-${hashString(`${seed.id}-shadow`)}` : undefined;
    const shadowDefinition = shadowIdentifier && tokens.shadow ? (
      <filter id={shadowIdentifier} x="-20%" y="-20%" width="140%" height="140%">
        <feOffset dx={tokens.shadow.dx} dy={tokens.shadow.dy} />
        <feGaussianBlur stdDeviation={tokens.shadow.blur} />
        <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${tokens.shadow.alpha} 0`} />
      </filter>
    ) : undefined;

    return {
      stems: builtStems,
      fillColor: fill,
      strokeColor: tokens.line.color,
      strokeOpacity: tokens.line.alpha ?? 1,
      leafStrokeWidth: tokens.line.width * 0.6,
      bloomColor: bloom,
      bloomCount: flowers,
      patternId: patternIdentifier,
      patternDef: patternDefinition,
      shadowId: shadowIdentifier,
      shadowDef: shadowDefinition,
    };
  }, [seed, tokens, withPot]);

  const pot = useMemo(() => {
    if (!withPot) {
      return null;
    }
    const tone = potTone ?? (seed.mood === "melancholy" ? "stone" : "terracotta");
    const palette = potPalette[tone];
    return (
      <g aria-hidden="true">
        <path d="M56 152 C 56 192 144 192 144 152 L 144 196 C 144 204 56 204 56 196 Z" fill={palette.body} />
        <rect x="46" y="140" width="108" height="16" rx="8" fill={palette.lip} />
        <path d="M56 196 C 56 204 144 204 144 196" fill="none" stroke={palette.shadow} strokeWidth="3" opacity="0.35" />
      </g>
    );
  }, [seed.mood, potTone, withPot]);

  const plantBody = (
    <g>
      {stems.map((stem, index) => (
        <path
          key={`stem-${seed.id}-${index}`}
          d={stem.path}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={strokeOpacity}
          strokeWidth={tokens.line.width}
          strokeLinecap={tokens.line.cap}
          strokeLinejoin={tokens.line.join}
          filter={shadowId ? `url(#${shadowId})` : undefined}
        />
      ))}
      {stems.flatMap((stem, indexGroup) =>
        stem.leaves.map((leaf, index) => {
          const path = leafPath(tokens.leafShape, leaf.length, leaf.width);
          return (
            <path
              key={`leaf-${indexGroup}-${index}`}
              d={path}
              transform={`translate(${leaf.cx.toFixed(2)}, ${leaf.cy.toFixed(2)}) rotate(${leaf.angle.toFixed(2)})`}
              fill={patternId ? `url(#${patternId})` : fillColor}
              stroke={strokeColor}
              strokeOpacity={strokeOpacity}
              strokeWidth={leafStrokeWidth}
              strokeLinecap={tokens.line.cap}
              strokeLinejoin={tokens.line.join}
              opacity={0.92}
            />
          );
        }),
      )}
      {bloomCount > 0 &&
        stems.slice(0, bloomCount).map((stem, index) => {
          const rng = mulberry32(hashString(`${seed.id}-bloom-${index}`));
          const x = stem.topX;
          const y = stem.topY - randIn(rng(), 6, 14);
          if (tokens.bloomStyle === "circle") {
            return (
              <circle
                key={`bloom-${index}`}
                cx={x}
                cy={y}
                r={7.5}
                fill={bloomColor}
                stroke={strokeColor}
                strokeOpacity={strokeOpacity}
                strokeWidth={leafStrokeWidth}
              />
            );
          }
          return (
            <path
              key={`bloom-${index}`}
              d={`M ${x} ${y} c 6 -6, 10 -2, 8 4 c -2 6, -10 8, -16 4 c -4 -4, 2 -10, 8 -12 Z`}
              fill={bloomColor}
              stroke={strokeColor}
              strokeOpacity={strokeOpacity}
              strokeWidth={leafStrokeWidth}
            />
          );
        })}
      {withPot && pot}
    </g>
  );

  return (
    <svg role="img" width={size} height={size} viewBox="0 0 200 200" className="overflow-visible">
      <title>{`${seed.title} — ${Math.round(seed.growth)}% grown, ${seed.mood} ${seed.type}.`}</title>
      <desc>{`Plant growth determined by actions only. Current growth ${seed.growth}%.`}</desc>
      <defs>
        {patternDef}
        {shadowDef}
      </defs>
      {shouldAnimate ? (
        <motion.g
          initial={{ rotate: -1 }}
          animate={{ rotate: [1, -1, 1] }}
          transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          style={{ transformOrigin: "100px 120px" }}
        >
          {plantBody}
        </motion.g>
      ) : (
        plantBody
      )}
    </svg>
  );
}


