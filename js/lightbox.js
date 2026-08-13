(function () {
  'use strict';

  var box = null;
  var imgs = [];
  var idx = 0;
  var titulo = '';

  function build() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<div class="lightbox-backdrop"></div>' +
      '<button class="lightbox-close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>' +
      '<button class="lightbox-prev" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button class="lightbox-next" aria-label="Próxima"><i class="fa-solid fa-chevron-right"></i></button>' +
      '<figure class="lightbox-figure">' +
      '  <img class="lightbox-img" alt="" />' +
      '  <figcaption class="lightbox-caption"></figcaption>' +
      '</figure>' +
      '<span class="lightbox-count"></span>';
    document.body.appendChild(box);

    box.querySelector('.lightbox-backdrop').addEventListener('click', close);
    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', function () { go(idx - 1); });
    box.querySelector('.lightbox-next').addEventListener('click', function () { go(idx + 1); });

    var startX = 0;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'ArrowRight') go(idx + 1);
    });

    return box;
  }

  function show() {
    var img = box.querySelector('.lightbox-img');
    img.src = (typeof otimizarImagem === 'function') ? otimizarImagem(imgs[idx], 1600) : imgs[idx];
    img.alt = (titulo ? titulo + ' - ' : '') + 'Foto ' + (idx + 1);
    box.querySelector('.lightbox-count').textContent = (idx + 1) + ' / ' + imgs.length;
    box.querySelector('.lightbox-caption').textContent = titulo + ' · ' + (idx + 1) + ' de ' + imgs.length;
    preloadNear();
  }

  var preloaded = {};
  function optim(u) {
    return (typeof otimizarImagem === 'function') ? otimizarImagem(u, 1600) : u;
  }
  function preloadOne(u) {
    if (!u || preloaded[u]) return;
    preloaded[u] = true;
    var im = new Image();
    im.src = u;
  }
  function preloadNear() {
    var total = imgs.length;
    if (total < 2) return;
    var vizinhos = total === 2 ? [idx - 1] : [idx - 1, idx + 1];
    vizinhos.forEach(function (n) {
      var real = ((n % total) + total) % total;
      if (real === idx) return;
      preloadOne(optim(imgs[real]));
    });
  }

  function go(n) {
    var total = imgs.length;
    if (!total) return;
    idx = ((n % total) + total) % total;
    show();
  }

  function open(fotos, start, caption) {
    imgs = (Array.isArray(fotos) ? fotos.filter(Boolean) : [fotos]).filter(Boolean);
    if (!imgs.length) return;
    titulo = caption || '';
    idx = Math.max(0, Number(start) || 0);
    if (idx >= imgs.length) idx = 0;
    build();
    show();
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!box) return;
    box.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.Lightbox = { open: open, close: close };
})();
