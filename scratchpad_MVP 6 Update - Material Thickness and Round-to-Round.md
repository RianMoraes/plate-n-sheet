# Atualização MVP 6 - Espessura de Chapa e Transição Redondo-Redondo

## Visão Geral
Esta atualização é um marco importante (Etapas 1 e 2) na transformação do software de "geometria teórica" para um **software de fabricação de caldeiraria industrial**. Introduziu-se o cálculo de **Linha Neutra** e a generalização de superfícies concêntricas e excêntricas.

## Modificações Implementadas

### 1. Novo Módulo de Material (`materialThickness.ts`)
- Implementada a compensação dimensional considerando a **Espessura da chapa** e o tipo de **Referência Dimensional** (Interno, Externo ou Linha Média).
- Na caldeiraria, ao curvar a chapa, as fibras internas comprimem e as externas esticam, por isso o padrão é calcular a planificação utilizando o **diâmetro neutro** (onde as tensões são nulas). 
  - $D_{neutro} = D_{ext} - Espessura$
  - $D_{neutro} = D_{int} + Espessura$

### 2. Generalização: Redondo → Redondo (`roundToRound.ts`)
- Novo modelo matemático de base e topo circulares que aceita uma variável contínua **`offsetX`**.
- Se `offsetX = 0`, comporta-se matematicamente como um Cone Truncado.
- Se `offsetX = R - r`, comporta-se como um Cone Excêntrico de um lado reto.
- A planificação é extraída através de triangulação minuciosa da superfície 3D deslocada no eixo cartesiano.

### 3. Integração com a Interface (`page.tsx` & `pieces.ts`)
- **Novos Controles:** 
  - Espessura da chapa (mm).
  - Select para Referência Dimensional (Medida Interna, Externa ou Média).
  - Input para `Offset X` (exclusivo para Redondo → Redondo).
- Os cálculos do Cone Truncado Clássico e do Cone Excêntrico Clássico foram devidamente adaptados para usar as dimensões neutras por baixo dos panos.
- Criado o renderizador `<RoundToRoundCanvas />` idêntico em funcionamento (grid, medidas interativas, auto-scale) ao canvas de peças passadas.
- Geração de PDF foi estendida para suportar este novo tipo de transição.

## Verificação e Compilação
- Código Next.js/React reavaliado, builds rodam com sucesso sem problemas de tipagem estrita do TypeScript.
- A visualização 2D renderiza sem erros a variação paramétrica instantaneamente.
