-- Migration pour optimiser la création de profil lors de l'authentification OAuth (Google) ou Email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles(id, full_name, email, status)
  values (new.id, v_full_name, new.email, 'active')
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    email = coalesce(excluded.email, public.profiles.email);

  insert into public.user_roles(user_id, role)
  values (new.id, 'merchant')
  on conflict (user_id, role) do nothing;

  return new;
end $$;
