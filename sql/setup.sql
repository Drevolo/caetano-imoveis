-- ============================================================
-- Caetano Imóveis - Setup Supabase (Postgres)
-- Rode este script uma única vez no SQL Editor do seu projeto.
-- Ele cria a tabela imoveis e as políticas de segurança (RLS).
-- ============================================================

create table if not exists public.imoveis (
  id          integer primary key,
  referencia  text,
  titulo      text not null,
  categoria   text not null default 'Residencial',
  tipo        text not null,
  status      text not null default 'Aluguel',
  bairro      text,
  localizacao text,
  cidade      text not null default 'Goianésia',
  preco       numeric not null default 0,
  quartos     integer not null default 0,
  suites      integer not null default 0,
  banheiros   integer not null default 0,
  garagem     integer not null default 0,
  area        numeric not null default 0,
  mobiliado   boolean not null default false,
  destaque    boolean not null default false,
  condominio  numeric,
  iptu        numeric,
  imagem      text,
  fotos       text[] not null default '{}',
  videos      text[] not null default '{}',
  video_orientacao text not null default 'horizontal',
  data        text,
  descricao   text,
  disponivel  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índice para busca rápida por status
create index if not exists idx_imoveis_status on public.imoveis (status);

-- ============================================================
-- Row Level Security (RLS)
--   - Leitura (SELECT): qualquer visitante (site público)
--   - Escrita (INSERT/UPDATE/DELETE): apenas o usuário admin
--     (identificado pelo e-mail no JWT do Supabase Auth)
--
--   IMPORTANTE: troque 'admin@caetanoimoveis.com.br' abaixo pelo
--   e-mail real do usuário administrador criado em Authentication.
-- ============================================================
alter table public.imoveis enable row level security;

drop policy if exists "leitura publica" on public.imoveis;
create policy "leitura publica" on public.imoveis
  for select using (true);

drop policy if exists "escrita autenticado" on public.imoveis;
create policy "escrita autenticado" on public.imoveis
  for insert with check (auth.jwt() ->> 'email' = 'admin@caetanoimoveis.com.br');

drop policy if exists "edicao autenticado" on public.imoveis;
create policy "edicao autenticado" on public.imoveis
  for update using (auth.jwt() ->> 'email' = 'admin@caetanoimoveis.com.br');

drop policy if exists "exclusao autenticado" on public.imoveis;
create policy "exclusao autenticado" on public.imoveis
  for delete using (auth.jwt() ->> 'email' = 'admin@caetanoimoveis.com.br');

-- ============================================================
-- Depois deste script:
--   1. Crie o usuário admin em Authentication > Users > Add user
--      (e-mail + senha de sua escolha - será usado no login do admin)
--      e troque o e-mail das políticas acima pelo e-mail criado.
--   2. Copie a URL do projeto e a anon key para js/config.js
--   3. Abra o admin.html no site publicado e use
--      "Importar base local" para subir os 87 imóveis.
-- ============================================================
