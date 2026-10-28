/* ==========================================================
   SITE · comportamento do portfólio fora do jogo
   barra de progresso, link ativo, revelação ao rolar e botões
   ========================================================== */
(function(){
  'use strict';
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-acao="jogar"]').forEach(function(b){
    b.addEventListener('click', function(){ PV.jogo.jogar(); });
  });

  /* navbar: progresso da leitura e seção atual */
  var barra = document.getElementById('progresso');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var secoes = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var agendado = false;

  function aoRolar(){
    agendado = false;
    var y = window.scrollY, alt = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.width = (alt > 0 ? (y / alt) * 100 : 0) + '%';
    var atual = -1;
    for (var i = 0; i < secoes.length; i++) {
      if (secoes[i] && secoes[i].getBoundingClientRect().top <= window.innerHeight * 0.35) atual = i;
    }
    links.forEach(function(a, i){ a.classList.toggle('ativo', i === atual); });
  }
  window.addEventListener('scroll', function(){
    if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); }
  }, { passive: true });
  aoRolar();

  /* revelação: os blocos sobem e aparecem quando entram na tela */
  var alvos = document.querySelectorAll(
    '.fase .kicker, .fase h2, .col > p, .cartao, .lista li, .specs > div, .pontos li, .citacao, ' +
    '.heroi-texto, .heroi-acoes, .controles, .heroi-rodape'
  );
  if (!semMovimento && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('dentro');
        obs.unobserve(e.target);
        // cartões entram caindo em 3D, como uma aba que se abre
        if (e.target.classList.contains('cartao') && PV.efeitos3d) PV.efeitos3d.entrar(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    alvos.forEach(function(el){ el.classList.add('rev'); obs.observe(el); });
  }
})();
