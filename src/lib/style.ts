export type LeafShape = "ellipse" | "teardrop" | "diamond";

export interface ArtStyleTokens {
  name: string;
  line: {
    width: number;
    color: string;
    cap: "round" | "butt" | "square";
    join: "round" | "miter" | "bevel";
    alpha?: number;
    jitter?: number;
    outlineOnly?: boolean;
  };
  fill: {
    saturationBoost: number;
    lightnessBase: number;
    alpha?: number;
    gradient?: boolean;
    pattern?: "hatch" | "dots" | null;
  };
  leafShape: LeafShape;
  bloomStyle: "circle" | "petal";
  shadow?: {
    enabled: boolean;
    dx: number;
    dy: number;
    blur: number;
    alpha: number;
  };
  grain?: {
    enabled: boolean;
    opacity: number;
  };
}

export const artPresets: Record<string, ArtStyleTokens> = {
  woodblock: {
    name: "woodblock",
    line: {
      width: 1.6,
      color: "hsl(35 65% 22%)",
      cap: "square",
      join: "miter",
      alpha: 0.9,
      jitter: 0.8,
    },
    fill: {
      saturationBoost: -5,
      lightnessBase: 58,
      alpha: 0.88,
      gradient: false,
      pattern: "hatch",
    },
    leafShape: "diamond",
    bloomStyle: "circle",
    shadow: { enabled: false, dx: 0, dy: 0, blur: 0, alpha: 0 },
    grain: { enabled: true, opacity: 0.08 },
  },
  monoline: {
    name: "monoline",
    line: {
      width: 1,
      color: "hsl(150 20% 25%)",
      cap: "round",
      join: "round",
    },
    fill: {
      saturationBoost: 12,
      lightnessBase: 62,
      gradient: true,
      pattern: null,
    },
    leafShape: "ellipse",
    bloomStyle: "circle",
    shadow: { enabled: false, dx: 0, dy: 0, blur: 0, alpha: 0 },
    grain: { enabled: false, opacity: 0 },
  },
  papercut: {
    name: "papercut",
    line: {
      width: 2,
      color: "hsl(18 70% 28%)",
      cap: "round",
      join: "bevel",
      alpha: 0.75,
    },
    fill: {
      saturationBoost: -15,
      lightnessBase: 70,
      gradient: false,
      pattern: "dots",
      alpha: 0.95,
    },
    leafShape: "teardrop",
    bloomStyle: "petal",
    shadow: { enabled: true, dx: 2, dy: 3, blur: 6, alpha: 0.22 },
    grain: { enabled: true, opacity: 0.1 },
  },
  "cozy-shelf": {
    name: "cozy-shelf",
    line: {
      width: 1.2,
      color: "hsl(140 10% 20%)",
      cap: "round",
      join: "round",
      alpha: 0.85,
    },
    fill: {
      saturationBoost: -10,
      lightnessBase: 54,
      alpha: 0.98,
      gradient: false,
      pattern: null,
    },
    leafShape: "teardrop",
    bloomStyle: "petal",
    shadow: { enabled: true, dx: 1.5, dy: 2, blur: 3, alpha: 0.18 },
    grain: { enabled: true, opacity: 0.05 },
  },
};

