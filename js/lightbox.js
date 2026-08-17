(function () {
  'use strict';

  var box = null;
  var media = [];
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
      '  <div class="lightbox-media"></div>' +
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
    var holder = box.querySelector('.lightbox-media');
    holder.innerHTML = '';
    var m = media[idx];
    var num = (idx + 1);
    if (m.tipo === 'video') {
      var v = document.createElement('video');
      v.className = 'lightbox-video';
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'metadata';
      v.src = (typeof otimizarVideo === 'function') ? otimizarVideo(m.url, 1280) : m.url;
      holder.appendChild(v);
      box.querySelector('.lightbox-count').textContent = num + ' / ' + media.length;
      box.querySelector('.lightbox-caption').textContent = titulo + ' · Vídeo ' + num + ' de ' + media.length;
    } else {
      var img = document.createElement('img');
      img.className = 'lightbox-img';
      img.alt = (titulo ? titulo + ' - ' : '') + 'Foto ' + num;
      img.src = (typeof otimizarImagem === 'function') ? otimizarImagem(m.url, 1600) : m.url;
      holder.appendChild(img);
      box.querySelector('.lightbox-count').textContent = num + ' / ' + media.length;
      box.querySelector('.lightbox-caption').textContent = titulo + ' · ' + num + ' de ' + media.length;
      preloadNear();
    }
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
    var total = media.length;
    if (total < 2) return;
    var vizinhos = total === 2 ? [idx - 1] : [idx - 1, idx + 1];
    vizinhos.forEach(function (n) {
      var real = ((n % total) + total) % total;
      if (real === idx) return;
      if (media[real].tipo === 'video') return;
      preloadOne(optim(media[real].url));
    });
  }

  function go(n) {
    var total = media.length;
    if (!total) return;
    idx = ((n % total) + total) % total;
    show();
  }

  function norm(item) {
    if (typeof item === 'string') return { tipo: 'foto', url: item };
    return { tipo: (item && item.tipo === 'video') ? 'video' : 'foto', url: item && item.url };
  }

  function open(mediaIn, start, caption) {
    var arr = Array.isArray(mediaIn) ? mediaIn : [mediaIn];
    media = arr.map(norm).filter(function (m) { return m.url; });
    if (!media.length) return;
    titulo = caption || '';
    idx = Math.max(0, Number(start) || 0);
    if (idx >= media.length) idx = 0;
    build();
    show();
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!box) return;
    var video = box.querySelector('.lightbox-video');
    if (video) video.pause();
    box.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.Lightbox = { open: open, close: close };
})();
