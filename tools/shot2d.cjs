/* ==========================================================
   SHOT2D · fotos do jogo 2D jogado sobre a própria página
   node tools/shot2d.cjs [--port 8210]
   ========================================================== */
'use strict';
const { createRequire } = require('module');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.jpg':'image/jpeg', '.png':'image/png', '.woff2':'font/woff2' };
function argOf(n, d) { const i = process.argv.indexOf(n); return i > -1 && process.argv[i+1] ? process.argv[i+1] : d; }
const PORT = parseInt(argOf('--port', '8210'), 10);
const espera = ms => new Promise(r => setTimeout(r, ms));

function servir() {
  return new Promise(res => {
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
  const puppeteer = createRequire('/Users/teste/.nvm/versions/node/v22.23.3/lib/node_modules/hyperframes/node_modules/')('puppeteer-core');
  const exe = '/Users/teste/.cache/puppeteer/chrome-headless-shell/mac_arm-154.0.8037.57/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const b = await puppeteer.launch({ executablePath: exe, headless: 'shell', args: ['--no-sandbox','--hide-scrollbars'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const erros = [];
  page.on('pageerror', e => { erros.push('pageerror: ' + e.message); console.log('!! ' + e.message); });
  page.on('console', m => { if (m.type() === 'error') { erros.push('console: ' + m.text()); console.log('!! ' + m.text()); } });

  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'domcontentloaded' });
  await espera(1800);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-01-leitura.png') });

  /* ---- modo jogo: a pagina continua ali, com o personagem por cima ---- */
  await page.evaluate(() => document.querySelector('[data-acao="jogar"]').click());
  await espera(1400);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-02-jogo-inicio.png') });

  /* anda e pula */
  await page.keyboard.down('ArrowRight');
  await espera(900);
  await page.keyboard.press('Space');
  await espera(350);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-03-pulo.png') });
  await espera(700);
  await page.keyboard.up('ArrowRight');
  await espera(600);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-04-corrida.png') });

  /* desce ate a fase 1 (cards) */
  await page.evaluate(() => {
    const j = HL.jogo, M = HL.mundo, p = j.jogador;
    const f = M.fases[1], pl = f.pouso;
    if (pl) { p.x = pl.x + pl.w / 2 - p.w / 2; p.y = pl.y - p.h; p.vx = 0; p.vy = 0; p.chao = pl; }
    j.estado.faseAtual = 1; j.estado.faseMax = 1; j.estado.checkpoint = 1;
    j.estado.pontos = 1240; j.estado.bugs = 7; j.estado.skills = ['E2E Testing', 'REST APIs'];
    window.scrollTo(0, pl ? pl.y - 300 : 1200);
  });
  await espera(1400);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-05-fase1.png') });

  /* perto de um card, para ver bichos e chips */
  await page.evaluate(() => {
    const j = HL.jogo, M = HL.mundo, p = j.jogador;
    const e = j.estado.ents.find(x => x.tipo === 'bug' && x.vivo);
    if (e) { p.x = e.x - 120; p.y = e.y - p.h; p.vx = 0; p.vy = 0; }
  });
  await espera(1200);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-06-bichos.png') });

  /* painel de pausa */
  await page.evaluate(() => HL.jogo.pausar());
  await espera(700);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-07-pausa.png') });

  /* ---- mobile ---- */
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await espera(1600);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-08-mobile-leitura.png') });
  await page.evaluate(() => document.querySelector('[data-acao="jogar"]').click());
  await espera(1600);
  await page.screenshot({ path: path.join(ROOT, '.verify', '2d-09-mobile-jogo.png') });

  console.log(erros.length ? 'ERROS: ' + erros.length : 'sem erros de console');
  await b.close(); srv.close();
})().catch(e => { console.error('SHOT2D CRASH:', e); process.exit(2); });
