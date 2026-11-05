"use client";

import { SiteShell } from "../components/SiteShell";
import { useLanguage } from "../context/LanguageContext";

export default function HygienePage() {
  const { t } = useLanguage();
  return (
    <SiteShell>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="script-title text-5xl sm:text-7xl">{t("Hygiene", "Hygiène")}</h1>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          <p>{t(
            "Rice, sauces, and tandoor bread are prepared in separate stations. Cold drinks and lassi stay in a chilled hold until the order is packed.",
            "Le riz, les sauces et le pain tandoor sont préparés sur des postes séparés. Les boissons fraîches et les lassis restent au froid jusqu’à l’emballage.",
          )}</p>
          <p>{t(
            "Each delivery box is sealed and labeled with the order id. Hands are washed between raw chicken and ready-to-eat naan, salad, and drinks.",
            "Chaque boîte est scellée et étiquetée avec le numéro de commande. Les mains sont lavées entre le poulet cru et le naan, la salade ou les boissons prêts à servir.",
          )}</p>
          <p>{t(
            "Hot dishes leave the pass above serving temperature. If a seal is broken when the bag arrives, call +92 42 111 228 325 and we will replace the dish.",
            "Les plats chauds quittent le passe au-dessus de la température de service. Si un sceau est rompu à l’arrivée, appelez le +92 42 111 228 325 et le plat sera remplacé.",
          )}</p>
        </div>
      </main>
    </SiteShell>
  );
}
