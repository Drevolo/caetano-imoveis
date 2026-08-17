-- ============================================================
-- Caetano Imóveis - Migração: adicionar coluna video_orientacao
--
-- Se a tabela imoveis já existe, rode este comando no SQL Editor
-- para adicionar o campo que define se o vídeo é horizontal
-- ou vertical. Em instalações novas, o setup.sql já inclui a
-- coluna e este script não é necessário.
-- ============================================================

alter table public.imoveis
  add column if not exists video_orientacao text not null default 'horizontal';
