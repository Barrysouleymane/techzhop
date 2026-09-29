import { useTranslation } from "react-i18next";
import useMoney from "@/hooks/useMoney";
import { isOnSale, effectivePrice, discountPercent } from "../../../shared/settings";

export default function PriceTag({ product, size = "md" }) {
  const { t } = useTranslation();
  const money = useMoney();
  const sale = isOnSale(product);
  const big = size === "lg";

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`text-cyan-400 font-bold ${big ? "text-4xl" : "text-2xl"}`}>{money(effectivePrice(product))}</span>
      {sale && (
        <>
          <span className={`line-through text-gray-500 ${big ? "text-xl" : "text-sm"}`}>{money(product.price)}</span>
          <span className="bg-red-600 text-white text-xs font-bold rounded px-2 py-0.5">
            {t("product.off", { percent: discountPercent(product) })}
          </span>
        </>
      )}
    </div>
  );
}
