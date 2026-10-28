# SPEC — Portfólio em Formato de Jogo (Monocromático Vercel)

> Documento **normativo**. Todos os agentes de implementação DEVEM seguir este arquivo ao pé da letra.
> Se algo aqui não estiver claro, não invente: leia de novo e, na dúvida, escolha a opção mais simples
> que satisfaça o texto. Nenhuma implementação pode introduzir dependência externa além das listadas aqui.

---

## 1. Visão

O site de Henrique Lima (currículo) vira um **plataforma vertical em que a própria página é a fase**.
O usuário pode ler o currículo normalmente (modo leitura) ou **jogar** (modo jogo), onde um personagem
pixel-art branco sobe e desce pelo documento, pulando sobre os títulos e cartões, coletando skills,
**esmagando bugs** (a metáfora é literal: ele é QA Engineer) e chegando ao contato.

Referência técnica: a técnica de https://www.pvwebprojects.com/pedro/ (HTML DOM = geometria do jogo,
canvas sobreposto, câmera = rolagem da página). Referência visual: **Vercel** — preto e branco puro,
tipografia geométrica, bordas de 1px, grid, zero cores.

### 1.1 Princípios

| # | Princípio | Consequência prática |
|---|---|---|
| P1 | **Monocromia absoluta** | Só `#000`, `#fff` e tons de `#000`/`#fff` por opacidade. Nenhum accent colorido. |
| P2 | **O documento é o jogo** | Plataformas = elementos DOM reais. Nada é desenhado duas vezes. |
| P3 | **Leitura primeiro** | Sem JS, sem clique, sem som: o site já é um currículo completo e legível. |
| P4 | **Degradação elegante** | Sem Three.js → sem 3D. Sem WebAudio → mudo. Sem `IntersectionObserver` → sem reveal. |
| P5 | **Performance é recurso** | Qualidade adaptativa em 3 níveis, sem nunca subir sozinha. |
| P6 | **Acessibilidade real** | Foco visível, `prefers-reduced-motion` respeitado, canvas decorativo, HTML semântico. |

---

## 2. Stack

**Sem framework. Sem build step. Sem CDN de terceiros no caminho crítico.**

| Camada | Escolha | Nota |
|---|---|---|
| HTML | semântico, um arquivo `index.html` | |
| CSS | `css/estilo.css`, escrito à mão | sem Tailwind, sem AOS |
| JS | vanilla ES5-ish (`var`, IIFE, sem build) | 7 módulos em `js/` |
| Fontes | **Geist** + **Geist Mono** (Google Fonts) | fallback: `ui-sans-serif,system-ui` / `ui-monospace,Menlo` |
| 3D | **Three.js r128** local em `vendor/three.min.js` | MIT; cópia local, sem CDN |
| Áudio | **WebAudio API** sintetizado | nenhum arquivo de som |
| Ícones | **glifos SVG inline** ou texto | nada de Material Symbols / Flaticon |

**Removidos do site atual:** `cdn.tailwindcss.com`, `unpkg.com/aos`, `cdn-icons-png.flaticon.com`,
`fonts.googleapis.com/Material+Symbols`. Todos os seus usos são substituídos por CSS/SVG inline.

---

## 3. Arquitetura de arquivos

```
index.html                  documento + hooks de jogo + HUD + painéis
css/estilo.css              design system Vercel monocromático + camada de jogo
js/qualidade.js             detecção de capacidade + escala automática de qualidade
js/som.js                   síntese de áudio (WebAudio)
js/sprites.js               pixel-art desenhada em código (monocromática)
js/mundo.js                 DOM → geometria do jogo (plataformas, fases, entidades)
js/jogo.js                  física, câmera, entidades, HUD, máquina de estados
js/fundo.js                 fundo parallax monocromático
js/cena3d.js                cena Three.js wireframe (regressa se a lib falhar)
js/site.js                  nav, progresso, reveal, i18n, troca de modo
vendor/three.min.js         Three.js r128 (MIT)
assets/imagemPerfil.jpg     foto atual (reutilizar)
curriculo.pdf               currículo para download (reutilizar)
docs/SPEC.md                este documento
```

### 3.1 Ordem de carregamento (obrigatória)

```html
<script src="js/qualidade.js"></script>
<script src="js/som.js"></script>
<script src="js/sprites.js"></script>
<script src="js/mundo.js"></script>
<script src="js/fundo.js"></script>
<script src="js/jogo.js"></script>
<script src="js/site.js"></script>
<script src="vendor/three.min.js" defer></script>
<script src="js/cena3d.js" defer></script>
```

`cena3d.js` roda `defer` e só inicializa se `window.THREE` existir.

---

## 4. Namespace e contratos de API

Namespace global: **`HL`** (`window.HL = window.HL || {}`).

### 4.1 `HL.qualidade` — `js/qualidade.js`

```js
HL.qualidade = {
  nivel: 'alto' | 'medio' | 'baixo',   // nível ATUAL, sempre válido
  escolha: 'auto' | 'alto' | 'medio' | 'baixo',
  aoMudar: function(fn) {},             // fn(nivelNovo) — chamado quando o nível muda
  definir: function(nivel) {},          // fixa o nível (persiste em localStorage)
  auto: function() {},                  // volta para 'auto'
  limites: { alto: {...}, medio: {...}, baixo: {...} }
}
```

`limites` por nível:

| nível | `dpr` | `partes` (partículas) | `grade3d` (detalhe 3D) |
|---|---|---|---|
| `alto` | 2 | 700 | 1 |
| `medio` | 1.25 | 350 | 2 |
| `baixo` | 1 | 150 | 3 |

Regras:
1. Na inicialização, **palpite** pela capacidade do aparelho (núcleos, memória, GPU por
   `WEBGL_debug_renderer_info`, `saveData`, pointer grosso) → escolhe nível inicial.
2. Durante o uso, mede FPS real em janelas de 2s. Se a média < 40 → **desce** um nível.
   **Nunca sobe sozinho** (evita oscilação).
3. `escolha` do usuário (fixado no painel de pausa) tem precedência sobre tudo e persiste em
   `localStorage['hl.qualidade']`. Default `'auto'`.
4. Todo acesso a `nivel` deve tolerar `HL.qualidade` ausente (retornar `'alto'`).

### 4.2 `HL.som` — `js/som.js`

```js
HL.som = {
  tocar: function(nome) {},   // dispara um efeito
  ligar: function() {},        // desbloqueia o AudioContext (chamar em gesto do usuário)
  desligar: function() {},
  ligado: true,               // booleano
  musica: function(ligar) {},  // liga/desliga o loop de fundo
  aoMudar: function(fn) {}     // fn(ligado)
}
```

Nomes de efeito **obrigatórios** (todos devem existir):

| nome | som |
|---|---|
| `pulo` | quadrada 420→680 Hz, 0.12 s |
| `pulo2` | quadrada 620→980 Hz, 0.14 s |
| `aterrissar` | burst de ruído curto, envelope rápido |
| `bit` | tick 1200 Hz, 0.05 s |
| `skill` | blip em duas notas 880→1320 Hz |
| `trofeu` | arpejo ascendente de 4 notas |
| `cafe` | tom grave quente, 0.2 s |
| `soco` | ruído + dente-de-serra descendente |
| `bug` | estouro: ruído + varredura descendente 600→120 Hz |
| `dano` | dente-de-serra 300→80 Hz, 0.35 s |
| `fase` | arpejo C-E-G-C (4 notas) |
| `fim` | arpejo de vitória (5 notas) |
| `pausa` | clique curto grave |

Regras:
- `HL.som.ligar()` só pode ser chamado a partir de um gesto do usuário; se o `AudioContext` estiver
  `suspended`, retomar com `resume()`.
