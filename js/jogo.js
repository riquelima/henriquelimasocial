/* ==========================================================
   JOGO · física, câmera, inimigos, HUD e estados
   O canvas #jogo cobre a janela inteira, por cima da página.
   O mundo usa coordenadas do documento e a câmera é a própria
   rolagem da página: quando o Pedro desce, a página desce junto.

   Estados: menu → jogando ⇄ pausado → fim
                     ↓  ↑
                    morto (volta ao checkpoint)
            fora = modo leitura depois de ter jogado
   ========================================================== */
(function(){
  'use strict';
  var PV = window.PV, M = PV.mundo, S = PV.sprites, som = PV.som;

  var cv = document.getElementById('jogo');
  var ctx = cv.getContext('2d');
  var main = document.getElementById('mundo');
  var painel = document.getElementById('painel');
  var caixa = document.getElementById('painelCaixa');
  var avisoEl = document.getElementById('aviso');
  var btnSom = document.getElementById('btnSom');
  var btnPausa = document.getElementById('btnPausa');

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temToque = window.matchMedia('(pointer: coarse)').matches;
  if (temToque) document.body.classList.add('tem-toque');
  var FONTE = 'Silkscreen, ui-monospace, monospace';
  var Q = PV.qualidade;
  function nivel(){ return Q ? Q.nivel : 'alto'; }
  // o que cada nível de qualidade permite
  var LIMITES = {
    alto:  { dpr: 2,    partes: 700, cubo: 1 },
    medio: { dpr: 1.25, partes: 350, cubo: 2 },
    baixo: { dpr: 1,    partes: 150, cubo: 3 }
  };
  function limite(){ return LIMITES[nivel()] || LIMITES.alto; }

  var W = 0, H = 0, DPR = 1;

  /* constantes de física para o tamanho de desktop (pixel da arte = 3 px).
     No celular tudo é multiplicado por k = esc / 3. */
  var C = {
    grav: 2300, pulo: 800, pulo2: 690, corrida: 350,
    acel: 3000, atrito: 2800, acelAr: 1900,
    quedaMax: 1150, socoVel: 1750, quique: 600, quiqueAlto: 820,
    empurraX: 330, empurraY: 440,
    coyote: 0.1, buffer: 0.13, invuln: 1.3
  };

  var E = {
    modo: 'menu', partida: false, terminou: false, primeira: true,
    ents: [], parts: [], textos: [],
    t: 0, crono: 0, cronoOn: false,
    pontos: 0, bits: 0, bitsTotal: 0, skills: [], skillsTotal: 0, listaSkills: [],
    trofeus: [], trofeusTotal: 0, bugs: 0, bugsTotal: 0, mortes: 0,
    combo: 0, seqBits: 0, seqBitsT: -9,
    faseMax: 0, faseAtual: 0, checkpoint: 0, bandeiras: [],
    banner: null, dica: null, flash: 0,
    tremor: 0, tx: 0, ty: 0, tremendo: false,
    cam: 0, manualAte: 0, mortoT: 0,
    menuT: 1.2, menuI: 0, pisadoEl: null,
    voos: [], batidos: new Set(),
    tut: {}
  };

  var p = {
    x: 0, y: 0, w: 30, h: 63, vx: 0, vy: 0, pesAntes: 0,
    chao: null, virado: false, pulosAr: 1, coyote: 0, buffer: 0,
    socando: 0, socoT: 0, invuln: 0, atordoado: 0, vidas: 3,
    sx: 1, sy: 1, giro: 0, ignorar: null, quicando: false,
    animT: 0, passoT: 0, rastro: [], oculto: false,
    faceX: 1                       // -1 a 1: vira em 3D em vez de espelhar de uma vez
  };

  /* ---------- utilidades ---------- */
  function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
  function aproximar(v, alvo, d){ return v < alvo ? Math.min(v + d, alvo) : Math.max(v - d, alvo); }
  function dois(n){ return n < 10 ? '0' + n : '' + n; }
  function tempo(s){ var m = Math.floor(s / 60), r = Math.floor(s % 60); return dois(m) + ':' + dois(r); }
  function milhar(n){ return Math.max(0, Math.round(n)).toLocaleString('pt-BR'); }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  // a peça 3D que estiver na tela reage ao que o personagem faz
  function avisar3d(nome){ if (PV.cena3d) PV.cena3d.evento(nome); }

  /* ==========================================================
     ENTRADA: teclado e botões de toque
     ========================================================== */
  var inp = { esq: false, dir: false, pulo: false, baixo: false, ap: { pulo: false, baixo: false } };
  var TECLAS = {
    ArrowLeft: 'esq', KeyA: 'esq', ArrowRight: 'dir', KeyD: 'dir',
    ArrowUp: 'pulo', KeyW: 'pulo', Space: 'pulo', KeyK: 'pulo', KeyZ: 'pulo',
    ArrowDown: 'baixo', KeyS: 'baixo', KeyJ: 'baixo'
  };
  function apertar(a){
    if (!inp[a] && inp.ap[a] !== undefined) inp.ap[a] = true;
    inp[a] = true;
  }
  function soltar(a){ inp[a] = false; }
  function limparInput(){
    inp.esq = inp.dir = inp.pulo = inp.baixo = false;
    inp.ap.pulo = inp.ap.baixo = false;
    document.querySelectorAll('.toque button.on').forEach(function(b){ b.classList.remove('on'); });
  }
  function emJogo(){ return E.modo === 'jogando' || E.modo === 'morto'; }

  window.addEventListener('keydown', function(e){
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!painel.hidden) {
      if ((e.code === 'Escape' || e.code === 'KeyP') && E.modo === 'pausado') { e.preventDefault(); continuar(); }
      return;
    }
    if (emJogo()) {
      var a = TECLAS[e.code];
      if (a) { e.preventDefault(); if (!e.repeat) apertar(a); return; }
      if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); pausar(); return; }
      if (e.code === 'KeyM') { alternarSom(); return; }
      return;
    }
    if (e.code === 'Enter' && (E.modo === 'menu' || E.modo === 'fora')) {
      var foco = document.activeElement;
      if (!foco || foco === document.body) { e.preventDefault(); jogar(); }
    }
  });
  window.addEventListener('keyup', function(e){ var a = TECLAS[e.code]; if (a) soltar(a); });
  window.addEventListener('blur', limparInput);

  document.querySelectorAll('[data-tecla]').forEach(function(b){
    var a = b.dataset.tecla;
    function liga(e){
      e.preventDefault(); apertar(a); b.classList.add('on');
      try { b.setPointerCapture(e.pointerId); } catch(_) {}
    }
    function desliga(){ soltar(a); b.classList.remove('on'); }
    b.addEventListener('pointerdown', liga);
    b.addEventListener('pointerup', desliga);
    b.addEventListener('pointercancel', desliga);
    b.addEventListener('lostpointercapture', desliga);
    b.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  });

  // rolar com a roda ou o dedo durante o jogo solta a câmera por um instante
  function soltarCamera(){ if (E.modo === 'jogando') E.manualAte = performance.now() + 1400; }
  window.addEventListener('wheel', soltarCamera, { passive: true });
  window.addEventListener('touchmove', function(e){
    if (!e.target.closest || !e.target.closest('.toque')) soltarCamera();
  }, { passive: true });

  document.addEventListener('visibilitychange', function(){ if (document.hidden && E.modo === 'jogando') pausar(); });

  /* ==========================================================
     MEDIDAS: canvas, mundo e reencaixe depois de mudar o layout
     ========================================================== */
  function ajustarTamanho(){ p.w = 10 * M.esc; p.h = 21 * M.esc; }

  function colocarNoPouso(i, caindo){
    var f = M.fases[i], pl = f && f.pouso;
    if (!pl) return;
    var fr = i === 0 ? 0.3 : 0.5;
    p.x = clamp(pl.x + pl.w * fr - p.w / 2, 0, M.W - p.w);
    p.vx = 0; p.vy = 0;
    if (caindo) { p.y = pl.y - p.h - 160 * M.esc / 3; sairDoChao(); }
    else { p.y = pl.y - p.h; p.chao = pl; }
  }

  function acharPiso(i, x){
    for (var j = 0; j < M.plats.length; j++) {
      var pl = M.plats[j];
      if (pl.piso === i && x >= pl.x && x <= pl.x + pl.w) return pl;
    }
    return null;
  }

  function prepararEnts(){
    E.ents.forEach(function(e){
      if (e.tipo === 'bug') { e.w = 12 * M.esc; e.h = 9 * M.esc; }
      else if (e.tipo === 'glitch') { e.w = 10 * M.esc; e.h = 10 * M.esc; }
    });
  }

  function remedir(){
    var chaoEl = p.chao && p.chao.el, chaoPiso = p.chao ? p.chao.piso : undefined;
    var meio = p.x + p.w / 2, escAntes = M.esc;
    M.medir();
    if (M.esc !== escAntes || !p.h) ajustarTamanho();
    M.posicionar(E.ents);
    prepararEnts();
    if (E.modo === 'menu') { colocarNoPouso(0); return; }
    if (p.chao) {
      var novo = chaoEl ? M.porEl.get(chaoEl) : acharPiso(chaoPiso, meio);
      if (novo) { p.chao = novo; p.y = novo.y - p.h; }
      else sairDoChao();
    }
    p.x = clamp(p.x, 0, M.W - p.w);
  }

  var pedido = 0;
  function pedirMedida(){
    if (pedido) return;
    pedido = requestAnimationFrame(function(){ pedido = 0; remedir(); });
  }

  function redimensionar(){
    DPR = Math.min(window.devicePixelRatio || 1, limite().dpr);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    remedir();
  }

  /* ==========================================================
     JOGADOR
     ========================================================== */
  function sairDoChao(){
    p.chao = null;
    if (E.pisadoEl) { E.pisadoEl.classList.remove('pisado'); E.pisadoEl = null; }
  }

  function marcarPisado(pl){
    if (E.pisadoEl === pl.el) return;
    if (E.pisadoEl) E.pisadoEl.classList.remove('pisado');
    E.pisadoEl = null;
    if (pl.el && pl.cartao) { pl.el.classList.add('pisado'); E.pisadoEl = pl.el; }
  }

  function pular(v, duplo, k){
    sairDoChao();
    p.vy = -v; p.buffer = 0; p.coyote = 0; p.quicando = false;
    p.sx = 0.78; p.sy = 1.24;
    E.cronoOn = true;
    avisar3d('pulo');
    if (duplo) {
      p.pulosAr--; p.giro = 1;
      anel(p.x + p.w / 2, p.y + p.h, 34 * k, '#35d0e5');
      som.tocar('pulo2');
      E.tut.pulou2 = true;
    } else {
      poeira(p.x + p.w / 2, p.y + p.h, 5, k);
      som.tocar('pulo');
      E.tut.pulou = true;
    }
  }

  function iniciarSoco(){
    p.socando = 1; p.socoT = 0.15; p.giro = 1;
    som.tocar('socoIni');
  }

  function controlar(dt, k){
    p.coyote -= dt; p.buffer -= dt;
    if (inp.ap.pulo) { inp.ap.pulo = false; p.buffer = C.buffer; }

    var dir = (inp.dir ? 1 : 0) - (inp.esq ? 1 : 0);
    if (dir) E.cronoOn = true;
    if (p.socando) dir = 0;
    if (p.atordoado > 0) { p.atordoado -= dt; dir = 0; }

    var alvo = dir * C.corrida * k;
    var acel = (p.chao ? (dir ? C.acel : C.atrito) : C.acelAr) * k;
    p.vx = aproximar(p.vx, alvo, acel * dt);
    if (dir) p.virado = dir < 0;

    if (p.buffer > 0 && !p.socando && p.atordoado <= 0) {
      if (p.chao || p.coyote > 0) pular(C.pulo * k, false, k);
      else if (p.pulosAr > 0) pular(C.pulo2 * k, true, k);
    }
    // soltar o botão cedo corta o pulo (pulo curto)
    if (!inp.pulo && !p.quicando && p.vy < -C.pulo * k * 0.42) p.vy = -C.pulo * k * 0.42;

    if (inp.ap.baixo) {
      inp.ap.baixo = false;
      if (p.chao) {
        if (!p.chao.solido) { p.ignorar = p.chao; sairDoChao(); p.y += 2; p.vy = 80 * k; }
        else dizer('o buraco é ' + ladoDoBuraco(), 1.8);
      } else if (!p.socando) iniciarSoco();
    }
  }

  function ladoDoBuraco(){
    var piso = M.pisos[M.faseDe(p.y + p.h - 4)];
    if (!piso || piso.final) return 'logo ali';
    return (piso.cx < p.x + p.w / 2) ? 'pra esquerda ←' : 'pra direita →';
  }

  function fisica(dt, k){
    if (p.invuln > 0) p.invuln -= dt;

    if (p.socando === 1) {
      p.socoT -= dt; p.vx = 0; p.vy = 0;
      if (p.socoT <= 0) { p.socando = 2; p.vy = C.socoVel * k; }
    } else {
      p.vy += C.grav * k * dt;
      var max = p.socando === 2 ? C.socoVel * k : C.quedaMax * k;
      if (p.vy > max) p.vy = max;
    }

    p.pesAntes = p.y + p.h;
    p.x += p.vx * dt;
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    else if (p.x > M.W - p.w) { p.x = M.W - p.w; p.vx = 0; }

    if (p.chao) {
      var c = p.chao;
      if (p.x + p.w < c.x + 4 || p.x > c.x + c.w - 4) { sairDoChao(); p.coyote = C.coyote; }
      else { p.y = c.y - p.h; p.vy = 0; }
    }

    if (!p.chao) {
      var cabecaAntes = p.y;
      p.y += p.vy * dt;
      if (p.vy < 0 && E.modo === 'jogando') cabecadas(cabecaAntes, k);
      // plataformas são de mão única: só colidem caindo e vindo de cima
      if (p.vy >= 0) {
        var pes = p.y + p.h, alvo = null;
        for (var i = 0; i < M.plats.length; i++) {
          var pl = M.plats[i];
          if (pl.y < p.pesAntes - 0.5) continue;
          if (pl.y > pes) break;
          if (pl === p.ignorar) continue;
          if (p.x + p.w <= pl.x + 4 || p.x >= pl.x + pl.w - 4) continue;
          alvo = pl; break;
        }
        if (alvo) pousar(alvo, k);
      }
      if (p.ignorar && p.pesAntes > p.ignorar.y + 1) p.ignorar = null;
      if (p.y < -400) { p.y = -400; p.vy = Math.max(p.vy, 0); }
    }

    var vol = Math.min(1, dt * 14);
    p.sx += (1 - p.sx) * vol; p.sy += (1 - p.sy) * vol;
    if (p.giro > 0) p.giro = Math.max(0, p.giro - dt * 3.4);
    p.faceX = aproximar(p.faceX, p.virado ? -1 : 1, dt * 11);

    if (p.chao && Math.abs(p.vx) > 120 * k) {
      p.passoT -= dt;
      if (p.passoT <= 0) { p.passoT = 0.17; poeira(p.x + p.w / 2 - (p.virado ? -8 : 8) * k, p.y + p.h, 1, k); som.tocar('passo'); }
    }
    p.animT += dt;
  }

  /* subindo, a cabeça cruzou a borda de baixo de um elemento: cabeçada */
  function cabecadas(antes, k){
    for (var i = 0; i < M.plats.length; i++) {
      var pl = M.plats[i];
      if (!pl.el || !pl.base || antes < pl.base || p.y >= pl.base) continue;
      if (p.x + p.w <= pl.x + 6 || p.x >= pl.x + pl.w - 6) continue;
      bater(pl, k);
    }
  }

  function bater(pl, k){
    var cx = p.x + p.w / 2;
    if (PV.efeitos3d) PV.efeitos3d.cabecada(pl.el, (cx - pl.x) / pl.w);
    som.tocar('bloco');
    tremer(4);
    avisar3d('pouso');
    p.vy *= 0.82;
    for (var i = 0; i < 8; i++) particula(cx + rnd(-10, 10), pl.base, rnd(-160, 160) * k, rnd(-40, 140) * k, rnd(0.25, 0.45), '#a2b5c4', rnd(2, 4) * k, 900 * k);
    if (pl.letras) ondaLetras(pl, cx);
    if (!E.batidos.has(pl.el)) {
      E.batidos.add(pl.el);
      E.pontos += 25;
      E.parts.push({ tipo: 'moeda', x: cx, y: pl.base - 8 * k, vy: -520 * k, grav: 1500 * k, vida: 0.55, max: 0.55 });
      texto(cx, pl.base - 40 * k, '+25', '#eaf1f5');
      som.tocar('moeda');
    }
    E.tut.cabecada = true;
  }

  function pousar(pl, k){
    var v = p.vy;
    p.chao = pl; p.y = pl.y - p.h; p.vy = 0;
    p.pulosAr = 1; p.quicando = false; p.coyote = 0;
    E.combo = 0;
    if (p.socando === 2) { p.socando = 0; impactoSoco(pl, k); }
    else {
      p.socando = 0;
      if (v > 380 * k) {
        p.sx = 1.26; p.sy = 0.76;
        poeira(p.x + p.w / 2, pl.y, Math.min(10, 3 + v / 200), k);
        som.tocar('pouso');
        avisar3d('pouso');
      }
    }
    marcarPisado(pl);
    if (pl.el && PV.efeitos3d && v > 200 * k) PV.efeitos3d.pouso(pl.el, (p.x + p.w / 2 - pl.x) / pl.w, Math.min(1.6, v / 900));
    if (E.modo !== 'jogando') return;
    if (pl.final) { terminar(); return; }
    if (pl.solido && !E.tut.piso) { E.tut.piso = true; dizer('procura o buraco ' + ladoDoBuraco().replace(/^pra /, ''), 3); }
  }

  function impactoSoco(pl, k){
    tremer(16);
    som.tocar('soco');
    avisar3d('soco');
    var cx = p.x + p.w / 2, y = pl.y;
    anel(cx, y, 200 * k, pl.solido ? '#e0a84f' : '#35d0e5', 0.45, 5);
    for (var i = 0; i < 20; i++) {
      particula(cx + rnd(-12, 12), y - 2, rnd(-460, 460) * k, rnd(-650, -160) * k, rnd(0.4, 0.75),
        i % 3 ? '#35d0e5' : '#eaf1f5', rnd(3, 6) * k, 1500 * k);
    }
    E.ents.forEach(function(e){
      if (!e.vivo || e.oculto || e.x === undefined) return;
      var ex = e.x + e.w / 2, ey = e.y + e.h;
      if (e.tipo === 'bug' && Math.abs(ex - cx) < 200 * k && Math.abs(ey - y) < 34 * k) { E.combo++; matarInimigo(e); }
      if (e.tipo === 'glitch' && Math.hypot(ex - cx, e.y + e.h / 2 - y) < 190 * k) { E.combo++; matarInimigo(e); }
    });
    if (PV.efeitos3d) {
      PV.efeitos3d.onda(cx, y, 560 * k, 1);
      PV.efeitos3d.pagina(cx, y, 1);
    }
    E.parts.push({ tipo: 'chao', x: cx, y: y, raio: 240 * k, vida: 0.55, max: 0.55, cor: pl.solido ? '#e0a84f' : '#35d0e5' });
    if (pl.letras) ondaLetras(pl, cx);
    p.sx = 1.4; p.sy = 0.66;
    E.tut.soco = true;
  }

  function ondaLetras(pl, cx){
    pl.letras.forEach(function(L){
      var d = Math.abs((L.x0 + L.x1) / 2 - cx);
      if (d > 520) return;
      setTimeout(function(){
        L.el.classList.remove('onda'); void L.el.offsetWidth; L.el.classList.add('onda');
      }, d * 0.7);
    });
  }

  function machucar(fx, k){
    p.vidas--; p.invuln = C.invuln; p.atordoado = 0.3;
    var lado = (p.x + p.w / 2 < fx) ? -1 : 1;
    sairDoChao();
    p.vx = lado * C.empurraX * k; p.vy = -C.empurraY * k;
    p.socando = 0; p.quicando = true; p.giro = 0;
    E.flash = 0.5; E.combo = 0;
    tremer(10);
    som.tocar('dano');
    avisar3d('dano');
    texto(p.x + p.w / 2, p.y - 6, '-1 ♥', '#ff4d7e');
    if (p.vidas <= 0) morrer(k);
  }

  function morrer(k){
    E.modo = 'morto'; E.mortoT = 1.9; E.mortes++;
    p.oculto = true; p.vx = 0;
    som.tocar('panico');
    tremer(20);
    estilhacar(k);
    banner('KERNEL PANIC', 'voltando ao último checkpoint', 1.9, '#ff4d7e');
  }

  var pixelsPose = {};
  function pixelsDe(nome, q){
    var chave = nome + q;
    if (pixelsPose[chave]) return pixelsPose[chave];
    var c1 = S.pedro(nome, q, 1), d = c1.getContext('2d').getImageData(0, 0, c1.width, c1.height).data, lista = [];
    for (var y = 0; y < c1.height; y++) for (var x = 0; x < c1.width; x++) {
      var i = (y * c1.width + x) * 4;
      if (d[i + 3] < 128 || (d[i] < 20 && d[i + 1] < 20 && d[i + 2] < 30)) continue;   // vazio ou contorno
      lista.push({ x: x, y: y, cor: 'rgb(' + d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ')' });
    }
    return (pixelsPose[chave] = lista);
  }

  /* cada pixel vira um cubo que voa para fora da tela (z cresce até a câmera) */
  function estilhacar(k){
    var esc = M.esc, pose = escolherPose(k), lado = p.faceX < 0 ? -1 : 1;
    var cx = p.x + p.w / 2, pes = p.y + p.h, pulo = limite().cubo;   // aparelho fraco: menos cubos
    pixelsDe(pose[0], pose[1]).forEach(function(px, n){
      if (n % pulo) return;
      E.parts.push({
        tipo: 'voxel', x: cx + (px.x - 9) * esc * lado, y: pes + (px.y - 23) * esc, z: 0,
        vx: (px.x - 9) * rnd(14, 44) * k * lado, vy: (px.y - 14) * rnd(10, 30) * k - rnd(120, 400) * k,
        vz: semMovimento ? 0 : rnd(0.3, 1.05), giro: rnd(0, 6), vg: rnd(-14, 14),
        cor: px.cor, tam: esc, vida: rnd(1.1, 1.7), max: 1.7, grav: 700 * k
      });
    });
  }

  function renascer(){
    p.vidas = 3; p.oculto = false; p.invuln = 1.6; p.socando = 0; p.giro = 0; p.atordoado = 0;
    colocarNoPouso(E.checkpoint, true);
    E.modo = 'jogando';
    limparInput();
  }

  /* ==========================================================
     ENTIDADES
     ========================================================== */
  function atualizarEntidades(dt, k){
    var t = E.t;
    for (var i = 0; i < E.ents.length; i++) {
      var e = E.ents[i];
      if (!e.vivo || e.oculto) continue;
      if (e.tipo === 'bug') {
        var pl = e.plat; if (!pl) continue;
        var span = pl.w - e.w - 8;
        if (span > 4 && E.modo !== 'fim') {
          e.u += e.dir * e.vel * k * dt / span;
          if (e.u >= 1) { e.u = 1; e.dir = -1; } else if (e.u <= 0) { e.u = 0; e.dir = 1; }
        }
        e.x = pl.x + 4 + e.u * Math.max(0, span);
        e.y = pl.y - e.h;
      } else if (e.tipo === 'glitch') {
        e.x = e.cx + Math.sin(t * 0.8 + e.ph) * e.ax - e.w / 2;
        e.y = e.cy + Math.sin(t * 1.9 + e.ph * 1.3) * 26 * k - e.h / 2;
      }
    }
  }

  function colisoes(k){
    var x0 = p.x, x1 = p.x + p.w, y0 = p.y, y1 = p.y + p.h;
    for (var i = 0; i < E.ents.length; i++) {
      var e = E.ents[i];
      if (!e.vivo || e.oculto || e.x === undefined) continue;
      if (e.tipo === 'bug' || e.tipo === 'glitch') {
        var m = 3 * k;
        if (x1 > e.x + m && x0 < e.x + e.w - m && y1 > e.y + m && y0 < e.y + e.h - m) {
          var deCima = p.vy > 0 && p.pesAntes <= e.y + e.h * 0.6;
          if (p.socando === 2 || deCima) {
            E.combo++;
            matarInimigo(e);
            if (p.socando !== 2) {
              p.vy = -(inp.pulo ? C.quiqueAlto : C.quique) * k;
              p.quicando = true; p.pulosAr = 1; p.giro = 0;
            }
          } else if (p.invuln <= 0) {
            machucar(e.x + e.w / 2, k);
            if (E.modo !== 'jogando') return;
          }
        }
      } else if (e.tipo === 'spike') {
        // Colisão com espinhos (dano imediato)
        if (x1 > e.x + 2 && x0 < e.x + e.w - 2 && y1 > e.y + 4 && y0 < e.y + e.h - 2) {
          if (p.invuln <= 0) {
            machucar(e.x + e.w / 2, k);
            if (E.modo !== 'jogando') return;
          }
        }
      } else {
        var r = (e.tipo === 'bit' ? 16 : 26) * k;
        if (e.x > x0 - r && e.x < x1 + r && e.y > y0 - r && e.y < y1 + r) coletar(e, k);
      }
    }
  }

  function matarInimigo(e){
    e.vivo = false; E.bugs++;
    var mult = Math.max(1, E.combo), pts = 50 * mult;
    E.pontos += pts;
    som.tocar('esmaga', E.combo);
    var k = M.esc / 3, cor = e.tipo === 'bug' ? '#ff4d7e' : '#9b5cff';
    for (var i = 0; i < 14; i++) {
      particula(e.x + e.w / 2, e.y + e.h / 2, rnd(-300, 300) * k, rnd(-420, -60) * k, rnd(0.35, 0.7), i % 4 ? cor : '#ffffff', rnd(3, 6) * k, 1200 * k);
    }
    texto(e.x + e.w / 2, e.y - 4, '+' + pts + (mult > 1 ? '  x' + mult : ''), mult > 1 ? '#e0a84f' : '#eaf1f5');
    tremer(5);
    if (mult >= 3) dizer('COMBO x' + mult + '!', 1.2);
    E.tut.bug = true;
  }

  function coletar(e, k){
    e.vivo = false;
    avisar3d(e.tipo === 'trofeu' ? 'trofeu' : 'coleta');
    switch (e.tipo) {
      case 'bit':
        E.bits++; E.pontos += 10;
        E.seqBits = (E.t - E.seqBitsT < 0.6) ? E.seqBits + 1 : 0;
        E.seqBitsT = E.t;
        som.tocar('bit', E.seqBits);
        faiscas(e.x, e.y, 6, '#35d0e5', k);
        break;
      case 'skill':
        E.skills.push(e.nome); E.pontos += 100;
        som.tocar('skill');
        faiscas(e.x, e.y, 22, '#e0a84f', k);
        anel(e.x, e.y, 60 * k, '#e0a84f');
        texto(e.x, e.y - 14, '+ ' + e.nome, '#ffd890', true);
        aviso('Skill nova: ' + e.nome + ' (' + E.skills.length + '/' + E.skillsTotal + ')', 1900);
        var hs = alvoHUD('skill'), sy0 = e.y - window.scrollY;
        voar(S.chip(e.nome, M.esc), [[0, e.x, sy0, 1], [0.35, e.x, sy0 - 60, 1.7], [0.95, hs.x, hs.y, 0.5]], 2);
        break;
      case 'trofeu':
        E.trofeus.push(e.nome); E.pontos += 250;
        som.tocar('trofeu');
        faiscas(e.x, e.y, 34, '#e0a84f', k);
        anel(e.x, e.y, 90 * k, '#e0a84f', 0.6, 4);
        banner('TROFÉU ' + E.trofeus.length + '/' + E.trofeusTotal, e.nome, 2.6, '#e0a84f');
        var ht = alvoHUD('trofeu'), ty0 = e.y - window.scrollY;
        voar(S.obter('trofeu', 3), [[0, e.x, ty0, 1], [0.45, W / 2, H * 0.48, 4.5], [1.1, W / 2, H * 0.48, 4.5], [1.6, ht.x, ht.y, 0.6]], 3);
        break;
      case 'cafe':
        if (p.vidas < 3) { p.vidas++; texto(e.x, e.y - 10, '+1 ♥  café', '#ff8fae', true); }
        else { E.pontos += 50; texto(e.x, e.y - 10, '+50  café', '#eaf1f5', true); }
        som.tocar('cafe');
        faiscas(e.x, e.y, 10, '#f4efe6', k);
        break;
    }
  }

  /* ==========================================================
     FASES, TUTORIAL E FALAS
     ========================================================== */
  function acompanharFase(){
    var f = M.faseDe(p.y + p.h - 2);
    E.faseAtual = f;
    if (f <= E.faseMax) return;
    for (var i = E.faseMax + 1; i <= f; i++) M.fases[i].el.classList.add('fase-ativa');
    E.faseMax = f; E.checkpoint = f;
    banner('FASE ' + f, M.fases[f].nome.toUpperCase(), 2.3);
    som.tocar('fase');
    if (f === 2 && !E.tut.cabecadaAviso && !E.tut.cabecada) {
      E.tut.cabecadaAviso = true;
      setTimeout(function(){ dizer('pula por baixo de um cartão!', 3.2); }, 1600);
    }
    if (f === 1 && !E.tut.socoAviso) {
      E.tut.socoAviso = true;
      setTimeout(function(){ dizer(temToque ? 'no ar, ▼ = SOCO' : 'no ar, ↓ = SOCO', 3.2); }, 1300);
    }
  }

  function alvoHUD(tipo){
    var larg = W < 720 ? 176 : 216;
    return tipo === 'skill' ? { x: 50, y: 76 } : { x: 14 + larg - 40, y: 76 };
  }
  function voar(spr, quadros, giros){ E.voos.push({ spr: spr, q: quadros, giros: giros, t: 0 }); }

  function dizer(texto, dur){ E.dica = { texto: texto, ini: E.t, ate: E.t + dur }; }

  function tutorial(){
    var T = E.tut;
    if (!E.primeira || E.faseAtual > 0) return;
    if (!T.andou) {
      if (Math.abs(p.x - E.inicioX) > 60) { T.andou = true; E.dica = null; }
      else if (!E.dica) dizer(temToque ? '◀ ▶ pra andar' : '← → pra andar', 99);
      return;
    }
    if (!T.pulou2) {
      if (!E.dica) dizer(temToque ? '▲ pula, e no ar pula de novo' : 'espaço pula, e no ar pula de novo', 99);
      return;
    }
    if (E.dica && E.dica.ate > E.t + 50) E.dica = null;
    if (!T.bugAviso) {
      for (var i = 0; i < E.ents.length; i++) {
        var e = E.ents[i];
        if (e.tipo === 'bug' && e.vivo && !e.oculto && e.x !== undefined &&
            Math.abs(e.x - p.x) < 320 && Math.abs(e.y - p.y) < 160) {
          T.bugAviso = true; dizer('isso é um bug. pisa nele!', 2.6); break;
        }
      }
    }
  }

  var FALAS_MENU = ['bora jogar?', 'aperta ENTER', 'cuidado com os bugs'];
  if (temToque) FALAS_MENU = ['bora jogar?', 'toca em JOGAR', 'cuidado com os bugs'];

  function banner(titulo, sub, dur, cor){ E.banner = { titulo: titulo, sub: sub, t: 0, dur: dur, cor: cor || '#35d0e5' }; }

  function aviso(txt, ms){
    avisoEl.textContent = txt;
    avisoEl.classList.add('on');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(function(){ avisoEl.classList.remove('on'); }, ms || 2200);
  }

  function tremer(q){ if (!semMovimento) E.tremor = Math.max(E.tremor, q); }

  /* ==========================================================
     PARTÍCULAS E TEXTOS FLUTUANTES
     ========================================================== */
  function particula(x, y, vx, vy, vida, cor, tam, grav){
    if (E.parts.length > limite().partes) return;
    E.parts.push({ tipo: 'q', x: x, y: y, vx: vx, vy: vy, vida: vida, max: vida, cor: cor, tam: tam, grav: grav || 0 });
  }
  function anel(x, y, raio, cor, vida, larg){
    E.parts.push({ tipo: 'anel', x: x, y: y, raio: raio, vida: vida || 0.35, max: vida || 0.35, cor: cor, larg: larg || 3 });
  }
  function poeira(x, y, n, k){
    for (var i = 0; i < n; i++) particula(x + rnd(-8, 8) * k, y - 2, rnd(-170, 170) * k, rnd(-140, -20) * k, rnd(0.3, 0.55), '#7f95a6', rnd(3, 5) * k, 380 * k);
  }
  function faiscas(x, y, n, cor, k){
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = rnd(110, 330) * k;
      particula(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.35, 0.65), i % 3 ? cor : '#ffffff', rnd(2, 4) * k, 260 * k);
    }
  }
  function texto(x, y, txt, cor, grande){
    E.textos.push({ x: x, y: y, txt: txt, cor: cor, vida: 1.1, max: 1.1, grande: !!grande });
  }
  function confete(k){
    var cores = ['#35d0e5', '#e0a84f', '#ff4d7e', '#eaf1f5', '#9b5cff'];
    for (var i = 0; i < 140; i++) {
      particula(p.x + p.w / 2 + rnd(-40, 40), p.y, rnd(-520, 520) * k, rnd(-1100, -300) * k, rnd(1.4, 2.6), cores[i % cores.length], rnd(3, 7) * k, 900 * k);
    }
  }

  function atualizarParticulas(dt){
    for (var i = E.parts.length - 1; i >= 0; i--) {
      var q = E.parts[i];
      q.vida -= dt;
      if (q.vida <= 0) { E.parts.splice(i, 1); continue; }
      if (q.tipo === 'q') {
        q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        q.vx *= 1 - dt * 1.5;
      } else if (q.tipo === 'voxel') {
        q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        q.z += q.vz * dt; q.giro += q.vg * dt;
        if (q.z > 0.93) E.parts.splice(i, 1);
      } else if (q.tipo === 'moeda') {
        q.vy += q.grav * dt; q.y += q.vy * dt;
      }
    }
    for (var v = E.voos.length - 1; v >= 0; v--) {
      var vo = E.voos[v];
      vo.t += dt;
      if (vo.t > vo.q[vo.q.length - 1][0]) E.voos.splice(v, 1);
    }
    for (var j = E.textos.length - 1; j >= 0; j--) {
      var t = E.textos[j];
      t.vida -= dt; t.y -= 46 * dt;
      if (t.vida <= 0) E.textos.splice(j, 1);
    }
  }

  /* letras do título afundam embaixo dos pés */
  var letrasPisadas = new Set();
  function atualizarLetras(){
    var novas = null, pl = p.chao;
    if (pl && pl.letras && !p.oculto) {
      var a = p.x - 2, b = p.x + p.w + 2;
      novas = new Set();
      for (var i = 0; i < pl.letras.length; i++) {
        var L = pl.letras[i];
        if (L.x1 > a && L.x0 < b) novas.add(L.el);
      }
    }
    letrasPisadas.forEach(function(el){ if (!novas || !novas.has(el)) el.classList.remove('pisada'); });
    if (novas) novas.forEach(function(el){ if (!letrasPisadas.has(el)) el.classList.add('pisada'); });
    letrasPisadas = novas || new Set();
  }

  /* ==========================================================
     CÂMERA = ROLAGEM DA PÁGINA
     ========================================================== */
  function camera(dt){
    var maxS = Math.max(0, document.documentElement.scrollHeight - H);
    if (performance.now() < E.manualAte) { E.cam = window.scrollY; return; }
    var alvo = p.y + p.h * 0.5 - H * 0.42;
    if (p.vy > 0 && !p.chao) alvo += Math.min(p.vy * 0.25, H * 0.22);
    alvo = clamp(alvo, 0, maxS);
    E.cam += (alvo - E.cam) * (1 - Math.exp(-dt * 7));
    if (Math.abs(E.cam - window.scrollY) > 0.5) window.scrollTo(0, E.cam);
  }

  function aplicarTremor(dt){
    if (E.tremor > 0) E.tremor = Math.max(0, E.tremor - dt * 45);
    if (E.tremor > 0.4) { E.tx = (Math.random() - 0.5) * E.tremor; E.ty = (Math.random() - 0.5) * E.tremor; }
    else { E.tx = E.ty = 0; }
    if (PV.efeitos3d) PV.efeitos3d.tremor(E.tx, E.ty);
  }

  /* ==========================================================
     LAÇO PRINCIPAL (passo fixo de 1/120 s para a física)
     ========================================================== */
  var PASSO = 1 / 120, acum = 0, antes = performance.now();

  function passo(dt){
    var k = M.esc / 3;
    E.t += dt;
    if (E.modo === 'jogando' && !p.oculto) {
      if (E.cronoOn) E.crono += dt;
      controlar(dt, k);
    }
    if (E.modo === 'morto') {
      E.mortoT -= dt;
      if (E.mortoT <= 0) renascer();
    } else fisica(dt, k);
    if (E.modo === 'jogando') { colisoes(k); acompanharFase(); tutorial(); }
    atualizarEntidades(dt, k);
  }

  function laco(agora){
    requestAnimationFrame(laco);
    var dt = Math.min((agora - antes) / 1000, 0.1);
    antes = agora;
    if (document.hidden) return;

    if (E.modo !== 'pausado') {
      acum += dt;
      var n = 0;
      while (acum >= PASSO && n < 12) { passo(PASSO); acum -= PASSO; n++; }
      if (n === 12) acum = 0;
      atualizarParticulas(dt);
      atualizarLetras();
      if (PV.efeitos3d) {
        if (p.chao && p.chao.el && !p.oculto && E.modo !== 'fora') {
          PV.efeitos3d.peso(p.chao.el, (p.x + p.w / 2 - p.chao.x) / p.chao.w, p.chao.w);
        }
        if (emJogo() || E.modo === 'fim') PV.efeitos3d.focar(p.x + p.w / 2, p.y + p.h / 2 - window.scrollY);
        else PV.efeitos3d.focar(null);
      }
      if (E.banner) { E.banner.t += dt; if (E.banner.t > E.banner.dur) E.banner = null; }
      if (E.dica && E.t > E.dica.ate) E.dica = null;
      if (E.flash > 0) E.flash = Math.max(0, E.flash - dt * 2);
      for (var i = 0; i < E.bandeiras.length; i++) {
        var alvo = i <= E.faseMax && E.partida ? 1 : 0;
        E.bandeiras[i] += (alvo - E.bandeiras[i]) * Math.min(1, dt * 3);
      }
      if (E.modo === 'menu') {
        E.menuT -= dt;
        if (E.menuT <= 0) {
          E.menuT = 3.8; p.virado = !p.virado;
          if (window.scrollY < H * 0.6) dizer(FALAS_MENU[E.menuI++ % FALAS_MENU.length], 2.6);
        }
      }
      aplicarTremor(dt);
    }
    if (emJogo() || E.modo === 'fim') camera(dt);
    desenhar();
  }

  /* ==========================================================
     DESENHO
     ========================================================== */
  function desenhar(){
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    var sy = window.scrollY;
    var jogo = E.modo !== 'menu' && E.modo !== 'fora';
    var topo = sy - 160, base = sy + H + 160;

    ctx.save();
    ctx.translate(E.tx, E.ty - sy);
    // o chão e as plataformas são os próprios elementos da página; aqui só os objetos do jogo
    if (jogo) {
      desenharBandeiras(topo, base);
      desenharEntidades(topo, base);
    }
    desenharParticulas(topo, base);
    desenharJogador(topo, base);
    desenharTextos();
    desenharBalao();
    ctx.restore();

    if (jogo) desenharHUD();
    desenharVoos();
    if (E.flash > 0) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = 'rgba(255,77,126,' + (E.flash * 0.35).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (E.modo === 'morto') desenharPanico();
  }

  function desenharBandeiras(topo, base){
    var k = M.esc / 3;
    for (var i = 1; i < M.fases.length; i++) {
      var pl = M.fases[i].pouso;
      if (!pl || pl.y < topo || pl.y > base) continue;
      var hP = 60 * k, lp = Math.max(2, Math.round(3 * k));
      // sem margem à esquerda (tela estreita), a bandeira vai para o fim do título
      var fx = pl.x < 56 * k ? pl.x + pl.w + 12 * k : pl.x - 20 * k;
      ctx.fillStyle = '#6a8294';
      ctx.fillRect(fx, pl.y - hP, lp, hP);
      ctx.fillRect(fx - 3 * k, pl.y - 3 * k, lp + 6 * k, 3 * k);
      var sub = E.bandeiras[i] || 0;
      var fy = pl.y - 16 * k - (hP - 20 * k) * sub;
      for (var c = 0; c < 6; c++) {
        var off = Math.sin(E.t * 7 + c * 0.9) * 2 * k * sub;
        ctx.fillStyle = sub > 0.05 ? (c % 2 ? '#35d0e5' : '#7fe6f3') : '#2a4562';
        ctx.fillRect(fx + lp + c * 4 * k, fy + off, 4 * k + 0.5, 13 * k);
      }
    }
  }

  function desenharEntidades(topo, base){
    var esc = M.esc, k = esc / 3, t = E.t;
    for (var i = 0; i < E.ents.length; i++) {
      var e = E.ents[i];
      if (!e.vivo || e.oculto || e.x === undefined) continue;
      if (e.y < topo || e.y > base) continue;
      var spr, bob;
      switch (e.tipo) {
        case 'bit':
          spr = S.obter(e.g ? 'bit1' : 'bit0', esc);
          bob = Math.sin(t * 4 + e.x * 0.05) * 3 * k;
          var gira = 0.35 + 0.65 * Math.abs(Math.cos(t * 2.6 + e.x * 0.02));
          ctx.save();
          ctx.translate(e.x, e.y + bob);
          ctx.scale(gira, 1);
          ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
          ctx.restore();
          break;
        case 'skill':
          spr = S.chip(e.nome, esc);
          bob = Math.sin(t * 2.6 + e.x * 0.03) * 4 * k;
          ctx.drawImage(spr, Math.round(e.x - spr.width / 2), Math.round(e.y + bob - spr.height / 2));
          break;
        case 'trofeu':
          spr = S.obter('trofeu', esc);
          bob = Math.sin(t * 2.2) * 4 * k;
          ctx.save();
          ctx.translate(e.x, e.y + bob);
          ctx.rotate(t * 0.6);
          ctx.fillStyle = 'rgba(224,168,79,.16)';
          for (var r = 0; r < 6; r++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-3 * k, 0, 6 * k, 46 * k); }
          ctx.restore();
          ctx.drawImage(spr, Math.round(e.x - spr.width / 2), Math.round(e.y + bob - spr.height / 2));
          break;
        case 'cafe':
          spr = S.obter('cafe', esc);
          bob = Math.sin(t * 3 + 1) * 2 * k;
          ctx.drawImage(spr, Math.round(e.x - spr.width / 2), Math.round(e.y + bob - spr.height / 2));
          ctx.fillStyle = 'rgba(234,241,245,.55)';
          for (var v = 0; v < 2; v++) {
            var f = (t * 0.9 + v * 0.5) % 1;
            ctx.fillRect(e.x - 4 * esc + v * 3 * esc + Math.sin(f * 6) * esc, e.y + bob - spr.height / 2 - f * 8 * esc, esc, esc);
          }
          break;
        case 'bug':
          spr = S.obter('bug' + (Math.floor(t * 9 + i) % 2), esc);
          var dz = (e.plat && e.plat.el && PV.efeitos3d) ? PV.efeitos3d.deslocamento(e.plat.el, e.x + e.w / 2, e.plat) : 0;
          ctx.save();
          ctx.translate(Math.round(e.x + e.w / 2), Math.round(e.y + e.h / 2 + dz));
          if (e.dir < 0) ctx.scale(-1, 1);
          ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
          ctx.restore();
          break;
        case 'glitch':
          desenharGlitch(e, esc, k);
          break;
        case 'spike':
          // Espinhos com efeito pulsante neon
          ctx.save();
          ctx.translate(e.x + e.w / 2, e.y + e.h);
          var pulse = 1 + Math.sin(t * 6) * 0.1;
          ctx.scale(pulse, pulse);
          ctx.fillStyle = '#ff0055'; // Magenta Neon
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(-e.w / 2, 0);
          ctx.lineTo(0, -e.h * 1.2);
          ctx.lineTo(e.w / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
      }
    }
  }

  function desenharGlitch(e, esc, k){
    var spr = S.obter('glitch', esc), sw = spr.width, sh = spr.height;
    var ox = Math.round(e.x - esc), oy = Math.round(e.y - esc);
    var fatias = 6, hf = sh / fatias;
    if (Math.random() < 0.08) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(spr, ox - 4 * k, oy);
      ctx.globalAlpha = 1;
    }
    for (var f = 0; f < fatias; f++) {
      var d = Math.random() < 0.1 ? rnd(-7, 7) * k : 0;
      ctx.drawImage(spr, 0, f * hf, sw, hf, ox + d, oy + f * hf, sw, hf);
    }
  }

  function escolherPose(k){
    if (p.invuln > C.invuln - 0.32 && E.modo !== 'menu') return ['dano', 0];
    if (p.socando) return ['soco', 0];
    if (!p.chao) return [p.vy < 0 ? 'pulo' : 'cair', 0];
    if (Math.abs(p.vx) > 30 * k) return ['correr', Math.floor(p.animT * 12) % 4];
    var q = (p.animT % 4.2 > 4.05) ? 2 : (Math.floor(p.animT * 1.5) % 2);
    return ['parado', q];
  }

  function desenharJogador(topo, base){
    // Correção: garante que o personagem seja desenhado mesmo se estiver ligeiramente fora da tela inicial
    if (p.oculto) return;
    
    var esc = M.esc, k = esc / 3;
    var pose = escolherPose(k);
    var afunda = (p.chao && p.chao.afunda) || 0;
    if (p.chao && p.chao.el && PV.efeitos3d) afunda += PV.efeitos3d.deslocamento(p.chao.el, p.x + p.w / 2, p.chao);
    var cx = Math.round(p.x + p.w / 2), pes = Math.round(p.y + p.h + afunda);

    // Efeito de Glow Neon Dinâmico
    ctx.shadowColor = '#35d0e5'; // Ciano Neon
    ctx.shadowBlur = 15;
    
    var halo = S.halo(Math.round(54 * k));
    ctx.drawImage(halo, cx - halo.width / 2, pes - p.h * 0.55 - halo.height / 2);
    
    ctx.shadowBlur = 0; // Reseta shadow para elementos não-neon
    
    if (p.chao) {
      ctx.fillStyle = 'rgba(53, 208, 229, 0.3)'; // Sombra colorida elegante
      ctx.fillRect(cx - 8 * esc / 2, pes - 1, 8 * esc, 2);
    }

    // Rastro aprimorado com gradiente de cor
    var rapido = p.socando === 2 || p.vy > 950 * k;
    if (rapido || Math.abs(p.vx) > 100 * k) p.rastro.push({ x: cx, y: pes, n: pose[0], q: pose[1], v: p.virado });
    if (p.rastro.length > 6) p.rastro.shift();
    
    for (var i = 0; i < p.rastro.length; i++) {
      var r = p.rastro[i];
      ctx.globalAlpha = 0.1 + (i / p.rastro.length) * 0.2;
      var g = S.pedro(r.n, r.q, esc, 'fantasma');
      ctx.save(); 
      ctx.translate(r.x, r.y - (p.rastro.length - i) * 2); 
      if (r.v) ctx.scale(-1, 1);
      ctx.drawImage(g, -9 * esc, -23 * esc);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (p.invuln > 0 && E.modo !== 'menu' && Math.floor(E.t * 18) % 2 === 0) return;

    var spr = S.pedro(pose[0], pose[1], esc, E.flash > 0.3 ? 'branco' : 'normal');
    ctx.save();
    ctx.translate(cx, pes);
    ctx.scale(p.faceX * p.sx, p.sy);
    if (p.giro > 0) {
      ctx.translate(0, -11 * esc);
      ctx.rotate((1 - p.giro) * Math.PI * 2);
      ctx.translate(0, 11 * esc);
    }
    ctx.drawImage(spr, -9 * esc, -23 * esc);
    ctx.restore();
  }

  function desenharParticulas(topo, base){
    var meioX = W / 2, meioY = topo + 160 + H / 2;
    for (var i = 0; i < E.parts.length; i++) {
      var q = E.parts[i];
      var a = q.vida / q.max;
      if (q.tipo === 'voxel') {
        // projeção: quanto mais perto da câmera (z -> 1), maior e mais longe do centro
        var pr = 1 / (1 - q.z), vx = meioX + (q.x - meioX) * pr, vy = meioY + (q.y - meioY) * pr;
        var lado = q.tam * pr, larg = lado * (0.3 + 0.7 * Math.abs(Math.cos(q.giro)));
        ctx.globalAlpha = Math.max(0, Math.min(1, a * 2, (0.93 - q.z) * 5));
        ctx.fillStyle = q.cor;
        ctx.fillRect(vx - larg / 2, vy - lado / 2, larg, lado);
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        ctx.fillRect(vx + larg / 2, vy - lado / 2 + lado * 0.18, lado * 0.22, lado);
        continue;
      }
      if (q.y < topo || q.y > base) continue;
      if (q.tipo === 'moeda') {
        var m = S.obter('bit1', M.esc), gm = Math.cos(E.t * 30);
        ctx.globalAlpha = Math.min(1, a * 3);
        ctx.save(); ctx.translate(q.x, q.y); ctx.scale(gm, 1); ctx.drawImage(m, -m.width / 2, -m.height / 2); ctx.restore();
        continue;
      }
      if (q.tipo === 'chao') {
        // anel deitado no chão, visto em perspectiva
        var rr = Math.max(1, q.raio * (1 - a * a));
        ctx.globalAlpha = a;
        ctx.strokeStyle = q.cor; ctx.lineWidth = 2 + 4 * a;
        ctx.beginPath(); ctx.ellipse(q.x, q.y, rr, rr * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
        continue;
      }
      if (q.tipo === 'q') {
        ctx.globalAlpha = Math.min(1, a * 1.6);
        ctx.fillStyle = q.cor;
        ctx.fillRect(q.x - q.tam / 2, q.y - q.tam / 2, q.tam, q.tam);
      } else {
        ctx.globalAlpha = a;
        ctx.strokeStyle = q.cor;
        ctx.lineWidth = q.larg * a + 1;
        ctx.beginPath();
        ctx.arc(q.x, q.y, Math.max(1, q.raio * (1 - a * a)), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function desenharTextos(){
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < E.textos.length; i++) {
      var t = E.textos[i];
      ctx.globalAlpha = Math.min(1, t.vida / t.max * 2);
      ctx.font = (t.grande ? 16 : 13) + 'px ' + FONTE;
      ctx.fillStyle = '#060b14';
      ctx.fillText(t.txt, t.x + 2, t.y + 2);
      ctx.fillStyle = t.cor;
      ctx.fillText(t.txt, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  function desenharBalao(){
    var d = E.dica;
    if (!d || p.oculto) return;
    var k = M.esc / 3;
    ctx.font = (M.esc === 3 ? 13 : 12) + 'px ' + FONTE;
    var tw = ctx.measureText(d.texto).width;
    var bw = Math.round(tw + 22), bh = 28;
    var cx = Math.round(p.x + p.w / 2), by = Math.round(p.y - 14 * k - bh);
    var bx = Math.round(clamp(cx - bw / 2, 8, M.W - bw - 8));
    var a = clamp(Math.min((d.ate - E.t) * 4, (E.t - d.ini) * 7), 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(6,11,20,.94)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#35d0e5';
    ctx.fillRect(bx, by, bw, 2); ctx.fillRect(bx, by + bh - 2, bw, 2);
    ctx.fillRect(bx, by, 2, bh); ctx.fillRect(bx + bw - 2, by, 2, bh);
    var tx = clamp(cx, bx + 8, bx + bw - 8);
    ctx.fillRect(tx - 3, by + bh, 6, 3); ctx.fillRect(tx - 1, by + bh + 3, 2, 3);
    ctx.fillStyle = '#eaf1f5';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.texto, bx + bw / 2, by + bh / 2 + 1);
    ctx.globalAlpha = 1;
  }

  function desenharVoos(){
    if (!E.voos.length) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    E.voos.forEach(function(v){
      var q = v.q, j = 0;
      while (j < q.length - 2 && v.t > q[j + 1][0]) j++;
      var a = q[j], b = q[j + 1], f = clamp((v.t - a[0]) / (b[0] - a[0]), 0, 1);
      var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      var x = a[1] + (b[1] - a[1]) * e, y = a[2] + (b[2] - a[2]) * e, s = a[3] + (b[3] - a[3]) * e;
      var gira = Math.cos(v.t * v.giros * Math.PI * 2);
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(gira * s, s);
      ctx.drawImage(v.spr, -v.spr.width / 2, -v.spr.height / 2);
      ctx.restore();
    });
  }

  function textoPixel(txt, x, y, cor, sombra){
    ctx.fillStyle = sombra || '#060b14';
    ctx.fillText(txt, x + 2, y + 2);
    ctx.fillStyle = cor;
    ctx.fillText(txt, x, y);
  }

  function desenharHUD(){
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var cel = W < 720;
    var fs = cel ? 11 : 12;
    ctx.textBaseline = 'top';
    ctx.font = fs + 'px ' + FONTE;

    // painel de status
    var x = 14, y = 14, larg = cel ? 176 : 216, alt = 80;
    ctx.fillStyle = 'rgba(6,11,20,.8)';
    ctx.fillRect(x, y, larg, alt);
    ctx.fillStyle = '#35d0e5';
    ctx.fillRect(x, y, larg, 2);
    var hz = S.obter('coracao', 2), hv = S.obter('coracaoVazio', 2);
    for (var i = 0; i < 3; i++) ctx.drawImage(i < p.vidas ? hz : hv, x + 10 + i * 21, y + 11);
    ctx.textAlign = 'right';
    textoPixel(tempo(E.crono), x + larg - 10, y + 13, '#eaf1f5');
    textoPixel(milhar(E.pontos), x + larg - 10, y + 35, '#eaf1f5');
    ctx.textAlign = 'left';
    textoPixel('BITS ' + E.bits + '/' + E.bitsTotal, x + 10, y + 35, '#35d0e5');
    textoPixel('SKILLS ' + E.skills.length + '/' + E.skillsTotal, x + 10, y + 56, '#e0a84f');
    ctx.textAlign = 'right';
    textoPixel('🏆 ' + E.trofeus.length + '/' + E.trofeusTotal, x + larg - 10, y + 56, '#e0a84f');

    // fase atual e profundidade (canto direito, abaixo dos botões)
    var f = M.fases[E.faseAtual];
    ctx.textAlign = 'right';
    var dx = W - 18;
    textoPixel('FASE ' + E.faseAtual + ': ' + (f ? f.nome.toUpperCase() : ''), dx, 64, '#eaf1f5');
    textoPixel('PROF. ' + milhar(p.y + p.h) + ' PX', dx, 82, '#6a8294');

    // trilho de profundidade
    var r0 = 112, r1 = H - (temToque ? 130 : 40), rx = W - 20;
    if (r1 - r0 > 120) {
      ctx.fillStyle = 'rgba(42,69,98,.8)';
      ctx.fillRect(rx, r0, 2, r1 - r0);
      var total = Math.max(1, M.H);
      for (var j = 0; j < M.fases.length; j++) {
        var ty = r0 + (M.fases[j].top / total) * (r1 - r0);
        ctx.fillStyle = j <= E.faseMax ? '#35d0e5' : '#2a4562';
        ctx.fillRect(rx - 4, Math.round(ty), 10, 2);
        if (!cel) {
          ctx.font = '10px ' + FONTE;
          ctx.fillStyle = j <= E.faseMax ? '#35d0e5' : '#3d5874';
          ctx.fillText('' + j, rx - 8, Math.round(ty) - 4);
        }
      }
      var py = r0 + ((p.y + p.h) / total) * (r1 - r0);
      ctx.fillStyle = '#e0a84f';
      ctx.fillRect(rx - 5, Math.round(py) - 5, 12, 10);
      ctx.fillStyle = '#060b14';
      ctx.fillRect(rx - 2, Math.round(py) - 2, 6, 4);
    }

    // skills coletadas (rodapé, só em tela grande)
    if (W >= 1000 && !temToque) {
      ctx.font = '11px ' + FONTE;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var cx = 14, cy = H - 30;
      for (var s = 0; s < E.listaSkills.length; s++) {
        var nome = E.listaSkills[s], tem = E.skills.indexOf(nome) >= 0;
        var w = ctx.measureText(nome).width + 14;
        ctx.fillStyle = tem ? 'rgba(224,168,79,.16)' : 'rgba(6,11,20,.7)';
        ctx.fillRect(cx, cy - 11, w, 22);
        ctx.fillStyle = tem ? '#e0a84f' : '#2a4562';
        ctx.fillRect(cx, cy - 11, w, 1); ctx.fillRect(cx, cy + 10, w, 1);
        ctx.fillRect(cx, cy - 11, 1, 22); ctx.fillRect(cx + w - 1, cy - 11, 1, 22);
        ctx.fillStyle = tem ? '#ffd890' : '#3d5874';
        ctx.fillText(nome, cx + 7, cy + 1);
        cx += w + 6;
      }
    }

    // faixa de anúncio
    if (E.banner) {
      var b = E.banner, t = b.t;
      var a = t < 0.25 ? t / 0.25 : (t > b.dur - 0.45 ? Math.max(0, (b.dur - t) / 0.45) : 1);
      var by = (cel ? 110 : 84) - (1 - a) * 18;
      var vira = t < 0.4 ? Math.max(0.04, Math.sin((t / 0.4) * Math.PI / 2)) : 1;
      ctx.save();
      ctx.translate(W / 2, by + 28); ctx.scale(1, vira); ctx.translate(-W / 2, -(by + 28));
      ctx.globalAlpha = a;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = (cel ? 22 : 34) + 'px ' + FONTE;
      var tw = ctx.measureText(b.titulo).width;
      ctx.fillStyle = 'rgba(6,11,20,.85)';
      ctx.fillRect(W / 2 - tw / 2 - 22, by - 12, tw + 44, (cel ? 62 : 80));
      ctx.fillStyle = b.cor;
      ctx.fillRect(W / 2 - tw / 2 - 22, by - 12, tw + 44, 2);
      textoPixel(b.titulo, W / 2, by, '#eaf1f5', b.cor);
      ctx.font = (cel ? 11 : 13) + 'px ' + FONTE;
      ctx.fillStyle = b.cor;
      ctx.fillText(b.sub, W / 2, by + (cel ? 30 : 44));
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  function desenharPanico(){
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var a = clamp((1.9 - E.mortoT) * 2, 0, 0.55);
    ctx.fillStyle = 'rgba(6,11,20,' + a.toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    if (semMovimento) return;
    for (var i = 0; i < 7; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,77,126,.25)' : 'rgba(53,208,229,.18)';
      ctx.fillRect(0, Math.random() * H, W, rnd(1, 5));
    }
  }

  /* ==========================================================
     ESTADOS: jogar, pausar, sair, fim
     ========================================================== */
  function novaPartida(){
    M.fases.forEach(function(f){ f.el.classList.remove('fase-ativa'); });
    E.ents = M.criarEntidades();
    M.posicionar(E.ents);
    prepararEnts();
    E.bitsTotal = 0; E.skillsTotal = 0; E.trofeusTotal = 0; E.bugsTotal = 0; E.listaSkills = [];
    E.ents.forEach(function(e){
      if (e.tipo === 'bit' && !e.oculto) E.bitsTotal++;
      if (e.tipo === 'skill') { E.skillsTotal++; E.listaSkills.push(e.nome); }
      if (e.tipo === 'trofeu') E.trofeusTotal++;
      if (e.tipo === 'bug' || e.tipo === 'glitch') E.bugsTotal++;
    });
    E.pontos = 0; E.bits = 0; E.skills = []; E.trofeus = []; E.bugs = 0; E.mortes = 0;
    E.combo = 0; E.crono = 0; E.cronoOn = false; E.terminou = false;
    E.faseMax = 0; E.faseAtual = 0; E.checkpoint = 0;
    E.bandeiras = M.fases.map(function(){ return 0; });
    E.banner = null; E.dica = null; E.parts = []; E.textos = []; E.voos = []; E.batidos = new Set();
    E.tut = E.primeira ? {} : { andou: true, pulou: true, pulou2: true, bugAviso: true, piso: true, socoAviso: true, cabecadaAviso: true };
    p.vidas = 3; p.invuln = 0; p.socando = 0; p.giro = 0; p.oculto = false; p.atordoado = 0; p.rastro = [];
    colocarNoPouso(0);
    E.inicioX = p.x;
    E.partida = true;
  }

  function entrarJogo(){
    document.documentElement.classList.add('jogo');
    document.body.classList.add('modo-jogo');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    fecharPainel();
    E.modo = 'jogando';
    E.cam = window.scrollY; E.manualAte = 0;
    E.dica = null;
    limparInput();
    atualizarRotulos();
    if (!E.avisouControles) {
      E.avisouControles = true;
      aviso(temToque ? '◀ ▶ anda, ▲ pula, ▼ desce ou soca' : '← → anda, espaço pula, ↓ desce ou soca, P pausa', 4500);
    }
  }

  function jogar(){
    som.ativar();
    if (!E.partida || E.terminou) novaPartida();
    entrarJogo();
  }

  function pausar(){
    if (!emJogo()) return;
    E.modoAntes = E.modo; E.modo = 'pausado';
    limparInput();
    abrirPainel(htmlPausa());
  }

  function continuar(){
    fecharPainel();
    E.modo = E.modoAntes || 'jogando';
    antes = performance.now();
  }

  function sair(){
    fecharPainel();
    E.modo = 'fora';
    document.documentElement.classList.remove('jogo');
    document.body.classList.remove('modo-jogo');
    limparInput();
    E.dica = null;
    atualizarRotulos();
  }

  function reiniciar(){
    fecharPainel();
    E.primeira = false;
    novaPartida();
    entrarJogo();
  }

  function terminar(){
    E.modo = 'fim'; E.terminou = true; E.primeira = false;
    limparInput();
    p.vx = 0;
    som.tocar('fim');
    confete(M.esc / 3);
    tremer(8);
    banner('FIM DE JOGO', 'você chegou ao contato', 3.4, '#e0a84f');
    var r = resultado();
    setTimeout(function(){
      if (E.modo !== 'fim') return;
      abrirPainel(htmlFim(r));
    }, 1300);
  }

  function resultado(){
    var t = E.crono;
    var bonus = Math.max(0, Math.round((420 - t) * 5));
    var total = Math.max(0, E.pontos + bonus - E.mortes * 150);
    var todasSkills = E.skills.length === E.skillsTotal, todosTrofeus = E.trofeus.length === E.trofeusTotal;
    var rank = (todasSkills && todosTrofeus && E.mortes === 0) ? 'S'
             : (E.skills.length >= E.skillsTotal - 2 && E.trofeus.length >= 2) ? 'A'
             : (E.skills.length >= E.skillsTotal / 2) ? 'B' : 'C';
    var frases = {
      S: ['Perfeito', 'Pegou todas as skills e troféus sem perder nenhuma vida.'],
      A: ['Muito bom', 'Faltou pouca coisa para pegar tudo.'],
      B: ['Bom', 'Pegou pelo menos metade das skills.'],
      C: ['Dá pra melhorar', 'As skills ficam em cima dos cartões, vale procurar com calma.']
    };
    var recorde = 0, novo = false;
    try {
      recorde = +localStorage.getItem('descida.recorde') || 0;
      if (total > recorde) { localStorage.setItem('descida.recorde', String(total)); novo = recorde > 0; recorde = total; }
    } catch(e) { recorde = total; }
    return { tempo: t, bonus: bonus, total: total, rank: rank, frase: frases[rank], recorde: recorde, novo: novo };
  }

  function htmlControles(){
    return temToque
      ? '<ul class="controles"><li><kbd>◀</kbd><kbd>▶</kbd> anda</li><li><kbd>▲</kbd> pula, 2× no ar</li><li><kbd>▼</kbd> desce, no ar dá soco</li></ul>'
      : '<ul class="controles"><li><kbd>←</kbd><kbd>→</kbd> anda</li><li><kbd>espaço</kbd> pula, 2× no ar</li><li><kbd>↓</kbd> desce, no ar dá soco</li><li><kbd>P</kbd> pausa</li><li><kbd>M</kbd> som</li></ul>';
  }

  function htmlPausa(){
    var f = M.fases[E.faseAtual];
    return '<p class="kicker">Pausa</p>' +
      '<h2 id="painelTitulo">Jogo pausado</h2>' +
      '<p class="sub">Você está na fase ' + E.faseAtual + (f ? ' (' + f.nome + ')' : '') + ', com ' + milhar(E.pontos) + ' pontos em ' + tempo(E.crono) + '.</p>' +
      htmlControles() +
      '<div class="qualidade" role="group" aria-label="Qualidade gráfica"><span>Qualidade</span>' +
        '<button type="button" data-q="auto">Automática</button>' +
        '<button type="button" data-q="alto">Alta</button>' +
        '<button type="button" data-q="medio">Média</button>' +
        '<button type="button" data-q="baixo">Baixa</button>' +
        '<em class="qualidade-agora"></em>' +
      '</div>' +
      '<div class="painel-botoes">' +
        '<button type="button" class="botao-pixel" data-p="continuar">▶ Continuar</button>' +
        '<button type="button" class="botao-sec" data-p="reiniciar">↻ Recomeçar</button>' +
        '<button type="button" class="botao-sec" data-p="sair">Sair e ler</button>' +
      '</div>';
  }

  function htmlFim(r){
    var chips = E.listaSkills.map(function(n){
      return '<span class="' + (E.skills.indexOf(n) >= 0 ? 'ok' : '') + '">' + n + '</span>';
    }).join('');
    function item(rotulo, valor){ return '<div><dt>' + rotulo + '</dt><dd>' + valor + '</dd></div>'; }
    return '<p class="kicker">Fim de jogo</p>' +
      '<h2 id="painelTitulo">Você chegou ao fim</h2>' +
      '<div class="rank"><span class="rank-letra">' + r.rank + '</span><p><b>' + r.frase[0] + '</b>' + r.frase[1] + '</p></div>' +
      '<dl class="placar">' +
        item('Tempo', tempo(r.tempo)) +
        item('Pontos', milhar(r.total)) +
        item('Bits', E.bits + '/' + E.bitsTotal) +
        item('Bugs esmagados', E.bugs + '/' + E.bugsTotal) +
        item('Skills', E.skills.length + '/' + E.skillsTotal) +
        item('Troféus', E.trofeus.length + '/' + E.trofeusTotal) +
        item('Mortes', E.mortes) +
        item(r.novo ? 'Novo recorde!' : 'Recorde', milhar(r.recorde)) +
      '</dl>' +
      '<div class="chips">' + chips + '</div>' +
      '<p class="sub">Obrigado por jogar! O botão abaixo abre um e-mail para mim.</p>' +
      '<div class="painel-botoes">' +
        '<a class="botao-pixel" href="mailto:pedromathiasantiago@gmail.com">✉ Falar comigo</a>' +
        '<button type="button" class="botao-sec" data-p="reiniciar">↻ Jogar de novo</button>' +
        '<button type="button" class="botao-sec" data-p="sair">Ler o portfólio</button>' +
      '</div>';
  }

  var NOME_NIVEL = { alto: 'alta', medio: 'média', baixo: 'baixa' };
  function atualizarQualidade(){
    if (!Q) return;
    caixa.querySelectorAll('[data-q]').forEach(function(b){
      b.setAttribute('aria-pressed', b.dataset.q === Q.escolha ? 'true' : 'false');
    });
    var agora = caixa.querySelector('.qualidade-agora');
    if (agora) agora.textContent = Q.escolha === 'auto' ? 'agora: ' + NOME_NIVEL[Q.nivel] : '';
  }

  function abrirPainel(html){
    caixa.innerHTML = html;
    painel.hidden = false;
    atualizarQualidade();
    var b = caixa.querySelector('button, a');
    if (b) b.focus({ preventScroll: true });
  }
  function fecharPainel(){ painel.hidden = true; }

  caixa.addEventListener('click', function(e){
    var bq = e.target.closest('[data-q]');
    if (bq && Q) { Q.escolher(bq.dataset.q); atualizarQualidade(); som.tocar('clique'); return; }
    var b = e.target.closest('[data-p]');
    if (!b) return;
    som.tocar('clique');
    var acao = b.dataset.p;
    if (acao === 'continuar') continuar();
    else if (acao === 'reiniciar') reiniciar();
    else if (acao === 'sair') sair();
  });

  function alternarSom(){
    var s = som || (window.PV && window.PV.som);
    var mudo = s ? s.alternar() : false;
    if (btnSom) {
      btnSom.setAttribute('aria-pressed', mudo ? 'true' : 'false');
      btnSom.setAttribute('aria-label', mudo ? 'Som desligado' : 'Som ligado');
    }
  }
  var sInit = som || (window.PV && window.PV.som);
  if (btnSom && sInit) {
    btnSom.setAttribute('aria-pressed', sInit.mudo ? 'true' : 'false');
  }
  if (btnSom) btnSom.addEventListener('click', function(){ alternarSom(); btnSom.blur(); });
  if (btnPausa) btnPausa.addEventListener('click', function(){ pausar(); });

  function atualizarRotulos(){
    var txt = (E.partida && !E.terminou && E.modo === 'fora') ? '▶ Continuar' : '▶ Jogar';
    document.querySelectorAll('.rotulo-jogar').forEach(function(el){ el.textContent = txt; });
  }

  /* ==========================================================
     INÍCIO
     ========================================================== */
  M.preparar();
  ajustarTamanho();
  redimensionar();
  colocarNoPouso(0);
  window.addEventListener('resize', redimensionar);
  if (Q) Q.aoMudar(function(){ redimensionar(); if (E.modo === 'pausado' && !painel.hidden) atualizarQualidade(); });
  window.addEventListener('load', pedirMedida);
  if (window.ResizeObserver) new ResizeObserver(pedirMedida).observe(main);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function(){ S.limpar(); pedirMedida(); });
  }
  requestAnimationFrame(laco);

  PV.jogo = { jogar: jogar, pausar: pausar, sair: sair, reiniciar: reiniciar, estado: E, jogador: p };
})();
