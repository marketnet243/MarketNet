import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/imported-database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { logAction } from "@/hooks/useIsAdmin";
import {
  Settings2,
  Activity,
  CreditCard,
  Save,
  Clock,
  Fingerprint,
  Globe,
  Mail,
  Edit2,
  X,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres administrateur — MarketNet" },
      { name: "description", content: "Consultez et gérez les paramètres administrateur sur MarketNet." },
      { property: "og:title", content: "Paramètres administrateur — MarketNet" },
      { property: "og:description", content: "Consultez et gérez les paramètres administrateur sur MarketNet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () =>
      Object.fromEntries(
        ((await supabase.from("app_settings").select("*")).data ?? []).map((r) => [r.key, r.value])
      ) as Record<string, string>,
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ["audit"],
    queryFn: async () =>
      (
        await supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50)
      ).data ?? [],
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [originalForm, setOriginalForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const initData = {
        platform_name: settings.platform_name ?? "MarketNet",
        contact_email: settings.contact_email ?? "",
        support_email: settings.support_email ?? "",
        payment_instructions: settings.payment_instructions ?? "",
      };
      setForm(initData);
      setOriginalForm(initData);
    }
  }, [settings]);

  async function saveSection(sectionName: string, keys: string[]) {
    setSaving(sectionName);
    try {
      const updates = keys.map((key) => ({ key, value: form[key] }));
      const { error } = await supabase.from("app_settings").upsert(updates);
      if (error) throw error;
      await logAction("settings.update", sectionName);
      toast.success("Paramètres mis à jour avec succès");
      qc.invalidateQueries({ queryKey: ["settings"] });
      setEditingTab(null);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(null);
    }
  }

  function cancelEdit() {
    setForm(originalForm);
    setEditingTab(null);
  }

  function formatActionName(action: string) {
    const actions: Record<string, string> = {
      "settings.update": "Modification des paramètres",
      "shop.suspend": "Suspension de boutique",
      "shop.unsuspend": "Réactivation de boutique",
      "merchant.suspended": "Suspension de compte",
      "merchant.active": "Réactivation de compte",
      "report.resolve": "Signalement traité",
      "plan.create": "Création de plan",
      "plan.update": "Mise à jour de plan",
      "plan.delete": "Suppression de plan",
    };
    return actions[action] || action;
  }

  const renderActionButtons = (tabId: string, keysToSave: string[]) => {
    if (editingTab !== tabId) {
      return (
        <Button
          className="rounded-xl shadow-xs h-10 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold text-xs"
          onClick={() => setEditingTab(tabId)}
        >
          <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Modifier
        </Button>
      );
    }
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="rounded-xl h-10 px-3 text-muted-foreground hover:bg-muted"
          onClick={cancelEdit}
          disabled={saving === tabId}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => saveSection(tabId, keysToSave)}
          disabled={saving === tabId}
          className="rounded-xl shadow-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs"
        >
          {saving === tabId ? (
            "Enregistrement..."
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Enregistrer
            </>
          )}
        </Button>
      </div>
    );
  };

  const inputClass = (tabId: string) =>
    `text-sm h-11 rounded-xl ${
      editingTab !== tabId
        ? "bg-transparent border-transparent px-0 focus-visible:ring-0 shadow-none font-medium"
        : "bg-background"
    }`;

  if (loadingSettings)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Chargement des paramètres...
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-normal">
          Paramètres de la plateforme
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez l'identité, les intégrations de paiement et surveillez les actions de l'administration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-2xl h-11">
              <TabsTrigger
                value="general"
                className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
              >
                Général
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
              >
                Facturation & Passerelle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 outline-none">
              <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
                <div className="border-b bg-muted/10 px-6 py-4 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-foreground">Informations générales</h2>
                    <p className="text-xs text-muted-foreground">Identité globale de la plateforme MarketNet.</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs font-semibold">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Nom de la plateforme
                    </Label>
                    <Input
                      className={inputClass("general")}
                      value={form.platform_name || ""}
                      onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
                      placeholder="MarketNet"
                      readOnly={editingTab !== "general"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs font-semibold">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> E-mail de contact général
                    </Label>
                    <Input
                      type="email"
                      className={inputClass("general")}
                      value={form.contact_email || ""}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      placeholder="ex: marketnet243@gmail.com"
                      readOnly={editingTab !== "general"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs font-semibold">
                      <Mail className="h-3.5 w-3.5 text-warning" /> E-mail de notification Support
                    </Label>
                    <Input
                      type="email"
                      className={inputClass("general")}
                      value={form.support_email || ""}
                      onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                      placeholder="ex: marketnet243@gmail.com (laisser vide pour utiliser le contact)"
                      readOnly={editingTab !== "general"}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Reçoit les notifications d'alerte lors de la création d'un nouveau ticket commerçant.
                    </p>
                  </div>
                  <div className="flex justify-end pt-3 border-t mt-4">
                    {renderActionButtons("general", ["platform_name", "contact_email", "support_email"])}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-4 outline-none space-y-4">
              <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
                <div className="border-b bg-muted/10 px-6 py-4 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-foreground">Passerelle de paiement — SasPay</h2>
                    <p className="text-xs text-muted-foreground">
                      Les abonnements sont collectés en Dollars ($ USD) via SasPay.
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-success/10 border-success/25 p-4 flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-normal text-success">
                        Environnement
                      </span>
                      <span className="text-base font-black text-foreground">Production (Live)</span>
                      <span className="text-[11px] text-muted-foreground">Paiements réels activés</span>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-4 flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-normal text-muted-foreground">
                        Devise
                      </span>
                      <span className="text-base font-black">USD ($)</span>
                      <span className="text-[11px] text-muted-foreground">Tarif officiel en Dollars</span>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-4 flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-normal text-muted-foreground">
                        Webhook
                      </span>
                      <span className="text-base font-black truncate text-xs font-mono">
                        /api/public/webhook-saspay
                      </span>
                      <span className="text-[11px] text-muted-foreground">Activation automatique</span>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-amber-500/10 border-amber-500/25 p-4 text-xs text-amber-800 dark:text-amber-300 flex gap-2.5 items-start">
                    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <span>
                      Pour modifier les clés API SasPay ou l'URL du webhook, mettez à jour les variables
                      d'environnement <code className="font-mono bg-warning/20 px-1 py-0.5 rounded font-bold">SASPAY_SECRET_KEY</code> et{" "}
                      <code className="font-mono bg-warning/20 px-1 py-0.5 rounded font-bold">SASPAY_WEBHOOK_SECRET</code>.
                    </span>
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <a href="https://dashboard.saspay.com" target="_blank" rel="noreferrer">
                      <Button className="rounded-xl h-10 text-xs font-bold gap-2">
                        <CreditCard className="h-4 w-4" /> Tableau de bord SasPay
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne droite : Journal d'activité */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card shadow-xs flex flex-col h-[calc(100vh-14rem)] sticky top-20">
            <div className="border-b bg-muted/10 px-5 py-4 flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-2 text-secondary-foreground">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-foreground">Journal d'activité</h2>
                <p className="text-[11px] text-muted-foreground uppercase tracking-normal font-semibold mt-0.5">
                  50 dernières actions
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingLogs ? (
                <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
                  Chargement du journal...
                </div>
              ) : !logs?.length ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Aucune action enregistrée récemment.
                </div>
              ) : (
                <div className="relative pl-4 space-y-4 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-border">
                  {logs.map((l) => (
                    <div key={l.id} className="relative pl-6">
                      <div className="absolute left-[-2px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                      <div className="text-xs font-bold text-foreground">
                        {formatActionName(l.action)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(l.created_at).toLocaleString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        {l.target && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Fingerprint className="h-3 w-3" /> {l.target.slice(0, 8)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
