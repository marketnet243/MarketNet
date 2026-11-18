import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  MessageCircle,
  Store,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  CreditCard,
  Globe2,
  Star,
  Smartphone,
  Clock,
  ShoppingBag,
  Zap,
  TrendingUp,
  Shirt,
  Flame,
  SmartphoneNfc,
  Sparkle,
  Utensils,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { absoluteMediaUrl } from "@/lib/marketnet";

export const Route = createFileRoute("/")({
  head: () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.MARKETNET_SITE_URL || process.env.VITE_PUBLIC_URL || "https://appmarketnet.vercel.app");
    const ogImage = absoluteMediaUrl("/favicon.jpg", origin, "/favicon.jpg")!;
    const title = "MarketNet — Votre boutique en ligne, commandes directes sur WhatsApp";
    const desc = "Créez votre boutique en ligne professionnelle en 2 minutes. Présentez vos produits en ligne et recevez vos commandes directement sur WhatsApp sans intermédiaire ni commission.";

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${origin}/#organization`,
          "name": "MarketNet",
          "url": origin,
          "logo": ogImage,
          "description": desc,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+243906619747",
            "contactType": "customer service",
            "availableLanguage": ["French", "English"]
          }
        },
        {
          "@type": "WebSite",
          "@id": `${origin}/#website`,
          "url": origin,
          "name": "MarketNet",
          "description": desc,
          "publisher": { "@id": `${origin}/#organization` }
        },
        {
          "@type": "SoftwareApplication",
          "name": "MarketNet Storefront",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web, Android, iOS",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "128"
          }
        }
      ]
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { name: "keywords", content: "boutique en ligne, e-commerce whatsapp, vendre sur whatsapp, rdc, kinshasa, lubumbashi, catalogue whatsapp, boutique vitrini, marketnet" },
        { property: "og:site_name", content: "MarketNet" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: origin },
        { property: "og:image", content: ogImage },
        { property: "og:image:secure_url", content: ogImage },
        { property: "og:image:alt", content: "MarketNet — Plateforme E-commerce WhatsApp" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        { rel: "canonical", href: origin },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: Index,
} as any);

// Secteurs d'activité (Inspiré de Vitrini : pour qui c'est fait ?)
const SECTORS_LIST = [
  { icon: Shirt, label: "Mode & Prêt-à-porter", desc: "Vêtements, chaussures, sacs" },
  { icon: SmartphoneNfc, label: "High-Tech & Téléphones", desc: "Smartphones, accessoires, audio" },
  { icon: Sparkle, label: "Beauté & Cosmétiques", desc: "Soins, parfums, maquillage" },
  { icon: Utensils, label: "Restauration & Traiteurs", desc: "Plats, pâtisseries, snacks" },
  { icon: Gem, label: "Bijoux & Accessoires", desc: "Montres, lunettes, parures" },
  { icon: Store, label: "Commerce général", desc: "Épicerie, maison, déco" },
];

// Fonctionnalités clés (Concrètes, épurées, non surchargées)
const CORE_FEATURES = [
  {
    icon: MessageCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Commandes directes sur WhatsApp",
    desc: "Vos clients sélectionnent leurs articles et vous recevez un message clair et détaillé avec le panier prêt à livrer.",
  },
  {
    icon: CreditCard,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    title: "Double affichage $ et Francs (FC)",
    desc: "Affichez vos prix en Dollars ($) et en Francs Congolais (CDF) calculés automatiquement selon votre propre taux de change.",
  },
  {
    icon: ShieldCheck,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    title: "0% de commission sur vos ventes",
    desc: "MarketNet ne prélève aucun pourcentage sur votre chiffre d'affaires. L'intégralité de vos bénéfices vous appartient.",
  },
  {
    icon: Smartphone,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    title: "100% autonome sur smartphone",
    desc: "Ajoutez vos produits, modifiez vos prix, suivez vos commandes directement depuis votre téléphone portable sans ordinateur.",
  },
  {
    icon: ShoppingBag,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    title: "Panier d'achat sans téléchargement",
    desc: "Vos acheteurs accèdent instantanément à votre boutique depuis leur navigateur, sans aucune application à installer.",
  },
  {
    icon: Globe2,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Un seul lien partout",
    desc: "Un lien unique à placer dans votre bio Instagram, TikTok, statut WhatsApp ou Facebook pour vendre 24h/24.",
  },
];

