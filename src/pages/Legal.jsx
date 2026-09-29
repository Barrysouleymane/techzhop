import { useTranslation } from "react-i18next";
import Page from "@/components/Page";
import { LEGAL_LAST_UPDATED } from "../../shared/settings";

/** type = "terms" | "privacy" */
export default function Legal({ type }) {
  const { t, i18n } = useTranslation();
  const sections = t(`legal.${type}`, { returnObjects: true });
  const date = new Date(LEGAL_LAST_UPDATED).toLocaleDateString(i18n.language, { dateStyle: "long" });

  return (
    <Page title={t(type === "terms" ? "legal.termsTitle" : "legal.privacyTitle")} width="max-w-3xl">
      <p className="text-gray-500 -mt-4 mb-8">{t("legal.lastUpdated", { date })}</p>
      <div className="space-y-6">
        {Array.isArray(sections) &&
          sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold mb-2">{s.h}</h2>
              <p className="text-gray-300 leading-7 mb-0">{s.p}</p>
            </section>
          ))}
      </div>
    </Page>
  );
}