- `tocar()` é **no-op** se `ligado === false` ou se o contexto não está rodando.
- Todo nó de áudio é criado e descartado por evento (sem vazamento).
- Ganho mestre: sfx `0.22`, música `0.10`.
- Música: loop de baixo volume (arpejo em La menor, 8 passos, ~76 BPM). Começa **desligada** e é
  ligada pelo botão `♪` do HUD. Estado persistido em `localStorage['hl.som']`.

### 4.3 `HL.sprites` — `js/sprites.js`

Pixel-art **desenhada em código** (mapas de caracteres), **monocromática**, pré-renderizada em canvas
offscreen e copiada com `drawImage`.

```js
HL.sprites = {
  jogador: { ... },   // frames de idle/correr/pular/cair/socar/piscar
  bug: { ... },
  glitch: { ... },
  bit: { ... },
  skill: { ... },
  trofeu: { ... },
  cafe: { ... },
  desenhar: function(ctx, nome, x, y, esc, opcoes) {}
}
```

Regras:
- 1 caractere = 1 pixel de arte. Paleta **apenas**:
  `'#'` = contorno preto, `'W'` = branco puro, `'w'` = branco a 60% (sombra),
  `'g'` = branco a 30% (fundo/detalhe).
- Nada de cor. Se o sprite original do Pedro tinha ciano/magenta, **não copie**: redesenhe em B/W.
- `desenhar(ctx, nome, x, y, esc, opcoes)`:
  - `x`,`y` = canto superior esquerdo **em pixels de arte** já multiplicados? **Não**: `x`,`y` são
    coordenadas de tela em CSS px; `esc` = tamanho de 1 pixel de arte em CSS px.
  - `opcoes = { quadro: n, virado: bool, alpha: n }`
  - Usa `ctx.imageSmoothingEnabled = false`.
- O jogador **deve** ter, no mínimo, 2 quadros de corrida e 1 de piscar (a linha dos olhos troca
  `'E'` por `'W'`).

### 4.4 `HL.mundo` — `js/mundo.js`

Transforma o DOM na geometria do jogo. **Todas as coordenadas em px do documento.**

```js
HL.mundo = {
  W: 0, H: 0, esc: 3,          // largura da viewport, altura do documento, px por pixel de arte
  plats: [],                   // plataformas ordenadas por y
  porEl: new Map(),            // elemento -> plataforma
  fases: [],                   // fases (seções)
  pisos: [],                   // chão de cada fase (com buraco de passagem)
  versao: 0,
  preparar: function() {},     // separa títulos em letras (data-letras) — chamar 1x
  medir: function() {},        // recalcula geometria — chamar no load, resize e após i18n
  criarEntidades: function() {},// cria a lista de entidades a partir dos data-attrs
  posicionar: function(ents) {},// reposiciona entidades após medir()
  faseDe: function(y) {},      // índice da fase em que um y cai
  posDoc: function(el) {}      // offset do elemento no documento (ignora transform)
}
```

#### Regras de medição (críticas para a física)

1. `posDoc(el)`: soma `offsetLeft`/`offsetTop` subindo por `offsetParent`, adicionando
   `clientLeft`/`clientTop` do pai. **Ignora `transform`** — animações CSS não podem quebrar a física.
2. `esc = window.innerWidth < 720 ? 2 : 3`.
3. Uma plataforma é criada para cada `[data-plat]` **visível** (`offsetParent` não nulo e
   `offsetWidth >= 16`).
4. Para `[data-letras]` (títulos), a superfície é o **topo das maiúsculas**, medido com
   `CanvasRenderingContext2D.measureText('H')` na fonte real do elemento:
   ```
   lh = lineHeight === 'normal' ? ascent + descent : parseFloat(lineHeight)
   topo = (lh - (ascent + descent)) / 2 + ascent - capHeight
   ```
   E a largura da plataforma = do `x0` da primeira letra ao `x1` da última letra **da primeira linha**.
   Cada letra vira uma sub-plataforma (para o "afundar" ao ser pisada).
5. `data-dy="0.12"` numa plataforma desloca a superfície para baixo em `0.12 × fontSize` (útil para
   alinhar a borda de um card).
6. **Chão de cada fase**: o fundo de cada `[data-fase]` é sólido, com um **buraco** alinhado ao
   `data-pouso` da fase seguinte. O buraco só aparece no modo jogo (via CSS).
   - `ALTURA_CHAO = 10` px.
   - O buraco tem largura `max(100, 40 * esc)` px, centrado no `data-pouso` da próxima fase,
     clamped para não encostar nas bordas (margem de 12 px).
   - A última fase tem chão sólido, sem buraco.
7. `M.pisos[i] = { fase, y, x0, x1, cx, destino }` — `destino` é o `y` do pouso da fase seguinte.
8. `faseDe(y)`: devolve o índice da última fase cujo `top <= y`.

#### Regras de entidades (criadas a partir dos `data-*` do DOM)

| data-attr | tipo | posição | quantidade |
|---|---|---|---|
| `data-bits="N"` | `bit` | arco sobre a plataforma, `bx` (0..1) define o centro | N |
| `data-skill="A\|B\|C"` | `skill` | sobre a plataforma, `data-sx="0.2\|0.5\|0.8"` define o x relativo | 1 por nome |
| `data-trofeu="NOME"` | `trofeu` | centro da plataforma | 1 |
| `data-cafe` | `cafe` | 90% da largura da plataforma | 1 |
| `data-bugs="N"` | `bug` | anda sobre a plataforma, ida e volta | N |
| `data-glitch="N"` | `glitch` | flutua acima da plataforma, oscila em elipse | N |
| (automático) | `bit` | trilha caindo pelo buraco entre fases | 4 por buraco |

Cada entidade: `{ tipo, el, nome?, vivo: true, x, y, ... }`.
`posicionar(ents)` recalcula `x`/`y` de todas — **chamar sempre depois de `medir()`**.

### 4.5 `HL.jogo` — `js/jogo.js`

```js
HL.jogo = {
  jogar: function() {},       // entra no modo jogo
  pausar: function() {},
  continuar: function() {},
  reiniciar: function() {},
  sair: function() {},         // volta ao modo leitura (mantém a rolagem)
  estado: {...},               // estado interno (leitura)
  jogador: {...}               // estado interno do personagem (leitura)
}
```

#### Estados (`estado.modo`)

```
menu → jogando ⇄ pausado → fim
             ↓  ↑
            morto   (volta ao checkpoint)
fora = modo leitura depois de ter jogado
```

- `menu`: modo leitura, o personagem fica parado na fase atual, sem input. O site rola normalmente.
- `jogar()`: seta `modo = 'jogando'`, adiciona `.modo-jogo` no `<body>`, mostra o HUD, esconde a nav,
  mede o mundo, posiciona o jogador no `data-pouso` da fase 0, `HL.som.ligar()`.
- `sair()`: `modo = 'fora'`, remove `.modo-jogo`, esconde o HUD, devolve a nav. **A rolagem da página
  não muda.**
- `pausar()`: `modo = 'pausado'`, mostra `#painel`, `HL.som.tocar('pausa')`.
- `continuar()`: `modo = 'jogando'`, esconde `#painel`.
- `reiniciar()`: zera pontuação, vidas, entidades, e volta ao `data-pouso` da fase 0.
- `fim`: quando o jogador chega ao goal da última fase → mostra painel de resultado
  (tempo, bugs corrigidos, skills coletadas, "RANK") e o botão "JOGAR DE NOVO".
- `morto`: ao levar dano sem vidas → `mortoT` de 1.4 s, tela pisca, depois `renascer()` no checkpoint.

#### Física (constantes para `esc = 3`; escalar por `k = esc / 3`)

