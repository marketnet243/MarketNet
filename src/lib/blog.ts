import creerCover from "@/assets/blog/creer-boutique.jpg";
import creer2 from "@/assets/blog/creer-boutique-2.jpg";
import produitsCover from "@/assets/blog/ajouter-produits.jpg";
import produits2 from "@/assets/blog/ajouter-produits-2.jpg";
import commandesCover from "@/assets/blog/commandes-whatsapp.jpg";
import commandes2 from "@/assets/blog/commandes-whatsapp-2.jpg";
import partagerCover from "@/assets/blog/partager-boutique.jpg";
import partager2 from "@/assets/blog/partager-boutique-2.jpg";

export type BlogSection = { title: string; paragraphs: string[]; tips?: string[] };
export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  cover: string;
  coverAlt: string;
  /** Second image, shown after the section at this index. */
  inlineImage: { src: string; alt: string; caption: string; afterSection: number };
  intro: string;
  keyPoints: string[];
  sections: BlogSection[];
  faq: { q: string; a: string }[];
  conclusion: string;
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "creer-sa-boutique-en-10-minutes",
    title: "Créer votre boutique MarketNet en 10 minutes",
    excerpt: "Inscription, nom de boutique, logo et numéro WhatsApp : le guide pas à pas pour mettre votre commerce en ligne dès aujourd’hui.",
    category: "Prise en main",
    readTime: "7 min",
    date: "19 novembre 2026",
    cover: creerCover,
    coverAlt: "Une commerçante configure sa boutique en ligne sur son téléphone",
    inlineImage: { src: creer2, alt: "Aperçu d’une boutique en ligne sur un smartphone", caption: "Votre vitrine s’adapte automatiquement au téléphone de vos clients.", afterSection: 1 },
    intro: "Vous vendez déjà en boutique, au marché ou sur WhatsApp ? MarketNet vous donne votre propre vitrine en ligne, sans compétences techniques et sans commission sur vos ventes. En une dizaine de minutes, vos clients peuvent parcourir vos produits et vous commander directement. Voici comment faire, étape par étape.",
    keyPoints: ["Aucune compétence technique nécessaire", "Votre propre adresse à partager", "Les commandes arrivent sur votre WhatsApp"],
    sections: [
      {
        title: "1. Créez votre compte",
        paragraphs: [
          "Cliquez sur « Créer ma boutique » en haut de la page. Renseignez votre adresse e-mail et choisissez un mot de passe solide, que vous seul connaissez.",
          "Vous recevez ensuite un e-mail de confirmation. Ouvrez-le et cliquez sur le lien pour activer votre compte. Pensez à regarder dans vos courriers indésirables si vous ne le voyez pas.",
        ],
      },
      {
        title: "2. Donnez une identité à votre boutique",
        paragraphs: [
          "Choisissez un nom clair, facile à retenir et à écrire. C’est ce nom que vos clients partageront entre eux. MarketNet crée automatiquement votre adresse personnelle, accessible directement par vos clients avec un lien unique /b/ma-boutique.",
          "Une boutique soignée inspire confiance : c’est souvent ce qui décide un client à commander chez vous plutôt qu’ailleurs.",
        ],
        tips: ["Ajoutez votre logo ou une belle photo de votre magasin.", "Écrivez une courte description : ce que vous vendez et pour qui.", "Indiquez votre ville et votre quartier pour rassurer vos clients."],
      },
      {
        title: "3. Renseignez votre numéro WhatsApp",
        paragraphs: [
          "C’est le cœur de MarketNet : chaque commande arrive directement sur votre WhatsApp, avec la liste des articles et les coordonnées du client.",
          "Vérifiez bien le numéro avec l’indicatif +243. Si possible, utilisez WhatsApp Business : vous pourrez y préparer des réponses rapides et afficher vos horaires.",
        ],
      },
      {
        title: "4. Vérifiez et partagez",
        paragraphs: [
          "Avant de partager votre lien, ouvrez votre boutique comme le ferait un client. Passez une commande test pour voir exactement ce que vous recevrez sur WhatsApp.",
          "Tout est bon ? Envoyez votre lien à vos premiers contacts : votre boutique est officiellement ouverte !",
        ],
      },
    ],
    faq: [
      { q: "Faut-il un ordinateur ?", a: "Non, tout se fait depuis votre téléphone : création, ajout de produits et suivi des commandes." },
      { q: "Puis-je changer le nom plus tard ?", a: "Oui, le nom et la description se modifient à tout moment dans les réglages de votre boutique." },
    ],
    conclusion: "Votre boutique est prête. Il ne reste plus qu’à ajouter vos produits — c’est justement le sujet de notre prochain guide.",
  },
  {
    slug: "ajouter-des-produits-qui-se-vendent",
    title: "Ajouter des produits qui donnent envie d’acheter",
    excerpt: "Photos, prix, descriptions et catégories : nos conseils pour un catalogue clair qui transforme les visiteurs en clients.",
    category: "Catalogue",
    readTime: "8 min",
    date: "19 novembre 2026",
    cover: produitsCover,
    coverAlt: "Un commerçant photographie une paire de baskets avec son téléphone",
    inlineImage: { src: produits2, alt: "Produits artisanaux joliment présentés sur un tissu clair", caption: "Un fond simple et la lumière du jour suffisent pour des photos qui vendent.", afterSection: 0 },
    intro: "Un client décide en quelques secondes. Sur votre boutique, il ne peut ni toucher ni essayer : ce sont vos photos et vos descriptions qui parlent pour vous. Un catalogue bien présenté fait toute la différence entre une simple visite et une commande sur WhatsApp.",
    keyPoints: ["Des photos nettes à la lumière du jour", "Un prix toujours visible", "Des descriptions qui évitent les questions"],
    sections: [
      {
        title: "Des photos nettes et lumineuses",
        paragraphs: [
          "Photographiez vos articles près d’une fenêtre, à la lumière du jour, sur un fond simple (drap blanc, mur clair, table propre). Votre téléphone suffit largement.",
          "Montrez d’abord le produit en entier, puis un détail : la texture, l’étiquette, la taille ou le produit porté.",
        ],
        tips: ["Évitez les photos floues, sombres ou prises au flash.", "Gardez le même fond pour tout votre catalogue.", "Ajoutez plusieurs photos pour vos articles les plus chers."],
      },
      {
        title: "Un prix clair, toujours affiché",
        paragraphs: [
          "Les clients aiment savoir combien ils vont payer avant d’écrire. Un prix caché fait fuir beaucoup d’acheteurs qui n’osent pas demander.",
          "Indiquez vos prix dans la monnaie de votre choix et mettez-les à jour dès qu’ils changent, pour éviter les malentendus.",
        ],
      },
      {
        title: "Une description qui répond aux questions",
        paragraphs: [
          "Taille, couleur, matière, quantité, origine, conditions de livraison : écrivez ce qu’un client vous demanderait sur WhatsApp. Vous gagnerez du temps à chaque commande.",
          "Restez simple et honnête. Quelques phrases claires valent mieux qu’un long texte compliqué.",
        ],
        tips: ["Commencez par le bénéfice principal du produit.", "Précisez les tailles ou contenances disponibles.", "Indiquez si le stock est limité."],
      },
      {
        title: "Rangez par catégories",
        paragraphs: ["Regroupez vos produits (Vêtements, Chaussures, Beauté, Accessoires…) pour que vos clients trouvent vite ce qu’ils cherchent. Un catalogue bien rangé donne envie de découvrir d’autres articles."],
      },
    ],
    faq: [
      { q: "Combien de produits ajouter au début ?", a: "Commencez avec 5 à 10 produits bien présentés, puis complétez petit à petit." },
      { q: "Que faire quand un produit est épuisé ?", a: "Masquez-le ou mettez-le à jour tout de suite pour ne pas décevoir vos clients." },
    ],
    conclusion: "Mieux vaut un petit catalogue soigné qu’un grand catalogue négligé. Chaque photo réussie est un vendeur qui travaille pour vous, jour et nuit.",
  },
  {
    slug: "recevoir-et-gerer-ses-commandes-whatsapp",
    title: "Recevoir et suivre vos commandes sur WhatsApp",
    excerpt: "Comment arrivent les commandes, comment répondre vite et comment garder une trace de chaque vente dans votre tableau de bord.",
    category: "Commandes",
    readTime: "6 min",
    date: "19 novembre 2026",
    cover: commandesCover,
    coverAlt: "Un commerçant reçoit une nouvelle commande sur WhatsApp",
    inlineImage: { src: commandes2, alt: "Un livreur à moto remet un colis à une cliente souriante", caption: "Une livraison rapide et bien suivie fait revenir vos clients.", afterSection: 1 },
    intro: "Avec MarketNet, vos clients remplissent leur panier puis envoient la commande en un clic. Vous la recevez sur WhatsApp, déjà détaillée et prête à être traitée. Voici comment en tirer le meilleur.",
    keyPoints: ["Des commandes complètes, sans ressaisie", "Une réponse rapide qui fait vendre", "Un historique clair dans votre tableau de bord"],
    sections: [
      {
        title: "Ce que contient une commande",
        paragraphs: [
          "Le message reçu indique les produits choisis, les quantités, le montant total ainsi que le nom et le contact du client.",
          "Plus besoin de tout redemander : vous pouvez directement confirmer et organiser la livraison.",
        ],
      },
      {
        title: "Répondez rapidement",
        paragraphs: [
          "Un client qui reçoit une réponse en quelques minutes achète beaucoup plus souvent. Confirmez la disponibilité, le mode de paiement et la livraison.",
          "Si vous êtes occupé, envoyez au moins un court message pour dire que vous avez bien reçu la commande.",
        ],
        tips: ["Préparez des réponses rapides dans WhatsApp Business.", "Confirmez toujours le montant total.", "Donnez un délai de livraison réaliste."],
      },
      {
        title: "Organisez la livraison",
        paragraphs: [
          "Mettez-vous d’accord avec le client sur le lieu, l’heure et le moyen de paiement. Travaillez avec un livreur de confiance et prévenez le client quand le colis part.",
        ],
      },
      {
        title: "Suivez tout depuis votre tableau de bord",
        paragraphs: [
          "Dans l’onglet Commandes, retrouvez l’historique de vos ventes et mettez à jour leur statut. Vous savez toujours ce qui reste à préparer, à livrer ou à encaisser.",
        ],
      },
    ],
    faq: [
      { q: "Le client doit-il créer un compte ?", a: "Non. Il choisit ses produits et envoie sa commande directement sur WhatsApp." },
      { q: "MarketNet prend-il une commission ?", a: "Non, vous gardez 100 % de vos ventes." },
    ],
    conclusion: "Une commande bien suivie, c’est un client satisfait qui revient — et qui vous recommande à son entourage.",
  },
  {
    slug: "partager-sa-boutique-et-attirer-des-clients",
    title: "Partager votre boutique et attirer vos premiers clients",
    excerpt: "Statut WhatsApp, réseaux sociaux, promotions : les gestes simples pour faire connaître votre boutique MarketNet autour de vous.",
    category: "Croissance",
    readTime: "7 min",
    date: "19 novembre 2026",
    cover: partagerCover,
    coverAlt: "Des amis regardent ensemble une boutique sur un téléphone",
    inlineImage: { src: partager2, alt: "Une vendeuse du marché se prend en photo avec ses produits", caption: "Montrez-vous : les clients aiment acheter à quelqu’un qu’ils connaissent.", afterSection: 1 },
    intro: "Votre boutique est en ligne ? Il est temps de la faire connaître. Bonne nouvelle : vos premiers clients sont souvent déjà dans vos contacts. Avec quelques gestes réguliers, votre lien peut circuler très vite.",
    keyPoints: ["Votre statut WhatsApp, votre meilleure vitrine", "Un lien partout sur vos réseaux", "Des promotions qui donnent une raison d’acheter"],
    sections: [
      {
        title: "Utilisez votre statut WhatsApp",
        paragraphs: [
          "Publiez régulièrement vos nouveaux produits avec le lien de votre boutique. Vos contacts voient vos articles et peuvent commander en un clic.",
          "Variez les publications : nouveautés, coulisses, avis de clients satisfaits.",
        ],
      },
      {
        title: "Partagez sur les réseaux et dans les groupes",
        paragraphs: [
          "Ajoutez votre lien dans votre bio Facebook, Instagram ou TikTok. Partagez-le aussi dans les groupes de vente de votre ville, en respectant leurs règles.",
          "Les vidéos courtes où vous présentez vos produits attirent beaucoup d’attention.",
        ],
        tips: ["Publiez à heures régulières.", "Répondez vite aux commentaires.", "Demandez à vos clients de partager votre lien."],
      },
      {
        title: "Créez des promotions",
        paragraphs: ["Depuis l’onglet Promotions, mettez en avant une réduction ou une offre spéciale. Une bonne promo donne une raison de visiter votre boutique aujourd’hui plutôt que demain."],
        tips: ["Fixez une date de fin pour créer l’urgence.", "Mettez en avant vos meilleurs produits.", "Remerciez vos clients fidèles avec des offres exclusives."],
      },
      {
        title: "Parlez-en autour de vous",
        paragraphs: ["Ajoutez votre lien sur vos cartes de visite, vos sacs ou une affiche dans votre magasin. Le bouche-à-oreille reste le meilleur moyen de gagner la confiance de nouveaux clients."],
      },
    ],
    faq: [
      { q: "Combien de fois publier par semaine ?", a: "Trois à cinq publications par semaine suffisent pour rester visible sans lasser." },
      { q: "Faut-il payer de la publicité ?", a: "Pas au début. Commencez par vos contacts et vos réseaux, puis testez la publicité plus tard." },
    ],
    conclusion: "La régularité paie : un peu de partage chaque semaine construit une clientèle solide sur la durée.",
  },
];

export function getArticle(slug: string) {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}
