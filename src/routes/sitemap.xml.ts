import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const staticPaths = ["/", "/terms", "/privacy", "/data-deletion"];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeLastmod(value?: string | null): string {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl = process.env.MARKETNET_SITE_URL || process.env.VITE_PUBLIC_URL || "https://appmarketnet.vercel.app";

        const { data: shops } = await supabaseAdmin
          .from("shops")
          .select("slug, updated_at")
          .eq("is_published", true)
          .eq("is_suspended", false)
          .order("updated_at", { ascending: false });

        const urls = [
          ...staticPaths.map((path) => ({
            loc: new URL(path, siteUrl).toString(),
            lastmod: normalizeLastmod(),
          })),
          ...(shops ?? []).map((shop) => ({
            loc: new URL(`/b/${shop.slug}`, siteUrl).toString(),
            lastmod: normalizeLastmod(shop.updated_at),
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (entry) => `
    <url>
      <loc>${escapeXml(entry.loc)}</loc>
      <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    </url>`
    )
    .join("")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
