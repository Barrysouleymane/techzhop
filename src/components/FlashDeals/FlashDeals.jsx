import { useTranslation } from "react-i18next";
import ProductRow from "@/components/Shop/ProductRow";
import { isOnSale, discountPercent } from "../../../shared/settings";

/** Products on sale (biggest discount first); cheapest products if none */
export default function FlashDeals({ products = [], loading }) {
  const { t } = useTranslation();
  if (loading) return null;

  const onSale = products.filter(isOnSale).sort((a, b) => discountPercent(b) - discountPercent(a));
  const list = (onSale.length ? onSale : products.filter((p) => Number(p.stock) > 0).sort((a, b) => a.price - b.price)).slice(0, 4);

  return (
    <ProductRow
      title={`🔥 ${onSale.length ? t("home.limitedDeals") : t("home.deals")}`}
      subtitle={t("home.dealsText")}
      titleClass="text-red-500"
      products={list}
    />
  );
}
