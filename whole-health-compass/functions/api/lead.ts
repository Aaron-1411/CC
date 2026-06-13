// POST /api/lead — capture a patient enquiry from the contact form.
//
// Graceful degradation:
//   • Always validates name/email and REQUIRES explicit consent (health data).
//   • Persists the lead + an append-only consent audit row when D1 is bound.
//   • Emails the clinic via Resend when RESEND_API_KEY/LEAD_FROM/LEAD_NOTIFY_TO
//     are set. Email failure never fails the request (the lead is already saved).
//   • The response reports what actually happened — { ok, stored, emailed } — so
//     the client can be honest. With nothing configured it returns
//     { ok: true, stored: false, emailed: false }; the form then routes the
//     visitor to the clinic's own contact details rather than imply it was
//     received. Health data is never mirrored in the browser (see ACTIVATION.md).

import {
  type Env,
  json,
  uid,
  slug,
  clean,
  clientIp,
  sha256Hex,
  isRateLimited,
  ensureSchema,
} from "../_shared";

const RATE_LIMIT = 10; // submissions
const RATE_WINDOW_MS = 60_000; // per minute per edge isolate
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type LeadEmailFields = {
  name: string;
  email: string;
  phone: string;
  concernLabel: string;
  message: string;
  summary: string;
  source: string;
  consentVersion: string;
  consentedAt: string;
};

async function sendLeadEmail(env: Env, lead: LeadEmailFields): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.LEAD_FROM || !env.LEAD_NOTIFY_TO) return false;
  const to = env.LEAD_NOTIFY_TO.split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return false;

  const lines = [
    `New enquiry via ${lead.source || "Whole Health Compass"}`,
    "",
    `Name:  ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : "",
    lead.concernLabel ? `Concern: ${lead.concernLabel}` : "",
    lead.message ? `\nMessage:\n${lead.message}` : "",
    lead.summary ? `\n— Practitioner summary (shared with consent) —\n${lead.summary}` : "",
    "",
    `Consent: ${lead.consentVersion} at ${lead.consentedAt}`,
  ].filter(Boolean);

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5">${lines
    .map((l) => esc(l).replace(/\n/g, "<br>"))
    .join("<br>")}</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.LEAD_FROM,
        to,
        reply_to: lead.email,
        subject: `New enquiry — ${lead.name}${lead.concernLabel ? ` · ${lead.concernLabel}` : ""}`,
        text: lines.join("\n"),
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const ip = clientIp(request);
  if (isRateLimited(`lead:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return json({ ok: false, error: "rate_limited", message: "Please wait a moment and try again." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Honeypot — bots fill the hidden "company" field. Pretend success, store nothing.
  if (clean(body.company, 200)) return json({ ok: true, stored: false, emailed: false });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  if (!name) return json({ ok: false, error: "missing_name" }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "invalid_email" }, 400);

  // Health data (GDPR Art. 9) — an explicit, versioned consent is mandatory.
  const consent = body.consent === true;
  const consentVersion = clean(body.consentVersion, 40);
  const consentText = clean(body.consentText, 1000);
  if (!consent || !consentVersion || !consentText) {
    return json({ ok: false, error: "consent_required" }, 400);
  }

  const lead = {
    name,
    email,
    phone: clean(body.phone, 60),
    message: clean(body.message, 4000),
    concernId: slug(body.concernId, 48),
    concernLabel: clean(body.concernLabel, 120),
    includeSummary: body.includeSummary === true,
    summary: body.includeSummary === true ? clean(body.summary, 8000) : "",
    consentVersion,
    consentText,
    consentedAt: new Date().toISOString(),
    source: clean(body.source, 80) || "Whole Health Compass",
  };
  const clinicId = slug(body.clinicId, 48) || "default";

  let stored = false;
  if (env.DB) {
    try {
      await ensureSchema(env.DB);
      const id = uid();
      const ts = Date.now();
      const ipHash = await sha256Hex(`${clinicId}:${ip}`);
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO leads (id, clinic_id, name, email, phone, message, concern_id,
            concern_label, include_summary, summary, consent_version, consent_text,
            consented_at, source, ts)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          id,
          clinicId,
          lead.name,
          lead.email,
          lead.phone || null,
          lead.message || null,
          lead.concernId || null,
          lead.concernLabel || null,
          lead.includeSummary ? 1 : 0,
          lead.summary || null,
          lead.consentVersion,
          lead.consentText,
          lead.consentedAt,
          lead.source,
          ts,
        ),
        env.DB.prepare(
          `INSERT INTO audit (id, clinic_id, kind, ref_id, detail, ip_hash, ts)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(uid(), clinicId, "lead_consent", id, lead.consentVersion, ipHash, ts),
      ]);
      stored = true;
    } catch {
      stored = false; // fall through to email/accepted so the enquiry isn't lost
    }
  }

  const emailed = await sendLeadEmail(env, lead);

  return json({ ok: true, stored, emailed });
};
