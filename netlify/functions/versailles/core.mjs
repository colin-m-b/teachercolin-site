// Request handling for /api/versailles, kept separate from the Netlify entry
// point so it can run against a local Blobs server in tests.
//
// Storage layout (one Netlify Blobs store, "versailles"):
//   config/secret        random HMAC secret, created on first use
//   meta/<CODE>          { createdAt } index used for cleanup
//   g/<CODE>/state       public state, written only by the teacher's browser
//   g/<CODE>/host        the teacher's full game state (votes, meters, scores)
//   g/<CODE>/d/<del>     one private doc per delegation (notes, recommendations)
//   g/<CODE>/p/<pid>     player record { name, joinedAt }
//   g/<CODE>/nb/<pid>    a student's notebook entries
//   g/<CODE>/a/<ts-rnd>  one key per student action, folded in by the teacher
//
// Students only ever write their own action keys, player record and notebook,
// so there is never more than one writer per key. Games, with everything in
// them, are deleted seven days after creation.

import { createHmac, randomBytes } from "node:crypto";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O
const DELEGATION_IDS = new Set(["fr", "gb", "us", "it", "de", "jp", "cn", "va"]);
const MAX_ACTION_BYTES = 6000;
const MAX_HOST_BYTES = 900000;

let cachedSecret = null;

async function secret(store) {
  if (cachedSecret) return cachedSecret;
  let value = await store.get("config/secret");
  if (!value) {
    await store.set("config/secret", randomBytes(32).toString("hex"), { onlyIfNew: true });
    value = await store.get("config/secret");
  }
  cachedSecret = value;
  return value;
}

