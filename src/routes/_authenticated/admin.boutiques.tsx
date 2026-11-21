import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import { Button } from "@/components/ui/button";
import { logAction } from "@/hooks/useIsAdmin";
import {
  Store,
  ShieldAlert,
  Eye,
  Search,
  X,
  Filter,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Ban,
  Settings2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { SHOP_CATEGORIES, getShopCategoryLabel, getShopPublicUrl, getShopDisplayUrl } from "@/lib/marketnet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/boutiques")({
  head: () => ({
    meta: [
      { title: "Boutiques — Administration MarketNet" },
      { name: "description", content: "Consultez et gérez les boutiques sur MarketNet." },
      { property: "og:title", content: "Boutiques — Administration MarketNet" },
      { property: "og:description", content: "Consultez et gérez les boutiques sur MarketNet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shops,
});

function initials(name?: string | null) {
  return (name?.trim() || "B")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Shops() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["adminShops"],
    queryFn: async () => {
      const [{ data: shops }, { data: reports }] = await Promise.all([
        supabase
          .from("shops")
          .select("id,name,slug,city,plan_id,is_suspended,views,created_at,category,category_custom")
          .order("created_at", { ascending: false }),
        supabase.from("shop_reports").select("*").eq("resolved", false).order("created_at", { ascending: false }),
      ]);
      return { shops: shops ?? [], reports: reports ?? [] };
    },
  });

  const shops = data?.shops ?? [];
  const reports = data?.reports ?? [];

  const counts = useMemo(() => {
    const total = shops.length;
    const suspended = shops.filter((s) => s.is_suspended).length;
    const active = total - suspended;
    const totalViews = shops.reduce((acc, s) => acc + (s.views || 0), 0);
    return { total, active, suspended, totalViews, reports: reports.length };
  }, [shops, reports]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      const catLabel = getShopCategoryLabel(s).toLowerCase();
      const matchQuery =
        !normalizedQuery ||
        s.name.toLowerCase().includes(normalizedQuery) ||
        s.slug.toLowerCase().includes(normalizedQuery) ||
        (s.city && s.city.toLowerCase().includes(normalizedQuery)) ||
        catLabel.includes(normalizedQuery) ||
        (s.category && s.category.toLowerCase().includes(normalizedQuery));

      const matchCat =
        categoryFilter === "all" ||
        (categoryFilter === "Autre" ? s.category === "Autre" : s.category === categoryFilter);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !s.is_suspended) ||
        (statusFilter === "suspended" && s.is_suspended);

      return matchQuery && matchCat && matchStatus;
    });
  }, [shops, normalizedQuery, categoryFilter, statusFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Store className="h-3.5 w-3.5" />
            Administration Boutiques
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-normal">Boutiques & Modération</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Supervisez les vitrines marchandes, contrôlez les signalements et gérez les accès.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-10 rounded-xl px-4 font-semibold shadow-xs hover:bg-muted"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin text-primary")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes Métriques */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Boutiques</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black">{counts.total}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Vitrines enregistrées</p>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Boutiques En Ligne</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black">{counts.active}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Actives et visibles</p>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Suspendues</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black">{counts.suspended}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Accès restreint</p>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Audience Cumulée</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/15 text-info">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black">{counts.totalViews}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Vues cumulées</p>
        </div>
      </div>

      {/* Signalements à traiter */}
      {reports.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <h2 className="text-base sm:text-lg font-bold">
              Signalements à traiter ({reports.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {reports.map((r) => {
              const s = shops.find((x) => x.id === r.shop_id);
              return <ReportRow key={r.id} report={r} shop={s} />;
            })}
          </div>
        </section>
      )}

      {/* Toutes les boutiques */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold">Catalogue des boutiques</h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {filteredShops.length} boutique{filteredShops.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Barre de recherche et filtres */}
          <div className="border-b p-4 sm:p-5 bg-muted/10 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 pr-9 rounded-xl bg-background"
                  placeholder="Rechercher par nom, lien, ville, catégorie..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  className="h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Toutes les catégories</option>
                  {SHOP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === "Autre" ? "Autre (personnalisé)" : c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                      statusFilter === "all" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                      statusFilter === "active" ? "bg-background text-success shadow-2xs font-bold" : "text-muted-foreground"
                    )}
                  >
                    En ligne
                  </button>
                  <button
                    onClick={() => setStatusFilter("suspended")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                      statusFilter === "suspended" ? "bg-background text-destructive shadow-2xs font-bold" : "text-muted-foreground"
                    )}
                  >
                    Suspendues
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des boutiques */}
          <div className="divide-y divide-border/60">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                Chargement des boutiques...
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <Store className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p className="font-semibold text-foreground">Aucune boutique trouvée</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {query
                    ? "Aucun résultat ne correspond à votre recherche. Essayez d'ajuster les filtres."
                    : "Aucune boutique enregistrée dans cette sélection."}
                </p>
              </div>
            ) : (
              filteredShops.map((s) => <ShopRow key={s.id} shop={s} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportRow({ report: r, shop: s }: { report: any; shop: any }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["adminShops"] });

  async function resolve(id: string) {
    await supabase.from("shop_reports").update({ resolved: true }).eq("id", id);
    await logAction("report.resolve", id);
    toast.success("Signalement marqué comme traité");
    refresh();
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:p-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <p className="font-bold text-sm text-foreground">{s?.name || "Boutique supprimée"}</p>
          <span className="text-xs text-muted-foreground">
            {new Date(r.created_at).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <p className="text-xs text-foreground/90 pl-6">
          <span className="font-semibold text-warning">Motif :</span> {r.reason}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {s && (
          <Link to="/admin/boutiques/$shopId" params={{ shopId: s.id }}>
            <Button size="sm" variant="outline" className="rounded-xl text-xs h-9">
              Gérer la boutique
            </Button>
          </Link>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="rounded-xl text-xs h-9 bg-success hover:bg-success text-primary-foreground font-semibold">
              Marquer traité
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Clôturer ce signalement ?</AlertDialogTitle>
              <AlertDialogDescription>
                Confirmez que ce signalement a été analysé et traité.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-success hover:bg-success text-primary-foreground font-semibold"
                onClick={() => resolve(r.id)}
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function ShopRow({ shop: s }: { shop: any }) {
  const isSuspended = !!s.is_suspended;
  const isPro = s.plan_id === "pro";
  const categoryLabel = getShopCategoryLabel(s) || "Général";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-muted/30 transition-colors group">
      {/* Colonne gauche : Identité boutique */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-sm font-bold border border-primary/20 shadow-2xs">
          {initials(s.name)}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-foreground truncate">{s.name}</span>

            {/* Statut En ligne / Suspendue */}
            {isSuspended ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Suspendue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success border border-success/30">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                En ligne
              </span>
            )}

            {/* Plan Badge */}
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                isPro
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border"
              )}
            >
              {isPro ? "Plan Pro" : "Gratuit"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <a
              href={getShopPublicUrl(s.slug)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors text-primary/90 font-medium"
              title="Ouvrir la vitrine publique"
            >
              <span>{getShopDisplayUrl(s.slug)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {s.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 opacity-60" />
                {s.city}
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground/80 font-medium">
              {categoryLabel}
            </span>

            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3 opacity-60" />
              {s.views || 0} vue{(s.views || 0) > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Colonne droite : Actions */}
      <div className="flex items-center gap-2 shrink-0 sm:pl-0 pl-14">
        <a
          href={`/boutique/${s.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-all shadow-2xs"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Vitrine</span>
        </a>

        <Link
          to="/admin/boutiques/$shopId"
          params={{ shopId: s.id }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>Gérer</span>
        </Link>
      </div>
    </div>
  );
}
