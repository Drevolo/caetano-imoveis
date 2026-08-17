-- ============================================================
-- Caetano Imóveis - Migração: adicionar coluna de vídeos
--
-- Se a tabela imoveis já foi criada (setup.sql rodado antes), rode
-- apenas este comando no SQL Editor do Supabase para adicionar o
-- campo `videos`. Em instalações novas, o setup.sql já inclui a
-- coluna e este script não é necessário.
-- ============================================================

alter table public.imoveis
  add column if not exists videos text[] not null default '{}';
