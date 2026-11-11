// Tech tests for the "37 Days" game API (plan: test plan, tech tests). Run: node tests/july1914/api.test.mjs
// Uses the real handler with an in-memory store that mimics Netlify Blobs' conditional writes.
import { handle, _test } from '../../netlify/july1914/api.mjs';
import { BRIEFINGS } from '../../netlify/july1914/briefings.mjs';
import { NOTES, EVIDENCE } from '../../netlify/july1914/teacher.mjs';
import { memoryStore } from './memory-store.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('../../37-days/engine/scenario.js');
const G = require('../../37-days/engine/engine.js');
const X = require('../../37-days/engine/extras.js');
const P = S.POWERS;

let pass = 0, failN = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else failN++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '\n      ' + detail : ''}`); };
const words = t => t.trim().split(/\s+/).length;

function client(store) {
  const call = async body => { const r = await handle(store, body, {}); return { ...r.json, _status: r.status }; };
  return call;
}
async function newGame(store, extra = {}) {
  const call = client(store);
  const c = await call({ action: 'create', ...extra });
  const T = await call({ action: 'teacher', g: c.gid, k: c.teacherKey });
  return { call, g: c.gid, k: c.teacherKey, keys: T.keys, T };
}
async function next(ctx) {
  const T = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.k });
  const from = `${T.phase}:${T.round}:${T.step}:${T.stage}`;
  return ctx.call({ action: 'do', g: ctx.g, k: ctx.k, op: 'next', from });
}
const dev = (ctx, t, role) => ({ g: ctx.g, t, role, k: ctx.keys.roles[`${t}.${role}`] });

// ------------------------------------------------------------------ content checks
{
  const problems = [];
  for (const p of P) for (let r = 1; r <= 6; r++) for (const role of ['leader', 'general']) {
    const t = BRIEFINGS[p]?.[r]?.[role];
    if (!t) problems.push(`missing ${p} R${r} ${role}`);
    else if (words(t) > 60) problems.push(`${p} R${r} ${role}: ${words(t)} words`);
    if (t && /["“][^"”]{40,}["”]/.test(t)) problems.push(`${p} R${r} ${role}: long quotation (check it is sourced)`);
  }
  check('All 72 briefings exist and are 60 words or fewer', !problems.length, problems.join('; '));
  const longest = Math.max(...P.flatMap(p => [1, 2, 3, 4, 5, 6].flatMap(r => [words(BRIEFINGS[p][r].leader), words(BRIEFINGS[p][r].general)])));
  check('Briefing reading load reported', true, `longest briefing ${longest} words`);
  check('Teacher notes for all six rounds', [1, 2, 3, 4, 5, 6].every(r => NOTES[r]?.happened && NOTES[r]?.counterfactuals));
  check('Evidence packet items have a source line', EVIDENCE.every(e => e.source && e.text && words(e.text) <= 45));
  check('Round intros ≤ 35 words', Object.values(X.INTROS).every(t => words(t) <= 35));
  check('Glossary: about 25 terms, each with English and Vietnamese', X.GLOSSARY.length >= 20 && X.GLOSSARY.every(g => g.en && g.vi && g.match.length));
  check('Par scores match the prototype run (1914 path)', JSON.stringify(_test.PAR) === JSON.stringify({ AH: 3, DE: 1, RU: 5, FR: 5, GB: 4, RS: 5 }), JSON.stringify(_test.PAR));
}

// ------------------------------------------------------------------ public files contain no secrets
{
  const pub = ['37-days/engine/extras.js', '37-days/engine/content.js', '37-days/engine/scenario.js'];
  const dir = '37-days'; const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
  const files = walk(dir).filter(f => /\.(html|js|css|json)$/.test(f));
  const sample = [BRIEFINGS.DE[1].general, BRIEFINGS.AH[2].leader, BRIEFINGS.RS[6].general, NOTES[3].compressed, EVIDENCE[0].text].map(t => t.slice(0, 40));
  const leaks = files.filter(f => sample.some(s => fs.readFileSync(f, 'utf8').includes(s)));
  check('No briefing, teacher note or evidence text appears in any public file', !leaks.length, leaks.join(', '));
  check('Public engine files present', pub.every(f => fs.existsSync(f)));
  const toml = fs.readFileSync('netlify.toml', 'utf8');
  check('netlify.toml blocks /netlify/*, /tests/* and package files from static serving', ['/netlify/*', '/tests/*', '/node_modules/*', '/package.json'].every(x => toml.includes(`from = "${x}"`)) && /force = true/.test(toml));
}

// ------------------------------------------------------------------ full compressed session, 14 devices
const store = memoryStore();
const ctx = await newGame(store);
{
  check('Create returns a game code and teacher key', !!ctx.g && !!ctx.k);
  const roles = P.flatMap(p => X.roleSet(ctx.T.state.teams[p].size).map(r => [p, r]));
  check('Default roster is 13 students: five pairs and a German trio', roles.length === 13);
  // every device joins
  for (const [t, role] of roles) await ctx.call({ action: 'hello', ...dev(ctx, t, role) });
  const T = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.k });
  check('Teacher panel sees every device join', Object.values(T.presence).every(Boolean), JSON.stringify(T.presence));

  // wrong keys
  const bad = await ctx.call({ action: 'team', g: ctx.g, t: 'DE', role: 'leader', k: ctx.keys.roles['AH.leader'] });
  check('A link for one team cannot open another team’s view', bad._status === 403);
  const badT = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.keys.roles['AH.leader'] });
  check('A student key cannot open the teacher panel', badT._status === 403);
  const envoy2 = await ctx.call({ action: 'team', ...dev(ctx, 'AH', 'envoy') });
  check('A role not in use for a pair is refused (AH envoy)', envoy2._status === 403);
  const nogame = await ctx.call({ action: 'projector', g: 'zzzzzz' });
  check('Unknown game code gives 404', nogame._status === 404);

  // practice round
  await next(ctx); // practice open
  for (const p of P) await ctx.call({ action: 'submit', ...dev(ctx, p, 'leader'), choice: 'diplomat' });
  const gen = await ctx.call({ action: 'submit', ...dev(ctx, 'DE', 'general'), choice: 'ships' });
  check('Only the Leader can submit', gen._status === 403);
  await next(ctx); // reveal
  const pj = await ctx.call({ action: 'projector', g: ctx.g });
  check('Practice result tallies on the projector', pj.practice?.counts?.diplomat === 6);

  // rounds 1–6, historical choices with justifications, plus some oddities
  const twoDevicesRound = 2, lateRound = 3;
  let undoChecked = false;
  for (let r = 1; r <= 6; r++) {
    await next(ctx); // telegram
    let tv = await ctx.call({ action: 'team', ...dev(ctx, 'AH', 'leader') });
    check(`R${r}: team view shows round, menu and leader briefing`, tv.round === r && tv.menu?.length >= 2 && !!tv.briefings?.leader && !tv.briefings.general);
    const gv = await ctx.call({ action: 'team', ...dev(ctx, 'AH', 'general') });
    if (r === 1) check('General sees the military briefing only', !!gv.briefings.general && !gv.briefings.leader);
    if (r === 1) {
      const ev = await ctx.call({ action: 'team', ...dev(ctx, 'DE', 'envoy') });
      check('German Envoy (trio) sees the cabinet briefing', !!ev.briefings.leader);
    }
    await next(ctx); // council
    if (X.DIPLOMACY_ROUNDS.includes(r)) {
      await next(ctx); // diplomacy
      const pr = await ctx.call({ action: 'promise', ...dev(ctx, 'RU', 'general'), round: r, to: 'FR', text: `R${r}: Russia will not mobilize without telling you.` });
      if (r === 3) check('R3: promises to France are blocked while its leaders are at sea', pr._status === 409);
      else check(`R${r}: the pair's General logs a secret promise as Envoy`, pr.ok === true);
      const fr = await ctx.call({ action: 'team', ...dev(ctx, 'FR', 'leader') });
      if (r === 3) check('R3: France gets only radio fragments of others’ news', fr.telegrams.some(e => e.text.startsWith('[radio, fragment]')) && fr.blackout === true);
    }
    await next(ctx); // decision
    // Leaders pick the historical option (the teacher view flags it)
    const T2 = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.k });
    for (const p of P) {
      const choice = (T2.menus[p].find(x => x.hist) || T2.menus[p][0]).id;
      if (p === 'GB' && r === 4) continue; // Britain times out in round 4: default = what happened
      await ctx.call({ action: 'submit', ...dev(ctx, p, 'leader'), round: r, choice, justification: `${p} reasons for round ${r}` });
    }
    if (r === twoDevicesRound) {
      // a second device on the same Leader link changes the choice: the last one before the lock counts
      const other = T2.menus.FR.find(x => !x.hist).id;
      await ctx.call({ action: 'submit', ...dev(ctx, 'FR', 'leader'), round: r, choice: other, justification: 'second device' });
      const hist = T2.menus.FR.find(x => x.hist).id;
      await ctx.call({ action: 'submit', ...dev(ctx, 'FR', 'leader'), round: r, choice: hist, justification: 'FR reasons for round 2' });
    }
    const pj2 = await ctx.call({ action: 'projector', g: ctx.g });
    if (r === 4) check('R4: projector lights show who has decided (Britain still thinking)', pj2.lights.GB === 'thinking' && pj2.lights.AH === 'decided');
    const pjText = JSON.stringify(pj2);
    check(`R${r}: projector shows no briefing, choice or justification`, !pjText.includes('reasons for round') && !P.some(p => pjText.includes(BRIEFINGS[p][r].leader.slice(40, 90))));
    await next(ctx); // resolve -> result
    if (r === lateRound) {
      const late = await ctx.call({ action: 'submit', ...dev(ctx, 'AH', 'leader'), round: r, choice: 'goodwill' });
      check('A late submission after the lock is refused', late._status === 409);
    }
    const T3 = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.k });
    if (r === 4) check('R4: a team that missed the deadline gets what happened in 1914', T3.state.resolved[4].source.GB === 'timeout' && T3.state.resolved[4].choices.GB === 'conference');
    if (r === 2 && !undoChecked) {
      // undo round 2 and resolve it again: one click, same result
      const before = JSON.stringify(T3.state.resolved[2].choices);
      const u = await ctx.call({ action: 'do', g: ctx.g, k: ctx.k, op: 'undo', round: 2 });
      check('Undo puts round 2 back to the decision step', u.phase === 'round' && u.round === 2 && u.step === 'decision' && !u.state.resolved[2]);
      const u2 = await ctx.call({ action: 'do', g: ctx.g, k: ctx.k, op: 'next', from: 'round:2:decision:0' });
      check('Resolving again after undo gives the same choices', JSON.stringify(u2.state.resolved[2].choices) === before);
      const dbl = await ctx.call({ action: 'do', g: ctx.g, k: ctx.k, op: 'next', from: 'round:2:decision:0' });
      check('A double click on "next" does not skip a step', dbl._status === 409);
      undoChecked = true;
    }
  }
  const T4 = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.k });
  check('After round 6 the game moves to the ending', T4.next?.phase === 'ending');
  await next(ctx); // ending map
  const end = await ctx.call({ action: 'projector', g: ctx.g });
  check('Historical play through the API ends in general war', end.ending?.ending === 'general', end.ending?.ending);
  check('Ending map step hides scores', end.ending.scores === null && end.ending.replay === null);
  await next(ctx); // replay
  await next(ctx); // scores
  const sc = await ctx.call({ action: 'projector', g: ctx.g });
  check('Scores against 1914 on the projector equal par on the 1914 path', P.every(p => sc.ending.scores[p].total === sc.ending.scores[p].par), JSON.stringify(sc.ending.scores));
  const mine = await ctx.call({ action: 'team', ...dev(ctx, 'GB', 'general') });
  check('Each team sees its own score breakdown', mine.myScore?.parts?.length === 3 && mine.myScore.total === 4);

  // colour books
  await next(ctx);
  const cb = await ctx.call({ action: 'team', ...dev(ctx, 'DE', 'leader') });
  check('Colour Books: Leader sees own documents', cb.colour.docs.length >= 8);
  const one = await ctx.call({ action: 'colour', ...dev(ctx, 'DE', 'leader'), docs: [cb.colour.docs[0].id] });
  check('Colour Books need exactly two documents', one._status === 400);
  for (const p of P) {
    const v = await ctx.call({ action: 'team', ...dev(ctx, p, 'leader') });
    await ctx.call({ action: 'colour', ...dev(ctx, p, 'leader'), docs: v.colour.docs.slice(0, 2).map(d => d.id) });
  }
  // exit vote (stage 0)
  await next(ctx);
  for (const [t, role] of roles) await ctx.call({ action: 'vote', ...dev(ctx, t, role), stage: 0, power: t === 'RS' ? 'AH' : 'DE', reason: 'test' });
  const tv0 = await ctx.call({ action: 'teacher', g: ctx.g, k: ctx.k });
  check('Teacher sees how many votes are in', tv0.votesIn === 13 && tv0.votesExpected === 13);
  await next(ctx); // results
  const pv = await ctx.call({ action: 'projector', g: ctx.g });
  check('Exit vote tallied on the projector', pv.tallies[0].counts.DE === 11 && pv.tallies[0].counts.AH === 2);
  const st0 = await ctx.call({ action: 'team', ...dev(ctx, 'AH', 'leader') });
  check('No archive release before the archive lesson', st0.archive === null);
  await next(ctx); // break
  await next(ctx); // stage 1
  const a1 = await ctx.call({ action: 'team', ...dev(ctx, 'RU', 'general') });
  check('Stage 1 releases the Colour Books only', a1.archive?.colourBooks?.length === 6 && !a1.archive.fischer && a1.archive.colourBooks.every(c => c.docs.length === 2));
  await ctx.call({ action: 'vote', ...dev(ctx, 'RU', 'general'), stage: 1, power: 'AH' });
  await next(ctx); await next(ctx); // results, stage 2
  const a2 = await ctx.call({ action: 'team', ...dev(ctx, 'RU', 'general') });
  check('Stage 2 (Fischer) adds German and Austrian files, with briefings and justifications', a2.archive.fischer?.length === 2 && a2.archive.fischer[0].rounds[0].briefings.general && a2.archive.fischer[0].rounds[0].justification.includes('DE reasons') && !a2.archive.clark);
  await next(ctx); await next(ctx); // results, stage 3
  const a3 = await ctx.call({ action: 'team', ...dev(ctx, 'RU', 'general') });
  const ruPromises = a3.archive.clark.find(c => c.team === 'RU').rounds.filter(r => r.promise).length;
  check('Stage 3 (Clark) adds every archive, the logged promises and the evidence packet', a3.archive.clark?.length === 4 && a3.archive.evidence?.length >= 8 && ruPromises === 3, `RU promises ${ruPromises}`);
  await next(ctx); await next(ctx); // results, discussion
  const ex = await ctx.call({ action: 'export', g: ctx.g, k: ctx.k });
  check('Export holds the whole record', ex.format === '37-days-export-1' && Object.keys(ex.rounds).length === 6 && ex.log.length > 40 && ex.votes['0'] && ex.result.ending === 'general');
  check('Export justifications survive undo and resolve', ex.rounds[2].justifications.FR === 'FR reasons for round 2');

  // storage rule 1: one writer per key
  const writers = new Map();
  // replay the op log with knowledge of which action wrote; simpler: check that state is only set inside 'do'/'create'
  check('Store was never listed (no list operation exists on the store)', !('list' in store));
  void writers;
}

