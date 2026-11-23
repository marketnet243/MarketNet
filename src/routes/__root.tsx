import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n’existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-normal text-foreground">
          La page n’a pas pu se charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous pouvez réessayer ou revenir à l’accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </Button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l’accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MarketNet" },
      { name: "description", content: "Votre boutique en ligne, vos commandes sur WhatsApp." },
      { name: "author", content: "MarketNet" },
      { property: "og:title", content: "MarketNet" },
      { property: "og:description", content: "Votre boutique en ligne, vos commandes sur WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@500;700&family=Playfair+Display:wght@600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body style={{ backgroundColor: "#F0F2F5", margin: 0 }}>
        {/* Inline critical loader: visible before the JS bundle and protected routes load. */}
        <div
          id="app-loading"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            background: "#F0F2F5",
            color: "#4F46E5",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                border: "3px solid rgba(79,70,229,.18)",
                borderTopColor: "#4F46E5",
                borderRadius: "50%",
                animation: "marketnet-loader-spin .8s linear infinite",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
              Chargement de votre espace…
            </span>
          </div>
          <style>{`@keyframes marketnet-loader-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <a href="#main-content" className="skip-link">Aller au contenu</a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem("marketnet-auth-return");
        queryClient.clear();
      }
      if (event === "SIGNED_IN") {
        const authReturn = sessionStorage.getItem("marketnet-auth-return");
        sessionStorage.removeItem("marketnet-auth-return");
        if (window.location.pathname === "/" && authReturn) {
          window.location.assign(authReturn);
        }
      }
    });

    // Remove the static loader only after the first client render has painted.
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("app-loading")?.remove();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
