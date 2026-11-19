import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/marketnet-logo.png";

export function Logo() {
  return (
    <Link to="/" className="marketnet-logo" aria-label="MarketNet — Accueil">
      <img src={logoMark} alt="" className="marketnet-logo-mark" width={33} height={33} />
      <span>
        Market<span className="text-primary">Net</span>
      </span>
    </Link>
  );
}
