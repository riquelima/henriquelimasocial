/* ==========================================================
   VERIFY · harness de verificação headless do portfólio em jogo
   Sobe um servidor estático, abre a página no Chrome headless,
   coleta erros de console, mede o mundo do jogo, joga de
   verdade (teclado) e tira screenshots.

   Uso:  node tools/verify.cjs [--port 8123] [--out .verify]
   ========================================================== */
'use strict';

const { createRequire } = require('module');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PUPPETEER_ROOT =
  '/Users/teste/.nvm/versions/node/v22.23.3/lib/node_modules/hyperframes/node_modules/';

const argOf = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const PORT = parseInt(argOf('--port', '8123'), 10);
const OUT = path.resolve(ROOT, argOf('--out', '.verify'));

/* ---------- servidor estático mínimo ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.woff2': 'font/woff2'
};

function servir() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('404'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, () => resolve(srv));
  });
}

/* ---------- acha o Chrome ---------- */
function acharChrome() {
  const base = path.join(process.env.HOME || '', '.cache/puppeteer/chrome');
  const cands = [];
  if (fs.existsSync(base)) {
    for (const v of fs.readdirSync(base)) {
      const app = path.join(base, v, 'chrome-mac-arm64',
        'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (fs.existsSync(app)) cands.push(app);
    }
  }
  const shellBase = path.join(process.env.HOME || '', '.cache/puppeteer/chrome-headless-shell');
  if (fs.existsSync(shellBase)) {
    for (const v of fs.readdirSync(shellBase)) {
      const bin = path.join(shellBase, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell');
      if (fs.existsSync(bin)) cands.push(bin);
    }
  }
  if (!cands.length) throw new Error('Chrome não encontrado em ~/.cache/puppeteer');
  return cands[0];
}

/* ---------- main ---------- */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await servir();
  const puppeteer = createRequire(PUPPETEER_ROOT)('puppeteer-core');
  const exe = acharChrome();

  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars',
           '--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none']
  });

  const relatorio = { exe, url: 'http://localhost:' + PORT + '/', erros: [], avisos: [], checks: [], ok: true };

  async function checar(nome, fn) {
    try {
      const r = await fn();
      const ok = (r !== false) && !(r && typeof r === 'object' && r.ok === false);
      relatorio.checks.push({ nome, ok: ok, detalhe: (r && typeof r === 'object') ? r : (r === false ? 'falhou' : 'ok') });
      if (!ok) relatorio.ok = false;
    } catch (e) {
      relatorio.checks.push({ nome, ok: false, detalhe: 'EXCEÇÃO: ' + e.message });
      relatorio.ok = false;
    }
  }

  async function abrirPagina(w, h, toque) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: toque ? 2 : 1, hasTouch: !!toque, isMobile: !!toque });
    page.on('console', (m) => {
      const t = m.type();
      if (t === 'error') relatorio.erros.push('console.error: ' + m.text());
      else if (t === 'warning') relatorio.avisos.push('console.warn: ' + m.text());
    });
    page.on('pageerror', (e) => relatorio.erros.push('pageerror: ' + e.message));
    page.on('response', (r) => { if (r.status() >= 400) relatorio.erros.push('HTTP ' + r.status() + ': ' + r.url()); });
    page.on('requestfailed', (r) => {
      const u = r.url();
      if (u.startsWith('data:')) return;
      relatorio.erros.push('requestfailed: ' + u + ' (' + (r.failure() || {}).errorText + ')');
    });
    return page;
  }

  /* ================= DESKTOP ================= */
  const page = await abrirPagina(1440, 900);
  await page.goto(relatorio.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));

  await checar('HTML carregou com título', async () => {
    const t = await page.title();
    return { titulo: t, ok: !!t && !/404/i.test(t) };
  });

  await checar('HL namespace existe', async () =>
    await page.evaluate(() => typeof window.HL === 'object' && !!window.HL));

  await checar('HL.mundo mediu plataformas e fases', async () =>
    await page.evaluate(() => {
      if (!window.HL || !HL.mundo) return { ok: false, motivo: 'HL.mundo ausente' };
      const m = HL.mundo;
      return { ok: m.plats.length > 10 && m.fases.length === 6, plats: m.plats.length, fases: m.fases.length, esc: m.esc };
    }));

  await checar('HL.sprites tem os sprites obrigatórios', async () =>
    await page.evaluate(() => {
      if (!window.HL || !HL.sprites) return { ok: false };
      const need = ['bit1', 'bit0', 'bug0', 'bug1', 'glitch', 'coracao', 'trofeu', 'cafe', 'espinho', 'trampolim', 'poderTurbo', 'poderMagnet', 'poderPulo'];
      const faltando = need.filter(n => { try { return !HL.sprites.obter(n, 3); } catch (e) { return true; } });
      let pedro = null;
      try { pedro = HL.sprites.pedro('parado', 0, 3); } catch (e) { }
      return {
        ok: faltando.length === 0 && !!pedro,
        faltando: faltando,
        personagem: pedro ? pedro.width + 'x' + pedro.height : null
      };
    }));

  await checar('HL.som e HL.qualidade existem', async () =>
    await page.evaluate(() => ({
      ok: !!(HL.som && HL.qualidade),
      nivel: HL.qualidade && HL.qualidade.nivel
    })));

  await checar('fases com nomes e pousos', async () =>
    await page.evaluate(() => {
      const f = HL.mundo.fases;
      const semPouso = f.filter(x => !x.pouso).map(x => x.nome);
      return { ok: semPouso.length === 0, semPouso, nomes: f.map(x => x.nome) };
    }));

  await checar('entidades criadas', async () =>
    await page.evaluate(() => {
      const e = HL.mundo.criarEntidades();
      const cont = {};
      e.forEach(x => { cont[x.tipo] = (cont[x.tipo] || 0) + 1; });
      return { ok: e.length > 20, total: e.length, contagem: cont };
    }));

  await checar('espinhos nao se sobrepoem no mesmo ponto', async () =>
    await page.evaluate(() => {
      const ents = HL.mundo.criarEntidades();
      const por = new Map();
      ents.filter(x => x.tipo === 'espinho').forEach(x => {
        if (!por.has(x.el)) por.set(x.el, []);
        por.get(x.el).push(Math.round(x.bx * 1000) / 1000);
      });
      const grupos = Array.from(por.values());
      const colidem = grupos.filter(g => new Set(g).size !== g.length);
      return { ok: colidem.length === 0, grupos: grupos.length, colidem: colidem, exemplo: grupos[0] };
    }));

  await checar('i18n: EN por padrão e troca de idioma funciona', async () =>
    await page.evaluate(() => {
      const h1 = document.querySelector('#inicio h1');
      const en = (h1.textContent || '').toLowerCase().includes('hello');
      HL.site.setLanguage('pt');
      const pt = (h1.textContent || '').toLowerCase().includes('olá') ||
                 (h1.textContent || '').toLowerCase().includes('ola');
      const lang = document.documentElement.lang;
      HL.site.setLanguage('en');
      return { ok: en && pt, en, pt, langPt: lang, voltouEn: document.documentElement.lang };
    }));

  await checar('re-medir após idioma mantém geometria', async () =>
    await page.evaluate(() => {
      const antes = HL.mundo.plats.length;
      HL.site.setLanguage('pt');
      const meio = HL.mundo.plats.length;
      HL.site.setLanguage('en');
      return { ok: Math.abs(antes - meio) <= 2, antes, meio, depois: HL.mundo.plats.length };
    }));

  await checar('sem erros de console até aqui', async () =>
    relatorio.erros.length === 0 ? { ok: true, erros: relatorio.erros } : { ok: false, erros: relatorio.erros });

  await page.screenshot({ path: path.join(OUT, '01-leitura-topo.png') });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT, '02-leitura-meio.png') });

  /* ================= MODO JOGO ================= */
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));

  await checar('botão JOGAR existe', async () =>
    await page.evaluate(() => {
      const b = document.querySelector('[data-acao="jogar"]');
      return { ok: !!b, texto: b && b.textContent.trim() };
    }));

  /* clique REAL de mouse no botao do hero — e o que o visitante faz */
  const alvoJogar = await page.evaluate(() => {
    const botoes = Array.from(document.querySelectorAll('[data-acao="jogar"]'));
    const b = botoes.filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0; })[0];
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), texto: (b.textContent || '').trim() };
  });
  if (alvoJogar) {
    await page.mouse.click(alvoJogar.x, alvoJogar.y);
  } else {
    await page.evaluate(() => { const b = document.querySelector('[data-acao="jogar"]'); if (b) b.click(); });
  }
  await new Promise(r => setTimeout(r, 900));

  await checar('modo jogo ativo (clique real no botão do hero)', async () =>
    await page.evaluate(() => {
      const hud = document.getElementById('hud');
      const chip = document.getElementById('modoJogo');
      const aviso = document.getElementById('aviso');
      return {
        ok: document.body.classList.contains('modo-jogo') && !!hud && !hud.hidden &&
           HL.jogo.estado.modo === 'jogando' && !!chip && !chip.hidden &&
           (aviso === null || aviso.hidden || (aviso.textContent || '').indexOf('ERRO') < 0),
        modo: HL.jogo.estado.modo,
        chip: chip ? !chip.hidden : null,
        aviso: aviso && !aviso.hidden ? aviso.textContent : null
      };
    }));

  await checar('jogador posicionado sobre uma plataforma', async () =>
    await page.evaluate(() => {
      const p = HL.jogo.jogador;
      const plats = HL.mundo.plats;
      const perto = plats.some(pl => p.y + p.h >= pl.y - 6 && p.y + p.h <= pl.y + 60);
      return { ok: perto, x: Math.round(p.x), y: Math.round(p.y), w: p.w, h: p.h };
    }));

  await page.screenshot({ path: path.join(OUT, '03-modo-jogo.png') });

  /* mover para a direita e pular */
  const antesMover = await page.evaluate(() => ({ x: HL.jogo.jogador.x, y: HL.jogo.jogador.y }));
  await page.keyboard.down('ArrowRight');
  await new Promise(r => setTimeout(r, 700));
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.up('ArrowRight');
  await new Promise(r => setTimeout(r, 400));
  const depoisMover = await page.evaluate(() => ({ x: HL.jogo.jogador.x, y: HL.jogo.jogador.y }));

  await checar('jogador responde ao teclado', async () =>
    ({ ok: Math.abs(depoisMover.x - antesMover.x) > 20, antes: antesMover, depois: depoisMover }));

  await checar('a câmera rola a página junto com o jogador', async () =>
    await page.evaluate(() => ({
      ok: window.scrollY > 0 || HL.jogo.jogador.y < 400,
      scrollY: Math.round(window.scrollY),
      jogadorY: Math.round(HL.jogo.jogador.y)
    })));

  await page.screenshot({ path: path.join(OUT, '04-modo-jogo-jogando.png') });

  await checar('a página continua visível durante o jogo', async () =>
    await page.evaluate(() => {
      const main = document.querySelector('main');
      const op = main ? parseFloat(getComputedStyle(main).opacity) : 0;
      const nav = document.getElementById('nav');
      const navVisivel = nav ? getComputedStyle(nav).transform.indexOf('matrix') !== -1 || getComputedStyle(nav).transform === 'none' : false;
      return { ok: op > 0.9 && navVisivel, opacidadeMain: op, navVisivel: navVisivel };
    }));
  await checar('HUD preenchido', async () =>
    await page.evaluate(() => {
      const ids = ['hudVidas', 'hudBugs', 'hudSkills', 'hudTempo', 'hudFaseNum', 'hudFaseNome'];
      const vazios = ids.filter(i => { const e = document.getElementById(i); return !e || !e.textContent.trim(); });
      return {
        ok: vazios.length === 0,
        vazios,
        vidas: (document.getElementById('hudVidas') || {}).textContent,
        bugs: (document.getElementById('hudBugs') || {}).textContent,
        skills: (document.getElementById('hudSkills') || {}).textContent,
        fase: (document.getElementById('hudFaseNome') || {}).textContent
      };
    }));

  await checar('painel de pausa abre e tem ações', async () =>
    await page.evaluate(() => {
      HL.jogo.pausar();
      const p = document.getElementById('painel');
      return { ok: !p.hidden && !!document.getElementById('painelCaixa'), acoes: p.querySelectorAll('[data-acao]').length };
    }));

  await checar('sair do jogo volta ao modo leitura', async () =>
    await page.evaluate(() => {
      HL.jogo.sair();
      const hud = document.getElementById('hud');
      return { ok: !document.body.classList.contains('modo-jogo') && hud.hidden };
    }));

  await checar('nenhum erro de console após o ciclo de jogo', async () =>
    relatorio.erros.length === 0 ? { ok: true } : { ok: false, erros: relatorio.erros.slice(0, 12) });

  await page.close();

  /* ================= MOBILE ================= */
  const m = await abrirPagina(390, 844, true);
  await m.goto(relatorio.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));

  await checar('mobile: esc = 2 e sem overflow horizontal', async () =>
    await m.evaluate(() => ({
      ok: HL.mundo.esc === 2 && document.documentElement.scrollWidth <= window.innerWidth + 2,
      esc: HL.mundo.esc,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth
    })));

  await m.screenshot({ path: path.join(OUT, '05-mobile-leitura.png') });

  const alvoM = await m.evaluate(() => {
    const botoes = Array.from(document.querySelectorAll('[data-acao="jogar"]'));
    const b = botoes.filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; })[0];
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (alvoM) {
    await m.mouse.click(alvoM.x, alvoM.y);
  } else {
    await m.evaluate(() => { const b = document.querySelector('[data-acao="jogar"]'); if (b) b.click(); });
  }
  await new Promise(r => setTimeout(r, 800));
  await checar('mobile: os botoes de toque aparecem na tela', async () =>
    await m.evaluate(() => {
      const t = document.getElementById('toque');
      const cs = t ? getComputedStyle(t) : null;
      return {
        ok: !!t && !t.hidden && cs.display === 'flex',
        display: cs ? cs.display : null,
        temClasse: document.body.classList.contains('tem-toque'),
        botoes: t ? t.querySelectorAll('button').length : 0
      };
    }));

  await checar('mobile: botões de toque visíveis', async () =>
    await m.evaluate(() => {
      const t = document.getElementById('toque');
      return { ok: !!t && !t.hidden, botoes: t ? t.querySelectorAll('button').length : 0 };
    }));

  await m.screenshot({ path: path.join(OUT, '06-mobile-jogo.png') });

  await checar('mobile: sem erros de console', async () =>
    relatorio.erros.length === 0 ? { ok: true } : { ok: false, erros: relatorio.erros.slice(0, 12) });

  await m.close();
  await browser.close();
  srv.close();

  /* ================= relatório ================= */
  fs.writeFileSync(path.join(OUT, 'relatorio.json'), JSON.stringify(relatorio, null, 2));
  const falhas = relatorio.checks.filter(c => !c.ok);
  console.log('\n================ VERIFY ================');
  for (const c of relatorio.checks) {
    console.log((c.ok ? '  OK  ' : ' FALHA') + '  ' + c.nome +
      (c.detalhe ? '  ' + (typeof c.detalhe === 'object' ? JSON.stringify(c.detalhe) : c.detalhe) : ''));
  }
  if (relatorio.erros.length) {
    console.log('\n--- ERROS (' + relatorio.erros.length + ') ---');
    relatorio.erros.slice(0, 40).forEach(e => console.log('  ! ' + e));
  }
  console.log('\nRESULTADO: ' + (falhas.length ? falhas.length + ' FALHA(S)' : 'TUDO OK'));
  console.log('screenshots em ' + OUT);
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => {
  console.error('VERIFY CRASH:', e);
  process.exit(2);
});
