import { useTranslation } from "react-i18next";
import { Banknote, CreditCard, KeyRound, Bike, Phone, Smartphone } from "lucide-react";
import { card } from "@/components/Page";
import { orderAmountText, DELIVERY_STEPS } from "../../../shared/settings";

/** Customer side: how it's paid, what's left to pay, delivery code, driver */
export default function DeliveryInfo({ order }) {
  const { t, i18n } = useTranslation();
  if (!order.payment_method && !order.delivery_code) return null;

  const cod = order.payment_method === "cod";
  const momo = order.payment_method === "momo";
  const paid = order.payment_status === "paid" || order.payment_status === "collected";
  const statusText = paid
    ? t("delivery.paid")
    : momo && order.payment_status === "pending"
      ? t("delivery.verifying")
      : order.payment_status === "failed"
        ? t("delivery.paymentFailed")
        : t("delivery.toPay", { amount: orderAmountText(order, i18n.language) });
  const done = order.status === "delivered" || order.delivery_status === "delivered";
  const stepIndex = DELIVERY_STEPS.indexOf(order.delivery_status);

  return (
    <div className={`${card} p-6 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          {cod ? <Banknote className="w-5 h-5 text-green-400" /> : momo ? <Smartphone className="w-5 h-5 text-orange-400" /> : <CreditCard className="w-5 h-5 text-cyan-400" />}
          {momo && order.payment_operator ? order.payment_operator : t(`checkout.method.${order.payment_method || "card"}`)}
          {momo && order.payment_reference ? <span className="text-gray-400 text-sm font-mono">· {order.payment_reference}</span> : null}
        </span>
        <span className={`text-sm font-bold ${paid ? "text-green-400" : order.payment_status === "failed" ? "text-red-400" : "text-yellow-300"}`}>
          {statusText}
        </span>
      </div>

      {order.delivery_code && !done && order.status !== "cancelled" && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-300"><KeyRound className="w-4 h-4" /> {t("delivery.yourCode")}</div>
          <div className="text-4xl font-black tracking-[0.4em] font-mono my-1">{order.delivery_code}</div>
          <div className="text-xs text-gray-400">{t("delivery.codeHelp")}</div>
        </div>
      )}

      {stepIndex >= 0 && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {DELIVERY_STEPS.map((st, i) => (
            <div key={st}>
              <div className={`h-1.5 rounded-full mb-2 ${i <= stepIndex ? "bg-cyan-500" : "bg-zinc-700"}`} />
              <span className={i <= stepIndex ? "text-white" : "text-gray-500"}>{t(`delivery.steps.${st}`)}</span>
            </div>
          ))}
        </div>
      )}

      {order.driver?.name && (
        <p className="flex flex-wrap items-center gap-2 m-0">
          <Bike className="w-5 h-5 text-cyan-400" /> {t("delivery.driver")}: <strong>{order.driver.name}</strong>
          {order.driver.phone && (
            <a href={`tel:${order.driver.phone}`} className="inline-flex items-center gap-1 text-cyan-400 no-underline">
              <Phone className="w-4 h-4" /> {order.driver.phone}
            </a>
          )}
        </p>
      )}
    </div>
  );
}
