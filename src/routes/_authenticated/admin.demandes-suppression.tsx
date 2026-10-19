import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CalendarDays,
  ChevronDown,
  User,
  Store,
  FileText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  adminListDeletionRequests,
  adminProcessDeletion,
  adminRestoreAccount,
  adminUpdateDeletionDate,
} from "@/lib/account-deletion.functions";

export const Route = createFileRoute("/_authenticated/admin/demandes-suppression")({
  head: () => ({
    meta: [
      { title: "Demandes de suppression — Administration MarketNet" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDeletionRequestsPage,
});

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",  color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  processed: { label: "Traitee",     color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  restored:  { label: "Restauree",   color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  cancelled: { label: "Annulee",     color: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30" },
  completed: { label: "Supprimee",   color: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30" },
};

const REASON_LABELS: Record<string, string> = {
  trop_cher:           "Trop cher",
  plus_besoin:         "Plus besoin",
  autre_outil:         "Autre outil",
  probleme_technique:  "Probleme technique",
  autre:               "Autre",
};

const FILTER_TABS = [
  { key: "all",      label: "Toutes" },
  { key: "pending",  label: "En attente" },
  { key: "processed",label: "Traitees" },
  { key: "terminal", label: "Terminees" },
] as const;

function AdminDeletionRequestsPage() {
  const qc = useQueryClient();
  const listFn        = useServerFn(adminListDeletionRequests);
  const processFn     = useServerFn(adminProcessDeletion);
  const restoreFn     = useServerFn(adminRestoreAccount);
  const updateDateFn  = useServerFn(adminUpdateDeletionDate);

  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [processModal, setProcessModal] = useState<{ open: boolean; requestId: string; merchantName: string; shopName: string } | null>(null);
  const [restoreModal, setRestoreModal] = useState<{ open: boolean; requestId: string; merchantName: string } | null>(null);
  const [dateModal, setDateModal] = useState<{ open: boolean; requestId: string; merchantName: string; currentDate: string } | null>(null);

  const [scheduledDate, setScheduledDate] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ["admin-deletion-requests", statusFilter],
    queryFn: () => listFn({ data: { statusFilter } }),
    staleTime: 30_000,
  });

  // Default scheduled date = today + 30 days
  function defaultScheduledDate() {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    // Local datetime string for input[type=datetime-local]
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  }

  // Min date = now + 10 minutes
  function minScheduledDate() {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 11);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  }

  function openProcessModal(req: any) {
    setScheduledDate(defaultScheduledDate());
    setAdminNote("");
    setProcessModal({ open: true, requestId: req.id, merchantName: req.merchantName || req.merchantEmail || "—", shopName: req.shops?.name || "—" });
  }

  function openRestoreModal(req: any) {
    setAdminNote("");
    setRestoreModal({ open: true, requestId: req.id, merchantName: req.merchantName || req.merchantEmail || "—" });
  }

  function openDateModal(req: any) {
    const existing = req.scheduled_deletion_at
      ? new Date(req.scheduled_deletion_at).toISOString().slice(0, 16)
      : defaultScheduledDate();
    setScheduledDate(existing);
    setAdminNote("");
    setDateModal({ open: true, requestId: req.id, merchantName: req.merchantName || req.merchantEmail || "—", currentDate: existing });
  }

  async function handleProcess() {
    if (!processModal) return;
    setProcessing(true);
    try {
      await processFn({
        data: {
          requestId: processModal.requestId,
          scheduledDeletion: new Date(scheduledDate).toISOString(),
          adminNote: adminNote || undefined,
        },
      });
      toast.success("Demande traitee. Le compte est desormais suspendu.");
      setProcessModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors du traitement.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRestore() {
    if (!restoreModal) return;
    setProcessing(true);
    try {
      await restoreFn({ data: { requestId: restoreModal.requestId, adminNote: adminNote || undefined } });
      toast.success("Compte restaure avec succes.");
      setRestoreModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la restauration.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleUpdateDate() {
    if (!dateModal) return;
    setProcessing(true);
    try {
      await updateDateFn({ data: { requestId: dateModal.requestId, newScheduledDate: new Date(scheduledDate).toISOString(), adminNote: adminNote || undefined } });
      toast.success("Date de suppression mise a jour.");
      setDateModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la mise a jour de la date.");
    } finally {
      setProcessing(false);
    }
  }

  function fmtDate(s: string | null | undefined) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const list = requests ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Demandes de suppression de compte</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Gerez les demandes soumises par les commercants. Traitez ou restaurez les comptes.
        </p>
      </div>

      {/* Tabs filtre */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all",
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground text-sm">
          Aucune demande pour ce filtre.
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="space-y-4">
          {list.map((req: any) => (
            <div key={req.id} className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{req.merchantName || "—"}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border", STATUS_LABELS[req.status]?.color)}>
                      {STATUS_LABELS[req.status]?.label || req.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{req.merchantEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Soumis le</p>
                  <p className="text-xs font-semibold">{fmtDate(req.requested_at)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-muted/30 border p-3">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Boutique</p>
                  <p className="text-xs font-medium mt-0.5">{req.shops?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Plan</p>
                  <p className="text-xs font-medium mt-0.5 capitalize">{req.shops?.plan_id || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Motif</p>
                  <p className="text-xs font-medium mt-0.5">{REASON_LABELS[req.reason] || req.reason}{req.reason_other ? ` — ${req.reason_other}` : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Suppression prevue</p>
                  <p className="text-xs font-medium mt-0.5">{fmtDate(req.scheduled_deletion_at)}</p>
                </div>
              </div>

              {req.comment && (
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Commentaire</p>
                  <p className="text-xs text-foreground">{req.comment}</p>
                </div>
              )}

              {req.admin_note && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1">Note admin</p>
                  <p className="text-xs text-foreground">{req.admin_note}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {req.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => openProcessModal(req)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Traiter la demande
                  </Button>
                )}
                {req.status === "processed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRestoreModal(req)}
                      className="rounded-xl text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Restaurer le compte
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDateModal(req)}
                      className="rounded-xl text-xs"
                    >
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      Modifier la date
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal : Traiter la demande */}
      <Dialog open={!!processModal?.open} onOpenChange={(o) => { if (!o && !processing) setProcessModal(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Traiter la demande
            </DialogTitle>
            <DialogDescription className="text-xs">
              Le compte de <strong>{processModal?.merchantName}</strong> (boutique : <strong>{processModal?.shopName}</strong>) sera suspendu immediatement.
              Definissez la date de suppression definitive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="scheduled-date" className="text-xs font-semibold">
                Date et heure de suppression definitive <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledDate}
                min={minScheduledDate()}
                max={(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 16); })()}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={processing}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">Minimum +10 min, maximum +30 jours.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="process-note" className="text-xs font-semibold">Note interne (optionnel)</Label>
              <textarea
                id="process-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                disabled={processing}
                placeholder="Raison de traitement, observations..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProcessModal(null)} disabled={processing} className="rounded-xl">Annuler</Button>
            <Button onClick={handleProcess} disabled={processing || !scheduledDate} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmer le traitement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Restaurer */}
      <Dialog open={!!restoreModal?.open} onOpenChange={(o) => { if (!o && !processing) setRestoreModal(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <RotateCcw className="h-5 w-5" /> Restaurer le compte
            </DialogTitle>
            <DialogDescription className="text-xs">
              Le compte de <strong>{restoreModal?.merchantName}</strong> sera reactive. La boutique redevient visible en ligne.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="restore-note" className="text-xs font-semibold">Note interne (optionnel)</Label>
              <textarea
                id="restore-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                disabled={processing}
                placeholder="Raison de la restauration..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestoreModal(null)} disabled={processing} className="rounded-xl">Annuler</Button>
            <Button onClick={handleRestore} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Modifier la date */}
      <Dialog open={!!dateModal?.open} onOpenChange={(o) => { if (!o && !processing) setDateModal(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Modifier la date de suppression
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modifier la date de suppression definitive pour <strong>{dateModal?.merchantName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="new-date" className="text-xs font-semibold">Nouvelle date <span className="text-red-500">*</span></Label>
              <Input
                id="new-date"
                type="datetime-local"
                value={scheduledDate}
                min={minScheduledDate()}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={processing}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-note" className="text-xs font-semibold">Note interne (optionnel)</Label>
              <textarea
                id="date-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                disabled={processing}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDateModal(null)} disabled={processing} className="rounded-xl">Annuler</Button>
            <Button onClick={handleUpdateDate} disabled={processing || !scheduledDate} className="rounded-xl">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mettre a jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
