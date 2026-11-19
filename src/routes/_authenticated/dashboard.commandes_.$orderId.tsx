import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import { useMyShop, useShopProducts, type Order } from "@/hooks/useMyShop";
import { formatPrice, mediaUrl } from "@/lib/marketnet";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  FileText,
  Image as ImageIcon,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/commandes_/$orderId")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Détails de la commande — MarketNet" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Détails de la commande — MarketNet" },
    ],
  }),
  component: OrderDetailPage,
});

const STATUS_CONFIG: Record<
  Order["status"],
  { label: string; icon: any; badgeClass: string }
> = {
  new: { label: "Nouvelle", icon: Clock, badgeClass: "bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]" },
  confirmed: { label: "Confirmée", icon: CheckCircle2, badgeClass: "bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]" },
  delivered: { label: "Livrée", icon: Truck, badgeClass: "bg-slate-100 text-slate-700 border border-slate-200" },
  cancelled: { label: "Annulée", icon: XCircle, badgeClass: "bg-rose-50 text-rose-700 border border-rose-200" },
};

type Item = { productId: string; name: string; qty: number; price: number; currency?: string; variant?: string };

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: shop } = useMyShop();
  const { data: products } = useShopProducts(shop?.id);
  const qc = useQueryClient();

  const { data: o, isLoading } = useQuery({
    queryKey: ["order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (error) throw error;
      return data as Order;
    },
  });

  async function update(patch: Partial<Pick<Order, "status" | "notes">>) {
    const promise = Promise.resolve(supabase.from("orders").update(patch).eq("id", orderId)).then(({ error }) => {
      if (error) throw error;
    });
    toast.promise(promise, {
      loading: "Mise à jour…",
      success: () => {
        qc.invalidateQueries({ queryKey: ["order", orderId] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        return "Commande mise à jour";
      },
      error: "Erreur de mise à jour",
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-12 text-center text-slate-400 text-xs">
        Chargement de la commande…
      </div>
    );
  }
  if (!o) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-12 text-center text-rose-600 text-xs font-semibold">
        Commande introuvable
      </div>
    );
  }

  const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.new;
  const StatusIcon = config.icon;
  const items = (o.items as Item[]) || [];

  const totals = items.reduce(
    (acc, it) => {
      const c = it.currency || products?.find((p) => p.id === it.productId)?.currency || o.currency;
      acc[c] = (acc[c] || 0) + it.price * it.qty;
      return acc;
    },
    {} as Record<string, number>
  );
  const totalStr =
    Object.keys(totals).length > 0
      ? Object.entries(totals)
          .map(([c, v]) => formatPrice(v, c))
          .join(" + ")
      : formatPrice(Number(o.total_amount || o.total), o.currency);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Retour */}
      <Link
        to="/dashboard/commandes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux commandes
      </Link>

      {/* Header Commande */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">
              Commande #{String(o.id).slice(-6)}
            </h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", config.badgeClass)}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reçue le{" "}
            {new Date(o.created_at).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Changer le statut */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Statut :</label>
          <div className="relative">
            <select
              value={o.status}
              onChange={(e) => update({ status: e.target.value as Order["status"] })}
              className="h-10 rounded-full border border-slate-200 bg-white pl-4 pr-9 text-xs font-bold text-slate-800 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Colonne Gauche : Produits commandés */}
        <div className="md:col-span-2 space-y-5">
          <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Articles commandés ({items.reduce((s, i) => s + (i.qty || 1), 0)})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((it, i) => {
                const prod = products?.find((p) => p.id === it.productId);
                return (
                  <div key={i} className="flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/70 relative">
                        {prod?.images?.[0] ? (
                          <img src={mediaUrl(prod.images[0])!} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 rounded-full bg-[#4F46E5] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {it.qty}x
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-900 truncate">{it.name}</p>
                        {it.variant && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            Variante : <span className="font-semibold text-slate-700">{it.variant}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-sm text-slate-900 tabular-nums">
                        {formatPrice(it.price * it.qty, it.currency || prod?.currency || o.currency)}
                      </p>
                      {it.qty > 1 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatPrice(it.price, it.currency || prod?.currency || o.currency)} / u
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de la commande</span>
              <span className="text-xl font-extrabold text-[#4F46E5] tabular-nums">{totalStr}</span>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Coordonnées + Notes */}
        <div className="space-y-5">
          {/* Client info */}
          <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <FileText className="h-4 w-4" />
              <span>Client</span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Coordonnées / Message</p>
              <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                {o.customer_name || "Aucune coordonnée renseignée"}
              </p>
            </div>
          </div>

          {/* Notes internes */}
          <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Notes privées</span>
            </div>
            <textarea
              defaultValue={o.notes ?? ""}
              placeholder="Ex: Le client souhaite être livré avant 14h…"
              onBlur={(e) => e.target.value !== (o.notes ?? "") && update({ notes: e.target.value || null })}
              className="w-full min-h-[110px] resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            />
            <p className="text-[10px] text-slate-400">Notes visibles uniquement par vous.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
