# Caetano Imóveis

Site institucional e vitrine de imóveis da Caetano Imóveis (Goianésia - GO), hospedado no GitHub Pages.

## Arquitetura

- **Supabase** (Postgres + Auth): armazena os imóveis (apenas texto/URLs) e controla o login do admin.
- **Cloudinary**: hospeda todas as imagens e vídeos com otimização automática (WebP/AVIF, redimensionamento, compressão de vídeo).
- **GitHub Pages**: serve o site estático. O `js/imoveis.js` local funciona como **fallback offline** e como base inicial de dados.

Fluxo de leitura: a página tenta carregar os imóveis do Supabase; se o banco estiver fora do ar, usa o `js/imoveis.js` com as galerias de `js/fotos-migradas.json` (Cloudinary) aplicadas por cima, para o fallback manter todas as fotos.

## Estrutura

```
.
├── index.html      # Página principal (hero, busca, listagens, quem somos, financie, contato)
├── imovel.html     # Página de detalhe do imóvel (carregado via JS)
├── admin.html      # Painel admin (login, CRUD, upload de fotos/vídeos, importação/migração)
├── css/style.css   # Estilos do site + regras responsivas
├── js/
│   ├── config.js      # Configurações: Supabase URL/anon key, Cloudinary cloud/preset
│   ├── imoveis.js     # Dados dos imóveis (fallback / base local)
│   ├── imoveis-api.js # Carrega imóveis do Supabase (com fallback local + galerias migradas)
│   ├── cards.js       # Funções compartilhadas de card, carrossel de fotos e mídia combinada (index + detalhe)
│   ├── main.js        # Busca, filtros, ordenação, favoritos e listagens (index)
│   ├── detalhe.js     # Renderização do detalhe do imóvel (imovel.html)
│   ├── lightbox.js    # Visualizador fullscreen de fotos e vídeos
│   ├── header.js      # Header que colapsa ao rolar a página
│   ├── favoritos.js   # Persistência de favoritos (localStorage)
│   └── admin.js       # Lógica do painel admin
├── sql/setup.sql   # Script de criação da tabela imoveis + políticas RLS (já inclui a coluna videos)
├── sql/migrar-videos.sql  # Migração para instalações existentes (adiciona a coluna videos)
├── videos/         # Pasta para soltar o vídeo (video-01.mp4, video-02.mp4...) e enviá-lo pelo admin
└── images/         # Favicons e fotos locais (migradas para o Cloudinary)
```

## Categorização de imóveis

Cada imóvel possui 2 níveis de classificação + bairro:

- **categoria**: Residencial · Comercial · Rural · Terreno
- **tipo**: depende da categoria (ex.: Apartamento, Casa, Kitnet, Cobertura, Galpão, Ponto Comercial, Chácara, Fazenda, Lote, etc.)
- **bairro**: campo separado, filtrado na busca da home

## Passo a passo de setup (uma única vez)

### 1. Supabase

1. Crie um projeto gratuito em https://supabase.com e anote a **Project URL** e a **anon key** (Settings → API).
2. No **SQL Editor**, rode o conteúdo de `sql/setup.sql` (cria a tabela `imoveis` com a coluna `videos` e as políticas RLS). **Se a tabela já existia**, rode apenas `sql/migrar-videos.sql` para adicionar a coluna `videos`.
3. Em **Authentication → Users → Add user**, crie o usuário administrador (e-mail + senha).
4. Edite `sql/setup.sql` e troque `admin@caetanoimoveis.com.br` pelo e-mail real do admin nas políticas de escrita, e rode as políticas novamente no SQL Editor (as políticas exigem exatamente esse e-mail).
5. Em `js/config.js`, preencha `supabaseUrl` e `supabaseAnonKey`.

### 2. Cloudinary

1. Crie uma conta gratuita em https://cloudinary.com e anote o **Cloud Name**.
2. Em **Settings → Upload → Add upload preset**: nome ex.: `imoveis-unsigned`, **unsigned**, folder `imoveis`. O preset precisa aceitar **imagens e vídeos** (resource type: "Any"/"Auto") para que os vídeos do admin sejam aceitos no endpoint `/video/upload`.
3. Em `js/config.js`, preencha `cloudinaryCloud` (cloud name) e `cloudinaryPreset`.

