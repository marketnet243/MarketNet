-- ============================================================
-- Migration : 20261020000000_account_deletion_workflow.sql
-- Workflow de suppression de compte par l'admin.
-- Migrations ADDITIVES uniquement.
-- ============================================================

-- 1. COLONNE account_status sur shops et profiles
alter table public.shops
  add column if not exists account_status text
    not null default 'active'
    check (account_status in ('active', 'suspended_for_deletion'));

alter table public.profiles
  add column if not exists account_status text
    not null default 'active'
    check (account_status in ('active', 'suspended_for_deletion'));

-- 2. TABLE account_deletion_requests
create table if not exists public.account_deletion_requests (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  shop_id               uuid references public.shops(id) on delete set null,
  reason                text not null
    check (reason in ('trop_cher','plus_besoin','autre_outil','probleme_technique','autre')),
  reason_other          text,
  comment               text,
  status                text not null default 'pending'
    check (status in ('pending','processed','cancelled','restored','completed')),
  requested_at          timestamptz not null default now(),
  processed_at          timestamptz,
  processed_by          uuid references auth.users(id) on delete set null,
  scheduled_deletion_at timestamptz,
  cancelled_at          timestamptz,
  restored_at           timestamptz,
  completed_at          timestamptz,
  reminder_sent_at      timestamptz,
  admin_note            text,
  constraint chk_reason_other check (reason <> 'autre' or (reason_other is not null and char_length(reason_other) > 0))
);

create unique index if not exists idx_unique_active_deletion_request
  on public.account_deletion_requests(user_id)
  where status in ('pending','processed');

create index if not exists idx_adr_user_id   on public.account_deletion_requests(user_id);
create index if not exists idx_adr_status    on public.account_deletion_requests(status);
create index if not exists idx_adr_scheduled on public.account_deletion_requests(scheduled_deletion_at)
  where status = 'processed';

grant select, insert, update on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;
alter table public.account_deletion_requests enable row level security;

drop policy if exists "adr merchant insert" on public.account_deletion_requests;
create policy "adr merchant insert" on public.account_deletion_requests
  for insert to authenticated
  with check (user_id = auth.uid() and not public.has_role(auth.uid(), 'admin'));

drop policy if exists "adr merchant read" on public.account_deletion_requests;
create policy "adr merchant read" on public.account_deletion_requests
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "adr merchant cancel" on public.account_deletion_requests;
create policy "adr merchant cancel" on public.account_deletion_requests
  for update to authenticated
  using (
    (user_id = auth.uid() and status = 'pending')
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    (user_id = auth.uid() and status = 'cancelled')
    or public.has_role(auth.uid(), 'admin')
  );