// ------------------------------------------------------------------ one writer per key
{
  const st = memoryStore();
  const c = await newGame(st);
  const actions = [];
  const wrap = async (who, body) => { const before = st.ops.length; await c.call(body); for (const op of st.ops.slice(before)) if (op[0] === 'set') actions.push([who, op[1]]); };
  await wrap('teacher', { action: 'do', g: c.g, k: c.k, op: 'next', from: 'lobby:0::0' });
  await wrap('AH.leader', { action: 'submit', ...dev(c, 'AH', 'leader'), choice: 'ships' });
  await wrap('AH.general', { action: 'hello', ...dev(c, 'AH', 'general') });
  await wrap('teacher', { action: 'do', g: c.g, k: c.k, op: 'skipPractice' });
  for (let i = 0; i < 3; i++) await wrap('teacher', { action: 'do', g: c.g, k: c.k, op: 'next' });
  await wrap('DE.envoy', { action: 'promise', ...dev(c, 'DE', 'envoy'), round: 1, to: 'AH', text: 'x' }); // round 1: no diplomacy
  const okWriters = actions.every(([who, key]) => who === 'teacher' ? key.endsWith('/state') : !key.endsWith('/state') && (key.includes(`/${who.split('.')[0]}`) ));
  check('Only teacher actions write the game state; each team writes only its own keys', okWriters, JSON.stringify(actions));
  const r1 = await c.call({ action: 'promise', ...dev(c, 'DE', 'envoy'), round: 1, to: 'AH', text: 'x' });
  check('No diplomacy window in round 1', r1._status === 409);
}

