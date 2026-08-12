(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const grid = $('#listings-grid');
  const emptyBox = $('#listings-empty');
  const pagination = $('#pagination');

  const PER_PAGE = 6;
  const state = {
    pagina: 1,
    view: 'grid',
    status: 'Aluguel',
    busca: '',
    tipo: '',
    local: '',
    precoMin: 0,
    precoMax: Infinity,
    quartos: 0,
    sort: 'padrao',
    favoritos: Favoritos.read()
  };

  /* ============ FORMATAÇÃO ============ */
  function formatPrice(v) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 2, maximumFractionDigits: 2 });
  }

  /* ============ FILTROS ============ */
  function filtrar() {
    return IMOVEIS.filter(imovel => {
      if (state.status && imovel.status !== state.status) return false;
      if (state.busca) {
        const q = state.busca.toLowerCase();
        const alvo = (imovel.titulo + ' ' + imovel.tipo + ' ' + imovel.localizacao + ' ' + imovel.cidade).toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      if (state.tipo && imovel.tipo !== state.tipo) return false;
      if (state.local && imovel.cidade !== state.local) return false;
      if (imovel.preco < state.precoMin) return false;
      if (imovel.preco > state.precoMax) return false;
      if (imovel.quartos < state.quartos) return false;
      return true;
    });
  }

  function ordenar(lista) {
    const l = lista.slice();
    switch (state.sort) {
      case 'preco-asc': l.sort((a, b) => a.preco - b.preco); break;
      case 'preco-desc': l.sort((a, b) => b.preco - a.preco); break;
      case 'data-desc': l.sort((a, b) => new Date(b.data) - new Date(a.data)); break;
      case 'data-asc': l.sort((a, b) => new Date(a.data) - new Date(b.data)); break;
      case 'tipo': l.sort((a, b) => a.tipo.localeCompare(b.tipo)); break;
      default:
        l.sort((a, b) => a.id - b.id);
    }
    return l;
  }

  /* ============ RENDER ============ */
  function cardHTML(imovel, isFav) {
    const price = formatPrice(imovel.preco);
    return `
      <article class="property-card" data-id="${imovel.id}">
        <div class="property-thumb">
          <img src="${imovel.imagem}" alt="${imovel.titulo}" loading="lazy" onerror="this.src='https://via.placeholder.com/584x438/f7f8f9/b28e4a?text=Caetano+Im%C3%B3veis'" />
          <div class="property-badges">
            <span class="badge">${imovel.status}</span>
          </div>
          <div class="property-tools">
            <button class="prop-tool ${isFav ? 'favorited' : ''}" data-action="fav" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
              <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button class="prop-tool" data-action="view" title="Ver detalhes">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
        </div>
        <div class="property-body">
          <div class="property-price"><small>R$</small> ${price}${imovel.status === 'Aluguel' ? '<small> /mês</small>' : ''}</div>
          <h3 class="property-title">${imovel.titulo}</h3>
          <div class="property-location"><i class="fa-solid fa-location-dot"></i>${imovel.localizacao} - ${imovel.cidade}</div>
          <div class="property-amenities">
            ${imovel.quartos ? `<span><i class="fa-solid fa-bed"></i> ${imovel.quartos}</span>` : ''}
            ${imovel.banheiros ? `<span><i class="fa-solid fa-bath"></i> ${imovel.banheiros}</span>` : ''}
            ${imovel.garagem ? `<span><i class="fa-solid fa-car"></i> ${imovel.garagem}</span>` : ''}
            ${imovel.area ? `<span><i class="fa-solid fa-ruler-combined"></i> ${imovel.area} m²</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const filtrados = ordenar(filtrar());
    const total = filtrados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

    if (state.pagina > totalPaginas) state.pagina = totalPaginas;

    const inicio = (state.pagina - 1) * PER_PAGE;
    const pagina = filtrados.slice(inicio, inicio + PER_PAGE);

    $('#result-count').textContent = total;
    $('#result-range').textContent = total
      ? `Exibindo ${inicio + 1}–${Math.min(inicio + PER_PAGE, total)}`
      : '';

    $('#filters-active').textContent = '';
    const ativos = [];
    if (state.status) ativos.push(state.status);
    if (state.busca) ativos.push(`"${state.busca}"`);
    if (state.tipo) ativos.push(state.tipo);
    if (state.local) ativos.push(state.local);
    if (state.precoMin) ativos.push(`≥ R$ ${state.precoMin}`);
    if (Number.isFinite(state.precoMax)) ativos.push(`≤ R$ ${state.precoMax}`);
    if (state.quartos) ativos.push(`${state.quartos}+ quartos`);
    if (ativos.length) $('#filters-active').textContent = ' · ' + ativos.join(' · ');

    if (!total) {
      grid.style.display = 'none';
      emptyBox.style.display = 'block';
      pagination.innerHTML = '';
      return;
    }
    grid.style.display = 'grid';
    emptyBox.style.display = 'none';

    grid.className = 'listings-grid ' + (state.view === 'list' ? 'view-list' : '');
    grid.innerHTML = pagina.map(i => cardHTML(i, state.favoritos.includes(i.id))).join('');

    renderPaginacao(totalPaginas);

    $$('.switch-btn').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));

    const section = $('#imoveis');
    if (!section.querySelector('.section-tag')) return;
    const tag = section.querySelector('.section-tag');
    if (state.status === 'Venda') {
      tag.textContent = 'Venda';
      section.querySelector('h2').textContent = 'Imóveis à Venda';
    } else {
      tag.textContent = 'Aluguel';
      section.querySelector('h2').textContent = 'Imóveis para Alugar';
    }
  }

  function renderPaginacao(totalPaginas) {
    if (totalPaginas <= 1) {
      pagination.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= totalPaginas; i++) {
      html += `<button class="page-btn ${i === state.pagina ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    pagination.innerHTML = html;
  }

  function closeModal() {
    $$('.modal.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }

  $$('.modal .modal-backdrop, .modal .modal-close').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  /* ============ FAVORITOS ============ */
  function toggleFavorito(id) {
    state.favoritos = Favoritos.toggle(id);
    $('#fav-count').textContent = state.favoritos.length;
    render();
    const openFav = $('#fav-modal.open');
    if (openFav) renderFavoritos();
  }

  function renderFavoritos() {
    const body = $('#fav-modal-body');
    const favs = IMOVEIS.filter(i => state.favoritos.includes(i.id));
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
            <img src="${i.imagem}" alt="${i.titulo}" onerror="this.src='https://via.placeholder.com/120x85/f7f8f9/b28e4a?text=Caetano'" />
            <div class="fav-item-info">
              <h4><a href="imovel.html?id=${i.id}">${i.titulo}</a></h4>
              <div class="fav-loc"><i class="fa-solid fa-location-dot"></i> ${i.localizacao}</div>
              <div class="fav-price">R$ ${formatPrice(i.preco)}${i.status === 'Aluguel' ? '/mês' : ''}</div>
            </div>
            <button class="fav-remove" data-remove-fav="${i.id}" title="Remover"><i class="fa-solid fa-trash"></i></button>
          </div>
        `).join('')}
      </div>
    `;
  }

  $('#nav-fav-btn').addEventListener('click', function () {
    renderFavoritos();
    $('#fav-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  /* ============ EVENTOS (delegação) ============ */
  grid.addEventListener('click', e => {
    const card = e.target.closest('.property-card');
    if (!card) return;
    const id = Number(card.dataset.id);

    if (e.target.closest('[data-action="fav"]')) {
      toggleFavorito(id);
      return;
    }
    window.location.href = 'imovel.html?id=' + id;
  });

  $('#fav-modal-body').addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove-fav]');
    if (removeBtn) {
      toggleFavorito(Number(removeBtn.dataset.removeFav));
    }
  });

  pagination.addEventListener('click', e => {
    const btn = e.target.closest('.page-btn');
    if (!btn) return;
    state.pagina = Number(btn.dataset.page);
    render();
    scrollToImoveis();
  });

  /* ============ FORMULÁRIO DE BUSCA ============ */
  function applySearch() {
    state.busca = $('#f-busca').value.trim();
    state.tipo = $('#f-tipo').value;
    state.local = $('#f-local').value;
    state.quartos = Number($('#f-quartos').value) || 0;
    state.precoMin = Number($('#f-preco-min').value) || 0;
    state.precoMax = Number($('#f-preco-max').value) || Infinity;
    state.pagina = 1;
    render();
    scrollToImoveis();
  }

  $('#search-form').addEventListener('submit', e => {
    e.preventDefault();
    applySearch();
  });

  $('#btn-reset').addEventListener('click', resetFilters);

  function resetFilters() {
    $('#f-busca').value = '';
    $('#f-tipo').value = '';
    $('#f-local').value = '';
    $('#f-quartos').value = '0';
    $('#f-preco-min').value = '';
    $('#f-preco-max').value = '';
    state.busca = ''; state.tipo = ''; state.local = '';
    state.precoMin = 0; state.precoMax = Infinity; state.quartos = 0;
    state.pagina = 1;
    render();
  }
  window.resetFilters = resetFilters;

  /* ============ TABS STATUS ============ */
  $$('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.status = tab.dataset.status;
      state.pagina = 1;
      render();
    });
  });

  function setStatus(status) {
    state.status = status;
    $$('.search-tab').forEach(t => t.classList.toggle('active', t.dataset.status === status));
  }

  $$('[data-status="Venda"]').forEach(el => {
    el.addEventListener('click', () => {
      setStatus('Venda');
      state.pagina = 1;
      render();
    });
  });

  $$('[data-local]').forEach(el => {
    el.addEventListener('click', () => {
      $('#f-local').value = el.dataset.local;
      state.local = el.dataset.local;
      state.pagina = 1;
      render();
    });
  });

  /* ============ ORDENAÇÃO E VIEW ============ */
  $('#sort-select').addEventListener('change', e => {
    state.sort = e.target.value;
    state.pagina = 1;
    render();
  });

  $$('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      render();
    });
  });

  /* ============ NAVEGAÇÃO / SCROLL ============ */
  function scrollToImoveis() {
    const y = $('#imoveis').getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
  }

  const navToggle = $('#nav-toggle');
  const mobileMenu = $('#mobile-menu');
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    navToggle.querySelector('i').className = mobileMenu.classList.contains('open')
      ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.querySelector('i').className = 'fa-solid fa-bars';
  }));

  const sections = ['home', 'quem-somos', 'imoveis', 'financie', 'contato'];
  const headerLinks = $$('#main-nav a');
  window.addEventListener('scroll', () => {
    const pos = window.scrollY + 120;
    let current = '';
    sections.forEach(s => {
      const el = document.getElementById(s);
      if (el && el.offsetTop <= pos) current = s;
    });
    headerLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  });

  /* ============ FORM CONTATO → WHATSAPP ============ */
  $('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const nome = $('#c-nome').value.trim();
    const tel = $('#c-telefone').value.trim();
    const email = $('#c-email').value.trim();
    const interesse = $('#c-interesse').value;
    const msg = $('#c-mensagem').value.trim();
    const texto = `Olá! Meu nome é ${nome}.%0A%0A` +
      `Telefone: ${tel}%0A` +
      `E-mail: ${email}%0A` +
      `Interesse: ${interesse || 'Não informado'}%0A%0A` +
      `Mensagem: ${msg.replace(/\n/g, '%0A')}`;
    window.open(`https://api.whatsapp.com/send/?phone=5562985070819&text=${texto}`, '_blank');
    e.target.reset();
  });

  /* ============ CONTADORES ANIMADOS ============ */
  function animateCount(el) {
    const target = Number(el.dataset.count);
    const dur = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const statsSection = $('.stats');
  let statsDone = false;
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting && !statsDone) {
        statsDone = true;
        $$('.stat-num').forEach(animateCount);
      }
    });
  }, { threshold: 0.4 });
  statsObserver.observe(statsSection);

  /* ============ SCROLL REVEAL ============ */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.about, .contact, .financie, .stats, .listings .section-head').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /* ============ INICIALIZAÇÃO ============ */
  $('#year').textContent = new Date().getFullYear();
  $('#fav-count').textContent = state.favoritos.length;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  render();
})();
