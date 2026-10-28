/* ==========================================================
   DESEMPENHO · qualidade automática para aparelhos mais fracos
   Três níveis: alto, medio e baixo.
   1. Na entrada, um palpite pelo aparelho: núcleos do processador,
      memória, placa de vídeo (renderização por software conta
      como fraca), economia de dados e celular.
   2. Durante o uso, mede o FPS de verdade. Se o aparelho não
      aguenta, desce um nível sozinho (nunca sobe sozinho, para
      não ficar oscilando).
   3. O jogador pode fixar o nível na tela de pausa.
   Cada módulo pergunta o nível atual ou escuta as mudanças.
   ========================================================== */
window.PV = window.PV || {};

PV.qualidade = (function(){
  'use strict';
  var NIVEIS = ['baixo', 'medio', 'alto'];
  var ouvintes = [];
  var escolha = 'auto';
  try { escolha = localStorage.getItem('descida.qualidade') || 'auto'; } catch (e) {}
  if (escolha !== 'auto' && NIVEIS.indexOf(escolha) < 0) escolha = 'auto';

  /* o que dá para saber da placa de vídeo sem desenhar nada */
  function placaDeVideo(){
    var r = { webgl: false, software: false, fraca: false };
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl', { failIfMajorPerformanceCaveat: true });
      if (!gl) {
        // só abre aceitando "perda grande de desempenho": é renderização por software
        gl = c.getContext('webgl');
        if (gl) r.software = true;
      }
      if (!gl) return r;
      r.webgl = true;
      var info = gl.getExtension('WEBGL_debug_renderer_info');
      var nome = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
      if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(nome)) r.software = true;
      if (/intel.*(hd|uhd) graphics (4|5|6)\d\d\b|intel.*hd graphics\b(?! \d)|mali-[gt]\d{1,2}\b|adreno[^0-9]*[3-5]\d\d|powervr|gma/i.test(nome)) r.fraca = true;
      var fim = gl.getExtension('WEBGL_lose_context');
      if (fim) fim.loseContext();
    } catch (e) {}
    return r;
  }

  function palpite(){
    var nucleos = navigator.hardwareConcurrency || 4;
    var memoria = navigator.deviceMemory || 8;
    var rede = navigator.connection || {};
    var p = 2;
    if (nucleos <= 4 || memoria <= 4) p = 1;
    if (nucleos <= 2 || memoria <= 2 || rede.saveData) p = 0;
    var gpu = placaDeVideo();
    if (!gpu.webgl) p = 0;
    else if (gpu.software || gpu.fraca) p = Math.min(p, 1);
    // celular: no máximo médio, para poupar bateria e calor
    if (window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820) p = Math.min(p, 1);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) p = Math.min(p, 1);
    return NIVEIS[p];
  }

  var nivel = escolha === 'auto' ? palpite() : escolha;

  function aplicarClasse(){
    var h = document.documentElement;
    NIVEIS.forEach(function(n){ h.classList.remove('q-' + n); });
    h.classList.add('q-' + nivel);
  }
  aplicarClasse();

  var avisoEl = null, avisou = false;
  function avisar(){
    avisoEl = avisoEl || document.getElementById('aviso');
    if (!avisoEl || avisou) return;
    avisou = true;
    avisoEl.textContent = 'Qualidade ajustada para o seu aparelho';
    avisoEl.classList.add('on');
    setTimeout(function(){ avisoEl.classList.remove('on'); }, 2600);
  }

  function mudar(n, automatico){
    if (n === nivel) return;
    nivel = n;
    aplicarClasse();
    ouvintes.forEach(function(fn){ try { fn(nivel); } catch (e) { console.error(e); } });
    if (automatico) avisar();
  }

  /* medidor de FPS: janelas de 90 quadros, depois de uma carência inicial */
  var amostras = [], ultimo = 0, carencia = performance.now() + 4000;
  function laco(agora){
    requestAnimationFrame(laco);
    if (document.hidden) { ultimo = 0; return; }
    if (ultimo) {
      var dt = agora - ultimo;
      if (dt < 250) amostras.push(dt);              // troca de aba e pausas longas não contam
    }
    ultimo = agora;
    if (amostras.length < 90) return;
    var soma = 0, lentos = 0;
    amostras.forEach(function(d){ soma += d; if (d > 34) lentos++; });
    var media = soma / amostras.length, desvio = 0;
    amostras.forEach(function(d){ desvio += (d - media) * (d - media); });
    desvio = Math.sqrt(desvio / amostras.length);
    amostras.length = 0;
    if (escolha !== 'auto' || agora < carencia || nivel === 'baixo') return;
    // 30 FPS cravado e estável é limite da tela ou do modo economia, não aparelho travando
    var limitado = media > 31 && media < 36 && desvio < 3;
    if (!limitado && (media > 35 && lentos > 45)) {
      mudar(NIVEIS[Math.max(0, NIVEIS.indexOf(nivel) - 1)], true);
      carencia = agora + 6000;
    }
  }
  requestAnimationFrame(laco);

  return {
    get nivel(){ return nivel; },
    get escolha(){ return escolha; },
    aoMudar: function(fn){ ouvintes.push(fn); },
    /* 'auto', 'alto', 'medio' ou 'baixo' */
    escolher: function(e){
      escolha = e;
      try { localStorage.setItem('descida.qualidade', e); } catch (err) {}
      carencia = performance.now() + 4000;
      mudar(e === 'auto' ? palpite() : e, false);
    },
    tem3d: function(){ return nivel !== 'baixo'; }
  };
})();
