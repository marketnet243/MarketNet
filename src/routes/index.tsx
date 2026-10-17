import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Check, MessageCircle, Palette, Smartphone, Store, Zap, ArrowRight,
  TrendingUp, Users, ShieldCheck, Menu, X, Sparkles, Layers, CreditCard,
  LogIn, Tag, Megaphone, BarChart3, Globe2, BadgePercent, Star, Clock,
  Share2, Gift, Rocket, Send, HelpCircle, Quote, ShoppingBag, Plus, Minus,
  CheckCircle2, Wallet, Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { formatCDF } from "@/lib/subscriptions";
import { absoluteMediaUrl } from "@/lib/marketnet";

export const Route = createFileRoute("/")(({
  head: () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.MARKETNET_SITE_URL || process.env.VITE_PUBLIC_URL || "https://appmarketnet.vercel.app");
    const ogImage = absoluteMediaUrl("/favicon.jpg", origin, "/favicon.jpg")!;
    const title = "MarketNet — Votre boutique en ligne, commandes sur WhatsApp";
    const desc = "Créez gratuitement votre boutique en ligne en 5 minutes et recevez vos commandes directement sur WhatsApp. Pour les commerçants de RDC et d'Afrique francophone.";

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:site_name", content: "MarketNet" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: origin },
        { property: "og:image", content: ogImage },
        { property: "og:image:secure_url", content: ogImage },
        { property: "og:image:alt", content: "MarketNet — Plateforme de boutiques en ligne" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: Index,
} as any));

const FEATURES = [
  { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", title: "Prête en 5 minutes", text: "Nom, logo, numéro WhatsApp : votre boutique est en ligne sans attendre." },
  { icon: MessageCircle, color: "text-green-500", bg: "bg-green-500/10", title: "Commandes WhatsApp", text: "Le client remplit son panier, vous recevez la commande détaillée directement." },
  { icon: Palette, color: "text-purple-500", bg: "bg-purple-500/10", title: "À votre image", text: "Personnalisez couleurs, bannière, thème et catégories en quelques clics." },
  { icon: Smartphone, color: "text-blue-500", bg: "bg-blue-500/10", title: "Pensé pour le mobile", text: "Léger et rapide, optimisé pour les connexions mobiles africaines." },
  { icon: BarChart3, color: "text-primary", bg: "bg-primary/10", title: "Statistiques en direct", text: "Suivez vos ventes, produits populaires et commandes en temps réel." },
  { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", title: "Sécurisé & fiable", text: "Données hébergées sur infrastructure sécurisée, disponible 99% du temps." },
  { icon: Globe2, color: "text-cyan-500", bg: "bg-cyan-500/10", title: "Lien partageable", text: "Un lien unique que vous pouvez partager partout : WhatsApp, TikTok, Facebook." },
  { icon: Tag, color: "text-rose-500", bg: "bg-rose-500/10", title: "Gestion des stocks", text: "Ajoutez, modifiez ou retirez des produits à tout moment depuis votre téléphone." },
];

const STEPS = [
  { icon: Store, title: "Créez votre boutique", desc: "Ajoutez vos produits, vos prix et vos photos depuis votre téléphone en moins de 5 minutes." },
  { icon: Share2, title: "Partagez votre lien", desc: "Mettez le lien sur WhatsApp, Facebook, TikTok ou Instagram. Vos abonnés deviennent des clients." },
  { icon: MessageCircle, title: "Recevez les commandes", desc: "Discutez directement avec vos clients sur WhatsApp pour conclure la vente et organiser la livraison." },
];

const PROMO_FEATURES = [
  { icon: BadgePercent, title: "Réductions en %", desc: "Définissez un pourcentage de réduction sur n'importe quel produit ou catégorie." },
  { icon: Clock, title: "Promotions temporaires", desc: "Activez des offres avec une date de début et de fin. Elles s'arrêtent automatiquement." },
  { icon: Gift, title: "Codes promo", desc: "Créez des codes que vos clients saisissent au moment de commander." },
  { icon: Star, title: "Mise en avant", desc: "Les produits en promotion s'affichent en premier dans votre boutique avec un badge visible." },
];

const TESTIMONIALS = [
  {
    name: "Chantal Mbuyi",
    role: "Créatrice & Gérante",
    shop: "Awa Fashion & Wax",
    city: "Kinshasa (Gombe)",
    avatar: "CM",
    color: "bg-amber-500",
    quote: "Avant MarketNet, je passais mes journées à répondre « C'est combien ? » et à renvoyer 50 photos en DM. Maintenant, mon lien est dans ma bio TikTok et sur mes statuts. Les clientes choisissent leur taille, voient les prix en $ et en Francs, et m'envoient directement leur panier prêt. J'ai doublé mes ventes.",
    metric: "+180 commandes / mois",
    rating: 5,
  },
  {
    name: "Dieudonné Kalala",
    role: "Responsable Ventes",
    shop: "TechStore 243",
    city: "Lubumbashi",
    avatar: "DK",
    color: "bg-blue-600",
    quote: "Ce qui m'a conquis, ce sont les promotions et le 0% de commission. Je lance une offre -20% le vendredi soir, je partage le lien direct avec la photo et le prix sur mes statuts WhatsApp, et le samedi matin les commandes tombent directement sans intermédiaire.",
    metric: "Temps de gestion divisé par 3",
    rating: 5,
  },
  {
    name: "Grace Nsimba",
    role: "Fondatrice",
    shop: "Élégance Bio & Parfums",
    city: "Goma",
    avatar: "GN",
    color: "bg-emerald-600",
    quote: "Je n'ai pas d'ordinateur à la boutique, je fais absolument tout sur mon smartphone. Ajouter un produit prend 30 secondes avec la photo et les variantes. Les clients apprécient le panier rapide et le récapitulatif clair avant l'envoi sur WhatsApp.",
    metric: "100% géré sur smartphone",
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    q: "Est-ce que MarketNet prélève une commission sur mes ventes ?",
    a: "Non, absolument 0% de commission. Vous conservez 100% de vos bénéfices. Vous réglez uniquement le forfait fixe de votre abonnement selon la formule choisie, sans aucun frais caché ni pourcentage prélevé sur vos commandes.",
  },
  {
    q: "Puis-je afficher mes prix en Dollars ($) ou en Francs Congolais (FC) ?",
    a: "Oui, totalement ! Vous choisissez librement la devise de votre boutique : Dollar américain (USD $), Franc Congolais (CDF), FCFA, Euro ou montant mixte selon votre activité et vos clients.",
  },
  {
    q: "Comment mes clients effectuent-ils le paiement ?",
    a: "Le paiement s'effectue directement entre vous et votre client selon vos méthodes habituelles : Mobile Money (M-Pesa, Airtel Money, Orange Money, Afrimoney), virement bancaire ou paiement en espèces à la livraison. MarketNet ne bloque jamais votre argent.",
  },
  {
    q: "Puis-je ajouter des variantes (tailles, pointures, couleurs) sur mes produits ?",
    a: "Oui, vous pouvez facilement configurer des variantes comme les tailles, pointures ou couleurs avec des prix personnalisés si nécessaire. Le client sélectionne ses options et vous recevez le récapitulatif exact sur WhatsApp.",
  },
  {
    q: "Ai-je besoin d'un ordinateur pour gérer ma boutique ?",
    a: "Pas du tout ! 100% de MarketNet est conçu et optimisé pour smartphone. Vous pouvez prendre des photos de vos articles, créer des promotions, ajuster vos prix et suivre vos commandes directement depuis votre téléphone.",
  },
  {
    q: "Mes clients doivent-ils télécharger une application ?",
    a: "Non, aucun téléchargement n'est requis. Vos clients cliquent simplement sur le lien de votre boutique (depuis vos statuts WhatsApp, Facebook, TikTok ou Instagram) et votre catalogue s'ouvre directement dans leur navigateur web mobile.",
  },
];

function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // Si l'élément est plus bas que l'écran initial, on applique l'apparition au scroll
    if (rect.top > window.innerHeight) {
      setIsVisible(false);
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.05, rootMargin: "0px 0px 50px 0px" }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  const getOffset = () => {
    switch (direction) {
      case "up": return "translate-y-5";
      case "down": return "-translate-y-5";
      case "left": return "-translate-x-5";
      case "right": return "translate-x-5";
      case "none": return "scale-98";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
        transitionDuration: "500ms",
      }}
      className={cn(
        "transition-all ease-out",
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0 scale-100"
          : cn("opacity-0", getOffset()),
        className
      )}
    >
      {children}
    </div>
  );
}

