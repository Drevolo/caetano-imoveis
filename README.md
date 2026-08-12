# Caetano Imóveis

Site institucional e vitrine de imóveis da Caetano Imóveis (Goianésia - GO), hospedado no GitHub Pages.

## Estrutura

```
.
├── index.html      # Página principal (hero, busca, listagens, quem somos, financie, contato)
├── imovel.html     # Página de detalhe do imóvel (carregado via JS)
├── css/
│   └── style.css   # Estilos do site + regras responsivas
├── js/
│   ├── imoveis.js   # Dados dos imóveis (vetor IMOVEIS)
│   ├── main.js      # Busca, filtros, ordenação, favoritos e listagens (index)
│   ├── detalhe.js   # Renderização do detalhe do imóvel (imovel.html)
│   ├── header.js    # Header que colapsa ao rolar a página
│   └── favoritos.js # Persistência de favoritos (localStorage)
└── images/favicon/  # Favicons
```

## Responsividade (Tailwind CSS)

O site usa o **Tailwind CSS via CDN** para o layout responsivo. O script é carregado no `<head>` de cada página:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { corePlugins: { preflight: false } };
</script>
```

- `corePlugins.preflight: false` mantém o reset próprio do `css/style.css`, evitando conflitos com os estilos existentes.
- As classes utilitárias (ex.: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) controlam os grids em diferentes larguras de tela e têm prioridade sobre as regras antigas do `style.css` (o `<style>` gerado pelo Tailwind é injetado depois do `link` do CSS).
- Os pontos de quebra usados seguem o padrão do Tailwind: `sm` (640px), `md` (768px), `lg` (1024px) e `xl` (1280px).

Layouts convertidos para Tailwind:

- Cabeçalho (topo + contatos)
- Formulário de busca (`search-form`)
- Grades de imóveis (`listings-grid`, incluindo a grade gerada por JS)
- Seções de estatísticas, quem somos, financie e contato
- Rodapé

## Cabeçalho

O contato por telefone reúne os números de **Aluguel** e **Vendas** empilhados um abaixo do outro sob o mesmo ícone de telefone, como no site original:

```html
<div class="header-contact-item">
  <i class="fa-solid fa-phone"></i>
  <div class="header-contact-lines">
    <a href="tel:+5562985070819">(62) 98507-0819 <span class="hcl-label">Aluguel</span></a>
    <a href="tel:+5562985739405">(62) 98573-9405 <span class="hcl-label">Vendas</span></a>
  </div>
</div>
```

No mobile, os itens de endereço, horário e redes sociais ficam ocultos e a navegação é substituída pelo menu hambúrguer.

## Publicação (GitHub Pages)

As páginas estáticas são servidas a partir da branch `main`. Após alterações:

```bash
git add .
git commit -m "Descrição das alterações"
git push origin main
```

## Contatos

- Aluguel: (62) 98507-0819
- Vendas: (62) 98573-9405
- E-mail: contato@caetanoimoveis.com.br
