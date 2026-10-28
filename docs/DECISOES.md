# DECISÕES · desvios do SPEC durante a construção

O [`SPEC.md`](SPEC.md) é o contrato original. Este arquivo registra o que mudou depois
de o código existir — e **por quê**. Tudo aqui foi discovered testando o jogo de
verdade (harness headless + robô que joga sozinho), não por gosto.

---

## 1. Plataformas de sentido único, não sólidas

**SPEC original:** plataformas sólidas; `data-solido="false"` marcava as atravessáveis.

**O que ficou:** **todas** as plataformas são de sentido único. O personagem pousa em
cima e atravessa por baixo. `bidirecional: true` só no piso das fases.

**Por quê:** o layout empilha os cards um abaixo do outro com 24 px de folga. Com
plataformas sólidas, o corpo do personagem (63 px) ficava *dentro* do card de cima e a
resolução de colisão o empurrava para fora sem parar — o personagem tremia no lugar e
não subia. Com plataformas de sentido único o corpo passa livre, e a mecânica de
descer (`↓`) aparece como consequência natural.

**Consequência:** a descida entre cards é feita pelo botão `↓` (atravessar a
plataforma), não por buracos. Uma seta `▼` pulsando embaixo dos pés indica quando há
algo para atravessar.

---

## 2. Cards em coluna única

**SPEC original:** grades de 2 e 3 colunas para os cards.

**O que ficou:** `.grade-cartoes` é **uma coluna** em todas as larguras.

**Por quê:** em grade com várias colunas os vãos verticais entre os cards viram
buracos sem saída — o personagem caía no vão e ficava preso no piso da fase, sem
alcance de pulo para voltar aos cards (139 px de altura de pulo contra cards a 400 px
acima). Em coluna única o caminho de descida é garantido: card → card → piso → buraco
→ próxima fase.

**Compensação visual:** a identidade editorial vem do cabeçalho de seção (número
fantasma + título enorme), da linha de tempo e da hierarquia de cartões — não da
grade.

---

## 3. Clamp de coluna de conteúdo

`M.coluna` (`js/mundo.js`) guarda os limites da coluna de conteúdo. O personagem é
preso a `[coluna.esq, coluna.dir − largura]`.

**Por quê:** sem isso, andar para a direita tirava o personagem da coluna, ele caía
no vazio ao lado dos cards e ficava preso no piso. Com o clamp, a única forma de
descer é intencional (`↓` pelos cards, buraco no piso).

---

## 4. Fontes servidas localmente

**SPEC original:** Geist + Geist Mono via Google Fonts.

**O que ficou:** os woff2 (variáveis, subsets latin e latin-ext) baixados para
`fonts/` e servidos por `css/fontes.css` com `@font-face`.

**Por quê:** zero requisições a terceiros, sem pedido de IP, abre offline, sem
*flash* de fonte. 83 KB no total. O `<link>` do Google Fonts saiu do `<head>`.

**Efeito colateral bom:** `document.fonts.ready` dispara rápido e a métrica das letras
(que define a superfície dos títulos) é estável desde o primeiro quadro.

---

## 5. `data-nome` das fases é traduzido

O `data-nome` do HTML fica em **português** (é o rótulo do HUD no padrão). O
`js/site.js` o reescreve a cada troca de idioma, usando as chaves `fase-<id>`. O
`js/jogo.js` só lê `fase.nome` — não sabe nada de idioma.

---

## 6. O HUD é DOM, não canvas

O SPEC já previa isso (§4.5) e a implementação confirmou: texto em canvas é ilegível
em telas de alta densidade e não traduzível. Os ids (`hudVidas`, `hudBugs`,
`hudSkills`, `hudPontos`, `hudTempo`, `hudFaseNum`, `hudFaseNome`) são o contrato
entre o HTML e o `js/jogo.js`.

O `#hud` **precisa** da classe `hud` no HTML — o CSS estiliza a classe, não o id.
Foi o bug que escondeu o HUD na primeira rodada de verificação.

---

## 7. O buraco do piso fica alinhado ao `data-pouso` da fase seguinte

O `data-pouso` é o primeiro card da fase (a plataforma de chegada e o checkpoint de
renascimento). O buraco do piso da fase anterior é centrado nele, com largura
`max(100, 40 × esc)`. A última fase tem piso sólido, sem buraco.

O piso é `bidirecional: true`: `↓` não atravessa o piso, o buraco é a única passagem.

---

## 8. Métrica das letras: `fontBoundingBoxAscent` vs `actualBoundingBoxAscent`

O topo das maiúsculas é medido com `measureText('H')` na fonte **real** do elemento.
Usar `actualBoundingBoxAscent` (a altura da letra H) e não `fontBoundingBoxAscent`
(limite da caixa de linha) é o que faz os pés pousarem exatamente em cima das
maiúsculas, e não no topo da caixa.

O título é quebrado em `<span class="pal">` + `<span class="l">` por letra, e a
quebra é refeita quando o texto muda (tradução) — o atributo `data-texto-salvo`
guarda o texto da última quebra.