const FadeIn = ScrollReveal;

function CountUp({ end, suffix = "", prefix = "", duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrame: number;
    let observer: IntersectionObserver;

    const startAnimation = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) animationFrame = requestAnimationFrame(startAnimation);
    };

    if (ref.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animationFrame = requestAnimationFrame(startAnimation);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (observer) observer.disconnect();
    };
  }, [end, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm mb-4">
      {children}
    </span>
  );
}

interface DemoCartItem {
  id: string;
  name: string;
  priceUsd: number;
  priceCdf: number;
  size: string;
  color: string;
  qty: number;
}

const DEMO_PRODUCTS = [
  {
    id: "wax",
    name: "Robe Wax Élégante",
    category: "Mode & Robes",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=350&q=80",
    priceUsd: 20,
    priceCdf: 56000,
    originalUsd: 25,
    promo: "-20%",
    sizes: ["S", "M", "L"],
    colors: ["Doré Wax", "Noir Ébène"],
  },
  {
    id: "bag",
    name: "Sac Cuir Gombe",
    category: "Maroquinerie",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=350&q=80",
    priceUsd: 35,
    priceCdf: 98000,
    originalUsd: 40,
    promo: null,
    sizes: ["Standard", "Grand format"],
    colors: ["Marron Cuir", "Noir"],
  },
  {
    id: "shoes",
    name: "Sneakers Streetwear",
    category: "Chaussures",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=350&q=80",
    priceUsd: 45,
    priceCdf: 126000,
    originalUsd: 55,
    promo: "-18%",
    sizes: ["40", "41", "42", "43"],
    colors: ["Blanc Pur", "Gris Urbain"],
  },
];

