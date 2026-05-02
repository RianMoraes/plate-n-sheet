import { getNeutralDiameter, getNeutralLinear, DimensionRef } from "./materialThickness";

export interface SquareToRoundParams {
  squareSide: number;
  diameterSmall: number;
  height: number;
  segments?: number;
  thickness?: number;
  dimensionRef?: DimensionRef;
}

export interface SquareToRoundUnfold {
  squareSide: number;
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

export function calcSquareToRoundUnfold(params: SquareToRoundParams): SquareToRoundUnfold {
  const { squareSide, diameterSmall, height, segments = 48, thickness = 0, dimensionRef = "medio" } = params;

  if (squareSide <= 0 || diameterSmall <= 0 || height <= 0)
    throw new Error("Todos os valores dimensionais principais devem ser maiores que zero.");

  // Garantir que as divisões sejam múltiplas de 4 para a geometria quadrada
  let N = segments;
  if (N % 4 !== 0) N = Math.ceil(N / 4) * 4;
  const m = N / 4; // pontos circulares por quadrante

  const neutralSquareSide = getNeutralLinear(squareSide, thickness, dimensionRef);
  const neutralDiameterSmall = getNeutralDiameter(diameterSmall, thickness, dimensionRef);

  const S = neutralSquareSide;
  const r = neutralDiameterSmall / 2;
  const dA = (2 * Math.PI) / N;

  // Pontos 3D do topo circular
  const top3 = (i: number): P3 => {
    const a = i * dA;
    return [r * Math.cos(a), r * Math.sin(a), height];
  };

  // Pontos chaves do quadrado
  const B_seam_start: P3 = [S/2, 0, 0];
  const C1: P3 = [S/2, S/2, 0];
  const C2: P3 = [-S/2, S/2, 0];
  const C3: P3 = [-S/2, -S/2, 0];
  const C4: P3 = [S/2, -S/2, 0];
  const B_seam_end: P3 = [S/2, 0, 0];

  // Construir a sequência de pontos base e topo
  const base3: P3[] = [];
  const topList: P3[] = [];

  // Início (meio lado reto)
  base3.push(B_seam_start);
  topList.push(top3(0));

  base3.push(C1);
  topList.push(top3(0));

  // Corner 1
  for (let k = 1; k <= m; k++) {
    base3.push(C1);
    topList.push(top3(k));
  }

  // Lado reto 1
  base3.push(C2);
  topList.push(top3(m));

  // Corner 2
  for (let k = 1; k <= m; k++) {
    base3.push(C2);
    topList.push(top3(m + k));
  }

  // Lado reto 2
  base3.push(C3);
  topList.push(top3(2 * m));

  // Corner 3
  for (let k = 1; k <= m; k++) {
    base3.push(C3);
    topList.push(top3(2 * m + k));
  }

  // Lado reto 3
  base3.push(C4);
  topList.push(top3(3 * m));

  // Corner 4
  for (let k = 1; k <= m; k++) {
    base3.push(C4);
    topList.push(top3(3 * m + k));
  }

  // Fim (meio lado reto)
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

  // Bounding box
  const allX = [...bPts.map(p => p[0]), ...tPts.map(p => p[0])];
  const allY = [...bPts.map(p => p[1]), ...tPts.map(p => p[1])];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);

  const toObj = (p: P2) => ({ x: p[0], y: p[1] });

  return {
    squareSide: S, r, h: height,
    basePoints: bPts.map(toObj),
    topPoints: tPts.map(toObj),
    minX, maxX, minY, maxY,
    patternWidth: maxX - minX,
    patternHeight: maxY - minY,
    maxSlant,
    minSlant,
  };
}
