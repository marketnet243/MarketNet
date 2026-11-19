import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  PackageSearch,
  Package,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  X,
  Search,
} from "lucide-react";
import { publicShopQuery } from "@/lib/storefront.query";
import { ProductCard } from "@/components/store/StoreParts";
import { useCart } from "@/components/store/cart";
import { cn } from "@/lib/utils";
import { formatPrice, type Variant } from "@/lib/marketnet";

export const Route = createFileRoute("/b/$slug/produits")({
  loader: ({ context, params }: any) =>
    context.queryClient.ensureQueryData(publicShopQuery(params.slug)),
  head: ({ loaderData }: any) => {
    if (!loaderData) return {};
    const { shop } = loaderData;
    return {
      meta: [
        { title: `Tous les produits — ${shop.name}` },
        { name: "description", content: `Découvrez tout le catalogue de produits de ${shop.name}.` },
      ],
    };
  },
  component: ShopAllProductsPage,
});

function ShopAllProductsPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(publicShopQuery(slug));
  const { shop, products, categories } = data;
  const { add } = useCart();

  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (!cat || p.category_id === cat) &&
          p.name.toLowerCase().includes(q.toLowerCase())
      ),
    [products, cat, q]
  );

  function quickAdd(p: (typeof products)[0]) {
    add({ productId: p.id, name: p.name, price: Number(p.price), currency: p.currency, image: p.images[0] });
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa] pb-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 sm:pt-6">
        
        {/* En-tête avec retour vers la boutique */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/b/$slug"
            params={{ slug }}
            className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-shop-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              Tous nos produits
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {list.length} article{list.length > 1 ? "s" : ""} disponible{list.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Barre de recherche locale sur la page produits */}
        <div className="relative mb-5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4F46E5] transition-colors pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom d'article…"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-sm shadow-xs transition-all placeholder:text-slate-400 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filtres par Rayons / Catégories */}
        {categories.length > 0 && (
          <div className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setCat(null)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                !cat
                  ? "bg-[#4F46E5] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Tout ({products.length})
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.category_id === c.id).length;
              const isSelected = cat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCat(c.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    isSelected
                      ? "bg-[#4F46E5] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {c.name} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        )}

        {/* Grille complète des produits */}
        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <PackageSearch className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Aucun produit trouvé</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Essayez un autre mot-clé ou réinitialisez les filtres.
            </p>
            {(q || cat) && (
              <button
                type="button"
                onClick={() => { setQ(""); setCat(null); }}
                className="mt-4 px-4 py-2 rounded-full bg-[#4F46E5] text-white text-xs font-bold shadow-xs hover:bg-[#4338CA] transition-colors cursor-pointer"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={(p.variants as Variant[]).length ? undefined : () => quickAdd(p)}
                href={
                  <Link
                    to="/b/$slug/p/$productId"
                    params={{ slug, productId: p.id }}
                    className="absolute inset-0"
                    aria-label={p.name}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
