/**
 * GEOMETRIA: CONE TRUNCADO (CONE FRUSTUM)
 * ========================================
 *
 * Um cone truncado é obtido cortando um cone circular reto com um plano paralelo à base.
 *
 * PARÂMETROS:
 *   D (diâmetro maior) = diâmetro da base maior
 *   d (diâmetro menor) = diâmetro do topo (base menor)
 *   h (altura)         = altura vertical do cone truncado
 *
 * RAIOS:
 *   R = D / 2  (raio maior)
 *   r = d / 2  (raio menor)
 *
 * GERATRIZ DO CONE TRUNCADO:
 *   A geratriz (slant height) é o comprimento da linha oblíqua
 *   que conecta a borda do círculo maior ao círculo menor:
 *
 *   s = √( h² + (R - r)² )
 *
 * PLANIFICAÇÃO (DESENVOLVIMENTO PLANO):
 *   Para planificar um cone truncado, imaginamos que ele faz parte
 *   de um cone completo. Precisamos encontrar:
 *
 *   1. A altura do cone completo (H_total):
 *      Pela semelhança de triângulos:
 *      H_total / R = (H_total - h) / r
 *      H_total = h * R / (R - r)
 *
 *   2. A geratriz do cone completo (L):
 *      L = √( H_total² + R² )
 *
 *   3. A geratriz do cone pequeno (l):
 *      l = L - s   OU   l = √( (H_total - h)² + r² )
 *      (ambas equivalentes pela geometria similar)
 *
 *   4. Na planificação (setor circular):
 *      - Raio externo (arco maior): L
 *      - Raio interno (arco menor): l
 *      - Ângulo do setor (em radianos): θ = 2π * R / L
 *        (circunferência real / raio L = arco necessário)
 *
 * RESULTADO:
 *   A planificação é um setor de anel (coroa circular setorial)
 *   com raios L (externo) e l (interno) e ângulo θ.
 */

export interface ConeFrustumParams {
  /** Diâmetro da base maior (mm) */
  diameterBig: number;
  /** Diâmetro da base menor / topo (mm) */
  diameterSmall: number;
  /** Altura vertical do cone truncado (mm) */
  height: number;
}

export interface ConeFrustumUnfold {
  /** Raio maior = D/2 */
  R: number;
  /** Raio menor = d/2 */
  r: number;
  /** Geratriz do cone truncado (slant height) */
  s: number;
  /** Geratriz do cone completo (raio externo da planificação) */
  L: number;
  /** Geratriz do cone pequeno (raio interno da planificação) */
  l: number;
  /** Ângulo do setor em radianos */
  thetaRad: number;
  /** Ângulo do setor em graus */
  thetaDeg: number;
  /** Comprimento do arco externo (= circunferência da base maior) */
  arcLengthOuter: number;
  /** Comprimento do arco interno (= circunferência da base menor) */
  arcLengthInner: number;
}

/**
 * Calcula todos os parâmetros geométricos necessários para planificar um cone truncado.
 *
 * @param params - Parâmetros de entrada (diâmetros e altura)
 * @returns Objeto com todos os valores calculados para a planificação
 * @throws Error se os parâmetros forem inválidos
 */
export function calcConeFrustumUnfold(params: ConeFrustumParams): ConeFrustumUnfold {
  const { diameterBig, diameterSmall, height } = params;

  // Validações básicas
  if (diameterBig <= 0 || diameterSmall <= 0 || height <= 0) {
    throw new Error("Todos os valores devem ser maiores que zero.");
  }
  if (diameterSmall >= diameterBig) {
    throw new Error("O diâmetro menor deve ser menor que o diâmetro maior.");
  }

  const R = diameterBig / 2;   // raio da base maior
  const r = diameterSmall / 2; // raio da base menor

  // Geratriz do cone truncado: s = √( h² + (R - r)² )
  const s = Math.sqrt(height ** 2 + (R - r) ** 2);

  // Altura do cone completo pela semelhança de triângulos:
  // H_total / R = (H_total - height) / r  →  H_total = height * R / (R - r)
  const H_total = (height * R) / (R - r);

  // Geratriz do cone completo: L = √( H_total² + R² )
  const L = Math.sqrt(H_total ** 2 + R ** 2);

  // Geratriz do cone menor: l = L - s
  const l = L - s;

  // Ângulo do setor: θ = 2π * R / L
  // (a circunferência real da base maior é 2πR,
  //  e ela deve ser igual ao arco do setor de raio L)
  const thetaRad = (2 * Math.PI * R) / L;
  const thetaDeg = (thetaRad * 180) / Math.PI;

  // Comprimentos dos arcos (confirmação)
  const arcLengthOuter = thetaRad * L; // deve ser ≈ 2πR
  const arcLengthInner = thetaRad * l; // deve ser ≈ 2πr

  return { R, r, s, L, l, thetaRad, thetaDeg, arcLengthOuter, arcLengthInner };
}
