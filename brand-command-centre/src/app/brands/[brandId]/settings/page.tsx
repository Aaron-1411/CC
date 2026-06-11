import { notFound } from "next/navigation";
import { Settings as SettingsIcon, Check, X } from "lucide-react";
import { getBrand } from "@/lib/queries";
import { updateBrand } from "@/lib/actions";
import { hasApiKey, getModel } from "@/lib/claude";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) notFound();

  const apiKey = hasApiKey();

  const integrations = [
    { name: "CMS / blog", value: brand.cmsType ?? "manual", connected: false },
    { name: "Email (ESP)", value: "Not connected", connected: false },
    { name: "Social scheduler", value: "Not connected", connected: false },
    { name: "Reviews", value: "Not connected", connected: false },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
          <SettingsIcon className="h-5 w-5 text-[var(--accent)]" /> Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Brand details power every agent — keep the tone of voice sharp and they all stay on-brand.
        </p>
      </div>

      {/* Brand details */}
      <form
        action={updateBrand.bind(null, brandId)}
        className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-[var(--ink)]">Brand details</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="name">
              Brand name
            </label>
            <input id="name" name="name" defaultValue={brand.name} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="url">
              Website URL
            </label>
            <input id="url" name="url" defaultValue={brand.url} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="industry">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                className={inputCls}
                defaultValue={brand.industry ?? "ecommerce"}
              >
                <option value="ecommerce">E-commerce</option>
                <option value="b2b">B2B</option>
                <option value="saas">SaaS</option>
                <option value="local">Local / services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="cmsType">
                CMS
              </label>
              <select
                id="cmsType"
                name="cmsType"
                className={inputCls}
                defaultValue={brand.cmsType ?? "shopify"}
              >
                <option value="shopify">Shopify</option>
                <option value="wordpress">WordPress</option>
                <option value="webflow">Webflow</option>
                <option value="manual">Manual / other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="primaryColour">
              Brand colour
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick brand colour"
                name="primaryColour"
                defaultValue={brand.primaryColour ?? "#4f46e5"}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-1"
              />
              <span className="text-xs text-[var(--ink-3)]">
                Used for the brand avatar and email buttons.
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="toneOfVoice">
              Tone of voice
            </label>
            <textarea
              id="toneOfVoice"
              name="toneOfVoice"
              rows={3}
              defaultValue={brand.toneOfVoice ?? ""}
              placeholder="e.g. Confident, warm, plain-spoken. No jargon, no hype."
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>

      {/* System status */}
      <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">System</h2>
        <dl className="space-y-2.5">
          <StatusRow
            label="Anthropic API key"
            ok={apiKey}
            okText="Connected"
            badText="Missing — add ANTHROPIC_API_KEY to .env"
          />
          <Row label="Model">
            <code className="rounded bg-[var(--panel-2)] px-1.5 py-0.5 text-xs text-[var(--ink-2)]">
              {getModel()}
            </code>
          </Row>
          <Row label="Agent runs">
            <span className="text-xs font-medium text-[var(--ink-2)]">
              On demand — trigger from the Agents tab
            </span>
          </Row>
        </dl>
      </div>

      {/* Integrations */}
      <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--ink)]">Integrations</h2>
        <p className="mb-3 text-xs text-[var(--ink-2)]">
          Approved items export locally today. Connect a platform to publish live — coming soon.
        </p>
        <ul className="space-y-2">
          {integrations.map((i) => (
            <li
              key={i.name}
              className="flex items-center justify-between rounded-lg border border-[var(--line-2)] bg-[var(--panel-2)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">{i.name}</p>
                <p className="text-[11px] capitalize text-[var(--ink-3)]">{i.value}</p>
              </div>
              <span className="rounded-md bg-[var(--panel)] px-2 py-1 text-[11px] font-medium text-[var(--ink-3)]">
                Connect soon
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-[var(--ink-2)]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  okText,
  badText,
  neutralWhenOff = false,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
  neutralWhenOff?: boolean;
}) {
  return (
    <Row label={label}>
      <span
        className={
          "inline-flex items-center gap-1.5 text-xs font-medium " +
          (ok
            ? "text-[var(--good)]"
            : neutralWhenOff
              ? "text-[var(--ink-3)]"
              : "text-[var(--bad)]")
        }
      >
        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        {ok ? okText : badText}
      </span>
    </Row>
  );
}
