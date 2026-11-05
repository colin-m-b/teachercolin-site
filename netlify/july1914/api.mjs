// "37 Days": game API. Runs the tested engine (37-days/engine/*.js) unchanged.
//
// Storage rules (plan: tech architecture), each preventing a failure found while checking the platform:
//   1. One writer per key. Only teacher actions write the game state; each role writes only its own keys.
//   2. Strong consistency on every read (set where the store is opened, netlify/functions/july1914.mjs).
//   3. Separate stores per deploy context, so a preview can never touch a class session.
//   4. Secrets stay on the server: briefings are returned only to the matching role key.
//   5. Never rely on listing: every key read here is a known key.
//   6. No cached answers: the function sets no-store headers on every response.
//
// The store passed in needs: getJSON(key) -> {data, etag} | null, setJSON(key, value, {onlyIfMatch?, onlyIfNew?}) -> {modified}.

import G from '../../37-days/engine/engine.js';
import S from '../../37-days/engine/scenario.js';
import C from '../../37-days/engine/content.js';
import X from '../../37-days/engine/extras.js';
import { BRIEFINGS } from './briefings.mjs';
import { NOTES, EVIDENCE } from './teacher.mjs';

const P = S.POWERS;
const ROLES = ['leader', 'general', 'envoy'];
const LIMITS = { justification: 400, promise: 300, reason: 300 };

// ------------------------------------------------------------------ helpers
class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new ApiError(status, msg); };
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
function rid(n) {
  const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b);
  return [...b].map(x => ALPHA[x % ALPHA.length]).join('');
}
const K = {
  state: g => `g/${g}/state`,
  sub: (g, r, p) => `g/${g}/sub/${r}/${p}`,
  promise: (g, r, p) => `g/${g}/promise/${r}/${p}`,
  colour: (g, p) => `g/${g}/colour/${p}`,
  vote: (g, st, p, role) => `g/${g}/vote/${st}/${p}.${role}`,
  presence: (g, p, role) => `g/${g}/presence/${p}.${role}`,
};
const clip = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);
const eventText = e => C.EVENTS[e.id] || e.id;
const label = (m, id) => (m.find(x => x.id === id) || {}).label || id;
const marker = s => `${s.phase}:${s.round}:${s.step}:${s.stage}`;

// 1914 path: par scores and the "what really happened" replay, computed once from the engine itself.
const HISTORY = (() => {
  let s = G.newGame();
  for (let r = 1; r <= 6; r++) s = G.play(s, {}).state;
  return { state: s, result: G.finish(s) };
})();
const PAR = Object.fromEntries(P.map(p => [p, HISTORY.result.score[p].total]));
const REPLAY = HISTORY.state.log.filter(e => e.vis === 'public').map(e => ({ r: e.r, text: eventText(e) }));

function newState(gid, sizes) {
  const keys = { teacher: rid(16), roles: {} };
  for (const p of P) for (const role of ROLES) keys.roles[`${p}.${role}`] = rid(10);
  const teams = {};
  for (const p of P) teams[p] = { size: sizes?.[p] ?? (p === 'DE' ? 3 : 2), computer: false };
  return {
    gid, created: Date.now(), version: 1, keys, teams,
    phase: 'lobby', round: 0, step: '', stage: 0, timer: null,
    durations: { ...X.DEFAULT_SECONDS }, skipDiplomacy: false,
    engine: G.newGame(), snapshots: {}, resolved: {}, overrides: {}, epoch: {},
    promises: {}, colour: {}, tallies: {}, practice: null, endedAt: null,
  };
}

// ------------------------------------------------------------------ store wrappers
async function loadState(store, g) {
  if (!/^[a-z0-9]{4,12}$/.test(String(g || ''))) fail(404, 'No game with that code.');
  const r = await store.getJSON(K.state(g));
  if (!r) fail(404, 'No game with that code.');
  return r;
}
async function saveState(store, s, etag) {
  s.version += 1;
  const res = await store.setJSON(K.state(s.gid), s, etag ? { onlyIfMatch: etag } : {});
  if (res && res.modified === false) fail(409, 'The game changed in another window. Try again.');
  return s;
}
const read = async (store, key) => (await store.getJSON(key))?.data ?? null;
async function readMany(store, keys) {
  const out = {};
  for (let i = 0; i < keys.length; i += 24) {
    const chunk = keys.slice(i, i + 24);
    const vals = await Promise.all(chunk.map(k => read(store, k)));
    chunk.forEach((k, j) => { out[k] = vals[j]; });
  }
  return out;
}

