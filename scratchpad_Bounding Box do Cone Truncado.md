# Atualização - Bounding Box do Cone Truncado (Área da Chapa)

## Visão Geral
Atendendo ao pedido para adicionar as informações de área da chapa a ser utilizada no cone truncado (largura e comprimento/altura), padronizando a exibição com o que já existia no Cone Excêntrico.

## Modificações Implementadas

1. **`src/lib/geometry/coneFrustum.ts`**
   - A interface `ConeFrustumUnfold` foi atualizada para incluir `patternWidth` e `patternHeight`.
   - Na função `calcConeFrustumUnfold`, a lógica de cálculo do Bounding Box foi implementada considerando todos os pontos críticos do setor circular:
     - Os quatro cantos (interseções dos arcos com as retas de limite de ângulo).
     - Os pontos máximos dos arcos, que ocorrem quando o arco passa por ângulos múltiplos de 90° ($\pi/2$).
   - O cálculo retorna a diferença entre as coordenadas X (Width) e Y (Height).

2. **`src/app/page.tsx`**
   - Atualizada a tabela de `ResultRow` para incluir `Largura Chapa` e `Altura Chapa` para a visualização "cone-truncado".
   - O método `exportToPdf` foi alterado para imprimir essas novas propriedades de Largura e Altura também no relatório técnico exportado do cone truncado.

3. **`src/components/ConeFrustumCanvas.tsx`**
   - O rodapé do Canvas 2D foi atualizado para exibir `Largura da Chapa: X mm` e `Altura da Chapa: Y mm`, substituindo a exibição anterior da altura `h` e geratriz `s`, para manter a consistência estética com o canvas do cone excêntrico.

## Testes Realizados
- [x] O tamanho da chapa reflete adequadamente a "caixa delimitadora" do setor desenhado no canvas.
- [x] O PDF exportado contém os dados na lista de "Dados Calculados".
- [x] Os componentes React não quebram ao alternar entre os tipos de cones.
