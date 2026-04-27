/**
 * Tipos centrais da aplicação.
 * Adicionar novos tipos de peça aqui no futuro.
 */

export type PieceType = "cone-truncado" | "cone-excentrico";

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
];