// ------------------------------------------------------------------ auth
function asTeacher(s, k) { if (!k || k !== s.keys.teacher) fail(403, 'This teacher link is not valid.'); }
function asRole(s, t, role, k) {
  if (!P.includes(t) || !ROLES.includes(role)) fail(403, 'This link is not valid.');
  if (!k || s.keys.roles[`${t}.${role}`] !== k) fail(403, 'This link is not valid for that team.');
  const pw = X.powers(s.teams[t].size, role);
  if (!pw) fail(403, `Your team has ${s.teams[t].size} player(s) today, so this role is not in use. Ask your teacher.`);
  return pw;
}

// ------------------------------------------------------------------ round logic
const roundOpen = s => s.phase === 'round' && s.step !== 'result' && !s.resolved[s.round];
const blackout = (s, p, r) => p === 'FR' && r === 3 && !!s.engine.f.blackoutFR;
const diplomacyRound = s => X.DIPLOMACY_ROUNDS.includes(s.round) && !s.skipDiplomacy;
function currentMenu(s, p) {
  if (!roundOpen(s)) return null;
  return G.menu(s.engine, s.round, p);
}
function validSub(s, r, sub) {
  return sub && (sub.epoch || 0) === (s.epoch[r] || 0) ? sub : null;
}

async function resolveRound(store, s) {
  const r = s.round;
  const subs = await readMany(store, P.map(p => K.sub(s.gid, r, p)));
  const proms = await readMany(store, P.map(p => K.promise(s.gid, r, p)));
  const choices = {}, source = {}, labels = {}, justifications = {};
  for (const p of P) {
    const m = G.menu(s.engine, r, p);
    const sub = validSub(s, r, subs[K.sub(s.gid, r, p)]);
    const ov = s.overrides[r]?.[p];
    if (ov && m.some(x => x.id === ov)) { choices[p] = ov; source[p] = 'teacher'; }
    else if (s.teams[p].computer) { source[p] = 'computer'; }
    else if (sub && m.some(x => x.id === sub.choice)) { choices[p] = sub.choice; source[p] = 'team'; justifications[p] = sub.justification || ''; }
    else source[p] = 'timeout';
  }
  s.snapshots[r] = s.engine;
  const before = s.engine;
  const { state, timedOut } = G.play(s.engine, choices);
  for (const p of P) labels[p] = label(G.menu(before, r, p), state.ch[r][p]);
  s.engine = state;
  s.resolved[r] = { choices: state.ch[r], source, labels, justifications, timedOut, at: Date.now() };
  s.promises[r] = Object.fromEntries(P.map(p => [p, proms[K.promise(s.gid, r, p)]]).filter(([, v]) => v));
}

// The sequence the teacher's single "next" button walks through.
function nextMarker(s) {
  const { phase, round, step } = s;
  if (phase === 'lobby') return { phase: 'practice', round: 0, step: 'open' };
  if (phase === 'practice') return step === 'open' ? { phase: 'practice', round: 0, step: 'reveal' } : { phase: 'round', round: 1, step: 'telegram' };
  if (phase === 'round') {
    if (step === 'telegram') return { phase, round, step: 'council' };
    if (step === 'council') return { phase, round, step: diplomacyRound(s) ? 'diplomacy' : 'decision' };
    if (step === 'diplomacy') return { phase, round, step: 'decision' };
    if (step === 'decision') return { phase, round, step: 'result', resolve: true };
    if (step === 'result') return round < 6 ? { phase, round: round + 1, step: 'telegram' } : { phase: 'ending', round: 6, step: 'map' };
  }
  if (phase === 'ending') {
    if (step === 'map') return { phase, round, step: 'replay' };
    if (step === 'replay') return { phase, round, step: 'scores' };
    return { phase: 'colour', round, step: 'choose' };
  }
  if (phase === 'colour') return { phase: 'vote', round, step: 'open', stage: 0, collectColour: true };
  if (phase === 'vote') {
    if (step === 'open') return { phase, round, step: 'results', stage: s.stage, tally: true };
    if (s.stage < 3) return { phase: s.stage === 0 ? 'break' : 'vote', round, step: s.stage === 0 ? 'wait' : 'open', stage: s.stage === 0 ? 0 : s.stage + 1 };
    return { phase: 'discussion', round, step: 'all', stage: 3 };
  }
  if (phase === 'break') return { phase: 'vote', round, step: 'open', stage: 1 };
  if (phase === 'discussion') return { phase: 'done', round, step: '', stage: 3 };
  return null;
}

