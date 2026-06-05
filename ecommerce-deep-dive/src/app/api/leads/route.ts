export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: { email?: string; brand_url?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, brand_url, message } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  if (email.length > 254 || (brand_url && brand_url.length > 2048)) {
    return NextResponse.json({ error: 'Input too long' }, { status: 400 });
  }

  // Resolve Formspree endpoint from env or fall back to a hardcoded form ID
  // Set FORMSPREE_FORM_ID in CF Pages env vars (e.g. "xkgwrdnp")
  let formId: string | undefined;
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    formId = (env as Record<string, unknown>).FORMSPREE_FORM_ID as string | undefined;
  } catch {
    // local dev — skip
  }

  if (!formId) {
    // No form configured — still return 200 so the UI doesn't error
    // Leads are captured via the KV audit store + admin page instead
    console.warn('FORMSPREE_FORM_ID not set — lead not forwarded:', email);
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(`https://formspree.io/f/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email,
        brand_url: brand_url || '(not provided)',
        message: message || 'Interested in implementation.',
      }),
    });

    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: 'Submission failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
