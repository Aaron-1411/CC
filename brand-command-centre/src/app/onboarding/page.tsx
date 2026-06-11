import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBrand } from "@/lib/actions";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]";

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-12">
      <Link
        href="/brands"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Brands
      </Link>

      <h1 className="text-xl font-semibold text-[var(--ink)]">Add a brand</h1>
      <p className="mt-1 text-sm text-[var(--ink-2)]">
        We&apos;ll set up the command centre and seven agents (all off by default — you decide
        what runs).
      </p>

      <form action={createBrand} className="mt-7 space-y-4">
        <div>
          <label className={labelCls} htmlFor="name">
            Brand name
          </label>
          <input id="name" name="name" required placeholder="Acme Co." className={inputCls} />
        </div>

        <div>
          <label className={labelCls} htmlFor="url">
            Website URL
          </label>
          <input
            id="url"
            name="url"
            required
            placeholder="acme.com"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="industry">
              Industry
            </label>
            <select id="industry" name="industry" className={inputCls} defaultValue="ecommerce">
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
            <select id="cmsType" name="cmsType" className={inputCls} defaultValue="shopify">
              <option value="shopify">Shopify</option>
              <option value="wordpress">WordPress</option>
              <option value="webflow">Webflow</option>
              <option value="manual">Manual / other</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="toneOfVoice">
            Tone of voice <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="toneOfVoice"
            name="toneOfVoice"
            rows={3}
            placeholder="e.g. Confident, warm, plain-spoken. No jargon, no hype."
            className={`${inputCls} resize-y`}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Create command centre
        </button>
      </form>
    </div>
  );
}
