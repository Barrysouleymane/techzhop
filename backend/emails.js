// ======================================================
// EMAILS (Resend — free up to 3,000 emails/month)
// Set RESEND_API_KEY and EMAIL_FROM in backend/.env.
// Without a key, emails are only printed in the console.
// ======================================================

const T = require("./email-i18n");

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "TechZhop <onboarding@resend.dev>";
const SITE = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");

const LANGS = Object.keys(T);
const lang = (l) => (LANGS.includes(String(l || "").slice(0, 2)) ? String(l).slice(0, 2) : "en");
const fill = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const usd = (n, l) => new Intl.NumberFormat(lang(l), { style: "currency", currency: "USD" }).format(Number(n || 0));
const localMoney = (n, currency, l) => {
  try {
    const zero = ["GNF", "XOF", "XAF"].includes(currency);
    return new Intl.NumberFormat(lang(l), { style: "currency", currency, maximumFractionDigits: zero ? 0 : 2 }).format(Number(n || 0));
  } catch {
    return `${n} ${currency}`;
  }
};

async function sendEmail({ to, subject, html }) {
  if (!to) return;
  if (!RESEND_API_KEY) {
    console.log(`✉️  [email not sent — no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) console.error("✉️  EMAIL ERROR:", res.status, body.message || body);
    else console.log(`✉️  sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("✉️  EMAIL ERROR:", err.message);
  }
}

// Branded layout (inline styles for email clients)
function layout(l, { title, greeting, paragraphs = [], cta, extra = "" }) {
  const t = T[lang(l)];
  return `<!doctype html><html lang="${lang(l)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#000;padding:22px 28px;text-align:center">
<span style="font-size:26px;font-weight:900;letter-spacing:2px;color:#fff">TECH</span><span style="font-size:26px;font-weight:900;letter-spacing:2px;color:#2563eb">ZHOP</span>
<div style="color:#a1a1aa;font-size:11px;letter-spacing:3px;margin-top:4px">TECH · GAMING · LIFESTYLE</div>
</td></tr>
<tr><td style="padding:28px">
${title ? `<h1 style="margin:0 0 16px;font-size:22px">${esc(title)}</h1>` : ""}
${greeting ? `<p style="margin:0 0 12px;font-size:15px">${esc(greeting)}</p>` : ""}
${paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#3f3f46">${esc(p)}</p>`).join("")}
${extra}
${cta ? `<p style="margin:24px 0 4px;text-align:center"><a href="${esc(cta.url)}" style="display:inline-block;background:#06b6d4;color:#000;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:10px">${esc(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:18px 28px;background:#fafafa;color:#71717a;font-size:12px;text-align:center">
${esc(t.footer)}<br>${esc(t.why)}
</td></tr></table></td></tr></table></body></html>`;
}

const hi = (l, name) => (name ? fill(T[lang(l)].hi, { name }) : T[lang(l)].hiNoName);

function welcomeEmail({ to, name, language }) {
  const t = T[lang(language)];
  return sendEmail({
    to,
    subject: t.welcome.subject,
    html: layout(language, { title: t.welcome.title, greeting: hi(language, name), paragraphs: [t.welcome.body], cta: { label: t.welcome.cta, url: `${SITE}/products` } }),
  });
}

function itemsTable(l, order, items) {
  const t = T[lang(l)].order;
  const row = (a, b, bold) =>
    `<tr><td style="padding:6px 0;font-size:14px;${bold ? "font-weight:700" : "color:#3f3f46"}">${a}</td><td style="padding:6px 0;font-size:14px;text-align:right;${bold ? "font-weight:700" : ""}">${b}</td></tr>`;
  let html = `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7">`;
  for (const i of items) html += row(`${esc(i.product_name)} × ${i.quantity}`, usd(i.price * i.quantity, l));
  html += `</table><table width="100%" cellpadding="0" cellspacing="0">`;
  if (order.subtotal != null) html += row(t.subtotal, usd(order.subtotal, l));
  if (order.shipping_amount != null) html += row(t.shipping, Number(order.shipping_amount) ? usd(order.shipping_amount, l) : t.free);
  if (Number(order.tax_amount)) html += row(t.tax, usd(order.tax_amount, l));
  if (Number(order.discount_amount)) html += row(t.discount, `−${usd(order.discount_amount, l)}`);
  html += row(t.total, usd(order.total, l), true);
  if (order.payment_method === "cod") {
    const due = order.currency && order.currency !== "USD" ? localMoney(order.local_total, order.currency, l) : usd(order.total, l);
    html += row(`💵 ${T[lang(l)].courier.toPay}`, due, true);
  }
  html += `</table>`;
  if (order.shipping_address) {
    html += `<p style="margin:16px 0 0;font-size:13px;color:#71717a"><strong>${esc(t.shipTo)}:</strong> ${esc(order.shipping_address)}</p>`;
  }
  return html;
}

