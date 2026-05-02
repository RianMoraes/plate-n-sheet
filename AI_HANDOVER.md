# SheetForge - Arquitetura e Estado do Projeto (MVP 6)

Este documento foi gerado para servir como um **ponto de restauração de contexto** para qualquer inteligência artificial ou desenvolvedor que venha a assumir ou continuar o projeto a partir daqui.

## 🎯 Objetivo Atual do Projeto
Transformar o "SheetForge Web" em uma ferramenta de engenharia industrial de grau profissional para caldeiraria e traçagem de chapas metálicas, com foco extremo em **precisão dimensional (linha neutra)** e **usabilidade visual (UI/UX 2D e 3D)**.

---

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 15 (App Router) + React 19
- **Linguagem:** TypeScript (Strict Mode)
- **Engine 3D:** `@react-three/fiber` + `@react-three/drei` (Three.js)
- **Engine 2D:** Canvas API Nativa (HTML5)
- **Exportação:** `jspdf` para relatórios técnicos
- **Estilização:** CSS Modules (`page.module.css`) + UI Sci-Fi/Dark Theme

---

## 📐 Módulos Geométricos Implementados

O projeto utiliza um padrão modular de arquitetura. Cada transição possui:
1. **Módulo Matemático Puro:** `src/lib/geometry/<nome>.ts`
2. **Visualizador 2D Nativo:** `src/components/<Nome>Canvas.tsx`

As seguintes peças estão totalmente finalizadas e integradas:

1. **Cone Truncado Concêntrico** (`coneFrustum.ts`)
2. **Cone Excêntrico de Base Reta** (`eccentricCone.ts`)
3. **Transição Redondo → Redondo com Offset X Livre** (`roundToRound.ts`)
4. **Transição Quadrado → Redondo** (`squareToRound.ts`)
   - Costura no centro de uma face reta.
   - Base retilínea gerando 4 bicos (formato "morcego").
5. **Transição Retângulo → Redondo** (`rectToRound.ts`)
   - Herda do quadrado, mas aceita eixos X/Y assimétricos na base (Comprimento e Largura).
6. **Transição Retângulo → Retângulo (Pirâmide Truncada)** (`rectToRect.ts`)
   - Faces 100% planas dobradas em quinas (sem curvas radiais).
   - Canvas exibe linhas tracejadas de vinco/dobra.

---

## 🧠 Núcleo Matemático e Funcionalidades Críticas

### 1. Compensação de Linha Neutra (`materialThickness.ts`)
Todos os algoritmos de planificação **NÃO** operam com os valores literais do usuário. Antes do cálculo matemático, as dimensões passam pela função `getNeutralLinear` ou `getNeutralDiameter`.
- Medida Interna: O algoritmo soma a espessura.
- Medida Externa: O algoritmo subtrai a espessura.
- Linha Média: Permanece o valor exato.
- **Regra de Ouro:** A planificação geométrica usa sempre a linha média (neutra) da chapa para garantir precisão milimétrica após a calandragem/dobra.

### 2. Triangulação por Desdobramento (Lei dos Cossenos)
Módulos híbridos (ex: Quadrado para Redondo) não calculam "raios" simples. Eles usam a função utilitária `findThirdPoint`:
- Mapeia-se N vértices no topo e N vértices na base no espaço 3D.
- Calcula-se a distância espacial (Hipotenusa) entre vértices adjacentes.
- Transfere-se isso para o plano cartesiano 2D (x, y) construindo triângulos adjacentes pelas distâncias via *Lei dos Cossenos*.
- **Prevenção de Bugs:** `findThirdPoint` trata distâncias `0` ativamente para evitar divisões por zero (`NaN`) nas quinas de polígonos.

### 3. Visualizador Interativo 2D
Todos os componentes `*Canvas.tsx` compartilham a seguinte infraestrutura avançada:
- Auto-escala e centralização baseada em Bounding Box.
- Grid background.
- Ferramenta de medição "Click to Measure" com **Snapping magnético** (Raycasting point-to-line projection) para que o mouse só meça distâncias cravadas nas arestas ou quinas da peça.

### 4. Malhas 3D Dinâmicas (`Piece3D.tsx`)
A geração do 3D é procedural (BufferGeometry) baseada no `PieceType`. Não há modelos `.obj` carregados. A malha mapeia o topo e a base matematicamente (ex: retângulos ligando a círculos geram polígonos de concordância dinâmicos em tempo real).

---

## 🚀 Próximos Passos Sugeridos / TODOs

Caso o desenvolvimento continue, os alvos mais sensatos são:
1. **Transições Curvas "Gomo" (Cotovelos / Curvas de Gomo):**
   - Tubos segmentados (ex: Curva de 90° em 5 gomos).
   - Intersecções (Boca de Lobo plana, tubo cruzando tubo).
2. **Exportação DXF:**
   - Atualmente exportamos PDF técnico (`jspdf` e Imagem Base64 do Canvas).
   - O próximo passo natural da indústria é gerar `.dxf` lendo o array de `basePoints` e `topPoints` para máquinas de Corte Plasma CNC.
3. **Detalhamento de Abas de Solda:**
   - O projeto gera o perímetro final neutro, mas não prevê sobra material para trespasse ou fixação de solda (overlap). Adicionar um campo na UI para gerar um offset externo em uma das arestas da costura.

---
*Gerado por IA (Antigravity). Contexto salvo, engatilhado e pronto para a próxima decolagem.*
