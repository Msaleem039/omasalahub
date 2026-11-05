"use client";

import { SiteShell } from "../components/SiteShell";
import { useCatalog } from "../context/CatalogContext";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/pricing";

export default function TermsPage() {
  const { t } = useLanguage();
  const { info } = useCatalog();
  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="script-title text-5xl sm:text-7xl">{t("Terms", "Conditions")}</h1>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          <p>
            {t(
              "Menu prices are shown in euro and include tax at the rate configured by the restaurant. Delivery and minimum-order amounts follow the current restaurant settings.",
              "Les prix de la carte sont indiqués en euros et incluent la TVA au taux configuré par le restaurant. La livraison et le minimum de commande suivent les réglages en cours.",
            )}
            {info ? ` ${t("Delivery", "Livraison")} ${formatPrice(info.deliveryFee)}, ${t("free from", "offerte dès")} ${formatPrice(info.freeDeliveryFrom)}.` : ""}
          </p>
          <p>
            {t(
              "Cash is due on delivery or pickup and is not treated as paid when the order is placed. An online payment stays pending until the payment provider confirms it. Opening the confirmation page does not mark an order as paid.",
              "Les espèces sont dues à la livraison ou au retrait et ne sont pas considérées comme payées au moment de la commande. Un paiement en ligne reste en attente tant que le prestataire ne l'a pas confirmé. Ouvrir la page de confirmation ne marque pas une commande comme payée.",
            )}
          </p>
          <p>
            {t(
              "Ordering follows the restaurant schedule and timezone. Immediate orders are refused while the kitchen is closed, unless scheduled ordering is enabled.",
              "Les commandes suivent le planning et le fuseau du restaurant. Une commande immédiate est refusée lorsque la cuisine est fermée, sauf si les commandes programmées sont activées.",
            )}
            {info?.hoursShort ? ` ${info.hoursShort} (${info.timezone}).` : ""}
          </p>
          <p>
            {t(
              "Allergen and ingredient text is shown only when the restaurant has entered it. An empty field is not a claim that a dish is allergen-free.",
              "Les allergènes et les ingrédients ne sont affichés que lorsque le restaurant les a saisis. Un champ vide n'est pas une mention « sans allergène ».",
            )}
          </p>
          <p>
            {t(
              "The restaurant owner still needs to confirm the legal identity, company number, VAT treatment, mediator, and withdrawal rules. These pages do not by themselves make the shop compliant.",
              "Le restaurateur doit encore confirmer l'identité légale, le numéro d'entreprise, le traitement de la TVA, le médiateur et les règles de rétractation. Ces pages ne suffisent pas, à elles seules, à rendre la boutique conforme.",
            )}
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
