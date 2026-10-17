-- Nettoyage préalable des anciennes lignes avec un prix invalide (<= 0 ou NULL) pour respecter la règle métier
update public.products
set price = 1
where price is null or price <= 0;

-- Contrainte backend : Un produit doit obligatoirement avoir un prix strictement supérieur à 0
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price > 0);
