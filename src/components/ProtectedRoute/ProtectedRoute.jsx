import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "@/hooks/useAuth";
import MainLayout from "@/layouts/MainLayout";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { t } = useTranslation();
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <MainLayout>
        <p className="text-center py-20 text-gray-400">{t("common.loading")}</p>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