---

## 9. O `↓` no ar é soco, no chão é atravessar

`↓` tem dois significados contextuais:

- **no chão** → atravessa a plataforma (`p.ignorar` impede o re-pouso imediato);
- **no ar** → soco para baixo, que mata os bugs que estão logo abaixo.

O soco é também a forma de atacar bugs pelo lado, já que eles andam sobre o card e
não podem ser alcançados por cima emPlatformers.

---

## 10. O que **não** foi feito

- **Sem buracos nos cards.** A primeira ideia era abrir um buraco em cada card para o
  personagem cair pelo ponto exato. Exigia coordenar a posição do buraco de cada card
  com a posição de chegada do card seguinte, para as skills ficarem entre os dois
  pontos. O `↓` resolve o mesmo problema com uma tecla e sem travar o layout.
- **Sem grade de skills em 3 colunas.** As skills são os coletáveis do jogo; em coluna
  única o percurso de coleta é previsível.
- **Sem música ligada por padrão.** O loop de fundo existe (`HL.som.musica`) mas começa
  desligado — o botão `♪` do HUD liga. Um currículo não deve tocar música sozinha.
---

# PARTE 2 · O VOLTO AO PIXEL 2D

## 21. O que aconteceu

A primeira construção deste site tinha duas camadas: o currículo Vercel monocromático na
leitura e um **mundo 3D** (Three.js) quando o jogador apertava PLAY. Foi uma leitura
razoável do pedido — "jogo colorido, personagem 3D, fases desenhadas" — mas o retorno foi
duro e certo:

> "o personagem ficou horrivel, deve ser identico ao [zip de referência]"
> "AO dar play ta indo pra outra interface. AO DAR PLAY DEVE SER POSSIVEL JOGAR"

Duas queixas, duas causas diferentes.

## 22. A personagem 3D não era o personagem

O modelo montado com primitivas (esfera da cabeça, cilindro do corpo, caixas) ficou com cara
de boneco. A referência é outra coisa: **pixel art desenhada em código**, com cabeça em mapa
de caracteres, corpo em retângulos, contorno de silhueta em duas passadas e uma paleta
saturada de 25 cores.

Substituí o modelo 3D pelo módulo de sprites da referência, **sprite por sprite**: o mesmo
personagem (cabelo ruivo, polo escuro, tênis branco), os mesmos bugs rosados, o mesmo glitch
roxo, as mesmas moedas ciano, o mesmo troféu de latão, a mesma caneca de café. E o chip de
skill virou um **hexágono de latão com o nome da skill escrito dentro** — que é o detalhe que
faz a coleta ser legível sem texto de interface.

## 23. "Indo para outra interface"

O modo jogo **substituía** a página: o DOM sumia (`opacity: 0`), a rolagem era travada e um
mundo 3D tomava a tela. Do ponto de vista do visitante, clicar em PLAY era sair do site.

A correção foi inverter a lógica:

- o DOM **nunca** some — o currículo fica ali, legível, enquanto o jogo acontece por cima;
- a **rolagem da página volta a ser a câmera** (o que já era verdade na primeira versão 2D);
- a **nav continua visível** — ela não some nem desliza; o HUD é que desce para abaixo dela;
- o cursor some no desktop porque o personagem é o cursor.

O resultado é o que o site de referência faz: você rola o currículo e o bonequinho corre
em cima dos seus próprios títulos.

## 24. O que foi removido do projeto

`js/cena3d.js` e `vendor/three.min.js` foram apagados, junto com as regras de CSS do 3D e
os scripts correspondentes no HTML. Não ficou código morto: o site ficou menor e mais rápido.

## 25. O que ficou melhor com a volta ao 2D

- O personagem é **pixel art de verdade**, do tamanho certo (18×24 px de arte), desenhado em
  código — sem asset, sem GPU, sem custo de download.
- A página e o jogo são **a mesma coisa**: o que se lê é o que se pula, sem camada de
  tradução.
- A arte é **colorida** onde importa (o jogo) e **monocromática** onde importa (o currículo) —
  exatamente a divisão que o usuário pediu, agora sem sacrificar o personagem.
- A página inteira vira **uma sessão jogável**: os cards são plataformas, os bugs andam
  sobre o texto do currículo, e o troféu Data Modeling flutua acima da sua certificação.

## 26. O que os testes continuaram provando

- `tools/verify.cjs`: 24 checks headless, zero erro de console, desktop + mobile 390×844.
- `tools/testdesc.cjs`: as três mecânicas de descida isoladas (`↓` desce card, buraco troca
  de fase, `↓` desce card-a-card).
- `tools/shot2d.cjs`: fotos do jogo em cada situação (início, pulo, corrida, fase 1, bichos,
  pausa, mobile).
- `tools/autoplay.cjs`: um robô joga o currículo sozinho.

Um check novo merece registro: **"a página continua visivel durante o jogo"** — ele falha se
alguém voltar a esconder o `main` ou a nav. É a regressão exata que o usuário reclamou.