function startTimer(s) {
  const sec = s.phase === 'round' ? s.durations[s.step] : null;
  s.timer = sec ? { step: s.step, endsAt: Date.now() + sec * 1000, seconds: sec } : null;
}

async function tally(store, s, stage) {
  const keys = [];
  for (const p of P) for (const role of X.roleSet(s.teams[p].size)) keys.push(K.vote(s.gid, stage, p, role));
  const votes = await readMany(store, keys);
  const counts = Object.fromEntries(P.map(p => [p, 0]));
  const reasons = [];
  for (const k of keys) {
    const v = votes[k];
    if (v && P.includes(v.power)) { counts[v.power] += 1; reasons.push({ by: k.split('/').pop(), power: v.power, reason: v.reason || '' }); }
  }
  s.tallies[stage] = { counts, reasons, total: reasons.length };
}

// ------------------------------------------------------------------ views
function teamTelegrams(s, p, role) {
  const vis = G.visibleTo(s.engine, p);
  const curR = s.round;
  return vis.map(e => {
    const by = e.by == null ? [] : [].concat(e.by);
    let text = eventText(e);
    // French blackout: at sea during round 3, the team gets only radio fragments of others' news.
    if (s.phase === 'round' && curR === 3 && s.engine.f.blackoutFR && p === 'FR' && (e.r === 2 || e.r === 3) && !by.includes('FR')) text = fragment(text);
    return { r: e.r, id: e.id, text, public: e.vis === 'public', mine: by.includes(p) };
  });
}
function fragment(t) {
  const w = t.split(/\s+/); const out = []; let gap = false;
  w.forEach((x, i) => { if (i % 5 < 3) { out.push(x); gap = false; } else if (!gap) { out.push('…'); gap = true; } });
  return '[radio, fragment] ' + out.join(' ');
}
function documentsFor(s, p) {
  const docs = [];
  for (let r = 1; r <= 6; r++) {
    const res = s.resolved[r]; if (!res) continue;
    const why = res.justifications[p];
    docs.push({ id: `d${r}`, r, kind: 'decision', text: `${X.teamName(p, r)}, round ${r} (${S.ROUNDS[r - 1].dates}): decided to “${res.labels[p]}”.` + (why ? ` Reason given: ${why}` : '') });
  }
  s.engine.log.forEach((e, i) => {
    if (e.vis !== 'public' && Array.isArray(e.vis) && e.vis.includes(p)) docs.push({ id: `e${i}`, r: e.r, kind: 'telegram', text: eventText(e) });
  });
  return docs;
}
function teamRecord(s, p) {
  const out = [];
  for (let r = 1; r <= 6; r++) {
    const res = s.resolved[r]; if (!res) continue;
    out.push({ r, decision: res.labels[p], source: res.source[p], justification: res.justifications[p] || '', promise: s.promises[r]?.[p] || null,
      briefings: { leader: BRIEFINGS[p][r].leader, general: BRIEFINGS[p][r].general } });
  }
  const telegrams = G.visibleTo(s.engine, p).filter(e => e.vis !== 'public').map(e => ({ r: e.r, text: eventText(e) }));
  return { team: p, name: X.TEAM[p].name, rounds: out, privateTelegrams: telegrams };
}
function archiveFor(s) {
  const st = s.phase === 'vote' || s.phase === 'discussion' || s.phase === 'done' ? s.stage : 0;
  if (st < 1) return null;
  const a = { stage: st };
  a.colourBooks = P.map(p => {
    const ids = s.colour[p] || [];
    const docs = documentsFor(s, p).filter(d => ids.includes(d.id));
    return { team: p, name: X.TEAM[p].name, docs };
  });
  if (st >= 2) a.fischer = ['DE', 'AH'].map(p => teamRecord(s, p));
  if (st >= 3) { a.clark = ['RU', 'FR', 'GB', 'RS'].map(p => teamRecord(s, p)); a.evidence = EVIDENCE; }
  return a;
}
function endingView(s) {
  if (!['ending', 'colour', 'vote', 'break', 'discussion', 'done'].includes(s.phase)) return null;
  const fin = G.finish(s.engine);
  const show = s.phase !== 'ending' ? 'scores' : s.step;
  return {
    ending: fin.ending, endingText: C.ENDINGS[fin.ending],
    modifiers: fin.modifiers.map(m => C.MODIFIERS[m]),
    war: s.engine.f.war || [],
    show,
    replay: show !== 'map' ? REPLAY : null,
    scores: show === 'scores' ? Object.fromEntries(P.map(p => [p, { total: fin.score[p].total, par: PAR[p] }])) : null,
    peace: !(s.engine.f.war || []).length,
  };
}
const common = s => ({
  gid: s.gid, version: s.version, now: Date.now(), phase: s.phase, round: s.round, step: s.step, stage: s.stage, timer: s.timer,
  dates: s.round ? S.ROUNDS[s.round - 1].dates : null, title: s.round ? S.ROUNDS[s.round - 1].title : null,
  diplomacyThisRound: s.phase === 'round' && diplomacyRound(s),
});

