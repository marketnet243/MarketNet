-- Correction immédiate du compteur de vues de vitrine
-- Le trigger shop_slug_guard bloquait l'incrémentation des vues car app.view_inc n'était plus vérifié

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
  -- Autorise l'incrémentation si déclenchée par increment_shop_view (app.view_inc = '1') ou par un admin
  if coalesce(current_setting('app.view_inc', true), '') <> '1' and not public.has_role(auth.uid(), 'admin') then
    new.views := old.views;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- Mise à jour de la fonction increment_shop_view pour garantir l'incrémentation
create or replace function public.increment_shop_view(_slug text) returns void language plpgsql security definer set search_path = public
as $$ begin
  perform set_config('app.view_inc', '1', true);
  update public.shops
    set views = views + 1
    where slug = _slug
      and is_published
      and not is_suspended
      and (account_status is null or account_status = 'active');
  perform set_config('app.view_inc', '', true);
end $$;

grant execute on function public.increment_shop_view(text) to anon, authenticated;
