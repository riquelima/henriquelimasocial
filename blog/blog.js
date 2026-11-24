/**
 * HENRIQUE LIMA · CADERNO TÉCNICO // SCRIPT DO BLOG
 * Carousel Viewer, Reading Progress Bar & Suporte Bilíngue
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Galeria Interativa dos Carrosséis (Suporte a múltiplos carrosséis) ---
  document.querySelectorAll('.carousel-showcase-box').forEach(box => {
    const carouselImg = box.querySelector('.carousel-viewport img');
    const carouselCounter = box.querySelector('.carousel-counter') || box.querySelector('#carouselCounter');
    const navButtons = box.querySelectorAll('.carousel-dot-btn');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const slideFile = btn.getAttribute('data-slide');
        const slideIdx = btn.getAttribute('data-idx');

        if (carouselImg && slideFile) {
          // Transição suave
          carouselImg.style.opacity = '0.4';
          setTimeout(() => {
            carouselImg.src = `/blog/assets/${slideFile}`;
            carouselImg.style.opacity = '1';
          }, 120);
        }

        if (carouselCounter && slideIdx) {
          carouselCounter.textContent = `Slide ${slideIdx} de ${navButtons.length}`;
        }
      });
    });
  });

  // --- 2. Barra de Progresso de Leitura ---
  const progressBar = document.getElementById('readingProgressBar');
  window.addEventListener('scroll', () => {
    if (progressBar) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        const progress = (window.scrollY / total) * 100;
        progressBar.style.width = `${progress}%`;
      }
    }
  });

  // --- 3. Dicionário de Idioma (PT / EN) ---
  const I18N = {
    pt: {
      nav_projects: 'PROJETOS',
      btn_return_game: 'JOGAR CURRÍCULO',
      post_badge: 'GUIA PRÁTICO // ENGENHARIA DE PRODUTO EM 48H',
      post_title: 'Você não precisa de meses para criar ferramentas lucrativas com IA. Dá pra construir cada uma dessas 7 soluções em um único fim de semana.',
      post_lead: 'A maioria das pessoas passa semanas perdida em cursos teóricos sem nunca colocar um produto na mão de um cliente. Enquanto isso, quem aprende a conectar três ferramentas certas cria um produto funcional em 48 horas e fecha contratos de <strong>R$ 1.500 a R$ 5.000</strong>. Veja abaixo o mapa completo de cada uma das 7 ferramentas, quais tecnologias usar (com links) e o passo a passo para construir no próximo final de semana.',
      author_name: 'HENRIQUE LIMA • QA & AI ARCHITECT',
      author_bio: 'Engenheiro de Qualidade de Software, especialista em automação e arquiteto de agentes de IA. Documento nos meus canais soluções de alto valor em código aberto, sem rodeios ou teorias vazias.',
      yt_hint: 'Vídeos práticos com código aberto'
    },
    en: {
      nav_projects: 'PROJECTS',
      btn_return_game: 'PLAY RESUME',
      post_badge: 'PRACTICAL GUIDE // 48-HOUR PRODUCT ENGINEERING',
      post_title: 'You don\'t need months to build profitable AI tools. You can build every single one of these 7 solutions in a single weekend.',
      post_lead: 'Most people spend weeks stuck in theory without ever launching a product for real clients. Meanwhile, those who know how to connect the right three tools build working MVPs in 48 hours and close deals from <strong>$300 to $1,000+</strong>. Here is the full breakdown of all 7 tools, software links, and the weekend execution roadmap.',
      author_name: 'HENRIQUE LIMA • QA & AI ARCHITECT',
      author_bio: 'Software QA Engineer, automation specialist, and AI agent architect. Documenting production-tested engineering solutions in open code.',
      yt_hint: 'Practical videos with open source code'
    }
  };

  let currentLang = localStorage.getItem('hl_idioma') || 'pt';

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('hl_idioma', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[lang] && I18N[lang][key]) {
        el.innerHTML = I18N[lang][key];
      }
    });

    const langPt = document.getElementById('langPt');
    const langEn = document.getElementById('langEn');
    if (lang === 'en') {
      langEn?.classList.add('active');
      langPt?.classList.remove('active');
      document.documentElement.lang = 'en';
    } else {
      langPt?.classList.add('active');
      langEn?.classList.remove('active');
      document.documentElement.lang = 'pt-BR';
    }
  }

  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      applyLanguage(currentLang === 'pt' ? 'en' : 'pt');
    });
  }

  applyLanguage(currentLang);

  // --- 4. Carrossel de Cards 16:9 de Posts com Scroll Lateral & Transição Suave do Post ---
  const cardsTrack = document.getElementById('blogCardsTrack');
  const postCards = document.querySelectorAll('.blog-post-card');
  const cardDots = document.querySelectorAll('.card-dot');

  function updateCardState(activeTargetId) {
    postCards.forEach(card => {
      const isTarget = card.getAttribute('data-post-target') === activeTargetId;
      card.classList.toggle('active', isTarget);

      const activeBadge = card.querySelector('[data-active-label]');
      if (activeBadge) {
        activeBadge.style.display = isTarget ? 'inline-flex' : 'none';
      }

      const actionText = card.querySelector('.action-text');
      if (actionText) {
        actionText.textContent = isTarget ? 'DESLIZAR PARA O POST' : 'LER ARTIGO';
      }
    });

    // Atualizar dots
    cardDots.forEach((dot, idx) => {
      const associatedCard = postCards[idx];
      const isTarget = associatedCard && associatedCard.getAttribute('data-post-target') === activeTargetId;
      dot.classList.toggle('active', isTarget);
    });
  }

  function switchPostView(targetId, targetUrl, pushState = true) {
    const currentView = document.querySelector('.post-article-view.active');
    const targetView = document.getElementById(targetId);

    if (!targetView) {
      if (targetUrl) window.location.href = targetUrl;
      return;
    }

    // Se já é o post ativo, apenas desliza suavemente até o início da leitura
    if (currentView === targetView) {
      const anchor = document.getElementById('post-conteudo');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Atualiza estado visual dos cards imediatamente
    updateCardState(targetId);

    // Animação suave de saída do post atual
    if (currentView) {
      currentView.classList.add('fading-out');
    }

    setTimeout(() => {
      if (currentView) {
        currentView.classList.remove('active', 'fading-out');
      }

      // Ativa o novo post com animação suave de entrada
      targetView.classList.add('active');

      // Atualiza URL e Título da Página
      if (targetId === 'post-view-remoto') {
        document.title = "20 sites secretos para ganhar em dólar trabalhando remoto · Henrique Lima";
        if (pushState) history.pushState({ postId: targetId }, '', '/blog/index.html');
      } else if (targetId === 'post-view-mcp') {
        document.title = "Intelektus Landing Pages: O MCP que Transforma seu Claude Code em uma Máquina de Criar Sites de Alta Conversão · Henrique Lima";
        if (pushState) history.pushState({ postId: targetId }, '', '/blog/mcp-landing-pages-claude-code.html');
      } else if (targetId === 'post-view-claude') {
        document.title = "O Claude agora edita no próprio editor do Instagram para Mac: Como configurar em 4 passos via MCP · Henrique Lima";
        if (pushState) history.pushState({ postId: targetId }, '', '/blog/claude-edits-instagram-mac.html');
      } else if (targetId === 'post-view-7ferramentas') {
        document.title = "7 Ferramentas Lucrativas com IA para Criar num Final de Semana · Henrique Lima";
        if (pushState) history.pushState({ postId: targetId }, '', '/blog/7-ferramentas-lucrativas-ia.html');
      }

      // Desliza suavemente até o post abaixo dos cards
      const anchor = document.getElementById('post-conteudo');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 180);
  }

  // Intercepta cliques nos cards da vitrine
  postCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Permite abrir em nova aba com Ctrl/Cmd/Shift
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      e.preventDefault();
      const targetId = card.getAttribute('data-post-target');
      const targetUrl = card.getAttribute('href');
      if (targetId) {
        switchPostView(targetId, targetUrl, true);
      }
    });
  });

  // Intercepta botões de navegação no rodapé dos posts
  document.querySelectorAll('[data-switch-to]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const targetId = btn.getAttribute('data-switch-to');
      const targetUrl = btn.getAttribute('href');
      if (targetId) {
        switchPostView(targetId, targetUrl, true);
      }
    });
  });

  // Suporte aos botões Voltar / Avançar do navegador
    window.addEventListener('popstate', (e) => {
    if (e.state && e.state.postId) {
      switchPostView(e.state.postId, null, false);
    } else {
      const path = window.location.pathname;
      if (path.includes('mcp-landing-pages')) {
        switchPostView('post-view-mcp', null, false);
      } else if (path.includes('7-ferramentas')) {
        switchPostView('post-view-7ferramentas', null, false);
      } else if (path.includes('claude-edits')) {
        switchPostView('post-view-claude', null, false);
      } else {
        switchPostView('post-view-remoto', null, false);
      }
    }
  });

  // Atualização dos dots indicadores conforme o usuário roda lateralmente no mobile
  if (cardsTrack && cardDots.length > 0) {
    cardsTrack.addEventListener('scroll', () => {
      const scrollLeft = cardsTrack.scrollLeft;
      const cardWidth = cardsTrack.querySelector('.blog-post-card')?.offsetWidth || 280;
      const activeIdx = Math.min(cardDots.length - 1, Math.max(0, Math.round(scrollLeft / cardWidth)));

      cardDots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    }, { passive: true });

    cardDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        const targetCard = postCards[idx];
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        }
      });
    });
  }

  // Verifica rota na chegada
  const currentPath = window.location.pathname;
  if (currentPath.includes('mcp-landing-pages')) {
    switchPostView('post-view-mcp', null, false);
  } else if (currentPath.includes('7-ferramentas')) {
    switchPostView('post-view-7ferramentas', null, false);
  } else if (currentPath.includes('claude-edits')) {
    switchPostView('post-view-claude', null, false);
  } else if (currentPath.includes('20-sites')) {
    switchPostView('post-view-remoto', null, false);
  }

  // No mobile, se o card ativo não for o primeiro, posiciona nele
  const activePostCard = document.querySelector('.blog-post-card.active');
  if (activePostCard && cardsTrack && window.innerWidth <= 768) {
    const cardIndex = Array.from(postCards).indexOf(activePostCard);
    if (cardIndex > 0) {
      setTimeout(() => {
        activePostCard.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
      }, 50);
    }
  }

  // Se a URL contém #post-conteudo na chegada, desliza suavemente até o post
  if (window.location.hash === '#post-conteudo') {
    setTimeout(() => {
      const targetAnchor = document.getElementById('post-conteudo');
      if (targetAnchor) {
        targetAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }
});
