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
  TrendingUp,
  AlertCircle,
  PackageCheck,
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
      { property: "og:description", content: "Suivez et gérez vos commandes en direct." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Commandes — MarketNet" },
      { name: "description", content: "Suivez et gérez vos commandes en direct." },
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
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    iconBoxClass: "bg-blue-50 text-blue-700",
  },
  delivered: {
    label: "Livrée",
    icon: Truck,
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    iconBoxClass: "bg-emerald-50 text-emerald-700",
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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", shop?.id],
    enabled: !!shop,
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*")
          .eq("shop_id", shop!.id)
          .order("created_at", { ascending: false })
          .limit(250)
      ).data ?? [],
  });

  // ── STATISTIQUES DYNAMIQUES GLOBALES ──
  const stats = useMemo(() => {
    const total = orders.length;
    const newCount = orders.filter((o) => o.status === "new").length;
    const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
    const deliveredCount = orders.filter((o) => o.status === "delivered").length;
    const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

    // Calcul du chiffre d'affaires cumulé (hors annulées)
    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const currency = shop?.currency || "USD";
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);

    return {
      total,
      newCount,
      confirmedCount,
      deliveredCount,
      cancelledCount,
      totalRevenue,
      currency,
    };
  }, [orders, shop?.currency]);

  // ── FILTRE DYNAMIQUE DES COMMANDES ──
  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.customer_name || "").toLowerCase().includes(q) ||
          String(o.id).toLowerCase().includes(q)
      );
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

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* ── EN-TÊTE DE LA PAGE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Commandes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi en temps réel de vos commandes et livraisons WhatsApp.
          </p>
        </div>
        {stats.newCount > 0 && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-[#4F46E5] px-3 py-1 text-xs font-bold text-white shadow-xs">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>{stats.newCount} nouvelle{stats.newCount > 1 ? "s" : ""} commande{stats.newCount > 1 ? "s" : ""}</span>
          </span>
        )}
      </div>

      {/* ── CARTES DE STATISTIQUES DYNAMIQUES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total commandes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total commandes</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900 tabular-nums">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {formatPrice(stats.totalRevenue, stats.currency)} générés
          </p>
        </div>

        {/* Nouvelles commandes */}
        <div className={cn(
          "rounded-2xl border p-4 shadow-xs transition-colors",
          stats.newCount > 0
            ? "border-[#4F46E5]/40 bg-[#EEF2FF]/40"
            : "border-slate-200/80 bg-white"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">À traiter</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-[#4F46E5] tabular-nums">{stats.newCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.newCount > 0 ? "Réponse requise" : "Tout est à jour"}
          </p>
        </div>

        {/* Confirmées */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confirmées</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900 tabular-nums">{stats.confirmedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">En préparation</p>
        </div>

        {/* Livrées */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Livrées</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900 tabular-nums">{stats.deliveredCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Ventes finalisées</p>
        </div>
      </div>

      {/* ── BARRE DE RECHERCHE ET PILULES DE FILTRES DYNAMIQUES ── */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-4 space-y-3.5">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom de client, #id…"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/50 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-2xl border px-3.5 text-xs font-bold transition-colors cursor-pointer shrink-0",
              showFilters
                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Période</span>
          </button>
        </div>

        {/* Pilules de statut avec compteurs dynamiques réels */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatus("all")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "all"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Toutes ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatus("new")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "new"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Nouvelles ({stats.newCount})
          </button>
          <button
            type="button"
            onClick={() => setStatus("confirmed")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "confirmed"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Confirmées ({stats.confirmedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatus("delivered")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "delivered"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Livrées ({stats.deliveredCount})
          </button>
          <button
            type="button"
            onClick={() => setStatus("cancelled")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              statusFilter === "cancelled"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Annulées ({stats.cancelledCount})
          </button>
        </div>

        {/* Filtres de date dépliables */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 animate-in fade-in duration-150">
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrer par date</label>
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
              <div>
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

      {/* ── LISTE DES COMMANDES FLUIDE ET RESPONSIVE ── */}
      {isLoading ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-12 text-center text-slate-400 text-xs">
          Chargement de vos commandes…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="h-6 w-6" />
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
          Aucune commande ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
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
                  className="block p-4 sm:px-5 sm:py-4 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Gauche : Numéro + Nom du client */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-xs font-bold",
                          config.iconBoxClass
                        )}
                      >
                        #{String(o.id).slice(-4)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900 truncate">
                            {o.customer_name || "Client WhatsApp"}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
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

                    {/* Droite : Badge Statut + Montant + Flèche */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", config.badgeClass)}>
                        {config.label}
                      </span>
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 tabular-nums">
                        {totalStr}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
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
