import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Page, { btnPrimary } from "@/components/Page";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="text-center py-16">
        <h1 className="text-6xl font-bold text-cyan-400">404</h1>
        <p className="text-gray-400 mt-4">{t("common.pageNotFound")}</p>
        <Link to="/" className={`${btnPrimary} mt-6`}>{t("common.backHome")}</Link>
      </div>
    </Page>
  );
}
