import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Check, MessageCircle, Palette, Smartphone, Store, Zap, ArrowRight,
  TrendingUp, Users, ShieldCheck, Menu, X, Sparkles, Layers, CreditCard,
  LogIn, Tag, Megaphone, BarChart3, Globe2, Star,
  Share2, Gift, Send, HelpCircle, Quote, ShoppingBag, Plus, Minus,
  CheckCircle2, Wallet,
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
  { icon: MessageCircle, color: "text-green-500", bg: "bg-green-500/10", title: "Commandes WhatsApp", text: "Le client compose son panier, vous recevez la commande détaillée directement." },
  { icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Double devise ($ & Francs)", text: "Vos prix s'affichent automatiquement en Dollars et Francs Congolais (CDF)." },
  { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", title: "0% de commission", text: "MarketNet ne prélève aucune commission sur vos ventes. Vous gardez l'intégralité de vos bénéfices." },
  { icon: Smartphone, color: "text-cyan-500", bg: "bg-cyan-500/10", title: "Pensé pour le mobile", text: "Léger et ultra-rapide, optimisé pour les connexions mobiles africaines (3G/4G)." },
  { icon: Palette, color: "text-purple-500", bg: "bg-purple-500/10", title: "À votre image", text: "Personnalisez couleurs, bannière, thème et catégories en quelques clics." },
  { icon: Globe2, color: "text-primary", bg: "bg-primary/10", title: "Lien universel", text: "Un lien unique à placer dans votre statut WhatsApp, bio TikTok ou Instagram." },
  { icon: Tag, color: "text-rose-500", bg: "bg-rose-500/10", title: "Gestion des stocks & options", text: "Gérez vos quantités, tailles et couleurs directement depuis votre téléphone." },
];

const STEPS = [
  {
    step: "01",
    time: "5 minutes",
    title: "Créez votre catalogue",
    desc: "Prenez vos articles en photo avec votre smartphone, indiquez vos prix en $ ou en Francs Congolais, et configurez vos options (tailles, couleurs).",
  },
  {
    step: "02",
    time: "1 clic",
    title: "Partagez votre lien",
    desc: "Placez votre lien MarketNet dans votre bio TikTok, vos statuts WhatsApp, Instagram ou Facebook. Vos clients explorent votre vitrine sans rien installer.",
  },
  {
    step: "03",
    time: "Instantané",
    title: "Recevez les commandes sur WhatsApp",
    desc: "Le client valide son panier en 3 clics. Votre WhatsApp s'ouvre avec la commande complète et structurée pour organiser la livraison.",
  },
];

const COMPARISON_ITEMS = [
  {
    problem: "Passer 2 à 3 heures par jour à répondre « C'est combien ? » et « C'est dispo ? »",
    solution: "Un lien unique dans votre statut avec tous vos articles, prix et photos toujours à jour",
  },
  {
    problem: "Envoyer 50 photos lourdes en DM qui bloquent et ralentissent la connexion du client",
    solution: "Une vitrine web ultra-légère qui s'ouvre instantanément même en connexion 3G",
  },
  {
    problem: "Commandes floues et oubliées dans le fil de discussion sans taille ni adresse",
    solution: "Un récapitulatif WhatsApp structuré avec taille, couleur, quantité et montant exact",
  },
  {
    problem: "Calculs compliqués et hésitations entre Dollars ($) et Francs Congolais (CDF)",
    solution: "Double affichage automatique en $ et Francs calculé selon votre propre taux",
  },
  {
    problem: "Clients découragés par l'attente qui finissent par acheter chez la concurrence",
    solution: "Parcours d'achat autonome en 3 clics : vos clients commandent même pendant votre sommeil",
  },
];

const TESTIMONIALS = [
  {
    name: "Chantal Mbuyi",
    role: "Créatrice & Gérante",
    shop: "Awa Fashion & Wax",
    city: "Kinshasa (Gombe)",
    avatar: "/testimonials/chantal.jpg",
    quote: "Fini de répéter les prix en DM. Mes clientes cliquent sur mon lien et la commande arrive prête sur WhatsApp. J'ai doublé mes ventes !",
    metric: "Ventes doublées",
    rating: 5,
  },
  {
    name: "Dieudonné Kalala",
    role: "Responsable Ventes",
    shop: "TechStore 243",
    city: "Lubumbashi",
    avatar: "/testimonials/dieudonne.jpg",
    quote: "Mes clients voient le stock et les prix en $ et en Francs. Le panier arrive tout calculé et structuré, il ne me reste plus qu'à valider et livrer.",
    metric: "0% de commission",
    rating: 5,
  },
  {
    name: "Grace Nsimba",
    role: "Fondatrice",
    shop: "Flora & Kivu",
    city: "Goma",
    avatar: "/testimonials/grace.jpg",
    quote: "Je gère toute ma boutique sur mon smartphone en 5 minutes. Mes clientes adorent la rapidité et le récapitulatif clair.",
    metric: "100% sur mobile",
    rating: 5,
  },
  {
    name: "Patrick Tshisekedi",
    role: "Gérant",
    shop: "Kinshasa Vibes",
    city: "Kinshasa (Bandal)",
    avatar: "/testimonials/patrick.jpg",
    quote: "Avant, je passais mes soirées à répondre 'c'est dispo en 42 ?'. Maintenant, le client choisit sa pointure et commande en 3 clics.",
    metric: "3h gagnées par jour",
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
    q: "Comment les commandes arrivent-elles ?",
    a: "Dès que le client valide son panier sur votre catalogue, votre WhatsApp s'ouvre avec le message récapitulatif complet de sa commande (articles, options, quantités, montant total et adresse de livraison). Vous gardez le contact direct avec votre client.",
  },
  {
    q: "Puis-je ajouter des variantes (tailles, pointures, couleurs) sur mes produits ?",
    a: "Oui, vous pouvez facilement configurer des variantes comme les tailles, pointures ou couleurs avec des prix personnalisés si nécessaire. Le client sélectionne ses options et vous recevez le récapitulatif exact sur WhatsApp.",
  },
  {
    q: "Ai-je besoin d'un ordinateur pour gérer ma boutique ?",
    a: "Pas du tout ! 100% de MarketNet est conçu et optimisé pour smartphone. Vous pouvez prendre des photos de vos articles, ajuster vos prix, gérer vos stocks et variantes, et suivre vos commandes directement depuis votre téléphone.",
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
  const [displayStep, setDisplayStep] = useState<1 | 2 | 3>(1);
  const [isVisible, setIsVisible] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [localTime, setLocalTime] = useState("--:--");
  const demoScrollRef = useRef<HTMLDivElement | null>(null);

  // Product state
  const [selectedProductId, setSelectedProductId] = useState<string>("wax");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("Doré Wax");
  const [selectedQty, setSelectedQty] = useState<number>(1);

  const activeProduct = DEMO_PRODUCTS.find((p) => p.id === selectedProductId) || DEMO_PRODUCTS[0];

  // Afficher l'heure réelle du visiteur selon le fuseau horaire de son appareil.
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const updateLocalTime = () => setLocalTime(formatter.format(new Date()));

    updateLocalTime();
    const timer = window.setInterval(updateLocalTime, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  // Transition fluide entre étapes
  const transitionToStep = (step: 1 | 2 | 3) => {
    if (step === currentStep) return;
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(step);
      setDisplayStep(step);
      setIsVisible(true);
    }, 220);
  };

  // Auto-play timer loop
  useEffect(() => {
    if (!isAutoPlay) return;

    const STEP_DURATION = 4800;
    const STEP_ORDER: Record<1 | 2 | 3, 1 | 2 | 3> = { 1: 2, 2: 3, 3: 1 };
    const startedAt = Date.now() - (progress / 100) * STEP_DURATION;
    let transitionTimer: number | undefined;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < STEP_DURATION) {
        setProgress((elapsed / STEP_DURATION) * 100);
        return;
      }

      window.clearInterval(timer);
      const nextStep = STEP_ORDER[currentStep];
      setProgress(0);
      setIsVisible(false);
      transitionTimer = window.setTimeout(() => {
        setCurrentStep(nextStep);
        setDisplayStep(nextStep);
        setIsVisible(true);
      }, 220);
    }, 50);

    return () => {
      window.clearInterval(timer);
      if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
    };
  }, [currentStep, isAutoPlay]);

  // Petit défilement automatique de la zone visible, comme lors d'une vraie navigation mobile.
  useEffect(() => {
    const scrollArea = demoScrollRef.current;
    if (!scrollArea) return;

    scrollArea.scrollTop = 0;
    if (!isAutoPlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let returnTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
      if (maxScroll < 32) return;

      scrollArea.scrollTo({
        top: Math.min(maxScroll, Math.max(48, scrollArea.clientHeight * 0.38)),
        behavior: "smooth",
      });
      returnTimer = window.setTimeout(() => {
        scrollArea.scrollTo({ top: 0, behavior: "smooth" });
      }, 1900);
    }, 900);

    return () => {
      window.clearTimeout(startTimer);
      if (returnTimer !== undefined) window.clearTimeout(returnTimer);
    };
  }, [displayStep, isAutoPlay]);

  // Navigation manuelle : met en pause et fait une transition fluide
  const goToStep = (step: 1 | 2 | 3) => {
    setProgress(0);
    setIsAutoPlay(false);
    transitionToStep(step);
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
      {/* ── CADRE SMARTPHONE ── */}
      <div className="relative rounded-[2.5rem] border-4 border-foreground/15 bg-background shadow-2xl overflow-hidden">
        {/* Status bar simplifiée */}
        <div className="bg-muted/70 px-5 pt-3 pb-2 flex items-center justify-between border-b border-border/40">
          <time className="text-[10px] font-semibold text-muted-foreground">{localTime}</time>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            <div className="h-1.5 w-3 rounded-full bg-muted-foreground/60" />
            <div className="h-1.5 w-4 rounded-full bg-foreground/80" />
          </div>
        </div>

        {/* Navigation de la démo intégrée au téléphone */}
        <div className="border-b border-[#eee7df] bg-[#fffdfa] px-3 pt-2 pb-2">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-[#e9dfd4]">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((currentStep - 1) * 100) / 3 + (isAutoPlay ? progress / 3 : 0)}%`,
                transition: isAutoPlay ? "width 50ms linear" : "width 350ms ease",
              }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Démo en direct</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
            >
              {isAutoPlay ? "⏸ Pause" : "▶ Reprendre"}
            </button>
          </div>
        </div>

        {/* ── CONTENU DES ÉTAPES — transition fade fluide ── */}
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        >

        {/* ── ÉTAPE 1 : VITRINE BOUTIQUE ÉLÉGANTE ── */}
        {displayStep === 1 && (
          <div className="flex flex-col h-[445px] bg-[#fffdfa]">
            {/* Header boutique soigné */}
            <div className="bg-gradient-to-r from-orange-500 via-primary to-amber-500 px-3.5 py-2.5 text-white shadow-sm shadow-orange-900/10">
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
                      <p className="font-extrabold text-xs truncate">Mère JO business</p>
                    </div>
                    <p className="text-[10px] text-white/90 font-medium">⭐ 4.9 · Lubumbashi · Kalubwe</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                  <ShoppingBag className="h-3 w-3" />
                  <span>1 panier</span>
                </div>
              </div>
            </div>

            {/* Hint animé */}
            <div className="bg-orange-50/80 border-b border-orange-100/80 px-3 py-1.5 flex items-center justify-between text-[10px]">
              <span className="font-bold text-primary flex items-center gap-1 truncate">
                <Sparkles className="h-3 w-3 shrink-0" /> Étape 1 : Le client explore la vitrine
              </span>
              <span className="text-muted-foreground shrink-0">{DEMO_PRODUCTS.length} articles</span>
            </div>

            {/* Liste des produits de la vitrine */}
            <div ref={demoScrollRef} className="no-scrollbar overscroll-auto flex-1 p-2.5 space-y-2 overflow-y-auto">
              {DEMO_PRODUCTS.map((p) => {
                const isSelected = p.id === activeProduct.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-2xl border p-2 transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-orange-50/80 border-orange-200 shadow-sm ring-1 ring-orange-100"
                        : "bg-white border-[#eee7df] hover:border-orange-200 hover:bg-[#fffaf5]"
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
                          ? "bg-primary text-primary-foreground shadow-sm shadow-orange-900/10"
                          : "bg-orange-50 text-orange-700 hover:bg-orange-100"
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
            <div className="p-3 pb-3.5 border-t border-[#eee7df] bg-white/95">
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
        {displayStep === 2 && (
          <div className="flex flex-col h-[445px] bg-[#fffdfa]">
            {/* Header fiche */}
            <div className="px-3.5 py-2 border-b border-[#eee7df] flex items-center justify-between bg-white">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                <span>Catalogue</span>
              </button>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full">
                Étape 2 : Variantes
              </span>
            </div>

            {/* Body fiche produit */}
            <div ref={demoScrollRef} className="no-scrollbar overscroll-auto flex-1 p-3 overflow-y-auto space-y-2.5">
              <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-[#f4eee7] shadow-sm ring-1 ring-black/5">
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
            <div className="p-3 pb-3.5 border-t border-[#eee7df] bg-white/95 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98] text-white font-bold shadow-md shadow-emerald-700/20 flex items-center justify-between px-3.5 transition-all cursor-pointer"
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
        {displayStep === 3 && (
          <div className="flex flex-col h-[445px] bg-[#f5f3ee] dark:bg-[#0c1317]">
            {/* Header WhatsApp */}
            <div className="bg-[#008069] dark:bg-[#202c33] px-3.5 py-2.5 text-white flex items-center gap-2.5 shadow-sm">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-white/25 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#008069]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Mère JO business</p>
                <p className="text-[10px] text-emerald-100 dark:text-zinc-400">En ligne · Compte professionnel</p>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                Direct WhatsApp
              </span>
            </div>

            {/* Chat WhatsApp */}
            <div ref={demoScrollRef} className="no-scrollbar overscroll-auto flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              <div className="text-center my-0.5">
                <span className="bg-white/85 dark:bg-[#182229] text-[9px] text-[#68736f] dark:text-[#8696a0] px-2.5 py-0.5 rounded-lg shadow-sm font-medium">
                  Aujourd'hui
                </span>
              </div>

              {/* Bulle de commande structurée */}
              <div className="relative ml-auto max-w-[96%] rounded-2xl rounded-tr-none bg-[#edf8e9] dark:bg-[#005c4b] p-3 text-[#26332e] dark:text-[#e9edef] shadow-sm ring-1 ring-emerald-900/5 animate-in zoom-in-95 duration-200">
                <p className="font-bold text-[11px] text-[#008069] dark:text-[#25D366] mb-1">
                  🛍️ Nouvelle commande via MarketNet !
                </p>
                <p className="text-[11px] leading-tight">
                  Bonjour <strong>Mère JO</strong>, je souhaite commander :
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
                  <p>📍 Client : Sarah K. (Lubumbashi / Kalubwe)</p>
                </div>

                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#54656f] dark:text-[#8696a0]">
                  <span>09:42</span>
                  <span className="text-[#53bdeb] font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Back action */}
            <div className="p-3 pb-3.5 border-t border-[#e7e3dc] bg-white/95">
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
        </div>{/* fin wrapper fade */}
      </div>
    </div>
  );
}

function FloatingWhatsAppSupport() {
  const message = "Bonjour MarketNet, je souhaite avoir des renseignements pour créer ma boutique en ligne.";
  const url = `https://wa.me/243906619747?text=${encodeURIComponent(message)}`;

  return (
    <aside aria-label="Assistance WhatsApp MarketNet" className="fixed bottom-5 right-5 z-40">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Discuter sur WhatsApp"
        aria-label="Contacter le support MarketNet sur WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-emerald-950/30 transition-all hover:scale-110 active:scale-95 border-2 border-white/30 select-none cursor-pointer"
      >
        <MessageCircle className="h-7 w-7 fill-white text-white" />
      </a>
    </aside>
  );
}

function TestimonialsSection() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section id="temoignages" className="py-24 scroll-mt-20 overflow-hidden bg-muted/20 border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto">
          <SectionBadge>
            <Quote className="h-3.5 w-3.5 text-primary" /> Témoignages vérifiés
          </SectionBadge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ils développent leur commerce avec MarketNet
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Des commerçants de Kinshasa, Lubumbashi et Goma partagent leurs résultats concrets sur WhatsApp.
          </p>
        </ScrollReveal>
      </div>

      {/* Marquee carrousel fluide avec dégradés latéraux doux */}
      <div
        className="relative w-full overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onClick={() => setIsPaused((prev) => !prev)}
      >
        {/* Dégradés latéraux */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Rangée animée en continu */}
        <div
          className="animate-marquee gap-6 py-4 px-3 flex"
          style={{ animationPlayState: isPaused ? "paused" : "running" }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="w-[300px] sm:w-[350px] shrink-0 flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 select-none"
            >
              <div>
                {/* Stars + metric badge */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: item.rating }).map((_, sIdx) => (
                      <Star key={sIdx} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {item.metric}
                  </span>
                </div>

                {/* Citation courte et percutante */}
                <p className="text-sm font-medium text-foreground/90 leading-relaxed italic mb-5">
                  « {item.quote} »
                </p>
              </div>

              {/* Profil commerçant africain avec photo réelle */}
              <div className="flex items-center gap-3 pt-3.5 border-t border-border/50">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="h-12 w-12 rounded-2xl object-cover shrink-0 shadow-md ring-2 ring-primary/20"
                  loading="lazy"
                  width={48}
                  height={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm truncate text-foreground">{item.name}</p>
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.shop} · {item.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <div className="min-h-screen bg-background overflow-x-clip selection:bg-primary/20">

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
            <a href="#pourquoi" className="transition-colors hover:text-foreground">Pourquoi MarketNet</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">Comment ça marche</a>
            <a href="#features" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#temoignages" className="transition-colors hover:text-foreground">Témoignages</a>
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
                { href: "#pourquoi", label: "Pourquoi MarketNet" },
                { href: "#how-it-works", label: "Comment ça marche" },
                { href: "#features", label: "Fonctionnalités" },
                { href: "#temoignages", label: "Témoignages" },
                { href: "#pricing", label: "Tarifs" },
                { href: "#faq", label: "FAQ" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-xl font-semibold text-sm text-foreground hover:bg-muted transition-colors"
                >
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
                <span className="inline-flex items-center gap-2 rounded-full border bg-primary/10 border-primary/20 px-4 py-1.5 text-xs sm:text-sm font-bold text-primary backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  La vitrine e-commerce pensée pour l'Afrique francophone
                </span>
              </FadeIn>

              <FadeIn className="delay-100">
                <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
                  Transformez vos statuts WhatsApp{" "}
                  <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    en boutique rentable.
                  </span>
                </h1>
              </FadeIn>

              <FadeIn className="delay-200">
                <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl lg:max-w-xl">
                  Arrêtez d'envoyer 50 photos et de répéter vos prix en message privé. Vos clients explorent votre catalogue clair en $ et Francs Congolais, et vous envoient leur commande prête directement sur WhatsApp.
                </p>
              </FadeIn>

              <FadeIn className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start delay-300">
                <Button size="lg" className="h-14 w-full rounded-full px-8 text-base sm:text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 sm:w-auto" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    <Store className="mr-2 h-5 w-5" />
                    Créer ma boutique gratuite
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 w-full rounded-full px-8 text-base sm:text-lg font-bold transition-all hover:bg-secondary active:scale-95 sm:w-auto" asChild>
                  <a href="#how-it-works">Comment ça marche</a>
                </Button>
              </FadeIn>

              <FadeIn className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-muted-foreground delay-400">
                <span className="flex items-center gap-1 text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> 100% sur Smartphone
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> 0% de commission
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> Prêt en 5 minutes
                </span>
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

      {/* ── COMPARATIF AVANT / AVEC MARKETNET ── */}
      <section id="pourquoi" className="py-24 scroll-mt-20 bg-muted/20 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto">
            <SectionBadge>
              <Zap className="h-3.5 w-3.5 text-primary" /> La différence MarketNet
            </SectionBadge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Arrêtez de perdre des ventes en message privé
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Vendre sur les réseaux sociaux ne devrait pas être une corvée de messages répétitifs. Comparez votre quotidien actuel avec l'expérience MarketNet.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* Sans MarketNet */}
            <ScrollReveal direction="left" delay={100}>
              <div className="h-full rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-950/[0.1] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-black">
                      <X className="h-5 w-5 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Sans MarketNet</h3>
                      <p className="text-xs text-rose-600 font-semibold">La routine lente et frustrante</p>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {COMPARISON_ITEMS.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                        <span className="flex h-5 w-5 rounded-full bg-rose-500/10 text-rose-500 items-center justify-center shrink-0 mt-0.5">
                          <X className="h-3 w-3 stroke-[3]" />
                        </span>
                        <span>{item.problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-rose-500/15 flex items-center justify-between text-xs font-semibold text-rose-600">
                  <span>❌ Risque élevé d'abandon de panier</span>
                  <span>Perte de 2h/jour</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Avec MarketNet */}
            <ScrollReveal direction="right" delay={150}>
              <div className="h-full rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/[0.04] dark:bg-emerald-950/[0.15] p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-bl-2xl">
                  Recommandé
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/30">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Avec MarketNet</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Automatisé, pro et rapide</p>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {COMPARISON_ITEMS.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium text-foreground leading-relaxed">
                        <span className="flex h-5 w-5 rounded-full bg-emerald-500 text-white items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                        <span>{item.solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>✨ 3x plus de ventes conclues</span>
                  <span>0% de commission</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="how-it-works" className="py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto">
            <SectionBadge><Layers className="h-3.5 w-3.5 text-primary" /> Processus</SectionBadge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Comment ça marche ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Trois étapes simples pour transformer vos abonnés en clients fidèles et automatiser vos ventes.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 120} direction="up">
                <div className="relative h-full rounded-3xl bg-card p-7 sm:p-8 shadow-sm transition-transform hover:-translate-y-1.5 border hover:border-primary/20 hover:shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-lg shadow-primary/30">
                        {s.step}
                      </span>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {s.time}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{s.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/30 pointer-events-none" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── L'ANATOMIE D'UNE COMMANDE WHATSAPP ── */}
      <section className="py-24 scroll-mt-20 bg-muted/20 border-y overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Texte de gauche */}
            <ScrollReveal direction="left">
              <SectionBadge>
                <MessageCircle className="h-3.5 w-3.5 text-green-500" /> Le résultat concret
              </SectionBadge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Voici exactement ce que vous recevez sur WhatsApp
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Quand un client commande sur votre vitrine MarketNet, vous n'avez pas à deviner ce qu'il veut. Tout arrive pré-rempli, clair et prêt à livrer.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Articles & Options validés d'avance",
                    desc: "La taille, la couleur et la quantité sont figées. Fini les erreurs de préparation et les allers-retours.",
                  },
                  {
                    title: "Total exact en $ et Francs Congolais",
                    desc: "Le montant est déjà calculé selon votre propre taux de change, zéro débat avec le client.",
                  },
                  {
                    title: "Coordonnées de livraison complètes",
                    desc: "Nom du client, numéro WhatsApp et quartier de livraison : vous lancez la livraison immédiatement.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button size="lg" className="rounded-full px-8 font-bold shadow-lg shadow-primary/20" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    <Store className="mr-2 h-4 w-4" /> Créer ma boutique en 5 min
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* Mockup bulle WhatsApp à droite */}
            <ScrollReveal direction="right" delay={150}>
              <div className="relative mx-auto max-w-md w-full">
                {/* Cadre style WhatsApp */}
                <div className="rounded-[2.5rem] border bg-[#efeae2] dark:bg-[#0b141a] p-4 sm:p-5 shadow-2xl relative">
                  
                  {/* Header discussion WhatsApp */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        SK
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground flex items-center gap-1">
                          Sarah Kalambay <span className="text-[10px] text-muted-foreground font-normal">· Client</span>
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En ligne via MarketNet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                      <MessageCircle className="h-3 w-3 fill-white" />
                      <span>WhatsApp</span>
                    </div>
                  </div>

                  {/* Bulle de message reçue */}
                  <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-[#1f2c34] p-4 text-xs shadow-md border border-black/5 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                      <span className="font-extrabold text-foreground flex items-center gap-1">
                        🛒 Commande #MN-4821
                      </span>
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                        Prête à livrer
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Bonjour ! Voici ma commande passée sur votre boutique MarketNet :
                    </p>

                    {/* Liste des articles */}
                    <div className="rounded-xl bg-muted/50 p-2.5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground">1x Robe Soirée Wax Moderne</p>
                          <p className="text-[10px] text-muted-foreground">Taille : L · Couleur : Doré Wax</p>
                        </div>
                        <span className="font-bold text-foreground shrink-0 ml-2">$25</span>
                      </div>
                      <div className="flex justify-between items-start border-t border-border/50 pt-1.5">
                        <div>
                          <p className="font-bold text-foreground">1x Pochette Artisanal Cuir</p>
                          <p className="text-[10px] text-muted-foreground">Taille : Standard · Couleur : Marron</p>
                        </div>
                        <span className="font-bold text-foreground shrink-0 ml-2">$15</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between px-1 font-black text-sm text-foreground pt-1">
                      <span>Total à payer :</span>
                      <span className="text-primary text-base">
                        $40 <span className="text-xs font-normal text-muted-foreground">(112 000 FC)</span>
                      </span>
                    </div>

                    {/* Coordonnées */}
                    <div className="border-t border-black/10 dark:border-white/10 pt-2 text-[11px] text-muted-foreground space-y-1">
                      <p>📍 <strong className="text-foreground">Livraison :</strong> Kinshasa, Gombe (Av. de la Paix)</p>
                      <p>📞 <strong className="text-foreground">Téléphone :</strong> +243 81 234 5678</p>
                    </div>

                    <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground pt-1">
                      <span>10:24</span>
                      <span className="text-[#53bdeb] font-bold">✓✓</span>
                    </div>
                  </div>

                </div>
              </div>
            </ScrollReveal>

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



      {/* ── TÉMOIGNAGES RÉELS — DÉFILEMENT AUTOMATIQUE DROITE -> GAUCHE ── */}
      <TestimonialsSection />



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
                          { show: true, text: "Double affichage $ USD & Francs Congolais" },
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

      {/* Raccourci support WhatsApp direct */}
      <FloatingWhatsAppSupport />
    </div>
  );
}
