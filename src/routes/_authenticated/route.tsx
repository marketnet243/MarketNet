import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  head: () => ({ meta: [{ title: 'Route — MarketNet' }, { name: "description", content: 'Consultez et gérez route sur MarketNet.' }, { property: "og:title", content: 'Route — MarketNet' }, { property: "og:description", content: 'Consultez et gérez route sur MarketNet.' }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
