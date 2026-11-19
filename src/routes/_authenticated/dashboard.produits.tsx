import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  Package,
  Tag,
} from "lucide-react";
import { supabase } from "@/lib/imported-database";
import { useMyShop, useShopProducts, useShopCategories, type Product } from "@/hooks/useMyShop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice, mediaUrl, type Variant } from "@/lib/marketnet";
import { compressAndUpload } from "@/lib/upload";
import { cloudinaryUploadSignature } from "@/lib/cloudinary.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/produits")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Produits — MarketNet" },
      { name: "description", content: "Gérez vos produits." },
      { property: "og:title", content: "Produits — MarketNet" },
      { property: "og:description", content: "Gestion des produits MarketNet." },
    ],
  }),
  component: ProductsPage,
});

type Form = {
  id?: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  category_id: string;
  stock: string;
  status: Product["status"];
  featured: boolean;
  variants: { name: string; options: string }[];
};
const MAX_IMAGES = 6;

function ProductsPage() {
  const { data: shop } = useMyShop();
  const { data: products, isLoading } = useShopProducts(shop?.id);
  const { data: categories } = useShopCategories(shop?.id);
  const [form, setForm] = useState<Form | null>(null);
  const [filter, setFilter] = useState("");
  const qc = useQueryClient();
  if (!shop) return null;

  const blank = (): Form => ({
    name: "",
    description: "",
    price: "",
    currency: shop.currency,
    images: [],
    category_id: "",
    stock: "",
    status: "active",
    featured: false,
    variants: [],
  });

  const edit = (p: Product): Form => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: String(p.price),
    currency: p.currency,
    images: p.images,
    category_id: p.category_id ?? "",
    stock: p.stock == null ? "" : String(p.stock),
    status: p.status,
    featured: p.featured,
    variants: ((p.variants as Variant[]) ?? []).map((v) => ({ name: v.name, options: v.options.join(", ") })),
  });

  const list = (products ?? []).filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ── EN-TÊTE ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Produits</h1>
          <p className="text-xs text-slate-400 mt-0.5">{products?.length ?? 0} produit(s) dans votre catalogue</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(blank())}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* ── BARRE RECHERCHE + CATÉGORIES ── */}
      <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-4 space-y-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/40 transition-colors"
            placeholder="Rechercher un produit…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Gestionnaire de catégories compact */}
        <CategoryManager shopId={shop.id} />
      </div>

      {/* ── LISTE DES PRODUITS ── */}
      {isLoading ? (
        <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <Package className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">
              {filter ? "Aucun produit ne correspond à votre recherche" : "Ajoutez votre premier produit"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {filter ? "Essayez un autre terme de recherche." : "Votre catalogue est vide pour l'instant."}
            </p>
          </div>
          {!filter && (
            <button
              type="button"
              onClick={() => setForm(blank())}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un produit
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setForm(edit(p))}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors group"
              >
                {/* Image produit */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/70">
                  {p.images[0] ? (
                    <img src={mediaUrl(p.images[0])!} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Info produit */}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 truncate">
                    {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                    {p.name}
                  </p>
                  <p className="text-sm font-extrabold text-[#4F46E5] mt-0.5">{formatPrice(Number(p.price), p.currency)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {categories?.find((c) => c.id === p.category_id)?.name ?? "Sans catégorie"}
                    {p.stock != null && ` · Stock : ${p.stock}`}
                  </p>
                </div>

                {/* Badge statut */}
                <StatusBadge s={p.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SHEET FORMULAIRE ── */}
      <Sheet open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl sm:mx-auto sm:max-w-xl border-0 bg-white">
          {form && (
            <ProductForm
              key={form.id ?? "new"}
              initial={form}
              shopId={shop.id}
              categories={categories ?? []}
              onDone={(again) => {
                qc.invalidateQueries({ queryKey: ["products", shop.id] });
                setForm(again ? blank() : null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ s }: { s: Product["status"] }) {
  const m: Record<string, [string, string]> = {
    active: ["Actif", "bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]"],
    hidden: ["Masqué", "bg-slate-100 text-slate-500"],
    out_of_stock: ["Rupture", "bg-rose-50 text-rose-600 border border-rose-200"],
  };
  const [label, cls] = m[s] ?? ["Inconnu", "bg-slate-100 text-slate-400"];
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cls)}>
      {label}
    </span>
  );
}

function CategoryManager({ shopId }: { shopId: string }) {
  const { data: cats } = useShopCategories(shopId);
  const [name, setName] = useState("");
  const qc = useQueryClient();

  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase
      .from("product_categories")
      .insert({ shop_id: shopId, name: name.trim().slice(0, 50), position: cats?.length ?? 0 });
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["categories", shopId] });
  }

  async function del(id: string) {
    await supabase.from("product_categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["categories", shopId] });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Catégories :</span>
      {cats?.map((c) => (
        <span
          key={c.id}
          className="flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
        >
          <Tag className="h-3 w-3 text-slate-400" />
          {c.name}
          <button
            type="button"
            aria-label="Supprimer"
            onClick={() => del(c.id)}
            className="ml-0.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1">
        <input
          type="text"
          className="h-7 w-32 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
          placeholder="Nouvelle catégorie"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          type="button"
          onClick={add}
          className="h-7 w-7 rounded-full bg-[#4F46E5] text-white flex items-center justify-center hover:bg-[#4338CA] transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  shopId,
  categories,
  onDone,
}: {
  initial: Form;
  shopId: string;
  categories: { id: string; name: string }[];
  onDone: (again: boolean) => void;
}) {
  const [f, setF] = useState<Form>(initial);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const signUpload = useServerFn(cloudinaryUploadSignature);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));

  const selClass =
    "flex h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/40 transition-colors";

  async function addImages(files: FileList | null) {
    if (!files) return;
    const room = MAX_IMAGES - f.images.length;
    if (room <= 0) return toast.error(`${MAX_IMAGES} photos maximum`);
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files).slice(0, room))
        paths.push(await compressAndUpload(file, "product", signUpload));
      setF((x) => ({ ...x, images: [...x.images, ...paths] }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save(again: boolean) {
    const price = Number(f.price.replace(",", "."));
    if (!f.name.trim()) return toast.error("Le nom est requis");
    if (!isFinite(price) || price <= 0) return toast.error("Le prix doit être strictement supérieur à 0");
    const stock = f.stock.trim() === "" ? null : parseInt(f.stock, 10);
    if (stock !== null && (isNaN(stock) || stock < 0)) return toast.error("Stock invalide");
    const row = {
      shop_id: shopId,
      name: f.name.trim().slice(0, 120),
      description: f.description.trim() || null,
      price,
      currency: f.currency,
      images: f.images,
      category_id: f.category_id || null,
      stock,
      status: f.status,
      featured: f.featured,
      variants: f.variants
        .filter((v) => v.name.trim() && v.options.trim())
        .map((v) => ({
          name: v.name.trim(),
          options: v.options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
        })),
    };
    setBusy(true);
    const { error } = f.id
      ? await supabase.from("products").update(row).eq("id", f.id)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(f.id ? "Produit mis à jour" : "Produit ajouté");
    onDone(again);
  }

  async function remove() {
    if (!f.id) return;
    setConfirmDelete(false);
    await supabase.from("products").delete().eq("id", f.id);
    toast.success("Produit supprimé");
    onDone(false);
  }

  return (
    <div className="space-y-5 pb-6">
      <SheetHeader>
        <SheetTitle className="text-lg font-extrabold text-slate-900">
          {f.id ? "Modifier le produit" : "Nouveau produit"}
        </SheetTitle>
      </SheetHeader>

      {/* Photos */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Photos ({f.images.length}/{MAX_IMAGES})
        </label>
        <div className="grid grid-cols-4 gap-2">
          {f.images.map((img, i) => (
            <div key={img} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
              <img src={mediaUrl(img)!} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Retirer"
                onClick={() => set({ images: f.images.filter((_, j) => j !== i) })}
                className="absolute right-1 top-1 h-6 w-6 grid place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-slate-900/70 px-1.5 text-[9px] font-bold text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
          {f.images.length < MAX_IMAGES && (
            <label className="aspect-square cursor-pointer grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-[#4F46E5]/40 hover:bg-[#4F46E5]/5 transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {/* Nom */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom du produit</Label>
        <input
          className={selClass}
          value={f.name}
          maxLength={120}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ex: T-shirt imprimé…"
        />
      </div>

      {/* Prix + Devise */}
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prix</Label>
          <input
            className={selClass}
            inputMode="decimal"
            placeholder="0.00"
            value={f.price}
            onChange={(e) => set({ price: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Devise</Label>
          <select className={selClass} value={f.currency} onChange={(e) => set({ currency: e.target.value })}>
            <option>USD</option>
            <option>CDF</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</Label>
        <Textarea
          className="rounded-2xl border-slate-200 bg-slate-50 text-sm resize-none focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/40"
          rows={3}
          maxLength={3000}
          placeholder="Décrivez votre produit…"
          value={f.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>

      {/* Catégorie + Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catégorie</Label>
          <select className={selClass} value={f.category_id} onChange={(e) => set({ category_id: e.target.value })}>
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock (optionnel)</Label>
          <input
            className={selClass}
            inputMode="numeric"
            placeholder="Illimité"
            value={f.stock}
            onChange={(e) => set({ stock: e.target.value })}
          />
        </div>
      </div>

      {/* Statut */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</Label>
        <select
          className={selClass}
          value={f.status}
          onChange={(e) => set({ status: e.target.value as Product["status"] })}
        >
          <option value="active">Actif</option>
          <option value="hidden">Masqué</option>
          <option value="out_of_stock">Rupture de stock</option>
        </select>
      </div>

      {/* Mettre en avant */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
        <div>
          <p className="text-sm font-bold text-slate-900">Mettre en avant</p>
          <p className="text-xs text-slate-400 mt-0.5">Affiché en premier sur votre boutique</p>
        </div>
        <Switch checked={f.featured} onCheckedChange={(v) => set({ featured: v })} />
      </div>

      {/* Variantes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variantes (optionnel)</Label>
          <button
            type="button"
            onClick={() => set({ variants: [...f.variants, { name: "", options: "" }] })}
            className="flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>
        {f.variants.map((v, i) => (
          <div key={i} className="mt-2 flex gap-2">
            <input
              className="h-10 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              placeholder="Taille"
              value={v.name}
              onChange={(e) => set({ variants: f.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
            />
            <input
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              placeholder="S, M, L, XL"
              value={v.options}
              onChange={(e) => set({ variants: f.variants.map((x, j) => (j === i ? { ...x, options: e.target.value } : x)) })}
            />
            <button
              type="button"
              aria-label="Retirer"
              onClick={() => set({ variants: f.variants.filter((_, j) => j !== i) })}
              className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={busy || uploading}
          className="flex items-center justify-center gap-2 h-12 w-full rounded-full bg-[#4F46E5] text-white text-sm font-bold hover:bg-[#4338CA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </button>
        {!f.id && (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={busy || uploading}
            className="h-12 w-full rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Enregistrer et ajouter un autre
          </button>
        )}
        {f.id && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-2 h-10 w-full rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer ce produit
          </button>
        )}
      </div>

      {/* Confirmation suppression */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-3xl max-w-md border-0 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Cette action est irréversible. Le produit sera définitivement retiré de votre boutique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full border-slate-200 font-semibold">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="rounded-full bg-rose-600 text-white hover:bg-rose-700 font-bold"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
