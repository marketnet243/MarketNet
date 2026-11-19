import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import { useMyShop, useShopProducts, type Order } from "@/hooks/useMyShop";
import { formatPrice } from "@/lib/marketnet";
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/_authenticated/dashboard/commandes")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Commandes — MarketNet" },
      { property: "og:description", content: "Suivez vos commandes WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Commandes — MarketNet" },
      { name: "description", content: "Suivez vos commandes WhatsApp." },
    ],
  }),
  component: OrdersPage,
});

const STATUS_CONFIG: Record<
  Order["status"],
  { label: string; icon: any; badgeClass: string; iconBoxClass: string }
> = {
  new: {
    label: "Nouvelle",
    icon: Clock,
    badgeClass: "bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]",
    iconBoxClass: "bg-[#EEF2FF] text-[#4F46E5]",
  },
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle2,
    badgeClass: "bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]",
    iconBoxClass: "bg-[#EEF2FF] text-[#4F46E5]",
  },
  delivered: {
    label: "Livrée",
    icon: Truck,
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    iconBoxClass: "bg-slate-100 text-slate-700",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
    iconBoxClass: "bg-rose-50 text-rose-700",
  },
};

type Item = { name: string; qty: number; price: number; variant?: string; currency?: string; productId?: string };

const DATE_FILTERS = [
  { label: "Toutes les dates", value: "all" },
  { label: "Aujourd'hui", value: "today" },
  { label: "7 derniers jours", value: "week" },
  { label: "Ce mois-ci", value: "month" },
  { label: "Date précise...", value: "custom" },
];

function OrdersPage() {
  const { data: shop } = useMyShop();
  const { data: products } = useShopProducts(shop?.id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", shop?.id],
    enabled: !!shop,
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*")
          .eq("shop_id", shop!.id)
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? [],
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => (o.customer_name || "").toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (dateFilter !== "all" && dateFilter !== "custom") {
      const now = new Date();
      list = list.filter((o) => {
        const d = new Date(o.created_at);
        if (dateFilter === "today") return d.toDateString() === now.toDateString();
        if (dateFilter === "week") return now.getTime() - d.getTime() < 7 * 86400000;
        if (dateFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    if (dateFilter === "custom" && dateRange?.from) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const fromTime = from.getTime();

      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        list = list.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= fromTime && t <= to.getTime();
        });
      } else {
        const endOfDay = new Date(from);
        endOfDay.setHours(23, 59, 59, 999);
        list = list.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= fromTime && t <= endOfDay.getTime();
        });
      }
    }

    return list;
  }, [orders, search, statusFilter, dateFilter, dateRange]);

  const newCount = orders?.filter((o) => o.status === "new").length ?? 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Commandes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {orders?.length ?? 0} commande{(orders?.length ?? 0) > 1 ? "s" : ""} au total
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#4F46E5] px-2 py-0.5 text-[10px] font-bold text-white">
                {newCount} à traiter
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── FILTRES RAPIDES EN PILULES (Style Vytrini) ── */}
      <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-4 space-y-3">
        {/* Barre de recherche */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client, numéro..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/40 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-2xl border px-3.5 text-xs font-bold transition-colors cursor-pointer",
              showFilters
                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatus("all")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "all" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Toutes ({orders?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatus("new")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "new" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Nouvelles ({orders?.filter((o) => o.status === "new").length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatus("confirmed")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "confirmed" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Confirmées
          </button>
          <button
            type="button"
            onClick={() => setStatus("delivered")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "delivered" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Livrées
          </button>
          <button
            type="button"
            onClick={() => setStatus("cancelled")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "cancelled" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Annulées
          </button>
        </div>

        {/* Filtres avancés dépliables */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 animate-in fade-in duration-150">
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Période</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setDateRange(undefined);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none"
              >
                {DATE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {dateFilter === "custom" && (
              <div className="flex flex-col gap-1 min-w-[220px] flex-1 sm:flex-none">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date précise</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs text-left text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd LLL", { locale: fr })} -{" "}
                              {format(dateRange.to, "dd LLL", { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, "dd LLL yyyy", { locale: fr })
                          )
                        ) : (
                          "Sélectionnez une date…"
                        )}
                      </span>
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400 ml-2 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-0 shadow-xl" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {(statusFilter !== "all" || dateFilter !== "all" || search) && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("all");
                    setDateFilter("all");
                    setDateRange(undefined);
                    setSearch("");
                  }}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LISTE DES COMMANDES ── */}
      {isLoading ? (
        <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs p-12 text-center text-slate-400 text-xs">
          Chargement de vos commandes…
        </div>
      ) : !orders?.length ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <ShoppingBag className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Aucune commande pour le moment</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Partagez le lien de votre vitrine à vos contacts pour commencer à recevoir des commandes directes.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-10 text-center text-xs text-slate-400">
          Aucune commande ne correspond à votre recherche.
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((o) => {
              const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.new;
              const items = (o.items as Item[]) || [];
              const itemCount = items.reduce((s, i) => s + (i.qty || 1), 0);

              let totalStr = formatPrice(Number(o.total_amount || o.total), o.currency);
              if (o.currency === "MIXTE") {
                const totals = items.reduce(
                  (acc, it) => {
                    const c = it.currency || products?.find((p) => p.id === it.productId)?.currency || o.currency;
                    acc[c] = (acc[c] || 0) + it.price * it.qty;
                    return acc;
                  },
                  {} as Record<string, number>
                );
                const entries = Object.entries(totals).filter(([c]) => c !== "MIXTE");
                if (entries.length > 0) {
                  totalStr = entries.map(([c, v]) => formatPrice(v, c)).join(" + ");
                }
              }

              return (
                <Link
                  key={o.id}
                  to="/dashboard/commandes/$orderId"
                  params={{ orderId: o.id }}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Gauche : Info commande */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-xs font-bold",
                        config.iconBoxClass
                      )}
                    >
                      #{String(o.id).slice(-4)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {o.customer_name || "Client WhatsApp"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <span className="mx-1.5">·</span>
                        {itemCount} article{itemCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Droite : Statut + Total + Flèche */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", config.badgeClass)}>
                      {config.label}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 tabular-nums">
                      {totalStr}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