function InteractiveHeroDemo() {
  // Step 1: Catalogue, Step 2: Variantes du produit, Step 3: Message WhatsApp
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);

  // Currency & Product state
  const [currencyMode, setCurrencyMode] = useState<"USD" | "CDF">("USD");
  const [selectedProductId, setSelectedProductId] = useState<string>("wax");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("Doré Wax");
  const [selectedQty, setSelectedQty] = useState<number>(1);

  const activeProduct = DEMO_PRODUCTS.find((p) => p.id === selectedProductId) || DEMO_PRODUCTS[0];

  // Auto-play timer loop
  useEffect(() => {
    if (!isAutoPlay) return;

    const STEP_DURATION = 4200; // 4.2s par étape
    const INTERVAL = 100;
    const increment = (INTERVAL / STEP_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Passe à l'étape suivante
          setCurrentStep((step) => {
            if (step === 1) return 2;
            if (step === 2) return 3;
            return 1;
          });
          return 0;
        }
        return prev + increment;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  // Manuel navigation : met en pause l'auto-play
  const goToStep = (step: 1 | 2 | 3) => {
    setCurrentStep(step);
    setProgress(0);
    setIsAutoPlay(false);
  };

  const handleSelectProduct = (p: typeof DEMO_PRODUCTS[0]) => {
    setSelectedProductId(p.id);
    setSelectedSize(p.sizes[0] || "M");
    setSelectedColor(p.colors[0] || "Standard");
    setSelectedQty(1);
    goToStep(2);
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-sm select-none">
      {/* ── BARRE DE CONTRÔLE AUTONOME & ÉTAPES ── */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">Démo autonome en direct :</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-0.5 rounded-full"
          >
            {isAutoPlay ? "⏸ Pause" : "▶ Reprendre le défilement"}
          </button>
        </div>

        {/* Stepper interactif */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted/80 backdrop-blur-sm border shadow-inner">
          {[
            { step: 1 as const, label: "1. Vitrine", icon: ShoppingBag },
            { step: 2 as const, label: "2. Variantes", icon: Tag },
            { step: 3 as const, label: "3. WhatsApp", icon: MessageCircle },
          ].map(({ step, label, icon: Icon }) => {
            const isActive = currentStep === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(step)}
                className={cn(
                  "relative flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer overflow-hidden",
                  isActive
                    ? step === 3
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-3 w-3 shrink-0", isActive && step === 3 ? "text-white" : "text-primary")} />
                <span className="truncate">{label}</span>
                {/* Ligne de progression fine sous l'étape active */}
                {isActive && isAutoPlay && (
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CADRE SMARTPHONE ── */}
      <div className="relative rounded-[2.5rem] border-4 border-foreground/15 bg-background shadow-2xl overflow-hidden transition-all duration-300">
        {/* Status bar */}
        <div className="bg-muted/70 px-5 pt-3 pb-2 flex items-center justify-between border-b border-border/40">
          <span className="text-[10px] font-semibold text-muted-foreground">09:41</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrencyMode(currencyMode === "USD" ? "CDF" : "USD");
                setIsAutoPlay(false);
              }}
              className="text-[9px] font-bold text-primary bg-background border px-1.5 py-0.5 rounded-md hover:bg-muted cursor-pointer"
            >
              Devise : {currencyMode === "USD" ? "$ USD" : "FC"}
            </button>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              <div className="h-1.5 w-3 rounded-full bg-muted-foreground/60" />
              <div className="h-1.5 w-4 rounded-full bg-foreground/80" />
            </div>
          </div>
        </div>

        {/* ── ÉTAPE 1 : VITRINE BOUTIQUE ÉLÉGANTE ── */}
        {currentStep === 1 && (
          <div className="flex flex-col h-[445px] bg-background animate-in fade-in duration-300">
            {/* Header boutique soigné */}
            <div className="bg-gradient-to-r from-orange-600 via-primary to-amber-500 px-3.5 py-2.5 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs shadow-inner">
                      A
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-primary flex items-center justify-center">
                      <Check className="h-2 w-2 text-white stroke-[3]" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-extrabold text-xs truncate">Awa Mode Kinshasa</p>
                    </div>
                    <p className="text-[10px] text-white/90 font-medium">⭐ 4.9 · Kinshasa Gombe</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                  <ShoppingBag className="h-3 w-3" />
                  <span>1 panier</span>
                </div>
              </div>
            </div>

            {/* Hint animé */}
            <div className="bg-primary/5 border-b px-3 py-1.5 flex items-center justify-between text-[10px]">
              <span className="font-bold text-primary flex items-center gap-1 truncate">
                <Sparkles className="h-3 w-3 shrink-0" /> Étape 1 : Le client explore la vitrine
              </span>
              <span className="text-muted-foreground shrink-0">{DEMO_PRODUCTS.length} articles</span>
            </div>

            {/* Liste des produits de la vitrine */}
            <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
              {DEMO_PRODUCTS.map((p) => {
                const isSelected = p.id === activeProduct.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-2xl border p-2 transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-primary/8 border-primary/50 shadow-sm ring-1 ring-primary/20"
                        : "bg-card border-border/70 hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold truncate text-foreground group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        {p.promo && (
                          <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-[9px] font-black text-white">
                            {p.promo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-extrabold text-foreground">
                          ${p.priceUsd}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          · {p.priceCdf.toLocaleString("fr-FR")} FC
                        </span>
                      </div>
                      <p className="text-[9px] text-primary font-semibold mt-0.5">
                        {p.sizes.length} tailles · {p.colors.length} couleurs
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(p);
                      }}
                      className={cn(
                        "h-7 px-2.5 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold shrink-0 transition-transform active:scale-95 cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <span>Variantes</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom action bar */}
            <div className="p-3 pb-3.5 border-t bg-card/95">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
              >
                <span>Ouvrir l'article et ses options</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : FICHE PRODUIT & CHOIX DES VARIANTES ── */}
        {currentStep === 2 && (
          <div className="flex flex-col h-[445px] bg-background animate-in slide-in-from-right duration-300">
            {/* Header fiche */}
            <div className="px-3.5 py-2 border-b flex items-center justify-between bg-card">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                <span>Catalogue</span>
              </button>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Étape 2 : Variantes
              </span>
            </div>

            {/* Body fiche produit */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
              <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-muted shadow-sm">
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className="h-full w-full object-cover"
                />
                {activeProduct.promo && (
                  <span className="absolute top-2 right-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                    {activeProduct.promo}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">{activeProduct.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-extrabold text-foreground">
                    ${activeProduct.priceUsd}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({activeProduct.priceCdf.toLocaleString("fr-FR")} FC)
                  </span>
                </div>
              </div>

              {/* Sélecteur Taille */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Taille / Format :
                  </span>
                  <span className="text-[10px] font-bold text-primary">{selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeProduct.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSelectedSize(s);
                        setIsAutoPlay(false);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                        selectedSize === s
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélecteur Couleur */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Couleur :
                  </span>
                  <span className="text-[10px] font-bold text-primary">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeProduct.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        setIsAutoPlay(false);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                        selectedColor === c
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantité */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-foreground">Quantité :</span>
                <div className="flex items-center border rounded-xl bg-card">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQty(Math.max(1, selectedQty - 1));
                      setIsAutoPlay(false);
                    }}
                    className="h-7 w-7 grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-2 text-xs font-bold">{selectedQty}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQty(selectedQty + 1);
                      setIsAutoPlay(false);
                    }}
                    className="h-7 w-7 grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions fiche avec bouton WhatsApp aéré et ajusté */}
            <div className="p-3 pb-3.5 border-t bg-card/95 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98] text-white font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-between px-3.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4 text-white fill-white" />
                  </div>
                  <div className="text-left truncate">
                    <p className="font-extrabold text-xs leading-tight">Commander sur WhatsApp</p>
                    <p className="text-[10px] text-emerald-100 font-medium truncate">
                      ${activeProduct.priceUsd * selectedQty} ({(activeProduct.priceCdf * selectedQty).toLocaleString("fr-FR")} FC) · {selectedSize} / {selectedColor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-lg shrink-0">
                  <span>Valider</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : MESSAGE WHATSAPP REÇU EN TEMPS RÉEL ── */}
        {currentStep === 3 && (
          <div className="flex flex-col h-[445px] bg-[#EFEAE2] dark:bg-[#0c1317] animate-in fade-in duration-300">
            {/* Header WhatsApp */}
            <div className="bg-[#008069] dark:bg-[#202c33] px-3.5 py-2.5 text-white flex items-center gap-2.5 shadow-sm">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-white/25 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#008069]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Awa Mode Kinshasa</p>
                <p className="text-[10px] text-emerald-100 dark:text-zinc-400">En ligne · Compte professionnel</p>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                Direct WhatsApp
              </span>
            </div>

            {/* Chat WhatsApp */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              <div className="text-center my-0.5">
                <span className="bg-[#E1D9CE] dark:bg-[#182229] text-[9px] text-[#54656f] dark:text-[#8696a0] px-2.5 py-0.5 rounded-lg shadow-sm font-medium">
                  Aujourd'hui
                </span>
              </div>

              {/* Bulle de commande structurée */}
              <div className="relative ml-auto max-w-[96%] rounded-2xl rounded-tr-none bg-[#D9FDD3] dark:bg-[#005c4b] p-3 text-[#111b21] dark:text-[#e9edef] shadow-sm animate-in zoom-in-95 duration-200">
                <p className="font-bold text-[11px] text-[#008069] dark:text-[#25D366] mb-1">
                  🛍️ Nouvelle commande via MarketNet !
                </p>
                <p className="text-[11px] leading-tight">
                  Bonjour <strong>Awa Mode</strong>, je souhaite commander :
                </p>

                <div className="my-2 border-y border-black/10 dark:border-white/10 py-1.5 space-y-1">
                  <div className="text-[10px] leading-snug">
                    <div className="flex justify-between items-center font-semibold">
                      <span>• {selectedQty}x {activeProduct.name}</span>
                      <span>${activeProduct.priceUsd * selectedQty} ({(activeProduct.priceCdf * selectedQty).toLocaleString("fr-FR")} FC)</span>
                    </div>
                    <p className="text-[9px] text-[#54656f] dark:text-[#8696a0] pl-2 font-medium">
                      Variante : Taille {selectedSize} · {selectedColor}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-black pt-0.5">
                  <span>TOTAL :</span>
                  <span className="text-[#008069] dark:text-[#25D366]">
                    ${activeProduct.priceUsd * selectedQty} · {(activeProduct.priceCdf * selectedQty).toLocaleString("fr-FR")} FC
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 text-[10px] text-[#54656f] dark:text-[#8696a0] space-y-0.5">
                  <p>📍 Client : Sarah K. (Kinshasa / Gombe)</p>
                  <p>💳 Paiement : Mobile Money ou Cash à la livraison</p>
                </div>

                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#54656f] dark:text-[#8696a0]">
                  <span>09:42</span>
                  <span className="text-[#53bdeb] font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Back action */}
            <div className="p-3 pb-3.5 border-t bg-card/95">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full h-9 rounded-xl border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span>Recommencer la démo depuis le catalogue</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PROMO_CAMPAIGNS = [
  {
    id: "promo-kazi",
    storeName: "Maison Kazi Kinshasa",
    city: "Kinshasa Gombe",
    campaignTitle: "🔥 Vente Flash Soirée Wax",
    countdown: "04h 28m restantes",
    discountBadge: "-35%",
    headerGradient: "from-rose-600 via-rose-500 to-orange-500",
    avatarBg: "bg-white/20",
    avatarInitial: "M",
    products: [
      {
        name: "Robe Sirène Wax Brodé",
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 40,
        oldPriceCdf: 112000,
        promoPriceUsd: 26,
        promoPriceCdf: 72800,
        discount: "-35%",
        variantInfo: "Tailles S à XL · 3 motifs",
      },
      {
        name: "Kimono Chic Bogolan",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 30,
        oldPriceCdf: 84000,
        promoPriceUsd: 22,
        promoPriceCdf: 61600,
        discount: "-27%",
        variantInfo: "Taille unique · 2 coloris",
      },
      {
        name: "Sac Cabas Cuir & Wax",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 35,
        oldPriceCdf: 98000,
        promoPriceUsd: 28,
        promoPriceCdf: 78400,
        discount: "-20%",
        variantInfo: "Cuir véritable · Anses tressées",
      },
    ],
  },
  {
    id: "promo-kenza",
    storeName: "Kenza Sneakerhub",
    city: "Lubumbashi Centre",
    campaignTitle: "⚡ Spécial Streetwear & Sneakers",
    countdown: "Offre limitée - Stock réduit",
    discountBadge: "-30%",
    headerGradient: "from-amber-600 via-orange-500 to-rose-500",
    avatarBg: "bg-white/20",
    avatarInitial: "K",
    products: [
      {
        name: "Sneakers Urban Retro Low",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 50,
        oldPriceCdf: 140000,
        promoPriceUsd: 35,
        promoPriceCdf: 98000,
        discount: "-30%",
        variantInfo: "Pointures 40 à 45 · Cuir",
      },
      {
        name: "Mocassins Cuir Suédé Élite",
        image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 55,
        oldPriceCdf: 154000,
        promoPriceUsd: 39,
        promoPriceCdf: 109200,
        discount: "-29%",
        variantInfo: "Noir & Marron Cognac",
      },
      {
        name: "Sandales Été Perlées",
        image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 25,
        oldPriceCdf: 70000,
        promoPriceUsd: 18,
        promoPriceCdf: 50400,
        discount: "-28%",
        variantInfo: "Artisanal · Cuir souple",
      },
    ],
  },
  {
    id: "promo-elikya",
    storeName: "Elikya Prestige & Fragrances",
    city: "Goma Les Volcans",
    campaignTitle: "✨ Coffrets Beauté & Parfums",
    countdown: "Dernières 24 heures",
    discountBadge: "-40%",
    headerGradient: "from-purple-600 via-pink-600 to-rose-500",
    avatarBg: "bg-white/20",
    avatarInitial: "E",
    products: [
      {
        name: "Coffret Extrait d'Oud Royal",
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 45,
        oldPriceCdf: 126000,
        promoPriceUsd: 27,
        promoPriceCdf: 75600,
        discount: "-40%",
        variantInfo: "Flacon 100ml + Déodorant",
      },
      {
        name: "Sérum Éclat Vitaminé & Argan",
        image: "https://images.unsplash.com/photo-1608248597359-2164478419eb?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 20,
        oldPriceCdf: 56000,
        promoPriceUsd: 14,
        promoPriceCdf: 39200,
        discount: "-30%",
        variantInfo: "Flacon pipette 50ml",
      },
      {
        name: "Brume Solaire Ambrée",
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=350&q=80",
        oldPriceUsd: 18,
        oldPriceCdf: 50400,
        promoPriceUsd: 12.5,
        promoPriceCdf: 35000,
        discount: "-30%",
        variantInfo: "Tenue longue durée 250ml",
      },
    ],
  },
];

function AutonomousPromotionShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);

  const campaign = PROMO_CAMPAIGNS[activeIdx];

  // Défilement automatique autonome
  useEffect(() => {
    if (!isAutoPlay) return;

    const DURATION = 4500; // 4.5s par modèle de promotion
    const INTERVAL = 100;
    const step = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIdx((current) => (current + 1) % PROMO_CAMPAIGNS.length);
          return 0;
        }
        return prev + step;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const selectCampaign = (idx: number) => {
    setActiveIdx(idx);
    setProgress(0);
    setIsAutoPlay(false);
  };

  return (
    <div className="relative mx-auto max-w-sm w-full select-none">
      {/* Contrôle autoplay et sélecteur de modèle */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px]">Campagnes réelles en direct :</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer bg-rose-500/10 px-2 py-0.5 rounded-full"
          >
            {isAutoPlay ? "⏸ Pause" : "▶ Défilement auto"}
          </button>
        </div>

        {/* Boutons modèles */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted/80 backdrop-blur-sm border shadow-inner">
          {PROMO_CAMPAIGNS.map((c, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCampaign(idx)}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer overflow-hidden",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate">{c.storeName.split(" ")[0]}</span>
                <span className="text-[9px] font-extrabold text-rose-500">{c.discountBadge}</span>
                {isActive && isAutoPlay && (
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-rose-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Carte promotionnelle autonome */}
      <div className="relative rounded-3xl border bg-card shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header dynamique de la boutique réelle */}
        <div className={cn("bg-gradient-to-r p-4 text-white shadow-sm", campaign.headerGradient)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                {campaign.avatarInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-sm truncate">{campaign.storeName}</p>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-white/80 font-medium truncate">{campaign.city}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                <Clock className="h-3 w-3" />
                <span className="hidden sm:inline">Flash</span>
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/20 text-xs">
            <span className="font-bold flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 fill-white text-white" />
              {campaign.campaignTitle}
            </span>
            <span className="text-[10px] text-white/90 font-semibold">{campaign.countdown}</span>
          </div>
        </div>

        {/* Liste des produits réels en promotion */}
        <div className="p-3.5 space-y-2.5 bg-background/50">
          {campaign.products.map((product) => (
            <div
              key={product.name}
              className="group flex items-center gap-3 rounded-2xl border bg-card p-2.5 transition-all hover:border-rose-500/40 hover:shadow-md"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-14 w-14 rounded-xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate text-foreground group-hover:text-rose-500 transition-colors">
                    {product.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-[9px] font-black text-white">
                    {product.discount}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xs font-extrabold text-rose-500">
                    ${product.promoPriceUsd}
                  </span>
                  <span className="text-[11px] font-bold text-foreground">
                    ({product.promoPriceCdf.toLocaleString("fr-FR")} FC)
                  </span>
                  <span className="text-[10px] text-muted-foreground line-through ml-auto">
                    ${product.oldPriceUsd}
                  </span>
                </div>

                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                  {product.variantInfo}
                </p>
              </div>

              <div className="shrink-0 h-8 w-8 rounded-xl bg-emerald-500/15 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
                <MessageCircle className="h-4 w-4 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer avec bouton WhatsApp optimisé */}
        <div className="p-3 border-t bg-card">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 px-1 text-muted-foreground">
            <span>Remise immédiate garantie</span>
            <span className="text-rose-500 font-bold">Jusqu'à {campaign.discountBadge}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const text = encodeURIComponent(`Bonjour ${campaign.storeName}, je souhaite commander un article en promotion : ${campaign.products[0].name} à $${campaign.products[0].promoPriceUsd} (${campaign.products[0].promoPriceCdf.toLocaleString("fr-FR")} FC)`);
              window.open(`https://wa.me/243810000000?text=${text}`, "_blank");
            }}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <MessageCircle className="h-4 w-4 fill-white text-white" />
            <span>Commander en promo sur WhatsApp</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </button>
        </div>

        {/* Badge promotionnel flottant animé */}
        <div className="absolute -top-3 -right-3 rounded-2xl bg-rose-500 px-3 py-1.5 text-white font-black text-sm shadow-xl shadow-rose-500/40 animate-[bounce_2.5s_infinite]">
          {campaign.discountBadge}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const { data: plans } = useQuery({
    queryKey: ["plans-public"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("position");
      // Seulement les vrais plans de la base de données
      return data && data.length > 0 ? data : null;
    },
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-primary/20">

      {/* ── HEADER ── */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8" style={{ justifyContent: "space-between" }}>

          {/* Logo — toujours à gauche, jamais centré */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-extrabold tracking-tight text-foreground text-xl"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg shadow-md shadow-primary/30">
                M
              </span>
              Market<span className="text-primary">Net</span>
            </Link>
          </div>

          {/* Desktop nav — centre */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#promotions" className="transition-colors hover:text-foreground">Promotions</a>
            <a href="#temoignages" className="transition-colors hover:text-foreground">Témoignages</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">Comment ça marche</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Tarifs</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>

          {/* Desktop CTA — droite */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full text-sm font-semibold" asChild>
              <Link to="/auth" search={{ mode: "login" }}>Connexion</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5 font-bold shadow-md hover:scale-105 active:scale-95 transition-transform" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Créer ma boutique</Link>
            </Button>
          </div>

          {/* Mobile burger */}
          <div className="flex items-center lg:hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-10 w-10 place-items-center rounded-xl border bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b bg-background/98 backdrop-blur-lg px-4 pt-2 pb-6 space-y-1 shadow-xl animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-1 pt-2">
              {[
                { href: "#features", icon: Sparkles, label: "Fonctionnalités", color: "text-primary" },
                { href: "#promotions", icon: BadgePercent, label: "Promotions", color: "text-rose-500" },
                { href: "#temoignages", icon: Quote, label: "Témoignages réels", color: "text-amber-500" },
                { href: "#how-it-works", icon: Layers, label: "Comment ça marche", color: "text-blue-500" },
                { href: "#pricing", icon: CreditCard, label: "Tarifs", color: "text-cyan-500" },
                { href: "#faq", icon: HelpCircle, label: "FAQ", color: "text-purple-500" },
              ].map(({ href, icon: Icon, label, color }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className={cn("h-4 w-4 shrink-0", color)} />
                  {label}
                </a>
              ))}
            </nav>
            <div className="pt-3 border-t">
              <Button size="lg" className="w-full rounded-xl font-bold h-11 justify-center text-sm shadow-md" asChild>
                <Link to="/auth" search={{ mode: "login" }} onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="h-4 w-4 mr-2" /> Connexion
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-primary/6 blur-[120px]" />
          <div className="absolute right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
          <div className="absolute left-[5%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-rose-500/4 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="text-center lg:text-left">
              <FadeIn className="delay-0">
                <span className="inline-flex items-center gap-2 rounded-full border bg-secondary/50 px-4 py-1.5 text-sm font-semibold text-secondary-foreground backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Pour l'Afrique francophone
                </span>
              </FadeIn>

              <FadeIn className="delay-100">
                <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                  Votre boutique en ligne.{" "}
                  <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                    Commandes WhatsApp.
                  </span>
                </h1>
              </FadeIn>

              <FadeIn className="delay-200">
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl lg:max-w-xl">
                  Arrêtez de perdre des ventes en message privé. Offrez à vos clients un catalogue clair, des promotions attractives et recevez des commandes parfaitement structurées.
                </p>
              </FadeIn>

              <FadeIn className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start delay-300">
                <Button size="lg" className="h-14 w-full rounded-full px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 sm:w-auto" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    <Store className="mr-2 h-5 w-5" />
                    Lancer ma boutique
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 w-full rounded-full px-8 text-lg font-bold transition-all hover:bg-secondary active:scale-95 sm:w-auto" asChild>
                  <Link to="/auth" search={{ mode: "login" }}>Se connecter</Link>
                </Button>
              </FadeIn>

              <FadeIn className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start delay-500">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Sans engagement</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Prêt en 5 min</span>
                <span className="flex items-center gap-1.5"><Megaphone className="h-4 w-4 text-primary" /> Promos incluses</span>
              </FadeIn>
            </div>

            <FadeIn className="delay-500 relative">
              <InteractiveHeroDemo />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { icon: Users, color: "text-primary bg-primary/10", end: 500, suffix: "+", label: "Vendeurs actifs" },
              { icon: TrendingUp, color: "text-blue-500 bg-blue-500/10", end: 3, prefix: "x", label: "Hausse des ventes" },
              { icon: MessageCircle, color: "text-green-500 bg-green-500/10", end: 10, suffix: "k+", label: "Commandes WhatsApp" },
              { icon: Zap, color: "text-amber-500 bg-amber-500/10", end: 99, suffix: "%", label: "Disponibilité" },
            ].map(({ icon: Icon, color, end, suffix, prefix, label }, i) => (
              <ScrollReveal key={label} delay={i * 80} direction="up">
                <div className={cn("mx-auto grid h-12 w-12 place-items-center rounded-2xl mb-3", color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-3xl font-extrabold text-foreground">
                  <CountUp end={end} suffix={suffix} prefix={prefix} />
                </h4>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center" direction="up">
            <SectionBadge><Sparkles className="h-3.5 w-3.5" /> Fonctionnalités</SectionBadge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Tout ce dont vous avez besoin</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              MarketNet a été pensé spécifiquement pour les réalités du commerce en Afrique francophone.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 60} direction="up">
                <div className="group relative h-full overflow-hidden rounded-3xl border bg-card p-7 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20">
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/4 transition-transform group-hover:scale-[2]" />
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl mb-5", f.bg)}>
                    <f.icon className={cn("h-5 w-5", f.color)} />
                  </div>
                  <h3 className="text-base font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMOTIONS ── */}
      <section id="promotions" className="py-24 scroll-mt-20 bg-gradient-to-b from-rose-500/4 to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left text */}
            <ScrollReveal direction="left">
              <SectionBadge><BadgePercent className="h-3.5 w-3.5 text-rose-500" /> Promotions</SectionBadge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Boostez vos ventes avec des{" "}
                <span className="text-rose-500">promotions puissantes</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Créez des offres limitées dans le temps, des réductions par catégorie, et attirez plus de clients. Vos promotions s'affichent automatiquement sur votre boutique avec des badges accrocheurs.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {PROMO_FEATURES.map((pf, i) => (
                  <ScrollReveal key={pf.title} delay={i * 80} direction="up">
                    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm h-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                        <pf.icon className="h-4 w-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{pf.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{pf.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="mt-8">
                <Button size="lg" className="rounded-full px-7 font-bold" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    <Rocket className="mr-2 h-4 w-4" /> Créer ma première promotion
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* Right visual: Carte promotionnelle autonome avec campagnes réelles en direct */}
            <ScrollReveal direction="right" delay={150}>
              <AutonomousPromotionShowcase />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES RÉELS ── */}
      <section id="temoignages" className="py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center">
            <SectionBadge>
              <Quote className="h-3.5 w-3.5 text-primary" /> Témoignages réels
            </SectionBadge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Ils développent leur commerce avec MarketNet
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment des vendeurs de Kinshasa, Lubumbashi et Goma ont transformé leurs ventes WhatsApp au quotidien.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((item, i) => (
              <ScrollReveal key={item.name} delay={i * 100} direction="up">
                <div className="flex flex-col justify-between h-full rounded-3xl border bg-card p-7 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20">
                  <div>
                    {/* Stars + metric badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, idx) => (
                          <Star key={idx} className="h-4 w-4 fill-amber-500" />
                        ))}
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        {item.metric}
                      </span>
                    </div>

                    {/* Quote */}
                    <p className="text-sm text-foreground/90 leading-relaxed italic mb-6">
                      « {item.quote} »
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md", item.color)}>
                      {item.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm truncate text-foreground">{item.name}</p>
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.shop} • {item.city}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-secondary/30 py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center">
            <SectionBadge><Layers className="h-3.5 w-3.5" /> Processus</SectionBadge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Comment ça marche ?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Trois étapes simples pour transformer vos abonnés en clients fidèles.</p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 120} direction="up">
                <div className="relative h-full rounded-3xl bg-card p-8 shadow-sm transition-transform hover:-translate-y-1.5 border hover:border-primary/20 hover:shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
                      {i + 1}
                    </span>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                  </div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      {!!plans?.length && (
        <section id="pricing" className="py-24 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up" className="text-center">
              <SectionBadge><CreditCard className="h-3.5 w-3.5" /> Tarifs</SectionBadge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Des tarifs transparents</h2>
              <p className="mt-4 text-lg text-muted-foreground">Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt.</p>
            </ScrollReveal>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12 max-w-4xl mx-auto">
              {plans.map((p, i) => {
                const priceCdf = Number((p as any).price_cdf ?? 0);
                const isFree = priceCdf === 0;

                return (
                  <ScrollReveal key={p.id} delay={i * 100} direction="up">
                    <div className={cn(
                      "relative flex h-full flex-col rounded-3xl border bg-card p-8",
                      p.id === "pro" ? "border-primary/50 shadow-2xl shadow-primary/10" : "shadow-sm hover:shadow-md transition-shadow"
                    )}>
                      {p.id === "pro" && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-bold tracking-wide text-primary-foreground shadow-sm">
                          RECOMMANDÉ
                        </span>
                      )}

                      <h3 className="text-2xl font-bold">{p.name}</h3>
                      <p className="mt-4 font-display text-4xl sm:text-5xl font-extrabold">
                        {isFree ? "Gratuit" : formatCDF(priceCdf)}
                        <span className="text-lg font-normal text-muted-foreground">{!isFree ? " /mois" : ""}</span>
                      </p>

                      <ul className="mt-8 flex-1 space-y-3">
                        {[
                          { show: true, text: p.max_products != null ? `Jusqu'à ${p.max_products} produits` : "Produits illimités", strong: true },
                          { show: Boolean(p.max_photos), text: `${p.max_photos ?? 3} photos par produit` },
                          { 
                            show: true, 
                            text: (p as any).max_active_promotions === 0
                              ? "0 promotion incluse"
                              : (p as any).max_active_promotions != null 
                                ? `${(p as any).max_active_promotions} promotions actives max` 
                                : "Promotions actives illimitées" 
                          },
                          { show: true, text: "Partage direct WhatsApp & réseaux sociaux" },
                          { show: Boolean(p.advanced_themes), text: "Thèmes avancés" },
                          { show: Boolean(p.advanced_stats), text: "Statistiques Pro" },
                          { show: true, text: "Commandes WhatsApp directes" },
                        ].filter(f => f.show).map(f => (
                          <li key={f.text} className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-1 shrink-0">
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className={cn("text-sm", f.strong ? "font-semibold" : "text-muted-foreground")}>{f.text}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        asChild
                        className="mt-8 w-full rounded-full h-12 text-base font-bold"
                        variant={isFree ? "outline" : "default"}
                      >
                        <Link to="/auth" search={{ mode: "signup" }}>
                          {isFree ? "Commencer gratuitement" : `Choisir ${p.name}`}
                        </Link>
                      </Button>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 scroll-mt-20 bg-muted/20 border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center">
            <SectionBadge>
              <HelpCircle className="h-3.5 w-3.5 text-primary" /> Foire Aux Questions
            </SectionBadge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Des réponses claires et précises pour démarrer sereinement votre boutique en ligne.
            </p>
          </ScrollReveal>

          <div className="mt-12">
            <ScrollReveal direction="up" delay={100}>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {FAQ_ITEMS.map((faq, i) => (
                  <AccordionItem
                    key={faq.q}
                    value={`item-${i}`}
                    className="rounded-2xl border bg-card px-6 py-1 shadow-sm transition-all hover:border-primary/20"
                  >
                    <AccordionTrigger className="text-left font-bold text-sm sm:text-base py-4 hover:no-underline hover:text-primary">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollReveal>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez une autre question ?{" "}
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Créez votre boutique gratuitement en 5 minutes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal direction="up">
            <h2 className="text-4xl font-extrabold sm:text-5xl">Prêt à digitaliser vos ventes ?</h2>
            <p className="mt-6 text-xl text-primary-foreground/80">
              Rejoignez des centaines de commerçants qui ont déjà transformé leur business avec MarketNet.
            </p>
            <div className="mt-10 flex justify-center">
              <Button size="lg" variant="secondary" className="h-14 rounded-full px-10 text-lg font-bold shadow-2xl transition-transform hover:scale-105 active:scale-95" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Store className="mr-2 h-5 w-5" />
                  Créer ma boutique maintenant
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/60">Prêt en 5 minutes · Formule gratuite disponible · Annulable à tout moment</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Logo footer — clic pour remonter en haut avec défilement fluide */}
            <Link
              to="/"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="flex items-center gap-2 font-extrabold tracking-tight text-foreground text-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-base shadow-md shadow-primary/30">M</span>
              Market<span className="text-primary">Net</span>
            </Link>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} MarketNet. Tous droits réservés.</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Conditions d'utilisation</Link>
              <span className="opacity-40">•</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
              <span className="opacity-40">•</span>
              <Link to="/data-deletion" className="hover:text-foreground transition-colors">Suppression des données</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