// ------------------------------------------------------------------ absent teams and the 1914 replay
{
  const st = memoryStore();
  const c = await newGame(st);
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'computer', team: 'RU', on: true });
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'computer', team: 'GB', on: true });
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'skipPractice' });
  let guard = 0, T;
  do { T = await next(c); guard++; } while (T.phase === 'round' && guard < 40);
  check('Two computer-played teams and nobody submitting: game still completes', T.phase === 'ending' && Object.values(T.state.resolved).every(r => r.source.RU === 'computer'));
  const rep = await c.call({ action: 'create', replay1914: true });
  const pr = await c.call({ action: 'projector', g: rep.gid });
  check('Ready-made "1914 replay" game starts at the ending with a full log', pr.phase === 'ending' && pr.ending.ending === 'general' && pr.publicLog.length > 20);
  // offline import: a peaceful game typed in from slips
  const choices = { 3: { RS: 'all' } };
  const imp = await c.call({ action: 'create', importChoices: choices });
  const ip = await c.call({ action: 'projector', g: imp.gid });
  check('Offline game import replays the choices through the engine', ip.phase === 'ending' && ip.ending.ending !== 'general', ip.ending?.ending);
  const badImp = await c.call({ action: 'create', importChoices: { 1: { DE: 'nonsense' } } });
  check('Offline import rejects an impossible choice', badImp._status === 400);
}

