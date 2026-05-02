/**
 * Tipos centrais da aplicação.
 * Adicionar novos tipos de peça aqui no futuro.
 */

export type PieceType = "cone-truncado" | "cone-excentrico" | "round-to-round" | "square-to-round";

export interface PieceMeta {
  id: PieceType;
  label: string;
  description: string;
}

export const PIECE_TYPES: PieceMeta[] = [
  {
    id: "cone-truncado",
    label: "Cone Truncado",
    description: "Redução concêntrica (círculo → círculo)",
  },
  {
    id: "cone-excentrico",
    label: "Cone Excêntrico",
    description: "Redução com um lado reto (excêntrico)",
  },
  {
    id: "round-to-round",
    label: "Redondo → Redondo",
    description: "Transição circular com offset livre",
  },
  {
    id: "square-to-round",
    label: "Quadrado → Redondo",
    description: "Transição de base quadrada para topo circular",
  },
];
