/**
 * INTELEKTUS · LOJA DE PRODUTOS & AUTOMAÇÕES IA
 * Gerenciador de Checkout & Integração WhatsApp
 * Telefone Oficial: 5571999088651
 */

// ==========================================================
// CONFIGURAÇÃO DOS LINKS DE PAGAMENTO
// Cole aqui seus links de checkout conforme forem gerados.
// Se o link estiver vazio (''), o botão abrirá diretamente
// o WhatsApp com a mensagem do pedido pronta para pagamento via Pix/Cartão!
// ==========================================================
const CHECKOUT_LINKS = {
  // Produto 1: +150 Templates Premium Prontos (R$ 39,90)
  'templates-ia': '',

  // Produto 2: Venda no Direct no Automático
  'direct-solo': '', // R$ 67/mês
  'direct-pro': '',  // R$ 127/mês
  'direct-vip': '',  // R$ 297

  // Produto 3: Poste em +30 Redes no Automático
  'post-solo': '',   // R$ 47/mês
  'post-pro': '',    // R$ 97/mês
  'post-vip': ''     // R$ 197
};

const WHATSAPP_PHONE = '5571999088651';

const PRODUCT_NAMES = {
  'templates-ia': '+150 Templates Premium Prontos (R$ 39,90 Vitalício)',
  'direct-solo': 'Venda no Direct no Automático - Plano Solo (R$ 67/mês)',
  'direct-pro': 'Venda no Direct no Automático - Plano PRO (R$ 127/mês)',
  'direct-vip': 'Venda no Direct no Automático - Setup VIP (R$ 297)',
  'post-solo': 'Poste em +30 Redes no Automático - Plano Solo (R$ 47/mês)',
  'post-pro': 'Poste em +30 Redes no Automático - Plano PRO (R$ 97/mês)',
  'post-vip': 'Poste em +30 Redes no Automático - Setup VIP (R$ 197)'
};

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar botões de checkout
  const checkoutButtons = document.querySelectorAll('.btn-checkout');

  checkoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.getAttribute('data-product');
      const checkoutUrl = CHECKOUT_LINKS[productId];

      if (checkoutUrl && checkoutUrl.trim().startsWith('http')) {
        // Redirecionar para o link de pagamento
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback elegante: Abrir WhatsApp para finalizar o pedido com o Henrique
        const productName = PRODUCT_NAMES[productId] || 'Produto da Loja Intelektus';
        const msg = `Olá Henrique! Gostaria de adquirir o *${productName}*. Pode me enviar o link de pagamento?`;
        const wppUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
        window.open(wppUrl, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // Lightbox / Zoom das artes do produto (apenas fotos, ignora vídeos)
  const mediaFrames = document.querySelectorAll('.loja-media-frame:not(.video-frame)');
  const lightbox = document.getElementById('lojaLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  if (mediaFrames.length && lightbox && lightboxImg) {
    mediaFrames.forEach(frame => {
      frame.style.cursor = 'zoom-in';
      frame.addEventListener('click', () => {
        const img = frame.querySelector('img');
        if (img) {
          lightboxImg.src = img.src;
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
  }

  // Sincronizar slider de mídia (Foto <-> Vídeo) do produto de Templates
  const templatesSlider = document.getElementById('templatesSlider');
  const templatesDots = document.querySelectorAll('#templatesMediaDots .media-dot');
  const templatesHint = document.getElementById('templatesMediaHint');
  const templatesVideo = document.getElementById('templatesVideo');

  if (templatesSlider && templatesDots.length) {
    templatesSlider.addEventListener('scroll', () => {
      const scrollLeft = templatesSlider.scrollLeft;
      const slideWidth = templatesSlider.offsetWidth || 1;
      const activeIdx = Math.round(scrollLeft / slideWidth);

      templatesDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIdx);
      });

      if (templatesHint) {
        if (activeIdx === 0) {
          templatesHint.innerHTML = '&larr; Deslize para ver o vídeo &rarr;';
        } else {
          templatesHint.innerHTML = '&larr; Deslize para ver a foto &rarr;';
        }
      }

      // Se o usuário voltar para o slide da foto, pausa o vídeo automaticamente
      if (activeIdx === 0 && templatesVideo && !templatesVideo.paused) {
        templatesVideo.pause();
      }
    }, { passive: true });

    templatesDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        const slideWidth = templatesSlider.offsetWidth;
        templatesSlider.scrollTo({
          left: idx * slideWidth,
          behavior: 'smooth'
        });
      });
    });
  }

  // Sincronizar dots dos carrosséis de planos no mobile
  const carousels = document.querySelectorAll('.loja-plans-carousel');
  carousels.forEach(carousel => {
    const dotsContainer = carousel.nextElementSibling;
    if (!dotsContainer || !dotsContainer.classList.contains('loja-carousel-dots')) return;
    const dots = dotsContainer.querySelectorAll('.dot');
    const cards = carousel.querySelectorAll('.loja-plan-card');

    carousel.addEventListener('scroll', () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = (cards[0] ? cards[0].offsetWidth : 260) + 14;
      const activeIndex = Math.max(0, Math.min(Math.round(scrollLeft / cardWidth), dots.length - 1));
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
    }, { passive: true });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        if (cards[idx]) {
          cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  });
});
