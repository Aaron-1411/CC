// Cloudflare Pages Function — GET /api/health

export async function onRequestGet(context) {
  const { env } = context;
  const hasKey = !!(env.GROQ_API_KEY && env.GROQ_API_KEY !== 'your_groq_key_here');
  const model = env.GROQ_MODEL || 'compound-beta';

  return new Response(JSON.stringify({ ok: true, keyConfigured: hasKey, model }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
