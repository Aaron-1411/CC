// Access gate for every Pages Function request (Phase 0).
//
// Two layers, either of which is sufficient:
//   1. Cloudflare Access — if you front the site with Access, the request
//      arrives already authenticated and carries Cf-Access-Authenticated-User-Email.
//      We treat that header's presence as a pass.
//   2. Shared secret — the client sends `x-app-key`; we compare it to
//      APP_SHARED_SECRET (constant-time).
//
// Degradation rule: if APP_SHARED_SECRET is UNSET, the gate is OPEN in local
// dev (so the app is explorable with zero config) and CLOSED in production
// (so an unconfigured deploy can never leak data). "Local" is detected from
// the request host.

interface Env {
  APP_SHARED_SECRET?: string;
}

const PUBLIC_PATHS = new Set<string>([
  // Health check is intentionally ungated so uptime probes work.
  '/api/health',
]);

function isLocalHost(host: string): boolean {
  const h = host.split(':')[0];
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
}

function timingSafeEqual(a: string, b: string): boolean {
  // Compare without early-exit on length mismatch.
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only gate API calls; static assets are served by Pages directly and
  // never hit this middleware anyway, but be explicit.
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  // Layer 1: Cloudflare Access already authenticated this user.
  if (request.headers.get('Cf-Access-Authenticated-User-Email')) {
    return next();
  }

  const secret = env.APP_SHARED_SECRET?.trim();

  // Layer 2: shared secret.
  if (secret) {
    const provided = request.headers.get('x-app-key') ?? '';
    if (provided && timingSafeEqual(provided, secret)) {
      return next();
    }
    return json401();
  }

  // No secret configured: open locally, closed in production.
  if (isLocalHost(url.host)) {
    return next();
  }
  return json401('Access gate not configured. Set APP_SHARED_SECRET or front the site with Cloudflare Access.');
};

function json401(message = 'Unauthorized'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}