### 3. Publicar e importar a base

1. Suba o site para o GitHub (push na branch `main`).
2. Abra `admin.html` no site publicado e faça login com o usuário admin criado.
3. Clique em **"Importar base local"** para levar os 87 imóveis do `imoveis.js` para o banco. As galerias Cloudinary já existentes são preservadas (o `imoveis.js` contém apenas as fotos locais `images/imoveis/...`).
4. Clique em **"Migrar fotos p/ Cloudinary"** para enviar as fotos atuais (`images/imoveis/...`) para o Cloudinary e atualizar as URLs no banco.

> A partir daí, o banco é a fonte da verdade e `imoveis.js` permanece apenas como fallback offline (com as galerias de `js/fotos-migradas.json` aplicadas automaticamente).

## Usando o painel admin (`admin.html`)

- **Login**: e-mail/senha do usuário admin criado no Supabase (sessão fica salva no navegador).
- **Novo imóvel**: preencha o formulário (categoria → tipo, bairro, preço, quartos, suítes, descrição etc.), envie as fotos e/ou vídeos e clique em **Salvar / Publicar**. O imóvel aparece no site na hora.
- **Fotos**: são **comprimidas no navegador antes do upload** (redimensionadas para máx. 1920px e re-encodadas em JPEG, corrigindo também a orientação de fotos de celular). Depois o Cloudinary entrega cada foto otimizada (WebP/AVIF).
- **Vídeos**: o upload é feito para o Cloudinary e a compressão acontece **na entrega** (o Cloudinary gera MP4 até 1280px com qualidade automática quando o visitante acessa o vídeo, e mantém em cache). O endereço do vídeo fica salvo no campo `videos` do imóvel. Há duas formas de enviar: (1) escolher o arquivo no campo "Vídeos" do formulário; ou (2) soltar o arquivo como `video-01.mp4` na pasta `videos/`, publicar no GitHub e clicar em **"Enviar vídeos da pasta /videos"** no imóvel em edição. Vídeos aparecem integrados na galeria da página de detalhe (player com capa = 1ª foto) e no visualizador fullscreen. O auto-avanço da galeria pausa enquanto um vídeo está sendo exibido.
- **Editar**: use o botão de edição na lista.
- **Tirar do ar / Publicar**: use o botão de olho na lista (marca `disponivel` como falso/verdadeiro, sem apagar).
- **Excluir**: remove o imóvel definitivamente do banco.

## Responsividade (Tailwind CSS)

O site usa o **Tailwind CSS via CDN** para o layout responsivo:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { corePlugins: { preflight: false } };
</script>
```

- `corePlugins.preflight: false` mantém o reset próprio do `css/style.css`.
- Os pontos de quebra seguem o padrão: `sm` (640px), `md` (768px), `lg` (1024px) e `xl` (1280px).

## Cabeçalho

O contato por telefone reúne os números de **Aluguel** e **Vendas** sob o mesmo ícone:

- Aluguel: (62) 98507-0819 · Vendas: (62) 98573-9405
- E-mail: contato@caetanoimoveis.com.br

## Publicação (GitHub Pages)

As páginas são servidas a partir da branch `main`. Após alterações:

```bash
git add .
git commit -m "Descrição das alterações"
git push origin main
```

## Segurança

- A leitura pública do site usa a anon key (projetada para leitura).
- Escrita/edição/exclusão no banco exigem login e são restritas ao **e-mail do admin** definido nas políticas RLS de `sql/setup.sql`.
- Todo conteúdo exibido no site e no painel (títulos, descrições, localizações) passa por escape de HTML (`escapeHtml` em `js/config.js`) para evitar injeção de markup.
- O upload de fotos e vídeos usa um preset **unsigned** do Cloudinary (sem backend). Ele aceita imagens e vídeos; para uma proteção maior, pode-se adicionar depois um Cloudflare Worker que assina os uploads.
- **Atenção**: o painel admin é acessível por URL. Não o compartilhe publicamente; a senha protege o conteúdo.
