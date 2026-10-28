/* ==========================================================
   FUNDO · partículas em três camadas de paralaxe
   A cor muda com a profundidade (ciano no topo, latão e brasa
   no fundo) e as partículas viram riscos quando a página desce
   rápido, como poeira passando por quem cai num poço.
   ========================================================== */
(function(){
  'use strict';
  var cv = document.getElementById('fundo');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Q = PV.qualidade;
  function nivel(){ return Q ? Q.nivel : 'alto'; }

  var W = 0, H = 0, DPR = 1, parts = [];
  var CAMADAS = [0.12, 0.3, 0.55];
  // paradas de cor por profundidade (0 = topo, 1 = fundo)
  var PARADAS = [
    [0.00, [53, 208, 229]],
    [0.45, [96, 160, 230]],
    [0.75, [224, 168, 79]],
    [1.00, [255, 110, 70]]
  ];

  function corEm(t){
    for (var i = 1; i < PARADAS.length; i++) {
      if (t <= PARADAS[i][0]) {
        var a = PARADAS[i - 1], b = PARADAS[i], f = (t - a[0]) / (b[0] - a[0]);
        return [0, 1, 2].map(function(k){ return Math.round(a[1][k] + (b[1][k] - a[1][k]) * f); });
      }
    }
    return PARADAS[PARADAS.length - 1][1];
  }

  function medir(){
    // é um fundo desfocado: resolução cheia só no nível alto
    var nv = nivel();
    DPR = nv === 'alto' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    var n = nv === 'alto' ? Math.min(160, (W * H) / 9000) : (nv === 'medio' ? Math.min(70, (W * H) / 18000) : 0);
    n = Math.round(n);
    ultimaChave = '';
    parts = [];
    for (var i = 0; i < n; i++) {
      var c = i % 3;
      parts.push({
        x: Math.random() * W, y: Math.random() * H, c: c,
        tam: c === 2 ? 3 : (c === 1 ? 2 : 1.5),
        deriva: 6 + Math.random() * 10 * (c + 1),
        alfa: 0.25 + c * 0.2 + Math.random() * 0.15
      });
    }
  }

  var ultimoY = window.scrollY, vel = 0, antes = performance.now(), acum = 0, ultimaChave = '';

  function desenhar(dt){
    var y = window.scrollY, d = y - ultimoY;
    ultimoY = y;
    vel += (d - vel) * 0.25;

    var alt = Math.max(1, document.documentElement.scrollHeight - H);
    var prof = Math.min(1, Math.max(0, y / alt));
    var cor = corEm(prof);
    // a peça 3D que estiver na tela tinge o cenário com a cor dela
    var tm = PV.cena3d && PV.cena3d.tom();
    if (tm) cor = cor.map(function(c, k){ return Math.round(c + (tm.cor[k] - c) * tm.forca * 0.85); });

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // brilho do "núcleo" subindo do fundo da tela conforme se desce
    var g = ctx.createRadialGradient(W / 2, H * 1.15, 0, W / 2, H * 1.15, Math.max(W, H) * 0.9);
    var forca = 0.04 + prof * prof * 0.22 + (tm ? tm.forca * 0.14 : 0);
    g.addColorStop(0, 'rgba(' + cor.join(',') + ',' + forca + ')');
    g.addColorStop(1, 'rgba(' + cor.join(',') + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var risco = Math.min(Math.abs(vel), 60);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], f = CAMADAS[p.c];
      p.y -= d * f + (semMovimento ? 0 : p.deriva * dt);
      if (p.y < -80) { p.y += H + 160; p.x = Math.random() * W; }
      if (p.y > H + 80) { p.y -= H + 160; p.x = Math.random() * W; }
      var comp = p.tam + risco * f * 1.6;
      ctx.fillStyle = 'rgba(' + cor.join(',') + ',' + p.alfa + ')';
      ctx.fillRect(p.x, vel > 0 ? p.y : p.y - comp + p.tam, p.tam, comp);
    }
  }

  function laco(agora){
    requestAnimationFrame(laco);
    var dt = Math.min((agora - antes) / 1000, 0.1);
    antes = agora;
    if (document.hidden) return;
    var nv = nivel();
    if (nv !== 'alto') {                       // médio e baixo: no máximo 30 quadros por segundo
      acum += dt;
      if (acum < 1 / 30) return;
      dt = Math.min(acum, 0.1); acum = 0;
    }
    if (nv === 'baixo') {                      // baixo: sem partículas, só redesenha se a página rolou
      var tm = PV.cena3d && PV.cena3d.tom();
      var chave = Math.round(window.scrollY / 6) + '|' + (tm ? Math.round(tm.forca * 20) : '');
      if (chave === ultimaChave) return;
      ultimaChave = chave;
    }
    desenhar(dt);
  }

  window.addEventListener('resize', medir);
  if (Q) Q.aoMudar(medir);
  medir();
  requestAnimationFrame(laco);
})();
