import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — MarketNet" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte MarketNet." },
      { property: "og:title", content: "Nouveau mot de passe — MarketNet" },
      { property: "og:description", content: "Réinitialisation sécurisée du mot de passe MarketNet." },
    ],
  }),
  component: ResetPage,
});

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
  const labels = ["Trop court ou fragile", "Moyen", "Bon mot de passe", "Excellent et robuste"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < score ? colors[score - 1] : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Force du mot de passe :</span>
        <span
          className={cn(
            "font-semibold",
            score <= 1
              ? "text-red-500"
              : score === 2
              ? "text-amber-500"
              : "text-emerald-500"
          )}
        >
          {labels[score - 1] || "À compléter"}
        </span>
      </div>
    </div>
  );
}

function ResetPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const navigate = useNavigate();

  // Décompte fluide et non bloquant vers le dashboard après succès
  useEffect(() => {
    if (!done) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate({ to: "/dashboard" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [done, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (pw !== confirm) {
      toast.error("Les deux mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      toast.error("Le lien de réinitialisation a expiré ou est invalide. Veuillez recommencer.");
      return;
    }
    setDone(true);
    toast.success("Votre mot de passe a été réinitialisé avec succès !");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
      {/* Halos lumineux en arrière-plan */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-primary/15 blur-[140px] pointer-events-none" />

      {/* Conteneur principal harmonisé avec auth.tsx */}
      <div className="w-full max-w-[440px] relative z-10 py-6">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg shadow-primary/30">
              M
            </span>
            <span className="text-2xl font-black tracking-tight text-foreground">
              Market<span className="text-primary">Net</span>
            </span>
          </Link>
        </div>

        {/* Card principale */}
        <div className="rounded-[2rem] border bg-card/95 backdrop-blur-xl p-7 sm:p-9 shadow-2xl shadow-primary/5">
          {done ? (
            /* ── État de confirmation avec effets élégants non bloquants ── */
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 animate-in zoom-in-75 duration-300" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Mise à jour réussie</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Mot de passe changé !
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Votre nouveau mot de passe est désormais actif. Votre compte et votre boutique sont parfaitement protégés.
                </p>
              </div>

              {/* Indicateur de décompte non bloquant */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>
                  Redirection automatique dans <strong className="text-foreground">{countdown}s</strong>…
                </span>
              </div>

              {/* Bouton d'action immédiate (100% non bloquant) */}
              <div className="pt-1 space-y-3">
                <Button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <span>Accéder à mon tableau de bord</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Link
                  to="/auth"
                  className="inline-block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Revenir à la page de connexion
                </Link>
              </div>
            </div>
          ) : (
            /* ── Formulaire de changement de mot de passe ── */
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-xs">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Nouveau mot de passe
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choisissez un mot de passe robuste pour protéger votre espace commerçant.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div className="space-y-1.5">
                  <Label htmlFor="pw" className="text-xs font-bold text-foreground">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pw"
                      type={showPw ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10 rounded-xl bg-background border-border focus-visible:ring-primary"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <StrengthBar password={pw} />
                </div>

                {/* Confirmation mot de passe */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="confirm" className="text-xs font-bold text-foreground">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        "h-11 pl-10 pr-10 rounded-xl bg-background border-border focus-visible:ring-primary",
                        confirm && pw !== confirm && "border-red-500 focus-visible:ring-red-500"
                      )}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && pw !== confirm && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1 font-medium pt-0.5">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                  {confirm && pw === confirm && pw.length >= 8 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium pt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mots de passe identiques
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={busy || pw.length < 8 || pw !== confirm}
                    className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-95 text-sm"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      "Enregistrer mon nouveau mot de passe"
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Connexion chiffrée &amp; sécurisée</span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
