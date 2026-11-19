import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/support/nouveau")({
  head: () => ({ meta: [{ title: 'Support · nouveau — MarketNet' }, { name: "description", content: 'Consultez et gérez support · nouveau sur MarketNet.' }, { property: "og:title", content: 'Support · nouveau — MarketNet' }, { property: "og:description", content: 'Consultez et gérez support · nouveau sur MarketNet.' }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/support" });
  },
  component: () => null,
});
