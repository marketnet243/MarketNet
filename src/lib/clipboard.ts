/**
 * Copie un texte dans le presse-papier de façon universelle et robuste,
 * fonctionnant sur tous les navigateurs de bureau, mobiles (iOS Safari, Android Chrome),
 * ainsi que dans les contextes HTTP ou WebViews où `navigator.clipboard` peut être bloqué.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Méthode moderne : API Clipboard (si disponible et autorisée)
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Échec de l'API moderne (ex: context HTTP, permissions refusées) -> Passage au fallback
    }
  }

  // 2. Fallback robuste pour mobile (iOS / Android) et contextes non sécurisés
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Empêcher tout défilement ou visibilité
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);

    // Sélection nécessaire pour iOS Safari & Android Chrome
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 99999);

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    return successful;
  } catch (err) {
    return false;
  }
}
