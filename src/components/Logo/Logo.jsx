import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link
      to="/"
      className="text-2xl sm:text-3xl font-extrabold text-cyan-400 tracking-wide hover:text-cyan-300 transition no-underline"
    >
      TECHZHOP
    </Link>
  );
}
