import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import {
  adminListTickets,
  adminListBroadcasts,
  adminCreateBroadcast,
  adminSendTestBroadcast,
  adminListCandidateMerchants,
  type SupportTicketCategorie,
  type SupportTicketStatut,
  type SupportBroadcast,
  type CandidateMerchant,
} from "@/lib/support.functions";
import {
  LifeBuoy,
  Search,
  ChevronRight,
  MessageCircle,
  Clock,
  Filter,
  Loader2,
  Inbox,
  AlertCircle,
  Megaphone,
  Plus,
  Send,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/support")({
  head: () => ({
    meta: [
      { title: "Support & Diffusions — Administration MarketNet" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSupportPage,
});

const STATUTS: { value: string; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "ouvert", label: "Ouvert" },
  { value: "en_cours", label: "En cours" },
  { value: "résolu", label: "Résolu" },
  { value: "fermé", label: "Fermé" },
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "tous", label: "Toutes catégories" },
  { value: "paiement_abonnement", label: "Paiement & abonnement" },
  { value: "boutique_produits", label: "Boutique & produits" },
  { value: "commandes", label: "Commandes" },
  { value: "autre", label: "Autre" },
];

const STATUT_COLOR: Record<string, string> = {
  ouvert: "bg-orange-100 text-orange-700 border-orange-200",
  en_cours: "bg-blue-100 text-blue-700 border-blue-200",
  résolu: "bg-green-100 text-green-700 border-green-200",
  fermé: "bg-slate-100 text-slate-600 border-slate-200",
};

function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<"tickets" | "diffusions">("tickets");

  // ─── ÉTAT TICKETS ──────────────────────────────────────────────────────────
  const [statut, setStatut] = useState<string>("tous");
  const [categorie, setCategorie] = useState<string>("tous");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const listTicketsFn = useServerFn(adminListTickets);

  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["adminTickets", statut, categorie, search, page],
    queryFn: () =>
      listTicketsFn({
        data: {
          statut: statut as any,
          categorie: categorie as any,
          search: search || undefined,
          page,
        },
      }),
    refetchInterval: 30000,
  });

  // Ne compte QUE les tickets ayant au moins 1 message commerçant non lu
  const ticketsWithUnread = useMemo(
    () => (ticketsData?.tickets ?? []).filter((t: any) => (t.unread_count ?? 0) > 0),
    [ticketsData?.tickets]
  );

  // ─── ÉTAT DIFFUSIONS ───────────────────────────────────────────────────────
  const listBroadcastsFn = useServerFn(adminListBroadcasts);
  const listCandidatesFn = useServerFn(adminListCandidateMerchants);
  const createBroadcastFn = useServerFn(adminCreateBroadcast);
  const sendTestBroadcastFn = useServerFn(adminSendTestBroadcast);

  const { data: broadcasts, isLoading: broadcastsLoading, refetch: refetchBroadcasts } = useQuery({
    queryKey: ["adminBroadcasts"],
    queryFn: () => listBroadcastsFn(),
    enabled: activeTab === "diffusions",
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ["broadcastCandidates"],
    queryFn: () => listCandidatesFn(),
    enabled: activeTab === "diffusions",
  });

  // Modal création diffusion
  const [createOpen, setCreateOpen] = useState(false);
  const [bTitre, setBTitre] = useState("");
  const [bMessage, setBMessage] = useState("");
  const [bCible, setBCible] = useState<"tous" | "selection">("tous");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<string[]>([]);
  const [testSending, setTestSending] = useState(false);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [selectedBroadcastDetail, setSelectedBroadcastDetail] = useState<SupportBroadcast | null>(null);

  // Candidats filtrés
  const filteredCandidates = useMemo(() => {
    return (candidates ?? []).filter((c) => {
      const matchPlan = planFilter === "all" || c.plan_id === planFilter;
      const q = candidateSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.shop_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.full_name && c.full_name.toLowerCase().includes(q));
      return matchPlan && matchSearch;
    });
  }, [candidates, planFilter, candidateSearch]);

  const toggleSelectCandidate = (id: string) => {
    setSelectedMerchantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredCandidates.map((c) => c.id);
    setSelectedMerchantIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const deselectAllFiltered = () => {
    const ids = new Set(filteredCandidates.map((c) => c.id));
    setSelectedMerchantIds((prev) => prev.filter((id) => !ids.has(id)));
  };

  const targetCount =
    bCible === "tous" ? (candidates ?? []).length : selectedMerchantIds.length;

  async function handleSendTest() {
    if (!bTitre.trim() || !bMessage.trim()) {
      toast.error("Veuillez saisir au préalable un titre et un message.");
      return;
    }
    setTestSending(true);
    try {
      const res = await sendTestBroadcastFn({
        data: { titre: bTitre.trim(), message: bMessage.trim() },
      });
      toast.success(`E-mail test envoyé avec succès à ${res.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi test");
    } finally {
      setTestSending(false);
    }
  }

  async function handleCreateBroadcast() {
    if (bTitre.trim().length < 3) {
      toast.error("Le titre doit contenir au moins 3 caractères.");
      return;
    }
    if (bMessage.trim().length < 5) {
      toast.error("Le message doit contenir au moins 5 caractères.");
      return;
    }
    if (bCible === "selection" && selectedMerchantIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un commerçant.");
      return;
    }

    setBroadcastSending(true);
    try {
      const res = await createBroadcastFn({
        data: {
          titre: bTitre.trim(),
          message: bMessage.trim(),
          cible: bCible,
          target_merchant_ids: bCible === "selection" ? selectedMerchantIds : undefined,
        },
      });

      toast.success(
        `Diffusion envoyée à ${res.destinataires_count} commerçant(s) (${res.envoyes_count} e-mails transmis).`
      );
      setCreateOpen(false);
      setBTitre("");
      setBMessage("");
      setSelectedMerchantIds([]);
      setBCible("tous");
      refetchBroadcasts();
      qc.invalidateQueries({ queryKey: ["adminBroadcasts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la diffusion");
    } finally {
      setBroadcastSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" />
            Support & Communication
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion des tickets commerçants et diffusions d'annonces officielles.
          </p>
        </div>

        {/* Contrôle des onglets */}
        <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl border">
          <button
            onClick={() => setActiveTab("tickets")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "tickets"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LifeBuoy className="h-4 w-4" />
            <span>Tickets</span>
            {ticketsWithUnread.length > 0 && (
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {ticketsWithUnread.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("diffusions")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "diffusions"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Megaphone className="h-4 w-4" />
            <span>Diffusions (Annonces)</span>
          </button>
        </div>
      </div>

      {/* ─── ONGLET 1 : TICKETS DE SUPPORT ──────────────────────────────── */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          {/* Bannière alerte messages non lus */}
          {ticketsWithUnread.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-800">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span>
                {ticketsWithUnread.length} ticket{ticketsWithUnread.length > 1 ? "s ont" : " a"} de nouveaux messages commerçant en attente de lecture.
              </span>
            </div>
          )}

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-tickets"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par numéro ou titre…"
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statut}
                onValueChange={(v) => {
                  setStatut(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] h-10 rounded-xl">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={categorie}
                onValueChange={(v) => {
                  setCategorie(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-10 rounded-xl">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des tickets */}
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /> Chargement…
            </div>
          ) : ticketsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              <AlertCircle className="mx-auto mb-2 h-6 w-6" /> Erreur lors du chargement des tickets.
            </div>
          ) : !ticketsData?.tickets.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 gap-4 text-muted-foreground">
              <Inbox className="h-12 w-12 opacity-30" />
              <div className="text-center">
                <p className="font-semibold text-foreground">Aucun ticket</p>
                <p className="text-sm mt-1">Aucun résultat pour ces filtres.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="divide-y">
                {ticketsData.tickets.map((ticket: any) => {
                  const hasUnread = (ticket.unread_count ?? 0) > 0;
                  const shop = ticket.shops as any;
                  return (
                    <Link
                      key={ticket.id}
                      to="/admin/support/$ticketId"
                      params={{ ticketId: ticket.id }}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors",
                        hasUnread && "bg-blue-50/40 dark:bg-blue-950/20"
                      )}
                    >
                      {/* Pastille non lu */}
                      <div className="shrink-0">
                        {hasUnread ? (
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                            <MessageCircle className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <LifeBuoy className="h-4 w-4" />
                          </span>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-primary">{ticket.numero}</span>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              STATUT_COLOR[ticket.statut]
                            )}
                          >
                            {ticket.statut}
                          </span>
                          {hasUnread && (
                            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              {ticket.unread_count} nouveau{(ticket.unread_count ?? 0) > 1 ? "x" : ""}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm truncate mt-0.5">{ticket.titre}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {shop?.name ?? "—"} · {ticket.contact_email || "—"}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.cree_le).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {(ticketsData?.total ?? 0) > 30 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 30 >= (ticketsData?.total ?? 0)}
                className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── ONGLET 2 : DIFFUSIONS & ANNONCES ───────────────────────────── */}
      {activeTab === "diffusions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold">Diffusions d'annonces officielles</h2>
              <p className="text-xs text-muted-foreground">
                Envoyez des annonces in-app et par e-mail à l'ensemble ou à une sélection de commerçants.
              </p>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl font-bold text-xs gap-2 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Nouvelle diffusion
            </Button>
          </div>

          {/* Liste de l'historique des diffusions */}
          {broadcastsLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /> Chargement des diffusions…
            </div>
          ) : !broadcasts?.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 gap-4 text-muted-foreground">
              <Megaphone className="h-12 w-12 opacity-30" />
              <div className="text-center">
                <p className="font-semibold text-foreground">Aucune diffusion envoyée</p>
                <p className="text-sm mt-1">
                  Créez votre première annonce pour informer vos commerçants par e-mail et in-app.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(true)}
                className="rounded-xl gap-2 text-xs"
              >
                <Plus className="h-4 w-4" /> Créer une diffusion
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="divide-y divide-border/60">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBroadcastDetail(b)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Megaphone className="h-3.5 w-3.5" />
                          {b.cible === "tous" ? "Tous les commerçants" : "Sélection ciblée"}
                        </span>
                        <span className="text-muted-foreground text-xs">&bull;</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(b.cree_le).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {b.titre}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                        {b.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-semibold flex items-center gap-1"
                          title="Nombre total de destinataires"
                        >
                          <Users className="h-3.5 w-3.5" /> {b.destinataires_count}
                        </span>

                        <span
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 border border-emerald-500/20"
                          title="E-mails envoyés avec succès"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {b.envoyes_count}
                        </span>

                        {b.echoues_count > 0 && (
                          <span
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1 border border-rose-500/20"
                            title="Échecs / Quota SMTP dépassé"
                          >
                            <XCircle className="h-3.5 w-3.5 text-rose-500" /> {b.echoues_count}
                          </span>
                        )}

                        <span
                          className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1 border border-blue-500/20"
                          title="Lectures in-app par les commerçants"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" /> {b.lus_count} lu{b.lus_count > 1 ? "s" : ""}
                        </span>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODALE NOUVELLE DIFFUSION ────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Nouvelle diffusion officielle
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cette annonce apparaîtra dans l'espace Support des commerçants et leur sera envoyée par e-mail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Titre */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Titre de l'annonce</Label>
              <Input
                placeholder="Ex. Nouveautés sur MarketNet, maintenance programmée…"
                value={bTitre}
                maxLength={200}
                onChange={(e) => setBTitre(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Message multiligne */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <Label className="font-bold">Message</Label>
                <span className="text-muted-foreground">{bMessage.length} / 10000 caractères</span>
              </div>
              <Textarea
                placeholder="Rédigez votre message ici. Les sauts de ligne seront fidèlement respectés…"
                rows={6}
                value={bMessage}
                maxLength={10000}
                onChange={(e) => setBMessage(e.target.value)}
                className="rounded-xl leading-relaxed font-sans"
              />
            </div>

            {/* Ciblage */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs font-bold">Audience ciblée</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBCible("tous")}
                  className={cn(
                    "flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all",
                    bCible === "tous"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Users className="h-5 w-5 mb-1 text-primary" />
                  <span className="font-bold text-xs">Tous les commerçants</span>
                  <span className="text-[11px] opacity-75">
                    {candidates?.length ?? 0} compte(s) actif(s)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBCible("selection")}
                  className={cn(
                    "flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all",
                    bCible === "selection"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <CheckSquare className="h-5 w-5 mb-1 text-primary" />
                  <span className="font-bold text-xs">Sélection ciblée</span>
                  <span className="text-[11px] opacity-75">
                    {selectedMerchantIds.length} sélectionné(s)
                  </span>
                </button>
              </div>

              {/* Panneau de sélection détaillée si 'selection' */}
              {bCible === "selection" && (
                <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                    <Input
                      placeholder="Rechercher boutique, nom ou e-mail…"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="h-9 rounded-xl text-xs bg-background flex-1"
                    />

                    <select
                      className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium"
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                    >
                      <option value="all">Tous les plans</option>
                      <option value="free">Gratuit</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {selectedMerchantIds.length} sélectionné(s) sur {filteredCandidates.length} affiché(s)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="text-primary hover:underline font-semibold"
                      >
                        Tout cocher
                      </button>
                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={deselectAllFiltered}
                        className="text-muted-foreground hover:underline"
                      >
                        Tout décocher
                      </button>
                    </div>
                  </div>

                  {/* Liste défilante de sélection */}
                  <div className="max-h-52 overflow-y-auto divide-y rounded-xl border bg-background text-xs">
                    {filteredCandidates.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">Aucun commerçant correspondant.</p>
                    ) : (
                      filteredCandidates.map((c) => {
                        const isSelected = selectedMerchantIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleSelectCandidate(c.id)}
                            className="flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                              )}
                              <div className="truncate">
                                <p className="font-semibold text-foreground truncate">{c.shop_name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                              </div>
                            </div>
                            <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {c.plan_id}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Aperçu de l'annonce */}
            <div className="rounded-2xl border bg-muted/20 p-4 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Aperçu in-app pour le commerçant
              </span>
              <div className="rounded-xl border bg-card p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary/10 text-primary p-1.5 font-bold">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <p className="font-bold text-sm text-foreground">
                    {bTitre.trim() || "Titre de l'annonce"}
                  </p>
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    Nouveau
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {bMessage.trim() || "Le texte de votre diffusion s'affichera ici avec ses retours à la ligne respectés…"}
                </p>
                <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Message de MarketNet : pour nous écrire, créez un ticket.</span>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg pointer-events-none">
                    Créer un ticket
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={testSending || broadcastSending}
              onClick={handleSendTest}
              className="rounded-xl text-xs gap-2"
            >
              {testSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              M'envoyer un test
            </Button>

            <Button
              type="button"
              disabled={broadcastSending || targetCount === 0 || !bTitre.trim() || !bMessage.trim()}
              onClick={handleCreateBroadcast}
              className="rounded-xl text-xs font-bold gap-2"
            >
              {broadcastSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Diffusion en cours…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Diffuser à {targetCount} commerçant(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODALE DÉTAIL D'UNE DIFFUSION PASSÉE ────────────────────────── */}
      <Dialog
        open={!!selectedBroadcastDetail}
        onOpenChange={(o) => !o && setSelectedBroadcastDetail(null)}
      >
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 space-y-4">
          {selectedBroadcastDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {selectedBroadcastDetail.titre}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Diffusée le{" "}
                  {new Date(selectedBroadcastDetail.cree_le).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              {/* Statistiques en tuiles */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Cible</p>
                  <p className="text-base font-black mt-1">
                    {selectedBroadcastDetail.destinataires_count}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  <p className="text-[10px] uppercase font-bold">Envoyés</p>
                  <p className="text-base font-black mt-1">
                    {selectedBroadcastDetail.envoyes_count}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                  <p className="text-[10px] uppercase font-bold">Échoués</p>
                  <p className="text-base font-black mt-1">
                    {selectedBroadcastDetail.echoues_count}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300">
                  <p className="text-[10px] uppercase font-bold">Lus</p>
                  <p className="text-base font-black mt-1">
                    {selectedBroadcastDetail.lus_count}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="rounded-2xl border bg-muted/20 p-4 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Contenu du message</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pt-1">
                  {selectedBroadcastDetail.message}
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBroadcastDetail(null)}
                  className="rounded-xl text-xs w-full"
                >
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
