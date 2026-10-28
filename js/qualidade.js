/* ==========================================================
   QUALIDADE · escala automática para aparelhos mais fracos
   Três níveis: alto, medio e baixo.
   1. Na entrada, um palpite pelo aparelho: núcleos do processador,
      memória, placa de vídeo (renderização por software conta
      como fraca), economia de dados e celular.
   2. Durante o uso, mede o FPS de verdade. Se o aparelho não
      aguenta, desce um nível sozinho (nunca sobe sozinho, para
      não ficar oscilando).
   3. O jogador pode fixar o nível no painel de pausa.
   Cada módulo pergunta o nível atual ou escuta as mudanças.
   ========================================================== */
window.HL = window.HL || {};

HL.qualidade = (function () {
  'use strict';

  var NIVEIS = ['baixo', 'medio', 'alto'];   // do mais fraco ao mais forte
  var LIMITES = {
    alto:  { dpr: 2,    partes: 700, grade3d: 1 },
    medio: { dpr: 1.25, partes: 350, grade3d: 2 },
    baixo: { dpr: 1,    partes: 150, grade3d: 3 }
  };

  var ouvintes = [];
  var escolha = 'auto';
  try { escolha = localStorage.getItem('hl.qualidade') || 'auto'; } catch (e) { escolha = 'auto'; }
  if (escolha !== 'auto' && NIVEIS.indexOf(escolha) < 0) escolha = 'auto';

  var nivel = 'alto';

  /* ---------- utilidades ---------- */
  function indice(n) {
    var i = NIVEIS.indexOf(n);
    return i < 0 ? NIVEIS.length - 1 : i;
  }
  function valido(n) { return NIVEIS.indexOf(n) >= 0; }

  function avisar() {
    for (var i = 0; i < ouvintes.length; i++) {
      try { ouvintes[i](nivel); } catch (e) { /* um assinante quebrado não derruba o jogo */ }
    }
  }

  function aplicar(n) {
    if (!valido(n) || n === nivel) return false;
    nivel = n;
    avisar();
    return true;
  }

  /* ==========================================================
     PALPITE DO APARELHO
     ========================================================== */
  function placaDeVideo() {
    var r = { webgl: false, software: false, fraca: false };
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl', { failIfMajorPerformanceCaveat: true });
      if (!gl) {
        /* só abriu aceitando "perda grande de desempenho": é software */
        gl = c.getContext('webgl');
        if (gl) r.software = true;
      }
      if (!gl) return r;
      r.webgl = true;
      var info = gl.getExtension('WEBGL_debug_renderer_info');
      var nome = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
                             : (gl.getParameter(gl.RENDERER) || ''));
      if (/swiftshader|llvmpipe|softpipe|software|basic render|paravirtual/i.test(nome)) r.software = true;
      if (/intel.*(hd|uhd) graphics (4|5|6)\d\d\b|intel.*hd graphics\b(?! \d)|mali-[gt]\d{1,2}\b|adreno[^0-9]*[3-5]\d\d|powervr|gma|apple a\d/i.test(nome)) r.fraca = true;
      var fim = gl.getExtension('WEBGL_lose_context');
      if (fim) fim.loseContext();
    } catch (e) { /* sem WebGL: o jogo roda igual, só sem 3D */ }
    return r;
  }

  function adivinhar() {
    var pontos = 0;
    var nucleos = navigator.hardwareConcurrency || 4;
    if (nucleos <= 2) pontos += 2; else if (nucleos <= 4) pontos += 1;

    var mem = navigator.deviceMemory || 4;
    if (mem <= 2) pontos += 2; else if (mem <= 4) pontos += 1;

    var g = placaDeVideo();
    if (g.software) pontos += 3;
    else if (!g.webgl) pontos += 2;
    else if (g.fraca) pontos += 1;

    try { if (navigator.connection && navigator.connection.saveData) pontos += 2; } catch (e) {}
    try { if (window.matchMedia('(pointer: coarse)').matches) pontos += 1; } catch (e) {}

    if (pontos >= 4) return 'baixo';
    if (pontos >= 2) return 'medio';
    return 'alto';
  }

  /* ==========================================================
     MEDIÇÃO DE FPS
     ========================================================== */
  var janela = { quadros: 0, tempo: 0, medicoes: 0 };

  function observar(dt) {
    if (escolha !== 'auto') return;          // o jogador fixou: não mexe
    if (typeof dt !== 'number' || dt <= 0) return;
    if (document.hidden) return;

    janela.quadros++;
    janela.tempo += dt;
    if (janela.tempo < 2) return;

    var fps = janela.quadros / janela.tempo;
    janela.quadros = 0;
    janela.tempo = 0;
    janela.medicoes++;

    if (janela.medicoes < 1) return;          // ignora a primeira janela (aquecimento)
    if (fps < 40) aplicar(NIVEIS[indice(nivel) - 1]);   // desce um nível; nunca sobe
  }

  /* ---------- estado inicial ---------- */
  nivel = (escolha === 'auto') ? adivinhar() : escolha;

  /* ==========================================================
     API
     ========================================================== */
  return {
    get nivel() { return nivel; },
    get escolha() { return escolha; },
    get limites() { return LIMITES[nivel] || LIMITES.alto; },

    /* assina as mudanças e já entrega o nível atual */
    aoMudar: function (fn) {
      if (typeof fn !== 'function') return;
      ouvintes.push(fn);
      try { fn(nivel); } catch (e) {}
    },

    /* fixa o nível (auto|alto|medio|baixo) */
    definir: function (n) {
      if (n !== 'auto' && !valido(n)) n = 'auto';
      escolha = n;
      try { localStorage.setItem('hl.qualidade', n); } catch (e) {}
      if (n === 'auto') {
        nivel = adivinhar();
        avisar();
      } else {
        aplicar(n);
        avisar();
      }
    },

    auto: function () { this.definir('auto'); },

    /* o loop de render chama isto a cada quadro */
    observar: observar
  };
})();
