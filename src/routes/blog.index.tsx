import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { BLOG_ARTICLES } from "@/lib/blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Bien démarrer avec MarketNet" },
      { name: "description", content: "Guides et conseils pour créer, remplir et faire grandir votre boutique en ligne MarketNet." },
      { property: "og:title", content: "Blog — Bien démarrer avec MarketNet" },
      { property: "og:description", content: "Guides pratiques pour vendre en ligne avec MarketNet en RDC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [featured, ...rest] = BLOG_ARTICLES;
  return (
    <div className="legal-layout">
      <PublicHeader solid />
      <main className="blog-wrap">
        <header className="blog-hero">
          <span className="blog-eyebrow">Blog MarketNet</span>
          <h1>Bien démarrer avec MarketNet</h1>
          <p>Des guides simples pour créer votre boutique, présenter vos produits et recevoir plus de commandes.</p>
        </header>

        <Link to="/blog/$slug" params={{ slug: featured.slug }} className="blog-card blog-card-featured">
          <img src={featured.cover} alt={featured.coverAlt} className="blog-card-img" width={1280} height={720} />
          <div className="blog-card-body">
          <span className="blog-tag">{featured.category}</span>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <span className="blog-meta"><Clock size={14} /> {featured.readTime} de lecture <ArrowRight size={16} className="blog-arrow" /></span>
          </div>
        </Link>

        <div className="blog-grid">
          {rest.map((a) => (
            <Link key={a.slug} to="/blog/$slug" params={{ slug: a.slug }} className="blog-card">
              <img src={a.cover} alt={a.coverAlt} className="blog-card-img" loading="lazy" width={1280} height={720} />
              <div className="blog-card-body">
              <span className="blog-tag">{a.category}</span>
              <h2>{a.title}</h2>
              <p>{a.excerpt}</p>
              <span className="blog-meta"><Clock size={14} /> {a.readTime} de lecture <ArrowRight size={16} className="blog-arrow" /></span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