```js
C = {
  grav: 2300, pulo: 800, pulo2: 690, corrida: 350,
  acel: 3000, atrito: 2800, acelAr: 1900,
  quedaMax: 1150, quique: 600, quiqueAlto: 820,
  empurraX: 330, empurraY: 440,
  coyote: 0.1, buffer: 0.13, invuln: 1.3
}
```

- Aceleração horizontal: `vx = aproximar(vx, alvo, acel * dt)`; no chão `acel`/`atrito`, no ar `acelAr`.
- **Coyote time** (0.1 s) e **jump buffer** (0.13 s) — obrigatórios.
- **Pulo variável**: soltar o botão corta o pulo (`vy = -pulo * 0.42`).
- **Pulo duplo**: 1 pulo extra (`pulo2`), resetado ao tocar o chão.
- **Soco**: `↓` no ar → soco para baixo (dá dano a bugs e **quebra plataformas frágeis**).
  `↓` no chão sobre plataforma não-sólida → **desce pela plataforma**.
- Colisão AABB contra plataformas; resolução por eixo (menor penetração primeiro), com
  `cabeçada` (bater com a cabeça) e `pousar` (aterrissar).
- Plataformas não-sólidas (`data-solido="false"` ou `.plataforma`) são atravessáveis por baixo.
- Um inimigo só é esmagado se o jogador cair sobre ele (`vy > 0` e pés acima do centro do inimigo).

#### Câmera (a rolagem da página É a câmera)

```js
maxS = max(0, document.documentElement.scrollHeight - innerHeight)
alvo = p.y + p.h * 0.5 - H * 0.42
if (p.vy > 0 && !p.chao) alvo += min(p.vy * 0.25, H * 0.22)
alvo = clamp(alvo, 0, maxS)
cam += (alvo - cam) * (1 - exp(-dt * 7))
if (|cam - scrollY| > 0.5) window.scrollTo(0, cam)
```

- Rolagem manual (wheel / touchmove) suspende a câmera por **1400 ms** (`estado.manualAte`).
- `visibilitychange` → pausa o jogo se a aba ficar oculta.

#### Laço principal

- `requestAnimationFrame` sempre ativo.
- Física com **passo fixo de 1/120 s**, no máximo 12 passos por quadro (evita espiral de morte).
- `dt` máximo de 0.1 s.
- Se `document.hidden`, não simula.

#### Entrada

| Ação | Teclas |
|---|---|
| mover | `←` `→` / `A` `D` |
| pular | `Espaço` `↑` `W` |
| descer / soco | `↓` `S` |
| pausar | `Esc` `P` |
| sair do jogo | `Esc` (no painel de pausa) |

No toque: botões na tela (`#toque`) com `pointerdown`/`pointerup`/`pointercancel`, `touch-action: none`.

#### HUD (DOM, não canvas)

Elementos **obrigatórios** (ids):

| id | conteúdo |
|---|---|
| `hud` | container do HUD (`hidden` fora do modo jogo) |
| `hudVidas` | corações (ex.: `♥♥♥`) |
| `hudBugs` | `12/18` (bugs corrigidos / total) |
| `hudSkills` | `24/30` |
| `hudTempo` | `03:22` |
| `hudPontos` | pontos |
| `hudFaseNum` | `FASE 03` |
| `hudFaseNome` | `ÁREAS DE ATUAÇÃO` |
| `btnSom` | alterna som (`♪` / `♪̸`) |
| `btnPausa` | pausa (`❚❚`) |
| `aviso` | toast de mensagem (ex.: "FASE 2 · EXPERIÊNCIA") |
| `painel` | painel de pausa (`hidden`) |
| `painelCaixa` | conteúdo do painel |
| `banner` | banner grande de entrada de fase |

O HUD é **DOM** (não canvas) para ser acessível, traduzível e nítido.

#### Game over / checkpoint

- Vidas: **3**. Levar dano → -1 vida, `invuln = 1.3 s` (pisca), tremor de tela, som `dano`.
- Sem vidas → `morto` → respawn no `data-pouso` da última fase alcançada (`estado.checkpoint`).
- `data-cafe` (café) → **+1 vida** (máx. 3) + bônus de tempo.

#### Fim de jogo

- O **goal** é o último `[data-pouso]` da fase final (`CONTATO`), marcado com `data-goal="1"`.
- Ao tocar o goal: banner "FIM", som `fim`, painel de resultado com tempo, bugs, skills, pontuação e
  um **RANK** calculado (S/A/B/C) + botão "JOGAR DE NOVO".

### 4.6 `HL.fundo` — `js/fundo.js`

Fundo parallax monocromático em `<canvas id="fundo">` (fixo, `z-index: 0`).

- 3 camadas de partículas (brancas com alfa variável por profundidade).
- Velocidades de parallax: `0.12`, `0.30`, `0.55` do scroll.
- Um **grid em perspectiva** no fundo (linhas brancas a 6% de alfa) que desliza com o scroll.
- Partículas viram **rastros** quando a página rola rápido (> 1200 px/s).
- Contagem de partículas = `HL.qualidade.limites.partes`.
- `prefers-reduced-motion` → 0 partículas, só o grid estático.
- Nunca deve interceptar pointer (`pointer-events: none`).

### 4.7 `HL.cena3d` — `js/cena3d.js`

Cena Three.js **wireframe monocromática** (só linhas brancas; sem luzes, sem materiais PBR).

```js
HL.cena3d = {
  focar: function(x, y) {},      // ponto do documento para o qual a câmera olha (null = centro)
  peso: function(el, t, w) {},    // quando o jogador pisa em `el`, a cena reage (t = 0..1, w = largura)
  evento: function(nome) {},      // 'pulo' | 'aterrissar' | 'soco' | 'dano' | 'fase' | 'skill'
  tremor: function(tx, ty) {},    // tremor de tela
  entrar: function(el) {}         // pulso quando um card entra na tela
}
```

Conteúdo da cena:
- **Icosaedro wireframe** (raio ~90) girando devagar em Y, com oscilação em X.
- **Cubo wireframe** orbitando o icosaedro.
- **Grid de chão** wireframe (20×20, alcance 800) em alfa baixo.
- Cor: `0xffffff`, `LineBasicMaterial` com `transparent` e opacidade 0.9 (objeto) / 0.12 (grid).
- `focar(x,y)`: converte coordenada de documento → viewport (`y - scrollY`) e faz a câmera olhar.
- `peso(el,t,w)`: desloca e inclina a cena na direção do peso do jogador.
- `evento('pulo')`: spin mais rápido; `'dano'`: tremor; `'fase'`: pulso de escala.
- Deve **parar** o laço quando a aba está oculta e **degradar** se `HL.qualidade.limites.grade3d > 1`
  (menos segmentos, sem grid).
- Se `window.THREE` não existir → `HL.cena3d` **não é definido**; todo chamador deve testar
  `if (HL.cena3d)`.

### 4.8 `HL.site` — `js/site.js`

Comportamento **fora** do jogo:

- Nav fixa com barra de progresso de leitura (largura = `scrollY / (scrollHeight - innerHeight)`).
- Link de nav ativo conforme a seção visível (`getBoundingClientRect().top <= innerHeight * 0.35`).
- **Reveal** por `IntersectionObserver`: adiciona `.dentro` em `.rev`. Alvos: `.fase h2`, `.cartao`,
  `.lista li`, `.specs > div`, `.ponto`, `.citacao`, `.heroi-texto`, `.heroi-acoes`, `.controles`.
  - `threshold: 0.08`, `rootMargin: '0px 0px -40px 0px'`, uma vez só (`unobserve`).
  - Sem `IntersectionObserver` → sem reveal (conteúdo visível por padrão).
