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
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const configuredRedirect = opts?.redirect_uri
          ? new URL(opts.redirect_uri, origin).pathname === "/auth"
            ? `${origin}/auth/callback`
            : opts.redirect_uri
          : `${origin}/dashboard`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo: configuredRedirect,
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
