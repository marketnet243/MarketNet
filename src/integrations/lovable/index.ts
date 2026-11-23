import { supabase } from "../supabase/client";

export type OAuthProvider = "google" | "github" | "apple" | string;

export type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      try {
        // Returning to /auth mounts the login form before AuthPage checks the
        // session and performs its post-login lookups. Send that callback to
        // the authenticated entry point instead; its route already handles
        // admin, existing-shop, and onboarding destinations.
        const requestedRedirect = opts?.redirect_uri;
        const redirectTo = requestedRedirect
          ? new URL(requestedRedirect).pathname === "/auth"
            ? `${new URL(requestedRedirect).origin}/dashboard`
            : requestedRedirect
          : `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo,
            queryParams: opts?.extraParams,
          },
        });
        if (error) return { error, redirected: false };
        return { error: null, redirected: true };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)), redirected: false };
      }
    },
  },
};
