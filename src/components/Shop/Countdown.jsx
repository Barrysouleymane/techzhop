import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { timeLeft } from "../../../shared/settings";

export default function Countdown({ until, compact = false, className = "" }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(() => timeLeft(until));

  useEffect(() => {
    const id = setInterval(() => setLeft(timeLeft(until)), 1000);
    return () => clearInterval(id);
  }, [until]);

  if (!left) return null;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${className || "text-red-400"} ${compact ? "text-xs" : "text-sm"}`}>
      <Clock className={compact ? "w-3 h-3" : "w-4 h-4"} />
      {!compact && <span>{t("product.endsIn")}</span>}
      <span className="tabular-nums">
        {t("product.countdown", { d: left.days, h: pad(left.hours), m: pad(left.minutes), s: pad(left.seconds) })}
      </span>
    </span>
  );
}
