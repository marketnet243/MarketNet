import { createFileRoute } from "@tanstack/react-router";
import {
  getInvoiceData,
  generateInvoicePdf,
  getAssignmentLetterData,
  generateAssignmentLetterPdf,
} from "@/lib/invoices.server";

export const Route = createFileRoute("/api/public/invoice-pdf")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const paymentId = url.searchParams.get("paymentId");

          if (!paymentId) {
            return new Response(JSON.stringify({ error: "Paramètre paymentId manquant" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 1. Facture commerciale SasPay
          const inv = await getInvoiceData(paymentId);
          if (inv) {
            const pdfBuffer = await generateInvoicePdf(inv);
            return new Response(pdfBuffer, {
              status: 200,
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="facture-${inv.invoiceNumber}.pdf"`,
                "Cache-Control": "private, max-age=3600",
              },
            });
          }

          // 2. Lettre d'attribution officielle (Admin)
          const letter = await getAssignmentLetterData(paymentId);
          if (letter) {
            const pdfBuffer = await generateAssignmentLetterPdf(letter);
            return new Response(pdfBuffer, {
              status: 200,
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="lettre-attribution-${letter.letterNumber}.pdf"`,
                "Cache-Control": "private, max-age=3600",
              },
            });
          }

          return new Response(JSON.stringify({ error: "Document introuvable pour ce paiement" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("[Invoice-PDF] Erreur lors de la génération du PDF:", error);
          return new Response(JSON.stringify({ error: "Erreur serveur lors de la génération du PDF" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