// ------------------------------------------------------------------ override and undo epoch
{
  const st = memoryStore();
  const c = await newGame(st);
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'skipPractice' });
  await next(c); await next(c); // council, decision (round 1)
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'override', round: 1, team: 'DE', choice: 'none' });
  await c.call({ action: 'submit', ...dev(c, 'DE', 'leader'), round: 1, choice: 'full' });
  let T = await next(c); // resolve
  check('Teacher override beats the team’s submission', T.state.resolved[1].choices.DE === 'none' && T.state.resolved[1].source.DE === 'teacher');
  T = await next(c); // round 2 telegram
  await c.call({ action: 'submit', ...dev(c, 'AH', 'leader'), round: 2, choice: 'firm' });
  const u = await c.call({ action: 'do', g: c.g, k: c.k, op: 'undo', round: 1 });
  check('Round 1 can be undone from round 2', u.round === 1 && u.step === 'decision');
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'override', round: 1, team: 'DE', choice: null });
  await next(c); await next(c); // resolve round 1 again (DE full via submission), round 2 telegram
  const v = await c.call({ action: 'team', ...dev(c, 'AH', 'leader') });
  check('After undo, submissions made on the old menus are discarded', v.submission === null && v.menu.some(x => x.id === 'harsh'));
  const lim = await c.call({ action: 'submit', ...dev(c, 'AH', 'leader'), round: 2, choice: 'harsh', justification: 'x'.repeat(5000) });
  const v2 = await c.call({ action: 'team', ...dev(c, 'AH', 'leader') });
  check('Justifications are capped at 400 characters', lim.ok && v2.submission.justification.length === 400);
}