async function lights(store, s) {
  if (s.phase === 'practice') {
    const subs = await readMany(store, P.map(p => K.sub(s.gid, 0, p)));
    return Object.fromEntries(P.map(p => [p, s.teams[p].computer ? 'computer' : subs[K.sub(s.gid, 0, p)] ? 'decided' : 'thinking']));
  }
  if (!roundOpen(s)) return null;
  const subs = await readMany(store, P.map(p => K.sub(s.gid, s.round, p)));
  return Object.fromEntries(P.map(p => {
    if (s.overrides[s.round]?.[p]) return [p, 'decided'];
    if (s.teams[p].computer) return [p, 'computer'];
    return [p, validSub(s, s.round, subs[K.sub(s.gid, s.round, p)]) ? 'decided' : 'thinking'];
  }));
}

async function projectorView(store, s) {
  const v = common(s);
  v.teams = Object.fromEntries(P.map(p => [p, { name: X.teamName(p, s.round), computer: s.teams[p].computer }]));
  v.lights = await lights(store, s);
  v.intro = s.phase === 'round' ? X.INTROS[s.round] : null;
  v.publicLog = s.engine.log.filter(e => e.vis === 'public').map(e => ({ r: e.r, text: eventText(e) }));
  if (s.phase === 'practice' && s.step === 'reveal') v.practice = s.practice;
  v.ending = endingView(s);
  v.tallies = s.tallies;
  v.voteQuestion = endingView(s)?.peace ? X.VOTE_QUESTION_PEACE : X.VOTE_QUESTION;
  return v;
}

