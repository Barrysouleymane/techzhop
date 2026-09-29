import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

export default function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");

  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("products.searchPlaceholder")}
        className="flex-1 min-w-0 px-4 py-2 rounded-l-lg bg-zinc-900 text-white border border-zinc-700 outline-none focus:border-cyan-500"
      />
      <button
        type="submit"
        aria-label={t("products.searchPlaceholder")}
        className="px-4 rounded-r-lg bg-cyan-500 hover:bg-cyan-600 text-black"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}
