(function () {
  'use strict';

  const header = document.getElementById('site-header');
  if (!header) return;

  const LIMIAR_COLAPSAR = 120;
  const LIMIAR_PROXIMO = 10;
  const LIMIAR_FUNDO = 200;

  let ultimoY = window.scrollY;
  let direcao = 0;

  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    const dy = y - ultimoY;
    if (Math.abs(dy) < LIMIAR_PROXIMO) return;

    direcao = dy > 0 ? 1 : -1;
    ultimoY = y;

    const fimPagina = document.documentElement.scrollHeight - window.innerHeight;
    const colapsar = direcao === 1 && y > LIMIAR_COLAPSAR && y < fimPagina - LIMIAR_FUNDO;
    header.classList.toggle('scrolled', colapsar);
  });
})();