// ------------------------------------------------------------------ join by typed code
{
  const st = memoryStore();
  const c = await newGame(st);
  const codes = c.keys.join || {};
  check('Every role has a 5-character join code, all different', Object.keys(codes).length === 18 && new Set(Object.values(codes)).size === 18 && Object.values(codes).every(x => /^[a-z0-9]{5}$/.test(x)));
  const j = await c.call({ action: 'join', g: c.g, code: codes['RU.general'] });
  check('Join code returns that role’s own link key', j.t === 'RU' && j.role === 'general' && j.k === c.keys.roles['RU.general']);
  const j2 = await c.call({ action: 'join', g: c.g, code: ` ${codes['FR.leader'].toUpperCase().replace(/(..)/, '$1-')} ` });
  check('Join code ignores capitals, spaces and dashes', j2.t === 'FR' && j2.role === 'leader');
  const bad = await c.call({ action: 'join', g: c.g, code: 'zzzzz' });
  check('A wrong join code is refused', bad._status === 403);
  const unused = await c.call({ action: 'join', g: c.g, code: codes['AH.envoy'] });
  check('A join code for a role not in use today is refused', unused._status === 403);
  const other = await newGame(st);
  const cross = await c.call({ action: 'join', g: other.g, code: codes['RU.general'] });
  check('A join code only works with its own game code', cross._status === 403 || cross.k !== c.keys.roles['RU.general']);
  const pv = JSON.stringify(await c.call({ action: 'projector', g: c.g })) + JSON.stringify(await c.call({ action: 'team', ...dev(c, 'RU', 'leader') }));
  check('Join codes never appear in projector or student views', !Object.values(codes).some(x => pv.includes(`"${x}"`)));
}

