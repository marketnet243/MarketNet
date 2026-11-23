import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PwaInstallButton } from "@/components/PwaInstallButton";

const NAV: [string, string][] = [
  ["/#comment-ca-marche", "Comment ça marche"],
  ["/#fonctionnalites", "Fonctionnalités"],
  ["/#tarifs", "Tarifs"],
  ["/#faq", "Questions"],
  ["/blog", "Blog"],
];

export function PublicHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const state = open ? "open" : scrolled || solid ? "scrolled" : "top";

  return (
    <header className="site-header" data-state={state}>
      <div className="marketnet-wrap site-header-inner">
        <Logo />
        <nav className="site-nav" aria-label="Navigation principale">{NAV.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
        <div className="site-header-actions">
          <PwaInstallButton />
          <Button variant="ghost" size="sm" asChild><Link to="/auth" search={{ mode: "login" }}>Connexion</Link></Button>
          <Button size="sm" className="rounded-full" asChild><Link to="/auth" search={{ mode: "signup" }}>Créer ma boutique <ArrowRight /></Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="site-menu-toggle" aria-expanded={open} aria-controls="site-mobile-menu" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && (
        <nav id="site-mobile-menu" className="site-mobile-menu" aria-label="Navigation mobile">
          {NAV.map(([href, label], i) => <a key={href} href={href} style={{ animationDelay: `${i * 50}ms` }} onClick={() => setOpen(false)}>{label}<ArrowRight size={16} /></a>)}
          <div className="site-mobile-actions">
            <PwaInstallButton />
            <Button variant="outline" size="lg" asChild><Link to="/auth" search={{ mode: "login" }}>Connexion</Link></Button>
            <Button size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Créer ma boutique gratuitement <ArrowRight /></Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
}
