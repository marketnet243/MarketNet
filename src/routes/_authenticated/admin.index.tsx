import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import {
  Users,
  Store,
  Package,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Calendar,
  ChevronDown,
  Sparkles,
  BarChart2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatUSD } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminHome });

async function count(table: "profiles" | "shops" | "products" | "orders") {
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

type FilterType = "7_days" | "30_days" | "7_months";

function getPastPeriods(type: FilterType) {
  const monthsStr = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  const result: { label: string; shortLabel: string; match: (date: Date) => boolean }[] = [];
  const d = new Date();

  if (type === "7_months") {
    for (let i = 6; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      result.push({
        label: monthsStr[past.getMonth()],
        shortLabel: monthsStr[past.getMonth()].slice(0, 3),
        match: (date: Date) =>
          date.getMonth() === past.getMonth() && date.getFullYear() === past.getFullYear(),
      });
    }
  } else {
    const days = type === "7_days" ? 7 : 14;
    for (let i = days - 1; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      const dayNum = past.getDate();
      const monthName = monthsStr[past.getMonth()];
      result.push({
        label: `${dayNum} ${monthName}`,
        shortLabel: `${dayNum}/${past.getMonth() + 1}`,
        match: (date: Date) =>
          date.getDate() === past.getDate() &&
          date.getMonth() === past.getMonth() &&
          date.getFullYear() === past.getFullYear(),
      });
    }
  }
  return result;
}

function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function AdminHome() {
  const [revenueFilter, setRevenueFilter] = useState<FilterType>("7_months");
  const [merchantFilter, setMerchantFilter] = useState<FilterType>("7_days");
  const [hoveredMerchantIdx, setHoveredMerchantIdx] = useState<number | null>(null);
  const [hoveredRevenueIdx, setHoveredRevenueIdx] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminStats", revenueFilter, merchantFilter],
    queryFn: async () => {
      const [m, s, p, o] = await Promise.all([
        count("profiles"),
        count("shops"),
        count("products"),
        count("orders"),
      ]);

      const { data: pays } = await supabase
        .from("subscription_payments")
        .select("amount,montant_usd,montant_cdf,montant_debite,montant_net,currency,status,statut,methode,method,admin_note,created_at");

      // Paiements approuvés / payés
      const approvedPays = (pays ?? []).filter(
        (x) => x.status === "approved" || x.statut === "payé"
      );

      // Priorité montant en USD ($)
      const getAmount = (x: any) => {
        if (x.currency === "USD" || (x.montant_usd != null && x.montant_usd > 0)) {
          return Number(x.montant_usd ?? x.amount ?? 0);
        }
        const cdf = Number(x.montant_cdf ?? x.montant_debite ?? x.montant_net ?? x.amount ?? 0);
        if (cdf > 1000) {
          return Math.round((cdf / 2850) * 100) / 100;
        }
        return cdf;
      };

      const isManual = (x: any) =>
        x.methode === "manuel" || x.method === "cash" || x.admin_note?.includes("Attribution");

      const saspayPays = approvedPays.filter((x: any) => !isManual(x));
      const saspayRevenue = saspayPays.reduce((a, b) => a + getAmount(b), 0);

      const assignedPays = approvedPays.filter((x: any) => isManual(x));
      const assignedValue = assignedPays.reduce((a, b) => a + getAmount(b), 0);
      const assignedCount = assignedPays.length;

      const { data: profilesData } = await supabase.from("profiles").select("created_at");
      const allProfiles = profilesData ?? [];

      const revenuePeriods = getPastPeriods(revenueFilter);
      const revenueData = revenuePeriods.map((period) => {
        const total = saspayPays
          .filter((pay) => period.match(new Date(pay.created_at)))
          .reduce((a, b) => a + getAmount(b), 0);
        return { label: period.label, shortLabel: period.shortLabel, value: total };
      });

      const merchantPeriods = getPastPeriods(merchantFilter);
      const merchantsData = merchantPeriods.map((period) => {
        const total = allProfiles.filter((prof) => period.match(new Date(prof.created_at))).length;
        return { label: period.label, shortLabel: period.shortLabel, value: total };
      });

      return { m, s, p, o, saspayRevenue, assignedValue, assignedCount, revenueData, merchantsData };
    },
  });

  const stats = [
    { label: "Commerçants", value: data?.m, icon: Users, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Boutiques Actives", value: data?.s, icon: Store, color: "text-sky-600", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    { label: "Produits en ligne", value: data?.p, icon: Package, color: "text-pink-600", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    {
      label: "Encaissé SasPay ($)",
      value: data ? formatUSD(data.saspayRevenue ?? 0) : undefined,
      sublabel: "Solde réel SasPay",
      icon: CreditCard,
      color: "text-success",
      bg: "bg-success/15",
      border: "border-success/30",
      trend: "+12%",
    },
    {
      label: "Attributions Admin",
      value: data ? formatUSD(data.assignedValue ?? 0) : undefined,
      sublabel: data ? `${data.assignedCount ?? 0} plan(s) attribué(s)` : undefined,
      icon: Sparkles,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  const filterLabels: Record<FilterType, string> = {
    "7_days": "7 derniers jours",
    "30_days": "14 derniers jours",
    "7_months": "7 derniers mois",
  };

  // Somme totale sur la période pour les revenus
  const periodTotalRevenue = useMemo(() => {
    return (data?.revenueData ?? []).reduce((sum, d) => sum + d.value, 0);
  }, [data?.revenueData]);

  // Somme totale des nouveaux commerçants sur la période
  const periodTotalMerchants = useMemo(() => {
    return (data?.merchantsData ?? []).reduce((sum, d) => sum + d.value, 0);
  }, [data?.merchantsData]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-normal">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aperçu en temps réel de votre plateforme MarketNet et activité marchande.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" asChild className="rounded-xl h-10 px-4 text-xs font-semibold bg-background shadow-xs">
            <Link to="/admin/parametres">Paramètres</Link>
          </Button>
          <Button asChild className="rounded-xl h-10 px-4 text-xs font-bold shadow-xs">
            <Link to="/admin/boutiques">
              Gérer les boutiques <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="rounded-2xl sm:rounded-3xl border bg-card p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3 gap-2">
                <div
                  className={`h-10 w-10 rounded-xl sm:rounded-2xl flex items-center justify-center border ${stat.bg} ${stat.color} ${stat.border}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {stat.trend && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/30">
                    <TrendingUp className="h-3 w-3" /> {stat.trend}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {isLoading ? (
                  <div className="h-7 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  <p className="text-xl sm:text-2xl font-black text-foreground">{stat.value}</p>
                )}
                <p className="text-xs font-semibold text-muted-foreground truncate">{stat.label}</p>
                {stat.sublabel && (
                  <p className="text-[11px] text-muted-foreground/80 truncate">{stat.sublabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SECTION GRAPHIQUES DYNAMIQUES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. ÉVOLUTION DES REVENUS */}
        <div className="rounded-3xl border bg-card shadow-xs overflow-hidden p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Évolution des revenus</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Volume encaissé : <strong className="text-foreground">{formatUSD(periodTotalRevenue)}</strong>
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs rounded-xl bg-muted/40 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{filterLabels[revenueFilter]}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl text-xs">
                <DropdownMenuItem onClick={() => setRevenueFilter("7_days")}>7 derniers jours</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRevenueFilter("30_days")}>14 derniers jours</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRevenueFilter("7_months")}>7 derniers mois</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-64 w-full relative pt-2">
            {isLoading ? (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-2xl" />
            ) : (
              <div className="w-full h-full flex flex-col justify-between">
                {/* Visual Bars Container */}
                <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3 pb-3 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="w-full border-t border-dashed border-border/50 h-0" />
                    ))}
                  </div>

                  {data?.revenueData.map((d, i) => {
                    const maxVal = Math.max(...data.revenueData.map((x) => x.value || 0), 10);
                    const hasValue = d.value > 0;
                    const heightPercent = hasValue ? Math.max((d.value / maxVal) * 100, 10) : 4;
                    const isHovered = hoveredRevenueIdx === i;

                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col justify-end items-center group h-full relative z-10 cursor-pointer"
                        onMouseEnter={() => setHoveredRevenueIdx(i)}
                        onMouseLeave={() => setHoveredRevenueIdx(null)}
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
                            <span>{d.label} : </span>
                            <span className="text-emerald-400 dark:text-emerald-600">{formatUSD(d.value)}</span>
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          className={cn(
                            "w-full max-w-[36px] transition-all duration-300 rounded-t-xl relative overflow-hidden",
                            hasValue
                              ? "bg-gradient-to-t from-emerald-500/20 to-emerald-500 border-t-2 border-emerald-400 shadow-xs group-hover:brightness-110"
                              : "bg-slate-200/50 dark:bg-slate-800/40 border-t border-border/40 group-hover:bg-slate-300/60 dark:group-hover:bg-slate-700/60"
                          )}
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* Label */}
                        <div className={cn(
                          "mt-2 text-[10px] sm:text-xs font-semibold truncate w-full text-center transition-colors",
                          isHovered ? "text-foreground font-bold" : "text-muted-foreground"
                        )}>
                          {d.shortLabel || d.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. ÉVOLUTION DES INSCRIPTIONS */}
        <div className="rounded-3xl border bg-card shadow-xs overflow-hidden p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Nouvelles inscriptions</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nouveaux commerçants : <strong className="text-foreground">{periodTotalMerchants}</strong>
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs rounded-xl bg-muted/40 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{filterLabels[merchantFilter]}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl text-xs">
                <DropdownMenuItem onClick={() => setMerchantFilter("7_days")}>7 derniers jours</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMerchantFilter("30_days")}>14 derniers jours</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMerchantFilter("7_months")}>7 derniers mois</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-64 w-full relative pt-2">
            {isLoading ? (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-2xl" />
            ) : (
              <div className="w-full h-full relative flex flex-col justify-between">
                {/* SVG Area & Smooth Curve */}
                <div className="relative flex-1 pb-6">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="w-full border-t border-dashed border-border/50 h-0" />
                    ))}
                  </div>

                  {data?.merchantsData && data.merchantsData.length > 0 && (() => {
                    const count = data.merchantsData.length;
                    const maxVal = Math.max(...data.merchantsData.map((x) => x.value || 0), 4);
                    const points = data.merchantsData.map((d, i) => {
                      const x = 5 + (i / Math.max(count - 1, 1)) * 90;
                      const y = 85 - (d.value / maxVal) * 65;
                      return { x, y, value: d.value, label: d.label, shortLabel: d.shortLabel };
                    });

                    const curvePath = getSmoothPath(points);
                    const areaPath = points.length > 1
                      ? `${curvePath} L ${points[points.length - 1].x.toFixed(1)} 92 L ${points[0].x.toFixed(1)} 92 Z`
                      : "";

                    return (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="merchantsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Area */}
                        {areaPath && (
                          <path d={areaPath} fill="url(#merchantsGradient)" />
                        )}

                        {/* Baseline */}
                        <line x1="5" y1="92" x2="95" y2="92" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />

                        {/* Smooth Line */}
                        <path
                          d={curvePath}
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Circles on curve */}
                        {points.map((p, idx) => {
                          const isHovered = hoveredMerchantIdx === idx;
                          return (
                            <g
                              key={idx}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredMerchantIdx(idx)}
                              onMouseLeave={() => setHoveredMerchantIdx(null)}
                            >
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={isHovered ? "5" : "3.5"}
                                fill="#ffffff"
                                stroke="#4f46e5"
                                strokeWidth={isHovered ? "2.5" : "2"}
                                className="transition-all duration-150"
                              />
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}

                  {/* Floating tooltip when a dot is hovered */}
                  {hoveredMerchantIdx !== null && data?.merchantsData?.[hoveredMerchantIdx] && (() => {
                    const count = data.merchantsData.length;
                    const maxVal = Math.max(...data.merchantsData.map((x) => x.value || 0), 4);
                    const item = data.merchantsData[hoveredMerchantIdx];
                    const leftPercent = 5 + (hoveredMerchantIdx / Math.max(count - 1, 1)) * 90;
                    const topPercent = 85 - (item.value / maxVal) * 65;

                    return (
                      <div
                        className="absolute pointer-events-none -translate-x-1/2 -translate-y-full pb-2 z-30"
                        style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                      >
                        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
                          <span className="text-primary font-bold">{item.value}</span>
                          <span>{item.value > 1 ? "inscriptions" : "inscription"} ({item.label})</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* X-Axis Labels */}
                <div className="h-5 flex justify-between items-center text-[10px] sm:text-xs font-semibold text-muted-foreground px-1">
                  {data?.merchantsData.map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-center truncate flex-1 transition-colors",
                        hoveredMerchantIdx === i ? "text-foreground font-bold" : ""
                      )}
                    >
                      {d.shortLabel || d.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