-- 3. TABLE account_deletion_audit
create table if not exists public.account_deletion_audit (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid references public.account_deletion_requests(id) on delete cascade,
  action     text not null
    check (action in ('requested','cancelled','processed','date_changed','restored','completed','error','reminder_sent')),
  actor_id   uuid,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ada_request_id on public.account_deletion_audit(request_id);

grant select on public.account_deletion_audit to authenticated;
grant all on public.account_deletion_audit to service_role;
alter table public.account_deletion_audit enable row level security;

drop policy if exists "ada admin read" on public.account_deletion_audit;
create policy "ada admin read" on public.account_deletion_audit
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 4. Mise a jour politique publique boutiques
drop policy if exists "public shops" on public.shops;
create policy "public shops" on public.shops
  for select to anon, authenticated
  using (is_published and not is_suspended and account_status = 'active');

-- 5. Trigger garde anti-ecriture sur boutique suspendue
create or replace function public.shop_slug_guard() returns trigger language plpgsql
  set search_path = public as $$
begin
  if old.account_status = 'suspended_for_deletion' and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Votre compte est suspendu. Aucune modification n''est autorisee.';
  end if;
  if new.slug <> old.slug then
    if old.slug_changed and not public.has_role(auth.uid(), 'admin') then
      raise exception 'Le lien de la boutique ne peut etre modifie qu''une seule fois';
    end if;
    new.slug_changed := true;
  end if;
  if new.is_suspended <> old.is_suspended and not public.has_role(auth.uid(), 'admin') then
    new.is_suspended := old.is_suspended;
  end if;
  if new.account_status <> old.account_status and not public.has_role(auth.uid(), 'admin') then
    new.account_status := old.account_status;
  end if;
  new.views := case when public.has_role(auth.uid(), 'admin') then new.views else old.views end;
  new.updated_at := now();
  return new;
end $$;

-- 6. FONCTION : request_account_deletion
create or replace function public.request_account_deletion(
  p_reason       text,
  p_reason_other text default null,
  p_comment      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_shop_id uuid;
  v_req_id  uuid;
begin
  if v_uid is null then raise exception 'Non authentifie'; end if;
  if public.has_role(v_uid, 'admin') then
    raise exception 'Les administrateurs ne peuvent pas soumettre une demande de suppression.';
  end if;
  if exists (
    select 1 from public.account_deletion_requests
    where user_id = v_uid and status in ('pending','processed')
  ) then
    raise exception 'Une demande de suppression est deja en cours pour ce compte.';
  end if;

  select id into v_shop_id from public.shops where owner_id = v_uid;

  insert into public.account_deletion_requests
    (user_id, shop_id, reason, reason_other, comment, status, requested_at)
  values
    (v_uid, v_shop_id, p_reason, p_reason_other, p_comment, 'pending', now())
  returning id into v_req_id;

  insert into public.account_deletion_audit (request_id, action, actor_id, details)
  values (v_req_id, 'requested', v_uid, jsonb_build_object('reason', p_reason));

  return v_req_id;
end $$;

revoke all on function public.request_account_deletion(text, text, text) from public;
grant execute on function public.request_account_deletion(text, text, text) to authenticated;

-- 7. FONCTION : cancel_account_deletion_request
create or replace function public.cancel_account_deletion_request()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_req_id uuid;
begin
  if v_uid is null then raise exception 'Non authentifie'; end if;

  select id into v_req_id
  from public.account_deletion_requests
  where user_id = v_uid and status = 'pending'
  limit 1;

  if v_req_id is null then
    raise exception 'Aucune demande de suppression en attente trouvee.';
  end if;

  update public.account_deletion_requests
  set status = 'cancelled', cancelled_at = now()
  where id = v_req_id;

  insert into public.account_deletion_audit (request_id, action, actor_id)
  values (v_req_id, 'cancelled', v_uid);
end $$;

revoke all on function public.cancel_account_deletion_request() from public;
grant execute on function public.cancel_account_deletion_request() to authenticated;

-- 8. FONCTION : admin_process_deletion_request
create or replace function public.admin_process_deletion_request(
  p_request_id          uuid,
  p_scheduled_deletion  timestamptz,
  p_admin_note          text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_req      record;
  v_max_date timestamptz;
  v_min_date timestamptz;
begin
  if not public.has_role(v_actor_id, 'admin') then raise exception 'Acces refuse'; end if;

  select * into v_req from public.account_deletion_requests where id = p_request_id;
  if not found then raise exception 'Demande introuvable'; end if;
  if v_req.status <> 'pending' then raise exception 'La demande n''est pas en etat pending'; end if;
  if public.has_role(v_req.user_id, 'admin') then
    raise exception 'Impossible de traiter le compte d''un administrateur';
  end if;
  if v_req.user_id = v_actor_id then
    raise exception 'Impossible de traiter votre propre compte';
  end if;

  v_min_date := now() + interval '10 minutes';
  v_max_date := now() + interval '30 days';
  if p_scheduled_deletion < v_min_date then
    raise exception 'La date de suppression doit etre au minimum dans 10 minutes';
  end if;
  if p_scheduled_deletion > v_max_date then
    raise exception 'La date de suppression ne peut pas depasser 30 jours';
  end if;

  update public.account_deletion_requests
  set
    status                = 'processed',
    processed_at          = now(),
    processed_by          = v_actor_id,
    scheduled_deletion_at = p_scheduled_deletion,
    admin_note            = coalesce(p_admin_note, admin_note)
  where id = p_request_id;

  if v_req.shop_id is not null then
    update public.shops
    set account_status = 'suspended_for_deletion', is_published = false
    where id = v_req.shop_id;
  end if;

  update public.profiles
  set account_status = 'suspended_for_deletion'
  where id = v_req.user_id;

  insert into public.account_deletion_audit (request_id, action, actor_id, details)
  values (p_request_id, 'processed', v_actor_id, jsonb_build_object(
    'scheduled_deletion_at', p_scheduled_deletion,
    'admin_note', p_admin_note
  ));
end $$;

revoke all on function public.admin_process_deletion_request(uuid, timestamptz, text) from public;
grant execute on function public.admin_process_deletion_request(uuid, timestamptz, text) to authenticated;

-- 9. FONCTION : admin_restore_account
create or replace function public.admin_restore_account(
  p_request_id uuid,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_req      record;
begin
  if not public.has_role(v_actor_id, 'admin') then raise exception 'Acces refuse'; end if;

  select * into v_req from public.account_deletion_requests where id = p_request_id;
  if not found then raise exception 'Demande introuvable'; end if;
  if v_req.status <> 'processed' then raise exception 'La demande n''est pas en etat processed'; end if;

  update public.account_deletion_requests
  set status = 'restored', restored_at = now(), admin_note = coalesce(p_admin_note, admin_note)
  where id = p_request_id;

  if v_req.shop_id is not null then
    update public.shops
    set account_status = 'active', is_published = true
    where id = v_req.shop_id;
  end if;

  update public.profiles
  set account_status = 'active'
  where id = v_req.user_id;

  insert into public.account_deletion_audit (request_id, action, actor_id, details)
  values (p_request_id, 'restored', v_actor_id, jsonb_build_object('admin_note', p_admin_note));
end $$;

revoke all on function public.admin_restore_account(uuid, text) from public;
grant execute on function public.admin_restore_account(uuid, text) to authenticated;

-- 10. FONCTION : admin_update_deletion_date
create or replace function public.admin_update_deletion_date(
  p_request_id         uuid,
  p_new_scheduled_date timestamptz,
  p_admin_note         text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_req      record;
begin
  if not public.has_role(v_actor_id, 'admin') then raise exception 'Acces refuse'; end if;

  select * into v_req from public.account_deletion_requests where id = p_request_id;
  if not found then raise exception 'Demande introuvable'; end if;
  if v_req.status <> 'processed' then raise exception 'La demande n''est pas en etat processed'; end if;

  if p_new_scheduled_date < now() + interval '10 minutes' then
    raise exception 'La date doit etre au minimum dans 10 minutes';
  end if;
  if p_new_scheduled_date > v_req.processed_at + interval '30 days' then
    raise exception 'La date ne peut pas depasser 30 jours depuis le traitement';
  end if;

  update public.account_deletion_requests
  set scheduled_deletion_at = p_new_scheduled_date, admin_note = coalesce(p_admin_note, admin_note)
  where id = p_request_id;

  insert into public.account_deletion_audit (request_id, action, actor_id, details)
  values (p_request_id, 'date_changed', v_actor_id, jsonb_build_object(
    'old_date', v_req.scheduled_deletion_at,
    'new_date', p_new_scheduled_date
  ));
end $$;

revoke all on function public.admin_update_deletion_date(uuid, timestamptz, text) from public;
grant execute on function public.admin_update_deletion_date(uuid, timestamptz, text) to authenticated;

-- 11. FONCTION : perform_account_final_deletion (service_role uniquement)
create or replace function public.perform_account_final_deletion(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req     record;
  v_shop_id uuid;
  v_user_id uuid;
begin
  select * into v_req
  from public.account_deletion_requests
  where id = p_request_id
  for update skip locked;

  if not found then
    return jsonb_build_object('skipped', true, 'reason', 'locked_or_not_found');
  end if;

  if v_req.status <> 'processed' then
    return jsonb_build_object('skipped', true, 'reason', 'status_changed', 'status', v_req.status);
  end if;
  if v_req.scheduled_deletion_at > now() then
    return jsonb_build_object('skipped', true, 'reason', 'not_yet_due');
  end if;

  v_user_id := v_req.user_id;
  v_shop_id := v_req.shop_id;

  -- Anonymiser les paiements avant suppression de la boutique
  if v_shop_id is not null then
    update public.subscription_payments
    set merchant_id = null, shop_id = null
    where shop_id = v_shop_id;
  end if;

  -- Supprimer la boutique (cascade sur products, orders, promotions...)
  if v_shop_id is not null then
    delete from public.shops where id = v_shop_id;
  end if;

  -- Supprimer roles et profil
  delete from public.user_roles where user_id = v_user_id;
  delete from public.profiles   where id      = v_user_id;

  -- Marquer comme termine
  update public.account_deletion_requests
  set status = 'completed', completed_at = now()
  where id = p_request_id;

  insert into public.account_deletion_audit (request_id, action, actor_id, details)
  values (p_request_id, 'completed', null, jsonb_build_object(
    'user_id', v_user_id, 'shop_id', v_shop_id
  ));

  -- Supprimer l'utilisateur auth (en dernier)
  delete from auth.users where id = v_user_id;

  return jsonb_build_object('ok', true, 'user_id', v_user_id, 'shop_id', v_shop_id);

exception when others then
  insert into public.account_deletion_audit (request_id, action, actor_id, details)
  values (p_request_id, 'error', null, jsonb_build_object('error', sqlerrm));
  return jsonb_build_object('error', sqlerrm);
end $$;

revoke all on function public.perform_account_final_deletion(uuid) from public;
revoke all on function public.perform_account_final_deletion(uuid) from authenticated;
grant execute on function public.perform_account_final_deletion(uuid) to service_role;
