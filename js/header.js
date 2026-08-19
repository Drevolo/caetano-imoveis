(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var LIMIAR_COLAPSAR = 120;
  var LIMIAR_PROXIMO = 10;
  var LIMIAR_FUNDO = 200;

  var ultimoY = window.scrollY;
  var direcao = 0;

  window.addEventListener('scroll', throttle(function () {
    var y = window.scrollY;
    var dy = y - ultimoY;
    if (Math.abs(dy) < LIMIAR_PROXIMO) return;

    direcao = dy > 0 ? 1 : -1;
    ultimoY = y;

    var fimPagina = document.documentElement.scrollHeight - window.innerHeight;
    var colapsar = direcao === 1 && y > LIMIAR_COLAPSAR && y < fimPagina - LIMIAR_FUNDO;
    header.classList.toggle('scrolled', colapsar);
  }, 50));
})();
