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

  // Sincronizar todos os sliders de mídia (Foto <-> Vídeo) com setas e dots
  const mediaContainers = document.querySelectorAll('.loja-media-slider-container');
  mediaContainers.forEach(container => {
    const slider = container.querySelector('.loja-media-slider');
    const dots = container.querySelectorAll('.loja-media-dots .media-dot');
    const hint = container.querySelector('.loja-media-zoom-hint');
    const prevArrow = container.querySelector('.loja-slider-arrow.arrow-prev');
    const nextArrow = container.querySelector('.loja-slider-arrow.arrow-next');
    const video = container.querySelector('video');
    const slides = container.querySelectorAll('.loja-media-slide');

    if (!slider) return;

    const updateSliderState = () => {
      const scrollLeft = slider.scrollLeft;
      const slideWidth = slider.offsetWidth || 1;
      const activeIdx = Math.round(scrollLeft / slideWidth);

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIdx);
      });

      if (prevArrow) {
        prevArrow.classList.toggle('disabled', activeIdx === 0);
      }
      if (nextArrow) {
        nextArrow.classList.toggle('disabled', activeIdx >= slides.length - 1);
      }

      if (hint) {
        if (activeIdx === 0) {
          hint.innerHTML = '&larr; Toque na seta ou deslize para ver o vídeo &rarr;';
        } else {
          hint.innerHTML = '&larr; Toque na seta para voltar à foto &rarr;';
        }
      }

      // Se voltar para a foto, pausa o vídeo automaticamente
      if (activeIdx === 0 && video && !video.paused) {
        video.pause();
      }
    };

    slider.addEventListener('scroll', updateSliderState, { passive: true });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        slider.scrollTo({
          left: idx * slider.offsetWidth,
          behavior: 'smooth'
        });
      });
    });

    if (prevArrow) {
      prevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        const slideWidth = slider.offsetWidth;
        const currentIdx = Math.round(slider.scrollLeft / slideWidth);
        const targetIdx = Math.max(0, currentIdx - 1);
        slider.scrollTo({ left: targetIdx * slideWidth, behavior: 'smooth' });
      });
    }

    if (nextArrow) {
      nextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        const slideWidth = slider.offsetWidth;
        const currentIdx = Math.round(slider.scrollLeft / slideWidth);
        const targetIdx = Math.min(slides.length - 1, currentIdx + 1);
        slider.scrollTo({ left: targetIdx * slideWidth, behavior: 'smooth' });
      });
    }

    updateSliderState();
  });

  // Sincronizar todos os carrosséis de planos com dots e setas laterais no mobile
  const planWraps = document.querySelectorAll('.loja-plans-carousel-wrap');
  planWraps.forEach(wrap => {
    const carousel = wrap.querySelector('.loja-plans-carousel');
    const prevArrow = wrap.querySelector('.plan-arrow-prev');
    const nextArrow = wrap.querySelector('.plan-arrow-next');
    const showcase = wrap.closest('.loja-details-col');
    const dotsContainer = showcase ? showcase.querySelector('.loja-carousel-dots') : wrap.nextElementSibling;
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    const cards = carousel ? carousel.querySelectorAll('.loja-plan-card') : [];

    if (!carousel || !cards.length) return;

    const updatePlanCarouselState = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = (cards[0] ? cards[0].offsetWidth : 280) + 14;
      const activeIndex = Math.max(0, Math.min(Math.round(scrollLeft / cardWidth), cards.length - 1));

      dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));

      if (prevArrow) {
        prevArrow.classList.toggle('disabled', activeIndex === 0);
      }
      if (nextArrow) {
        nextArrow.classList.toggle('disabled', activeIndex >= cards.length - 1);
      }
    };

    carousel.addEventListener('scroll', updatePlanCarouselState, { passive: true });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        if (cards[idx]) {
          cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });

    if (prevArrow) {
      prevArrow.addEventListener('click', () => {
        const cardWidth = (cards[0] ? cards[0].offsetWidth : 280) + 14;
        const currentIdx = Math.round(carousel.scrollLeft / cardWidth);
        const targetIdx = Math.max(0, currentIdx - 1);
        if (cards[targetIdx]) {
          cards[targetIdx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }

    if (nextArrow) {
      nextArrow.addEventListener('click', () => {
        const cardWidth = (cards[0] ? cards[0].offsetWidth : 280) + 14;
        const currentIdx = Math.round(carousel.scrollLeft / cardWidth);
        const targetIdx = Math.min(cards.length - 1, currentIdx + 1);
        if (cards[targetIdx]) {
          cards[targetIdx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }

    updatePlanCarouselState();
  });

  // Sincronizar carrossel de FAQ (Dúvidas Frequentes) no mobile
  const faqContainer = document.querySelector('.faq-carousel-container');
  if (faqContainer) {
    const faqGrid = faqContainer.querySelector('.faq-grid');
    const prevArrow = faqContainer.querySelector('.faq-arrow-prev');
    const nextArrow = faqContainer.querySelector('.faq-arrow-next');
    const dotsContainer = document.querySelector('.faq-carousel-dots');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    const cards = faqGrid ? faqGrid.querySelectorAll('.faq-card') : [];

    if (faqGrid && cards.length) {
      const updateFaqState = () => {
        const scrollLeft = faqGrid.scrollLeft;
        const cardWidth = (cards[0] ? cards[0].offsetWidth : 280) + 14;
        const activeIdx = Math.max(0, Math.min(Math.round(scrollLeft / cardWidth), cards.length - 1));

        dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));

        if (prevArrow) {
          prevArrow.classList.toggle('disabled', activeIdx === 0);
        }
        if (nextArrow) {
          nextArrow.classList.toggle('disabled', activeIdx >= cards.length - 1);
        }
      };

      faqGrid.addEventListener('scroll', updateFaqState, { passive: true });

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          if (cards[idx]) {
            cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      });

      if (prevArrow) {
        prevArrow.addEventListener('click', () => {
          const cardWidth = (cards[0] ? cards[0].offsetWidth : 280) + 14;
          const currentIdx = Math.round(faqGrid.scrollLeft / cardWidth);
          const targetIdx = Math.max(0, currentIdx - 1);
          if (cards[targetIdx]) {
            cards[targetIdx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      }

      if (nextArrow) {
        nextArrow.addEventListener('click', () => {
          const cardWidth = (cards[0] ? cards[0].offsetWidth : 280) + 14;
          const currentIdx = Math.round(faqGrid.scrollLeft / cardWidth);
          const targetIdx = Math.min(cards.length - 1, currentIdx + 1);
          if (cards[targetIdx]) {
            cards[targetIdx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      }

      updateFaqState();
    }
  }
});
