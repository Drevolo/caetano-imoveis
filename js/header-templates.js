(function () {
  'use strict';

  // page: 'index' | 'imovel' | 'admin' — define o prefixo dos links
  function headerHTML(page) {
    var p = page || 'index';
    var prefix = p === 'index' ? '' : 'index.html';

    function link(href, text, attrs) {
      var a = prefix + href;
      return '<li><a href="' + a + '"' + (attrs || '') + '>' + text + '</a></li>';
    }

    return `
    <header class="site-header" id="site-header">
      <div class="header-top">
        <div class="container header-top-inner flex flex-wrap items-center justify-between gap-4 xl:gap-6">
          <a href="${prefix}#home" class="logo">
            <img src="https://caetanoimoveis.com.br/wp-content/uploads/2026/01/logomarca-caetano-1.png" alt="Caetano Imóveis" onerror="this.style.display='none';document.getElementById('logo-text').style.display='flex';" />
            <span id="logo-text" style="display:none">Caetano <strong>Imóveis</strong></span>
          </a>
          <div class="header-contacts flex items-center gap-4 lg:gap-6 flex-wrap">
            <div class="header-contact-item">
              <i class="fa-solid fa-phone"></i>
              <div class="header-contact-lines">
                <a href="tel:+5562985070819">(62) 98507-0819 <span class="hcl-label">Aluguel</span></a>
                <a href="tel:+5562984158065">(62) 98415-8065 <span class="hcl-label">Vendas</span></a>
              </div>
            </div>
            <div class="header-contact-item hidden lg:flex">
              <i class="fa-solid fa-location-dot"></i>
              <div class="header-contact-lines">
                <span>R. 29, 365 Centro</span>
                <span>Goianésia - GO</span>
              </div>
            </div>
            <div class="header-contact-item hidden lg:flex">
              <i class="fa-solid fa-clock"></i>
              <div class="header-contact-lines">
                <span>07:30 - 17:00</span>
                <span>Seg-Sex</span>
              </div>
            </div>
            <div class="header-social hidden lg:flex">
              <a href="https://www.facebook.com/caetanoimoveisgoianesia" target="_blank" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="https://www.instagram.com/caetanoimoveisgoianesia/" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
              <a href="https://api.whatsapp.com/send/?phone=5562985070819" target="_blank" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
          </div>
        </div>
      </div>

      <nav class="header-bottom">
        <div class="container nav-inner">
          <ul class="main-nav" id="main-nav">
            ${link('#home', 'Home')}
            ${link('#quem-somos', 'Quem Somos')}
            ${link('#imoveis', 'Aluguel')}
            ${link('#imoveis', 'Venda', ' data-status="Venda"')}
            ${link('#financie', 'Financie')}
            ${link('#contato', 'Contato')}
          </ul>
          <div class="nav-actions">
            <a href="${prefix}#contato" class="btn btn-gold btn-criar-listagem hide-md">
              <i class="fa-solid fa-plus"></i> Criar uma Listagem
            </a>
            <button class="nav-fav" id="nav-fav-btn" aria-label="Favoritos" title="Meus Favoritos">
              <i class="fa-regular fa-heart"></i>
              <span class="fav-count" id="fav-count">0</span>
            </button>
            <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menu">
              <i class="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </nav>

      <div class="mobile-menu" id="mobile-menu">
        <ul class="main-nav">
          ${link('#home', 'Home')}
          ${link('#quem-somos', 'Quem Somos')}
          ${link('#imoveis', 'Aluguel')}
          ${link('#imoveis', 'Venda', ' data-status="Venda"')}
          ${link('#financie', 'Financie')}
          ${link('#contato', 'Contato')}
        </ul>
        <a href="${prefix}#contato" class="btn btn-gold btn-criar-listagem">
          <i class="fa-solid fa-plus"></i> Criar uma Listagem
        </a>
      </div>
    </header>`;
  }

  window.HeaderTemplates = { html: headerHTML };
})();
