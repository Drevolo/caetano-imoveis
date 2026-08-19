(function () {
  'use strict';

  var ERR_IMG = "this.onerror=null;this.src='https://via.placeholder.com/584x438/f7f8f9/b28e4a?text=Caetano+Im%C3%B3veis'";

  function fotosDe(imovel) {
    var arr = Array.isArray(imovel.fotos) ? imovel.fotos.filter(Boolean) : [];
    return arr.length ? arr : [imovel.imagem];
  }

  // Mídia combinada para a galeria do detalhe: fotos primeiro, depois vídeos.
  // Retorna uma lista de { tipo: 'foto' | 'video', url }.
  function mediaDe(imovel) {
    var midia = [];
    fotosDe(imovel).forEach(function (u) {
      if (u) midia.push({ tipo: 'foto', url: u });
    });
    (Array.isArray(imovel.videos) ? imovel.videos.filter(Boolean) : []).forEach(function (u) {
      midia.push({ tipo: 'video', url: u });
    });
    return midia;
  }

  function cardThumb(imovel) {
    var fotos = fotosDe(imovel).map(function (u) { return otimizarImagem(u, 640); });
    if (fotos.length === 1) {
      return '<img src="' + fotos[0] + '" alt="' + escapeHtml(imovel.titulo) + '" loading="lazy" onerror="' + ERR_IMG + '" />';
    }
    var slides = fotos.map(function (u, i) {
      return '<img class="prop-slide' + (i === 0 ? ' active' : '') + '" src="' + u + '" alt="' + escapeHtml(imovel.titulo) + ' - Foto ' + (i + 1) + '" loading="lazy" onerror="' + ERR_IMG + '" data-index="' + i + '" />';
    }).join('');
    return '<div class="prop-carousel" data-total="' + fotos.length + '">' +
      '<div class="prop-slides">' + slides + '</div>' +
      '<button class="carousel-prev" data-carousel="prev" aria-label="Foto anterior"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button class="carousel-next" data-carousel="next" aria-label="Próxima foto"><i class="fa-solid fa-chevron-right"></i></button>' +
      '<span class="carousel-count">1/' + fotos.length + '</span>' +
      '</div>';
  }

  function showSlide(container, idx) {
    var slides = container.querySelectorAll('.prop-slide');
    if (!slides.length) return;
    var total = slides.length;
    idx = ((idx % total) + total) % total;
    slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
    var count = container.querySelector('.carousel-count');
    if (count) count.textContent = (idx + 1) + '/' + total;
    container.dataset.index = idx;
  }

  function cardHTML(imovel, isFav, opts) {
    opts = opts || {};
    var p = precoFormatado(imovel.preco);
    var favTitle = isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    var viewBtn = opts.viewBtn
      ? '<button class="prop-tool" data-action="view" title="Ver detalhes"><i class="fa-solid fa-magnifying-glass"></i></button>'
      : '';
    var loc = escapeHtml(imovel.localizacao);
    if (imovel.bairro) loc += ', ' + escapeHtml(imovel.bairro);
    loc += ' - ' + escapeHtml(imovel.cidade);
    var am = '';
    if (imovel.quartos) am += '<span><i class="fa-solid fa-bed"></i> ' + imovel.quartos + '</span>';
    if (imovel.suites) am += '<span><i class="fa-solid fa-door-open"></i> ' + imovel.suites + '</span>';
    if (imovel.banheiros) am += '<span><i class="fa-solid fa-bath"></i> ' + imovel.banheiros + '</span>';
    if (imovel.garagem) am += '<span><i class="fa-solid fa-car"></i> ' + imovel.garagem + '</span>';
    if (imovel.area != null && imovel.area !== 0) am += '<span><i class="fa-solid fa-ruler-combined"></i> ' + imovel.area + ' m²</span>';
    return '<article class="property-card" data-id="' + imovel.id + '">' +
      '<div class="property-thumb">' + cardThumb(imovel) +
        '<div class="property-badges"><span class="badge">' + escapeHtml(imovel.status) + '</span></div>' +
        '<div class="property-tools">' +
          '<button class="prop-tool' + (isFav ? ' favorited' : '') + '" data-action="fav" title="' + favTitle + '"><i class="' + (isFav ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i></button>' +
          viewBtn +
        '</div>' +
      '</div>' +
      '<div class="property-body">' +
        '<div class="property-price"><small>R$</small> ' + p + (imovel.status === 'Aluguel' ? '<small> /mês</small>' : '') + '</div>' +
        '<h3 class="property-title">' + escapeHtml(imovel.titulo) + '</h3>' +
        '<div class="property-location"><i class="fa-solid fa-location-dot"></i>' + loc + '</div>' +
        '<div class="property-amenities">' + am + '</div>' +
      '</div>' +
    '</article>';
  }

  function setupCarousels(container, paused) {
    container.querySelectorAll('.prop-carousel').forEach(function (c) {
      c.dataset.index = 0;
      c.addEventListener('mouseenter', function () { paused.current = true; });
      c.addEventListener('mouseleave', function () { paused.current = false; });
    });
  }

  function autoAdvance(selector, paused, interval) {
    return setInterval(function () {
      if (paused.current) return;
      document.querySelectorAll(selector + ' .prop-carousel').forEach(function (c) {
        showSlide(c, Number(c.dataset.index || 0) + 1);
      });
    }, interval || 3500);
  }

  function skeletonCardHTML() {
    return '<article class="skeleton-card">' +
      '<div class="skeleton skeleton-thumb"></div>' +
      '<div class="skeleton-body">' +
        '<div class="skeleton skeleton-text h20 w60"></div>' +
        '<div class="skeleton skeleton-text h28 w80"></div>' +
        '<div class="skeleton skeleton-text w60"></div>' +
        '<div class="skeleton-amenities">' +
          '<div class="skeleton skeleton-text"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function skeletonGridHTML(count) {
    var html = '';
    for (var i = 0; i < (count || 6); i++) html += skeletonCardHTML();
    return html;
  }

  function skeletonDetailHTML() {
    return '<div class="container pd-hero">' +
      '<div class="skeleton skeleton-detail-hero"></div>' +
    '</div>' +
    '<div class="container pd-grid">' +
      '<div class="pd-main">' +
        '<div class="skeleton skeleton-detail-price"></div>' +
        '<div class="skeleton skeleton-detail-title"></div>' +
        '<div class="skeleton skeleton-detail-location"></div>' +
        '<div class="skeleton-detail-amenities">' +
          '<div class="skeleton skeleton-detail-amenity"></div>' +
          '<div class="skeleton skeleton-detail-amenity"></div>' +
          '<div class="skeleton skeleton-detail-amenity"></div>' +
          '<div class="skeleton skeleton-detail-amenity"></div>' +
        '</div>' +
        '<div class="skeleton-detail-box">' +
          '<div class="skeleton skeleton-text h28 w60"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
          '<div class="skeleton skeleton-text w80"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
          '<div class="skeleton skeleton-text w60"></div>' +
        '</div>' +
      '</div>' +
      '<aside class="pd-side">' +
        '<div class="skeleton-detail-box">' +
          '<div class="skeleton skeleton-text h28 w80"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
          '<div class="skeleton skeleton-text w60"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
        '</div>' +
      '</aside>' +
    '</div>';
  }

  function skeletonAdminItemHTML() {
    return '<div class="skeleton-admin-item">' +
      '<div class="skeleton skeleton-admin-thumb"></div>' +
      '<div class="skeleton-admin-info">' +
        '<div class="skeleton skeleton-text w60" style="height:16px;"></div>' +
        '<div class="skeleton skeleton-text w80" style="height:12px;"></div>' +
      '</div>' +
    '</div>';
  }

  function skeletonAdminListHTML(count) {
    var html = '';
    for (var i = 0; i < (count || 5); i++) html += skeletonAdminItemHTML();
    return html;
  }

  window.Cards = {
    fotosDe: fotosDe,
    mediaDe: mediaDe,
    cardThumb: cardThumb,
    showSlide: showSlide,
    cardHTML: cardHTML,
    skeletonCardHTML: skeletonCardHTML,
    skeletonGridHTML: skeletonGridHTML,
    skeletonDetailHTML: skeletonDetailHTML,
    skeletonAdminItemHTML: skeletonAdminItemHTML,
    skeletonAdminListHTML: skeletonAdminListHTML,
    setupCarousels: setupCarousels,
    autoAdvance: autoAdvance
  };
})();