- **i18n**: dicionário `HL.i18n = { pt: {...}, en: {...} }`; `HL.site.setLanguage(lang)`.
  - Atualiza todo `[data-i18n]` via `innerHTML` (as descrições contêm `<li>`).
  - Atualiza `document.documentElement.lang`.
  - **Re-medir o mundo** após trocar idioma (`HL.mundo.medir()` + `HL.mundo.posicionar(...)`),
    porque o texto muda e a geometria muda.
  - Default: **EN** (como o site atual), persistido em `localStorage['hl.lang']`.
  - Ao trocar idioma **no modo jogo**, pausar o jogo, trocar, re-medir e continuar.
- Botão `[data-acao="jogar"]` → `HL.jogo.jogar()`.
- Menu mobile: botão `[data-acao="menu"]` alterna `#menu-mobile`.

---

## 5. Design system (Vercel monocromático)

### 5.1 Tokens (em `:root`)

```css
:root {
  --preto:        #000000;
  --branco:       #ffffff;
  --sup-1:        #0a0a0a;   /* superfície sutil */
  --sup-2:        #111111;   /* superfície de card */
  --sup-3:        #1a1a1a;   /* superfície elevada / hover */
  --linha:        #262626;   /* borda 1px */
  --linha-forte:  #404040;   /* borda 1px em hover/destaque */
  --texto:        #ffffff;
  --texto-2:      #a1a1a1;   /* secundário */
  --texto-3:      #707070;   /* terciário / labels */
  --texto-4:      #4d4d4d;   /* desabilitado */
  --foco:         #ffffff;

  --fonte: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --fonte-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  --r-p: 2px;     /* raio pequeno */
  --r-m: 4px;     /* raio médio */
  --r-g: 8px;     /* raio grande */
  --r-full: 999px;

  --e-1: 8px;  --e-2: 12px; --e-3: 16px; --e-4: 24px;
  --e-5: 32px; --e-6: 48px; --e-7: 64px; --e-8: 96px; --e-9: 128px;

  --t-fast: 120ms;
  --t-base: 180ms;
  --t-slow: 320ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Regra P1:** nenhuma cor fora desta lista. Nada de `#f2f20d`, `#ff6b6b`, `#4ecdc4`, `#45b7d1`.
(As quatro cores do site atual viram tons de cinza ou são removidas.)

### 5.2 Tipografia

| Elemento | Tamanho | Peso | Line-height | Letter-spacing | Família |
|---|---|---|---|---|---|
| `h1` (hero) | `clamp(44px, 9vw, 128px)` | 600 | 0.92 | -0.04em | `--fonte` |
| `h2` (seção) | `clamp(30px, 5vw, 64px)` | 600 | 1.02 | -0.03em | `--fonte` |
| `h3` (card) | `clamp(17px, 1.6vw, 21px)` | 600 | 1.25 | -0.01em | `--fonte` |
| `body` | `16px` | 400 | 1.6 | normal | `--fonte` |
| `p` (lead) | `clamp(17px, 1.5vw, 20px)` | 400 | 1.6 | normal | `--fonte` |
| `.label` | `11px` | 500 | 1.2 | 0.08em | `--fonte-mono`, UPPERCASE |
| `.mono` | `13px` | 400 | 1.5 | 0 | `--fonte-mono` |
| `.link` | `14px` | 500 | 1.4 | 0 | `--fonte`, underline no hover |

- Escala fluida com `clamp()`.
- `font-synthesis: none` para não falsificar o peso do Geist.
- `text-wrap: balance` nos títulos; `text-wrap: pretty` nos parágrafos.

### 5.3 Layout

- Container: `max-width: 1200px` (conteúdo), `1400px` (full-bleed), padding lateral
  `clamp(16px, 4vw, 48px)`.
- Grid de 12 colunas para o hero.
- Bordas: `1px solid var(--linha)` por padrão; `1px solid var(--linha-forte)` no hover.
- Cards: fundo `var(--sup-2)`, borda 1px, raio `--r-m`, **sem sombra colorida** (Vercel usa borda, não
  sombra). No hover: borda `#404040` + `translateY(-2px)` + `transition 180ms`.
- **Vercel signature**: o botão primário é **branco com texto preto**; o secundário é **transparente
  com borda**. Hover = inversão (`background: #fff; color: #000`).
- **Shadow tokens** (Vercel usa sombra apenas em elementos flutuantes):
  `--shadow-1: 0 1px 2px rgba(0,0,0,.4)`, `--shadow-2: 0 4px 12px rgba(0,0,0,.5)`.

### 5.4 Movimento

- Durações: `--t-fast` (hover), `--t-base` (transições de estado), `--t-slow` (reveal).
- Curva: `--ease` (sem bounce, sem overshoot). **Proibido** `cubic-bezier` com overshoot no design
  system (a camada de jogo pode usar easing de física, que é diferente).
- `prefers-reduced-motion: reduce` → `animation-duration: .01ms`, `transition-duration: .01ms`,
  sem parallax, sem tremor de tela, sem partículas.

### 5.5 Foco

```css
:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; border-radius: var(--r-p); }
```

### 5.6 Camada de jogo (`.modo-jogo`)

Quando `<body>` tem `.modo-jogo`:

| regra | efeito |
|---|---|
| `.modo-jogo .nav` | `transform: translateY(-105%)` (nav some) |
| `.modo-jogo [data-plat]` | pseudo-elemento `::before` = linha branca de 2px no topo (a "superfície") |
| `.modo-jogo .chao` | aparece (faixa de chão com textura de pixel) |
| `.modo-jogo .chao .buraco` | aparece (buraco de passagem) |
| `.modo-jogo .cartao.pisado` | borda fica branca (o jogador está em cima) |
| `.modo-jogo .l.pisada` | a letra afunda (`translateY(.05em)`) |
| `.modo-jogo` (body) | `cursor: none` no desktop (o sprite é o cursor) |
| `.modo-jogo .fase.fase-ativa::after` | varredura branca de 1.5 s |

O `.chao` é um `div` inserido por JS dentro de cada `.fase` (com `aria-hidden="true"`), contendo
dois `<i>` (blocos do chão) e um `<b class="buraco">`.

---

## 6. Estrutura do documento (contrato de HTML)

### 6.1 Esqueleto

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Henrique Lima — QA Engineer & Automation</title>
  <meta name="description" content="...">
  <meta name="theme-color" content="#000000">
  <meta property="og:title" content="..."> ... (og:title, og:description, og:type, og:image)
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/estilo.css">
</head>
<body>
  <canvas id="fundo" aria-hidden="true"></canvas>   <!-- z-index 0, fixo -->
  <canvas id="cena3d" aria-hidden="true"></canvas>   <!-- z-index 30, fixo -->
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>

  <header id="nav"> ... </header>
  <main id="conteudo">
    <section class="fase" id="inicio" data-fase data-nome="INÍCIO"> ... </section>
    <section class="fase" id="experiencia" data-fase data-nome="EXPERIÊNCIA"> ... </section>
    <section class="fase" id="areas" data-fase data-nome="ÁREAS DE ATUAÇÃO"> ... </section>
    <section class="fase" id="skills" data-fase data-nome="SKILLS & FERRAMENTAS"> ... </section>
    <section class="fase" id="formacao" data-fase data-nome="FORMAÇÃO"> ... </section>
    <section class="fase" id="contato" data-fase data-nome="CONTATO"> ... </section>
  </main>
  <footer> ... </footer>

  <canvas id="jogo" aria-hidden="true"></canvas>      <!-- z-index 40, fixo -->
  <div id="hud" hidden> ... </div>
  <div id="banner" hidden></div>
  <div id="aviso" hidden></div>
  <div id="painel" hidden> <div id="painelCaixa"></div> </div>
  <div id="toque" hidden> ... </div>
  ...scripts...
