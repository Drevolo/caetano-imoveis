(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));

  const app = $('#property-detail');
  if (!app) return;

  const WA_PHONE = '5562985070819';

  /* ============ FOTOS (com fallback para a capa) ============ */
  function fotosDe(item) {
    const arr = Array.isArray(item.fotos) ? item.fotos.filter(Boolean) : [];
    return arr.length ? arr : [item.imagem];
  }

  const ERR_HERO = "this.onerror=null;this.src='https://via.placeholder.com/1200x520/f7f8f9/b28e4a?text=Caetano+Im%C3%B3veis'";
  const ERR_THUMB = "this.onerror=null;this.src='https://via.placeholder.com/120x85/f7f8f9/b28e4a?text=Caetano'";

  function galeriaHTML(item) {
    const gal = fotosDe(item);
    const main = `<img class="pd-gallery-img active" id="pd-gallery-img" src="${otimizarImagem(gal[0], 1280)}" alt="${item.titulo}" onerror="${ERR_HERO}" />`;
    if (gal.length === 1) return `<div class="pd-gallery"><div class="pd-gallery-main">${main}</div></div>`;
    return `
      <div class="pd-gallery">
        <div class="pd-gallery-main" id="pd-gallery-main">
          ${main}
          <button class="pd-gallery-prev" id="pd-gallery-prev" aria-label="Foto anterior"><i class="fa-solid fa-chevron-left"></i></button>
          <button class="pd-gallery-next" id="pd-gallery-next" aria-label="Próxima foto"><i class="fa-solid fa-chevron-right"></i></button>
          <span class="pd-gallery-count" id="pd-gallery-count">1 / ${gal.length}</span>
        </div>
        <div class="pd-gallery-thumbs" id="pd-gallery-thumbs">
          ${gal.map((u, i) =>
            `<button class="pd-gallery-thumb${i === 0 ? ' active' : ''}" data-thumb="${i}" aria-label="Foto ${i + 1}">
              <img src="${otimizarImagem(u, 200)}" alt="${item.titulo} - Foto ${i + 1}" loading="lazy" onerror="${ERR_THUMB}" />
            </button>`).join('')}
        </div>
      </div>`;
  }

  /* ============ EXTRAS ============ */
  function initExtras() {
    $('#year').textContent = new Date().getFullYear();
    $('#fav-count').textContent = Favoritos.read().length;

    const navToggle = $('#nav-toggle');
    const mobileMenu = $('#mobile-menu');
    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        navToggle.querySelector('i').className = mobileMenu.classList.contains('open')
          ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      });
      $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navToggle.querySelector('i').className = 'fa-solid fa-bars';
      }));
    }

    window.scrollTo({ top: 0 });
  }

  carregarImoveis().then(function () {
    const imovel = IMOVEIS.find(i => i.id === id);

    /* ============ IMÓVEL NÃO ENCONTRADO ============ */
    if (!imovel) {
      app.innerHTML = `
        <div class="pd-notfound">
          <i class="fa-solid fa-house-circle-xmark"></i>
          <h2>Imóvel não encontrado</h2>
          <p>O imóvel que você procura pode ter sido removido ou o link está incorreto.</p>
          <a href="index.html#imoveis" class="btn btn-gold"><i class="fa-solid fa-arrow-left"></i> Voltar para os imóveis</a>
        </div>
      `;
      const related = $('#pd-related');
      if (related) related.closest('.pd-related').style.display = 'none';
      initExtras();
      return;
    }

    document.title = imovel.titulo + ' | Caetano Imóveis';

    const price = precoFormatado(imovel.preco);
    const waMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel "${imovel.titulo}" (${imovel.localizacao} - ${imovel.cidade}) anunciado no site da Caetano Imóveis.`);
    const enderecoMapa = (imovel.localizacao || '') + ', ' + (imovel.bairro ? imovel.bairro + ', ' : '') + imovel.cidade + ' - GO';
    const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(enderecoMapa);
    const mapsEmbedUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(enderecoMapa) + '&output=embed';

    /* ============ RENDER PRINCIPAL ============ */
    app.innerHTML = `
      <nav class="breadcrumb container">
        <a href="index.html">Home</a>
        <i class="fa-solid fa-angle-right"></i>
        <a href="index.html#imoveis">${imovel.status}</a>
        <i class="fa-solid fa-angle-right"></i>
        <span>${imovel.titulo}</span>
      </nav>

      <div class="container pd-hero">
        ${galeriaHTML(imovel)}
        <span class="badge">${imovel.status}</span>
      </div>

      <div class="container pd-grid">
        <div class="pd-main">
          <div class="pd-head">
            <div class="pd-price"><small>R$</small> ${price}${imovel.status === 'Aluguel' ? '<small> /mês</small>' : ''}</div>
            <h1>${imovel.titulo}</h1>
            <div class="pd-location"><i class="fa-solid fa-location-dot"></i> ${imovel.localizacao}${imovel.bairro ? ', ' + imovel.bairro : ''} - ${imovel.cidade}</div>
          </div>

          <div class="pd-amenities">
            ${imovel.quartos ? `<div class="m-amenity"><i class="fa-solid fa-bed"></i><strong>${imovel.quartos}</strong><span>Quartos</span></div>` : ''}
            ${imovel.suites ? `<div class="m-amenity"><i class="fa-solid fa-door-open"></i><strong>${imovel.suites}</strong><span>Suítes</span></div>` : ''}
            ${imovel.banheiros ? `<div class="m-amenity"><i class="fa-solid fa-bath"></i><strong>${imovel.banheiros}</strong><span>Banheiros</span></div>` : ''}
            ${imovel.garagem ? `<div class="m-amenity"><i class="fa-solid fa-car"></i><strong>${imovel.garagem}</strong><span>Vagas</span></div>` : ''}
            ${imovel.area ? `<div class="m-amenity"><i class="fa-solid fa-ruler-combined"></i><strong>${imovel.area} m²</strong><span>Área</span></div>` : ''}
            ${imovel.mobiliado ? `<div class="m-amenity"><i class="fa-solid fa-couch"></i><strong>Sim</strong><span>Mobiliado</span></div>` : ''}
          </div>

          <div class="pd-box">
            <h2>Sobre este imóvel</h2>
            <p class="pd-desc">${imovel.descricao}</p>
            <ul class="pd-facts">
              <li><span>Categoria:</span> ${imovel.categoria || '-'}</li>
              <li><span>Tipo de imóvel:</span> ${imovel.tipo}</li>
              <li><span>Finalidade:</span> ${imovel.status}</li>
              <li><span>Cidade:</span> ${imovel.cidade}</li>
              <li><span>Bairro:</span> ${imovel.bairro || '-'}</li>
              <li><span>Localização:</span> ${imovel.localizacao || '-'}</li>
              ${imovel.condominio ? `<li><span>Condomínio:</span> R$ ${precoFormatado(imovel.condominio)}</li>` : ''}
              ${imovel.iptu ? `<li><span>IPTU:</span> R$ ${precoFormatado(imovel.iptu)}</li>` : ''}
              <li><span>Referência:</span> ${imovel.referencia || '#' + imovel.id}</li>
            </ul>
          </div>

          <div class="pd-box">
            <h2>Localização</h2>
            <p class="pd-desc">${imovel.localizacao}${imovel.bairro ? ', ' + imovel.bairro : ''} - ${imovel.cidade}</p>
            <div class="pd-map">
              <iframe src="${mapsEmbedUrl}" title="Mapa de ${imovel.titulo}" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
            <p class="pd-map-link">
              <a href="${mapsUrl}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir no Google Maps</a>
            </p>
          </div>
        </div>

        <aside class="pd-side">
          <div class="pd-contact">
            <h3>Gostou deste imóvel?</h3>
            <p>Fale com a nossa equipe e agende uma visita sem compromisso.</p>
            <a class="btn btn-whatsapp" href="https://api.whatsapp.com/send/?phone=${WA_PHONE}&text=${waMsg}" target="_blank">
              <i class="fa-brands fa-whatsapp"></i> Tenho interesse
            </a>
            <a class="btn btn-reset" href="tel:+5562985070819"><i class="fa-solid fa-phone"></i> (62) 98507-0819</a>
            <button class="btn btn-outline-gold" id="pd-fav-btn" type="button"></button>
          </div>
          <div class="pd-card">
            <i class="fa-solid fa-building"></i>
            <h4>Caetano Imóveis</h4>
            <p><i class="fa-solid fa-location-dot"></i> R. 29, 365 Centro - Goianésia - GO</p>
            <p><i class="fa-solid fa-phone"></i> <a href="tel:+5562985070819">(62) 98507-0819</a></p>
            <p><i class="fa-solid fa-envelope"></i> <a href="mailto:contato@caetanoimoveis.com.br">contato@caetanoimoveis.com.br</a></p>
            <p><i class="fa-solid fa-clock"></i> 07:30 - 17:00 · Seg-Sex</p>
          </div>
          <a class="btn btn-gold btn-full" href="index.html#imoveis"><i class="fa-solid fa-arrow-left"></i> Ver outros imóveis</a>
        </aside>
      </div>
    `;

    /* ============ GALERIA ============ */
    const galFotos = fotosDe(imovel);
    const galMain = $('#pd-gallery-img');
    const galCount = $('#pd-gallery-count');
    let galIdx = 0;
    let galTimer = null;

    function showGallery(idx) {
      const n = galFotos.length;
      if (!n || !galMain) return;
      galIdx = ((idx % n) + n) % n;
      galMain.src = otimizarImagem(galFotos[galIdx], 1280);
      galMain.classList.add('active');
      if (galCount) galCount.textContent = (galIdx + 1) + ' / ' + n;
      $$('.pd-gallery-thumb').forEach((t, i) => t.classList.toggle('active', i === galIdx));
    }

    function startGalTimer() {
      stopGalTimer();
      galTimer = setInterval(() => showGallery(galIdx + 1), 4000);
    }
    function stopGalTimer() {
      if (galTimer) { clearInterval(galTimer); galTimer = null; }
    }

    const prevBtn = $('#pd-gallery-prev');
    const nextBtn = $('#pd-gallery-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { showGallery(galIdx - 1); startGalTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { showGallery(galIdx + 1); startGalTimer(); });

    $$('.pd-gallery-thumb').forEach(t => {
      t.addEventListener('click', () => { showGallery(Number(t.dataset.thumb)); startGalTimer(); });
    });

    if (galMain) {
      const holder = galMain.closest('.pd-gallery-main');
      if (holder) {
        holder.addEventListener('mouseenter', stopGalTimer);
        holder.addEventListener('mouseleave', startGalTimer);
      }
    }
    if (galFotos.length > 1) startGalTimer();

    /* ============ FAVORITAR ============ */
    const favBtn = $('#pd-fav-btn');
    function refreshFavBtn() {
      if (!favBtn) return;
      const on = Favoritos.read().includes(imovel.id);
      favBtn.classList.toggle('favorited', on);
      favBtn.innerHTML = `<i class="${on ? 'fa-solid' : 'fa-regular'} fa-heart"></i> ${on ? 'Favoritado' : 'Favoritar'}`;
    }
    refreshFavBtn();
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        Favoritos.toggle(imovel.id);
        $('#fav-count').textContent = Favoritos.read().length;
        refreshFavBtn();
      });
    }

    /* ============ CARD (reuso) ============ */
    function cardHTML(item, isFav) {
      const p = precoFormatado(item.preco);
      return `
        <article class="property-card" data-id="${item.id}">
          <div class="property-thumb">
            <img src="${otimizarImagem(item.imagem, 640)}" alt="${item.titulo}" loading="lazy" onerror="this.src='https://via.placeholder.com/584x438/f7f8f9/b28e4a?text=Caetano+Im%C3%B3veis'" />
            <div class="property-badges">
              <span class="badge">${item.status}</span>
            </div>
            <div class="property-tools">
              <button class="prop-tool ${isFav ? 'favorited' : ''}" data-action="fav" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
          </div>
          <div class="property-body">
            <div class="property-price"><small>R$</small> ${p}${item.status === 'Aluguel' ? '<small> /mês</small>' : ''}</div>
            <h3 class="property-title">${item.titulo}</h3>
            <div class="property-location"><i class="fa-solid fa-location-dot"></i>${item.localizacao}${item.bairro ? ', ' + item.bairro : ''} - ${item.cidade}</div>
            <div class="property-amenities">
              ${item.quartos ? `<span><i class="fa-solid fa-bed"></i> ${item.quartos}</span>` : ''}
              ${item.suites ? `<span><i class="fa-solid fa-door-open"></i> ${item.suites}</span>` : ''}
              ${item.banheiros ? `<span><i class="fa-solid fa-bath"></i> ${item.banheiros}</span>` : ''}
              ${item.garagem ? `<span><i class="fa-solid fa-car"></i> ${item.garagem}</span>` : ''}
              ${item.area ? `<span><i class="fa-solid fa-ruler-combined"></i> ${item.area} m²</span>` : ''}
            </div>
          </div>
        </article>
      `;
    }

    /* ============ RELACIONADOS ============ */
    function renderRelated() {
      const box = $('#pd-related');
      if (!box) return;
      const rel = IMOVEIS
        .filter(i => i.id !== imovel.id)
        .map(i => ({ i, mesmaCidade: i.cidade === imovel.cidade ? 1 : 0, mesmoTipo: i.tipo === imovel.tipo ? 1 : 0 }))
        .sort((a, b) => (b.mesmaCidade - a.mesmaCidade) || (b.mesmoTipo - a.mesmoTipo))
        .map(o => o.i)
        .slice(0, 3);
      if (!rel.length) {
        const sec = box.closest('.pd-related');
        if (sec) sec.style.display = 'none';
        return;
      }
      box.innerHTML = rel.map(i => cardHTML(i, Favoritos.read().includes(i.id))).join('');
    }
    renderRelated();

    const relatedBox = $('#pd-related');
    if (relatedBox) {
      relatedBox.addEventListener('click', e => {
        const card = e.target.closest('.property-card');
        if (!card) return;
        const iid = Number(card.dataset.id);
        if (e.target.closest('[data-action="fav"]')) {
          Favoritos.toggle(iid);
          $('#fav-count').textContent = Favoritos.read().length;
          renderRelated();
          const openFav = $('#fav-modal.open');
          if (openFav) renderFavoritosModal();
          return;
        }
        window.location.href = 'imovel.html?id=' + iid;
      });
    }

    /* ============ MODAL FAVORITOS ============ */
    function renderFavoritosModal() {
      const body = $('#fav-modal-body');
      if (!body) return;
      const favs = IMOVEIS.filter(i => Favoritos.read().includes(i.id));
      if (!favs.length) {
        body.innerHTML = `
          <div class="fav-list">
            <h3>Meus Favoritos</h3>
            <div class="fav-empty">
              <i class="fa-regular fa-heart"></i>
              <p>Você ainda não favoritou nenhum imóvel.<br />Toque no coração de um imóvel para salvá-lo aqui.</p>
            </div>
          </div>
        `;
        return;
      }
      body.innerHTML = `
        <div class="fav-list">
          <h3>Meus Favoritos (${favs.length})</h3>
          ${favs.map(i => `
            <div class="fav-item">
              <img src="${otimizarImagem(i.imagem, 320)}" alt="${i.titulo}" onerror="this.src='https://via.placeholder.com/120x85/f7f8f9/b28e4a?text=Caetano'" />
              <div class="fav-item-info">
                <h4><a href="imovel.html?id=${i.id}">${i.titulo}</a></h4>
                <div class="fav-loc"><i class="fa-solid fa-location-dot"></i> ${i.localizacao}</div>
                <div class="fav-price">R$ ${precoFormatado(i.preco)}${i.status === 'Aluguel' ? '/mês' : ''}</div>
              </div>
              <button class="fav-remove" data-remove-fav="${i.id}" title="Remover"><i class="fa-solid fa-trash"></i></button>
            </div>
          `).join('')}
        </div>
      `;
    }

    $('#nav-fav-btn').addEventListener('click', function () {
      renderFavoritosModal();
      $('#fav-modal').classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    $$('.modal .modal-backdrop, .modal .modal-close').forEach(el => {
      el.addEventListener('click', closeModal);
    });

    $('#fav-modal-body').addEventListener('click', e => {
      const removeBtn = e.target.closest('[data-remove-fav]');
      if (removeBtn) {
        Favoritos.toggle(Number(removeBtn.dataset.removeFav));
        $('#fav-count').textContent = Favoritos.read().length;
        renderFavoritosModal();
        renderRelated();
      }
    });

    function closeModal() {
      $$('.modal.open').forEach(m => m.classList.remove('open'));
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    initExtras();
  });
})();