async function teamView(store, s, t, role, pw) {
  const v = common(s);
  v.team = t; v.role = role; v.size = s.teams[t].size; v.powers = pw;
  v.teamName = X.teamName(t, s.round || 1);
  v.computer = s.teams[t].computer;
  v.objectives = S.OBJECTIVES[t].map((text, i) => ({ text, max: X.OBJ_MAX[t][i] }));
  v.telegrams = teamTelegrams(s, t, role);
  v.intro = s.phase === 'round' ? X.INTROS[s.round] : null;
  v.blackout = s.phase === 'round' && blackout(s, t, s.round);
  if (s.phase === 'practice') {
    v.practice = { ...X.PRACTICE, open: s.step === 'open', mine: await read(store, K.sub(s.gid, 0, t)), result: s.step === 'reveal' ? s.practice : null };
  }
  if (s.phase === 'round' && s.round >= 1) {
    const r = s.round;
    v.briefings = Object.fromEntries(pw.briefings.map(b => [b, BRIEFINGS[t][r][b]]));
    const m = currentMenu(s, t);
    v.menu = m ? m.map(x => ({ id: x.id, label: x.label })) : null;
    v.open = !!m;
    const sub = validSub(s, r, await read(store, K.sub(s.gid, r, t)));
    v.submission = sub ? { choice: sub.choice, label: m ? label(m, sub.choice) : s.resolved[r]?.labels[t], justification: sub.justification, at: sub.at } : null;
    v.override = !!s.overrides[r]?.[t];
    if (s.resolved[r]) v.resolved = { label: s.resolved[r].labels[t], source: s.resolved[r].source[t] };
    if (pw.envoy && diplomacyRound(s)) {
      v.diplomacy = { open: (s.step === 'diplomacy' || s.step === 'decision') && !s.resolved[r] && !blackout(s, t, r),
        blocked: blackout(s, t, r), franceAtSea: blackout(s, 'FR', r) && t !== 'FR',
        promise: await read(store, K.promise(s.gid, r, t)) };
    }
    v.starters = X.STARTERS;
  }
  v.ending = endingView(s);
  if (v.ending?.scores) {
    const fin = G.finish(s.engine).score[t];
    v.myScore = { parts: fin.parts, prestige: fin.prestige, total: fin.total, par: PAR[t] };
  }
  if (s.phase === 'colour' && pw.submit) v.colour = { docs: documentsFor(s, t), chosen: (await read(store, K.colour(s.gid, t)))?.docs || [] };
  if (s.phase === 'colour' && !pw.submit) v.colour = { docs: documentsFor(s, t), chosen: null };
  if (s.phase === 'vote') {
    v.vote = { stage: s.stage, open: s.step === 'open', question: endingView(s)?.peace ? X.VOTE_QUESTION_PEACE : X.VOTE_QUESTION,
      mine: await read(store, K.vote(s.gid, s.stage, t, role)), tally: s.tallies[s.stage] || null };
  }
  v.archive = archiveFor(s);
  return v;
}

async function teacherView(store, s) {
  const v = common(s);
  v.state = { teams: s.teams, durations: s.durations, skipDiplomacy: s.skipDiplomacy, resolved: s.resolved, overrides: s.overrides, practice: s.practice };
  v.keys = s.keys;
  v.next = nextMarker(s);
  v.lights = await lights(store, s);
  v.teamNames = Object.fromEntries(P.map(p => [p, X.teamName(p, s.round || 1)]));
  if (['lobby', 'practice'].includes(s.phase) || (s.phase === 'round' && s.round === 1 && s.step === 'telegram')) {
    const keys = []; for (const p of P) for (const role of X.roleSet(s.teams[p].size)) keys.push(K.presence(s.gid, p, role));
    const pres = await readMany(store, keys);
    v.presence = Object.fromEntries(keys.map(k => [k.split('/').pop(), pres[k]?.at || null]));
  }
  if (s.phase === 'practice') {
    const subs = await readMany(store, P.map(p => K.sub(s.gid, 0, p)));
    v.practiceSubs = Object.fromEntries(P.map(p => [p, subs[K.sub(s.gid, 0, p)]?.choice || null]));
  }
  if (s.phase === 'round') {
    const r = s.round;
    v.note = NOTES[r];
    v.menus = Object.fromEntries(P.map(p => [p, G.menu(s.resolved[r] ? s.snapshots[r] : s.engine, r, p).map(x => ({ id: x.id, label: x.label, hist: !!x.hist }))]));
    const subs = await readMany(store, P.map(p => K.sub(s.gid, r, p)));
    v.subs = Object.fromEntries(P.map(p => {
      const raw = subs[K.sub(s.gid, r, p)], ok = validSub(s, r, raw);
      return [p, ok ? { choice: ok.choice, label: label(v.menus[p], ok.choice), justification: ok.justification, at: ok.at } : raw ? { stale: true } : null];
    }));
    if (X.DIPLOMACY_ROUNDS.includes(r)) {
      const pr = s.resolved[r] ? s.promises[r] || {} : await (async () => {
        const got = await readMany(store, P.map(p => K.promise(s.gid, r, p)));
        return Object.fromEntries(P.map(p => [p, got[K.promise(s.gid, r, p)]]).filter(([, x]) => x));
      })();
      v.promises = pr;
    }
    v.telegrams = s.engine.log.filter(e => e.r === (s.resolved[r] ? r : r - 1)).map(e => ({ r: e.r, text: eventText(e), vis: e.vis }));
  }
  if (s.phase === 'colour') {
    const got = await readMany(store, P.map(p => K.colour(s.gid, p)));
    v.colour = Object.fromEntries(P.map(p => [p, got[K.colour(s.gid, p)]?.docs || []]));
  }
  if (s.phase === 'vote' && s.step === 'open') {
    const keys = []; for (const p of P) for (const role of X.roleSet(s.teams[p].size)) keys.push(K.vote(s.gid, s.stage, p, role));
    const got = await readMany(store, keys);
    v.votesIn = keys.filter(k => got[k]).length; v.votesExpected = keys.length;
  }
  v.ending = endingView(s);
  if (v.ending) v.fullScores = G.finish(s.engine).score;
  v.tallies = s.tallies;
  v.undoable = undoTarget(s);
  return v;
}

