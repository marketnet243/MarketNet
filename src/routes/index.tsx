import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Check, MessageCircle, Palette, Smartphone, Store, Zap, ArrowRight,
  TrendingUp, Users, ShieldCheck, Menu, X, Sparkles, Layers, CreditCard,
  LogIn, Tag, Megaphone, BarChart3, Globe2, BadgePercent, Star, Clock,
  Share2, Gift, Rocket, Send, HelpCircle, Quote, ShoppingBag, Plus, Minus,
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

const SHARING_FEATURES = [
  { icon: MessageCircle, color: "text-green-500", title: "Partage WhatsApp instantané", desc: "Diffusez vos produits, promotions et catalogue directement sur vos statuts WhatsApp et dans vos groupes de clients." },
  { icon: Sparkles, color: "text-amber-500", title: "Affiches prêtes à publier", desc: "Téléchargez des affiches percutantes au format story ou statut, prêtes à diffuser sur tous vos réseaux." },
  { icon: Share2, color: "text-primary", title: "Aperçus de liens enrichis", desc: "Vos liens partagés sur WhatsApp, Facebook ou Instagram affichent instantanément la photo, le titre et le prix de vos produits." },
  { icon: BarChart3, color: "text-cyan-500", title: "Statistiques en direct", desc: "Suivez vos vues, clics de partage et conversions directement depuis votre tableau de bord MarketNet." },
];

const PAYMENT_PARTNERS = [
  { name: "M-Pesa", desc: "Vodacom RDC", color: "text-red-500", bg: "bg-red-500/10" },
  { name: "Airtel Money", desc: "Airtel RDC", color: "text-red-600", bg: "bg-red-600/10" },
  { name: "Orange Money", desc: "Orange RDC", color: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "Afrimoney", desc: "Africell RDC", color: "text-purple-600", bg: "bg-purple-600/10" },
  { name: "Cash à la livraison", desc: "Paiement direct", color: "text-emerald-600", bg: "bg-emerald-600/10" },
  { name: "0% Commission", desc: "100% de vos gains", color: "text-primary", bg: "bg-primary/10" },
];

