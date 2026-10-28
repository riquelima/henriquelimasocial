/* ==========================================================
   AUTOPLAY · um robô joga o currículo inteiro sozinho
   Serve para provar que o nível é zerável: desce card por
   card, coleta o que dá e chega ao contato.

   node tools/autoplay.cjs [--port 8171] [--ms 120000]
   ========================================================== */
'use strict';

const { createRequire } = require('module');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUPPETEER_ROOT = '/Users/teste/.nvm/versions/node/v22.23.3/lib/node_modules/hyperframes/node_modules/';
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.jpg':'image/jpeg', '.png':'image/png', '.pdf':'application/pdf' };

function argOf(n, d) { const i = process.argv.indexOf(n); return i > -1 && process.argv[i+1] ? process.argv[i+1] : d; }
const PORT = parseInt(argOf('--port', '8171'), 10);
const MAXMS = parseInt(argOf('--ms', '120000'), 10);

function servir() {
  return new Promise((res) => {
    const s = http.createServer((q, r) => {
      let p = q.url.split('?')[0]; if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(PORT, () => res(s));
  });
}

(async () => {
  const srv = await servir();
  const puppeteer = createRequire(PUPPETEER_ROOT)('puppeteer-core');
  const exe = '/Users/teste/.cache/puppeteer/chrome-headless-shell/mac_arm-154.0.8037.57/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const b = await puppeteer.launch({ executablePath: exe, headless: 'shell', args: ['--no-sandbox', '--hide-scrollbars'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelector('[data-acao="jogar"]').click());
  await new Promise(r => setTimeout(r, 600));

  /* estado lido de dentro da página */
  const ler = () => page.evaluate(() => {
    const j = window.HL && HL.jogo; if (!j) return null;
    const e = j.estado, p = j.jogador, M = HL.mundo;
    const f = M.faseDe(p.y + p.h);
    const piso = M.pisos[f];
    let chaoTipo = null, chaoEl = null;
    if (p.chao) { chaoTipo = (p.chao.piso !== undefined) ? 'piso' : 'card'; chaoEl = p.chao.el || null; }
    const COLETA = { bit: 1, skill: 1, trofeu: 1, cafe: 1, poder: 1 };
    const alvos = (e.ents || []).filter(x => x.vivo && !x.oculto && x.plat && chaoEl && x.plat.el === chaoEl && COLETA[x.tipo]);
    const cx = p.x + p.w / 2;
    let alvo = null, melhor = 1e9;
    for (const a of alvos) {
      const d = Math.abs(a.x - cx);
      if (d < melhor) { melhor = d; alvo = a; }
    }
    return {
      modo: e.modo, x: cx, y: p.y, w: p.w, h: p.h,
      chaoTipo, temAlvo: !!alvo, alvoX: alvo ? alvo.x : null,
      alvoTipo: alvo ? alvo.tipo : null,
      listaAlvos: alvos.map(a => ({ x: Math.round(a.x), dx: Math.round(a.x - cx), tipo: a.tipo })),
      buracoX: piso && !piso.final ? piso.cx : null,
      buracoEsq: piso && !piso.final ? piso.x0 : null,
      buracoDir: piso && !piso.final ? piso.x1 : null,
      fase: f, faseMax: e.faseMax, checkpoint: e.checkpoint,
      skills: e.skills.length, skillsTotal: e.skillsTotal,
      bugs: e.bugs, bugsTotal: e.bugsTotal,
      bits: e.bits, bitsTotal: e.bitsTotal,
      trofeus: e.trofeus, pontos: e.pontos, vidas: e.vidas,
      scrollY: window.scrollY,
      vidas: e.vidas,
      espinhos: (e.ents || []).filter(x => x.vivo && x.tipo === 'espinho' && x.plat && chaoEl && x.plat.el === chaoEl).map(x => Math.round(x.x)),
      caminho: (e.ents || []).filter(x => x.vivo && x.tipo === 'trampolim' && x.plat && chaoEl && x.plat.el === chaoEl).map(x => Math.round(x.x))
    };
  });

  const teclas = new Set();
  async function setTeclas(desejadas) {
    for (const k of teclas) if (!desejadas.has(k)) { await page.keyboard.up(k); teclas.delete(k); }
    for (const k of desejadas) if (!teclas.has(k)) { await page.keyboard.down(k); teclas.add(k); }
  }
  /* teclas que precisam de repetição: tocamos a cada vez */
  async function tap(k) {
    if (teclas.has(k)) { await page.keyboard.up(k); teclas.delete(k); }
    await page.keyboard.down(k);
    await new Promise(r => setTimeout(r, 45));
    await page.keyboard.up(k);
  }

  const t0 = Date.now();
  let ultimo = null, travado = 0, ultimoX = null, dirBot = 1;
  let log = [];
  let ok = false;

  while (Date.now() - t0 < MAXMS) {
    const s = await ler();
    if (!s) break;

    if (s.modo === 'fim') { ok = true; break; }
    if (s.modo === 'morto') { await new Promise(r => setTimeout(r, 300)); continue; }

    /* travou? anda um pouco para destravar */
    if (ultimoX !== null && Math.abs(s.x - ultimoX) < 1.5) travado++; else travado = 0;
    ultimoX = s.x;

    const set = new Set();

    if (s.chaoTipo === 'piso') {
      /* no chão da fase: caminha até o buraco e cai */
      if (s.buracoX !== null) {
        if (s.x < s.buracoX - 6) set.add('ArrowRight');
        else if (s.x > s.buracoX + 6) set.add('ArrowLeft');
        else { set.add('ArrowRight'); set.add('ArrowLeft'); }   // fica em cima da borda
      } else {
        set.add('ArrowRight');
      }
    } else if (s.chaoTipo === 'card') {
      /* no card: vai até o coletável mais próximo */
      if (s.temAlvo) {
        /* varrimento: mantem a direcao enquanto houver alvo nela */
        const todos = (s.listaAlvos || []).slice().sort((a, b2) => Math.abs(a.dx) - Math.abs(b2.dx));
        let frente = todos.filter(a => dirBot > 0 ? a.dx > 8 : (dirBot < 0 ? a.dx < -8 : true));
        if (!frente.length) frente = todos;
        const t = frente[0];
        if (t.dx > 8) { set.add('ArrowRight'); dirBot = 1; }
        else if (t.dx < -8) { set.add('ArrowLeft'); dirBot = -1; }
      } else {
        /* nada mais para pegar aqui: desce pelo card */
        await tap('ArrowDown');
        travado = 0;                 // descer nao e ficar travado
        set.add('ArrowRight');
      }
    } else {
      /* no ar: cai reto */
      set.add('ArrowRight');
    }

    /* espinho logo a frente: pula por cima */
    const esp = (s.espinhos || []).filter(x => x - s.x > 12 && x - s.x < 190);
    if (esp.length) { await tap('Space'); }

    if (travado > 10 && s.chaoTipo === 'card' && s.temAlvo) { await tap('Space'); travado = 0; }

    await setTeclas(set);

    if (log.length === 0 || Date.now() - log[log.length - 1].t > 1200) {
      const reg = { t: Date.now() - t0, fase: s.fase, x: Math.round(s.x), y: Math.round(s.y), skills: s.skills, bugs: s.bugs, bits: s.bits, modo: s.modo, chao: s.chaoTipo, alvo: s.alvoTipo, ax: s.alvoX, vidas: s.vidas, bur: s.buracoX };
      log.push(reg);
      console.log(`  ${String(reg.t).padStart(6)}ms fase${reg.fase} x=${String(reg.x).padStart(5)} chao=${String(reg.chao).padEnd(5)} alvo=${String(reg.alvo).padEnd(9)}@${String(reg.ax).padStart(5)} vidas=${reg.vidas} sk=${reg.skills} bg=${reg.bugs} bits=${reg.bits}`);
    }
    await new Promise(r => setTimeout(r, 70));
  }

  await setTeclas(new Set());
  const fim = await ler();
  console.log('\n=============== AUTOPLAY ===============');
  log.forEach(l => console.log(`  ${String(l.t).padStart(6)}ms fase${l.fase} x=${String(l.x).padStart(5)} y=${String(l.y).padStart(5)} chao=${String(l.chao).padEnd(5)} alvo=${String(l.alvo).padEnd(9)}@${String(l.ax).padStart(5)} bur=${l.bur} vidas=${l.vidas} sk=${l.skills} bg=${l.bugs}`));
  console.log('\nRESULTADO:', ok ? 'ZEROU O JOGO ✅' : 'não chegou ao fim ❌');
  if (fim) {
    console.log('  modo final   :', fim.modo);
    console.log('  fase alcançada:', fim.fase, '/ checkpoint', fim.checkpoint);
    console.log('  skills       :', fim.skills, '/', fim.skillsTotal);
    console.log('  bugs corrigidos:', fim.bugs, '/', fim.bugsTotal);
    console.log('  bits         :', fim.bits, '/', fim.bitsTotal);
    console.log('  troféus      :', fim.trofeus);
    console.log('  pontos       :', fim.pontos);
  }
  if (erros.length) { console.log('\nERROS:'); erros.slice(0, 10).forEach(e => console.log('  ! ' + e)); }
  await page.screenshot({ path: path.join(ROOT, '.verify', 'autoplay.png') });
  await b.close(); srv.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('AUTOPLAY CRASH:', e); process.exit(2); });