// ------------------------------------------------------------------ teacher code and concurrency
{
  const st = memoryStore();
  const r1 = await handle(st, { action: 'create' }, { requireCode: true });
  check('Live site refuses to create games until a teacher code is set', r1.status === 403);
  const r2 = await handle(st, { action: 'create', code: 'nope' }, { teacherCode: 'hanoi1914' });
  const r3 = await handle(st, { action: 'create', code: 'hanoi1914' }, { teacherCode: 'hanoi1914', requireCode: true });
  check('Teacher code is checked', r2.status === 403 && r3.status === 200);
  // two teacher windows clicking at once: conditional write stops a lost update
  const c = { call: client(st), g: r3.json.gid, k: r3.json.teacherKey };
  const [a, b] = await Promise.all([
    c.call({ action: 'do', g: c.g, k: c.k, op: 'computer', team: 'AH', on: true }),
    c.call({ action: 'do', g: c.g, k: c.k, op: 'computer', team: 'DE', on: true }),
  ]);
  const T = await c.call({ action: 'teacher', g: c.g, k: c.k });
  const both = T.state.teams.AH.computer && T.state.teams.DE.computer;
  check('Simultaneous teacher writes never silently lose an update', both || a._status === 409 || b._status === 409);
}

// ------------------------------------------------------------------ load: 14 devices polling every 2 s
{
  const st = memoryStore({ latencyMs: 40 }); // ~40 ms per blob operation
  const c = await newGame(st);
  await c.call({ action: 'do', g: c.g, k: c.k, op: 'skipPractice' });
  await next(c); await next(c);
  const devices = P.flatMap(p => X.roleSet(p === 'DE' ? 3 : 2).map(r => ({ action: 'team', ...dev(c, p, r) })));
  devices.push({ action: 'projector', g: c.g });
  const times = []; let errors = 0;
  for (let tick = 0; tick < 10; tick++) {
    await Promise.all(devices.map(async d => { const t0 = Date.now(); const r = await c.call(d); if (r._status !== 200) errors++; times.push(Date.now() - t0); }));
  }
  const tTeacher = Date.now(); await c.call({ action: 'teacher', g: c.g, k: c.k }); const teacherMs = Date.now() - tTeacher;
  times.sort((x, y) => x - y);
  const p95 = times[Math.floor(times.length * 0.95)];
  check('Load: 0 errors and 95% of poll responses under 1 s (40 ms per blob op, not counting network)', errors === 0 && p95 < 1000, `p95 ${p95} ms, teacher ${teacherMs} ms, ${times.length} requests`);
  const perPoll = st.ops.length / (devices.length * 10);
  check('Blob operations per poll stay small', perPoll < 4, `${perPoll.toFixed(2)} ops per request`);
}

// ------------------------------------------------------------------ offline slip pack is current
{
  const f = '37-days/engine/menu-variants.json';
  if (!fs.existsSync(f)) check('menu-variants.json exists (run tests/july1914/make-variants.mjs)', false);
  else {
    const { variants } = JSON.parse(fs.readFileSync(f, 'utf8'));
    const { collect } = await import('./make-variants.mjs');
    const fresh = collect(20000);
    const missing = Object.keys(fresh).filter(k => !variants[k]);
    check('Offline slip pack covers every menu variant the engine produces', !missing.length, missing.slice(0, 5).join(', '));
  }
}

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
