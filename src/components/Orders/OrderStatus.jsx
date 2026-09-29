import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { ORDER_STEPS } from "../../../shared/settings";

const STYLES = {
  pending: "bg-yellow-500/15 text-yellow-400",
  paid: "bg-green-500/15 text-green-400",
  processing: "bg-blue-500/15 text-blue-400",
  shipped: "bg-indigo-500/15 text-indigo-400",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
  failed: "bg-red-500/15 text-red-400",
};

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STYLES[status] || "bg-zinc-800 text-gray-300"}`}>
      {t(`orders.status.${status}`, { defaultValue: status })}
    </span>
  );
}

/** Paid → Preparing → Shipped → Delivered */
export function StatusTimeline({ status }) {
  const { t } = useTranslation();
  if (status === "cancelled" || status === "failed") return <StatusBadge status={status} />;

  const current = ORDER_STEPS.indexOf(status);

  return (
    <ol className="flex items-start justify-between gap-2 list-none p-0 m-0">
      {ORDER_STEPS.map((step, i) => {
        const done = current >= i;
        return (
          <li key={step} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && (
              <span
                className={`absolute top-4 right-1/2 w-full h-1 -z-0 ${current >= i ? "bg-cyan-500" : "bg-zinc-800"}`}
              />
            )}
            <span
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                done ? "bg-cyan-500 text-black" : "bg-zinc-800 text-gray-500"
              }`}
            >
              {done ? <Check className="w-5 h-5" /> : i + 1}
            </span>
            <span className={`mt-2 text-xs sm:text-sm ${done ? "text-white" : "text-gray-500"}`}>
              {t(`orders.status.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