function undoTarget(s) {
  // The last resolved round can be undone until the next round has been resolved.
  const last = Math.max(0, ...Object.keys(s.resolved).map(Number));
  if (!last) return null;
  if (s.phase === 'round' && (s.round === last || (s.round === last + 1 && !s.resolved[s.round]))) return last;
  if (s.phase === 'ending' && last === 6) return 6;
  return null;
}

async function exportAll(store, s) {
  const keys = [];
  for (let st = 0; st <= 3; st++) for (const p of P) for (const role of ROLES) keys.push(K.vote(s.gid, st, p, role));
  const votes = await readMany(store, keys);
  const allVotes = {};
  for (const k of keys) if (votes[k]) { const [, , , st, who] = k.split('/'); (allVotes[st] ||= {})[who] = votes[k]; }
  const fin = s.engine.round === 6 ? G.finish(s.engine) : null;
  return {
    format: '37-days-export-1', exportedAt: new Date().toISOString(), gid: s.gid, teams: s.teams,
    rounds: Object.fromEntries(Object.entries(s.resolved).map(([r, res]) => [r, { dates: S.ROUNDS[r - 1].dates, title: S.ROUNDS[r - 1].title, ...res, promises: s.promises[r] || {} }])),
    log: s.engine.log.map(e => ({ ...e, text: eventText(e) })),
    flags: s.engine.f, prestige: s.engine.prestige,
    result: fin ? { ending: fin.ending, endingText: C.ENDINGS[fin.ending], modifiers: fin.modifiers, score: fin.score, par: PAR } : null,
    colourBooks: s.colour, tallies: s.tallies, votes: allVotes,
    records: P.map(p => teamRecord(s, p)), evidence: EVIDENCE, notes: NOTES,
    choices: Object.fromEntries(Object.entries(s.resolved).map(([r, res]) => [r, res.choices])),
  };
}

// Rebuild a game from a choices record (offline mode import, or the ready-made 1914 replay).
function replayChoices(s, choices) {
  for (let r = 1; r <= 6; r++) {
    const c = choices?.[r] || {};
    for (const p of P) { const m = G.menu(s.engine, r, p); if (c[p] != null && !m.some(x => x.id === c[p])) fail(400, `Round ${r}: "${c[p]}" is not a valid choice for ${p}.`); }
    s.round = r;
    const before = s.engine;
    const { state } = G.play(before, c);
    s.snapshots[r] = before;
    s.resolved[r] = { choices: state.ch[r], source: Object.fromEntries(P.map(p => [p, c[p] ? 'imported' : 'timeout'])),
      labels: Object.fromEntries(P.map(p => [p, label(G.menu(before, r, p), state.ch[r][p])])), justifications: choices?.justifications?.[r] || {}, timedOut: [], at: Date.now() };
    s.engine = state;
  }
  s.phase = 'ending'; s.step = 'map'; s.round = 6;
}

