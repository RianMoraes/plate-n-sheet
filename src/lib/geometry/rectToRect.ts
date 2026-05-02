import { getNeutralLinear, DimensionRef } from "./materialThickness";

export interface RectToRectParams {
  baseLength: number; // Base 1 (X)
  baseWidth: number; // Base 2 (Y)
  topLength: number; // Topo 1 (X)
  topWidth: number; // Topo 2 (Y)
  height: number;
  thickness?: number;
  dimensionRef?: DimensionRef;
}

export interface RectToRectUnfold {
  baseLength: number;
  baseWidth: number;
  topLength: number;
  topWidth: number;
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

export function calcRectToRectUnfold(params: RectToRectParams): RectToRectUnfold {
  const { baseLength, baseWidth, topLength, topWidth, height, thickness = 0, dimensionRef = "medio" } = params;

  if (baseLength <= 0 || baseWidth <= 0 || topLength <= 0 || topWidth <= 0 || height <= 0)
    throw new Error("Todos os valores dimensionais principais devem ser maiores que zero.");

  const L1 = getNeutralLinear(baseLength, thickness, dimensionRef);
  const W1 = getNeutralLinear(baseWidth, thickness, dimensionRef);
  const L2 = getNeutralLinear(topLength, thickness, dimensionRef);
  const W2 = getNeutralLinear(topWidth, thickness, dimensionRef);
  const H = height;

  // Pontos chaves do retângulo da base
  const bSeam: P3 = [L1/2, 0, 0];
  const bC1: P3 = [L1/2, W1/2, 0];
  const bC2: P3 = [-L1/2, W1/2, 0];
  const bC3: P3 = [-L1/2, -W1/2, 0];
  const bC4: P3 = [L1/2, -W1/2, 0];

  // Pontos chaves do retângulo do topo
  const tSeam: P3 = [L2/2, 0, H];
  const tC1: P3 = [L2/2, W2/2, H];
  const tC2: P3 = [-L2/2, W2/2, H];
  const tC3: P3 = [-L2/2, -W2/2, H];
  const tC4: P3 = [L2/2, -W2/2, H];

  const base3: P3[] = [bSeam, bC1, bC2, bC3, bC4, bSeam];
  const topList: P3[] = [tSeam, tC1, tC2, tC3, tC4, tSeam];

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
    baseLength: L1, baseWidth: W1,
    topLength: L2, topWidth: W2,
    h: height,
    basePoints: bPts.map(toObj),
    topPoints: tPts.map(toObj),
    minX, maxX, minY, maxY,
    patternWidth: maxX - minX,
    patternHeight: maxY - minY,
    maxSlant,
    minSlant,
  };
}
