"use client";

import { SiteShell } from "../components/SiteShell";
import { useLanguage } from "../context/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="script-title text-5xl sm:text-7xl">{t("Privacy", "Confidentialité")}</h1>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          <p>{t(
            "Masala Hub keeps your basket, saved dishes, profile, and orders in this browser. We use that information to refill checkout and to show order tracking on this device.",
            "Masala Hub conserve votre panier, vos plats enregistrés, votre profil et vos commandes dans ce navigateur. Ces informations servent à préremplir la commande et à suivre une commande sur cet appareil.",
          )}</p>
          <p>{t(
            "Online payment asks for a card so the order can be marked paid. Only the last four digits are saved with the order. The full card number and CVV are not written to storage.",
            "Le paiement en ligne demande une carte pour que la commande puisse être marquée payée. Seuls les quatre derniers chiffres sont enregistrés avec la commande. Le numéro complet et le cryptogramme ne sont pas stockés.",
          )}</p>
          <p>{t(
            "Cash on delivery stores your name, phone, and address with the order so the courier can find you. Clearing this browser’s site data removes those records.",
            "Le paiement à la livraison enregistre votre nom, votre téléphone et votre adresse avec la commande pour que le livreur vous trouve. Effacer les données du site dans ce navigateur supprime ces enregistrements.",
          )}</p>
          <p>{t("Questions: support@masalahub.com.", "Questions : support@masalahub.com.")}</p>
        </div>
      </main>
    </SiteShell>
  );
}
