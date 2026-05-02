# Atualização - Módulo Retângulo para Retângulo (Rect to Rect)

## Visão Geral
A Etapa 5 coroa o pilar das transições de caldeiraria baseadas em formas prismáticas e piramidais truncadas. Construímos a matemática para projetar capelas, dutos de transição plana e moegas industriais puramente poligonais (sem curvas circulares).

## Modificações Implementadas

### 1. Novo Módulo Geométrico (`rectToRect.ts`)
- Utiliza a mesma infraestrutura trigonométrica (`findThirdPoint`) de desdobramento, mas mapeia exclusivamente os 4 vértices da base para os 4 vértices do topo.
- O resultado é uma malha muito limpa de 4 chapas (trapézios) consecutivas.
- Não existem `segments` curvos; consequentemente, o arquivo resultante possui apenas os pontos estritamente necessários para marcação de dobra.
- Os 4 inputs `baseLength`, `baseWidth`, `topLength`, `topWidth` são neutralizados individualmente antes da geração da planificação, atendendo rigorosamente à classe industrial introduzida anteriormente.

### 2. Expansão 3D e 2D (`Piece3D.tsx` e `RectToRectCanvas.tsx`)
- O modelo 3D não utiliza mais a malha radial padronizada para este tipo. Criei um gerador de malha personalizado dentro do `Piece3D` que desenha exatamente os 4 triângulos frontais/laterais formados pelas quinas inferior e superior. 
- O Canvas 2D renderiza as clássicas "linhas de dobra" tracejadas (`setLineDash([5, 5])`) exatamente onde o operador de calandra/dobradeira precisará vincar a chapa.

### 3. Ajustes de Interface Dinâmicos (`page.tsx`)
- Um quarto campo rotulado "Topo 2 (Largura)" foi adicionado condicionalmente à barra lateral de entrada de dados.
- O sistema intercepta as *labels* e adapta universalmente os nomes para:
  - Base 1 (Comprimento)
  - Base 2 (Largura)
  - Topo 1 (Comprimento)
  - Topo 2 (Largura)

## Status da Compilação
- Código construído com sucesso (`Exit code: 0`).
- Rotas validadas. O projeto atingiu um nível de maturidade excelente com relação a padrões de caldeiraria pura.