// 3 Étapes faciles
const HOW_IT_WORKS = [
  {
    step: "01",
    tag: "2 minutes",
    title: "Créez votre catalogue",
    desc: "Ajoutez vos photos, prix ($ et FC), variantes (tailles, couleurs) et descriptions directement depuis votre téléphone.",
  },
  {
    step: "02",
    tag: "En 1 clic",
    title: "Partagez votre lien",
    desc: "Diffusez votre lien personnalisé dans votre statut WhatsApp, bio Instagram, compte TikTok ou page Facebook.",
  },
  {
    step: "03",
    tag: "Instantané",
    title: "Recevez les commandes sur WhatsApp",
    desc: "Le client clique sur commander : votre WhatsApp s'ouvre avec la liste exacte des articles, quantités et adresse de livraison.",
  },
];

// Comparatif percutant Sans vs Avec MarketNet
const COMPARISON = [
  {
    before: "Passer des heures à répéter les prix et les disponibilités en message privé",
    after: "Un lien unique avec tous vos articles, photos, tailles et prix toujours à jour",
  },
  {
    before: "Envoyer 50 photos lourdes en DM qui saturent la mémoire du client",
    after: "Une vitrine ultra-rapide et légère qui s'ouvre en 1 seconde même en connexion 3G",
  },
  {
    before: "Commandes floues et oubliées sans adresse précise ni récapitulatif",
    after: "Un message WhatsApp structuré : nom, articles, variantes, total et adresse exacte",
  },
  {
    before: "Clients découragés par l'attente qui partent acheter ailleurs",
    after: "Vos clients commandent en toute autonomie, même pendant que vous dormez",
  },
];

// Témoignages
const TESTIMONIALS = [
  {
    name: "Chantal Mbuyi",
    role: "Boutique Awa Fashion",
    city: "Kinshasa (Gombe)",
    quote: "Fini de répéter les prix en message privé. Mes clientes cliquent sur mon lien et la commande arrive prête sur WhatsApp. J'ai doublé mes ventes en un mois.",
  },
  {
    name: "Fidele Carlos",
    role: "TechStore 243",
    city: "Kakanda",
    quote: "Mes clients voient le stock et les prix en $ et en Francs. Le panier arrive tout calculé et structuré, il ne me reste plus qu'à livrer.",
  },
  {
    name: "Grace Ngoy",
    role: "Flora & Kivu Cosmétiques",
    city: "Goma",
    quote: "Je gère toute ma boutique sur mon smartphone en 5 minutes. Mes clientes adorent la simplicité et le récapitulatif WhatsApp.",
  },
];

// FAQ
const FAQ_LIST = [
  {
    q: "MarketNet prend-il une commission sur mes ventes ?",
    a: "Non, absolument 0% de commission. Vous conservez 100% de l'argent de vos ventes. Vos clients vous paient directement à la livraison ou par mobile money (M-Pesa, Airtel Money, Orange Money, Cash).",
  },
  {
    q: "Puis-je afficher mes prix en Dollars ($) et en Francs Congolais (FC) ?",
    a: "Oui ! MarketNet intègre un convertisseur automatique. Vous pouvez définir votre devise principale et renseigner votre propre taux de change du jour.",
  },
  {
    q: "Mes clients doivent-ils télécharger une application pour commander ?",
    a: "Non, aucun téléchargement n'est requis. Votre vitrine s'ouvre directement comme un site web instantané dans le navigateur de votre client (Chrome, Safari, etc.).",
  },
  {
    q: "Comment se déroule la commande pour le client ?",
    a: "Le client parcourt votre vitrine, ajoute des produits à son panier et clique sur « Commander sur WhatsApp ». Son WhatsApp s'ouvre automatiquement avec le récapitulatif complet prêt à vous être envoyé.",
  },
  {
    q: "Ai-je besoin d'un ordinateur pour gérer ma boutique ?",
    a: "Non, 100% de la plateforme est conçue pour fonctionner avec une fluidité totale sur smartphone Android et iPhone.",
  },
  {
    q: "Puis-je commencer gratuitement sans carte bancaire ?",
    a: "Oui, la formule Gratuit est 100% gratuite à vie, sans carte bancaire et sans engagement.",
  },
];

