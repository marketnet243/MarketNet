-- Migration: 20261120000000_usd_currency_and_remove_business_plan.sql
-- Description: Bascule de la facturation des abonnements en Dollars ($ USD) à 3 $/mois (30 $/an), suppression du plan Business, tout illimité pour le plan Pro.

-- 1. Réassignation des boutiques et abonnements existants du plan 'business' vers 'pro'
update public.shops 
set plan_id = 'pro' 
where plan_id = 'business';

update public.merchant_subscriptions 
set plan_id = 'pro' 
where plan_id = 'business';

update public.subscription_payments 
set plan_id = 'pro' 
where plan_id = 'business';

-- 2. Suppression définitive du plan 'business'
delete from public.plan_prices where plan_id = 'business';
delete from public.plans where id = 'business';

-- 3. Mise à jour des offres officielles : Gratuit (0 $) et Pro (3 $)
-- Gratuit : 10 produits, 3 photos, 1 promo, thèmes & stats de base
update public.plans
set name = 'Gratuit',
    price_usd = 0,
    price_cdf = 0,
    max_products = 10,
    max_photos = 3,
    max_active_promotions = 1,
    advanced_stats = false,
    advanced_themes = false,
    active = true,
    position = 0
where id = 'free';

-- Pro : 3 $ / mois, Tout illimité (null = sans limite), badges, stats complètes, thèmes premium
update public.plans
set name = 'Pro',
    price_usd = 3.00,
    price_cdf = 0,
    max_products = null,
    max_photos = null,
    max_active_promotions = null,
    advanced_stats = true,
    advanced_themes = true,
    active = true,
    position = 1
where id = 'pro';

-- 4. Configuration stricte de plan_prices en USD ($)
alter table public.plan_prices alter column currency set default 'USD';

insert into public.plan_prices (plan_id, period, price_usd, price_cdf, is_active, currency)
values
  ('free', 'mensuel', 0, 0, true, 'USD'),
  ('free', 'annuel', 0, 0, true, 'USD'),
  ('pro', 'mensuel', 3.00, 0, true, 'USD'),
  ('pro', 'annuel', 30.00, 0, true, 'USD')
on conflict (plan_id, period) do update
set price_usd = excluded.price_usd,
    price_cdf = excluded.price_cdf,
    currency = 'USD',
    is_active = excluded.is_active,
    updated_at = now();

-- 5. Mise à jour de la synchronisation automatique des prix depuis la table plans
create or replace function public.sync_plan_prices_from_plans()
returns trigger as $$
begin
  insert into public.plan_prices (plan_id, period, price_usd, price_cdf, is_active, currency)
  values
    (new.id, 'mensuel', coalesce(new.price_usd, 0), coalesce(new.price_cdf, 0), coalesce(new.active, true), 'USD'),
    (new.id, 'annuel', coalesce(new.price_usd * 10, 0), coalesce(new.price_cdf * 10, 0), coalesce(new.active, true), 'USD')
  on conflict (plan_id, period) do update
  set price_usd = excluded.price_usd,
      price_cdf = excluded.price_cdf,
      currency = 'USD',
      is_active = excluded.is_active,
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_plan_prices on public.plans;
create trigger trg_sync_plan_prices
after insert or update of price_usd, price_cdf, active on public.plans
for each row execute function public.sync_plan_prices_from_plans();

-- 6. Table subscription_payments : Devise USD par défaut
alter table public.subscription_payments alter column currency set default 'USD';
