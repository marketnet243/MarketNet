import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  Package,
  Palette,
  ShoppingBag,
  LogOut,
  ExternalLink,
  ChevronRight,
  Tag,
  Settings,
  CreditCard,
  Copy,
  Check,
  LifeBuoy,
  X,
  Sparkles,
  Zap,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { supabase } from "@/lib/imported-database";
import { useMyShop } from "@/hooks/useMyShop";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getShopPublicUrl, getShopDisplayUrl } from "@/lib/marketnet";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: shop, isLoading } = useMyShop();
  const { data: isAdmin, isAdminLoading } = useIsAdmin() as any;
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const { data: newOrdersCount } = useQuery({
    queryKey: ["newOrdersCount", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop!.id)
        .eq("status", "new");
      return count || 0;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "Commerçant");
    });
  }, []);

  useEffect(() => {
    if (isAdmin) navigate({ to: "/admin" });
    else if (!isAdminLoading && !isLoading && !shop) navigate({ to: "/onboarding" });
  }, [isAdmin, isAdminLoading, isLoading, shop, navigate]);

  if (isAdminLoading || isLoading || !shop || isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F0F2F5] text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <span className="font-medium text-slate-600">Chargement de votre boutique…</span>
        </div>
      </div>
    );
  }

  // Écran de blocage si compte suspendu
  if ((shop as any).account_status === "suspended_for_deletion") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F0F2F5] p-6">
        <div className="w-full max-w-md space-y-6 text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <LogOut className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Compte en cours de suppression</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Votre compte est temporairement suspendu suite à votre demande de suppression.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => supabase.auth.signOut().then(() => { window.location.href = "/auth"; })}
            className="w-full rounded-full"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  const shopUrl = getShopPublicUrl(shop.slug);
  const shortUrl = getShopDisplayUrl(shop.slug);

  async function copyShopLink() {
    const success = await copyToClipboard(shopUrl);
    if (success) {
      setCopiedLink(true);
      toast.success("Lien copié dans le presse-papier !");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      toast.error("Impossible de copier automatiquement.");
    }
  }

  // Navigation principale (Style Vytrini)
  const navItems = [
    { to: "/dashboard", label: "Mon site", icon: Home, exact: true },
    { to: "/dashboard/produits", label: "Produits", icon: Package },
    { to: "/dashboard/commandes", label: "Commandes", icon: ShoppingBag, count: newOrdersCount || 0 },
    { to: "/dashboard/boutique", label: "Boutique", icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 antialiased font-sans selection:bg-slate-900 selection:text-white">
      {/* ── 1. HEADER MOBILE (Sans conflit, propre et direct) ── */}
      <header className="md:hidden sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 scale-90 origin-left">
            <Logo />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Voir le site direct sur mobile */}
          <a
            href={shopUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4F46E5] text-white text-xs font-semibold shadow-xs hover:bg-[#4338CA] transition-colors"
          >
            <span>Voir le site</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Bouton profil rapide */}
          <Link
            to="/dashboard/reglages"
            className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0"
            title="Paramètres"
          >
            {userName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>

      {/* ── 2. HEADER DESKTOP FLOTTANT (Style Vytrini : Pilule blanche arrondie) ── */}
      <header className="hidden md:block sticky top-0 z-40 px-4 sm:px-6 pt-4">
        <div className="h-14 rounded-full bg-white/95 backdrop-blur-md shadow-xs border border-slate-200/70 px-5 flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Gauche : Logo & Boutique */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Logo />
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 max-w-[220px] truncate">
              <span className={cn("h-2 w-2 rounded-full shrink-0", shop.is_published ? "bg-[#4F46E5]" : "bg-amber-400")} />
              <span className="truncate">{shop.name}</span>
            </div>
          </div>

          {/* Droite : Lien boutique violet Vytrini + Aide + Profil */}
          <div className="flex items-center gap-3">
            {/* Pillule du lien boutique avec style Vytrini (#4F46E5) */}
            <div className="flex items-center rounded-full bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20 text-xs font-semibold pl-3 pr-1 py-1 gap-1.5 transition-colors hover:bg-[#4F46E5]/15">
              <a
                href={shopUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:underline truncate max-w-[200px]"
                title="Visiter mon site"
              >
                <span className="truncate">{shortUrl}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-80" />
              </a>
              <button
                type="button"
                onClick={copyShopLink}
                className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-[#4F46E5]/20 text-[#4F46E5] transition-colors cursor-pointer shrink-0"
                title="Copier le lien"
              >
                {copiedLink ? <Check className="h-3 w-3 text-slate-900" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>

            {/* Bouton Besoin d'aide */}
            <Link
              to="/dashboard/support"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full px-3 py-1.5 transition-colors"
            >
              <LifeBuoy className="h-3.5 w-3.5 text-slate-500" />
              <span>Besoin d'aide ?</span>
            </Link>

            {/* Profil commerçant */}
            <Link
              to="/dashboard/reglages"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-800 transition-colors"
              title="Paramètres du compte"
            >
              <div className="h-6 w-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate">{userName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 3. CORPS DU DASHBOARD (Sidebar flottante + Contenu central) ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-24 md:pb-8 flex gap-4">
        {/* ── SIDEBAR DESKTOP BLANCHE FLOTTANTE (Style Vytrini) ── */}
        <aside className="w-56 shrink-0 hidden md:flex flex-col justify-between rounded-3xl bg-white shadow-xs border border-slate-200/70 p-3 self-start sticky top-22 min-h-[calc(100vh-6.5rem)]">
          <div className="space-y-4">
            {/* Navigation principale */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.to === "/dashboard"
                    ? currentPath === "/dashboard"
                    : currentPath.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: "exact" in item }}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold transition-all",
                      isActive
                        ? "bg-[#4F46E5]/10 text-[#4F46E5] font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {/* Barre latérale d'activation Vytrini */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#4F46E5]" />
                    )}
                    <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", isActive ? "text-[#4F46E5]" : "text-slate-500")} />
                    <span className="truncate">{item.label}</span>
                    {item.count > 0 && (
                      <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#4F46E5] px-1 text-[9px] font-bold text-white">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Séparateur pour options secondaires */}
            <div className="border-t border-slate-100 pt-3 space-y-1">
              <Link
                to="/dashboard/promotions"
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-2 text-[13px] font-medium transition-colors",
                  currentPath.startsWith("/dashboard/promotions")
                    ? "bg-[#4F46E5]/10 text-[#4F46E5] font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Tag className="h-4 w-4 text-slate-500" />
                <span>Promotions</span>
              </Link>

              <Link
                to="/dashboard/reglages"
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-2 text-[13px] font-medium transition-colors",
                  currentPath.startsWith("/dashboard/reglages")
                    ? "bg-[#4F46E5]/10 text-[#4F46E5] font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Réglages</span>
              </Link>

              <Link
                to="/dashboard/support"
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-2 text-[13px] font-medium transition-colors",
                  currentPath.startsWith("/dashboard/support")
                    ? "bg-[#4F46E5]/10 text-[#4F46E5] font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <LifeBuoy className="h-4 w-4 text-slate-500" />
                <span>Guide &amp; aide</span>
              </Link>
            </div>
          </div>

          {/* Bas de sidebar : Carte Formule & Déconnexion */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="rounded-2xl bg-[#EEF2FF] p-3.5 border border-[#E0E7FF] text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#4F46E5]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Formule {shop.plan_id ? `Plan ${shop.plan_id}` : "Gratuit"}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Vendez sans limites avec vos commandes directes WhatsApp.
              </p>
              <Link
                to="/dashboard/abonnement"
                className="inline-block w-full py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs"
              >
                Gérer l'abonnement
              </Link>
            </div>

            <button
              type="button"
              onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/auth"))}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors w-full cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </aside>

        {/* ── ZONE CENTRALE DE CONTENU ── */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ── 4. NAVIGATION MOBILE BAS DE PAGE (Style Vytrini : 5 boutons avec "Plus…") ── */}
      <nav
        aria-label="Navigation principale mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-2 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg"
      >
        {/* 1. Mon site */}
        <Link
          to="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-semibold transition-colors",
            currentPath === "/dashboard" ? "text-[#4F46E5] font-bold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Home className={cn("h-5 w-5", currentPath === "/dashboard" ? "text-[#4F46E5]" : "text-slate-400")} />
          <span className="mt-1 truncate">Mon site</span>
        </Link>

        {/* 2. Produits */}
        <Link
          to="/dashboard/produits"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-semibold transition-colors",
            currentPath.startsWith("/dashboard/produits") ? "text-[#4F46E5] font-bold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Package className={cn("h-5 w-5", currentPath.startsWith("/dashboard/produits") ? "text-[#4F46E5]" : "text-slate-400")} />
          <span className="mt-1 truncate">Produits</span>
        </Link>

        {/* 3. Commandes */}
        <Link
          to="/dashboard/commandes"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-semibold transition-colors relative",
            currentPath.startsWith("/dashboard/commandes") ? "text-[#4F46E5] font-bold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <div className="relative">
            <ShoppingBag className={cn("h-5 w-5", currentPath.startsWith("/dashboard/commandes") ? "text-[#4F46E5]" : "text-slate-400")} />
            {(newOrdersCount || 0) > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#4F46E5] px-1 text-[9px] font-bold text-white">
                {newOrdersCount}
              </span>
            )}
          </div>
          <span className="mt-1 truncate">Commandes</span>
        </Link>

        {/* 4. Boutique */}
        <Link
          to="/dashboard/boutique"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-semibold transition-colors",
            currentPath.startsWith("/dashboard/boutique") ? "text-[#4F46E5] font-bold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Palette className={cn("h-5 w-5", currentPath.startsWith("/dashboard/boutique") ? "text-[#4F46E5]" : "text-slate-400")} />
          <span className="mt-1 truncate">Boutique</span>
        </Link>

        {/* 5. Plus... (Ouvre le tiroir pour Promotions, Réglages, Abonnement, Support) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-semibold transition-colors cursor-pointer",
            mobileMenuOpen || currentPath.startsWith("/dashboard/reglages") || currentPath.startsWith("/dashboard/promotions") || currentPath.startsWith("/dashboard/abonnement") || currentPath.startsWith("/dashboard/support")
              ? "text-[#4F46E5] font-bold"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="mt-1 truncate">Plus…</span>
        </button>
      </nav>

      {/* ── FEUILLE COULISSANTE MOBILE "PLUS..." ÉPURÉE ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5 shadow-2xl border-t border-slate-200 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-5 duration-200">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-base text-slate-900">Autres options</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <Link
                to="/dashboard/promotions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Tag className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900">Promotions</span>
                    <p className="text-xs text-slate-400">Offres et réductions catalogue</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>

              <Link
                to="/dashboard/abonnement"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-[#4F46E5]">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900">Abonnement</span>
                    <p className="text-xs text-slate-400">Formule active et facturation</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>

              <Link
                to="/dashboard/support"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <LifeBuoy className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900">Guide &amp; aide</span>
                    <p className="text-xs text-slate-400">Assistance et tickets support</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>

              <Link
                to="/dashboard/reglages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Settings className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900">Réglages</span>
                    <p className="text-xs text-slate-400">Profil, sécurité et compte</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>

              <button
                type="button"
                onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/auth"))}
                className="flex items-center gap-3 rounded-2xl p-3 hover:bg-rose-50 text-rose-600 transition-colors w-full text-left cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100/60 text-rose-600">
                  <LogOut className="h-4.5 w-4.5" />
                </div>
                <span className="font-bold text-sm">Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
