# Phase 0a — HMRC fraud-header pipeline (integration note)

**Status:** built and verified end-to-end in the browser, stuck at `stage: "assembled"`
pending HMRC sandbox credentials. The pipeline flips to a live `VALID_HEADERS`
verdict the moment those credentials are dropped into env — no code change needed.

This note documents what was built, the encoding rules, what is deliberately
omitted on the Cloudflare runtime, and how to verify locally.

---

## What this de-risks

The hardest technical risk in the whole product (per BUILD-PLAN Phase 0a) is
HMRC's mandatory fraud-prevention headers. Getting them wrong is the single most
common reason HMRC rejects a recognised-software application. Phase 0a proves we
can assemble a clean `WEB_APP_VIA_SERVER` header set from a real browser and
have it ready for HMRC's own validator.

---

## The pipeline (data flow)

```
Browser (src/lib/*)                Pages Function (functions/_lib + api)        HMRC
──────────────────                 ────────────────────────────────────        ────
collectClientFraudData()  ──POST── onRequestPost
  raw values, NO encoding   JSON     ├─ validate JSON shape (400 on bad)
                                     ├─ buildFraudHeaders()  ← SINGLE encode point
                                     │    + server-derived Public-IP / timestamp
                                     ├─ credentialsConfigured?
                                     │     no  → return {stage:"assembled"} 200
                                     │     yes → getApplicationToken() ──────────► POST /oauth/token
                                     │           validateHeaders()    ──Gov-*───► GET  /test/fraud-
                                     │                                            prevention-headers/validate
                                     └─ return {stage:"validated", validation}    ◄── verdict JSON
```

**Key architectural rule:** the browser sends **raw** values. Percent-encoding
and header assembly happen in **exactly one place** —
`functions/_lib/fraudHeaders.ts` (`buildFraudHeaders`). This avoids the classic
double-encoding bug and makes the encoding contract auditable in a single file.

---

## Headers assembled (11, `WEB_APP_VIA_SERVER`)

Sourced in-browser, posted raw, encoded server-side:

| Header | Source | Notes |
|---|---|---|
| `Gov-Client-Connection-Method` | constant | `WEB_APP_VIA_SERVER` |
| `Gov-Client-Device-ID` | `src/lib/deviceId.ts` | UUID v4, generated **once**, persisted in `localStorage` (`mtd.deviceId`). Regenerating per session is a common rejection cause. |
| `Gov-Client-User-IDs` | vendor + userId | `k=v` block; Phase 0a uses the device id as the stand-in user id (real internal user id lands with auth in Phase 1+) |
| `Gov-Client-Timezone` | browser | `UTC±HH:MM`, sign **inverted** from JS `getTimezoneOffset()` |
| `Gov-Client-Screens` | browser | `width&height&scaling-factor&colour-depth` |
| `Gov-Client-Window-Size` | browser | `width&height` (mapped from `innerWidth`/`innerHeight`) |
| `Gov-Client-Browser-JS-User-Agent` | browser | raw UA string |
| `Gov-Vendor-Version` | env | `mtd-filing-companion=0.0.0` |
| `Gov-Vendor-Product-Name` | env | percent-encoded (`MTD%20Filing%20Companion`) |
| `Gov-Client-Public-IP` | Cloudflare | from `CF-Connecting-IP`. Locally wrangler injects `::1`. |
| `Gov-Client-Public-IP-Timestamp` | server | ISO 8601, read-time. Emitted **only** as a pair with Public-IP. |

### Encoding rules
- US-ASCII; `k1=v1&k2=v2` blocks with **both** keys and values percent-encoded.
- `encodeURIComponent` is the chosen primitive — it matches HMRC's permitted
  unreserved set and encodes `=`, `&`, `:`→`%3A`, space→`%20`, and all non-ASCII.

---

## Deliberately OMITTED (never placeholdered)

HMRC rejects placeholder values (`null`, `0`, empty) for headers you can't
genuinely obtain. The correct move is to **omit** them and pre-register them as
missing-data with HMRC's SDS team before production. These are omitted because
the Cloudflare Workers runtime doesn't expose them:

- `Gov-Client-Public-Port` — client source port not exposed by Workers
- `Gov-Client-Multi-Factor` — app does not MFA the end user
- `Gov-Vendor-License-IDs` — no license keys
- `Gov-Vendor-Public-IP` — origin IP not exposed behind the CF edge
- `Gov-Vendor-Forwarded` — TLS hops not reliably enumerable behind the CF edge

⚠️ **Pre-production action:** Public-Port, Vendor-Public-IP and Vendor-Forwarded
must be declared to HMRC's Software Developer Support team as missing-data before
the production approval check.

---

## Credential drop-in behaviour

`functions/api/hmrc/test-fraud-headers.ts` gates on
`credentialsConfigured = Boolean(env.HMRC_CLIENT_ID && env.HMRC_CLIENT_SECRET)`:

- **No creds (current state):** assembles + returns headers, HTTP 200,
  `{ ok: true, stage: "assembled", credentialsConfigured: false }`. The pipeline
  is fully observable locally without any HMRC account.
- **Creds present:** obtains an application-restricted OAuth `client_credentials`
  Bearer token (`POST /oauth/token`), calls
  `GET /test/fraud-prevention-headers/validate` with the Gov-* headers +
  `Accept: application/vnd.hmrc.1.0+json`, returns
  `{ stage: "validated", ok: code === "VALID_HEADERS", validation }`.
- **HMRC error:** HTTP 502, `{ stage: "error" }` with the upstream message.

No code change is required to go from assembled → validated. Drop the credentials
in and the next request validates live.

---

## Local verification

The Vite dev server alone does **not** serve Pages Functions. Use the Workers
runtime locally (no HMRC login needed — this only exercises the assembly half):

```
npm run build
npx wrangler pages dev dist --port 8791 --compatibility-date=2026-06-01
```

`wrangler pages dev` serves the `functions/` directory, auto-loads `.dev.vars`,
and injects `CF-Connecting-IP` (shows `::1` on localhost).

Registered in `~/.claude/launch.json` as preview server **`mtd-pages`** (port 8791).

### Verified result (2026-06-14, real browser, real DOM click)
- Banner: **Headers assembled**, `creds: no`, "add sandbox credentials to run
  the live validator".
- **Assembled headers (11)** table rendered with real browser values:
  - device id `683a8b70-818f-429f-8dcd-c5173941bdac` (from localStorage)
  - `Gov-Client-Screens: width=1440&height=900&scaling-factor=2&colour-depth=…`
  - `Gov-Client-Window-Size: width=390&height=664`
  - `Gov-Client-Timezone: UTC+01:00`
  - `Gov-Vendor-Product-Name: MTD%20Filing%20Companion`
  - `Gov-Client-Public-IP: ::1`
- Response: `stage: "assembled"`, `credentialsConfigured: false`, `ok: true`, HTTP 200.

---

## The one external gate

Flipping this from `assembled` to a live `VALID_HEADERS` verdict requires HMRC
sandbox credentials, which require **registering the app on the HMRC Developer
Hub** (`https://developer.service.hmrc.gov.uk`) using a **Government Gateway
login**. That is the only step in Phase 0a that cannot be automated — it needs
Aaron's credentials. Once the app is registered and subscribed to the *Test
Fraud Prevention Headers API*, copy the client id/secret into `.dev.vars`
(see `.env.example`) and the pipeline validates live.
