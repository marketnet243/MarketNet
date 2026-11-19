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
import { AuthShell } from "@/components/auth/AuthShell";
import { useServerFn } from "@tanstack/react-start";
import { lovable } from "@/integrations/lovable/index";
import { notifyNewUserRegistration } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? "signup" : s.mode === "forgot" ? "forgot" : "login",
  }) as { mode: "login" | "signup" | "forgot" },
  head: () => ({
    meta: [
      { property: "og:title", content: "Connexion & Inscription — MarketNet" },
      { property: "og:description", content: "Connectez-vous ou créez votre boutique en ligne sur MarketNet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;
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
    setIsSignUp(initialMode === 'signup');
    setIsForgot(initialMode === 'forgot');
    setSignUpStep(1);
    setSent(null);
  }, [initialMode]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    try {
      sessionStorage.setItem("marketnet-auth-return", "/dashboard");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/dashboard" });
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

      setSent("Votre compte est créé. Vérifiez votre e-mail pour confirmer votre adresse avant de vous connecter.");
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
    <AuthShell>
    <div className="auth-page">
      {/* Brand Header */}
      <div className="auth-brand">
        <Logo />
      </div>

      {/* Main Single Card (Vytrini Style) */}
      <div className="auth-panel">
        
        {isSignUp && !isForgot && !sent && <><p className="auth-step-caption">Étape {signUpStep} sur 3 · Votre compte</p><div className="auth-progress" aria-hidden="true">{[1,2,3].map(step => <span key={step} data-active={step <= signUpStep} />)}</div></>}
        {/* Title & Context */}
        {!sent && (
          <div className="auth-heading">
            {isForgot ? (
              <>
                <Button variant="ghost"
                  type="button"
                  onClick={() => setIsForgot(false)}
                  className="auth-inline mb-2 text-muted-foreground"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Retour à la connexion
                </Button>
                <h1 className="text-foreground">
                  Mot de passe oublié
                </h1>
                <p className="text-sm text-muted-foreground">
                  Entrez votre e-mail pour recevoir les instructions.
                </p>
              </>
            ) : isSignUp ? (
              <>
                {signUpStep > 1 && (
                  <Button variant="ghost"
                    type="button"
                    onClick={() => setSignUpStep((s) => (s === 3 ? 2 : 1))}
                    className="auth-inline mb-2 text-muted-foreground"
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    <span>{signUpStep === 2 ? "Modifier l'e-mail" : "Modifier le nom"}</span>
                  </Button>
                )}
                <h1 className="text-foreground">
                  {signUpStep === 1 && "Créer un compte"}
                  {signUpStep === 2 && "Votre nom complet"}
                  {signUpStep === 3 && "Sécurisez votre compte"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {signUpStep === 1 && "Entrez votre e-mail pour commencer."}
                  {signUpStep === 2 && "Comment vos clients doivent-ils vous appeler ?"}
                  {signUpStep === 3 && "Choisissez un mot de passe (8 caractères min)."}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-foreground">
                  Connexion
                </h1>
                <p className="text-sm text-muted-foreground">
                  Accédez à votre espace commerçant.
                </p>
              </>
            )}
          </div>
        )}

        {/* Message de succès (pour mot de passe oublié) */}
        {sent ? (
          <div className="rounded-xl border border-border bg-muted/20 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
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
                  variant="google"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={busy || googleBusy}
                  className="auth-submit"
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
                      <Label htmlFor="signup-email" className="auth-label">
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
                                                className="auth-field"
                      />
                    </div>

                    <div className="pt-1.5">
                      <Button
                        type="submit"
                        size="lg"
                        className="auth-submit"
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
                      <Label htmlFor="signup-name" className="auth-label">
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
                                                className="auth-field"
                      />
                    </div>

                    <div className="pt-1.5">
                      <Button
                        type="submit"
                        size="lg"
                        className="auth-submit"
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
                      <Label htmlFor="signup-pw" className="auth-label">
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
                                                    className="auth-field pr-12"
                        />
                        <Button variant="ghost"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="auth-toggle" size="icon"
                          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
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
                        className="auth-submit"
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
                  <Label htmlFor="login-email" className="auth-label">
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
                    className="auth-field"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-pw" className="auth-label">
                      Mot de passe
                    </Label>
                    <Button variant="ghost"
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="auth-inline text-muted-foreground"
                    >
                      Oublié ?
                    </Button>
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
                      className="auth-field pr-12"
                    />
                    <Button variant="ghost"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-toggle" size="icon"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="pt-1.5">
                  <Button
                    type="submit"
                    size="lg"
                    className="auth-submit"
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
                  <Label htmlFor="forgot-email" className="auth-label">
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
                                        className="auth-field"
                  />
                </div>

                <div className="pt-1.5">
                  <Button
                    type="submit"
                    size="lg"
                    className="auth-submit"
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
        <div className="auth-footer">
          {isSignUp ? (
            <>
              Vous avez déjà un compte ?{" "}
              <Button variant="ghost"
                type="button"
                onClick={switchToLogin}
                className="auth-inline font-semibold text-primary underline underline-offset-4"
              >
                Se connecter
              </Button>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Button variant="ghost"
                type="button"
                onClick={switchToSignUp}
                className="auth-inline font-semibold text-primary underline underline-offset-4"
              >
                Créer un compte
              </Button>
            </>
          )}
        </div>
      )}
    </div>
    </AuthShell>
  );
}
