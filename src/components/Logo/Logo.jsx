import { Link } from "react-router-dom";

/** Brand: TZ emblem + TECH (white) ZHOP (blue), like the official logo */
export default function Logo({ size = "md" }) {
  const img = size === "lg" ? "w-12 h-12" : "w-9 h-9 sm:w-10 sm:h-10";
  const text = size === "lg" ? "text-3xl" : "text-xl sm:text-2xl";
  return (
    <Link to="/" className="flex items-center gap-2 no-underline shrink-0" aria-label="TechZhop">
      <img src="/logo-mark.png" alt="" className={`${img} rounded-full`} />
      <span className={`${text} font-extrabold tracking-wide`}>
        <span className="text-white">TECH</span>
        <span style={{ color: "#2563eb" }}>ZHOP</span>
      </span>
    </Link>
  );
}
