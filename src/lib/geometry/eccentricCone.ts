/**
 * CONE EXCÊNTRICO — um lado reto (one-side-straight eccentric cone)
 * =================================================================
 *
 * GEOMETRIA:
 *   - Base: círculo de raio R = D/2, centrado em (0,0,0)
 *   - Topo: círculo de raio r = d/2, centrado em (e, 0, h)
 *          onde e = R - r  → garante que o lado direito (α=0) seja reto
 *
 * Por que e = R - r garante um lado reto?
 *   Em α=0: ponto base = (R, 0, 0), ponto topo = (e+r, 0, h) = (R, 0, h)
 *   Mesma coordenada x → geratriz vertical (reta perpendicular à base) ✓
 *
 * PLANIFICAÇÃO — MÉTODO DE TRIANGULAÇÃO:
 *   A superfície é dividida em N faixas triangulares ao longo da geratriz.
 *   Para cada faixa i (de α_i a α_{i+1}):
 *     - Triângulo 1: P_i, Q_i, P_{i+1}
 *     - Triângulo 2: Q_i, P_{i+1}, Q_{i+1}
 *
 *   Para planificar: começamos com o lado reto (α=0) posicionado
 *   verticalmente no plano e "dobramos" cada triângulo para fora
 *   usando a Lei dos Cossenos (todos os lados em 3D são conhecidos).
 *
 * COMPRIMENTOS DE GERATRIZ:
 *   gen(α) = √(2(R−r)²(1−cos α) + h²)
 *   - α=0:  gen = h               (lado reto)
 *   - α=π:  gen = √(4(R−r)² + h²) (lado mais longo)
 */

export interface EccentricConeParams {
  diameterBig: number;
  diameterSmall: number;
  height: number;
  segments?: number; // divisões (default 48 — suficiente para precisão visual)
}

export interface EccentricConeUnfold {
  R: number;
  r: number;
  e: number; // excentricidade = R - r
  h: number;
  basePoints: { x: number; y: number }[];
  topPoints: { x: number; y: number }[];
  minX: number; maxX: number;
  minY: number; maxY: number;
  patternWidth: number;
  patternHeight: number;
  /** Comprimento da geratriz mais longa (lado oposto ao reto) */
  maxSlant: number;
  /** Comprimento da geratriz do lado reto (= h) */
  minSlant: number;
}

// ── Helpers internos ─────────────────────────────────────────────────────────

type P3 = [number, number, number];
type P2 = [number, number];

function dist3(a: P3, b: P3): number {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

/**
 * Dado A e B em 2D, e as distâncias |AC| = dAC e |BC| = dBC,
 * encontra C usando a Lei dos Cossenos.
 * side = +1 → C à esquerda de A→B; side = -1 → à direita.
 */
function findThirdPoint(A: P2, B: P2, dAC: number, dBC: number, side: 1 | -1): P2 {
  const dAB = Math.hypot(B[0]-A[0], B[1]-A[1]);
  if (dAB < 1e-9) return [A[0] + dAC, A[1]];

  // Lei dos cossenos: cos(ângulo em A) = (dAB² + dAC² - dBC²) / (2·dAB·dAC)
  let cosA = (dAB**2 + dAC**2 - dBC**2) / (2 * dAB * dAC);
  cosA = Math.max(-1, Math.min(1, cosA)); // clamp numérico
  const sinA = side * Math.sqrt(Math.max(0, 1 - cosA**2));

  // Vetor unitário A→B
  const ux = (B[0]-A[0]) / dAB;
  const uy = (B[1]-A[1]) / dAB;

  // Rotaciona o vetor AC pelo ângulo encontrado
  return [
    A[0] + dAC * (cosA * ux - sinA * uy),
    A[1] + dAC * (cosA * uy + sinA * ux),
  ];
}

// ── Função principal ──────────────────────────────────────────────────────────

export function calcEccentricConeUnfold(params: EccentricConeParams): EccentricConeUnfold {
  const { diameterBig, diameterSmall, height, segments = 48 } = params;

  if (diameterBig <= 0 || diameterSmall <= 0 || height <= 0)
    throw new Error("Todos os valores devem ser maiores que zero.");
  if (diameterSmall >= diameterBig)
    throw new Error("O diâmetro menor deve ser menor que o diâmetro maior.");

  const R = diameterBig / 2;
  const r = diameterSmall / 2;
  const e = R - r; // excentricidade → garante um lado reto
  const N = segments;
  const dA = (2 * Math.PI) / N;

  // Pontos 3D do cone
  const base3 = (i: number): P3 => {
    const a = i * dA;
    return [R * Math.cos(a), R * Math.sin(a), 0];
  };
  const top3 = (i: number): P3 => {
    const a = i * dA;
    return [e + r * Math.cos(a), r * Math.sin(a), height];
  };

  // Triangulação — começa com o lado reto (α=0) vertical
  // P0 = (0, 0) e Q0 = (0, h) em 2D
  const bPts: P2[] = [[0, 0]];
  const tPts: P2[] = [[0, height]];

  for (let i = 0; i < N; i++) {
    const Pi = bPts[i];
    const Qi = tPts[i];

    // Triângulo 1: Pi, Qi → Pi+1
    const d_PiPi1 = dist3(base3(i), base3(i + 1));
    const d_QiPi1 = dist3(top3(i), base3(i + 1));
    const Pi1 = findThirdPoint(Pi, Qi, d_PiPi1, d_QiPi1, -1);
    bPts.push(Pi1);

    // Triângulo 2: Qi, Pi+1 → Qi+1
    const d_QiQi1 = dist3(top3(i), top3(i + 1));
    const d_Pi1Qi1 = dist3(base3(i + 1), top3(i + 1));
    const Qi1 = findThirdPoint(Qi, Pi1, d_QiQi1, d_Pi1Qi1, 1);
    tPts.push(Qi1);
  }

  // Bounding box
  const allX = [...bPts.map(p => p[0]), ...tPts.map(p => p[0])];
  const allY = [...bPts.map(p => p[1]), ...tPts.map(p => p[1])];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);

  // Conversão para objetos
  const toObj = (p: P2) => ({ x: p[0], y: p[1] });

  return {
    R, r, e, h: height,
    basePoints: bPts.map(toObj),
    topPoints: tPts.map(toObj),
    minX, maxX, minY, maxY,
    patternWidth: maxX - minX,
    patternHeight: maxY - minY,
    maxSlant: Math.sqrt(4 * e**2 + height**2),
    minSlant: height,
  };
}
