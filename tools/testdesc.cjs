/* ==========================================================
   TESTDESC · testa as duas mecânicas de descida isoladamente
   1) ↓ atravessa o card
   2) o buraco do piso leva à fase seguinte
   node tools/testdesc.cjs
   ========================================================== */
'use strict';
const { createRequire } = require('module');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.jpg':'image/jpeg', '.png':'image/png', '.woff2':'font/woff2' };
const espera = ms => new Promise(r => setTimeout(r, ms));
function servir() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = q.url.split('?')[0]; if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(8196, () => res(s));
  });
}
(async () => {
  const srv = await servir();
  const puppeteer = createRequire('/Users/teste/.nvm/versions/node/v22.23.3/lib/node_modules/hyperframes/node_modules/')('puppeteer-core');
  const exe = '/Users/teste/.cache/puppeteer/chrome-headless-shell/mac_arm-154.0.8037.57/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const b = await puppeteer.launch({ executablePath: exe, headless: 'shell', args: ['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('http://localhost:8196/', { waitUntil: 'domcontentloaded' });
  await espera(1800);

  const estado = () => page.evaluate(() => {
    const j = HL.jogo, M = HL.mundo, p = j.jogador, e = j.estado;
    const f = M.faseDe(p.y + p.h);
    const piso = M.pisos[f];
    return {
      fase: f, modo: e.modo,
      x: Math.round(p.x), y: Math.round(p.y), vy: Math.round(p.vy),
      chao: p.chao ? (p.chao.el ? p.chao.el.tagName + '.' + (p.chao.el.className || '') : 'PISO') : null,
      chaoX: p.chao ? Math.round(p.chao.x) : null,
      chaoW: p.chao ? Math.round(p.chao.w) : null,
      buraco: piso && !piso.final ? { x0: piso.x0, x1: piso.x1, cx: Math.round(piso.cx) } : null,
      ignorado: !!p.ignorar
    };
  });

  // ---------- TESTE 1: o botao JOGAR + descer pelo card com ↓ ----------
  await page.evaluate(() => document.querySelector('[data-acao="jogar"]').click());
  await espera(1200);
  console.log('apos JOGAR      :', JSON.stringify(await estado()));

  // cai do h1 para o primeiro card
  await page.keyboard.down('ArrowRight');
  await espera(1400);
  await page.keyboard.up('ArrowRight');
  await espera(900);
  const antes = await estado();
  console.log('no card         :', JSON.stringify(antes));

  await page.keyboard.down('ArrowDown');
  await espera(60);
  await page.keyboard.up('ArrowDown');
  await espera(1200);
  const depois = await estado();
  console.log('apos ↓ (descer) :', JSON.stringify(depois));
  console.log('  >> DESCIDU?    :', depois.y > antes.y + 30 ? 'SIM ✅' : 'NAO ❌  (y ' + antes.y + ' -> ' + depois.y + ')');

  // ---------- TESTE 2: o buraco do piso leva a fase seguinte ----------
  // vai para o piso: anda para a direita ate cair no chao
  await page.keyboard.down('ArrowRight');
  await espera(2600);
  await page.keyboard.up('ArrowRight');
  await espera(800);
  let st = await estado();
  console.log('no piso         :', JSON.stringify(st));

  if (st.buraco) {
    // caminha para o buraco
    const dir = st.x + 15 < st.buraco.cx ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(dir);
    await espera(2200);
    await page.keyboard.up(dir);
    await espera(1500);
    const s2 = await estado();
    console.log('apos o buraco   :', JSON.stringify(s2));
    console.log('  >> TROCOU DE FASE?', s2.fase > st.fase ? 'SIM ✅ (fase ' + st.fase + ' -> ' + s2.fase + ')' : 'NAO ❌ (fase ' + st.fase + ' -> ' + s2.fase + ')');
  }

  // ---------- TESTE 3: ↓ desce de um card para o card de baixo ----------
  const st3 = await estado();
  console.log('\nno card (fase ' + st3.fase + ')   :', JSON.stringify(st3));
  await page.keyboard.down('ArrowDown');
  await espera(60);
  await page.keyboard.up('ArrowDown');
  await espera(1500);
  const st4 = await estado();
  console.log('apos ↓ no card      :', JSON.stringify(st4));
  console.log('  >> DESCEU O CARD?', st4.y > st3.y + 30 ? 'SIM ✅ (y ' + st3.y + ' -> ' + st4.y + ')' : 'NAO ❌ (y ' + st3.y + ' -> ' + st4.y + ')');

  await page.screenshot({ path: path.join(ROOT, '.verify', 'testdesc.png') });
  await b.close(); srv.close();
})().catch(e => { console.error('CRASH:', e); process.exit(2); });
