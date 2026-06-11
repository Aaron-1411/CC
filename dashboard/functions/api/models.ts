/*
 * functions/api/models.ts — exposes the model→role map (Cloudflare Pages Function).
 *
 * GET /api/models → the single-source MODEL_CONFIG (dashboard/model-config.js):
 * Haiku for summarisation/classification, Sonnet for worker/council agents,
 * Opus for Chairman synthesis. The client reads this so model names, pricing and
 * the task→role mapping live in ONE place (locked decision #5) — never hardcoded
 * in function bodies or the UI. Loose `any` types so esbuild needs no type deps.
 */
import modelConfig from '../../model-config.js';

const MC: any = (modelConfig as any).MODEL_CONFIG || modelConfig;

export const onRequestGet = async (): Promise<Response> => {
  return new Response(JSON.stringify(MC), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
};
