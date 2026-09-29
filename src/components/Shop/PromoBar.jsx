import { Link } from "react-router-dom";
import useShopStore from "@/store/shopStore";
import Countdown from "./Countdown";
import { promoBarVisible } from "../../../shared/settings";

/** Site-wide announcement with optional countdown (Admin → Store) */
export default function PromoBar() {
  const settings = useShopStore((s) => s.settings);
  if (!promoBarVisible(settings)) return null;
  const b = settings.promo_bar;

  const content = (
    <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      <span className="font-bold">{b.text}</span>
      {b.ends_at && (
        <span className="bg-black/30 rounded-md px-2 py-0.5" style={{ color: "#fff" }}>
          <Countdown until={b.ends_at} compact className="!text-white" />
        </span>
      )}
    </span>
  );

  const cls = "block w-full text-center text-sm px-4 py-2 no-underline";
  const style = { background: "linear-gradient(90deg,#dc2626,#db2777)", color: "#fff" };

  return b.link ? (
    b.link.startsWith("/") ? (
      <Link to={b.link} className={cls} style={style}>{content}</Link>
    ) : (
      <a href={b.link} className={cls} style={style}>{content}</a>
    )
  ) : (
    <div className={cls} style={style}>{content}</div>
  );
}
