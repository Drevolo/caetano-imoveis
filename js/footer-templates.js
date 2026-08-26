(function () {
  'use strict';

  // page: 'index' | 'imovel' | 'admin' — define o prefixo dos links
  function footerHTML(page) {
    var p = page || 'index';
    var prefix = p === 'index' ? '' : 'index.html';

    function link(href, text, dataAttr) {
      var a = prefix + href;
      var extra = dataAttr ? ' ' + dataAttr : '';
      return '<li><a href="' + a + '"' + extra + '>' + text + '</a></li>';
    }

    return `
  <footer class="site-footer">
    <div class="container footer-grid grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
      <div class="footer-col footer-about">
        <img src="https://caetanoimoveis.com.br/wp-content/uploads/2026/01/logomarca-caetano-1.png" alt="Caetano Imóveis" onerror="this.style.display='none'" />
        <p>Imobiliária em Goianésia - GO com tradição e confiança no mercado de aluguel e venda de imóveis.</p>
        <div class="footer-social">
          <a href="https://www.facebook.com/caetanoimoveisgoianesia" target="_blank" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/caetanoimoveisgoianesia/" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://api.whatsapp.com/send/?phone=5562985070819" target="_blank" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Cidade</h4>
        <ul>
          ${link('#imoveis', 'Goianésia', 'data-local="Goianésia"')}
          ${link('#imoveis', 'Uruaçu', 'data-local="Uruaçu"')}
          ${link('#imoveis', 'Souzalândia', 'data-local="Souzalândia"')}
          ${link('#imoveis', 'Barro Alto', 'data-local="Barro Alto"')}
          ${link('#imoveis', 'Cirilândia', 'data-local="Cirilândia"')}
          ${link('#imoveis', 'Padre Bernardo', 'data-local="Padre Bernardo"')}
          ${link('#imoveis', 'Artulândia', 'data-local="Artulândia"')}
          ${link('#imoveis', 'Porangatu', 'data-local="Porangatu"')}
        </ul>
      </div>
      <div class="footer-col">
        <h4>Navegação</h4>
        <ul>
          ${link('#home', 'Home')}
          ${link('#quem-somos', 'Quem Somos')}
          ${link('#imoveis', 'Aluguel')}
          ${link('#imoveis', 'Venda', 'data-status="Venda"')}
          ${link('#financie', 'Financie')}
          ${link('#contato', 'Contato')}
          ${link('admin.html', 'Painel Administrativo')}
        </ul>
      </div>
      <div class="footer-col">
        <h4>Fale Conosco</h4>
        <ul class="footer-contact">
          <li><i class="fa-solid fa-location-dot"></i> R. 29, 365 Centro - Goianésia - GO</li>
          <li><i class="fa-solid fa-phone"></i> <a href="tel:+5562985070819">(62) 98507-0819</a></li>
          <li><i class="fa-solid fa-phone"></i> <a href="tel:+5562984158065">(62) 98415-8065</a></li>
          <li><i class="fa-solid fa-envelope"></i> <a href="mailto:contato@caetanoimoveis.com.br">contato@caetanoimoveis.com.br</a></li>
          <li><i class="fa-solid fa-clock"></i> 07:30 - 17:00 · Seg-Sex</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">
        &copy; <span id="year"></span> Caetano Imóveis - Todos os direitos reservados.
        <span class="footer-credit">Desenvolvido por <a href="https://drevolo.github.io/portfolio/" target="_blank" rel="noopener">Gabriel Barros Miranda</a></span>
      </div>
    </div>
  </footer>`;
  }

  window.FooterTemplates = { html: footerHTML };
})();
