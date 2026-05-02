import { getNeutralDiameter, DimensionRef } from "./materialThickness";

export interface RoundToRoundParams {
  diameterBig: number;
  diameterSmall: number;
  height: number;
  offsetX: number; // Deslocamento horizontal do centro do topo em relação à base
  segments?: number;
  thickness?: number;
  dimensionRef?: DimensionRef;
}

export interface RoundToRoundUnfold {
  R: number;
  r: number;
  offsetX: number;
  h: number;
  basePoints: { x: number; y: number }[];
  topPoints: { x: number; y: number }[];
  minX: number; maxX: number;
  minY: number; maxY: number;
  patternWidth: number;
  patternHeight: number;
  maxSlant: number;
  minSlant: number;
}

type P3 = [number, number, number];
type P2 = [number, number];

function dist3(a: P3, b: P3): number {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function findThirdPoint(A: P2, B: P2, dAC: number, dBC: number, side: 1 | -1): P2 {
  const dAB = Math.hypot(B[0]-A[0], B[1]-A[1]);
  if (dAB < 1e-9) return [A[0] + dAC, A[1]];

  let cosA = (dAB**2 + dAC**2 - dBC**2) / (2 * dAB * dAC);
  cosA = Math.max(-1, Math.min(1, cosA));
  const sinA = side * Math.sqrt(Math.max(0, 1 - cosA**2));

  const ux = (B[0]-A[0]) / dAB;
  const uy = (B[1]-A[1]) / dAB;

  return [
    A[0] + dAC * (cosA * ux - sinA * uy),
    A[1] + dAC * (cosA * uy + sinA * ux),
  ];
}

export function calcRoundToRoundUnfold(params: RoundToRoundParams): RoundToRoundUnfold {
  const { diameterBig, diameterSmall, height, offsetX, segments = 48, thickness = 0, dimensionRef = "medio" } = params;

  if (diameterBig <= 0 || diameterSmall <= 0 || height <= 0)
    throw new Error("Todos os valores dimensionais principais devem ser maiores que zero.");

  // Obter diâmetros neutros
  const neutralDiameterBig = getNeutralDiameter(diameterBig, thickness, dimensionRef);
  const neutralDiameterSmall = getNeutralDiameter(diameterSmall, thickness, dimensionRef);

  const R = neutralDiameterBig / 2;
  const r = neutralDiameterSmall / 2;
  const N = segments;
  const dA = (2 * Math.PI) / N;

  // Pontos 3D
  const base3 = (i: number): P3 => {
    const a = i * dA;
    return [R * Math.cos(a), R * Math.sin(a), 0];
  };
  
  const top3 = (i: number): P3 => {
    const a = i * dA;
    return [offsetX + r * Math.cos(a), r * Math.sin(a), height];
  };

  // Começa a planificação pela linha do ângulo 0 (x positivo)
  const d_start = dist3(base3(0), top3(0));
  
  const bPts: P2[] = [[0, 0]];
  const tPts: P2[] = [[0, d_start]];

  let maxSlant = d_start;
  let minSlant = d_start;

  for (let i = 0; i < N; i++) {
    const Pi = bPts[i];
    const Qi = tPts[i];

    const d_PiPi1 = dist3(base3(i), base3(i + 1));
    const d_QiPi1 = dist3(top3(i), base3(i + 1));
    const Pi1 = findThirdPoint(Pi, Qi, d_PiPi1, d_QiPi1, -1);
    bPts.push(Pi1);

    const d_QiQi1 = dist3(top3(i), top3(i + 1));
    const d_Pi1Qi1 = dist3(base3(i + 1), top3(i + 1));
    const Qi1 = findThirdPoint(Qi, Pi1, d_QiQi1, d_Pi1Qi1, 1);
    tPts.push(Qi1);

    const slant = dist3(base3(i + 1), top3(i + 1));
    if (slant > maxSlant) maxSlant = slant;
    if (slant < minSlant) minSlant = slant;
  }

  // Bounding box
  const allX = [...bPts.map(p => p[0]), ...tPts.map(p => p[0])];
  const allY = [...bPts.map(p => p[1]), ...tPts.map(p => p[1])];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);

  const toObj = (p: P2) => ({ x: p[0], y: p[1] });

  return {
    R, r, offsetX, h: height,
    basePoints: bPts.map(toObj),
    topPoints: tPts.map(toObj),
    minX, maxX, minY, maxY,
    patternWidth: maxX - minX,
    patternHeight: maxY - minY,
    maxSlant,
    minSlant,
  };
}