// ------------------------------------------------------------------ main entry
export async function handle(store, body, env = {}) {
  try {
    const a = body?.action;
    if (a === 'create') return { status: 200, json: await create(store, body, env) };
    const s0 = await loadState(store, body.g);
    const s = s0.data, etag = s0.etag;
    switch (a) {
      case 'projector': return ok(await projectorView(store, s));
      case 'team': { const pw = asRole(s, body.t, body.role, body.k); return ok(await teamView(store, s, body.t, body.role, pw)); }
      case 'hello': { asRole(s, body.t, body.role, body.k); await store.setJSON(K.presence(s.gid, body.t, body.role), { at: Date.now() }); return ok({ ok: true }); }
      case 'submit': return ok(await submit(store, s, body));
      case 'promise': return ok(await promise(store, s, body));
      case 'colour': return ok(await colour(store, s, body));
      case 'vote': return ok(await vote(store, s, body));
      case 'teacher': asTeacher(s, body.k); return ok(await teacherView(store, s));
      case 'export': asTeacher(s, body.k); return ok(await exportAll(store, s));
      case 'do': asTeacher(s, body.k); await teacherAction(store, s, body); await saveState(store, s, etag); return ok(await teacherView(store, s));
      default: fail(400, 'Unknown action.');
    }
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, json: { error: e.message } };
    console.error(e);
    return { status: 500, json: { error: 'Server error. Try again; if it keeps happening, use offline mode.' } };
  }
}
const ok = json => ({ status: 200, json });

async function create(store, body, env) {
  const need = env.teacherCode;
  if (need ? body.code !== need : env.requireCode) fail(403, need ? 'Wrong teacher code.' : 'Set JULY1914_TEACHER_CODE in Netlify before creating games on the live site.');
  let gid, s;
  for (let i = 0; i < 5; i++) {
    gid = rid(6);
    s = newState(gid, body.sizes);
    if (body.replay1914) replayChoices(s, {});
    else if (body.importChoices) replayChoices(s, body.importChoices);
    const res = await store.setJSON(K.state(gid), s, { onlyIfNew: true });
    if (!res || res.modified !== false) return { gid, teacherKey: s.keys.teacher };
  }
  fail(500, 'Could not create a game code. Try again.');
}

async function submit(store, s, b) {
  const pw = asRole(s, b.t, b.role, b.k);
  if (!pw.submit) fail(403, 'Only your Leader can submit the decision.');
  if (s.phase === 'practice') {
    if (s.step !== 'open') fail(409, 'The practice round is closed.');
    if (!X.PRACTICE.options.some(o => o.id === b.choice)) fail(400, 'Choose one of the options.');
    await store.setJSON(K.sub(s.gid, 0, b.t), { choice: b.choice, at: Date.now() });
    return { ok: true };
  }
  if (!roundOpen(s) || b.round !== s.round) fail(409, 'Too late: this round is locked.');
  const m = currentMenu(s, b.t);
  if (!m.some(x => x.id === b.choice)) fail(400, 'Choose one of the options.');
  await store.setJSON(K.sub(s.gid, s.round, b.t), { choice: b.choice, justification: clip(b.justification, LIMITS.justification), at: Date.now(), epoch: s.epoch[s.round] || 0 });
  return { ok: true };
}

async function promise(store, s, b) {
  const pw = asRole(s, b.t, b.role, b.k);
  if (!pw.envoy) fail(403, 'Only your Envoy logs promises.');
  if (!(s.phase === 'round' && diplomacyRound(s) && (s.step === 'diplomacy' || s.step === 'decision') && !s.resolved[s.round] && b.round === s.round)) fail(409, 'The diplomacy window is closed.');
  if (blackout(s, b.t, s.round)) fail(409, 'You are at sea: no diplomacy this round.');
  if (!P.includes(b.to) || b.to === b.t) fail(400, 'Choose the team you visited.');
  if (blackout(s, b.to, s.round)) fail(409, 'France’s leaders are at sea this round.');
  const text = clip(b.text, LIMITS.promise);
  if (!text) fail(400, 'Write the promise.');
  await store.setJSON(K.promise(s.gid, s.round, b.t), { to: b.to, text, at: Date.now() });
  return { ok: true };
}

async function colour(store, s, b) {
  const pw = asRole(s, b.t, b.role, b.k);
  if (!pw.submit) fail(403, 'Your Leader chooses the documents.');
  if (s.phase !== 'colour') fail(409, 'Colour Books are closed.');
  const ids = documentsFor(s, b.t).map(d => d.id);
  const docs = [...new Set((b.docs || []).filter(d => ids.includes(d)))];
  if (docs.length !== 2) fail(400, 'Choose exactly two documents.');
  await store.setJSON(K.colour(s.gid, b.t), { docs, at: Date.now() });
  return { ok: true };
}

