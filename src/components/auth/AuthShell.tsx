import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck, Smartphone, Star } from "lucide-react";
import boutique from "@/assets/marketnet-boutique.jpg";
import { Logo } from "@/components/Logo";

const points = [
  { icon: MessageCircle, title: "Commandes sur WhatsApp", text: "Vos clients commandent, vous recevez tout au même endroit." },
  { icon: Smartphone, title: "Pensé pour le téléphone", text: "Gérez votre boutique où que vous soyez." },
  { icon: ShieldCheck, title: "0 % de commission", text: "Vous gardez l'intégralité de vos ventes." },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-showcase">
        <img src={boutique} alt="" className="auth-showcase-image" />
        <div className="auth-showcase-inner">
          <div className="auth-showcase-logo"><Logo /></div>
          <div>
            <p className="auth-showcase-eyebrow">Le commerce local, sans limites</p>
            <h2 className="auth-showcase-title">
              Votre boutique en ligne, <em>prête en quelques minutes.</em>
            </h2>
            <ul className="auth-showcase-points">
              {points.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span><Icon /></span>
                  <div><strong>{title}</strong><p>{text}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <figure className="auth-showcase-quote">
            <div className="auth-showcase-stars">{[0,1,2,3,4].map((i) => <Star key={i} />)}</div>
            <blockquote>« Mes clientes voient enfin tout mon catalogue. Je reçois des commandes claires chaque jour. »</blockquote>
            <figcaption>Commerçante MarketNet · Lubumbashi</figcaption>
          </figure>
        </div>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  );
}
