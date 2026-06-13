# Activation runbook

The site ships **fully working with zero backend configuration**. Every backend
capability is off by default and the app degrades gracefully:

| Capability | Off (default) behaviour | Turns on when… |
| --- | --- | --- |
| Lead capture persistence | Enquiries are validated and emailed to the clinic (if email is on) but **not stored centrally**; nothing is ever mirrored in the visitor's browser. If durable receipt can't be confirmed, the form routes the visitor to the clinic's direct contact details | a **D1** database is bound as `DB` |
| Lead notification emails | `/api/lead` accepts the enquiry, just doesn't email | `RESEND_API_KEY` + `LEAD_FROM` + `LEAD_NOTIFY_TO` are set |
| Clinic dashboard auth | `/api/admin/*` returns `503 not configured` and the dashboard **fails closed** — `/clinic` stays locked with a "not switched on yet" message (it never reads health data from the browser) | `ADMIN_TOKEN` is set |
| Funnel analytics | `/api/event` accepts beacons, doesn't store them | a **D1** database is bound as `DB` |

So CI stays green from the first push and there is **nothing to break**. The steps
below are the one-time switches to make it "live for real". Do them in any order.

> Account ID: `a1a1276a1a278339d95c187e0bf6de47` · Pages project: `whole-health-compass-app`

---

## 1. Persistence + analytics + dashboard data (D1)

```bash
cd whole-health-compass

# Create the database
bunx wrangler d1 create whole-health-compass
# → copy the database_id it prints

# Create the tables (events / leads / audit)
bunx wrangler d1 execute whole-health-compass --remote --file=./schema.sql
```

Then uncomment the binding block in **`wrangler.toml`** and paste the id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "whole-health-compass"
database_id = "PASTE_THE_ID_HERE"
```

Commit + push — the next deploy picks up the binding. Enquiries are then persisted
server-side and the dashboard shows live storage and a real funnel.

(Schema is also idempotently ensured at runtime via `ensureSchema()`, so a fresh
D1 with no tables still works — the `execute` step just makes that explicit.)

---

## 2. Lead notification emails (Resend)

The functions read three env vars: `RESEND_API_KEY`, `LEAD_FROM`, `LEAD_NOTIFY_TO`.
They're injected onto the Pages project by `.github/workflows/deploy.yml` from
**GitHub Actions secrets**. Add these to the `Aaron-1411/CC` repo
(Settings → Secrets and variables → Actions):

| GitHub secret | Used for | Example |
| --- | --- | --- |
| `RESEND_API_KEY` | Resend API key (already present — shared across projects) | `re_xxx` |
| `WHC_LEAD_FROM` | verified Resend sender | `Whole Health Compass <hello@yourdomain.com>` |
| `WHC_LEAD_NOTIFY_TO` | inbox that receives enquiries | `enquiries@yourclinic.com` |

`LEAD_FROM` **must** be on a domain verified in the Resend account that owns
`RESEND_API_KEY`, or Resend will reject the send (the request still succeeds for
the patient — email failure never fails the enquiry).

---

## 3. Clinic dashboard token (`/clinic`)

Add one more GitHub Actions secret:

| GitHub secret | Used for |
| --- | --- |
| `WHC_ADMIN_TOKEN` | the token clinics paste at `/clinic` to view enquiries + funnel |

Pick a long random value, e.g. `openssl rand -hex 32`. Share it with the clinic.
Until it's set, `/clinic` can't be unlocked — the dashboard fails closed and shows
a "not switched on yet" message (it never reads enquiries from the browser).

---

## 4. Apply

GitHub secrets are read at deploy time. After adding/changing any of the above,
trigger a deploy:

```bash
git commit --allow-empty -m "chore: activate whole-health-compass backend" && git push origin master
```

or run the **Deploy to Cloudflare** workflow manually (workflow_dispatch).

Verify:

- `POST /api/lead` returns `{ ok: true, stored: true, emailed: true }`
- `/clinic` accepts `WHC_ADMIN_TOKEN` and shows server-side enquiries + funnel
- a test enquiry lands in `WHC_LEAD_NOTIFY_TO`

---

## Going multi-clinic (white-label)

Each tenant is identified by `clinicId` in `src/config/clinic.ts` (every event,
lead and audit row is stamped with it; the dashboard filters by it). The medical
content is a pluggable **content pack** (`src/data/packs/`) selected by
`contentPackId`. To stand up a new branded instance, fork the config + theme,
optionally add a content pack, and deploy as its own Pages project — the backend
schema and Functions are unchanged.
