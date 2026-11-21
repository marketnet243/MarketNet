import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Copy, Check, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

interface ShopQrDialogProps {
  shopName: string;
  shopSlug: string;
  shopUrl: string;
  logoUrl?: string | null;
  trigger?: React.ReactNode;
}

export function ShopQrDialog({
  shopName,
  shopSlug,
  shopUrl,
  logoUrl,
  trigger,
}: ShopQrDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cleanHost =
    typeof window !== "undefined"
      ? window.location.host.includes("localhost")
        ? "marketnet.cd"
        : window.location.host
      : "marketnet.cd";
  const displayPath = `${cleanHost}/b/${shopSlug}`;

  // Encode URL for QR image service (high-res 500x500)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&data=${encodeURIComponent(
    shopUrl
  )}`;

  const handleCopy = async () => {
    const success = await copyToClipboard(shopUrl);
    if (success) {
      setCopied(true);
      toast.success("Lien de la boutique copié !");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Impossible de copier automatiquement.");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shopName,
          text: `Découvrez la boutique ${shopName} sur MarketNet :`,
          url: shopUrl,
        });
      } catch (err) {
        // User cancelled or share not supported
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create an offscreen canvas to generate a beautiful branded printable flyer / QR standee
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context non disponible");

      const width = 800;
      const height = 1050;
      canvas.width = width;
      canvas.height = height;

      // 1. Fond blanc doux avec dégradé subtil
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#ffffff");
      bgGrad.addColorStop(1, "#f8fafc");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Bordure décorative
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // 2. En-tête : Badge MarketNet
      ctx.fillStyle = "#4f46e5";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MARKETNET", width / 2, 95);

      // 3. Nom de la boutique
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      ctx.fillText(shopName, width / 2, 160);

      // 4. URL de la vitrine
      ctx.fillStyle = "#64748b";
      ctx.font = "600 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(displayPath, width / 2, 205);

      // 5. Charger et dessiner le QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("Impossible de charger le QR"));
        qrImg.src = qrImageUrl;
      });

      // Cadre blanc pour le QR
      const qrSize = 480;
      const qrX = (width - qrSize) / 2;
      const qrY = 250;

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.roundRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50, 30);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 6. Pied de page
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
      ctx.fillText("Scannez pour commander sur WhatsApp", width / 2, 810);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 22px system-ui, -apple-system, sans-serif";
      ctx.fillText("Catalogue complet · Prix en direct · Commande facile", width / 2, 855);

      // Badge WhatsApp
      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
      ctx.fillText("✔ Prêt pour impression sur vos comptoirs & flyers", width / 2, 950);

      // Téléchargement du fichier
      const link = document.createElement("a");
      link.download = `qrcode-${shopSlug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Code QR haute définition téléchargé !");
    } catch (err) {
      // Fallback simple : ouvrir le QR direct
      window.open(qrImageUrl, "_blank");
      toast.info("Image du QR Code ouverte dans un nouvel onglet.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-semibold gap-1.5 h-9 bg-white hover:bg-slate-50 border-slate-200"
          >
            <QrCode className="h-4 w-4 text-primary" />
            <span>Code QR</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[94vw] max-w-sm sm:max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl p-4 sm:p-6 my-auto">
        <DialogHeader className="text-left space-y-1 pr-6 pt-1">
          <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary shrink-0" />
            <span>Code QR de votre boutique</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Affichez ou imprimez ce code pour que vos clients scannent et accèdent à votre vitrine.
          </DialogDescription>
        </DialogHeader>

        {/* Visuel Standee / Flyer */}
        <div className="my-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 text-center shadow-xs">
          {/* Logo / Nom */}
          <div className="flex flex-col items-center gap-1 mb-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={shopName}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary text-white font-black text-base sm:text-lg flex items-center justify-center shadow-2xs">
                {shopName.charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate max-w-full px-2">{shopName}</h3>
            <p className="text-[11px] font-semibold text-slate-400 truncate max-w-full px-2">{displayPath}</p>
          </div>

          {/* Image QR Code */}
          <div className="relative mx-auto inline-block p-2 sm:p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <img
              src={qrImageUrl}
              alt={`QR Code ${shopName}`}
              className="h-36 w-36 sm:h-48 sm:w-48 rounded-xl object-contain mx-auto"
              loading="lazy"
            />
          </div>

          <p className="mt-2.5 text-[11px] sm:text-xs font-semibold text-slate-600">
            Scannez avec l'appareil photo du smartphone
          </p>
        </div>

        {/* Boutons d'actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="rounded-xl h-10 text-xs font-bold gap-2 shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? "Téléchargement..." : "Télécharger (PNG)"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleCopy}
            className="rounded-xl h-10 text-xs font-semibold gap-2 border-slate-200 hover:bg-slate-50"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
            <span>{copied ? "Lien copié !" : "Copier le lien"}</span>
          </Button>
        </div>

        <div className="pt-0.5 text-center">
          <a
            href={shopUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>Tester l'ouverture de la boutique</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
