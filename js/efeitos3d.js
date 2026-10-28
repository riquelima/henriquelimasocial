/* ==========================================================
   EFEITOS 3D · a página reage ao peso do personagem
   Cada elemento que o Pedro toca ganha uma mola em 4 eixos
   (afundar, inclinar, tombar para trás e girar) e é desenhado
   com transform: perspective() do CSS. A física do jogo não
   muda: as posições são lidas com offsetTop, que ignora isso.
   ========================================================== */
window.PV = window.PV || {};

PV.efeitos3d = (function(){
  'use strict';
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var main = document.getElementById('mundo');
  var Q = PV.qualidade;
  // Efeitos 3D de mola e inclinação dos cartões (sempre ativos para resposta tátil)
  function desligado(){ return semMovimento; }
  var RAD = Math.PI / 180;
  var MOLA = 240, ATRITO = 13;                 // mola pouco amortecida: balança antes de parar
  var EIXOS = ['ty', 'rz', 'rx', 'ry'];

  var estados = new Map();

  function estado(el){
    var s = estados.get(el);
    if (!s) {
      s = { el: el, ty: 0, rz: 0, rx: 0, ry: 0, v: { ty: 0, rz: 0, rx: 0, ry: 0 }, alvo: { ty: 0, rz: 0, rx: 0, ry: 0 }, pesoAte: 0, giro: null };
      el.style.transformOrigin = '50% 0';
      el.style.willChange = 'transform';
      estados.set(el, s);
    }
    return s;
  }

  /* o personagem está em pé no elemento; fr = posição dos pés (0 a 1) */
  function peso(el, fr, largura){
    if (desligado() || !el) return;
    var s = estado(el), lado = Math.max(-1, Math.min(1, (fr - 0.5) * 2));
    var maxRz = Math.min(2.4, Math.asin(Math.min(1, 9 / Math.max(20, largura / 2))) / RAD);
    s.pesoAte = performance.now() + 90;
    s.alvo.ty = 4; s.alvo.rz = lado * maxRz; s.alvo.rx = 7; s.alvo.ry = lado * 7;
  }

  function pouso(el, fr, forca){
    if (desligado() || !el) return;
    var s = estado(el);
    s.v.ty += 170 * forca; s.v.rx += 150 * forca; s.v.rz += (fr - 0.5) * 120 * forca;
  }

  /* cabeçada por baixo: bloco pequeno dá uma volta inteira, bloco grande pula */
  function cabecada(el, fr){
    if (desligado() || !el) return;
    var s = estado(el);
    if (el.offsetHeight < 170 && el.offsetWidth < 640) s.giro = { t: 0, dur: 0.6 };
    s.v.ty -= 300; s.v.rx -= 160; s.v.rz += (0.5 - fr) * 140;
  }

  /* soco no chão: onda que atravessa os elementos em volta, com atraso pela distância */
  function onda(cx, cy, raio, forca){
    if (desligado() || !PV.mundo) return;
    PV.mundo.plats.forEach(function(pl){
      if (!pl.el || pl.solido) return;
      var alto = pl.base - pl.y;
      var dx = Math.max(0, pl.x - cx, cx - (pl.x + pl.w));
      var dy = Math.max(0, pl.y - cy, cy - (pl.y + alto));
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > raio) return;
      var f = forca * (1 - d / raio);
      var acima = pl.y + alto / 2 < cy ? -1 : 1, esquerda = pl.x + pl.w / 2 < cx ? -1 : 1;
      setTimeout(function(){
        var s = estado(pl.el);
        s.v.ty += 340 * f; s.v.rx += 300 * f * acima; s.v.rz += 110 * f * esquerda; s.v.ry += 90 * f * esquerda;
      }, d * 0.75);
    });
  }

  /* cartão entrando na tela: cai do alto como uma aba se abrindo */
  function entrar(el){
    if (desligado()) return;
    var s = estado(el);
    s.rx = -78; s.ty = -16; s.v.rx = 0; s.v.ty = 0;
  }

  /* quanto o ponto x do topo do elemento está deslocado agora (para os pés acompanharem) */
  function deslocamento(el, x, pl){
    var s = el && estados.get(el);
    if (!s) return 0;
    return s.ty + (x - (pl.x + pl.w / 2)) * Math.sin(s.rz * RAD);
  }

  /* ---------- a página inteira dobra no soco e treme ---------- */
  var pag = { rx: 0, rz: 0, vrx: 0, vrz: 0, tx: 0, ty: 0, ativa: false };
  function pagina(cx, cy, forca){
    if (semMovimento || (Q && Q.nivel !== 'alto')) return;
    main.style.transformOrigin = Math.round(cx) + 'px ' + Math.round(cy) + 'px';
    pag.vrx += 70 * forca; pag.vrz += (Math.random() < 0.5 ? -1 : 1) * 14 * forca;
  }
  function tremor(tx, ty){ pag.tx = tx; pag.ty = ty; }

  /* ---------- título com extrusão de blocos que segue o mouse ou o personagem ---------- */
  var linhas = Array.prototype.slice.call(document.querySelectorAll('.titulo .linha'));
  var h1 = document.querySelector('.titulo');
  var mouse = { x: 0, y: 0, t: -1e9 }, foco = null;
  var dir = { x: 0.55, y: 0.83 }, ultimoDir = '';
  var CORES = [['#2c93a3', '#0a3a45'], ['#178291', '#05303a']];
  window.addEventListener('pointermove', function(e){ mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); }, { passive: true });

  function misturar(a, b, t){
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round(((x >> 16) & 255) * (1 - t) + ((y >> 16) & 255) * t);
    var g = Math.round(((x >> 8) & 255) * (1 - t) + ((y >> 8) & 255) * t);
    var bl = Math.round((x & 255) * (1 - t) + (y & 255) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  var ultimaExtrusao = 0, extrusaoFixa = false;
  function extrusao(dt, agora){
    if (!h1) return;
    var nv = Q ? Q.nivel : 'alto';
    // baixo (ou movimento reduzido): a extrusão é desenhada uma vez, parada
    if (semMovimento || nv === 'baixo') {
      if (!extrusaoFixa) { extrusaoFixa = true; ultimoDir = ''; pintarExtrusao(0.55, 0.83, 6); }
      return;
    }
    extrusaoFixa = false;
    // médio: menos camadas e no máximo umas 7 atualizações por segundo
    if (nv === 'medio' && agora - ultimaExtrusao < 150) return;
    var r = h1.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    var cx = r.left + r.width * 0.4, cy = r.top + r.height / 2, fx, fy;
    if (foco) { fx = foco.x; fy = foco.y; }
    else if (agora - mouse.t < 3000) { fx = mouse.x; fy = mouse.y; }
    else { fx = cx + Math.cos(agora / 1400) * 400; fy = cy - 300; }
    var vx = cx - fx, vy = cy - fy, m = Math.hypot(vx, vy) || 1;
    var f = 1 - Math.exp(-dt * 6);
    dir.x += (vx / m - dir.x) * f; dir.y += (vy / m - dir.y) * f;
    var chave = Math.round(dir.x * 40) + ',' + Math.round(dir.y * 40);
    if (chave === ultimoDir) return;
    ultimoDir = chave;
    ultimaExtrusao = agora;
    pintarExtrusao(dir.x, dir.y, nv === 'alto' ? 10 : 6);
  }

  function pintarExtrusao(dx, dy, n){
    var fs = parseFloat(getComputedStyle(h1).fontSize), passo = Math.max(0.6, fs * 0.085 / n);
    linhas.forEach(function(el, i){
      var cs = CORES[i] || CORES[0], partes = [];
      for (var k = 1; k <= n; k++) {
        partes.push((dx * passo * k).toFixed(1) + 'px ' + (dy * passo * k).toFixed(1) + 'px 0 ' + misturar(cs[0], cs[1], (k - 1) / (n - 1)));
      }
      el.style.textShadow = partes.join(',');
    });
  }

  // Mantém estados e transformações táteis ativas
  if (Q) Q.aoMudar(function(n){
    if (n === 'baixo') {
      pag.rx = pag.rz = pag.vrx = pag.vrz = 0;
    }
  });

  /* ---------- laço ---------- */
  var antes = performance.now();
  function laco(agora){
    requestAnimationFrame(laco);
    var dt = Math.min((agora - antes) / 1000, 1 / 30);
    antes = agora;
    if (document.hidden) return;

    estados.forEach(function(s, el){
      if (agora > s.pesoAte) { s.alvo.ty = 0; s.alvo.rz = 0; s.alvo.rx = 0; s.alvo.ry = 0; }
      var h = dt / 2, parado = true;
      for (var passo = 0; passo < 2; passo++) {
        for (var i = 0; i < 4; i++) {
          var e = EIXOS[i];
          var a = MOLA * (s.alvo[e] - s[e]) - ATRITO * s.v[e];
          s.v[e] += a * h; s[e] += s.v[e] * h;
        }
      }
      var volta = 0;
      if (s.giro) {
        s.giro.t += dt;
        var f = Math.min(1, s.giro.t / s.giro.dur);
        volta = 360 * (1 - Math.pow(1 - f, 3));
        if (f >= 1) s.giro = null;
      }
      for (var j = 0; j < 4; j++) {
        var ex = EIXOS[j];
        if (Math.abs(s[ex] - s.alvo[ex]) > 0.02 || Math.abs(s.v[ex]) > 0.02 || s.alvo[ex] !== 0) parado = false;
      }
      if (parado && !s.giro && agora > s.pesoAte) {
        el.style.transform = ''; el.style.transformOrigin = ''; el.style.willChange = '';
        estados.delete(el);
        return;
      }
      el.style.transform = 'perspective(800px) translateY(' + s.ty.toFixed(2) + 'px) rotateZ(' + s.rz.toFixed(3) +
        'deg) rotateX(' + (s.rx + volta).toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg)';
    });

    // página: mola própria para a dobra, mais o tremor vindo do jogo
    var h2 = dt / 2;
    for (var p2 = 0; p2 < 2; p2++) {
      pag.vrx += (-260 * pag.rx - 11 * pag.vrx) * h2; pag.rx += pag.vrx * h2;
      pag.vrz += (-260 * pag.rz - 11 * pag.vrz) * h2; pag.rz += pag.vrz * h2;
    }
    var mexendo = Math.abs(pag.rx) > 0.01 || Math.abs(pag.vrx) > 0.05 || Math.abs(pag.rz) > 0.01 || pag.tx || pag.ty;
    if (mexendo) {
      main.style.transform = 'translate(' + pag.tx.toFixed(1) + 'px,' + pag.ty.toFixed(1) + 'px) perspective(1400px) rotateX(' +
        pag.rx.toFixed(3) + 'deg) rotateZ(' + pag.rz.toFixed(3) + 'deg)';
      pag.ativa = true;
    } else if (pag.ativa) {
      main.style.transform = ''; main.style.transformOrigin = ''; pag.ativa = false;
      pag.rx = pag.rz = pag.vrx = pag.vrz = 0;
    }

    extrusao(dt, agora);
  }
  requestAnimationFrame(laco);

  return {
    peso: peso, pouso: pouso, cabecada: cabecada, onda: onda, entrar: entrar,
    deslocamento: deslocamento, pagina: pagina, tremor: tremor,
    focar: function(x, y){ foco = (x === null) ? null : { x: x, y: y }; }
  };
})();
