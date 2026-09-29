import { useTranslation } from "react-i18next";
import { Mail, MessageCircle } from "lucide-react";
import Page, { card } from "@/components/Page";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/config/constants";

export default function Help() {
  const { t } = useTranslation();
  const faq = t("help.faq", { returnObjects: true });

  const contact = "flex items-center gap-4 p-5 rounded-xl border border-zinc-800 hover:border-cyan-500 transition no-underline text-white";

  return (
    <Page title={t("help.title")} width="max-w-3xl">
      <p className="text-gray-400 -mt-4 mb-8">{t("help.subtitle")}</p>

      <h2 className="text-xl font-bold mb-4">{t("help.contact")}</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-2">
        <a href={`mailto:${SUPPORT_EMAIL}`} className={contact}>
          <Mail className="w-6 h-6 text-cyan-400" />
          <span><strong className="block">{t("help.emailUs")}</strong><span className="text-gray-400 text-sm">{SUPPORT_EMAIL}</span></span>
        </a>
        {SUPPORT_WHATSAPP && (
          <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className={contact}>
            <MessageCircle className="w-6 h-6 text-green-400" />
            <span><strong className="block">{t("help.whatsapp")}</strong><span className="text-gray-400 text-sm">+{SUPPORT_WHATSAPP}</span></span>
          </a>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-10">{t("help.responseTime")}</p>

      <h2 className="text-xl font-bold mb-4">{t("help.faqTitle")}</h2>
      <div className={`${card} divide-y divide-zinc-800`}>
        {Array.isArray(faq) &&
          faq.map((item) => (
            <details key={item.q} className="p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between gap-4">
                {item.q}
                <span className="text-cyan-400 group-open:rotate-45 transition">+</span>
              </summary>
              <p className="text-gray-400 mt-3 mb-0">{item.a}</p>
            </details>
          ))}
      </div>
    </Page>
  );
}