function orderConfirmationEmail({ to, name, language, order, items }) {
  const t = T[lang(language)];
  return sendEmail({
    to,
    subject: fill(t.order.subject, { id: order.id }),
    html: layout(language, {
      title: t.order.title,
      greeting: hi(language, name),
      paragraphs: [t.order.body],
      extra: itemsTable(language, order, items),
      cta: { label: t.order.cta, url: `${SITE}/orders/${order.id}` },
    }),
  });
}

function orderUpdateEmail({ to, name, language, order, trackingUrl }) {
  const t = T[lang(language)];
  const status = t.status[order.status] || order.status;
  let extra = "";
  if (order.tracking_number) {
    extra = `<p style="margin:12px 0;font-size:14px"><strong>${esc(t.update.tracking)}:</strong> <span style="font-family:monospace">${esc(order.tracking_number)}</span></p>`;
    if (trackingUrl) {
      extra += `<p style="margin:8px 0"><a href="${esc(trackingUrl)}" style="color:#0891b2;font-weight:700">${esc(t.update.track)} →</a></p>`;
    }
  }
  return sendEmail({
    to,
    subject: fill(t.update.subject, { id: order.id, status }),
    html: layout(language, {
      title: status,
      greeting: hi(language, name),
      paragraphs: [t.update[order.status] || ""],
      extra,
      cta: { label: t.update.cta, url: `${SITE}/orders/${order.id}` },
    }),
  });
}

function staffEmail({ to, name, language, role, invited }) {
  const t = T[lang(language)];
  return sendEmail({
    to,
    subject: t.staff.subject,
    html: layout(language, {
      title: t.staff.title,
      greeting: hi(language, name),
      paragraphs: [fill(t.staff.body, { role: t.roles[role] || role }), ...(invited ? [t.invite.note] : [])],
      cta: { label: t.staff.cta, url: `${SITE}/admin` },
    }),
  });
}

function newOrderAdminEmail({ to, order, items }) {
  const tr = T[lang(process.env.ADMIN_EMAIL_LANGUAGE || "fr")];
  const L = lang(process.env.ADMIN_EMAIL_LANGUAGE || "fr");
  return sendEmail({
    to,
    subject: fill(tr.newOrder.subject, { id: order.id, total: usd(order.total, L) }),
    html: layout(L, { title: fill(tr.newOrder.subject, { id: order.id, total: usd(order.total, L) }), paragraphs: [tr.newOrder.body], extra: itemsTable(L, order, items), cta: { label: tr.newOrder.cta, url: `${SITE}/admin/orders/${order.id}` } }),
  });
}

function accountDeletedEmail({ to, name, language }) {
  const t = T[lang(language)];
  return sendEmail({
    to,
    subject: t.deleted.subject,
    html: layout(language, { title: t.deleted.title, greeting: hi(language, name), paragraphs: [t.deleted.body] }),
  });
}


// ---------- Cancellations / returns / refunds ----------

function messageBox(label, text) {
  if (!text) return "";
  return `<div style="margin:16px 0;padding:14px 16px;background:#f4f4f5;border-radius:10px;font-size:14px;color:#3f3f46"><strong>${esc(label)}</strong><br>${esc(text).replace(/\n/g, "<br>")}</div>`;
}

