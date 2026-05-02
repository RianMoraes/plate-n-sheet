import { getNeutralDiameter, getNeutralLinear, DimensionRef } from "./materialThickness";

export interface RectToRoundParams {
  rectLength: number; // Lado 1 (X)
  rectWidth: number; // Lado 2 (Y)
  diameterSmall: number;
  height: number;
  segments?: number;
  thickness?: number;
  dimensionRef?: DimensionRef;
}

export interface RectToRoundUnfold {
  rectLength: number;
  rectWidth: number;
  r: number;
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
  if (dAC < 1e-9) return [A[0], A[1]];
  if (dBC < 1e-9) return [B[0], B[1]];

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

export function calcRectToRoundUnfold(params: RectToRoundParams): RectToRoundUnfold {
  const { rectLength, rectWidth, diameterSmall, height, segments = 48, thickness = 0, dimensionRef = "medio" } = params;

  if (rectLength <= 0 || rectWidth <= 0 || diameterSmall <= 0 || height <= 0)
    throw new Error("Todos os valores dimensionais principais devem ser maiores que zero.");

  let N = segments;
  if (N % 4 !== 0) N = Math.ceil(N / 4) * 4;
  const m = N / 4; 

  const neutralLength = getNeutralLinear(rectLength, thickness, dimensionRef);
  const neutralWidth = getNeutralLinear(rectWidth, thickness, dimensionRef);
  const neutralDiameterSmall = getNeutralDiameter(diameterSmall, thickness, dimensionRef);

  const L = neutralLength;
  const W = neutralWidth;
  const r = neutralDiameterSmall / 2;
  const dA = (2 * Math.PI) / N;

  const top3 = (i: number): P3 => {
    const a = i * dA;
    return [r * Math.cos(a), r * Math.sin(a), height];
  };

  // Pontos chaves do retângulo
  // C1 = 1º Quadrante (+, +), C2 = 2º Quadrante (-, +)
  // C3 = 3º Quadrante (-, -), C4 = 4º Quadrante (+, -)
  const B_seam_start: P3 = [L/2, 0, 0];
  const C1: P3 = [L/2, W/2, 0];
  const C2: P3 = [-L/2, W/2, 0];
  const C3: P3 = [-L/2, -W/2, 0];
  const C4: P3 = [L/2, -W/2, 0];
  const B_seam_end: P3 = [L/2, 0, 0];

  const base3: P3[] = [];
  const topList: P3[] = [];

  base3.push(B_seam_start);
  topList.push(top3(0));

  base3.push(C1);
  topList.push(top3(0));

  for (let k = 1; k <= m; k++) {
    base3.push(C1);
    topList.push(top3(k));
  }

  base3.push(C2);
  topList.push(top3(m));

  for (let k = 1; k <= m; k++) {
    base3.push(C2);
    topList.push(top3(m + k));
  }

  base3.push(C3);
  topList.push(top3(2 * m));

  for (let k = 1; k <= m; k++) {
    base3.push(C3);
    topList.push(top3(2 * m + k));
  }

  base3.push(C4);
  topList.push(top3(3 * m));

  for (let k = 1; k <= m; k++) {
    base3.push(C4);
    topList.push(top3(3 * m + k));
  }

  base3.push(B_seam_end);
  topList.push(top3(4 * m));

  const totalPoints = base3.length;
  const d_start = dist3(base3[0], topList[0]);
  
  const bPts: P2[] = [[0, 0]];
  const tPts: P2[] = [[0, d_start]];

  let maxSlant = d_start;
  let minSlant = d_start;

  for (let i = 0; i < totalPoints - 1; i++) {
    const Pi = bPts[i];
    const Qi = tPts[i];

    const d_PiPi1 = dist3(base3[i], base3[i + 1]);
    const d_QiPi1 = dist3(topList[i], base3[i + 1]);
    const Pi1 = findThirdPoint(Pi, Qi, d_PiPi1, d_QiPi1, -1);
    bPts.push(Pi1);

    const d_QiQi1 = dist3(topList[i], topList[i + 1]);
    const d_Pi1Qi1 = dist3(base3[i + 1], topList[i + 1]);
    const Qi1 = findThirdPoint(Qi, Pi1, d_QiQi1, d_Pi1Qi1, 1);
    tPts.push(Qi1);

    const slant = dist3(base3[i + 1], topList[i + 1]);
    if (slant > maxSlant) maxSlant = slant;
    if (slant < minSlant) minSlant = slant;
  }

  const allX = [...bPts.map(p => p[0]), ...tPts.map(p => p[0])];
  const allY = [...bPts.map(p => p[1]), ...tPts.map(p => p[1])];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);

  const toObj = (p: P2) => ({ x: p[0], y: p[1] });

  return {
    rectLength: L, rectWidth: W, r, h: height,
    basePoints: bPts.map(toObj),
    topPoints: tPts.map(toObj),
    minX, maxX, minY, maxY,
    patternWidth: maxX - minX,
    patternHeight: maxY - minY,
    maxSlant,
    minSlant,
  };
}
