/**
 * HENRIQUE LIMA · CADERNO TÉCNICO // SCRIPT DO BLOG
 * Carousel Viewer, Reading Progress Bar & Suporte Bilíngue
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Galeria Interativa do Carrossel Instagram ---
  const carouselImg = document.getElementById('carouselSlideImg');
  const carouselCounter = document.getElementById('carouselCounter');
  const navButtons = document.querySelectorAll('.carousel-dot-btn');

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
      langEn.classList.add('active');
      langPt.classList.remove('active');
      document.documentElement.lang = 'en';
    } else {
      langPt.classList.add('active');
      langEn.classList.remove('active');
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
});
