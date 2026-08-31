document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const carousel = document.querySelector('.carrossel');

  let currentIndex = 0;
  let autoPlayTimer = null;
  const TEMPO_TROCA = 4000; 

  function atualizarCarrossel(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentIndex = index;
  }

  function proximoSlide() {
    const proximoIndex = (currentIndex + 1) % slides.length;
    atualizarCarrossel(proximoIndex);
  }

  function slideAnterior() {
    const anteriorIndex = (currentIndex - 1 + slides.length) % slides.length;
    atualizarCarrossel(anteriorIndex);
  }

  function iniciarAutoPlay() {
    pararAutoPlay();
    autoPlayTimer = setInterval(proximoSlide, TEMPO_TROCA);
  }

  function pararAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
    }
  }

  // Controles dos botões de navegação
  nextBtn.addEventListener('click', () => {
    proximoSlide();
    iniciarAutoPlay();
  });

  prevBtn.addEventListener('click', () => {
    slideAnterior();
    iniciarAutoPlay();
  });

  // Controles dos pontos
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      atualizarCarrossel(index);
      iniciarAutoPlay();
    });
  });

  // Pausa o carrossel ao passar o mouse por cima
  carousel.addEventListener('mouseenter', pararAutoPlay);
  carousel.addEventListener('mouseleave', iniciarAutoPlay);

  // Inicializa o carrossel
  iniciarAutoPlay();
});