</body>
</html>
```

### 6.1b Marcação exata do HUD, do painel e do toque (obrigatória)

O `index.html` **deve** conter exatamente estes elementos e ids. O `js/jogo.js` atualiza só o
**conteúdo textual** deles — nunca a estrutura.

```html
<div id="hud" hidden>
  <div class="hud-topo">
    <div class="hud-linha">
      <span id="hudVidas" class="hud-vidas"></span>
      <span class="hud-item"><span class="label">BUGS</span><span id="hudBugs">0/0</span></span>
      <span class="hud-item"><span class="label">SKILLS</span><span id="hudSkills">0/0</span></span>
      <span class="hud-item"><span class="label">PONTOS</span><span id="hudPontos">0</span></span>
      <span class="hud-item"><span class="label">TEMPO</span><span id="hudTempo">00:00</span></span>
    </div>
    <div class="hud-fase">
      <span id="hudFaseNum" class="label">FASE 01</span>
      <strong id="hudFaseNome">INICIO</strong>
    </div>
    <div class="hud-botoes">
      <button id="btnSom" class="hud-btn" data-acao="som" type="button" aria-label="Som">♪</button>
      <button id="btnPausa" class="hud-btn" data-acao="pausar" type="button" aria-label="Pausar">❚❚</button>
    </div>
  </div>
</div>

<div id="banner" class="banner" hidden></div>
<div id="aviso" class="aviso" hidden></div>

<div id="painel" class="painel" hidden>
  <div id="painelCaixa" class="painel-caixa">
    <span class="label">PAUSADO</span>
    <h2 class="painel-titulo" data-i18n="game-paused">PAUSADO</h2>
    <div class="painel-qualidade">
      <span class="label">QUALIDADE</span>
      <b class="qualidade-agora">AUTO</b>
      <div class="painel-opcoes">
        <button type="button" class="btn btn-s" data-q="auto">AUTO</button>
        <button type="button" class="btn btn-s" data-q="alto">ALTO</button>
        <button type="button" class="btn btn-s" data-q="medio">MEDIO</button>
        <button type="button" class="btn btn-s" data-q="baixo">BAIXO</button>
      </div>
    </div>
    <div class="painel-acoes">
      <button type="button" class="btn btn-p" data-acao="continuar" data-i18n="game-resume">CONTINUAR</button>
      <button type="button" class="btn btn-s" data-acao="reiniciar" data-i18n="game-restart">REINICIAR</button>
      <button type="button" class="btn btn-s" data-acao="sair" data-i18n="game-exit">SAIR DO JOGO</button>
    </div>
  </div>
</div>

<div id="toque" class="toque" hidden>
  <div class="toque-lado">
    <button type="button" class="toque-btn" data-toque="esq" aria-label="Esquerda">◀</button>
    <button type="button" class="toque-btn" data-toque="dir" aria-label="Direita">▶</button>
  </div>
  <div class="toque-lado">
    <button type="button" class="toque-btn" data-toque="baixo" aria-label="Descer / soco">▼</button>
    <button type="button" class="toque-btn toque-btn-p" data-toque="pulo" aria-label="Pular">▲</button>
  </div>
</div>
```

A **nav** segue este esqueleto:

```html
<header id="nav" class="nav">
  <div class="nav-grade">
    <a class="marca" href="#inicio">HENRIQUE<span>.LIMA</span></a>
    <nav class="nav-links">
      <a href="#experiencia" data-i18n="nav-experience">EXPERIENCE</a>
      <a href="#areas" data-i18n="nav-expertise">EXPERTISE</a>
      <a href="#skills" data-i18n="nav-skills">SKILLS</a>
      <a href="#formacao" data-i18n="nav-education">EDUCATION</a>
      <a href="#contato" data-i18n="nav-contact">CONTACT</a>
    </nav>
    <div class="nav-langs">
      <button type="button" class="lang-btn" data-lang="pt">PT</button>
      <button type="button" class="lang-btn" data-lang="en">EN</button>
    </div>
    <button type="button" class="btn btn-s nav-jogar" data-acao="jogar" data-i18n="game-play">PLAY</button>
    <button type="button" class="nav-menu-btn" data-acao="menu" aria-label="Menu">☰</button>
  </div>
  <div class="progresso" id="progresso"></div>
</header>
```

### 6.2 Fases (6) — ordem, ids e `data-nome`

| # | `id` | `data-nome` | título | `data-pouso` em |
|---|---|---|---|---|
| 0 | `inicio` | `INÍCIO` | `h1` do hero | o `h1` (com `data-letras`) |
| 1 | `experiencia` | `EXPERIÊNCIA` | `h2` | 1º card |
| 2 | `areas` | `ÁREAS DE ATUAÇÃO` | `h2` | 1º card |
| 3 | `skills` | `SKILLS & FERRAMENTAS` | `h2` | 1º card |
| 4 | `formacao` | `FORMAÇÃO` | `h2` | 1º card |
| 5 | `contato` | `CONTATO` | `h2` | bloco de links (`data-goal="1"`) |

`data-nome` tem valor **em português** (é o rótulo do HUD). A versão em inglês vem do i18n
(`HL.i18n[lang]['fase-' + id]`), aplicada pelo `site.js`.

### 6.3 Contrato dos hooks de jogo

| hook | onde | efeito |
|---|---|---|
| `data-fase` | nas 6 `<section>` | início de uma fase |
| `data-nome` | nas 6 `<section>` | nome exibido no HUD |
| `data-plat` | títulos (`h1`, `h2`) e cards | superfície de pouso |
| `data-letras` | `h1` do hero + `h2` de cada fase | superfície = topo das maiúsculas; letras afundam ao pisar |
| `data-pouso` | 1 elemento por fase | checkpoint + ponto de chegada do buraco anterior |
| `data-skill="A\|B"` | cards de skills | coletáveis nomeados |
| `data-sx="0.2\|0.8"` | (no mesmo elemento) | posição horizontal relativa de cada skill |
| `data-bits="N"` | plataformas | N tokens genéricos |
| `data-bx="0.5"` | (no mesmo elemento) | centro do arco de bits (0..1) |
| `data-bugs="N"` | cards de experiência | N inimigos patrulhando |
| `data-glitch="N"` | cards de áreas | N inimigos flutuantes |
| `data-trofeu="NOME"` | card de certificação | troféu |
| `data-cafe` | 1 por fase (≤6) | café → +1 vida |
| `data-goal="1"` | fase final | fim do jogo |
| `data-acao="jogar\|pausar\|continuar\|reiniciar\|sair\|som\|menu"` | botões | ações |
| `data-i18n="chave"` | qualquer elemento | tradução |
| `data-q="alto\|medio\|baixo\|auto"` | botões do painel | fixar qualidade |

### 6.4 Inventário de classes CSS (obrigatório — HTML e CSS precisam concordar)

**Layout e estrutura**
`container`, `fase`, `fase-interna`, `grade`, `grid-2`, `grid-3`, `grade-cartoes`,
`col`, `secao`, `secao-cabecalho`, `fase-num`, `titulo-fase`, `rodape`, `rodape-grade`,
`pular`, `sr-only`.

**Hero**
`hero`, `hero-grade`, `hero-texto`, `hero-visual`, `hero-acoes`, `hero-stats`, `stat`,
`retrato`, `badge`.

**Cartões e listas**
`cartao`, `cartao-cabecalho`, `cartao-corpo`, `cartao-pe`, `cartao-lista`, `cargo`,
`periodo`, `lista`, `lista li`, `chip`, `chip-grade`, `painel-links`, `link-bloco`,
`link-bloco-rotulo`, `link-bloco-valor`.

**Tipografia**
`label`, `mono`, `lead`, `link`, `titulo`, `destaque`.

**Botões**
`btn`, `btn-p`, `btn-s`, `btn-icone`.

**Nav**
`nav`, `nav-grade`, `nav-links`, `nav-links a`, `nav-links a.ativo`, `marca`,
`nav-langs`, `lang-btn`, `lang-btn.ativo`, `nav-jogar`, `nav-menu-btn`, `progresso`.

**Estado e animação**
`rev`, `dentro`, `ativo`, `pisado`, `l`, `pal`, `modo-jogo`, `tem-toque`, `fase-ativa`.

**Camada de jogo**
`chao`, `chao i`, `chao .buraco`, `hud`, `hud-topo`, `hud-linha`, `hud-item`,
`hud-vidas`, `hud-fase`, `hud-botoes`, `hud-btn`, `banner`, `aviso`, `painel`,
`painel-caixa`, `painel-titulo`, `painel-qualidade`, `painel-opcoes`, `painel-acoes`,
`toque`, `toque-lado`, `toque-btn`, `toque-btn-p`, `fase::after`.


### 6.5 Conteúdo (fonte: site atual, `index.html` antigo)

**HERO**
- Badge: `QA Engineer & Automation` / `QA Engineer & Automação`
- H1: `Hello, I'm Henrique` / `Olá, sou Henrique`
- H2: `QA Engineer & Automation Specialist` / `QA Engineer & Especialista em Automação`
- Lead (EN): "I have been working as a QA Engineer at Netcracker Technology for 4 years, offering
  technical support, end-to-end testing, and smart automations. Focused on problem-solving and
  continuous improvement."
