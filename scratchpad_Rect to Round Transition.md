# Atualização - Módulo Retângulo para Redondo (Rect to Round)

## Visão Geral
A Etapa 4 foi concluída. Inserimos uma variação da base poligonal que aceita assimetria nos eixos ortogonais, permitindo a construção de peças com bases retangulares e topos redondos. Esta é a peça mais clássica para transição de dutos quadrados maiores (comum em sistemas HVAC) para a saída de exaustores tubulares.

## Modificações Implementadas

### 1. Novo Módulo Geométrico (`rectToRound.ts`)
- O algoritmo é uma evolução direta do modelo `squareToRound.ts`.
- Os quatro cantos da base poligonal foram redefinidos para utilizar `L/2` no eixo X e `W/2` no eixo Y.
- A linha de costura permanece posicionada no centro do lado correspondente à "Largura" (Eixo X, `L/2`), otimizando o aninhamento no plano de corte da chapa e preservando o formato clássico espelhado.
- Compensação de linha neutra é calculada independentemente para a Largura, Comprimento e Diâmetro do topo.

### 2. Expansão 3D e 2D (`Piece3D.tsx` e `RectToRoundCanvas.tsx`)
- O modelo 3D agora detecta se a peça é retangular. A geração da malha usa projeção por raios para mapear o círculo perfeito de 64 segmentos até a borda externa do retângulo, preservando a fidelidade visual da "moega".
- O Canvas 2D foi replicado e configurado para lidar com o novo formato de `RectToRoundUnfold`, integrando-se nativamente às ferramentas de cota interativas.

### 3. Ajustes de Interface Dinâmicos (`page.tsx`)
- Um novo parâmetro de estado `rectWidth` ("Lado 2") foi introduzido e condicionado a aparecer exclusivamente sob a seleção deste tipo de peça.
- A Label principal interage de forma semântica: quando "Retângulo → Redondo" está ativo, "Diâmetro Maior" torna-se "Lado 1 (Comprimento)".

## Status da Compilação
- Código estável, todos os tipos resolvidos sem alertas de `any` implícitos e as equações matemáticas estão seguras contra as divisões por zero descobertas na etapa anterior.
