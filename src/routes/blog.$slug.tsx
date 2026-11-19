import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Button } from "@/components/ui/button";
import { BLOG_ARTICLES, getArticle } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Blog MarketNet` },
          { name: "description", content: loaderData.excerpt },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.excerpt },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Article introuvable — MarketNet" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
  }),
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="legal-layout"><PublicHeader solid /><main className="blog-wrap blog-hero"><h1>Article introuvable</h1><Link to="/blog">Retour au blog</Link></main></div>
  ),
});

function ArticlePage() {
  const a = Route.useLoaderData();
  const others = BLOG_ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 2);
  return (
    <div className="legal-layout">
      <PublicHeader solid />
      <main className="blog-wrap blog-article">
        <Link to="/blog" className="blog-back"><ArrowLeft size={16} /> Tous les articles</Link>
        <span className="blog-tag">{a.category}</span>
        <h1>{a.title}</h1>
        <span className="blog-meta"><Clock size={14} /> {a.readTime} de lecture · {a.date}</span>
        <img src={a.cover} alt={a.coverAlt} className="blog-cover" width={1280} height={720} />
        <p className="blog-intro">{a.intro}</p>

        <div className="blog-keypoints">
          <strong>À retenir</strong>
          <ul>{a.keyPoints.map((k) => <li key={k}><CheckCircle2 size={18} /> {k}</li>)}</ul>
        </div>

        {a.sections.map((s, i) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
            {s.tips && (
              <ul className="blog-tips">
                {s.tips.map((t) => <li key={t}><CheckCircle2 size={18} /> {t}</li>)}
              </ul>
            )}
            {a.inlineImage.afterSection === i && (
              <figure className="blog-figure">
                <img src={a.inlineImage.src} alt={a.inlineImage.alt} loading="lazy" width={1280} height={720} />
                <figcaption>{a.inlineImage.caption}</figcaption>
              </figure>
            )}
          </section>
        ))}

        <section className="blog-faq">
          <h2>Questions fréquentes</h2>
          {a.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <p className="blog-conclusion">{a.conclusion}</p>

        <div className="blog-cta">
          <h2>Prêt à vous lancer ?</h2>
          <p>Créez votre boutique MarketNet gratuitement et recevez vos premières commandes sur WhatsApp.</p>
          <Button size="lg" className="rounded-full" asChild><Link to="/auth" search={{ mode: "signup" }}>Créer ma boutique <ArrowRight /></Link></Button>
        </div>

        <h2 className="blog-more-title">À lire aussi</h2>
        <div className="blog-grid">
          {others.map((o) => (
            <Link key={o.slug} to="/blog/$slug" params={{ slug: o.slug }} className="blog-card">
              <img src={o.cover} alt={o.coverAlt} className="blog-card-img" loading="lazy" width={1280} height={720} />
              <div className="blog-card-body">
                <span className="blog-tag">{o.category}</span>
                <h2>{o.title}</h2>
                <p>{o.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