- Lead (PT): "Atuo há 4 anos como QA Engineer na Netcracker Technology, oferecendo suporte técnico,
  testes de ponta a ponta e automações inteligentes. Foco na resolução de problemas e melhoria contínua."
- CTAs: `Download CV` → `curriculo.pdf` (ou pasta do Drive — usar **o PDF local**);
  `Contact Me` → `https://wa.me/5571999088651`.
- Botão de jogo: `PLAY THE RESUME` / `JOGAR O CURRÍCULO` → `data-acao="jogar"`.
- Stat: `4+ YEARS EXP`.
- Foto: `assets/imagemPerfil.jpg`, em grayscale, dentro de card com borda 1px.

**EXPERIÊNCIA** (4 cards, na ordem)
1. **Netcracker** — `May 2021 - Present` / `Mai 2021 - Presente`
   - **QA Engineer** — `February 2024 - Present` / `Fev 2024 - Presente`
     - EN: "E2E test cases scenario execution in order to provide support/find bugs after deployments" ·
       "System test configuration, ticket creation and bug analysis" ·
       "Test scenario validation with developers" ·
       "Automation of tests and API requests (REST), billing provisioning."
     - PT: "Execução de casos de teste E2E para suporte e identificação de bugs após deploys." ·
       "Configuração de testes de sistema, criação de tickets e análise de bugs." ·
       "Validação de cenários de teste com desenvolvedores e feedback com equipe de produtos." ·
       "Automação de testes e requisições de API (REST), provisionamento de faturamento."
   - **Analyst Client Support II** — `May 2021 - Feb 2024` / `Mai 2021 - Fev 2024`
     - EN: "Incident analysis and troubleshooting (QA environments)" · "Test Cases creation and review,
       scenarios validation with developers" · "Technical support and execution of sanity tests during
       release implementation" · "Incident SLA monitoring and data fixes deployment."
     - PT: "Análise de incidentes e troubleshooting em ambientes de QA." · "Criação e revisão de casos de
       teste, validação com analistas de negócio." · "Suporte técnico e execução de sanity tests
       durante releases em produção." · "Monitoramento de SLA de incidentes e deploy de correções de dados."
2. **ThinkSeg** — `May 2020 - Jan 2021` / `Mai 2020 - Jan 2021` — **Data Science Intern** /
   **Estagiário de Data Science**
   - EN: "Development of python scripts for automation processes." · "Creation of smart spreadsheets and
     dashboards for company support." · "Data extraction and processing for KPI metrics." · "Creation of
     SQL scripts for data mining."
   - PT: "Desenvolvimento de scripts Python para automação de processos." · "Criação de dashboards e
     planilhas inteligentes para suporte a áreas da empresa." · "Extração e processamento de dados para
     métricas de KPI." · "Criação de scripts SQL para mineração de dados."
3. **Cognizant** — `Aug 2018 - Jun 2019` / `Ago 2018 - Jun 2019` — **Content Analyst** /
   **Analista de Conteúdo**
   - EN: "Analysis and review of sensitive content on social networks. Media classification (video,
     photo, text) and community guidelines alignment."
   - PT: "Análise e revisão de conteúdo sensível em redes sociais. Classificação de mídia (vídeo, foto,
     texto) e alinhamento de diretrizes de comunidade."
4. **Previous** — `2014 - 2018` / `2014 - 2018`
   - **Easy (Easy Taxi)** — Customer Support Specialist (2017 - 2018) — EN: "Customer support for drivers
     and passengers, problem solving and internal process reformulation." / PT: "Suporte a motoristas e
     passageiros, resolução de problemas e reformulação de processos internos."
   - **Uber** — Community Support Representative (2016 - 2017) — EN: "Critical level support and indicator
     analysis." / PT: "Suporte nível crítico e análise de indicadores."
   - **Porto Seguro** — Customer Support Specialist (2014 - 2017) — EN: "Assistance with claims and
     insurance-related activities." / PT: "Assistência a sinistros e atividades relacionadas a seguros."

**ÁREAS DE ATUAÇÃO** (3 cards)
1. **Software Quality (QA)** / **Qualidade de Software (QA)** — EN: "E2E Testing Execution" ·
   "Test Scenarios & Use Cases" · "Developer Validation" · "Bug Analysis & JIRA Tickets" ·
   PT: "Execução de testes E2E" · "Criação de cenários de testes e casos de uso" · "Validação com
   desenvolvedores" · "Análise de bugs e tickets (JIRA)"
2. **Integrations & APIs** / **Integrações & APIs** — EN: "REST API Testing & Automation" ·
   "Order/Billing Provisioning" · "Order Management Integration" · "Data Migration & Scripts" ·
   PT: "Testes e automações API REST" · "Provisionamento de ordens/billing" · "Integração com order
   management" · "Migração de dados e scripts"
3. **Smart Automation** / **Automação Inteligente** — EN: "n8n Automated Workflows" · "Supabase &
   Webhooks Integration" · "Data Extraction & Processing" · "Bots & Support Flows" ·
   PT: "Fluxos automatizados com n8n" · "Integração Supabase, Webhooks" · "Extração e tratamento de
   dados" · "Bots e fluxos de atendimento"

**SKILLS & FERRAMENTAS** (3 grupos)
- **Tech Stack** (não precisa de tradução; os nomes são em inglês)
  `JavaScript, Python, SQL, API REST, Data Modeling, Quality Assurance, QA Engineer, Software Quality
  Engineering, Testes End-to-End, E2E Testing, Testes Funcionais, Testes Manuais, Testes Automatizados,
  Test Case Design, Test Scenarios, Test Planning, Test Execution, Regression Testing, Sanity Testing,
  Smoke Testing, Bug Analysis, Defect Tracking, Bug Reporting, Test Documentation, Release Validation,
  Acceptance Testing, Validation and Verification, Process Automation, Intelligent Automation,
  Workflow Automation`
