-- Migration: 20261017000001_shop_custom_category_and_broadcasts.sql
-- Description:
-- 1. Colonne category_custom pour l'option « Autre » des boutiques
-- 2. Tables pour le système de diffusions (annonces globales & ciblées)
-- Réversible : instructions commentées en bas.

-- ============================================================================
-- 1. COLONNE CATEGORY_CUSTOM SUR SHOPS
-- ============================================================================
alter table public.shops
  add column if not exists category_custom text
  check (category_custom is null or (char_length(trim(category_custom)) between 3 and 40));

-- ============================================================================
-- 2. TABLES MODULE DIFFUSIONS (BROADCASTS)
-- ============================================================================

-- Table principale des diffusions (créées par l'administrateur)
create table if not exists public.support_broadcasts (
  id                  uuid        primary key default gen_random_uuid(),
  admin_id            uuid        not null references auth.users(id) on delete cascade,
  titre               text        not null check (char_length(trim(titre)) between 3 and 200),
  message             text        not null check (char_length(trim(message)) between 5 and 10000),
  cible               text        not null check (cible in ('tous', 'selection')),
  destinataires_count integer     not null default 0,
  envoyes_count       integer     not null default 0,
  echoues_count       integer     not null default 0,
  lus_count           integer     not null default 0,
  statut              text        not null default 'terminee' check (statut in ('en_cours', 'terminee')),
  cree_le             timestamptz not null default now()
);

create index if not exists idx_support_broadcasts_cree on public.support_broadcasts(cree_le desc);

-- Table des destinataires individuels d'une diffusion (avec suivi de lecture & email)
create table if not exists public.support_broadcast_recipients (
  id             uuid        primary key default gen_random_uuid(),
  broadcast_id   uuid        not null references public.support_broadcasts(id) on delete cascade,
  merchant_id    uuid        not null references auth.users(id) on delete cascade,
  shop_id        uuid        references public.shops(id) on delete cascade,
  email          text        not null,
  email_statut   text        not null default 'en_attente' check (email_statut in ('en_attente', 'envoyé', 'échoué')),
  email_erreur   text,
  lu_le          timestamptz,
  cree_le        timestamptz not null default now(),
  unique(broadcast_id, merchant_id)
);

create index if not exists idx_broadcast_recip_merchant on public.support_broadcast_recipients(merchant_id);
create index if not exists idx_broadcast_recip_bcast    on public.support_broadcast_recipients(broadcast_id);
create index if not exists idx_broadcast_recip_lu       on public.support_broadcast_recipients(lu_le);

-- ============================================================================
-- 3. POLITIQUES RLS
-- ============================================================================

-- RLS: support_broadcasts
grant select, insert, update on public.support_broadcasts to authenticated;
grant all on public.support_broadcasts to service_role;
alter table public.support_broadcasts enable row level security;

drop policy if exists "admin broadcasts all" on public.support_broadcasts;
create policy "admin broadcasts all" on public.support_broadcasts
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS: support_broadcast_recipients
grant select, update on public.support_broadcast_recipients to authenticated;
grant all on public.support_broadcast_recipients to service_role;
alter table public.support_broadcast_recipients enable row level security;

drop policy if exists "admin recipients all" on public.support_broadcast_recipients;
create policy "admin recipients all" on public.support_broadcast_recipients
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "merchant recipient read" on public.support_broadcast_recipients;
create policy "merchant recipient read" on public.support_broadcast_recipients
  for select to authenticated
  using (merchant_id = auth.uid());

drop policy if exists "merchant recipient update" on public.support_broadcast_recipients;
create policy "merchant recipient update" on public.support_broadcast_recipients
  for update to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "merchant broadcasts read" on public.support_broadcasts;
create policy "merchant broadcasts read" on public.support_broadcasts
  for select to authenticated
  using (
    exists (
      select 1 from public.support_broadcast_recipients r
      where r.broadcast_id = id and r.merchant_id = auth.uid()
    )
  );

-- Instructions d'annulation (rollback) :
-- drop table if exists public.support_broadcast_recipients cascade;
-- drop table if exists public.support_broadcasts cascade;
-- alter table public.shops drop column if exists category_custom;
