/* ==========================================================
   CENA 3D · peças grandes que aparecem conforme a página desce
   Três modelos montados só com geometria do three.js e texturas
   pintadas em canvas (nenhum arquivo de modelo nem de imagem):
     - a placa Arduino Nano  (Atuação, Trajetória e Projetos)
     - a mão robótica Puppet (Web, Puppet e Criptografia)
     - um troféu de ouro     (Prêmios e Competições)
   Cada peça sobe de baixo quando a fase chega, fica no lado
   vazio da página, tinge o cenário com a sua cor e reage ao que
   o personagem faz (pulo, soco, coleta, dano).
   ========================================================== */
window.PV = window.PV || {};

PV.cena3d = (function(){
  'use strict';
  var Q = PV.qualidade;
  var impl = null, carregando = false;
  var THREE_URL = 'js/three.min.js';

  /* o three.js (600 KB) só é baixado depois que a página carregou,
     e só se o aparelho estiver no nível médio ou alto */
  function carregar(){
    if (impl || carregando || (Q && !Q.tem3d())) return;
    carregando = true;
    function pronto(){ impl = montar(); carregando = false; }
    if (window.THREE) { pronto(); return; }
    var s = document.createElement('script');
    s.src = THREE_URL; s.async = true;
    s.onload = pronto;
    s.onerror = function(){ carregando = false; };   // sem internet: o site segue sem as peças 3D
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') setTimeout(carregar, 400);
  else window.addEventListener('load', function(){ setTimeout(carregar, 400); });
  if (Q) Q.aoMudar(function(n){
    if (impl) impl.qualidade(n);
    else if (n !== 'baixo') carregar();
  });

  function montar(){
    var cv = document.getElementById('cena3d');
    if (!cv || !window.THREE) return null;
    var T = window.THREE;
    var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nivel = Q ? Q.nivel : 'alto';
    var alto = nivel === 'alto';              // decide o que é montado; o resto se ajusta ao vivo
    var DET = alto ? 1 : 0.5;                 // detalhe das texturas pintadas

    var render;
    try {
      render = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: alto, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    if (!render.getContext()) return null;
    render.setClearColor(0x000000, 0);
    render.outputEncoding = T.sRGBEncoding;
    render.toneMapping = T.ACESFilmicToneMapping;
    render.toneMappingExposure = 1.1;
    var ANISO = render.capabilities.getMaxAnisotropy();

    var cena = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 1, 1, 600);
    camera.position.set(0, 0, 100);

    /* ==========================================================
       UTILIDADES
       ========================================================== */
    function semente(n){
      return function(){
        n = n + 0x6D2B79F5 | 0;
        var t = Math.imul(n ^ n >>> 15, 1 | n);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function tela(w, h, pintar){
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      pintar(c.getContext('2d'), w, h);
      return c;
    }
    function tex(c, cor, repetir){
      var t = new T.CanvasTexture(c);
      if (cor) t.encoding = T.sRGBEncoding;
      t.anisotropy = ANISO;
      if (repetir) t.wrapS = t.wrapT = T.RepeatWrapping;
      return t;
    }
    // no médio, o material físico (verniz/clearcoat) vira o padrão, bem mais leve para a placa de vídeo
    function fisico(p){
      if (alto) return new T.MeshPhysicalMaterial(p);
      var q = {};
      Object.keys(p).forEach(function(k){ if (!/^clearcoat|^transmission/.test(k)) q[k] = p[k]; });
      return new T.MeshStandardMaterial(q);
    }
    function salpicar(g, w, h, n, cores, tam, rnd){
      n = Math.round(n * DET);
      for (var i = 0; i < n; i++) {
        g.fillStyle = cores[i % cores.length];
        var s = tam * (0.4 + rnd());
        g.fillRect(rnd() * w, rnd() * h, s, s);
      }
    }
    function brilho(cor){
      return tela(128, 128, function(g){
        var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, cor); gr.addColorStop(0.25, cor.replace(/[\d.]+\)$/, '0.45)')); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      });
    }
    function sprite(canvas, escala, cor){
      var s = new T.Sprite(new T.SpriteMaterial({ map: tex(canvas, true), color: cor || 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      s.scale.set(escala, escala, 1);
      return s;
    }

    /* caixa com cantos arredondados de verdade (normais suaves e UV por face):
       parte de um cubo subdividido, concentra os vértices perto das arestas
       e empurra cada um para a superfície arredondada */
    function caixaRed(w, h, d, r){
      var g = new T.BoxGeometry(2, 2, 2, 10, 10, 10);
      var pos = g.attributes.position, nor = g.attributes.normal;
      var meio = [w / 2, h / 2, d / 2];
      r = Math.min(r, meio[0], meio[1], meio[2]) * 0.999;
      var v = new T.Vector3(), dentro = new T.Vector3(), n = new T.Vector3();
      for (var i = 0; i < pos.count; i++) {
        var c = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        for (var k = 0; k < 3; k++) {
          var u = Math.abs(c[k]), s = c[k] < 0 ? -1 : 1, plano = meio[k] - r;
          c[k] = s * (u < 0.6 ? (u / 0.6) * plano : plano + r * (u - 0.6) / 0.4);
        }
        v.set(c[0], c[1], c[2]);
        dentro.set(
          Math.max(-meio[0] + r, Math.min(meio[0] - r, v.x)),
          Math.max(-meio[1] + r, Math.min(meio[1] - r, v.y)),
          Math.max(-meio[2] + r, Math.min(meio[2] - r, v.z)));
        n.subVectors(v, dentro);
        if (n.lengthSq() < 1e-10) n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
        else n.normalize();
        v.copy(dentro).addScaledVector(n, r);
        pos.setXYZ(i, v.x, v.y, v.z);
        nor.setXYZ(i, n.x, n.y, n.z);
      }
      return g;
    }

    var aux = new T.Object3D();
    function instancias(geo, mat, lista){
      var m = new T.InstancedMesh(geo, mat, lista.length);
      lista.forEach(function(it, i){
        aux.position.set(it[0], it[1], it[2]);
        aux.rotation.set(it[3] || 0, it[4] || 0, it[5] || 0);
        aux.scale.set(1, 1, 1);
        aux.updateMatrix();
        m.setMatrixAt(i, aux.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      return m;
    }

    /* ==========================================================
       LUZ E REFLEXOS
       ========================================================== */
    var ENV_QUENTE = null;
    (function(){
      // ambiente para os metais: um estúdio escuro com três softboxes
      var c = tela(1024, 512, function(g, w, h){
        var gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#3a4c66'); gr.addColorStop(0.45, '#121c2b'); gr.addColorStop(1, '#05070c');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        function caixa(x, y, cw, ch, cor){
          var r = g.createLinearGradient(x, y, x, y + ch);
          r.addColorStop(0, cor); r.addColorStop(1, 'rgba(255,255,255,.35)');
          g.fillStyle = r; g.fillRect(x, y, cw, ch);
        }
        caixa(110, 70, 190, 90, '#ffffff');
        caixa(600, 120, 260, 46, '#bdf3ff');
        caixa(420, 40, 90, 150, '#ffe2b0');
        caixa(880, 200, 80, 60, '#ffffff');
        g.fillStyle = '#2a3b52'; g.fillRect(0, 330, w, 20);
      });
      var t = tex(c, true);
      t.mapping = T.EquirectangularReflectionMapping;
      var pm = new T.PMREMGenerator(render);
      cena.environment = pm.fromEquirectangular(t).texture;
      t.dispose();
      // um segundo ambiente, quente, só para o ouro do troféu
      var q = tex(tela(1024, 512, function(g, w, h){
        var gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#8a6a3c'); gr.addColorStop(0.45, '#3a2812'); gr.addColorStop(1, '#120a04');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff6e2'; g.fillRect(90, 60, 220, 110);
        g.fillStyle = '#ffe2a8'; g.fillRect(560, 90, 300, 60);
        g.fillStyle = '#ffffff'; g.fillRect(400, 30, 70, 170);
        g.fillStyle = '#c99a50'; g.fillRect(0, 300, w, 40);
      }), true);
      q.mapping = T.EquirectangularReflectionMapping;
      ENV_QUENTE = pm.fromEquirectangular(q).texture;
      q.dispose(); pm.dispose();

      cena.add(new T.HemisphereLight(0xbfe0ff, 0x0a0f18, 0.5));
      var chave = new T.DirectionalLight(0xfff0dc, 1.7);
      chave.position.set(-35, 45, 60); cena.add(chave);
      var recorte = new T.DirectionalLight(0x58e0f0, 1.3);
      recorte.position.set(45, 15, -40); cena.add(recorte);
      var baixo = new T.DirectionalLight(0xffb070, 0.35);
      baixo.position.set(10, -50, 20); cena.add(baixo);
    })();

    /* ==========================================================
       PEÇA 1 · TELECOM SERVER BLADE & FIBER MATRIX
       Netcracker / Du Telecom / Infraestrutura BSS-OSS & 100G Óptica
       ========================================================== */
    function criarPecaTelecom(){
      var g = new T.Group();

      // Painel holográfico de fundo com bordas perfeitamente suaves (radial mask)
      var cvFundo = document.createElement('canvas');
      cvFundo.width = 1024; cvFundo.height = 680;
      var ctx1 = cvFundo.getContext('2d');
      var texFundo = new T.CanvasTexture(cvFundo);
      texFundo.encoding = T.sRGBEncoding;

      var img1 = new Image();
      img1.onload = function(){
        ctx1.drawImage(img1, 0, 0, cvFundo.width, cvFundo.height);
        ctx1.globalCompositeOperation = 'destination-in';
        var rad = ctx1.createRadialGradient(cvFundo.width/2, cvFundo.height/2, cvFundo.width * 0.22, cvFundo.width/2, cvFundo.height/2, cvFundo.width * 0.49);
        rad.addColorStop(0, 'rgba(0,0,0,0.92)');
        rad.addColorStop(0.7, 'rgba(0,0,0,0.55)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx1.fillStyle = rad;
        ctx1.fillRect(0, 0, cvFundo.width, cvFundo.height);
        ctx1.globalCompositeOperation = 'source-over';
        texFundo.needsUpdate = true;
        if (render) render.render(cena, camera);
      };
      img1.src = 'assets/fundo/opcao1_telecom.jpg';

      var matFundo = new T.MeshBasicMaterial({
        map: texFundo,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      });
      var quadro = new T.Mesh(new T.PlaneGeometry(36, 24), matFundo);
      quadro.position.set(0, 0, -4.5);
      g.add(quadro);

      // Chassi do Servidor Blade Modular em titânio cibernético
      var matChassi = new T.MeshStandardMaterial({
        color: 0x0c1726,
        metalness: 0.94,
        roughness: 0.24
      });
      var chassi = new T.Mesh(caixaRed(27, 7.5, 9.5, 0.45), matChassi);
      chassi.position.set(0, 0, 0);
      g.add(chassi);

      // Orelhas de montagem em Rack (Rack-mount ears)
      var matOrelha = new T.MeshStandardMaterial({ color: 0x18283a, metalness: 0.95, roughness: 0.3 });
      var orelhaE = new T.Mesh(new T.BoxGeometry(1.3, 8.8, 0.6), matOrelha);
      orelhaE.position.set(-14.1, 0, 4.4); g.add(orelhaE);
      var orelhaD = orelhaE.clone(); orelhaD.position.set(14.1, 0, 4.4); g.add(orelhaD);

      // Faceplate frontal com Silkscreen e OLED
      var texPainel = tex(tela(1024, 280, function(ctx, w, h){
        var gr = ctx.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#0c1624'); gr.addColorStop(1, '#060c15');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);

        // Grade de ventilação frontal
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        for (var x = 40; x < 280; x += 12) {
          for (var y = 30; y < h - 30; y += 14) {
            ctx.fillRect(x, y, 6, 8);
          }
        }

        // Serigrafia técnica
        ctx.fillStyle = '#35d0e5';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('DU TELECOM · NETCRACKER BSS/OSS', 315, 52);
        ctx.fillStyle = '#8ea4ba';
        ctx.font = '16px monospace';
        ctx.fillText('100G OPTICAL BLADE MODULE // PRODUCTION READY', 315, 80);

        // Visor OLED de telemetria
        ctx.fillStyle = '#02070c';
        ctx.fillRect(315, 105, 345, 52);
        ctx.strokeStyle = '#35d0e5';
        ctx.lineWidth = 2;
        ctx.strokeRect(315, 105, 345, 52);
        ctx.fillStyle = '#49f2b8';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('SYS: 100% OK · LAT: 0.12ms · BSS/OSS', 328, 138);

        // Nomes das 8 portas ópticas
        ctx.fillStyle = '#e0a84f';
        ctx.font = 'bold 15px monospace';
        for (var p = 0; p < 8; p++) {
          ctx.fillText('OPT-0' + (p + 1), 690 + (p % 4) * 76, p < 4 ? 60 : 160);
        }
      }), true);

      var faceplateMat = new T.MeshStandardMaterial({ map: texPainel, roughness: 0.35, metalness: 0.5 });
      var faceplate = new T.Mesh(new T.PlaneGeometry(26.6, 7.1), faceplateMat);
      faceplate.position.set(0, 0, 4.8);
      g.add(faceplate);

      // Portas Ópticas SFP+ e Conectores de Fibra com LEDs
      var matSfp = new T.MeshStandardMaterial({ color: 0xa0c0d8, metalness: 0.95, roughness: 0.15 });
      var matFibraAzul = new T.MeshStandardMaterial({ color: 0x35d0e5, emissive: 0x127b8f, roughness: 0.2 });
      var matFibraAmbar = new T.MeshStandardMaterial({ color: 0xe0a84f, emissive: 0x7a5214, roughness: 0.2 });

      var ledsOpticos = [];
      var luzLed = brilho('rgba(53,208,229,1)');

      for (var i = 0; i < 8; i++) {
        var col = i % 4, lin = Math.floor(i / 4);
        var px = 4.8 + col * 2.0;
        var py = lin === 0 ? 0.95 : -1.35;

        // Gaiola SFP+ metálica
        var sfp = new T.Mesh(new T.BoxGeometry(1.5, 1.25, 2.2), matSfp);
        sfp.position.set(px, py, 4.9);
        g.add(sfp);

        // Conector de fibra LC
        var conector = new T.Mesh(new T.BoxGeometry(1.2, 0.95, 1.3), i % 2 === 0 ? matFibraAzul : matFibraAmbar);
        conector.position.set(px, py, 5.8);
        g.add(conector);

        // LED indicador
        var ledSprite = sprite(luzLed, 1.5);
        ledSprite.position.set(px, py + 0.85, 5.0);
        ledSprite.material.opacity = 0.8;
        g.add(ledSprite);

        ledsOpticos.push({ sprite: ledSprite, fase: i * 0.7, flash: 0 });
      }

      // Loop de cabos de fibra óptica
      for (var f = 0; f < 4; f++) {
        var fx = 4.8 + f * 2.0;
        var curva = new T.CubicBezierCurve3(
          new T.Vector3(fx, -1.35, 6.4),
          new T.Vector3(fx - 0.9, -4.6, 7.8),
          new T.Vector3(fx - 2.8, -4.2, 3.8),
          new T.Vector3(fx - 4.2, -1.6, 1.2)
        );
        var tuboGeo = new T.TubeGeometry(curva, 24, 0.18, 8, false);
        var caboMat = new T.MeshStandardMaterial({
          color: f % 2 === 0 ? 0x35d0e5 : 0xe0a84f,
          emissive: f % 2 === 0 ? 0x127b8f : 0x7a5214,
          roughness: 0.3
        });
        g.add(new T.Mesh(tuboGeo, caboMat));
      }

      var atividade = 0;
      return {
        grupo: g,
        escala: 0.95,
        cor: [53, 208, 229],
        atualizar: function(dt, t, giro){
          giro.rotation.y = Math.sin(t * 0.35) * 0.32;
          giro.rotation.x = 0.15 + Math.sin(t * 0.5) * 0.05;
          giro.rotation.z = Math.sin(t * 0.25) * 0.04;

          atividade = Math.max(0, atividade - dt * 2.2);

          for (var k = 0; k < ledsOpticos.length; k++) {
            var item = ledsOpticos[k];
            item.flash = Math.max(0, item.flash - dt * 4.0);
            var brilhoBase = Math.pow(Math.max(0, Math.sin(t * 7.5 + item.fase)), 4) * 0.7;
            item.sprite.material.opacity = Math.min(1, brilhoBase + item.flash + atividade);
          }
        },
        evento: function(nome){
          if (nome === 'pulo' || nome === 'coleta') {
            atividade = 0.9;
            for (var k = 0; k < ledsOpticos.length; k++) ledsOpticos[k].flash = 1.0;
          } else if (nome === 'soco' || nome === 'trofeu') {
            atividade = 1.0;
            for (var j = 0; j < ledsOpticos.length; j++) ledsOpticos[j].flash = 1.0;
          }
        }
      };
    }

    /* ==========================================================
       PEÇA 2 · AUTOMAÇÃO & AI WORKFLOW NODE GRAPH
       n8n / Intelektus / Arquitetura de Pipelines e Agentes IA
       ========================================================== */
    function criarPecaAutomacao(){
      var g = new T.Group();

      // Painel holográfico de fundo com bordas perfeitamente suaves
      var cvFundo = document.createElement('canvas');
      cvFundo.width = 1024; cvFundo.height = 680;
      var ctx2 = cvFundo.getContext('2d');
      var texFundo = new T.CanvasTexture(cvFundo);
      texFundo.encoding = T.sRGBEncoding;

      var img2 = new Image();
      img2.onload = function(){
        ctx2.drawImage(img2, 0, 0, cvFundo.width, cvFundo.height);
        ctx2.globalCompositeOperation = 'destination-in';
        var rad = ctx2.createRadialGradient(cvFundo.width/2, cvFundo.height/2, cvFundo.width * 0.22, cvFundo.width/2, cvFundo.height/2, cvFundo.width * 0.49);
        rad.addColorStop(0, 'rgba(0,0,0,0.92)');
        rad.addColorStop(0.7, 'rgba(0,0,0,0.55)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx2.fillStyle = rad;
        ctx2.fillRect(0, 0, cvFundo.width, cvFundo.height);
        ctx2.globalCompositeOperation = 'source-over';
        texFundo.needsUpdate = true;
        if (render) render.render(cena, camera);
      };
      img2.src = 'assets/fundo/opcao2_automacao_nodes.jpg';

      var matFundo = new T.MeshBasicMaterial({
        map: texFundo,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      });
      var quadro = new T.Mesh(new T.PlaneGeometry(36, 24), matFundo);
      quadro.position.set(0, 0, -4.5);
      g.add(quadro);

      // Nó Central: Hub do Agente IA (n8n Orchestrator)
      var matHub = new T.MeshStandardMaterial({ color: 0xe0a84f, metalness: 0.88, roughness: 0.22 });
      var hub = new T.Mesh(caixaRed(6.0, 6.0, 3.8, 0.6), matHub);
      g.add(hub);

      // Tela frontal do Hub com serigrafia
      var texHub = tex(tela(512, 512, function(ctx, w, h){
        ctx.fillStyle = '#0a101d'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#e0a84f'; ctx.lineWidth = 14;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        ctx.fillStyle = '#e0a84f';
        ctx.font = 'bold 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('n8n · AI', w / 2, 180);

        ctx.fillStyle = '#35d0e5';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('ORCHESTRATOR', w / 2, 250);

        ctx.fillStyle = '#ffffff';
        ctx.font = '28px monospace';
        ctx.fillText('AUTOMATION CORE', w / 2, 330);

        ctx.fillStyle = '#49f2b8';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('ACTIVE · 24/7', w / 2, 400);
      }), true);
      var hubFace = new T.Mesh(new T.PlaneGeometry(5.2, 5.2), new T.MeshStandardMaterial({ map: texHub, roughness: 0.3 }));
      hubFace.position.set(0, 0, 1.95);
      hub.add(hubFace);

      // Satélites (Nós de Execução do Workflow)
      var dadosNos = [
        { nome: 'WEBHOOK', cor: 0x35d0e5, emissive: 0x127b8f, ang: 0, r: 11.0 },
        { nome: 'LLM AI', cor: 0xba68c8, emissive: 0x6a1b9a, ang: 1.25, r: 10.5 },
        { nome: 'SUPABASE', cor: 0x3ecf8e, emissive: 0x14704b, ang: 2.5, r: 11.2 },
        { nome: 'WHATSAPP', cor: 0x25d366, emissive: 0x10632f, ang: 3.75, r: 10.8 },
        { nome: 'QA SUITE', cor: 0xffb74d, emissive: 0x945b08, ang: 5.0, r: 11.5 }
      ];

      var nos = [];
      var pacotes = [];
      var luzPacote = brilho('rgba(255,230,150,1)');

      dadosNos.forEach(function(d){
        var nx = Math.cos(d.ang) * d.r;
        var ny = Math.sin(d.ang) * d.r;
        var nz = (Math.sin(d.ang * 2)) * 1.5;

        var matNo = new T.MeshStandardMaterial({ color: d.cor, emissive: d.emissive, metalness: 0.7, roughness: 0.3 });
        var noMesh = new T.Mesh(caixaRed(3.4, 2.6, 2.0, 0.3), matNo);
        noMesh.position.set(nx, ny, nz);
        g.add(noMesh);

        var texNo = tex(tela(256, 128, function(ctx, w, h){
          ctx.fillStyle = '#060b14'; ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#e0a84f'; ctx.lineWidth = 6;
          ctx.strokeRect(8, 8, w - 16, h - 16);
          ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(d.nome, w / 2, h / 2);
        }), true);
        var label = new T.Mesh(new T.PlaneGeometry(3.0, 1.5), new T.MeshStandardMaterial({ map: texNo, roughness: 0.4 }));
        label.position.set(0, 0, 1.05);
        noMesh.add(label);

        var dist = Math.sqrt(nx * nx + ny * ny + nz * nz);
        var tuboGeo = new T.CylinderGeometry(0.12, 0.12, dist, 8);
        var matTubo = new T.MeshStandardMaterial({ color: 0x35d0e5, emissive: 0x0f4b59, transparent: true, opacity: 0.75 });
        var tubo = new T.Mesh(tuboGeo, matTubo);

        tubo.position.set(nx / 2, ny / 2, nz / 2);
        tubo.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(nx, ny, nz).normalize());
        g.add(tubo);

        var sp = sprite(luzPacote, 1.8);
        g.add(sp);

        nos.push({ mesh: noMesh, basePos: new T.Vector3(nx, ny, nz), ang: d.ang });
        pacotes.push({ sprite: sp, dest: new T.Vector3(nx, ny, nz), progresso: Math.random() });
      });

      var ondaShock = 0;
      return {
        grupo: g,
        escala: 0.95,
        cor: [224, 168, 79],
        atualizar: function(dt, t, giro){
          giro.rotation.y = Math.sin(t * 0.4) * 0.35;
          giro.rotation.x = 0.12 + Math.cos(t * 0.3) * 0.08;

          ondaShock = Math.max(0, ondaShock - dt * 2.0);

          for (var i = 0; i < nos.length; i++) {
            var n = nos[i];
            var flutua = Math.sin(t * 1.8 + n.ang) * 0.45;
            n.mesh.position.y = n.basePos.y + flutua;
          }

          for (var j = 0; j < pacotes.length; j++) {
            var p = pacotes[j];
            p.progresso = (p.progresso + dt * (0.85 + ondaShock * 1.5)) % 1;
            p.sprite.position.lerpVectors(new T.Vector3(0, 0, 0), p.dest, p.progresso);
            p.sprite.scale.setScalar(1.4 + Math.sin(p.progresso * Math.PI) * 0.8 + ondaShock * 0.6);
          }
        },
        evento: function(nome){
          if (nome === 'pulo' || nome === 'coleta') {
            ondaShock = 1.0;
          } else if (nome === 'soco' || nome === 'trofeu') {
            ondaShock = 1.5;
          }
        }
      };
    }

    /* ==========================================================
       PEÇA 3 · QA VERIFICATION SHIELD & TEST SUITE MATRIX
       Playwright / Cypress / Robot Framework / Automação E2E
       ========================================================== */
    function criarPecaQA(){
      var g = new T.Group();

      // Painel holográfico de fundo com bordas perfeitamente suaves
      var cvFundo = document.createElement('canvas');
      cvFundo.width = 1024; cvFundo.height = 680;
      var ctx3 = cvFundo.getContext('2d');
      var texFundo = new T.CanvasTexture(cvFundo);
      texFundo.encoding = T.sRGBEncoding;

      var img3 = new Image();
      img3.onload = function(){
        ctx3.drawImage(img3, 0, 0, cvFundo.width, cvFundo.height);
        ctx3.globalCompositeOperation = 'destination-in';
        var rad = ctx3.createRadialGradient(cvFundo.width/2, cvFundo.height/2, cvFundo.width * 0.22, cvFundo.width/2, cvFundo.height/2, cvFundo.width * 0.49);
        rad.addColorStop(0, 'rgba(0,0,0,0.92)');
        rad.addColorStop(0.7, 'rgba(0,0,0,0.55)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx3.fillStyle = rad;
        ctx3.fillRect(0, 0, cvFundo.width, cvFundo.height);
        ctx3.globalCompositeOperation = 'source-over';
        texFundo.needsUpdate = true;
        if (render) render.render(cena, camera);
      };
      img3.src = 'assets/fundo/opcao3_qa_shield.jpg';

      var matFundo = new T.MeshBasicMaterial({
        map: texFundo,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      });
      var quadro = new T.Mesh(new T.PlaneGeometry(36, 24), matFundo);
      quadro.position.set(0, 0, -4.5);
      g.add(quadro);

      // Escudo Hexagonal Central de QA
      var escudo = new T.Group();
      g.add(escudo);

      var matEscudoExt = new T.MeshStandardMaterial({ color: 0x142030, metalness: 0.95, roughness: 0.22 });
      var frameHex = new T.Mesh(new T.CylinderGeometry(9.5, 9.5, 1.4, 6), matEscudoExt);
      frameHex.rotation.x = Math.PI / 2;
      escudo.add(frameHex);

      var matBisel = new T.MeshStandardMaterial({ color: 0x3ecf8e, emissive: 0x167b51, metalness: 0.8, roughness: 0.25 });
      var biselHex = new T.Mesh(new T.CylinderGeometry(8.5, 8.5, 1.5, 6), matBisel);
      biselHex.rotation.x = Math.PI / 2;
      escudo.add(biselHex);

      var texEscudo = tex(tela(512, 512, function(ctx, w, h){
        ctx.fillStyle = '#061320'; ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(53, 208, 229, 0.25)';
        ctx.lineWidth = 2;
        for (var x = 0; x < w; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (var y = 0; y < h; y += 32) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        ctx.strokeStyle = '#49f2b8';
        ctx.lineWidth = 10;
        ctx.strokeRect(30, 30, w - 60, h - 60);

        ctx.fillStyle = '#49f2b8';
        ctx.font = 'bold 120px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', w / 2, 160);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px monospace';
        ctx.fillText('100% PASS', w / 2, 275);

        ctx.fillStyle = '#35d0e5';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('PLAYWRIGHT · CYPRESS · ROBOT', w / 2, 340);

        ctx.fillStyle = '#e0a84f';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('ZERO DEFECTS // CERTIFIED', w / 2, 400);
      }), true);

      var faceEscudo = new T.Mesh(new T.PlaneGeometry(12.0, 12.0), new T.MeshStandardMaterial({
        map: texEscudo,
        roughness: 0.35,
        metalness: 0.4
      }));
      faceEscudo.position.set(0, 0, 0.8);
      escudo.add(faceEscudo);

      var matAnel1 = new T.MeshStandardMaterial({ color: 0x35d0e5, emissive: 0x127b8f, metalness: 0.9, roughness: 0.2 });
      var anel1 = new T.Mesh(new T.TorusGeometry(12.2, 0.24, 16, 64), matAnel1);
      g.add(anel1);

      var matAnel2 = new T.MeshStandardMaterial({ color: 0x49f2b8, emissive: 0x14704b, metalness: 0.9, roughness: 0.2 });
      var anel2 = new T.Mesh(new T.TorusGeometry(13.8, 0.24, 16, 64), matAnel2);
      anel2.rotation.x = Math.PI / 3;
      g.add(anel2);

      var qtdP = 36;
      var posP = new Float32Array(qtdP * 3);
      var coresP = new Float32Array(qtdP * 3);
      var fasesP = [];

      for (var p = 0; p < qtdP; p++) {
        var ang = (p / qtdP) * Math.PI * 2;
        var r = 11.0 + Math.sin(p * 3) * 3.5;
        posP[p * 3] = Math.cos(ang) * r;
        posP[p * 3 + 1] = Math.sin(ang) * r * 0.7;
        posP[p * 3 + 2] = Math.sin(p * 5) * 4.0;
        coresP[p * 3] = 0.25; coresP[p * 3 + 1] = 0.95; coresP[p * 3 + 2] = 0.7;
        fasesP.push(Math.random() * Math.PI * 2);
      }

      var geoP = new T.BufferGeometry();
      geoP.setAttribute('position', new T.BufferAttribute(posP, 3));
      geoP.setAttribute('color', new T.BufferAttribute(coresP, 3));
      var partMat = new T.PointsMaterial({
        size: 0.9,
        map: tex(brilho('rgba(73,242,184,1)'), true),
        vertexColors: true,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false
      });
      var nuvemAsserts = new T.Points(geoP, partMat);
      g.add(nuvemAsserts);

      var velGiro = 0.5;
      var festa = 0;
      return {
        grupo: g,
        escala: 0.92,
        cor: [60, 230, 160],
        atualizar: function(dt, t, giro){
          festa = Math.max(0, festa - dt * 0.8);
          velGiro += (0.5 - velGiro) * Math.min(1, dt * 1.5);

          anel1.rotation.z += (velGiro + festa * 4.0) * dt;
          anel2.rotation.y += (-velGiro * 0.8 - festa * 3.0) * dt;

          escudo.position.y = Math.sin(t * 1.2) * 0.4;
          giro.rotation.y = Math.sin(t * 0.35) * 0.28;
          giro.rotation.x = 0.14 + Math.cos(t * 0.4) * 0.06;

          for (var i = 0; i < qtdP; i++) {
            var brilhoP = Math.pow(Math.max(0, Math.sin(t * 3.5 + fasesP[i])), 4) + festa * 0.9;
            coresP[i * 3] = 0.2 + brilhoP * 0.3;
            coresP[i * 3 + 1] = 0.8 + brilhoP * 0.2;
            coresP[i * 3 + 2] = 0.6 + brilhoP * 0.4;
          }
          geoP.attributes.color.needsUpdate = true;
        },
        evento: function(nome){
          if (nome === 'trofeu') {
            velGiro = 8.0; festa = 1.0;
          } else if (nome === 'pulo' || nome === 'coleta') {
            velGiro = Math.max(velGiro, 2.8);
            festa = Math.max(festa, 0.4);
          } else if (nome === 'soco') {
            festa = Math.max(festa, 0.6);
          }
        }
      };
    }

    /* ==========================================================
       PALCO: quando cada peça aparece, onde fica e como sai
       ========================================================== */
    var PECAS = [
      { criar: criarPecaTelecom, de: 1, ate: 2 },
      { criar: criarPecaAutomacao, de: 3, ate: 5 },
      { criar: criarPecaQA, de: 6, ate: 8 }
    ];
    var luzFundo = brilho('rgba(255,255,255,1)');

    PECAS.forEach(function(pc){
      pc.suporte = new T.Group();      // presença: sobe, desce, muda de lado
      pc.giro = new T.Group();         // a animação própria da peça
      pc.suporte.add(pc.giro);
      pc.suporte.visible = false;
      pc.halo = sprite(luzFundo, 70);
      pc.halo.position.z = -30;
      pc.halo.material.opacity = 0;
      pc.suporte.add(pc.halo);
      cena.add(pc.suporte);
      pc.presenca = 0; pc.x = 0; pc.pronta = false;
    });

    // monta uma peça por vez, sem travar o carregamento da página
    var fila = PECAS.slice();
    function montarProxima(){
      var pc = fila.shift();
      if (!pc) return;
      var p = pc.criar();
      pc.peca = p;
      var centro = new T.Box3().setFromObject(p.grupo).getCenter(new T.Vector3());
      p.grupo.position.sub(centro);
      pc.giro.add(p.grupo);
      pc.giro.scale.setScalar(p.escala);
      pc.halo.material.color.setRGB(p.cor[0] / 255, p.cor[1] / 255, p.cor[2] / 255);
      pc.pronta = true;
      (window.requestIdleCallback || function(f){ setTimeout(f, 30); })(montarProxima);
    }
    setTimeout(montarProxima, 60);

    var W = 0, H = 0;
    function medir(){
      W = window.innerWidth; H = window.innerHeight;
      var dpr = window.devicePixelRatio || 1;
      render.setPixelRatio(nivel === 'alto' ? Math.min(dpr, 1.5) : Math.min(dpr, 1) * 0.8);
      render.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', medir);
    medir();

    var mx = 0, my = 0;
    window.addEventListener('pointermove', function(e){
      mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    function suave(t){ t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

    var tempo = 0, antes = performance.now(), limpo = true, acumulado = 0;
    function laco(agora){
      requestAnimationFrame(laco);
      var dt = Math.min((agora - antes) / 1000, 0.05);
      antes = agora;
      if (document.hidden || nivel === 'baixo' || !PV.mundo || !PV.mundo.fases.length) return;
      if (nivel !== 'alto') {
        acumulado += dt;
        if (acumulado < 1 / 30) return;
        dt = Math.min(acumulado, 0.05); acumulado = 0;
      }
      tempo += semMovimento ? 0 : dt;

      var M = PV.mundo, c = window.scrollY + H / 2;
      var meiaAltura = Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
      var meiaLargura = meiaAltura * camera.aspect;
      var estreita = camera.aspect < 1;
      var faseAgora = M.fases[M.faseDe(c)];
      var lado = faseAgora && faseAgora.el.classList.contains('dir') ? -1 : 1;
      var algum = false;

      PECAS.forEach(function(pc){
        var fi = M.fases[pc.de], ff = M.fases[pc.ate];
        if (!fi || !ff || !pc.pronta) { pc.suporte.visible = false; pc.presenca = 0; return; }
        var entrada = suave((c - (fi.top - H * 0.55)) / (H * 0.85));
        var saida = suave(((ff.bottom + H * 0.45) - c) / (H * 0.85));
        pc.presenca = Math.min(entrada, saida);
        pc.suporte.visible = pc.presenca > 0.001;
        if (!pc.suporte.visible) return;
        algum = true;
        // sobe de baixo ao chegar e vai embora por cima ao passar, como se estivesse atrás da página
        var y = -(1 - entrada) * meiaAltura * 2.1 + (1 - saida) * meiaAltura * 2.1;
        var alvoX = estreita ? lado * meiaLargura * 0.28 : lado * meiaLargura * 0.5;
        pc.x += (alvoX - pc.x) * (1 - Math.exp(-dt * 1.6));
        pc.suporte.position.set(pc.x, y, 0);
        var esc = (estreita ? 0.62 : 1) * (0.86 + 0.14 * pc.presenca);
        pc.suporte.scale.setScalar(esc);
        pc.suporte.rotation.set(my * 0.25, mx * 0.5 + (1 - entrada) * 1.4 - (1 - saida) * 1.0, 0);
        pc.halo.material.opacity = pc.presenca * 0.32;
        pc.peca.atualizar(dt, tempo, pc.giro);
      });

      if (algum) { render.render(cena, camera); limpo = false; }
      else if (!limpo) { render.clear(); limpo = true; }
    }
    requestAnimationFrame(laco);

    return {
      qualidade: function(n){
        nivel = n;
        if (n === 'baixo') { render.clear(); limpo = true; cv.style.display = 'none'; }
        else { cv.style.display = ''; medir(); }
      },
      /* o jogo avisa o que aconteceu; a peça que estiver na tela reage */
      evento: function(nome){
        PECAS.forEach(function(pc){ if (pc.pronta && pc.presenca > 0.05) pc.peca.evento(nome); });
      },
      /* cor e força da peça mais presente, para o fundo mudar junto */
      tom: function(){
        var melhor = null;
        PECAS.forEach(function(pc){ if (pc.pronta && (!melhor || pc.presenca > melhor.presenca)) melhor = pc; });
        return melhor && melhor.presenca > 0.01 ? { cor: melhor.peca.cor, forca: melhor.presenca } : null;
      }
    };
  }

  return {
    /* o jogo avisa o que aconteceu; a peça que estiver na tela reage */
    evento: function(nome){ if (impl) impl.evento(nome); },
    /* cor e força da peça mais presente, para o fundo mudar junto */
    tom: function(){ return impl ? impl.tom() : null; }
  };
})();