function sign(sec, text, length = 16) {
  return createHmac("sha256", sec).update(text).digest("hex").slice(0, length);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

function validCode(code) {
  return typeof code === "string" && /^[A-Z]{4}$/.test(code);
}

export function playerIdFor(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function cleanName(name) {
  return String(name || "").replace(/\s+/g, " ").trim().slice(0, 24);
}

function newCode() {
  const bytes = randomBytes(4);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

async function loadState(store, code) {
  const state = await store.get(`g/${code}/state`, { type: "json" });
  if (!state) return null;
  if (Date.now() - (state.createdAt || 0) > TTL_MS) return null;
  return state;
}

async function deletePrefix(store, prefix) {
  const { blobs } = await store.list({ prefix });
  await Promise.all(blobs.map((b) => store.delete(b.key)));
}

async function cleanupExpired(store) {
  const { blobs } = await store.list({ prefix: "meta/" });
  const now = Date.now();
  for (const b of blobs) {
    const meta = await store.get(b.key, { type: "json" });
    if (!meta || now - (meta.createdAt || 0) > TTL_MS) {
      const code = b.key.slice(5);
      await deletePrefix(store, `g/${code}/`);
      await store.delete(b.key);
    }
  }
}

async function create(store, body) {
  try {
    await cleanupExpired(store);
  } catch (err) {
    console.error("cleanup failed", err);
  }
  const sec = await secret(store);
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = newCode();
    const createdAt = Date.now();
    const { modified } = await store.setJSON(`meta/${code}`, { createdAt }, { onlyIfNew: true });
    if (!modified) continue;
    const state = { v: 0, code, createdAt, stage: { kind: "lobby" }, players: {}, preset: body.preset || "standard" };
    await store.setJSON(`g/${code}/state`, state);
    return json({ code, hostKey: sign(sec, `host:${code}`, 10), state });
  }
  return fail("Could not create a conference code. Try again.", 503);
}

async function requireHost(store, body) {
  if (!validCode(body.code)) return "Missing conference code.";
  const sec = await secret(store);
  if (body.hostKey !== sign(sec, `host:${body.code}`, 10)) return "That teacher key does not match this conference.";
  return null;
}

async function requirePlayer(store, body) {
  if (!validCode(body.code)) return "Missing conference code.";
  if (typeof body.pid !== "string" || !body.pid) return "Missing player.";
  const sec = await secret(store);
  if (body.key !== sign(sec, `player:${body.code}:${body.pid}`)) return "Your device is not signed in to this conference. Join again.";
  return null;
}

async function hostLoad(store, body) {
  const problem = await requireHost(store, body);
  if (problem) return fail(problem, 403);
  const state = await loadState(store, body.code);
  if (!state) return fail("No conference with that code (games are deleted after 7 days).", 404);
  const host = await store.get(`g/${body.code}/host`, { type: "json" });
  return json({ state, host, now: Date.now() });
}

async function hostPoll(store, body) {
  const problem = await requireHost(store, body);
  if (problem) return fail(problem, 403);
  const prefix = `g/${body.code}/a/`;
  // Keys are time-ordered, but two actions written at almost the same moment
  // can become visible out of order. So the teacher re-reads a window of
  // recent keys ("since") and names the ones already handled ("seen").
  const since = typeof body.since === "string" ? body.since : "";
  const seen = new Set(Array.isArray(body.seen) ? body.seen : []);
  const { blobs } = await store.list({ prefix });
  const fresh = blobs
    .map((b) => b.key.slice(prefix.length))
    .filter((k) => k > since && !seen.has(k))
    .sort()
    .slice(0, 150);
  const actions = await Promise.all(
    fresh.map(async (k) => {
      const data = await store.get(prefix + k, { type: "json" });
      return data ? { ...data, key: k } : null;
    }),
  );
  return json({ actions: actions.filter(Boolean), now: Date.now() });
}

async function hostWrite(store, body) {
  const problem = await requireHost(store, body);
  if (problem) return fail(problem, 403);
  const code = body.code;
  const writes = [];
  if (body.host) writes.push(store.setJSON(`g/${code}/host`, body.host));
  if (body.state) {
    const existing = await store.get(`g/${code}/state`, { type: "json" });
    const state = { ...body.state, code, createdAt: existing ? existing.createdAt : Date.now() };
    writes.push(store.setJSON(`g/${code}/state`, state));
  }
  for (const [del, doc] of Object.entries(body.dels || {})) {
    if (DELEGATION_IDS.has(del)) writes.push(store.setJSON(`g/${code}/d/${del}`, doc));
  }
  await Promise.all(writes);
  return json({ ok: true, now: Date.now() });
}

async function readNotebooks(store, body) {
  const problem = await requireHost(store, body);
  if (problem) return fail(problem, 403);
  const prefix = `g/${body.code}/nb/`;
  const { blobs } = await store.list({ prefix });
  const out = {};
  await Promise.all(
    blobs.map(async (b) => {
      out[b.key.slice(prefix.length)] = await store.get(b.key, { type: "json" });
    }),
  );
  return json({ notebooks: out });
}

async function join(store, body) {
  if (!validCode(body.code)) return fail("Conference codes are four letters.");
  const name = cleanName(body.name);
  const pid = playerIdFor(name);
  if (!pid) return fail("Type your first name.");
  const state = await loadState(store, body.code);
  if (!state) return fail("No conference with that code. Check the code on the board.", 404);
  const sec = await secret(store);
  const recordKey = `g/${body.code}/p/${pid}`;
  const existing = await store.get(recordKey, { type: "json" });
  if (existing && !body.claim) {
    return json({ exists: true, name: existing.name });
  }
  if (!existing) {
    await store.setJSON(recordKey, { name, joinedAt: Date.now() });
    await writeAction(store, body.code, { type: "join", pid, data: { name } });
  }
  const notebook = await store.get(`g/${body.code}/nb/${pid}`, { type: "json" });
  return json({
    pid,
    name: existing ? existing.name : name,
    key: sign(sec, `player:${body.code}:${pid}`),
    notebook: notebook || null,
  });
}

async function writeAction(store, code, action) {
  const id = `${String(Date.now()).padStart(14, "0")}-${randomBytes(4).toString("hex")}`;
  await store.setJSON(`g/${code}/a/${id}`, { ...action, t: Date.now() });
}

async function act(store, body) {
  const problem = await requirePlayer(store, body);
  if (problem) return fail(problem, 403);
  if (typeof body.type !== "string") return fail("Missing action type.");
  const size = JSON.stringify(body.data || {}).length;
  if (size > MAX_ACTION_BYTES) return fail("That message is too long.");
  if (body.type === "notebook") {
    await store.setJSON(`g/${body.code}/nb/${body.pid}`, body.data);
    return json({ ok: true });
  }
  await writeAction(store, body.code, { type: body.type, pid: body.pid, data: body.data || {} });
  return json({ ok: true, now: Date.now() });
}

async function poll(store, body) {
  const problem = await requirePlayer(store, body);
  if (problem) return fail(problem, 403);
  const state = await loadState(store, body.code);
  if (!state) return fail("This conference has ended or expired.", 404);
  const me = state.players && state.players[body.pid];
  let del = null;
  if (me && me.d && DELEGATION_IDS.has(me.d)) {
    del = await store.get(`g/${body.code}/d/${me.d}`, { type: "json" });
  }
  const sameState = body.v === state.v;
  return json({ state: sameState ? null : state, v: state.v, del, now: Date.now() });
}

export async function handle(req, store) {
  if (req.method !== "POST") return fail("Use POST.", 405);
  const raw = await req.text();
  if (raw.length > MAX_HOST_BYTES) return fail("Request too large.", 413);
  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return fail("Bad request.");
  }
  if (typeof body.code === "string") body.code = body.code.trim().toUpperCase();
  try {
    switch (body.op) {
      case "create":
        return await create(store, body);
      case "hostload":
        return await hostLoad(store, body);
      case "hostpoll":
        return await hostPoll(store, body);
      case "hostwrite":
        return await hostWrite(store, body);
      case "notebooks":
        return await readNotebooks(store, body);
      case "join":
        return await join(store, body);
      case "act":
        return await act(store, body);
      case "poll":
        return await poll(store, body);
      default:
        return fail("Unknown operation.");
    }
  } catch (err) {
    console.error("versailles error", err);
    return fail("The conference server had a problem. Try again in a moment.", 500);
  }
}
