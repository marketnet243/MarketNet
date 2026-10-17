-- ============================================================
-- Migration : Suppression complète du module Meta
-- ============================================================

-- 1. Supprimer la fonction d'enregistrement des visites Facebook
drop function if exists public.record_facebook_visit(text, uuid);

-- 2. Supprimer la table des publications Meta (et ses politiques RLS associées)
drop table if exists public.meta_posts cascade;

-- 3. Supprimer la table des connexions Meta (et ses politiques RLS associées)
drop table if exists public.meta_connections cascade;

-- 4. Retirer la colonne d'accès Meta de la table plans
alter table public.plans drop column if exists meta_access;

-- 5. Mettre à jour la fonction delete_my_account pour nettoyer sans référence à Meta
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_shop_id uuid;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  -- Récupérer l'ID de la boutique
  select id into v_shop_id from public.shops where owner_id = v_uid;

  if v_shop_id is not null then
    -- La suppression de la boutique cascade sur products, categories, orders, promotions...
    delete from public.shops where id = v_shop_id;
  end if;

  -- Supprimer les rôles et le profil
  delete from public.user_roles where user_id = v_uid;
  delete from public.profiles   where id      = v_uid;

  -- Supprimer l'utilisateur auth
  delete from auth.users where id = v_uid;
end $$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
