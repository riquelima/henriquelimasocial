/* ==========================================================
   SPRITES · pixel art desenhada em código
   Cada sprite é um mapa de caracteres (1 caractere = 1 pixel)
   ou uma lista de retângulos. Tudo é pré-renderizado uma vez
   em canvas fora da tela e depois só copiado com drawImage.
   ========================================================== */
window.PV = window.PV || {};

PV.sprites = (function(){
  'use strict';

  var COR = {
    K:'#070b14',                              // contorno
    H:'#14151a', h:'#2c2f3d',                 // cabelo pretinho com brilho grafite
    S:'#f2c6a5', s:'#d49877',                 // pele
    E:'#141a2b', m:'#b0614d',                 // olho, boca
    P:'#162138', c:'#2c3b5e', L:'#35d0e5',    // polo escura elegante com logo ciano
    J:'#2a3652', j:'#1c2538',                 // calça escura / jeans
    T:'#eef3f7', t:'#9aa8b6',                 // tênis
    R:'#ff4d7e', r:'#ffb3c8', V:'#c2265a',    // bug
    b:'#8a2450', W:'#ffffff', a:'#ff8fae',
    Q:'#9b5cff', q:'#e1d0ff',                 // glitch
    G:'#35d0e5', g:'#c9f6fc',                 // bit
    Y:'#e0a84f', y:'#fff0c4', B:'#7a4f1a',    // troféu
    k:'#24364b', M:'#f4efe6', C:'#6b3b1f'     // coração vazio, caneca, café
  };

  /* ---------- o personagem: cabeça em mapa, corpo em retângulos ---------- */
  var CABECA = [
    '....KKKKKKK.....',
    '..KKHHHHHhhKK...',
    '.KHHHHHHHHHhhK..',
    '.KHHHHHHHHHHHHK.',
    'KHHHHHHHHHHHHHHK',
    'KHHHHHHSSSHHHHK.',
    '.KHHHSSSSSSSSK..',
    '.KHHsSSSSESSEK..',
    '.KHsSSSSSESSEK..',
    '..KsSSSSSSSSSK..',
    '..KKSSSSSmmSK...',
    '....KKSSSSKK....'
  ];
  // piscando: a linha de cima dos olhos vira pele
  var CABECA_PISCA = CABECA.map(function(l, i){ return i === 7 ? l.replace(/E/g, 'S') : l; });

  function tronco(add, y){
    y = y || 12;
    add(4, y, 8, 5, 'P');        // polo
    add(6, y, 4, 1, 'c');        // gola
    add(9, y + 2, 2, 1, 'L');    // logo
    add(4, y + 5, 8, 1, 'J');    // cintura
  }
  function braco(add, x, y, paraCima){
    if (paraCima) { add(x, y, 2, 2, 'P'); add(x, y - 2, 2, 2, 'S'); }
    else          { add(x, y, 2, 2, 'P'); add(x, y + 2, 2, 2, 'S'); }
  }
  function perna(add, x, y, h, cor, sx, sy, sapato){
    add(x, y, 2, h, cor);
    add(sx, sy, 3, 1, sapato);
  }

  /* devolve as partes do corpo de uma pose em coordenadas de pixel do sprite (16x22) */
  function pose(nome, q){
    var partes = [], cab = 0, dy = 0, pisca = false;
    function add(x, y, w, h, cor){ partes.push([x, y + dy, w, h, cor]); }

    switch (nome) {
      case 'correr':
        dy = (q % 2) ? -1 : 0; cab = dy;
        tronco(add);
        if (q === 0) {
          braco(add, 2, 14); braco(add, 12, 12);
          perna(add, 4, 18, 2, 'j', 2, 20, 't');
          perna(add, 10, 18, 3, 'J', 10, 21, 'T');
        } else if (q === 2) {
          braco(add, 2, 12); braco(add, 12, 14);
          perna(add, 10, 18, 3, 'j', 10, 21, 't');
          perna(add, 4, 18, 2, 'J', 2, 20, 'T');
        } else {
          braco(add, 2, 13); braco(add, 12, 13);
          perna(add, 6, 18, 3, 'j', 5, 21, 't');
          perna(add, 8, 18, 3, 'J', 8, 21, 'T');
        }
        break;

      case 'pulo':
        tronco(add);
        braco(add, 2, 13);
        braco(add, 12, 11, true);
        perna(add, 5, 18, 2, 'j', 4, 20, 't');
        perna(add, 9, 18, 2, 'J', 10, 20, 'T');
        break;

      case 'cair':
      case 'dano':
        tronco(add);
        add(1, 11, 2, 2, 'P'); add(0, 9, 2, 2, 'S');
        add(13, 11, 2, 2, 'P'); add(14, 9, 2, 2, 'S');
        perna(add, 4, 18, 3, 'j', 3, 21, 't');
        perna(add, 10, 18, 3, 'J', 10, 21, 'T');
        break;

      case 'soco':
        cab = 3;
        tronco(add, 14);
        add(2, 15, 2, 2, 'P'); add(2, 17, 2, 1, 'S');
        add(12, 15, 2, 2, 'P'); add(12, 17, 2, 1, 'S');
        perna(add, 4, 20, 1, 'j', 3, 21, 't');
        perna(add, 10, 20, 1, 'J', 10, 21, 'T');
        add(5, 19, 2, 1, 'j'); add(9, 19, 2, 1, 'J');
        break;

      default: // parado: q 0/1 respira, q 2 pisca
        cab = (q === 1) ? 1 : 0;
        pisca = (q === 2);
        tronco(add);
        braco(add, 2, 13); braco(add, 12, 13);
        perna(add, 5, 18, 3, 'j', 4, 21, 't');
        perna(add, 9, 18, 3, 'J', 9, 21, 'T');
    }
    return { partes: partes, cab: cab, pisca: pisca };
  }

  function desenharMapa(c, mapa, ox, oy){
    for (var y = 0; y < mapa.length; y++) {
      var linha = mapa[y];
      for (var x = 0; x < linha.length; x++) {
        var ch = linha[x];
        if (ch === '.') continue;
        c.fillStyle = COR[ch];
        c.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }

  function novoCanvas(w, h){
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
    var c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    return { cv: cv, c: c };
  }

  function renderPedro(nome, q, esc){
    var n = novoCanvas(18 * esc, 24 * esc), c = n.c;
    c.scale(esc, esc);
    c.translate(1, 1);
    var def = pose(nome, q);
    // 1ª passada: contorno de todas as partes (silhueta única)
    c.fillStyle = COR.K;
    def.partes.forEach(function(p){ c.fillRect(p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2); });
    // 2ª passada: preenchimento
    def.partes.forEach(function(p){ c.fillStyle = COR[p[4]]; c.fillRect(p[0], p[1], p[2], p[3]); });
    // cabeça por cima
    desenharMapa(c, def.pisca ? CABECA_PISCA : CABECA, 0, def.cab);
    return n.cv;
  }

  function tingir(cv, cor){
    var n = novoCanvas(cv.width, cv.height);
    n.c.drawImage(cv, 0, 0);
    n.c.globalCompositeOperation = 'source-in';
    n.c.fillStyle = cor;
    n.c.fillRect(0, 0, cv.width, cv.height);
    return n.cv;
  }

  /* ---------- sprites de mapa, com contorno automático ---------- */
  function contornar(mapa){
    var h = mapa.length, w = mapa[0].length, out = [];
    for (var y = -1; y <= h; y++) {
      var linha = '';
      for (var x = -1; x <= w; x++) {
        var ch = (mapa[y] && mapa[y][x]) || '.';
        if (ch !== '.') { linha += ch; continue; }
        var perto = false;
        for (var dy = -1; dy <= 1 && !perto; dy++)
          for (var dx = -1; dx <= 1; dx++) {
            var v = mapa[y + dy] && mapa[y + dy][x + dx];
            if (v && v !== '.') { perto = true; break; }
          }
        linha += perto ? 'K' : '.';
      }
      out.push(linha);
    }
    return out;
  }

  var MAPAS = {
    bit1: ['.G.', 'GG.', '.G.', '.G.', 'GGG'],
    bit0: ['GGG', 'G.G', 'G.G', 'G.G', 'GGG'],
    bug0: [
      '........a.a.',
      '.........a..',
      '...RRRRR.bb.',
      '..RrrRRRRbbb',
      '.RrRRVRRRbWE',
      '.RRVRRRRVbbb',
      '.RRRRRVRRbb.',
      '..RRRRRRR...',
      '..a.a..a.a..'
    ],
    bug1: [
      '........a.a.',
      '.........a..',
      '...RRRRR.bb.',
      '..RrrRRRRbbb',
      '.RrRRVRRRbWE',
      '.RRVRRRRVbbb',
      '.RRRRRVRRbb.',
      '..RRRRRRR...',
      '.a.a..a.a...'
    ],
    glitch: [
      '...QQQQ...',
      '.QQQQQQQQ.',
      'QQQQQQQQQQ',
      'QWEQQQWEQQ',
      'QWEQQQWEQQ',
      'QQQQQQQQQQ',
      'QQqqqqqqQQ',
      'QQQQQQQQQQ',
      'QQ.QQQQ.QQ',
      'Q...QQ...Q'
    ],
    coracao: ['.RR.RR.', 'RrRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
    coracaoVazio: ['.kk.kk.', 'kkkkkkk', 'kkkkkkk', '.kkkkk.', '..kkk..', '...k...'],
    cafe: [
      'MCCCCM..',
      'MMMMMMMM',
      'MMMLMM.M',
      'MMMMMMMM',
      'MMMMMM..',
      '.MMMM...'
    ],
    trofeu: [
      'YYYYYYYYYY',
      'YyyYYYYYYY',
      '.YyYYYYYY.',
      '..YYYYYY..',
      '...YYYY...',
      '....YY....',
      '....YY....',
      '...YYYY...',
      '..BBBBBB..',
      '..BBBBBB..'
    ]
  };

  function renderMapa(mapa, esc, brilho){
    var m = contornar(mapa);
    var pad = brilho ? Math.ceil(esc * 3) : 0;
    var n = novoCanvas(m[0].length * esc + pad * 2, m.length * esc + pad * 2);
    if (brilho) {
      var base = novoCanvas(m[0].length * esc, m.length * esc);
      base.c.scale(esc, esc); desenharMapa(base.c, m, 0, 0);
      n.c.shadowColor = brilho; n.c.shadowBlur = pad * 1.4;
      n.c.drawImage(base.cv, pad, pad);
      n.c.shadowBlur = 0;
      n.c.drawImage(base.cv, pad, pad);
    } else {
      n.c.scale(esc, esc); desenharMapa(n.c, m, 0, 0);
    }
    n.cv.pad = pad;
    return n.cv;
  }

  var BRILHO = { bit1: 'rgba(53,208,229,.9)', bit0: 'rgba(53,208,229,.9)', trofeu: 'rgba(224,168,79,.9)', cafe: 'rgba(255,255,255,.35)' };

  /* chip de skill: hexágono com o nome, em latão */
  function renderChip(nome, esc){
    var k = esc / 3, fs = Math.round(13 * k), pad = Math.round(10 * k);
    var med = novoCanvas(2, 2).c;
    med.font = fs + 'px Silkscreen, monospace';
    var tw = Math.ceil(med.measureText(nome).width);
    var w = tw + Math.round(26 * k), h = Math.round(26 * k), ponta = Math.round(7 * k);
    var n = novoCanvas(w + pad * 2, h + pad * 2), c = n.c;
    c.translate(pad, pad);
    c.beginPath();
    c.moveTo(ponta, 0); c.lineTo(w - ponta, 0); c.lineTo(w, h / 2);
    c.lineTo(w - ponta, h); c.lineTo(ponta, h); c.lineTo(0, h / 2); c.closePath();
    c.shadowColor = 'rgba(224,168,79,.85)'; c.shadowBlur = pad;
    c.fillStyle = '#1b1306'; c.fill();
    c.shadowBlur = 0;
    c.lineWidth = Math.max(2, Math.round(2 * k)); c.strokeStyle = '#e0a84f'; c.stroke();
    c.fillStyle = '#ffd890';
    c.font = fs + 'px Silkscreen, monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(nome, w / 2, h / 2 + 1);
    n.cv.pad = pad;
    return n.cv;
  }

  function renderHalo(raio){
    var n = novoCanvas(raio * 2, raio * 2);
    var gr = n.c.createRadialGradient(raio, raio, 0, raio, raio, raio);
    gr.addColorStop(0, 'rgba(4,8,15,.62)');
    gr.addColorStop(0.55, 'rgba(4,8,15,.32)');
    gr.addColorStop(1, 'rgba(4,8,15,0)');
    n.c.fillStyle = gr; n.c.fillRect(0, 0, raio * 2, raio * 2);
    return n.cv;
  }

  var cache = {};
  function lembrar(chave, fazer){
    if (!cache[chave]) cache[chave] = fazer();
    return cache[chave];
  }

  return {
    COR: COR,
    /* variante: 'normal' | 'branco' (dano) | 'fantasma' (rastro) */
    pedro: function(nome, q, esc, variante){
      variante = variante || 'normal';
      return lembrar(['p', nome, q, esc, variante].join('|'), function(){
        var base = renderPedro(nome, q, esc);
        if (variante === 'branco') return tingir(base, '#ffffff');
        if (variante === 'fantasma') return tingir(base, '#35d0e5');
        return base;
      });
    },
    obter: function(nome, esc){
      return lembrar(['m', nome, esc].join('|'), function(){ return renderMapa(MAPAS[nome], esc, BRILHO[nome]); });
    },
    chip: function(nome, esc){
      return lembrar(['c', nome, esc].join('|'), function(){ return renderChip(nome, esc); });
    },
    halo: function(raio){
      return lembrar('h|' + raio, function(){ return renderHalo(raio); });
    },
    limpar: function(){ cache = {}; }
  };
})();
