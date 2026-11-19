import { useState } from "react";
import { Minus, Plus, MessageCircle, ShoppingBag, Trash2, MapPin, User, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/imported-database";
import { formatPrice, mediaUrl } from "@/lib/marketnet";
import { useCart, cartTotals } from "./cart";

type ShopInfo = { id: string; name: string; whatsapp: string; slug: string };

export function CartSheet({ shop, origin, className }: { shop: ShopInfo; origin: string; className?: string }) {
  const { items, setQty, clear, open, setOpen } = useCart();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const totals = cartTotals(items);
  const totalStr = Object.entries(totals).map(([c, v]) => formatPrice(v, c)).join(" + ");
  const count = items.reduce((s, i) => s + i.qty, 0);

  async function order() {
    const customer = name.trim().slice(0, 80);
    const addr = address.trim().slice(0, 200);
    const msgNotes = notes.trim().slice(0, 500);

    if (!customer) return toast.error("Veuillez indiquer votre nom complet");
    if (!addr) return toast.error("Veuillez indiquer votre adresse ou quartier de livraison");

    setBusy(true);
    const currencies = Object.keys(totals);

    // Save the order (best-effort: WhatsApp must open even if saving fails)
    try {
      await supabase.from("orders").insert({
        shop_id: shop.id,
        customer_name: `${customer} - ${addr}`,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          qty: i.qty,
          price: i.price,
          original_price: i.original_price ?? i.price,
          discount_applied: i.original_price && i.original_price > i.price ? i.original_price - i.price : null,
          promotion_id: i.promo_id ?? null,
          currency: i.currency,
          variant: i.variant ?? null,
        })),
        total: currencies.length === 1 ? totals[currencies[0]] : 0,
        currency: currencies.length === 1 ? currencies[0] : "MIXTE",
      });
    } catch (e) {
      console.warn("Best-effort order logging error:", e);
    }

    const lines = items.map((i) => {
      const hasDiscount = i.original_price && i.original_price > i.price;
      const variantTxt = i.variant ? `\n   ▫️ Option : ${i.variant}` : "";
      let priceTxt = `\n   ▫️ Sous-total : ${formatPrice(i.price * i.qty, i.currency)}`;
      if (hasDiscount) {
        priceTxt += ` ~(${formatPrice(i.original_price! * i.qty, i.currency)})~`;
      }
      return `📦 *${i.qty}x ${i.name}*${variantTxt}${priceTxt}`;
    });

    let msg = `🛒 *NOUVELLE COMMANDE — ${shop.name}*\n\nBonjour ! Je souhaite passer commande pour les articles suivants :\n\n${lines.join("\n\n")}\n\n────────────────────\n💵 *TOTAL : ${totalStr}*\n────────────────────\n\n📍 *Coordonnées de livraison*\n• Nom : ${customer}\n• Adresse / Quartier : ${addr}`;
    if (msgNotes && msgNotes.trim()) {
      msg += `\n• Précisions : ${msgNotes.trim()}`;
    }

    const cleanNum = shop.whatsapp?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, "_blank");
    setBusy(false);
    clear();
    setOpen(false);
  }

  return (
    <>
      {count > 0 && (
        <div className={className ?? "fixed inset-x-0 bottom-0 z-30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mx-auto flex w-full max-w-md items-center justify-between h-13 px-5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xl shadow-indigo-500/25 transition-all font-bold cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-sm">
              <ShoppingBag className="h-5 w-5" />
              <span>Voir le panier ({count})</span>
            </span>
            <span className="text-sm font-extrabold">{totalStr}</span>
          </button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:mx-auto sm:max-w-lg p-5 sm:p-6 border-slate-200">
          <SheetHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#4F46E5]" />
                <span>Votre Panier</span>
                {count > 0 && (
                  <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                    {count} {count > 1 ? "articles" : "article"}
                  </span>
                )}
              </SheetTitle>
            </div>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 text-slate-400 grid place-items-center">
                <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
              </div>
              <p className="text-base font-bold text-slate-800">Votre panier est vide</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Parcourez le catalogue et ajoutez vos articles favoris pour passer commande.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] transition-colors cursor-pointer"
                >
                  Découvrir les produits
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {/* LISTE DES ARTICLES DANS LE PANIER */}
              <div className="space-y-3">
                {items.map((i) => (
                  <div
                    key={i.key}
                    className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 bg-white shadow-xs"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
                      {i.image ? (
                        <img src={mediaUrl(i.image)!} alt={i.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-slate-300">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{i.name}</p>
                      {i.variant && (
                        <p className="text-xs text-slate-500 line-clamp-1">{i.variant}</p>
                      )}
                      <p className="text-xs sm:text-sm font-extrabold text-[#4F46E5] mt-0.5">
                        {formatPrice(i.price * i.qty, i.currency)}
                      </p>
                    </div>

                    {/* SÉLECTEUR DE QUANTITÉ ROND HARMONIEUX */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-full border border-slate-200/80">
                      <button
                        type="button"
                        aria-label="Diminuer"
                        onClick={() => {
                          if (i.qty > 1) {
                            setQty(i.key, i.qty - 1);
                          } else {
                            setQty(i.key, 0);
                          }
                        }}
                        className="h-7 w-7 rounded-full bg-white hover:bg-slate-200 text-slate-700 grid place-items-center transition-colors cursor-pointer shadow-2xs"
                      >
                        {i.qty === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-800">{i.qty}</span>
                      <button
                        type="button"
                        aria-label="Augmenter"
                        onClick={() => setQty(i.key, i.qty + 1)}
                        className="h-7 w-7 rounded-full bg-white hover:bg-slate-200 text-slate-700 grid place-items-center transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* RÉCAPITULATIF TOTAL */}
              <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Sous-total articles</span>
                  <span className="font-semibold text-slate-800">{totalStr}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Livraison</span>
                  <span className="font-semibold text-emerald-600">Convenue sur WhatsApp</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/80">
                  <span className="text-sm font-extrabold text-slate-900">Total estimé</span>
                  <span className="text-lg font-black text-[#4F46E5]">{totalStr}</span>
                </div>
              </div>

              {/* COORDONNÉES DE LIVRAISON AVEC INPUTS ÉPURÉS ET DESIGN SYSTEM */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#4F46E5]" />
                  <span>Informations de livraison</span>
                </div>

                <div className="space-y-2.5">
                  <Input
                    className="h-12 rounded-2xl bg-slate-50 border-slate-200 text-xs sm:text-sm px-4 focus:bg-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 transition-all"
                    placeholder="Votre nom complet (ex: Christian Mwamba)"
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                  <Input
                    className="h-12 rounded-2xl bg-slate-50 border-slate-200 text-xs sm:text-sm px-4 focus:bg-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 transition-all"
                    placeholder="Adresse / Quartier de livraison (ex: Gombe, Av. du Commerce...)"
                    value={address}
                    maxLength={200}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                  <Input
                    className="h-12 rounded-2xl bg-slate-50 border-slate-200 text-xs sm:text-sm px-4 focus:bg-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 transition-all"
                    placeholder="Instructions supplémentaires (facultatif)"
                    value={notes}
                    maxLength={500}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* BOUTON OFFICIEL WHATSAPP MARKETNET */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={order}
                  disabled={busy}
                  className="w-full h-13 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  <MessageCircle className="h-5 w-5 shrink-0 fill-current" />
                  <span>Commander sur WhatsApp</span>
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  Votre commande sera pré-remplie et envoyée directement au vendeur sur WhatsApp.
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