- **Tools** — `n8n, Webhooks, API Testing, API Automation, REST APIs, API Integration, Postman, System
  Integration, Order Management, Billing Provisioning, CPQ Integration, Telecom Systems, Backend Testing,
  JSON, Payload Validation, Scripting, Data Processing, Data Transformation, Regex, Debugging, Supabase,
  Data Extraction, Data Cleaning, Data Validation, Relational Databases, KPI Development, Dashboards,
  Reporting, Log Analysis, Google Sheets Integration, WhatsApp API, Bot Development, Chatbot Flows,
  Automation Pipelines, Low-Code Automation, Queue Management, Technical Support, Client Support,
  Incident Management, Troubleshooting, SLA Monitoring, L2 Support, L3 Support, Root Cause Analysis,
  Production Support, Deployment Support, Fix Deployments, Jira, Ticket Management, Requirements
  Analysis, Stakeholder Communication, Technical Documentation, Analytical Thinking, Problem Solving,
  Attention to Detail, Continuous Improvement, Cross-Team Collaboration, Customer-Centric Mindset,
  AI-Driven Automation`
- **Languages** / **Idiomas** — `Portuguese (Native)` / `Português (Nativo)` ·
  `English (Professional)` / `Inglês (Profissional)` · `Spanish (Basic)` / `Espanhol (Básico)`

> Os chips de skills devem ser **todos** renderizados (a lista completa acima), mas apenas **um
> subconjunto curado** vira coletável `data-skill` no jogo (ver §7.3).

**FORMAÇÃO**
- **Analysis and Systems Development** / **Análise e Desenvolvimento de Sistemas** — Faculdade de
  Tecnologia de São Paulo (FATEC-SP) — `2018 - 2021`
- **Certification** / **Certificação** — **Data Modeling** / **Modelagem de Dados** → é o `data-trofeu`

**CONTATO**
- `Let's work together` / `Vamos conversar` — "Currently open for freelance projects and new
  opportunities." / "Disponível para novas oportunidades e projetos."
- E-mail `henrique.souza.lima@outlook.com` (mailto)
- LinkedIn `https://www.linkedin.com/in/limahenrique/`
- WhatsApp `https://wa.me/5571999088651`
- Localização: `São Paulo, SP` · `© 2024 Henrique Lima. All rights reserved.`

---

## 7. Mapeamento de conteúdo → jogo

### 7.1 Plataformas

| Fase | Plataformas (`data-plat`) |
|---|---|
| INÍCIO | `h1` (com `data-letras`) + card da foto |
| EXPERIÊNCIA | `h2` (com `data-letras`) + 4 cards (Netcracker, ThinkSeg, Cognizant, Previous) |
| ÁREAS | `h2` + 3 cards |
| SKILLS | `h2` + 3 cards (Tech Stack / Tools / Languages) |
| FORMAÇÃO | `h2` + 2 cards |
| CONTATO | `h2` + card dos links (`data-goal="1"`) |

Os **cards** têm `data-plat` com `data-dy="0"` — a superfície é o topo do card (borda de 1px).

### 7.2 Pousos (checkpoints)

Um `data-pouso` por fase, sempre no **primeiro** card/h1 da fase.

### 7.3 Coletáveis (`data-skill`)

Subconjunto curado (nomes de skills que o HUD mostra ao coletar):

| Fase | Plataforma | `data-skill` | `data-sx` |
|---|---|---|---|
| EXPERIÊNCIA | card Netcracker | `E2E Testing\|REST APIs\|Jira` | `0.25\|0.5\|0.75` |
| EXPERIÊNCIA | card ThinkSeg | `Python\|SQL\|Data Modeling` | `0.25\|0.5\|0.75` |
| EXPERIÊNCIA | card Cognizant | `Troubleshooting\|Client Support` | `0.35\|0.65` |
| ÁREAS | card QA | `Test Planning\|Bug Analysis\|Regression Testing` | `0.22\|0.5\|0.78` |
| ÁREAS | card APIs | `API Automation\|Postman\|JSON` | `0.25\|0.5\|0.75` |
| ÁREAS | card Automação | `n8n\|Supabase\|Webhooks` | `0.25\|0.5\|0.75` |
| SKILLS | card Tech Stack | `JavaScript\|Python\|SQL` | `0.22\|0.5\|0.78` |
| SKILLS | card Tools | `Postman\|Jira\|n8n` | `0.25\|0.5\|0.75` |
| SKILLS | card Idiomas | `English\|Spanish` | `0.35\|0.65` |
| FORMAÇÃO | card certification | `Data Modeling` | `0.5` |

**Total de skills = 24.** O HUD mostra `SKILLS 0/24`.

### 7.4 Inimigos

| Fase | Plataforma | `data-bugs` | `data-glitch` |
|---|---|---|---|
| EXPERIÊNCIA | Netcracker | 3 | — |
| EXPERIÊNCIA | ThinkSeg | 2 | — |
| EXPERIÊNCIA | Cognizant | 1 | — |
| EXPERIÊNCIA | Previous | 2 | — |
| ÁREAS | QA | 2 | 1 |
| ÁREAS | APIs | 2 | 1 |
| ÁREAS | Automação | 1 | 1 |
| SKILLS | Tech Stack | 2 | — |
| SKILLS | Tools | 3 | 1 |
| FORMAÇÃO | — | 1 | — |

**Total de bugs = 19**, **glitches = 4**. HUD: `BUGS 0/19` (conta só bugs esmagados).
Cada bug esmagado = **+100 pontos** e uma explosão de partículas brancas.

### 7.5 Outros coletáveis

- `data-bits`: 2–4 tokens por plataforma de card, 6 no `h1` do hero.
  **Total de bits ≈ 60.** Cada bit = +10 pontos.
- `data-cafe`: 1 no card Netcracker, 1 no card Tools, 1 no card de Formação = **3 cafés**.
  Efeito: +1 vida (máx. 3) e +15 s no relógio.
- `data-trofeu="Data Modeling"`: no card de certificação. Efeito: +500 pontos e abre a fase FORMAÇÃO
  (troféu visual no HUD).

### 7.6 Fim

`data-goal="1"` no card de links do CONTATO. Ao encostar: painel de resultado.

**RANK** (por pontuação): `>= 3500` → `S`; `>= 2500` → `A`; `>= 1500` → `B`; senão → `C`.

---

## 8. Regras de conteúdo técnico

1. **Sem classes Tailwind.** Nenhum `text-4xl`, `bg-primary`, etc. Todo estilo vem de `css/estilo.css`.
2. **Sem Material Symbols.** Os glifos (`terminal`, `arrow_forward`, `download`, `mail`, `menu`,
   `verified`, `arrow_outward`) viram **SVG inline** com `stroke="currentColor"`, `width="1em"`,
   `height="1em"`, `fill="none"`, `stroke-width="1.5"`, `aria-hidden="true"`.
3. **Sem flags do Flaticon.** O seletor de idioma vira dois botões de texto `PT` / `EN` em
   `--fonte-mono`, 11px, uppercase, com borda 1px; o ativo fica com fundo branco e texto preto.
4. **Links externos** sempre com `target="_blank" rel="noopener noreferrer"`.
5. **Todo `<img>`** com `alt` descritivo e `loading="lazy"` (exceto a foto do hero).
6. **JSON-LD** `Person` no `<head>`: name, jobTitle, url, sameAs (LinkedIn), email, addressLocality.
7. `lang` do `<html>` muda com o idioma (`en` / `pt-BR`).

---

## 9. Checklist de aceite

