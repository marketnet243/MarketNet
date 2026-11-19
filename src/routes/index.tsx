import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { ArrowRight, Check, Store, MessageCircle, Smartphone, ShieldCheck, Link2, CreditCard, Package, Shirt, Gem, Utensils, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PublicHeader } from '@/components/site/PublicHeader';
import { PublicFooter } from '@/components/site/PublicFooter';
import cataloguePhoto from '@/assets/marketnet-catalogue.jpg';
import boutiquePhoto from '@/assets/marketnet-boutique.jpg';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'MarketNet — Créez votre boutique en ligne et vendez sur WhatsApp' },
      { name: 'description', content: 'Créez gratuitement votre boutique en ligne en 5 minutes. Catalogue, prix en $ et en FC, commandes reçues sur WhatsApp. 0 % de commission, pensé pour les commerçants de RDC.' },
      { property: 'og:title', content: 'MarketNet — Votre boutique en ligne, vos commandes sur WhatsApp' },
      { property: 'og:description', content: 'Un catalogue à votre image, un lien à partager, des commandes claires sur WhatsApp. Gratuit pour commencer, sans commission.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: '/' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'MarketNet — Vendez en ligne, simplement' },
      { name: 'twitter:description', content: 'Créez votre boutique, partagez votre lien, recevez vos commandes sur WhatsApp.' },
    ],
    links: [{ rel: 'canonical', href: '/' }],
  }),
  component: Index,
});
const features = [
  { icon: MessageCircle, title: 'Les commandes, sur votre WhatsApp', text: 'Un panier détaillé, avec les articles et les quantités. Vous échangez directement avec votre client.' },
  { icon: CreditCard, title: 'Vos prix en dollars et en francs', text: 'Affichez vos prix en $ et en FC, avec un taux de change que vous choisissez.' },
  { icon: ShieldCheck, title: 'Vos ventes vous appartiennent', text: 'Aucun intermédiaire, aucune commission. Vos clients vous paient directement.' },
  { icon: Smartphone, title: 'Tout se gère depuis votre téléphone', text: 'Ajoutez des photos, ajustez vos prix et suivez vos commandes, où que vous soyez.' },
  { icon: Package, title: 'Un catalogue toujours à jour', text: 'Présentez vos produits, leurs variantes et leur disponibilité dans une seule vitrine.' },
  { icon: Link2, title: 'Un lien pour tous vos réseaux', text: 'Partagez votre boutique sur WhatsApp, Instagram, Facebook ou TikTok.' },
];
const faq = [
  ['MarketNet prend-il une commission sur mes ventes ?', 'Non. Vous gardez 100 % de vos ventes. Vos clients vous paient directement, à la livraison ou avec votre moyen de paiement habituel.'],
  ['Mes clients doivent-ils installer une application ?', 'Non. Votre boutique s’ouvre directement dans leur navigateur. Ils choisissent leurs produits et vous envoient leur commande sur WhatsApp.'],
  ['Puis-je afficher mes prix en dollars et en francs congolais ?', 'Oui. Vous choisissez votre devise et votre propre taux de change pour afficher les prix en dollars et en francs congolais.'],
  ['Puis-je gérer ma boutique uniquement avec mon téléphone ?', 'Oui. Vous pouvez ajouter vos produits, modifier les prix et suivre les commandes depuis votre smartphone.'],
  ['Puis-je commencer gratuitement ?', 'Oui. La formule gratuite vous permet de commencer sans carte bancaire et sans engagement.'],
];
function Index() {
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('motion-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    pageRef.current?.querySelectorAll('.marketnet-reveal, .marketnet-feature, .marketnet-plan').forEach(element => {
      element.classList.add('motion-pending');
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return <div ref={pageRef}>
    <PublicHeader />
    <main id="main-content">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="marketnet-wrap hero-grid">
          <div className="hero-copy">
            <div className="marketnet-eyebrow">Le commerce local, sans limites</div>
            <h1>Votre boutique en ligne.<span>Vos clients, tout près.</span></h1>
            <p>Un catalogue à votre image, un lien à partager, des commandes claires sur WhatsApp. Tout pour vendre plus, depuis votre téléphone.</p>
            <div className="hero-actions">
              <Button size="lg" className="hero-cta" asChild><Link to="/auth" search={{ mode: 'signup' }}>Créer ma boutique gratuitement <ArrowRight /></Link></Button>
              <Button size="lg" variant="outline" className="hero-cta-secondary" asChild><a href="#comment-ca-marche">Voir comment ça marche</a></Button>
            </div>
            <ul className="hero-proof">
              <li><Check /> Gratuit pour commencer</li>
              <li><Check /> Aucune carte bancaire</li>
              <li><Check /> Prête en 5 minutes</li>
            </ul>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-frame">
              <img src={boutiquePhoto} alt="Une commerçante dans sa boutique, gérant ses commandes depuis son téléphone" className="hero-photo" width={1920} height={1024} fetchPriority="high" />
            </div>
            <div className="hero-chip hero-chip-order"><span className="hero-chip-icon"><MessageCircle /></span><div><strong>Nouvelle commande</strong><span>3 articles · 45 $ · via WhatsApp</span></div></div>
            <div className="hero-chip hero-chip-link"><span className="hero-chip-icon"><Link2 /></span><div><strong>marketnet/b/awa-fashion</strong><span>Votre lien, prêt à partager</span></div></div>
          </div>
        </div>
      </section>
      <section className="marketnet-benefits" aria-label="Les avantages MarketNet"><div className="marketnet-wrap marketnet-benefits-inner">
        {[{ icon: ShieldCheck, title: '0 % de commission', text: 'Vous gardez le fruit de vos ventes.' },{ icon: MessageCircle, title: 'Directement sur WhatsApp', text: 'Vos clients, sans intermédiaire.' },{ icon: Smartphone, title: 'Pensé pour votre téléphone', text: 'Votre boutique vous suit partout.' }].map(({ icon: Icon,title,text }) => <div className="marketnet-benefit" key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></div>)}
      </div></section>
      <section id="comment-ca-marche" className="marketnet-section marketnet-wrap marketnet-reveal">
        <div className="marketnet-section-heading"><div><div className="marketnet-eyebrow">Trois étapes. C’est tout.</div><h2>Du premier produit<br />à votre prochaine commande.</h2></div><p className="marketnet-section-intro">Moins de messages à répéter.<br />Plus de temps pour votre commerce.</p></div>
        <div className="marketnet-steps">{[{ icon: Store, title: 'Créez votre boutique', text: 'Donnez-lui un nom, ajoutez vos produits, leurs photos et leurs prix. Votre vitrine prend vie.' },{ icon: Link2, title: 'Partagez votre lien', text: 'Un seul lien à glisser dans votre bio, vos statuts ou vos messages. Votre catalogue devient accessible à tous.' },{ icon: MessageCircle, title: 'Recevez vos commandes', text: 'Vos clients composent leur panier. Vous recevez le récapitulatif sur WhatsApp et organisez la livraison.' }].map(({ icon: Icon,title,text },i) => <article className="marketnet-step" key={title}><div className="marketnet-step-top"><span>0{i+1}</span><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="marketnet-section marketnet-wrap marketnet-reveal">
        <div className="order-demo">
          <div>
            <div className="marketnet-eyebrow">Côté client</div>
            <h2>Une commande claire,<br />directement dans WhatsApp.</h2>
            <p className="order-demo-text">Votre client choisit ses articles dans votre boutique et vous envoie un récapitulatif complet : produits, quantités, total en $ et en FC. Plus de malentendus, plus de captures d’écran.</p>
            <div className="order-demo-stats">
              <div><strong>0 %</strong><span>de commission</span></div>
              <div><strong>5 min</strong><span>pour démarrer</span></div>
              <div><strong>$ + FC</strong><span>double devise</span></div>
            </div>
          </div>
          <div className="order-phone" aria-label="Exemple de commande reçue sur WhatsApp">
            <div className="order-phone-top"><span className="order-phone-avatar">AF</span><div><strong>Awa Fashion</strong><span>en ligne</span></div></div>
            <div className="order-phone-body">
              <div className="order-bubble order-bubble-in">Bonjour 👋 je souhaite commander :</div>
              <div className="order-bubble order-bubble-in order-receipt">
                <div><span>2 × Robe wax « Kitoko »</span><strong>30 $</strong></div>
                <div><span>1 × Sac cuir vert</span><strong>15 $</strong></div>
                <div className="order-receipt-total"><span>Total</span><strong>45 $ · 126 000 FC</strong></div>
              </div>
              <div className="order-bubble order-bubble-out">Merci ! Livraison ce soir à Gombe 🚚</div>
            </div>
          </div>
        </div>
      </section>
      <section className="marketnet-section marketnet-soft-section"><div className="marketnet-wrap marketnet-editorial marketnet-reveal">
        <div className="marketnet-editorial-media"><img src={cataloguePhoto} alt="Un sac vert, une chemise et une montre présentés dans un catalogue de boutique" className="marketnet-editorial-photo" width={1280} height={960} loading="lazy" /><div className="marketnet-catalogue-label"><strong>Vos produits. Votre identité.</strong><span>Un catalogue, un seul lien.</span></div></div>
        <div><div className="marketnet-eyebrow">Une vitrine qui travaille pour vous</div><h2>Moins de messages.<br />Plus de clarté pour vos clients.</h2><p>Les photos dans les statuts, les prix dans les conversations… Réunissez enfin vos produits dans une boutique facile à parcourir.</p><ul className="marketnet-editorial-list"><li><Check />Des photos, des prix et des disponibilités au même endroit.</li><li><Check />Un panier précis, plutôt qu’une commande éparpillée.</li><li><Check />Une présentation soignée, qui inspire confiance.</li></ul><Button variant="outline" asChild><Link to="/auth" search={{ mode: 'signup' }}>Donner vie à ma boutique <ArrowRight /></Link></Button></div>
      </div></section>
      <section id="fonctionnalites" className="marketnet-section marketnet-soft-section"><div className="marketnet-wrap"><div className="marketnet-section-heading"><div><div className="marketnet-eyebrow">L’essentiel, bien fait</div><h2>Votre commerce.<br />Tous les bons outils.</h2></div><p className="marketnet-section-intro">Un quotidien plus simple, du catalogue à la commande.</p></div><div className="marketnet-features">{features.map(({ icon: Icon,title,text }) => <article key={title} className="marketnet-feature"><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section id="secteurs" className="marketnet-section marketnet-wrap marketnet-reveal"><div className="marketnet-section-heading"><div><div className="marketnet-eyebrow">À chaque commerce, sa vitrine</div><h2>Vous avez des produits.<br />Ils méritent d’être vus.</h2></div><p className="marketnet-section-intro">Pour les commerçants de Kinshasa, Lubumbashi, Goma… et partout ailleurs.</p></div><div className="marketnet-sectors">{[{ icon: Shirt,title: 'Mode & vêtements' },{ icon: Smartphone,title: 'Téléphones & high-tech' },{ icon: Sparkles,title: 'Beauté & soins' },{ icon: Utensils,title: 'Restauration' },{ icon: Gem,title: 'Bijoux & accessoires' },{ icon: Store,title: 'Commerce général' }].map(({ icon: Icon,title }) => <div className="marketnet-sector" key={title}><Icon /><h3>{title}</h3></div>)}</div></section>
      <section id="tarifs" className="marketnet-section marketnet-soft-section"><div className="marketnet-wrap"><div className="marketnet-section-heading"><div><div className="marketnet-eyebrow">Sans commission. Sans surprise.</div><h2>Commencez petit.<br />Grandissez à votre rythme.</h2></div><p className="marketnet-section-intro">Une formule gratuite pour démarrer.<br />La formule Pro pour aller plus loin.</p></div><div className="marketnet-pricing">
        {[{ name: 'Gratuit', price: '0 $', period: 'à vie', desc: 'Pour donner vie à votre première boutique.', items: ['Jusqu’à 15 produits au catalogue','Commandes illimitées sur WhatsApp','Prix en dollars et en francs','Lien personnalisé pour votre boutique','0 % de commission'],pro: false },{ name: 'Pro', price: '10 $', period: 'mois', desc: 'Pour accompagner votre commerce au quotidien.', items: ['Produits et catégories illimités','Toutes les fonctionnalités gratuites','Badge Boutique Vérifiée','Statistiques détaillées','Support prioritaire WhatsApp'],pro: true }].map(plan => <article className={`marketnet-plan ${plan.pro ? 'marketnet-plan-pro' : ''}`} key={plan.name}><div className="marketnet-plan-head"><h3>{plan.name}</h3>{plan.pro && <span className="marketnet-plan-badge">Pour aller plus loin</span>}</div><p>{plan.desc}</p><div className="marketnet-price">{plan.price} <span>/ {plan.period}</span></div><ul>{plan.items.map(item => <li key={item}><Check />{item}</li>)}</ul><Button variant={plan.pro ? 'default' : 'outline'} className="w-full" asChild><Link to="/auth" search={{ mode: 'signup' }}>{plan.pro ? 'Choisir Pro' : 'Commencer gratuitement'}<ArrowRight /></Link></Button></article>)}
      </div></div></section>
      <section className="marketnet-section marketnet-wrap marketnet-reveal"><div className="marketnet-section-heading"><div><div className="marketnet-eyebrow">Les commerçants en parlent</div><h2>Des commerces locaux.<br />De nouvelles possibilités.</h2></div></div><div className="marketnet-testimonials">{[{ name: 'Chantal Mbuyi',shop: 'Awa Fashion · Kinshasa',image: '/testimonials/chantal.jpg',quote: 'Fini de répéter les prix en message privé. Mes clientes cliquent sur mon lien et la commande arrive prête sur WhatsApp.' },{ name: 'Fidele Carlos',shop: 'TechStore 243 · Kakanda',image: '/testimonials/patrick.jpg',quote: 'Mes clients voient le stock et les prix en dollars et en francs. Le panier arrive tout calculé, il ne me reste plus qu’à livrer.' },{ name: 'Grace Ngoy',shop: 'Flora & Kivu · Goma',image: '/testimonials/grace.jpg',quote: 'Je gère toute ma boutique sur mon smartphone. Mes clientes adorent la simplicité et le récapitulatif WhatsApp.' }].map(t => <article className="marketnet-quote" key={t.name}><blockquote>« {t.quote} »</blockquote><div className="marketnet-quote-person"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary text-sm font-semibold" aria-hidden="true">{t.name.split(" ").map(part => part.charAt(0)).join("")}</span><div><strong>{t.name}</strong><span>{t.shop}</span></div></div></article>)}</div></section>
      <section id="faq" className="marketnet-section marketnet-soft-section"><div className="marketnet-wrap"><div className="marketnet-faq"><div className="marketnet-eyebrow">On vous répond</div><h2>Quelques questions ?</h2><Accordion type="single" collapsible>{faq.map(([q,a],i) => <AccordionItem value={`faq-${i}`} key={q}><AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground leading-relaxed">{a}</AccordionContent></AccordionItem>)}</Accordion></div></div></section>
      <section className="marketnet-final"><div className="marketnet-wrap"><div className="marketnet-eyebrow">Votre prochaine étape</div><h2>Votre commerce mérite<br />sa place en ligne.</h2><p>Commencez avec vos premiers produits. Partagez votre lien. Gardez le contact direct avec vos clients.</p><Button variant="secondary" size="lg" asChild><Link to="/auth" search={{ mode: 'signup' }}>Créer ma boutique gratuitement <ArrowRight /></Link></Button></div></section>
    </main>
    <PublicFooter />
    <Button size="icon" className="marketnet-support" asChild><a href="https://wa.me/243906619747" target="_blank" rel="noopener noreferrer" aria-label="Contacter MarketNet sur WhatsApp" title="Contacter MarketNet sur WhatsApp"><MessageCircle /></a></Button>
  </div>;
}
