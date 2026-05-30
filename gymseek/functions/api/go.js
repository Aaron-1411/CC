// Cloudflare Pages Function — GET /api/go
// Referral redirect tracker — ready for affiliate codes

export async function onRequestGet(context) {
  const { request } = context;
  const { searchParams } = new URL(request.url);

  const url = searchParams.get('url');
  const gym = searchParams.get('gym') || '?';
  const src = searchParams.get('src') || 'card';

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const decoded = decodeURIComponent(url);
  console.log(`[referral] gym="${gym}" src="${src}" → ${decoded}`);

  return Response.redirect(decoded, 302);
}