function requestReceivedEmail({ to, name, language, order }) {
  const t = T[lang(language)];
  const type = t.request[order.request_type] || order.request_type;
  return sendEmail({
    to,
    subject: fill(t.request.receivedSubject, { id: order.id, type }),
    html: layout(language, {
      title: fill(t.request.receivedSubject, { id: order.id, type }),
      greeting: hi(language, name),
      paragraphs: [t.request.receivedBody],
      extra: messageBox(t.request.reasonLabel, order.request_reason),
      cta: { label: t.update.cta, url: `${SITE}/orders/${order.id}` },
    }),
  });
}

function requestAdminEmail({ to, order, customer }) {
  const L = lang(process.env.ADMIN_EMAIL_LANGUAGE || "fr");
  const t = T[L];
  const type = t.request[order.request_type] || order.request_type;
  const subject = fill(t.request.adminSubject, { id: order.id, type });
  return sendEmail({
    to,
    subject,
    html: layout(L, {
      title: subject,
      paragraphs: [customer?.email ? `${customer.name || ""} <${customer.email}>` : ""].filter(Boolean),
      extra: messageBox(t.request.reasonLabel, order.request_reason),
      cta: { label: t.newOrder.cta, url: `${SITE}/admin/orders/${order.id}` },
    }),
  });
}

function requestDecisionEmail({ to, name, language, order, message }) {
  const t = T[lang(language)];
  const type = t.request[order.request_type] || order.request_type;
  const ok = order.request_status === "approved";
  const subject = fill(ok ? t.request.approvedSubject : t.request.rejectedSubject, { id: order.id, type });
  return sendEmail({
    to,
    subject,
    html: layout(language, {
      title: subject,
      greeting: hi(language, name),
      paragraphs: [ok ? t.request.approvedBody : t.request.rejectedBody],
      extra: messageBox(t.request.messageLabel, message),
      cta: { label: t.update.cta, url: `${SITE}/orders/${order.id}` },
    }),
  });
}

function refundEmail({ to, name, language, order, amount }) {
  const t = T[lang(language)];
  return sendEmail({
    to,
    subject: fill(t.refund.subject, { id: order.id }),
    html: layout(language, {
      title: t.refund.title,
      greeting: hi(language, name),
      paragraphs: [fill(t.refund.body, { amount: usd(amount, language), id: order.id })],
      cta: { label: t.update.cta, url: `${SITE}/orders/${order.id}` },
    }),
  });
}

function outForDeliveryEmail({ to, name, language, order, driverName, driverPhone }) {
  const t = T[lang(language)].courier;
  const code = order.delivery_code
    ? `<div style="margin:18px 0;text-align:center"><div style="font-size:13px;color:#71717a">${esc(t.code)}</div><div style="font-size:36px;font-weight:900;letter-spacing:8px;font-family:monospace">${esc(order.delivery_code)}</div><div style="font-size:13px;color:#71717a">${esc(t.codeHelp)}</div></div>`
    : "";
  const due = order.payment_method === "cod" && order.payment_status !== "collected"
    ? `<p style="margin:12px 0;font-size:15px"><strong>💵 ${esc(t.toPay)}:</strong> ${esc(order.currency && order.currency !== "USD" ? localMoney(order.local_total, order.currency, language) : usd(order.total, language))}</p>`
    : "";
  const phone = driverPhone ? `<p style="margin:8px 0;font-size:14px">📞 ${esc(t.call)}: <a href="tel:${esc(driverPhone)}">${esc(driverPhone)}</a></p>` : "";
  return sendEmail({
    to,
    subject: fill(t.subject, { id: order.id }),
    html: layout(language, {
      title: t.title,
      greeting: hi(language, name),
      paragraphs: [fill(t.body, { name: driverName || "TechZhop" })],
      extra: code + due + phone,
      cta: { label: T[lang(language)].update.cta, url: `${SITE}/orders/${order.id}` },
    }),
  });
}

module.exports = {
  outForDeliveryEmail,
  requestReceivedEmail,
  requestAdminEmail,
  requestDecisionEmail,
  refundEmail,
  sendEmail,
  welcomeEmail,
  orderConfirmationEmail,
  orderUpdateEmail,
  staffEmail,
  newOrderAdminEmail,
  accountDeletedEmail,
};
