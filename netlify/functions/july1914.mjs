// "37 Days" game API endpoint: POST /api/july1914 with a JSON body { action, ... }.
// Thin wrapper: opens the Netlify Blobs store and hands over to netlify/july1914/api.mjs.
import { getStore } from '@netlify/blobs';
import { handle } from '../july1914/api.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
};

function deployContext(context) {
  return context?.deploy?.context || globalThis.Netlify?.env?.get?.('CONTEXT') || process.env.CONTEXT || 'unknown';
}

export default async (req, context) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Use POST.' }), { status: 405, headers: HEADERS });
  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Bad request.' }), { status: 400, headers: HEADERS }); }
  const ctx = deployContext(context);
  // Separate store per deploy context: a deploy preview or branch deploy can never touch a class session.
  const raw = getStore({ name: `july1914-${ctx.replace(/[^a-z0-9-]/gi, '')}`, consistency: 'strong' });
  const store = {
    async getJSON(key) {
      const r = await raw.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      return r ? { data: r.data, etag: r.etag } : null;
    },
    setJSON: (key, value, opts) => raw.setJSON(key, value, opts),
  };
  const env = {
    teacherCode: globalThis.Netlify?.env?.get?.('JULY1914_TEACHER_CODE') || process.env.JULY1914_TEACHER_CODE || '',
    requireCode: ctx === 'production' || ctx === 'unknown',
  };
  const { status, json } = await handle(store, body, env);
  return new Response(JSON.stringify(json), { status, headers: HEADERS });
};

export const config = { path: '/api/july1914' };
