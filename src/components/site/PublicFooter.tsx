import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="marketnet-wrap">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Logo />
            <p>La boutique en ligne des commerçants de RDC. Votre catalogue, vos commandes sur WhatsApp, sans commission.</p>
            <div className="site-footer-social">
              <a href="https://wa.me/243906619747" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp MarketNet"><MessageCircle /></a>
              <a href="mailto:support@marketnet.cd" aria-label="E-mail MarketNet"><Mail /></a>
            </div>
          </div>
          <div>
            <h3>Produit</h3>
            <ul>
              <li><a href="/#comment-ca-marche">Comment ça marche</a></li>
              <li><a href="/#fonctionnalites">Fonctionnalités</a></li>
              <li><a href="/#tarifs">Tarifs</a></li>
              <li><a href="/#faq">Questions fréquentes</a></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3>Compte</h3>
            <ul>
              <li><Link to="/auth" search={{ mode: "signup" }}>Créer ma boutique</Link></li>
              <li><Link to="/auth" search={{ mode: "login" }}>Connexion</Link></li>
              <li><a href="https://wa.me/243906619747" target="_blank" rel="noopener noreferrer">Aide sur WhatsApp</a></li>
            </ul>
          </div>
          <div>
            <h3>Légal</h3>
            <ul>
              <li><Link to="/terms">Conditions d’utilisation</Link></li>
              <li><Link to="/privacy">Confidentialité</Link></li>
              <li><Link to="/data-deletion">Suppression des données</Link></li>
            </ul>
          </div>
        </div>
        <div className="site-footer-bottom">
          <span>© {year} MarketNet. Tous droits réservés.</span>
          <span>Fait pour les commerçants de Kinshasa, Lubumbashi, Goma et partout en RDC.</span>
        </div>
      </div>
    </footer>
  );
}