// Bouton support WhatsApp flottant
function FloatingWhatsAppSupport() {
  const message = "Bonjour MarketNet, je souhaite avoir des renseignements pour lancer ma boutique en ligne.";
  const url = `https://wa.me/243906619747?text=${encodeURIComponent(message)}`;

  return (
    <aside aria-label="Assistance WhatsApp MarketNet" className="fixed bottom-5 right-5 z-40">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Discuter avec l'équipe MarketNet"
        aria-label="Contacter le support MarketNet sur WhatsApp"
        className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl transition-all hover:scale-105 active:scale-95 border-2 border-white/20 select-none cursor-pointer"
      >
        <MessageCircle className="h-6 w-6 fill-white text-white" />
      </a>
    </aside>
  );
}

function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">

      {/* ── BARRE DE NAVIGATION (HEADER ÉPURÉ STYLE VITRINI) ── */}
      <header className="fixed top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-base shadow-sm">
              M
            </span>
            <span>Market<span className="text-primary"> Net</span></span>
          </Link>

          {/* Liens Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#comment-ca-marche" className="hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#secteurs" className="hover:text-foreground transition-colors">Pour qui ?</a>
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          {/* Boutons d'action Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground" asChild>
              <Link to="/auth" search={{ mode: "login" }}>Connexion</Link>
            </Button>
            <Button size="sm" className="rounded-xl px-4 text-xs font-bold shadow-xs cursor-pointer" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Créer ma boutique</Link>
            </Button>
          </div>

          {/* Bouton Mobile Menu */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu déroulant Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border/80 bg-background/98 px-4 py-5 space-y-3 shadow-xl">
            <nav className="flex flex-col space-y-2">
              <a href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-foreground">Comment ça marche</a>
              <a href="#secteurs" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-foreground">Pour qui ?</a>
              <a href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-foreground">Fonctionnalités</a>
              <a href="#tarifs" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-foreground">Tarifs</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-foreground">FAQ</a>
            </nav>
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Button variant="outline" className="w-full rounded-xl text-xs font-semibold" asChild>
                <Link to="/auth" search={{ mode: "login" }} onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
              </Button>
              <Button className="w-full rounded-xl text-xs font-bold" asChild>
                <Link to="/auth" search={{ mode: "signup" }} onClick={() => setMobileMenuOpen(false)}>Créer ma boutique</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION (ÉPURÉE, VRAIE PROPOSITION DE VALEUR) ── */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Colonne Texte & Appel à l'action */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>La vitrine e-commerce pensée pour l'Afrique</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-foreground">
                Votre boutique en ligne. <br />
                <span className="text-primary">Vos commandes sur WhatsApp.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Créez votre catalogue digital en 2 minutes. Vos clients commandent en quelques clics et vous recevez leurs commandes complètes directement sur WhatsApp.
              </p>

              {/* Boutons d'action Hero */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Button size="lg" className="w-full sm:w-auto h-12 px-7 rounded-xl font-bold text-sm shadow-md shadow-primary/20 gap-2 cursor-pointer transition-transform hover:scale-[1.01] active:scale-98" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    <Store className="h-4 w-4" />
                    <span>Créer ma boutique gratuitement</span>
                  </Link>
                </Button>

                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-sm cursor-pointer" asChild>
                  <a href="#comment-ca-marche">Voir comment ça marche</a>
                </Button>
              </div>

              {/* Badges de confiance */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> 0% de commission
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> 100% sur smartphone
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Sans appli à installer
                </span>
              </div>
            </div>

            {/* Mockup Smartphone moderne & épuré avec lueur d'ambiance */}
            <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[370px]">
              {/* Lueur d'ambiance subtile */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/25 via-primary/10 to-transparent rounded-[3rem] blur-2xl -z-10 opacity-75" />
              <div className="relative rounded-[2.5rem] border-4 border-foreground/80 bg-card p-3 shadow-2xl">
                <div className="rounded-[2rem] overflow-hidden bg-background border border-border/60 text-left space-y-3 pb-4">
                  
                  {/* En-tête de la vitrine simulée */}
                  <div className="bg-primary/10 border-b border-primary/20 p-4 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Vitrine MarketNet</span>
                    <h3 className="text-base font-extrabold text-foreground">Awa Fashion & Wax</h3>
                    <p className="text-[11px] text-muted-foreground"> Kinshasa, Gombe • Lun - Sam : 08h - 18h</p>
                  </div>

                  {/* Article vedette */}
                  <div className="px-3 space-y-2.5">
                    <div className="relative rounded-2xl overflow-hidden bg-muted aspect-4/3 border border-border/70">
                      <img
                        src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80"
                        alt="Robe Wax"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        En stock
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">Robe Wax Moderne</p>
                        <p className="text-[11px] text-muted-foreground">Tailles : S, M, L • 100% Coton</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-primary">25 $</p>
                        <p className="text-[10px] text-muted-foreground font-mono">70 000 FC</p>
                      </div>
                    </div>

                    {/* Bouton WhatsApp */}
                    <div className="pt-1">
                      <div className="w-full h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs">
                        <MessageCircle className="h-4 w-4" />
                        <span>Commander sur WhatsApp</span>
                      </div>
                    </div>
                  </div>

                  {/* Bulle de commande reçue sur WhatsApp */}
                  <div className="mx-3 mt-2 rounded-xl bg-muted/60 border border-[#25D366]/30 p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#25D366] font-bold">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Message client reçu :</span>
                    </div>
                    <p className="text-foreground/90 italic text-[10px] leading-tight">
                      « Bonjour Awa Fashion ! Je souhaite commander la Robe Wax Moderne (Taille M - 25$) pour livraison à Kinshasa (Gombe). »
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CHIFFRES CLÉS & RÉASSURANCE ── */}
      <section className="border-y border-border/60 bg-muted/20 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            <div>
              <p className="text-3xl font-black text-primary">0%</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Commission sur vos ventes</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">2 min</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Pour lancer votre boutique</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">100%</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Géré sur votre smartphone</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">24h/24</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Vitrine ouverte en continu</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTEURS D'ACTIVITÉ (INSPIRÉ DE VITRINI : POUR QUI ?) ── */}
      <section id="secteurs" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Pour qui c'est fait ?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Idéal pour tous les commerçants
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Que vous vendiez des produits physiques, de la nourriture ou des accessoires, MarketNet s'adapte à votre activité.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SECTORS_LIST.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/70 bg-card p-4 text-center space-y-2 hover:border-primary/50 transition-colors">
                <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">{s.label}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE (3 ÉTAPES CLAIRES) ── */}
      <section id="comment-ca-marche" className="py-20 sm:py-24 bg-muted/20 border-y border-border/60 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Simple & Rapide</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              3 étapes pour commencer à vendre
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Pas besoin de compétences techniques ni d'ordinateur. Tout se fait depuis votre téléphone.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary font-mono">{item.step}</span>
                  <span className="text-[11px] font-semibold bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="rounded-xl px-7 font-bold text-sm shadow-md cursor-pointer" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Créer ma boutique maintenant
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ESSENTIELLES (ÉPURÉES, SANS SUPERFLU) ── */}
      <section id="fonctionnalites" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Tout ce dont vous avez besoin pour vendre
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Des outils pratiques conçus pour faciliter le quotidien des commerçants africains.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_FEATURES.map((feat) => (
              <div key={feat.title} className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", feat.bg)}>
                  <feat.icon className={cn("h-5 w-5", feat.color)} />
                </div>
                <h3 className="text-base font-bold text-foreground">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARATIF AVANT VS APRÈS ── */}
      <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Comparatif</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Pourquoi choisir MarketNet ?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gagnez des heures chaque jour en automatisant la présentation de vos produits.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Sans MarketNet */}
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                <X className="h-4 w-4 stroke-[3]" />
                <span>Sans MarketNet</span>
              </div>
              <ul className="space-y-3">
                {COMPARISON.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <span className="text-destructive font-bold shrink-0 mt-0.5">•</span>
                    <span>{item.before}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Avec MarketNet */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-7 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Avec votre vitrine MarketNet</span>
              </div>
              <ul className="space-y-3">
                {COMPARISON.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                    <span className="text-emerald-600 shrink-0 mt-0.5">✓</span>
                    <span>{item.after}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TARIFS CODÉS EN DUR (SEULEMENT GRATUIT ET PRO) ── */}
      <section id="tarifs" className="py-20 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Tarifs simples & transparents</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Des forfaits clairs, sans aucune commission
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Commencez 100% gratuitement. Passez au forfait Pro quand votre activité se développe.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
            
            {/* PLAN GRATUIT */}
            <div className="rounded-3xl border border-border/80 bg-card p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <div className="inline-block text-[11px] font-bold text-muted-foreground bg-muted px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Pour démarrer
                </div>
                <h3 className="text-2xl font-black text-foreground">Gratuit</h3>
                <p className="text-xs text-muted-foreground">
                  Idéal pour lancer son activité et tester sans aucun risque.
                </p>

                <div className="pt-2">
                  <span className="text-4xl font-black text-foreground">0 $</span>
                  <span className="text-xs text-muted-foreground"> / à vie</span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-border/60">
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Jusqu'à <strong>15 produits</strong> au catalogue</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Commandes illimitées sur WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span><strong>0% de commission</strong> sur vos ventes</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Double affichage Dollars ($) et Francs (FC)</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Lien personnalisé <code>marketnet/b/votre-nom</code></span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Support standard par email et WhatsApp</span>
                  </li>
                </ul>
              </div>

              <Button asChild variant="outline" className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold border-border/90 cursor-pointer">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Commencer gratuitement
                </Link>
              </Button>
            </div>

            {/* PLAN PRO */}
            <div className="rounded-3xl border-2 border-primary bg-card p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative ring-4 ring-primary/10">
              <div className="space-y-4">
                <div className="inline-block text-[11px] font-bold text-primary bg-primary/10 px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Recommandé • Commerces actifs
                </div>
                <h3 className="text-2xl font-black text-foreground">Pro</h3>
                <p className="text-xs text-muted-foreground">
                  Pour les boutiques qui veulent maximiser leurs ventes et leur notoriété.
                </p>

                <div className="pt-2">
                  <span className="text-4xl font-black text-foreground">10 $</span>
                  <span className="text-xs text-muted-foreground"> / mois <span className="font-mono text-muted-foreground/80">(~28 000 FC)</span></span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-border/60">
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                    <span><strong>Produits & catégories illimités</strong></span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                    <span>Commandes illimitées sur WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                    <span><strong>0% de commission</strong> sur vos ventes</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                    <span>Badge <strong>Boutique Vérifiée</strong> (confiance accrue)</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                    <span>Statistiques détaillées des visites et commandes</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                    <span>Support prioritaire WhatsApp 7j/7</span>
                  </li>
                </ul>
              </div>

              <Button asChild className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Choisir la formule Pro
                </Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="py-20 sm:py-24 bg-muted/20 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Témoignages</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Adopté par des commerçants près de chez vous
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Découvrez les retours de vendeurs à Kinshasa, Lubumbashi et Goma.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed">
                    « {t.quote} »
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <p className="text-xs font-bold text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role} • {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDÉON ── */}
      <section id="faq" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Questions fréquentes
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Toutes les réponses pour lancer votre vitrine en toute sérénité.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_LIST.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`} className="rounded-2xl border border-border/80 bg-card px-5 py-0.5 shadow-xs">
                <AccordionTrigger className="text-left font-bold text-sm sm:text-base py-3.5 hover:no-underline hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── BANNIÈRE D'APPEL À L'ACTION FINALE ── */}
      <section className="py-20 sm:py-24 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Prêt à booster vos ventes sur WhatsApp ?
          </h2>
          <p className="text-base sm:text-lg text-primary-foreground/90 max-w-xl mx-auto leading-relaxed">
            Rejoignez dès aujourd'hui les commerçants qui ont simplifié la gestion de leurs commandes avec MarketNet.
          </p>
          <div className="pt-2">
            <Button size="lg" variant="secondary" className="h-12 px-8 rounded-xl font-bold text-sm shadow-xl cursor-pointer" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Créer ma boutique maintenant
              </Link>
            </Button>
          </div>
          <p className="text-xs text-primary-foreground/75">
            Formule 100% gratuite disponible • Configuration en 2 minutes
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/70 bg-card pt-10 pb-20 sm:pb-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <Link to="/" className="flex items-center gap-2 font-black text-foreground text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">
              M
            </span>
            <span>Market<span className="text-primary">Net</span></span>
          </Link>

          <p>© {new Date().getFullYear()} MarketNet. Tous droits réservés.</p>

          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Conditions</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <span>•</span>
            <Link to="/data-deletion" className="hover:text-foreground transition-colors">Suppression des données</Link>
          </div>
        </div>
      </footer>

      {/* Raccourci support WhatsApp direct */}
      <FloatingWhatsAppSupport />
    </div>
  );
}
