-- Contrainte backend : Un produit doit obligatoirement avoir un prix strictement supérieur à 0
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price > 0);
