import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Phone, MessageCircle, Map as MapIcon, Package, Camera, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import Page, { btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import { getDeliveries, updateDelivery, apiError } from "@/api/account";
import { mapsUrl, phoneDigits, orderAmountText, DELIVERY_STEPS } from "../../shared/settings";

// Shrink a photo before sending it (max 1280px, JPEG)
function photoToBase64(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function DeliveryCard({ d, onChange }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [collected, setCollected] = useState(false);
  const [method, setMethod] = useState("cash");
  const [photo, setPhoto] = useState(null);

  const cod = d.payment_method === "cod" && d.payment_status !== "collected";
  const done = d.delivery_status === "delivered";
  const map = mapsUrl(d);
  const tel = d.customer_phone;

  async function act(body, ok) {
    setBusy(true);
    try {
      onChange(await updateDelivery(d.id, body));
      if (ok) toast.success(ok);
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function deliver() {
    const body = { action: "delivered", code, collected: cod ? collected : undefined, collected_method: method };
    if (photo) body.photo = await photoToBase64(photo);
    act(body, t("driver.deliveredOk"));
  }

  function problem() {
    const note = window.prompt(t("driver.problemPrompt"));
    if (note) act({ action: "failed", note }, t("common.saved"));
  }

  const step = DELIVERY_STEPS.indexOf(d.delivery_status);

  return (
    <div className={`${card} p-5 space-y-4 ${done ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-lg">#{d.id}</strong>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${done ? "bg-green-500/20 text-green-300" : d.delivery_status === "failed" ? "bg-red-500/20 text-red-300" : "bg-cyan-500/20 text-cyan-300"}`}>
          {t(`delivery.steps.${d.delivery_status || "assigned"}`)}
        </span>
      </div>

      <p className="m-0 text-gray-200">{d.shipping_address}</p>

      <div className="flex flex-wrap gap-2">
        {tel && <a href={`tel:${tel}`} className={btnSecondary}><Phone className="w-4 h-4" /> {t("driver.call")}</a>}
        {tel && <a href={`https://wa.me/${phoneDigits(tel)}`} target="_blank" rel="noreferrer" className={btnSecondary}><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
        {map && <a href={map} target="_blank" rel="noreferrer" className={btnSecondary}><MapIcon className="w-4 h-4" /> {t("driver.map")}</a>}
      </div>

      <ul className="list-none p-0 m-0 space-y-1 text-sm">
        {(d.order_items || []).map((i) => (
          <li key={i.id} className="flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" /> {i.product_name} × {i.quantity}</li>
        ))}
      </ul>

      {d.payment_method === "cod" && (
        <p className={`m-0 font-bold ${cod ? "text-yellow-300" : "text-green-400"}`}>
          💵 {cod ? t("driver.collect", { amount: orderAmountText(d, i18n.language) }) : t("delivery.paid")}
        </p>
      )}

      {!done && (
        <div className="space-y-3">
          {step <= 0 && (
            <button disabled={busy} onClick={() => act({ action: "picked_up" })} className={`${btnPrimary} w-full`}>📦 {t("driver.pickedUp")}</button>
          )}
          {step === 1 && (
            <button disabled={busy} onClick={() => act({ action: "out_for_delivery" }, t("driver.customerNotified"))} className={`${btnPrimary} w-full`}>🛵 {t("driver.outForDelivery")}</button>
          )}
          {(step === 2 || d.delivery_status === "failed") && (
            <div className="rounded-xl border border-zinc-700 p-4 space-y-3">
              {d.needs_code && (
                <label className="block">
                  <span className="text-sm text-gray-400">{t("driver.askCode")}</span>
                  <input inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••" className={`${inputClass} mt-1 text-center text-2xl tracking-[0.5em] font-mono`} />
                </label>
              )}
              {cod && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 accent-green-500" checked={collected} onChange={(e) => setCollected(e.target.checked)} />
                    {t("driver.collectedConfirm", { amount: orderAmountText(d, i18n.language) })}
                  </label>
                  <div className="flex gap-4 text-sm pl-7">
                    {["cash", "mobile_money"].map((m) => (
                      <label key={m} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`m-${d.id}`} checked={method === m} onChange={() => setMethod(m)} /> {t(`delivery.collected.${m}`)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label className={`${btnSecondary} cursor-pointer`}>
                <Camera className="w-4 h-4" /> {photo ? t("driver.photoReady") : t("driver.takePhoto")}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </label>
              <button
                disabled={busy || (d.needs_code && code.length !== 4) || (cod && !collected)}
                onClick={deliver}
                className={`${btnPrimary} w-full`}
              >
                <CheckCircle2 className="w-5 h-5" /> {t("driver.confirmDelivered")}
              </button>
            </div>
          )}
          <button disabled={busy} onClick={problem} className="flex items-center gap-2 text-sm text-red-400 bg-transparent border-0 cursor-pointer p-0">
            <AlertTriangle className="w-4 h-4" /> {t("driver.problem")}
          </button>
          {d.delivery_note && <p className="text-yellow-300 text-sm m-0">{d.delivery_note}</p>}
        </div>
      )}
    </div>
  );
}

export default function Deliveries() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);

  const load = useCallback(() => getDeliveries().then(setList).catch((err) => { toast.error(apiError(err, t)); setList([]); }), [t]);
  useEffect(() => { load(); }, [load]);

  const replace = (d) => setList((l) => l.map((x) => (x.id === d.id ? d : x)));
  const active = (list || []).filter((d) => d.delivery_status !== "delivered" && d.status !== "cancelled");
  const done = (list || []).filter((d) => d.delivery_status === "delivered");

  return (
    <Page title={t("driver.title")} width="max-w-2xl" actions={<button onClick={load} className={btnSecondary}><RefreshCw className="w-4 h-4" /> {t("driver.refresh")}</button>}>
      {!list && <p className="text-gray-400">{t("common.loading")}</p>}
      {list && active.length === 0 && <p className="text-gray-400 text-center py-10">🛵 {t("driver.none")}</p>}
      <div className="space-y-4">
        {active.map((d) => <DeliveryCard key={d.id} d={d} onChange={replace} />)}
      </div>
      {done.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-10 mb-4">{t("driver.done", { count: done.length })}</h2>
          <div className="space-y-4">{done.slice(0, 20).map((d) => <DeliveryCard key={d.id} d={d} onChange={replace} />)}</div>
        </>
      )}
    </Page>
  );
}
