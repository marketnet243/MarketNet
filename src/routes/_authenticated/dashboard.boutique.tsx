import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/imported-database";
import { useMyShop, useShopProducts, useShopPromotions } from "@/hooks/useMyShop";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdentityFields, ContactFields, AppearanceFields, type ShopDraft } from "@/components/dashboard/ShopFields";
import { ShopPreview } from "@/components/dashboard/ShopPreview";
import { draftFromShop, draftToRow, validateDraft, friendlyDbError } from "@/lib/shopDraft";
import { Palette, Info, Phone, Eye, Check, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/boutique")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Ma boutique — MarketNet" },
      { name: "description", content: "Personnalisez votre boutique." },
      { property: "og:title", content: "Ma boutique — MarketNet" },
      { property: "og:description", content: "Personnalisation de la boutique." },
    ],
  }),
  component: ShopSettings,
});

function ShopSettings() {
  const { data: shop } = useMyShop();
  const { data: products } = useShopProducts(shop?.id);
  const { data: promotions } = useShopPromotions(shop?.id);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ShopDraft | null>(null);
  const [isPublished, setIsPublished] = useState(shop?.is_published ?? true);
  const [busy, setBusy] = useState(false);
  const [confirmSlugChange, setConfirmSlugChange] = useState(false);

  useEffect(() => {
    if (shop) {
      setDraft(draftFromShop(shop));
      setIsPublished(shop.is_published);
    }
  }, [shop]);

  if (!shop || !draft) return null;
  const set = (p: Partial<ShopDraft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  async function performSave() {
    setConfirmSlugChange(false);
    setBusy(true);
    const { error } = await supabase.from("shops").update(draftToRow(draft!)).eq("id", shop!.id);
    setBusy(false);
    if (error) return toast.error(friendlyDbError(error.message));
    qc.invalidateQueries({ queryKey: ["myShop"] });
    toast.success("Modifications enregistrées");
  }

  async function save() {
    const err = validateDraft(draft!);
    if (err) return toast.error(err);
    if (draft!.slug !== shop!.slug) {
      setConfirmSlugChange(true);
      return;
    }
    await performSave();
  }

  async function togglePublished(v: boolean) {
    setIsPublished(v);
    const { error } = await supabase.from("shops").update({ is_published: v }).eq("id", shop!.id);
    if (error) {
      setIsPublished(!v);
      toast.error("Impossible de modifier la visibilité");
      return;
    }
    qc.invalidateQueries({ queryKey: ["myShop"] });
    toast.success(v ? "Boutique en ligne activée" : "Boutique mise hors ligne");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_390px] pb-12 min-w-0 max-w-full">
      <div className="space-y-5 min-w-0 max-w-full">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Ma boutique</h1>
          <p className="text-xs text-slate-400 mt-0.5">Personnalisez votre vitrine, identité visuelle et coordonnées.</p>
        </div>

        {/* Visibilité de la boutique */}
        <div className="flex items-center justify-between rounded-3xl bg-white border border-slate-200/70 p-4 sm:p-5 shadow-xs min-w-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Eye className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-900">Boutique en ligne</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPublished ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]" : "bg-slate-100 text-slate-500"}`}>
                  {isPublished ? "Visible" : "Privée"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {shop.is_suspended
                  ? "Suspendue par l'administration"
                  : isPublished
                  ? "Accessible aux clients via votre lien public"
                  : "Vitrine masquée temporairement"}
              </p>
            </div>
          </div>
          <Switch checked={isPublished} onCheckedChange={togglePublished} disabled={shop.is_suspended} className="shrink-0 ml-2" />
        </div>

        {/* Onglets d'édition */}
        <Tabs defaultValue="info" className="w-full min-w-0">
          <TabsList className="grid h-12 w-full grid-cols-3 rounded-2xl bg-white border border-slate-200/70 p-1 shadow-xs">
            <TabsTrigger
              value="info"
              className="flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white transition-all cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Infos</span>
            </TabsTrigger>
            <TabsTrigger
              value="look"
              className="flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white transition-all cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Apparence</span>
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white transition-all cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Contact</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
            <IdentityFields draft={draft} set={set} slugLocked={shop.slug_changed} currentSlug={shop.slug} />
          </TabsContent>

          <TabsContent value="look" className="mt-4 rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
            <AppearanceFields draft={draft} set={set} />
          </TabsContent>

          <TabsContent value="contact" className="mt-4 rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-xs min-w-0 overflow-hidden">
            <ContactFields draft={draft} set={set} />
          </TabsContent>
        </Tabs>

        {/* Bouton Enregistrer */}
        <div className="sticky bottom-20 z-10 -mx-4 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            onClick={save}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>

        {/* Aperçu mobile */}
        <div className="mt-8 pt-6 border-t border-slate-200 lg:hidden">
          <ShopPreview draft={draft} products={products} promotions={promotions} isPublished={isPublished} isSuspended={shop.is_suspended} />
        </div>
      </div>

      {/* Aperçu latéral sur grand écran */}
      <div className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
        <ShopPreview draft={draft} products={products} promotions={promotions} isPublished={isPublished} isSuspended={shop.is_suspended} />
      </div>

      <AlertDialog open={confirmSlugChange} onOpenChange={setConfirmSlugChange}>
        <AlertDialogContent className="rounded-3xl max-w-md border-0 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">Modifier le lien de votre boutique ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Le lien personnalisé ne pourra plus être modifié ensuite. Vos clients devront utiliser cette nouvelle adresse pour accéder à votre boutique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full border-slate-200 font-semibold">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={performSave}
              className="rounded-full bg-[#4F46E5] text-white hover:bg-[#4338CA] font-bold"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