const TESTIMONIALS = [
  {
    name: "Chantal Mbuyi",
    role: "Créatrice & Gérante",
    shop: "Awa Fashion & Wax",
    city: "Kinshasa (Gombe)",
    avatar: "CM",
    color: "bg-amber-500",
    quote: "Avant MarketNet, je passais mes journées à répondre « C'est combien ? » et à renvoyer 50 photos en DM. Maintenant, mon lien est dans ma bio TikTok et sur mes statuts. Les clientes choisissent, et m'envoient directement leur panier complet avec le total en Francs. J'ai doublé mes livraisons par semaine.",
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
    quote: "Ce qui m'a conquis, ce sont les promotions et le 0% de commission. Je lance une offre -20% le vendredi soir, je télécharge l'affiche en un clic pour mes statuts, et le samedi matin les paiements M-Pesa et Airtel Money tombent directement sans intermédiaire.",
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
    quote: "Je n'ai pas d'ordinateur à la boutique, je fais absolument tout sur mon smartphone. Ajouter un produit prend 30 secondes avec la photo. Les clients apprécient le panier rapide et le récapitulatif clair avant l'envoi sur WhatsApp.",
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
    q: "Comment mes clients effectuent-ils le paiement ?",
    a: "Le paiement s'effectue directement entre vous et votre client selon vos méthodes habituelles : Mobile Money (M-Pesa, Airtel Money, Orange Money, Afrimoney), virement bancaire ou paiement en espèces à la livraison. MarketNet ne bloque jamais votre argent.",
  },
  {
    q: "Ai-je besoin d'un ordinateur pour gérer ma boutique ?",
    a: "Pas du tout ! 100% de MarketNet est conçu et optimisé pour smartphone. Vous pouvez prendre des photos de vos articles, créer des promotions, ajuster vos prix et suivre vos statistiques directement depuis votre téléphone.",
  },
  {
    q: "Mes clients doivent-ils télécharger une application ?",
    a: "Non, aucun téléchargement n'est requis. Vos clients cliquent simplement sur le lien de votre boutique (depuis vos statuts WhatsApp, Facebook, TikTok ou Instagram) et votre catalogue s'ouvre directement dans leur navigateur web mobile.",
  },
  {
    q: "Comment se passe la réception d'une commande sur WhatsApp ?",
    a: "Dès que le client clique sur 'Commander sur WhatsApp' dans votre boutique, son application WhatsApp s'ouvre automatiquement avec un message structuré contenant les articles choisis, les options, le montant total calculé en Francs Congolais (FC) et son adresse. Il ne vous reste plus qu'à conclure la vente.",
  },
  {
    q: "Puis-je commencer gratuitement et changer d'offre plus tard ?",
    a: "Oui ! Vous pouvez démarrer immédiatement avec notre formule gratuite pour publier vos premiers produits. Dès que votre catalogue s'agrandit, vous pouvez passer au forfait Pro ou Business en un clic sans interruption de service.",
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

function InteractiveHeroDemo() {
  const [activeTab, setActiveTab] = useState<"store" | "whatsapp">("store");
  const [cart, setCart] = useState<Record<string, number>>({ wax: 1, bag: 1, shoes: 0 });

  const DEMO_PRODUCTS = [
    { id: "wax", name: "Robe Wax Ankara", originalPrice: 25000, price: 20000, promo: "-20%", color: "from-amber-400/40 to-orange-400/40" },
    { id: "bag", name: "Sac Cuir Gombe", originalPrice: 45000, price: 45000, promo: null, color: "from-purple-400/40 to-pink-400/40" },
    { id: "shoes", name: "Sandales Élégance", originalPrice: 20000, price: 17000, promo: "-15%", color: "from-teal-400/40 to-cyan-400/40" },
  ];

  const toggleItem = (id: string) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) > 0 ? 0 : 1,
    }));
  };

  const selectedProducts = DEMO_PRODUCTS.filter((p) => (cart[p.id] || 0) > 0);
  const totalCount = selectedProducts.reduce((sum, p) => sum + (cart[p.id] || 0), 0);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-sm lg:max-w-sm select-none">
      {/* Switcher tabs */}
      <div className="mb-3 flex items-center justify-center p-1 rounded-2xl bg-muted/80 backdrop-blur-sm border shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "store"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          <span>Boutique client</span>
          {totalCount > 0 && (
            <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-black text-primary-foreground flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative",
            activeTab === "whatsapp"
              ? "bg-green-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className={cn("h-3.5 w-3.5", activeTab === "whatsapp" ? "text-white" : "text-green-500")} />
          <span>Message reçu</span>
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        </button>
      </div>

      {/* Phone container */}
      <div className="relative rounded-[2.5rem] border-4 border-foreground/15 bg-background shadow-2xl overflow-hidden transition-all duration-300">
        {/* Status bar */}
        <div className="bg-muted/70 px-5 pt-3 pb-2 flex items-center justify-between border-b border-border/40">
          <span className="text-[10px] font-semibold text-muted-foreground">09:41</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
            <div className="h-2 w-3 rounded-full bg-muted-foreground/60" />
            <div className="h-2 w-4 rounded-full bg-foreground/80" />
          </div>
        </div>

        {activeTab === "store" ? (
          /* TAB 1: STORE VIEW */
          <div className="flex flex-col h-[385px] bg-background animate-in fade-in duration-200">
            {/* Store App Bar */}
            <div className="bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-white flex items-center gap-2.5 shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                A
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs truncate">Awa Mode Kinshasa</p>
                <div className="flex items-center gap-1 text-[10px] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>En ligne • Ouvert</span>
                </div>
              </div>
              <div className="relative">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="h-3.5 w-3.5 text-white" />
                </div>
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white text-primary font-black text-[9px] flex items-center justify-center shadow">
                    {totalCount}
                  </span>
                )}
              </div>
            </div>

            {/* Hint bar */}
            <div className="bg-primary/5 border-b px-3 py-1.5 text-center">
              <p className="text-[10px] font-semibold text-primary">
                👆 Touchez un article pour l'ajouter au panier
              </p>
            </div>

            {/* Products interactive list */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {DEMO_PRODUCTS.map((item) => {
                const isSelected = (cart[item.id] || 0) > 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border p-2.5 transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-primary/8 border-primary/40 shadow-sm"
                        : "bg-card border-border/70 hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <div className={cn("h-11 w-11 rounded-xl bg-gradient-to-br shrink-0 shadow-inner", item.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
                        {item.promo && (
                          <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                            {item.promo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold text-foreground">
                          {item.price.toLocaleString("fr-FR")} FC
                        </span>
                        {item.promo && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {item.originalPrice.toLocaleString("fr-FR")} FC
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Sélectionner le produit"
                      className={cn(
                        "h-7 w-7 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                      )}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Store Bottom Bar / CTA to WhatsApp */}
            <div className="p-2.5 border-t bg-card/90 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className="w-full h-10 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-green-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>
                  Commander sur WhatsApp ({totalCount} • {totalPrice.toLocaleString("fr-FR")} FC)
                </span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: WHATSAPP MESSAGE PREVIEW */
          <div className="flex flex-col h-[385px] bg-[#EFEAE2] dark:bg-[#0c1317] animate-in fade-in duration-200">
            {/* WhatsApp Header */}
            <div className="bg-[#008069] dark:bg-[#202c33] px-3 py-2.5 text-white flex items-center gap-2 shadow-sm">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Awa Mode Kinshasa</p>
                <p className="text-[10px] text-emerald-100 dark:text-zinc-400">Compte professionnel</p>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                Direct
              </span>
            </div>

            {/* WhatsApp Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              <div className="text-center my-1">
                <span className="bg-[#E1D9CE] dark:bg-[#182229] text-[9px] text-[#54656f] dark:text-[#8696a0] px-2.5 py-0.5 rounded-lg shadow-sm font-medium">
                  Aujourd'hui
                </span>
              </div>

              {/* Message Bubble */}
              <div className="relative ml-auto max-w-[95%] rounded-2xl rounded-tr-none bg-[#D9FDD3] dark:bg-[#005c4b] p-3 text-[#111b21] dark:text-[#e9edef] shadow-sm">
                <p className="font-bold text-[11px] text-[#008069] dark:text-[#25D366] mb-1">
                  🛍️ Nouvelle commande via MarketNet !
                </p>
                <p className="text-[11px] leading-tight">
                  Bonjour <strong>Awa Mode</strong>, je souhaite commander :
                </p>

                <div className="my-2 border-y border-black/10 dark:border-white/10 py-1.5 space-y-1">
                  {selectedProducts.length > 0 ? (
                    selectedProducts.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-[10px]">
                        <span>• 1x {p.name}</span>
                        <span className="font-semibold">{p.price.toLocaleString("fr-FR")} FC</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] italic text-muted-foreground">Aucun produit sélectionné</p>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs font-black pt-0.5">
                  <span>TOTAL :</span>
                  <span className="text-[#008069] dark:text-[#25D366]">
                    {totalPrice.toLocaleString("fr-FR")} FC
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 text-[10px] text-[#54656f] dark:text-[#8696a0] space-y-0.5">
                  <p>📍 Client : Sarah K. (Kinshasa / Gombe)</p>
                  <p>💳 Paiement : Mobile Money à la livraison</p>
                </div>

                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#54656f] dark:text-[#8696a0]">
                  <span>09:42</span>
                  <span className="text-[#53bdeb] font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Back button */}
            <div className="p-2 border-t bg-background/95">
              <button
                type="button"
                onClick={() => setActiveTab("store")}
                className="w-full h-9 rounded-xl border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span>Modifier les produits du panier</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating badges */}
      <div className="absolute -left-4 top-1/4 rounded-2xl bg-white dark:bg-zinc-800 border px-3 py-2 shadow-xl flex items-center gap-2 animate-[bounce_3s_infinite] z-20">
        <MessageCircle className="h-4 w-4 text-green-500" />
        <span className="text-xs font-bold">0% de commission</span>
      </div>
      <div className="absolute -right-4 bottom-1/4 rounded-2xl bg-white dark:bg-zinc-800 border px-3 py-2 shadow-xl flex items-center gap-2 animate-[bounce_3.5s_infinite] z-20">
        <BadgePercent className="h-4 w-4 text-rose-500" />
        <span className="text-xs font-bold">Prix en FC directs</span>
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
            <a href="#partage" className="transition-colors hover:text-foreground">Partage</a>
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
                { href: "#features", icon: Sparkles, label: "Fonctionnalités", color: "text-primary" },
                { href: "#promotions", icon: BadgePercent, label: "Promotions", color: "text-rose-500" },
                { href: "#partage", icon: Share2, label: "Partage & Visibilité", color: "text-emerald-500" },
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
            <div className="pt-3 border-t space-y-2">
              <Button variant="outline" size="lg" className="w-full rounded-xl font-bold h-11 justify-center text-sm" asChild>
                <Link to="/auth" search={{ mode: "login" }} onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="h-4 w-4 mr-2" /> Connexion
                </Link>
              </Button>
              <Button size="lg" className="w-full rounded-xl font-bold h-11 justify-center text-sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }} onClick={() => setMobileMenuOpen(false)}>
                  <Store className="h-4 w-4 mr-2" /> Créer ma boutique
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
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Sans carte bancaire</span>
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

      {/* ── PAIEMENTS LOCAUX & CONFIANCE ── */}
      <section className="border-b bg-card/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">
              Paiements directs sans intermédiaire · 0% de commission prélevée
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            {PAYMENT_PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center gap-2.5 rounded-2xl border bg-background px-4 py-2.5 shadow-sm transition-all hover:scale-105 hover:border-primary/30"
              >
                <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0", partner.bg, partner.color)}>
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{partner.name}</p>
                  <p className="text-[10px] text-muted-foreground">{partner.desc}</p>
                </div>
              </div>
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

            {/* Right visual */}
            <ScrollReveal direction="right" delay={150}>
              <div className="relative mx-auto max-w-sm">
                <div className="rounded-3xl border bg-card shadow-2xl overflow-hidden">
                  {/* Mock store header */}
                  <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">B</div>
                      <div>
                        <p className="font-bold text-sm">Boutique Exemple</p>
                        <p className="text-xs text-white/70">Promotions en cours</p>
                      </div>
                    </div>
                  </div>
                  {/* Mock products */}
                  <div className="p-4 space-y-3">
                    {[
                      { name: "Robe d'été", price: "25 000 FC", promo: "-30%", newPrice: "17 500 FC" },
                      { name: "Sac à main", price: "45 000 FC", promo: "-20%", newPrice: "36 000 FC" },
                      { name: "Chaussures", price: "60 000 FC", promo: null, newPrice: null },
                    ].map((product) => (
                      <div key={product.name} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{product.name}</p>
                            {product.promo && (
                              <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{product.promo}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {product.promo ? (
                              <>
                                <span className="text-xs text-muted-foreground line-through">{product.price}</span>
                                <span className="text-xs font-bold text-rose-500">{product.newPrice}</span>
                              </>
                            ) : (
                              <span className="text-xs font-medium text-foreground">{product.price}</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 h-7 w-7 rounded-full bg-green-500 flex items-center justify-center">
                          <MessageCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 rounded-2xl bg-rose-500 px-4 py-2 text-white font-black text-lg shadow-xl shadow-rose-500/30 animate-[bounce_2.5s_infinite]">
                  -30%
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── PARTAGE & VISIBILITÉ ── */}
      <section id="partage" className="py-24 scroll-mt-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left visual */}
            <ScrollReveal direction="left" delay={120} className="order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm">
                <div className="rounded-3xl border bg-card shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Partage WhatsApp & Réseaux</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Lien enrichi actif</span>
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-primary font-bold bg-primary/10 rounded-full px-2.5 py-1">1 clic</div>
                  </div>

                  {/* Share stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Visites", val: "1.2k", color: "text-primary" },
                      { label: "Partages", val: "148", color: "text-green-500" },
                      { label: "Commandes", val: "36", color: "text-orange-500" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-xl border bg-background p-3 text-center">
                        <p className={cn("text-xl font-black", color)}>{val}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Affiches row */}
                  <div className="flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Affiches prêtes à publier</p>
                      <p className="text-[11px] text-muted-foreground">Téléchargez vos visuels en haute qualité</p>
                    </div>
                    <div className="rounded-full bg-green-500/10 px-2.5 py-1">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </div>
                  </div>

                  {/* Open Graph hint */}
                  <p className="text-[11px] text-center text-muted-foreground">
                    Aperçu automatique complet sur WhatsApp, Facebook et X (Twitter)
                  </p>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 rounded-2xl bg-white dark:bg-zinc-800 border px-3 py-2 shadow-xl flex items-center gap-2 animate-[bounce_3s_infinite]">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-bold">+240 vues statut</span>
                </div>
                <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white dark:bg-zinc-800 border px-3 py-2 shadow-xl flex items-center gap-2 animate-[bounce_3.5s_infinite]">
                  <Share2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold">Partage direct</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Right text */}
            <ScrollReveal direction="right" className="order-1 lg:order-2">
              <SectionBadge>
                <Share2 className="h-3.5 w-3.5 text-primary" />
                Diffusion & Visibilité
              </SectionBadge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Partagez en 1 clic et{" "}
                <span className="text-primary">multipliez vos ventes</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Faites rayonner votre boutique partout. Partagez des liens enrichis avec photos automatiques sur WhatsApp et téléchargez des affiches prêtes à publier sur vos statuts et réseaux sociaux.
              </p>

              <div className="mt-8 space-y-4">
                {SHARING_FEATURES.map((mf, i) => (
                  <ScrollReveal key={mf.title} delay={i * 80} direction="up">
                    <div className="flex items-start gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <mf.icon className={cn("h-5 w-5", mf.color)} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{mf.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{mf.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Inclus dans</span>
                <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">Toutes les formules</span>
              </div>
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
                          { show: true, text: "Affiches prêtes à publier & partage en 1 clic" },
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
            <p className="mt-6 text-sm text-primary-foreground/60">Sans carte bancaire · Prêt en 5 minutes · Annulable à tout moment</p>
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
