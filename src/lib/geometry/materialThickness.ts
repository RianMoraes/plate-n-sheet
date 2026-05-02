/**
 * Módulo para compensação dimensional baseada na espessura da chapa.
 *
 * Em caldeiraria, todo cálculo de planificação deve ser feito pela
 * LINHA NEUTRA (linha média) do material, pois durante a conformação
 * as fibras externas esticam e as fibras internas comprimem.
 */

export type DimensionRef = "interno" | "externo" | "medio";

/**
 * Converte um diâmetro (interno, externo ou médio) para o Diâmetro Neutro.
 * @param diameter Diâmetro informado pelo usuário
 * @param thickness Espessura da chapa
 * @param ref Tipo de referência do diâmetro informado
 * @returns O diâmetro na linha neutra, que será usado nos cálculos geométricos.
 */
export function getNeutralDiameter(diameter: number, thickness: number, ref: DimensionRef): number {
  if (thickness <= 0) return diameter;

  switch (ref) {
    case "interno":
      // Diâmetro Neutro = Diâmetro Interno + Espessura
      return diameter + thickness;
    case "externo":
      // Diâmetro Neutro = Diâmetro Externo - Espessura
      return diameter - thickness;
    case "medio":
    default:
      // Já está na linha neutra
      return diameter;
  }
}

/**
 * Converte uma dimensão linear reta (interno, externo ou médio) para a Dimensão Neutra.
 * Será útil futuramente para Retângulo, Quadrado, etc.
 * Num quadrado concêntrico sendo dobrado, a medida da linha neutra de cada lado
 * depende dos raios de dobra, mas simplificadamente, para desconto de chapa total:
 * L_neutro = L_ext - thickness ou L_int + thickness.
 */
export function getNeutralLinear(length: number, thickness: number, ref: DimensionRef): number {
  if (thickness <= 0) return length;

  switch (ref) {
    case "interno":
      return length + thickness;
    case "externo":
      return length - thickness;
    case "medio":
    default:
      return length;
  }
}
