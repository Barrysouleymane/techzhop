import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";

/** Standard page wrapper: layout + centered container + optional title/back link */
export default function Page({ title, back, backLabel, width = "max-w-5xl", children, actions }) {
  return (
    <MainLayout>
      <section className={`${width} mx-auto px-4 sm:px-6 py-10 sm:py-12`}>
        {back && (
          <Link
            to={back}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-6 no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        )}
        {(title || actions) && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            {title && <h1 className="text-3xl sm:text-4xl font-bold m-0">{title}</h1>}
            {actions}
          </div>
        )}
        {children}
      </section>
    </MainLayout>
  );
}

export const inputClass =
  "w-full p-3 rounded-lg bg-zinc-800 text-white outline-none border border-zinc-700 focus:ring-2 focus:ring-cyan-500";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-lg transition no-underline";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 border border-zinc-700 hover:bg-zinc-800 px-6 py-3 rounded-lg transition text-white no-underline";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-lg transition";

export const card = "bg-zinc-900 border border-zinc-800 rounded-xl";

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-gray-500 text-xs mt-1 block">{hint}</span>}
    </label>
  );
}
