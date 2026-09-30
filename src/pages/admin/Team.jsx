import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { User, Crown } from "lucide-react";
import { btnPrimary, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import { STAFF_ROLES, sellingCountries, countryName, flag } from "../../../shared/settings";
import useShopStore from "@/store/shopStore";

export default function Team() {
  const { t, i18n } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [country, setCountry] = useState("");
  const countries = sellingCountries(useShopStore((st) => st.settings));
  const [busy, setBusy] = useState(false);

  const load = () =>
    adminApi.team().then(setMembers).catch((err) => toast.error(apiError(err, t))).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function setMemberRole(targetEmail, newRole, newCountry) {
    setBusy(true);
    try {
      const res = await adminApi.setRole(targetEmail, newRole, i18n.language, newCountry);
      toast.success(res.invited ? t("team.invited", { email: targetEmail }) : t("team.updated"));
      setEmail("");
      await load();
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMemberRole(email, role, country || null);
        }}
        className={`${card} p-6 space-y-4 h-fit`}
      >
        <h2 className="text-xl font-bold m-0">{t("team.add")}</h2>
        <p className="text-gray-400 text-sm m-0">{t("team.subtitle")}</p>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("team.email")} className={inputClass} />
        <div className="space-y-2">
          {STAFF_ROLES.map((r) => (
            <label key={r} className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${role === r ? "border-cyan-500" : "border-zinc-800"}`}>
              <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="mt-1" />
              <span>
                <strong className="block">{t(`team.roles.${r}`)}</strong>
                <span className="text-gray-400 text-sm">{t(`team.desc.${r}`)}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="text-gray-400">{t("team.country")}</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} mt-1`}>
            <option value="">{t("team.allCountries")}</option>
            {countries.map((c) => <option key={c} value={c}>{flag(c)} {countryName(c, i18n.language)}</option>)}
          </select>
          <span className="text-gray-500 text-xs block mt-1">{t("team.countryHint")}</span>
        </label>
        <button disabled={busy} className={`${btnPrimary} w-full`}>{t("team.add")}</button>
      </form>

      <div className={`lg:col-span-2 ${card} divide-y divide-zinc-800 h-fit`}>
        {loading && <p className="p-6 text-gray-400 m-0">{t("common.loading")}</p>}
        {!loading && members.length === 0 && <p className="p-6 text-gray-400 m-0">{t("team.empty")}</p>}
        {members.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-4 p-4">
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
            )}
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold">{m.full_name || m.email}</div>
              <div className="text-gray-400 text-sm break-all">{m.email}</div>
            </div>
            {m.owner ? (
              <span className="inline-flex items-center gap-1 text-yellow-400 text-sm font-semibold"><Crown className="w-4 h-4" /> {t("team.owner")}</span>
            ) : (
              <>
                <select
                  value={m.role}
                  disabled={busy}
                  onChange={(e) => setMemberRole(m.email, e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  {STAFF_ROLES.map((r) => <option key={r} value={r}>{t(`team.roles.${r}`)}</option>)}
                </select>
                <select
                  value={m.country || ""}
                  disabled={busy}
                  onChange={(e) => setMemberRole(m.email, m.role, e.target.value || null)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  title={t("team.country")}
                >
                  <option value="">🌍 {t("team.allCountries")}</option>
                  {countries.map((c) => <option key={c} value={c}>{flag(c)} {c}</option>)}
                </select>
                <button
                  disabled={busy}
                  onClick={() => window.confirm(t("team.removeConfirm", { email: m.email })) && setMemberRole(m.email, "customer")}
                  className="text-red-400 text-sm"
                >
                  {t("team.remove")}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
