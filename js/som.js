/* ==========================================================
   SOM · efeitos sintetizados com Web Audio (nenhum arquivo)
   Cada efeito é uma ou mais notas de oscilador com envelope
   curto, no espírito dos chips de som dos consoles 8-bit.
   ========================================================== */
window.PV = window.PV || {};

PV.som = (function(){
  'use strict';
  var ctx = null, mestre = null, ruidoBuf = null;
  var mudo = false;
  try { mudo = localStorage.getItem('descida.mudo') === '1'; } catch(e) {}

  function ativar(){
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      mestre = ctx.createGain();
      mestre.gain.value = 0.2;
      mestre.connect(ctx.destination);

      // um segundo de ruído branco, reaproveitado por todos os efeitos de "impacto"
      ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = ruidoBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  /* uma nota: frequência inicial, duração, forma de onda, volume,
     fator de deslize de frequência (1 = sem deslize) e atraso */
  function nota(freq, dur, tipo, vol, deslize, atraso){
    if (!ctx || mudo) return;
    var t = ctx.currentTime + (atraso || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (deslize && deslize !== 1) {
      o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * deslize), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.4, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mestre);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function ruido(dur, vol, corte, atraso){
    if (!ctx || mudo) return;
    var t = ctx.currentTime + (atraso || 0);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruidoBuf;
    f.type = 'lowpass'; f.frequency.value = corte || 1200;
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(mestre);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  function arpejo(freqs, passo, tipo, vol, dur){
    freqs.forEach(function(f, i){ nota(f, dur || 0.13, tipo, vol, 1, i * passo); });
  }

  var efeitos = {
    pulo:      function(){ nota(330, 0.13, 'square', 0.28, 2.1); },
    pulo2:     function(){ nota(520, 0.1, 'square', 0.24, 2); nota(880, 0.12, 'triangle', 0.22, 1.4, 0.05); },
    pouso:     function(){ ruido(0.07, 0.22, 700); },
    passo:     function(){ ruido(0.025, 0.06, 2400); },
    bit:       function(seq){ nota(988 * Math.pow(2, Math.min(seq || 0, 12) / 12), 0.08, 'square', 0.2, 1.02); },
    skill:     function(){ arpejo([523, 659, 784, 1047, 1319], 0.055, 'square', 0.22); },
    trofeu:    function(){ arpejo([392, 523, 659, 784, 1047, 784, 1047], 0.07, 'square', 0.24, 0.16); },
    cafe:      function(){ arpejo([660, 880, 1100], 0.06, 'triangle', 0.3); },
    esmaga:    function(c){ nota(260 + (c || 0) * 60, 0.12, 'square', 0.32, 0.45); ruido(0.08, 0.25, 1800); },
    dano:      function(){ nota(220, 0.32, 'sawtooth', 0.32, 0.35); ruido(0.18, 0.2, 900); },
    socoIni:   function(){ nota(700, 0.12, 'triangle', 0.2, 0.5); },
    soco:      function(){ nota(110, 0.4, 'sine', 0.75, 0.35); ruido(0.32, 0.5, 520); },
    fase:      function(){ arpejo([392, 494, 587, 784], 0.075, 'square', 0.22, 0.14); },
    panico:    function(){ arpejo([440, 370, 311, 262, 196], 0.11, 'sawtooth', 0.26, 0.2); },
    buraco:    function(){ nota(600, 0.25, 'triangle', 0.18, 0.4); },
    fim:       function(){
      arpejo([523, 659, 784, 1047], 0.09, 'square', 0.24, 0.18);
      [1047, 1319, 1568, 2093].forEach(function(f, i){ nota(f, 0.35, 'triangle', 0.2, 1, 0.42 + i * 0.1); });
    },
    bloco:     function(){ nota(180, 0.09, 'square', 0.3, 0.7); nota(700, 0.07, 'triangle', 0.18, 1.3, 0.03); },
    moeda:     function(){ nota(1320, 0.06, 'square', 0.16, 1); nota(1760, 0.12, 'square', 0.16, 1, 0.05); },
    clique:    function(){ nota(1200, 0.04, 'square', 0.12, 1); }
  };

  return {
    ativar: ativar,
    tocar: function(nome, arg){ if (efeitos[nome]) efeitos[nome](arg); },
    alternar: function(){
      mudo = !mudo;
      try { localStorage.setItem('descida.mudo', mudo ? '1' : '0'); } catch(e) {}
      return mudo;
    },
    get mudo(){ return mudo; }
  };
})();