- [ ] O site **sem JavaScript** mostra o currículo completo, navegável e legível.
- [ ] O currículo **sem JavaScript** está em inglês por padrão.
- [ ] `JOGAR` entra no modo jogo; o sprite aparece, o HUD aparece, a nav some.
- [ ] O personagem pula sobre o `h1`, sobre os cards, cai pelo buraco e chega à fase seguinte.
- [ ] A câmera acompanha o jogador **e a página rola junto** (`window.scrollY` muda).
- [ ] Esmagar um bug → `BUGS 1/19`, +100 pontos, som, partículas.
- [ ] Coletar uma skill → mostra o nome, +50 pontos, som, a skill some do DOM.
- [ ] Café → +1 vida.
- [ ] Chegar ao `data-goal` → painel de resultado com tempo, bugs, skills, pontos e RANK.
- [ ] `Esc` pausa; `SAIR` volta ao modo leitura sem perder a rolagem.
- [ ] Trocar idioma re-mede o mundo e a geometria continua correta.
- [ ] Em mobile (375 px) os botões de toque aparecem e o jogo é jogável.
- [ ] `prefers-reduced-motion` remove partículas, parallax e tremor.
- [ ] Nenhum erro no console.
- [ ] Nenhuma cor fora da paleta monocromática (verificar com `grep` no CSS).
- [ ] Lighthouse: sem erros de console, sem requisições de terceiros além do Google Fonts.

---

## 10. Notas de implementação (armadilhas conhecidas)

1. **`transform` em elementos de plataforma quebra a física.** `posDoc` ignora transform, mas o
   `getBoundingClientRect` não. Use sempre `posDoc` + `offsetWidth`.
2. **Hover com `translateY` em cards** move o card visualmente, mas `posDoc` ignora → a física fica
   estável. **Não** aplicar `transform` aos elementos `data-plat` no modo jogo (aplicar no card
   inteiro está OK porque `posDoc` ignora).
3. **Título com `data-letras`**: o texto é quebrado em `<span class="pal">` + `<span class="l">`.
   Guardar o texto original em `aria-label` e marcar o container como `aria-hidden="true"`.
4. **Re-medir** após: load, resize (debounce 150 ms), troca de idioma, e após a fonte web carregar
   (`document.fonts.ready`).
5. **`window.scrollTo` dentro do `requestAnimationFrame`** pode causar *scroll anchoring* do navegador:
   usar `history.scrollRestoration = 'manual'` e `overflow-anchor: none` no `body`.
6. **Canvas e DPR**: `canvas.width = innerWidth * dpr`, `ctx.setTransform(dpr,0,0,dpr,0,0)`, e
   `imageSmoothingEnabled = false`.
7. **`hidden` + `display:flex`**: o atributo `hidden` perde para `display` em CSS. Usar
   `[hidden] { display: none !important; }`.
8. **Áudio**: nunca criar o `AudioContext` antes de um gesto do usuário (evita warning e auto-play
   block).
9. **`localStorage` pode lançar** (modo privado). Envolver em `try/catch`.
10. **`scrollTo` com `behavior:'instant'`** para não conflitar com `scroll-behavior: smooth` do CSS.
---

# PARTE 2 · O JOGO 2D SOBRE A PÁGINA

> Esta parte descreve o que realmente existe no código. O raciocínio por trás de cada escolha
> está em [`DECISOES.md`](DECISOES.md).

## 11. Como o jogo aparece na tela

O jogo **é a página**. Não existe interface paralela, não existe mundo separado:

```
<body>
  <canvas id="fundo">      grade de pontos + parallax (fundo da leitura)
  <header id="nav">        nav normal, continua visivel no jogo
  <main>                   o currículo — VISIVEL durante o jogo
  <canvas id="jogo">       o jogo, por cima da página (z-index 40)
  <div id="hud">           placar (z-index 45)
  <div id="painel">        pausa (z-index 60)
```

O que muda no modo jogo:

| | leitura | jogo |
|---|---|---|
| `body` | — | ganha `.modo-jogo` |
| `#jogo` (canvas) | desenha o personagem parado no título da seção | desenha o jogo |
| `[data-plat]` | — | ganha uma linha branca de 2px no topo (a superfície) |
| `.chao` | — | aparece: o piso da fase, com o buraco de passagem |
| `.l.pisada` | — | a letra afunda quando o personagem pisa nela |
| `#hud` | escondido | visível, abaixo da nav |
| cursor | normal | `none` (o personagem é o cursor) |
| a nav | visível | **visível** (o jogo não muda a interface) |

## 12. `js/sprites.js` — API

```js
HL.sprites = {
  COR: COR,
  // o personagem: 'parado' | 'correr' | 'pulo' | 'cair' | 'dano' | 'soco'
  // variante: 'normal' | 'branco' (dano) | 'fantasma' (rastro)
  pedro: function (nome, q, esc, variante) {},   // canvas 18x24 px de arte
  obter: function (nome, esc) {},               // criaturas e coletaveis
  chip: function (nome, esc) {},                // chip de skill (hexagono com o nome)
  halo: function (raio) {},                     // sombra radial no chao
  limpar: function () {}                        // limpa o cache (fonte carregada)
}
```

Nomes de mapa: `bit0`, `bit1`, `bug0`, `bug1`, `glitch`, `coracao`, `coracaoVazio`,
`cafe`, `trofeu`, `espinho`, `trampolim`, `poderTurbo`, `poderMagnet`, `poderPulo`.

## 13. Entidades e seus sprites

| tipo 2D | sprite | onde fica |
|---|---|---|
| `bit` | `bit0`/`bit1` (ciano, gira) | em arco sobre a plataforma |
| `skill` | `chip(nome)` — hexágono de latão com o nome | flutua acima da plataforma |
| `trofeu` | `trofeu` (dourado, com brilho) | centro da plataforma |
| `cafe` | `cafe` (caneca com vapor) | 90% da largura da plataforma |
| `bug` | `bug0`/`bug1` (rosado, com olhos claros) | patrulha a plataforma |
| `glitch` | `glitch` (roxo, wireframe) | flutua em elipse |
| `espinho` | `espinho` (cones vermelhos) | em pé na plataforma |
| `trampolim` | `trampolim` (verde) | em pé na plataforma |
| `poder` | `poderTurbo`/`poderMagnet`/`poderPulo`/`coracao` | flutua acima |

## 14. Hooks no HTML

| hook | efeito |
|---|---|
| `data-fase` `data-nome` | uma fase; `data-nome` é o rótulo do HUD |
| `data-plat` `data-letras` | plataforma; com `data-letras` vira degraus por letra |
| `data-pouso` | checkpoint da fase e ponto de chegada do buraco anterior |
| `data-skill` `data-sx` | chip de skill e sua posição (0..1) |
| `data-bits` `data-bx` | N bits e o centro do arco |
| `data-bugs` `data-glitch` | inimigos na plataforma |
| `data-espinho` `data-px` | espinhos e sua posição |
| `data-trampolim` `data-px` | trampolim |
| `data-poder` `data-px` | power-up (turbo/magnet/pulo/vida) |
| `data-trofeu` `data-cafe` | troféu e café |
| `data-movel` `data-amp` `data-vel` | plataforma móvel (o personagem viaja junto) |
| `data-goal` | fim do jogo (o card do CONTATO) |

`data-px` é a posição horizontal (0..1) dos obstáculos; `data-bx` é o centro do arco de
moedas. São coisas diferentes e não podem se misturar.

## 15. Estado atual

173 entidades em 31 plataformas e 6 fases: 83 bits, 25 skills, 1 troféu, 3 cafés, 20 bugs,
4 glitches, 21 espinhos, 5 trampolins e 11 power-ups.

## 16. Limitações conhecidas

- A física é 2D (x, y): o personagem não tem profundidade própria.
- As plataformas são de sentido único: não se pode subir por baixo de um card.
- O chão de cada fase só tem um buraco — a passagem para a fase seguinte.
- Sem `prefers-reduced-motion` o fundo de partículas é desligado, mas o jogo continua igual.
