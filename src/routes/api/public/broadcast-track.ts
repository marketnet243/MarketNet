import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// 1x1 transparent PNG buffer
const TRANSPARENT_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

export const Route = createFileRoute("/api/public/broadcast-track")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const broadcastId = url.searchParams.get("b");
          const merchantId = url.searchParams.get("m");
          const next = url.searchParams.get("next");

          if (broadcastId) {
            const sb = supabaseAdmin;
            let query = sb
              .from("support_broadcast_recipients")
              .update({ lu_le: new Date().toISOString() })
              .eq("broadcast_id", broadcastId)
              .is("lu_le", null);

            if (merchantId) {
              query = query.eq("merchant_id", merchantId);
            }

            await query;

            // Recalculer le compteur exact de lectures
            const { count } = await sb
              .from("support_broadcast_recipients")
              .select("id", { count: "exact", head: true })
              .eq("broadcast_id", broadcastId)
              .not("lu_le", "is", null);

            if (count != null) {
              await sb
                .from("support_broadcasts")
                .update({ lus_count: count })
                .eq("id", broadcastId);
            }
          }

          if (next) {
            const siteUrl = process.env.MARKETNET_SITE_URL || "https://appmarketnet.vercel.app";
            const target = next.startsWith("http") ? next : `${siteUrl}${next.startsWith("/") ? next : `/${next}`}`;
            return new Response(null, {
              status: 302,
              headers: { Location: target },
            });
          }

          return new Response(TRANSPARENT_1X1_PNG, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
        } catch (e) {
          return new Response(TRANSPARENT_1X1_PNG, {
            status: 200,
            headers: { "Content-Type": "image/png" },
          });
        }
      },
    },
  },
});
