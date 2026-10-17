import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LifeBuoy, Plus, ChevronRight, MessageCircle, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, Inbox, Upload, X, Megaphone, ChevronDown,
  ChevronUp, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  listMyTickets,
  createSupportTicket,
  listMyBroadcasts,
  markBroadcastRead,
  type SupportTicketStatut,
  type SupportTicketCategorie,
} from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/dashboard/support")({
  head: () => ({
    meta: [
      { title: "Support — MarketNet" },
      { name: "description", content: "Contactez notre équipe de support." },
    ],
  }),
  component: SupportPage,
});

const STATUT_LABELS: Record<SupportTicketStatut, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  résolu: "Résolu",
  fermé: "Fermé",
};

const STATUT_COLOR: Record<SupportTicketStatut, string> = {
  ouvert: "bg-orange-100 text-orange-700 border-orange-200",
  en_cours: "bg-blue-100 text-blue-700 border-blue-200",
  résolu: "bg-green-100 text-green-700 border-green-200",
  fermé: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUT_ICON: Record<SupportTicketStatut, React.FC<{ className?: string }>> = {
  ouvert: AlertCircle,
  en_cours: Loader2,
  résolu: CheckCircle2,
  fermé: XCircle,
};

const CATEGORIES: { value: SupportTicketCategorie; label: string }[] = [
  { value: "paiement_abonnement", label: "Paiement & abonnement" },
  { value: "boutique_produits", label: "Boutique & produits" },
  { value: "commandes", label: "Commandes" },
  { value: "autre", label: "Autre" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

interface AttachmentPreview {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedPath?: string;
  error?: string;
}

function StatutBadge({ statut }: { statut: SupportTicketStatut }) {
  const Icon = STATUT_ICON[statut];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        STATUT_COLOR[statut]
      )}
    >
      <Icon className="h-3 w-3" />
      {STATUT_LABELS[statut]}
    </span>
  );
}

function SupportPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const listMyTicketsFn = useServerFn(listMyTickets);
  const createTicketFn = useServerFn(createSupportTicket);

  // État du modal de création de ticket
  const [modalOpen, setModalOpen] = useState(() => {
    return typeof window !== "undefined" && window.location.pathname.includes("/nouveau");
  });

  // Formulaire nouveau ticket
  const [form, setForm] = useState({
    titre: "",
    categorie: "autre" as SupportTicketCategorie,
    texte: "",
  });
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ["myTickets"],
    queryFn: () => listMyTicketsFn(),
    refetchInterval: 30000,
  });

  const listMyBroadcastsFn = useServerFn(listMyBroadcasts);
  const markBroadcastReadFn = useServerFn(markBroadcastRead);

  // Charger les annonces / diffusions
  const { data: broadcasts } = useQuery({
    queryKey: ["myBroadcasts"],
    queryFn: () => listMyBroadcastsFn(),
    refetchInterval: 30000,
  });

  const [expandedBroadcasts, setExpandedBroadcasts] = useState<Record<string, boolean>>({});

  const handleToggleBroadcast = async (broadcastId: string, isUnread: boolean) => {
    setExpandedBroadcasts((prev) => ({
      ...prev,
      [broadcastId]: !prev[broadcastId],
    }));

    if (isUnread) {
      try {
        await markBroadcastReadFn({ data: { broadcast_id: broadcastId } });
        qc.invalidateQueries({ queryKey: ["myBroadcasts"] });
        qc.invalidateQueries({ queryKey: ["mySupportUnread"] });
      } catch (e) {
        // non bloquant
      }
    }
  };

  // Synchroniser avec l'URL si on arrive sur /nouveau
  useEffect(() => {
    if (routerState.location.pathname.includes("/nouveau") && !modalOpen) {
      setModalOpen(true);
    }
  }, [routerState.location.pathname]);

  // Mutation création ticket
  const createMutation = useMutation({
    mutationFn: async () => {
      const e: Record<string, string> = {};
      if (!form.titre.trim() || form.titre.trim().length < 3) {
        e.titre = "Titre requis (3 caractères minimum).";
      }
      if (!form.texte.trim()) {
        e.texte = "Message requis.";
      }
      if (Object.keys(e).length > 0) {
        setErrors(e);
        throw new Error("Validation");
      }
      setErrors({});

      const notUploaded = attachments.filter((a) => !a.uploadedPath && !a.error);
      if (notUploaded.length > 0) {
        throw new Error("Attendez la fin du téléversement des captures d'écran.");
      }

      const attachment_paths = attachments
        .filter((a) => !!a.uploadedPath)
        .map((a) => ({
          chemin: a.uploadedPath!,
          mime_type: a.file.type,
          taille: a.file.size,
        }));

      return createTicketFn({
        data: {
          titre: form.titre.trim(),
          categorie: form.categorie,
          texte: form.texte.trim(),
          attachment_paths,
        },
      });
    },
    onSuccess: (result) => {
      toast.success(`Ticket ${result.ticket.numero} créé avec succès.`);
      qc.invalidateQueries({ queryKey: ["myTickets"] });
      setModalOpen(false);
      setForm({
        titre: "",
        categorie: "autre",
        texte: "",
      });
      setAttachments([]);
      navigate({
        to: "/dashboard/support/$ticketId",
        params: { ticketId: result.ticket.id },
      });
    },
    onError: (err: Error) => {
      if (err.message !== "Validation") {
        toast.error(err.message || "Erreur lors de la création du ticket.");
      }
    },
  });

  async function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 3 - attachments.length;
    if (remaining <= 0) {
      toast.error("Maximum 3 captures d'écran par message.");
      return;
    }

    for (const file of files.slice(0, remaining)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Format non supporté pour "${file.name}". Utilisez JPG, PNG ou WebP.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" dépasse la limite de 5 Mo.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const previewItem: AttachmentPreview = { file, previewUrl, uploading: true };
      setAttachments((prev) => [...prev, previewItem]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non authentifié");

        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) throw uploadErr;

        setAttachments((prev) =>
          prev.map((a) => (a.previewUrl === previewUrl ? { ...a, uploading: false, uploadedPath: path } : a))
        );
      } catch (err: any) {
        setAttachments((prev) =>
          prev.map((a) => (a.previewUrl === previewUrl ? { ...a, uploading: false, error: err.message } : a))
        );
        toast.error(`Échec du téléversement de "${file.name}".`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileRemove(previewUrl: string) {
    setAttachments((prev) => {
      const item = prev.find((a) => a.previewUrl === previewUrl);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.previewUrl !== previewUrl);
    });
  }

  const totalUnreadTickets = (tickets ?? []).reduce((acc: number, t: any) => acc + (t.unread_count ?? 0), 0);
  const unreadBroadcastsCount = (broadcasts ?? []).filter((b: any) => !b.lu_le).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6 min-w-0 max-w-full overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" />
            Support
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Posez vos questions, nous vous répondrons au plus vite.
          </p>
        </div>
        <Button
          id="btn-nouveau-ticket"
          onClick={() => setModalOpen(true)}
          className="rounded-xl gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Nouveau ticket
        </Button>
      </div>

      {/* Compteur d'éléments non lus */}
      {(totalUnreadTickets > 0 || unreadBroadcastsCount > 0) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/50 px-4 py-3 flex items-center gap-3 text-sm text-blue-800 dark:text-blue-200">
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span>
            {totalUnreadTickets > 0 && unreadBroadcastsCount > 0
              ? `Vous avez ${totalUnreadTickets} réponse${totalUnreadTickets > 1 ? "s" : ""} et ${unreadBroadcastsCount} annonce${unreadBroadcastsCount > 1 ? "s" : ""} non lue${unreadBroadcastsCount > 1 ? "s" : ""}.`
              : totalUnreadTickets > 0
              ? `Vous avez ${totalUnreadTickets} réponse${totalUnreadTickets > 1 ? "s" : ""} non lue${totalUnreadTickets > 1 ? "s" : ""} sur vos tickets.`
              : `Vous avez ${unreadBroadcastsCount} nouvelle${unreadBroadcastsCount > 1 ? "s" : ""} annonce${unreadBroadcastsCount > 1 ? "s" : ""} officielle${unreadBroadcastsCount > 1 ? "s" : ""}.`}
          </span>
        </div>
      )}

      {/* Annonces officielles / Diffusions */}
      {broadcasts && broadcasts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Megaphone className="h-4 w-4 text-primary" />
            <span>Annonces de MarketNet ({broadcasts.length})</span>
          </div>

          <div className="space-y-2.5">
            {broadcasts.map((b) => {
              const isUnread = !b.lu_le;
              const isExpanded = !!expandedBroadcasts[b.id];
              return (
                <div
                  key={b.id}
                  className={cn(
                    "rounded-2xl border transition-all overflow-hidden bg-card",
                    isUnread
                      ? "border-primary/40 shadow-xs bg-primary/[0.02]"
                      : "border-border hover:border-border/80"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleBroadcast(b.id, isUnread)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                          isUnread
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-foreground">{b.titre}</h3>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              Nouveau
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(b.cree_le).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3 min-w-0">
                      <div className="rounded-xl bg-muted/40 p-3.5 text-xs text-foreground/90 whitespace-pre-wrap break-words leading-relaxed overflow-hidden">
                        {b.message}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-blue-200/60 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40 p-3 text-xs min-w-0">
                        <p className="text-muted-foreground flex items-center gap-1.5 min-w-0">
                          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="break-words">Message de MarketNet : pour nous écrire, créez un ticket.</span>
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalOpen(true)}
                          className="rounded-lg h-7 px-2.5 text-xs font-semibold gap-1 shrink-0 bg-background"
                        >
                          <Plus className="h-3 w-3" /> Créer un ticket
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chargement */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Chargement de vos tickets…</p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <AlertCircle className="mx-auto mb-2 h-6 w-6" />
          Une erreur est survenue lors du chargement de vos tickets.
        </div>
      )}

      {/* Liste des tickets */}
      {!isLoading && !error && (!tickets?.length ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 gap-4 text-muted-foreground">
          <Inbox className="h-12 w-12 opacity-30" />
          <div className="text-center">
            <p className="font-semibold text-foreground">Aucun ticket pour le moment</p>
            <p className="text-sm mt-1">Créez un ticket pour contacter notre équipe.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" /> Créer un ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => {
            const hasUnread = (ticket.unread_count ?? 0) > 0;
            return (
              <Link
                key={ticket.id}
                to="/dashboard/support/$ticketId"
                params={{ ticketId: ticket.id }}
                className="block"
              >
                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/40",
                    hasUnread && "border-blue-300 bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5">
                      {hasUnread ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shrink-0">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
                          <LifeBuoy className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-primary">{ticket.numero}</span>
                        <StatutBadge statut={ticket.statut} />
                        {hasUnread && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {ticket.unread_count} nouveau{ticket.unread_count! > 1 ? "x" : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-semibold text-sm truncate">{ticket.titre}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.cree_le).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                </div>
              </Link>
            );
          })}
        </div>
      ))}

      {/* ─── MODAL : NOUVEAU TICKET DE SUPPORT ─── */}
      {/* ─── MODAL : NOUVEAU TICKET DE SUPPORT ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl">
          <DialogHeader className="pb-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <LifeBuoy className="h-5 w-5 text-primary shrink-0" />
              Nouveau ticket de support
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-left">
              Décrivez votre question ou problème. Notre équipe vous répondra rapidement.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4 pt-1"
          >
            {/* Catégorie */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-categorie" className="text-xs font-semibold">
                Catégorie <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.categorie}
                onValueChange={(val) => setForm((f) => ({ ...f, categorie: val as SupportTicketCategorie }))}
              >
                <SelectTrigger id="ticket-categorie" className="h-10 sm:h-11 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="rounded-lg">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Titre */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-titre" className="text-xs font-semibold">
                Titre ou résumé <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ticket-titre"
                placeholder="Ex. Problème de paiement ou question sur ma boutique"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                maxLength={200}
                className={cn("h-10 sm:h-11 rounded-xl text-sm", errors.titre && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.titre && <p className="text-xs text-red-600">{errors.titre}</p>}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-texte" className="text-xs font-semibold">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="ticket-texte"
                placeholder="Expliquez ce qui se passe, les étapes pour reproduire le problème…"
                rows={4}
                value={form.texte}
                onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))}
                maxLength={10000}
                className={cn("rounded-xl resize-none text-sm p-3 leading-relaxed", errors.texte && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.texte && <p className="text-xs text-red-600">{errors.texte}</p>}
            </div>

            {/* Pièces jointes (captures d'écran) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Captures d'écran ({attachments.length}/3)</span>
                <span className="text-[10px] text-muted-foreground">Max 5 Mo · JPG, PNG, WebP</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileAdd}
              />

              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter une capture d'écran
                </button>
              )}

              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {attachments.map((att) => (
                    <div key={att.previewUrl} className="relative group rounded-xl overflow-hidden border aspect-square bg-muted">
                      <img src={att.previewUrl} alt="Aperçu" className="h-full w-full object-cover" />
                      {att.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}
                      {att.error && (
                        <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center p-1 text-[10px] text-white text-center">
                          Échec
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFileRemove(att.previewUrl)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={createMutation.isPending}
                className="rounded-xl h-10 sm:h-11 px-4 text-xs sm:text-sm font-semibold"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-xl gap-2 font-bold px-5"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Envoi…
                  </>
                ) : (
                  "Créer le ticket"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
