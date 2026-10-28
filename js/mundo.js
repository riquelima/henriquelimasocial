/* ==========================================================
   MUNDO · transforma a página em fase
   Lê o HTML e monta a geometria do jogo:
   - [data-plat]    elemento vira plataforma (a borda de cima)
   - [data-pouso]   plataforma de chegada e checkpoint da fase
   - [data-letras]  título cujas letras afundam quando pisadas
   - [data-bits], [data-skill], [data-trofeu], [data-cafe]  coletáveis
   - [data-bugs], [data-glitch]                              inimigos
   - [data-fase]    seção; o fundo de cada uma é um piso sólido
                    com um buraco em cima da próxima fase
   Tudo em coordenadas do documento (px a partir do topo da página).
   ========================================================== */
window.PV = window.PV || {};

PV.mundo = (function(){
  'use strict';

  var M = {
    plats: [],          // plataformas ordenadas por y
    porEl: new Map(),   // elemento -> plataforma
    fases: [],
    pisos: [],
    W: 0, H: 0,
    esc: 3,             // tamanho do pixel da pixel art (3 no desktop, 2 no celular)
    versao: 0
  };

  /* posição no documento ignorando transform (as animações de CSS não mexem na física) */
  function posDoc(el){
    var x = 0, y = 0, n = el;
    while (n) {
      x += n.offsetLeft; y += n.offsetTop;
      var pai = n.offsetParent;
      if (pai) { x += pai.clientLeft; y += pai.clientTop; }
      n = pai;
    }
    return { x: x, y: y };
  }

  /* distância entre o topo da caixa de linha e o topo das maiúsculas,
     medida na própria fonte do elemento (assim os pés pousam em cima das letras) */
  var medidor = document.createElement('canvas').getContext('2d');
  function topoDasLetras(el){
    var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    medidor.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var m = medidor.measureText('H');
    var sobe = m.fontBoundingBoxAscent, desce = m.fontBoundingBoxDescent, cap = m.actualBoundingBoxAscent;
    if (!(sobe > 0) || !(cap > 0)) return 0.14 * fs;
    var lh = cs.lineHeight === 'normal' ? sobe + desce : parseFloat(cs.lineHeight);
    return (lh - (sobe + desce)) / 2 + sobe - cap;
  }

  /* quebra o texto em <span class="l"> por letra, mantendo as palavras inteiras */
  function separarLetras(el){
    if (el.querySelector('.l')) return;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    if (!el.closest('h1')) el.setAttribute('aria-label', texto);
    el.textContent = '';
    var caixa = document.createElement('span');
    caixa.setAttribute('aria-hidden', 'true');
    texto.split(' ').forEach(function(palavra, i){
      if (i) caixa.appendChild(document.createTextNode(' '));
      var p = document.createElement('span');
      p.className = 'pal';
      Array.prototype.forEach.call(palavra, function(ch){
        var l = document.createElement('span');
        l.className = 'l'; l.textContent = ch;
        p.appendChild(l);
      });
      caixa.appendChild(p);
    });
    el.appendChild(caixa);
  }

  /* o chão de cada fase: dois blocos com o buraco entre eles (ou um bloco inteiro na última) */
  var ALTURA_CHAO = 10;
  function montarChao(f, buraco){
    var el = f.el._chao;
    if (!el) {
      el = document.createElement('div');
      el.className = 'chao';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = buraco ? '<i></i><i></i><b class="buraco"></b>' : '<i></i>';
      if (!buraco) el.classList.add('fim');
      f.el.appendChild(el);
      f.el._chao = el;
    }
    if (!buraco) return;
    var x0 = buraco.x0 - f.x, x1 = buraco.x1 - f.x, partes = el.children;
    partes[0].style.cssText = 'left:0;width:' + x0 + 'px';
    partes[1].style.cssText = 'left:' + x1 + 'px;right:0';
    partes[2].style.cssText = 'left:' + x0 + 'px;width:' + (x1 - x0) + 'px';
  }

  M.preparar = function(){
    document.querySelectorAll('[data-letras]').forEach(separarLetras);
  };

  M.medir = function(){
    var raiz = document.documentElement;
    M.W = raiz.clientWidth;
    M.H = raiz.scrollHeight;
    M.esc = M.W < 720 ? 2 : 3;
    M.plats = [];
    M.porEl = new Map();

    document.querySelectorAll('[data-plat]').forEach(function(el){
      var w = el.offsetWidth;
      if (!el.offsetParent || w < 16) return;          // escondido
      var p = posDoc(el), dy = 0;
      var afunda = 0;
      if (el.hasAttribute('data-letras')) {
        dy = topoDasLetras(el);
        afunda = 0.05 * parseFloat(getComputedStyle(el).fontSize);   // mesmo valor do .l.pisada no CSS
      }
      else if (el.dataset.dy) dy = parseFloat(el.dataset.dy) * parseFloat(getComputedStyle(el).fontSize);
      var plat = {
        x: p.x, y: Math.round(p.y + dy), w: w, el: el,
        solido: false, cartao: el.classList.contains('cartao'), letras: null, afunda: afunda,
        base: p.y + el.offsetHeight      // borda de baixo, para a cabeçada
      };
      // títulos: a plataforma é só a primeira linha de letras, do tamanho exato do texto
      if (el.hasAttribute('data-letras')) {
        var ls = el.querySelectorAll('.l');
        if (ls.length) {
          var topo = posDoc(ls[0]).y;
          plat.letras = [];
          for (var i = 0; i < ls.length; i++) {
            var q = posDoc(ls[i]);
            if (Math.abs(q.y - topo) > 6) break;
            plat.letras.push({ x0: q.x, x1: q.x + ls[i].offsetWidth, el: ls[i] });
          }
          if (plat.letras.length) {
            plat.x = plat.letras[0].x0;
            plat.w = plat.letras[plat.letras.length - 1].x1 - plat.x;
          }
        }
      }
      M.plats.push(plat);
      M.porEl.set(el, plat);
    });

    M.fases = Array.prototype.map.call(document.querySelectorAll('[data-fase]'), function(el, i){
      var p = posDoc(el), pouso = el.querySelector('[data-pouso]');
      return {
        el: el, i: i, nome: el.dataset.nome || ('Fase ' + i),
        x: p.x, top: p.y, bottom: p.y + el.offsetHeight,
        pouso: pouso ? M.porEl.get(pouso) : null
      };
    });

    // pisos: o fundo de cada fase é sólido, com um buraco em cima do pouso da próxima.
    // O piso existe de verdade na página (div .chao), o jogo só lê onde ele está.
    M.pisos = [];
    var gw = Math.round(Math.max(100, 40 * M.esc));
    M.fases.forEach(function(f, i){
      var y = f.bottom - ALTURA_CHAO, prox = M.fases[i + 1];
      if (!prox) {
        M.plats.push({ x: 0, y: y, w: M.W, solido: true, piso: i, final: true });
        M.pisos.push({ fase: i, y: y, final: true });
        montarChao(f, null);
        return;
      }
      var cx = prox.pouso ? prox.pouso.x + prox.pouso.w / 2 : M.W / 2;
      cx = Math.max(gw / 2 + 12, Math.min(M.W - gw / 2 - 12, cx));
      var x0 = Math.round(cx - gw / 2), x1 = Math.round(cx + gw / 2);
      M.plats.push({ x: 0, y: y, w: x0, solido: true, piso: i });
      M.plats.push({ x: x1, y: y, w: M.W - x1, solido: true, piso: i });
      M.pisos.push({ fase: i, y: y, x0: x0, x1: x1, cx: cx, destino: prox.pouso ? prox.pouso.y : y + 300 });
      montarChao(f, { x0: x0, x1: x1 });
    });

    M.plats.sort(function(a, b){ return a.y - b.y; });
    M.versao++;
  };

  /* em que fase está um y do documento */
  M.faseDe = function(y){
    for (var i = M.fases.length - 1; i >= 0; i--) if (y >= M.fases[i].top) return i;
    return 0;
  };

  /* ---------- entidades (coletáveis e inimigos), presas aos elementos ---------- */
  M.criarEntidades = function(){
    var ents = [];
    function todos(sel, fn){ document.querySelectorAll(sel).forEach(fn); }

    todos('[data-bits]', function(el){
      var n = +el.dataset.bits || 0;
      for (var i = 0; i < n; i++) ents.push({ tipo: 'bit', el: el, i: i, n: n, vivo: true, g: (i + n) % 2 });
    });
    todos('[data-skill]', function(el){
      var nomes = el.dataset.skill.split('|'), xs = (el.dataset.sx || '').split('|');
      nomes.forEach(function(nome, i){
        ents.push({ tipo: 'skill', el: el, nome: nome, sx: parseFloat(xs[i]) || 0.5, vivo: true });
      });
    });
    todos('[data-trofeu]', function(el){ ents.push({ tipo: 'trofeu', el: el, nome: el.dataset.trofeu, vivo: true }); });
    todos('[data-cafe]', function(el){ ents.push({ tipo: 'cafe', el: el, vivo: true }); });
    todos('[data-bugs]', function(el){
      var n = +el.dataset.bugs || 0;
      for (var i = 0; i < n; i++) ents.push({ tipo: 'bug', el: el, u: (i + 0.5) / n, dir: i % 2 ? -1 : 1, vivo: true, vel: 50 + Math.random() * 30 });
    });
    todos('[data-glitch]', function(el){
    var n = +el.dataset.glitch || 0;
    for (var i = 0; i < n; i++) ents.push({ tipo: 'glitch', el: el, ph: i * 2.4 + Math.random(), vivo: true });
    });
    todos('[data-spikes]', function(el){
      var n = +el.dataset.spikes || 1;
      for (var i = 0; i < n; i++) {
        ents.push({ tipo: 'spike', el: el, i: i, n: n, vivo: true });
      }
    });
    // trilha de bits caindo por baixo de cada buraco
    M.pisos.forEach(function(p, i){
      if (p.final) return;
      for (var k = 0; k < 4; k++) ents.push({ tipo: 'bit', piso: i, k: k, vivo: true, g: k % 2 });
    });
    return ents;
  };

  /* recalcula a posição-base de cada entidade (chamado depois de medir) */
  M.posicionar = function(ents){
    var k = M.esc / 3;
    ents.forEach(function(e){
      e.oculto = false;
      if (e.piso !== undefined) {
        var piso = M.pisos[e.piso];
        if (!piso || piso.final) { e.oculto = true; return; }
        e.x = piso.cx; e.y = piso.y + 80 * k + e.k * 52 * k;
        if (e.y > piso.destino - 40 * k) e.oculto = true;
        return;
      }
      var pl = M.porEl.get(e.el);
      if (!pl) { e.oculto = true; return; }
      e.plat = pl;
      switch (e.tipo) {
        case 'bit':
          var t = e.n > 1 ? e.i / (e.n - 1) : 0.5;
          var span = Math.min(pl.w * 0.7, e.n * 46 * k);
          var bx = parseFloat(e.el.dataset.bx);
          var cx = pl.x + pl.w * (isNaN(bx) ? 0.5 : bx);
          cx = Math.max(pl.x + span / 2, Math.min(pl.x + pl.w - span / 2, cx));
          e.x = cx - span / 2 + span * t;
          e.y = pl.y - 30 * k - Math.sin(Math.PI * t) * 24 * k;
          break;
        case 'skill':  e.x = pl.x + pl.w * e.sx; e.y = pl.y - 56 * k; break;
        case 'trofeu': e.x = pl.x + pl.w * 0.5;  e.y = pl.y - 62 * k; break;
        case 'cafe':   e.x = pl.x + pl.w * 0.9;  e.y = pl.y - 30 * k; break;
        case 'glitch': e.cx = pl.x + pl.w * 0.5; e.cy = pl.y - 120 * k; e.ax = Math.min(pl.w * 0.42, 220 * k); break;
        case 'spike':
          var t = e.n > 1 ? e.i / (e.n - 1) : 0.5;
          var span = Math.min(pl.w * 0.8, e.n * 30 * k);
          var cx = pl.x + pl.w * 0.5;
          cx = Math.max(pl.x + span / 2, Math.min(pl.x + pl.w - span / 2, cx));
          e.x = cx - span / 2 + span * t;
          e.y = pl.y;
          e.w = 16 * k;
          e.h = 12 * k;
          break;
      }
    });
  };

  M.posDoc = posDoc;
  return M;
})();
