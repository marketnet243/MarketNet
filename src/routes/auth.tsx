import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useServerFn } from "@tanstack/react-start";
import { notifyNewUserRegistration } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? "signup" : s.mode === "forgot" ? "forgot" : "login",
  }) as { mode: "login" | "signup" | "forgot" },
  head: () => ({
    meta: [
      { title: "Connexion & Inscription — MarketNet" },
      { name: "description", content: "Connectez-vous ou créez votre boutique en ligne sur MarketNet." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(255);
const passwordSchema = z.string().min(8, "8 caractères minimum").max(72);
const nameSchema = z.string().trim().min(2, "Veuillez entrer votre nom complet").max(80);

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1); // 1 = Email, 2 = Nom, 3 = Mot de passe
  const [isForgot, setIsForgot] = useState(initialMode === "forgot");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const sendNewUserNotif = useServerFn(notifyNewUserRegistration);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de la connexion Google");
      setGoogleBusy(false);
    }
  }

  // Étape 1 d'inscription : Validation de l'e-mail -> Passe à l'étape 2 (Nom)
  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    const res = emailSchema.safeParse(email.trim());
    if (!res.success) {
      return toast.error(res.error.issues[0].message);
    }
    setSignUpStep(2);
  }

  // Étape 2 d'inscription : Validation du Nom -> Passe à l'étape 3 (Mot de passe)
  function handleNameContinue(e: React.FormEvent) {
    e.preventDefault();
    const res = nameSchema.safeParse(name.trim());
    if (!res.success) {
      return toast.error(res.error.issues[0].message);
    }
    setSignUpStep(3);
  }

  // Étape 3 d'inscription : Création finale du compte
  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(email.trim());
    if (!emailRes.success) return toast.error(emailRes.error.issues[0].message);

    const nameRes = nameSchema.safeParse(name.trim());
    if (!nameRes.success) return toast.error(nameRes.error.issues[0].message);

    const pwRes = passwordSchema.safeParse(password);
    if (!pwRes.success) return toast.error(pwRes.error.issues[0].message);

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailRes.data,
        password: pwRes.data,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: nameRes.data },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")
        ) {
          toast.error("Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.");
          setIsSignUp(false);
          setSignUpStep(1);
          return;
        }
        throw error;
      }

      sendNewUserNotif({ data: { email: emailRes.data, fullName: nameRes.data } }).catch(() => {});

      if (data.session) {
        toast.success("Bienvenue sur MarketNet !");
        navigate({ to: "/dashboard" });
        return;
      }

      // Connexion automatique directe
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: emailRes.data,
        password: pwRes.data,
      });

      if (loginData?.session) {
        toast.success("Bienvenue sur MarketNet !");
        navigate({ to: "/dashboard" });
        return;
      }

      setSent("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Connexion standard (Login)
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(email.trim());
    if (!emailRes.success) return toast.error(emailRes.error.issues[0].message);
    if (!password) return toast.error("Veuillez renseigner votre mot de passe");

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailRes.data,
        password,
      });
      if (error) {
        throw new Error(
          error.message.includes("Invalid")
            ? "Adresse e-mail ou mot de passe incorrect"
            : error.message
        );
      }
      toast.success("Connexion réussie");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Mot de passe oublié
  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(email.trim());
    if (!emailRes.success) return toast.error(emailRes.error.issues[0].message);

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRes.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent("Si un compte existe avec cet e-mail, un lien de réinitialisation sécurisé vient de vous être envoyé.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function switchToSignUp() {
    setIsSignUp(true);
    setSignUpStep(1);
    setIsForgot(false);
  }

  function switchToLogin() {
    setIsSignUp(false);
    setSignUpStep(1);
    setIsForgot(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="w-full max-w-[380px] mb-8 text-center">
        <Logo />
      </div>

      {/* Main Single Card (Vytrini Style) */}
      <div className="w-full max-w-[380px] bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-xs">
        
        {/* Title & Context */}
        {!sent && (
          <div className="mb-5 space-y-1 text-center">
            {isForgot ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsForgot(false)}
                  className="mb-2 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Retour à la connexion
                </button>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Mot de passe oublié
                </h1>
                <p className="text-xs text-muted-foreground">
                  Entrez votre e-mail pour recevoir les instructions.
                </p>
              </>
            ) : isSignUp ? (
              <>
                {signUpStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setSignUpStep((s) => (s === 3 ? 2 : 1))}
                    className="mb-2 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    <span>{signUpStep === 2 ? "Modifier l'e-mail" : "Modifier le nom"}</span>
                  </button>
                )}
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {signUpStep === 1 && "Créer un compte"}
                  {signUpStep === 2 && "Votre nom complet"}
                  {signUpStep === 3 && "Sécurisez votre compte"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {signUpStep === 1 && "Entrez votre e-mail pour commencer."}
                  {signUpStep === 2 && "Comment vos clients doivent-ils vous appeler ?"}
                  {signUpStep === 3 && "Choisissez un mot de passe (8 caractères min)."}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Connexion
                </h1>
                <p className="text-xs text-muted-foreground">
                  Accédez à votre espace commerçant.
                </p>
              </>
            )}
          </div>
        )}

        {/* Message de succès (pour mot de passe oublié) */}
        {sent ? (
          <div className="rounded-xl border border-border bg-muted/20 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">E-mail envoyé</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{sent}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSent(null);
                setIsForgot(false);
              }}
              className="w-full h-10 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <>
            {/* Bouton Google (Affiché sur Login et sur l'Étape 1 de l'inscription) */}
            {!isForgot && (!isSignUp || signUpStep === 1) && (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={busy || googleBusy}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background hover:bg-muted/40 text-foreground font-semibold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {googleBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <GoogleIcon className="h-4 w-4 shrink-0" />
                      <span>Continuer avec Google</span>
                    </>
                  )}
                </Button>

                {/* Séparateur */}
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-card px-2.5 text-muted-foreground font-medium">
                      ou par e-mail
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* CAS 1 : INSCRIPTION PROGRESSIVE ÉTAPE PAR ÉTAPE       */}
            {/* ══════════════════════════════════════════════════════ */}
            {isSignUp && !isForgot && (
              <>
                {/* ÉTAPE 1 : E-MAIL SEULEMENT */}
                {signUpStep === 1 && (
                  <form onSubmit={handleEmailContinue} className="space-y-3.5 mt-4">
                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-foreground">
                        Adresse e-mail
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="nom@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        autoFocus
                        className="h-10 rounded-xl bg-background border-input text-xs"
                      />
                    </div>

                    <div className="pt-1.5">
                      <Button
                        type="submit"
                        size="lg"
                        className="h-10 w-full rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                      >
                        <span>Continuer</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <p className="pt-1 text-center text-[10px] text-muted-foreground leading-normal">
                      En continuant, vous acceptez nos{" "}
                      <Link to="/terms" className="underline hover:text-foreground">
                        conditions
                      </Link>
                      .
                    </p>
                  </form>
                )}

                {/* ÉTAPE 2 : NOM COMPLET */}
                {signUpStep === 2 && (
                  <form onSubmit={handleNameContinue} className="space-y-3.5 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="signup-name" className="text-xs font-medium text-foreground">
                        Nom complet
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Ex. Landry Ngoy"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                        autoFocus
                        className="h-10 rounded-xl bg-background border-input text-xs"
                      />
                    </div>

                    <div className="pt-1.5">
                      <Button
                        type="submit"
                        size="lg"
                        className="h-10 w-full rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                      >
                        <span>Continuer</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </form>
                )}

                {/* ÉTAPE 3 : MOT DE PASSE ET CRÉATION DU COMPTE */}
                {signUpStep === 3 && (
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="signup-pw" className="text-xs font-medium text-foreground">
                        Mot de passe
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-pw"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          autoFocus
                          className="h-10 rounded-xl bg-background border-input pr-9 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Au moins 8 caractères.
                      </p>
                    </div>

                    <div className="pt-1.5">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={busy}
                        className="h-10 w-full rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span>Créer mon compte</span>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* CAS 2 : CONNEXION CLASSIQUE (LOGIN)                   */}
            {/* ══════════════════════════════════════════════════════ */}
            {!isSignUp && !isForgot && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 mt-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-xs font-medium text-foreground">
                    Adresse e-mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="h-10 rounded-xl bg-background border-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-pw" className="text-xs font-medium text-foreground">
                      Mot de passe
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-pw"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="h-10 rounded-xl bg-background border-input pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1.5">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-10 w-full rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                    disabled={busy || googleBusy}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>Se connecter</span>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* CAS 3 : MOT DE PASSE OUBLIÉ                           */}
            {/* ══════════════════════════════════════════════════════ */}
            {isForgot && (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5 mt-4">
                <div className="space-y-1">
                  <Label htmlFor="forgot-email" className="text-xs font-medium text-foreground">
                    Adresse e-mail
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                    className="h-10 rounded-xl bg-background border-input text-xs"
                  />
                </div>

                <div className="pt-1.5">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-10 w-full rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>Envoyer le lien de réinitialisation</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Switcher at bottom of card */}
      {!isForgot && !sent && (
        <div className="w-full max-w-[380px] mt-4 text-center text-xs text-muted-foreground">
          {isSignUp ? (
            <>
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors cursor-pointer"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={switchToSignUp}
                className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors cursor-pointer"
              >
                Créer un compte
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