async function vote(store, s, b) {
  asRole(s, b.t, b.role, b.k);
  if (!(s.phase === 'vote' && s.step === 'open' && b.stage === s.stage)) fail(409, 'Voting is closed.');
  if (!P.includes(b.power)) fail(400, 'Choose a power.');
  await store.setJSON(K.vote(s.gid, s.stage, b.t, b.role), { power: b.power, reason: clip(b.reason, LIMITS.reason), at: Date.now() });
  return { ok: true };
}

async function teacherAction(store, s, b) {
  const op = b.op;
  if (op === 'next' || op === 'skipPractice') {
    if (b.from && b.from !== marker(s)) fail(409, 'Already moved on (another click or window).');
    let n = op === 'skipPractice' && ['lobby', 'practice'].includes(s.phase) ? { phase: 'round', round: 1, step: 'telegram' } : nextMarker(s);
    if (!n) fail(409, 'The game is over.');
    if (n.resolve) await resolveRound(store, s);
    if (s.phase === 'practice' && n.step === 'reveal') {
      const subs = await readMany(store, P.map(p => K.sub(s.gid, 0, p)));
      const counts = Object.fromEntries(X.PRACTICE.options.map(o => [o.id, 0]));
      for (const p of P) { const c = subs[K.sub(s.gid, 0, p)]?.choice; if (c in counts) counts[c] += 1; }
      s.practice = { counts, options: X.PRACTICE.options };
    }
    if (n.collectColour) {
      const got = await readMany(store, P.map(p => K.colour(s.gid, p)));
      s.colour = Object.fromEntries(P.map(p => [p, got[K.colour(s.gid, p)]?.docs || []]));
    }
    if (n.tally) await tally(store, s, s.stage);
    s.phase = n.phase; s.round = n.round; s.step = n.step; if (n.stage != null) s.stage = n.stage;
    if (s.phase === 'ending' && !s.endedAt) s.endedAt = Date.now();
    startTimer(s);
    return;
  }
  if (op === 'undo') {
    const r = undoTarget(s);
    if (!r || b.round !== r) fail(409, 'Nothing to undo.');
    s.engine = s.snapshots[r];
    delete s.snapshots[r]; delete s.resolved[r]; delete s.promises[r];
    s.epoch[r + 1] = (s.epoch[r + 1] || 0) + 1; // submissions made for the next round saw menus from the undone result
    s.phase = 'round'; s.round = r; s.step = 'decision'; s.endedAt = null;
    startTimer(s);
    return;
  }
  if (op === 'override') {
    if (!roundOpen(s) || b.round !== s.round || !P.includes(b.team)) fail(409, 'Overrides are only possible while the round is open.');
    s.overrides[s.round] ||= {};
    if (!b.choice) delete s.overrides[s.round][b.team];
    else {
      if (!currentMenu(s, b.team).some(x => x.id === b.choice)) fail(400, 'Not a valid option.');
      s.overrides[s.round][b.team] = b.choice;
    }
    return;
  }
  if (op === 'computer') { if (!P.includes(b.team)) fail(400, 'Bad team.'); s.teams[b.team].computer = !!b.on; return; }
  if (op === 'size') { if (!P.includes(b.team) || ![1, 2, 3].includes(b.size)) fail(400, 'Team size must be 1, 2 or 3.'); s.teams[b.team].size = b.size; return; }
  if (op === 'timer') {
    if (b.stop) s.timer = null;
    else if (s.timer) s.timer.endsAt = Math.max(s.timer.endsAt, Date.now()) + (Number(b.add) || 30) * 1000;
    else if (s.phase === 'round') s.timer = { step: s.step, endsAt: Date.now() + (Number(b.add) || 30) * 1000, seconds: Number(b.add) || 30 };
    return;
  }
  if (op === 'settings') {
    if (b.durations) for (const k of Object.keys(X.DEFAULT_SECONDS)) { const n = Number(b.durations[k]); if (n >= 10 && n <= 900) s.durations[k] = Math.round(n); }
    if (b.skipDiplomacy != null) s.skipDiplomacy = !!b.skipDiplomacy;
    return;
  }
  fail(400, 'Unknown teacher action.');
}

export const _test = { HISTORY, PAR, REPLAY, nextMarker, fragment, K };
