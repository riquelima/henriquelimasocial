# Henrique Lima — portfólio em formato de jogo

Um currículo que **é um platformer**. A página é a fase: cada título e cada card do currículo
vira uma plataforma de um jogo de plataforma 2D desenhado em canvas **por cima da própria
página**. O visitante pode ler o currículo normalmente ou **jogar** — subindo e descendo pela
carreira, coletando skills, **esmagando bugs** (a metáfora é literal: ele é QA Engineer) e
recolhendo recompensas.

**O jogo acontece sobre o currículo, não em outra interface.** A página continua visível: o
que você lê é exatamente o que você pula.

> O contrato técnico está em [`docs/SPEC.md`](docs/SPEC.md). As decisões e os desvios estão em
> [`docs/DECISOES.md`](docs/DECISOES.md).

---

## Rodar

Site estático, sem build:

```bash
npx serve .            # http://localhost:3000
# ou
python3 -m http.server 8080
```

Não abra por `file://` — o JavaScript usa paths absolutos do servidor.

Publicar: `npx vercel` (o `vercel.json` já está configurado).

---

## Como se joga

| Ação | Teclado | Toque |
|---|---|---|
| Andar | `←` `→` ou `A` `D` | botões ◀ ▶ |
| Pular (e pulo duplo) | `Espaço` `↑` `W` | botão ▲ |
| **Descer pelo card / soco** | `↓` ou `S` | botão ▼ |
| Pausar | `Esc` ou `P` | botão ❚❚ |

Uma seta `▼` pulsa embaixo dos pés quando há um card logo abaixo: `↓` atravessa a plataforma.
O personagem não cai para fora da coluna de conteúdo — ele desce pelos cards até o piso da
fase e então pelo buraco para a fase seguinte.

**No jogo:**

- **♥** vidas (3). O `☕` recupera uma.
- **bits** ciano (+10), **chips de skill** em latão com o nome (+50), **🏆 troféu** (+500).
- **bugs** rosados patrulham os cards: esmagados por cima valem +100; por baixo, machucam.
- **glitches** roxos flutuam e não podem ser esmagados — só desviados.
- **espinhos** vermelhos machucam quem pisa.
- **trampolins** verdes catapultam.
- **power-ups**: `TURBO` (+55% de velocidade), `MAGNET` (atrai moedas), `WINGS` (pulo extra),
  `♥` (vida extra).

O objetivo é chegar ao **CONTATO**. O painel final mostra tempo, bugs corrigidos, skills,
pontos e um **RANK** (S/A/B/C).

---

## Arquitetura

```
index.html              documento + hooks de jogo + HUD + painéis
css/estilo.css          design system monocromático + camada de jogo
css/fontes.css          @font-face local (Geist + Geist Mono)
fonts/                  woff2 self-hosted (83 KB, zero requisições a terceiros)
js/qualidade.js         escala automática de qualidade (3 níveis)
js/som.js               áudio sintetizado (WebAudio, nenhum arquivo)
js/sprites.js           pixel art desenhada em código (personagem e criaturas)
js/mundo.js             DOM → geometria do jogo
js/jogo.js              física, câmera, entidades, HUD, estados
js/fundo.js             grade de pontos + parallax (modo leitura)
js/site.js              nav, progresso, reveal, i18n PT/EN
assets/imagemPerfil.jpg
curriculo.pdf
docs/SPEC.md            contrato técnico normativo
docs/DECISOES.md        desvios e decisões durante a construção
tools/verify.cjs        harness headless (Chrome + puppeteer-core)
tools/autoplay.cjs      robô que joga o currículo inteiro sozinho
tools/shot2d.cjs        screenshots do jogo 2D
```

### As três ideias que sustentam tudo

**1. A página é a fase.** `js/mundo.js` lê os `data-*` do HTML e transforma cada elemento em
geometria de jogo: `[data-plat]` vira plataforma, `[data-letras]` vira uma fileira de degraus
(uma por letra, medida na métrica real da fonte), `[data-fase]` vira uma fase com piso e buraco
de passagem, `[data-bugs]`/`[data-skill]` viram entidades. **O que você lê é o que você pula.**

**2. A câmera é a rolagem da página.** O jogo não tem viewport próprio: a câmera segue o
personagem chamando `window.scrollTo`. Quando ele desce, a página desce junto — e o leitor
nunca perde o lugar onde estava.

**3. Plataformas de sentido único.** O personagem pousa em cima de um card e atravessa por
baixo. É o que permite empilhar os cards uns sobre os outros sem o corpo ficar preso dentro do
card de cima — e o que faz `↓` existir.

### A arte

Toda a pixel art é **desenhada em código** (`js/sprites.js`): a cabeça do personagem é um mapa
de caracteres, o corpo é uma lista de retângulos, e cada quadro é pré-renderizado uma vez num
canvas fora da tela. Nada de imagem, nada de GPU, nada de asset para carregar. O contorno
silhueta é desenhado em duas passadas — contorno de todas as peças, depois o preenchimento.

---

## Qualidade e acessibilidade

- **Escala automática** em 3 níveis: palpite pelo aparelho (núcleos, memória, GPU,
  `saveData`) e medição real de FPS em tempo de uso. Só desce, nunca sobe — não oscila.
  Fixável no painel de pausa.
- **`prefers-reduced-motion`**: sem partículas, sem parallax, sem tremor, sem reveal.
- **Sem JavaScript** o site já é um currículo completo, navegável e bilíngue.
- Foco visível, link de pular para o conteúdo, `aria-label` nos títulos decompostos em letras,
  HUD e canvas decorativos (`aria-hidden`).
- **Bilingue PT/EN** com re-medição da geometria quando o idioma muda (o texto muda, as
  plataformas mudam junto).

---

## Verificação

```bash
node tools/verify.cjs --port 8155 --out .verify     # 24 checks headless + screenshots
node tools/autoplay.cjs --port 8175 --ms 150000      # o robô joga sozinho
node tools/shot2d.cjs --port 8210                    # screenshots do jogo
```

`verify.cjs` sobe um servidor, abre a página no Chrome headless em 1440×900 e 390×844, coleta
erros de console, mede o mundo, entra no modo jogo, joga pelo teclado, confere que **a página
continua visível durante o jogo**, testa pausa/saída/idioma e tira screenshots.
`autoplay.cjs` joga o currículo inteiro para provar que o nível é zerável.

---

## Licenças

Geist / Geist Mono — SIL Open Font License. A arte em pixel, o design e o código são originais
deste projeto.
