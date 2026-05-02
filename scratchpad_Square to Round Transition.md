# Atualização - Módulo Quadrado para Redondo (Square to Round)

## Visão Geral
Concluída a Etapa 3 do cronograma de desenvolvimento, adicionando suporte matemático e visual completo para transições de base retilínea quadrada para topo circular, amplamente utilizadas em dutos de ventilação, moegas e transições de chaminés industriais.

## Modificações Implementadas

### 1. Novo Módulo Geométrico (`squareToRound.ts`)
- O algoritmo processa a planificação através de um método rígido de triangulação.
- A topologia foi projetada para alinhar a "costura" da chapa perfeitamente no centro de uma das quatro faces planas do quadrado (comumente a face traseira). 
- Isso divide o desenvolvimento em:
  - 2 metades de face plana nas extremidades (para unir a costura).
  - 3 faces planas completas intercaladas.
  - 4 seções cônicas de concordância que interligam os cantos vivos do quadrado ao arco suave do topo circular.
- A função foi feita agnóstica ao módulo de caldeiraria, recebendo a espessura da chapa e derivando as medidas nominais utilizando o módulo de `materialThickness.ts` recentemente implementado.

### 2. Renderização Canvas (`SquareToRoundCanvas.tsx`)
- Adaptado o motor de renderização interativo (com suporte a Grid, auto-zoom e ferramentas de Medição de Cotas Livres com "Snap") para as nuances da base quadrada.
- O Bounding Box agora reflete perfeitamente a distância horizontal extrema e as extensões radiais das quatro pontas do desenho no plano X-Y.

### 3. Integrações Finais (`page.tsx` & `pieces.ts`)
- `PIECE_TYPES` recebeu o novo id `"square-to-round"`.
- A Label "Diâmetro Maior" sofre mutação dinâmica para "Lado do Quadrado" quando esta peça está selecionada, reaproveitando o layout da UI com inteligência.
- Relatório de exportação PDF `exportToPdf()` totalmente adaptado.

## Status da Compilação
- `npm run build` testado e rodando com sucesso.
- Sem conflitos de tipagem ou memory leaks apontados pelo compilador Next.js/React.
