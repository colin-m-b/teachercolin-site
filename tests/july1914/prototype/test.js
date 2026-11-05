'use strict';
// Design tests for "37 Days". Run: node test.js
const S = require('../../../37-days/engine/scenario'), G = require('../../../37-days/engine/engine'), C = require('../../../37-days/engine/content');
const P = S.POWERS;
const N = Number(process.env.N || 200000);

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const results = []; let failures = 0, warnings = 0;
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); if (!ok) failures++; };
const warn = (name, detail = '') => { results.push({ name, ok: null, detail }); warnings++; };
const pct = x => (100 * x).toFixed(1) + '%';
const words = t => t.trim().split(/\s+/).length;

const pickU = (m, u) => m[Math.min(m.length - 1, Math.floor(u * m.length))].id;
// Tension index: how heated the crisis is, as a class would feel it from the telegrams.
function tension(f) {
  let T = 0;
  if (f.support === 'full') T += 1;
  if (f.demand === 'harsh') T += 1;
  if (f.relations === 'broken') T += 1; else if (f.relations === 'eased') T -= 1.5;
  if (f.ahSerbWar) T += 1.5;
  if (f.conference) T -= 1.5;
  if (f.settled) T -= 2;
  if (f.rusMob === 'general') T += 1.5; else if (f.rusMob === 'partial') T += 0.5;
  if (f.deUltimatum) T += 1;
  if (f.frPromised) T += 0.5;
  return T;
}
const CLASS = { pHist: 0.3, beta: 0.9, theta: 2 }; // fixed before testing; not tuned to pass
function classPick(m, u1, u2, s) {
  if (u1 < CLASS.pHist) return m.find(x => x.def).id;
  const T = tension(s.f), w = m.map(x => Math.exp(CLASS.beta * (x.esc - 1) * (T - CLASS.theta)));
  let acc = 0, tot = w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < m.length; k++) { acc += w[k] / tot; if (u2 < acc) return m[k].id; }
  return m[m.length - 1].id;
}
const MODELS = {
  class: (m, R, s) => classPick(m, R(), R(), s),
  random: (m, R) => pickU(m, R()),
  history60: (m, R) => (R() < 0.6 ? m.find(x => x.def).id : pickU(m, R())),
  hawk: (m, R) => { const mx = Math.max(...m.map(x => x.esc)); return pickU(m.filter(x => x.esc === mx), R()); },
  dove: (m, R) => { const mn = Math.min(...m.map(x => x.esc)); return pickU(m.filter(x => x.esc === mn), R()); },
  mixed: (m, R) => { const u = R(); if (u < 0.4) return m.find(x => x.def).id; return u < 0.7 ? MODELS.hawk(m, R) : MODELS.dove(m, R); },
};

// --- structural checks run on every menu and every log entry seen
const menuProblems = new Set(), eventProblems = new Set(), emitted = new Set(), feedbackGaps = new Set();
const menuVariants = new Set(); let maxLabelWords = 0, longLabels = new Set();
function checkMenu(m, r, p) {
  const key = `R${r}.${p}`;
  menuVariants.add(key + ':' + m.map(x => x.id).join(','));
  if (m.length < 2 || m.length > 3) menuProblems.add(`${key} has ${m.length} options`);
  if (new Set(m.map(x => x.id)).size !== m.length) menuProblems.add(`${key} duplicate ids`);
  if (m.filter(x => x.def).length !== 1) menuProblems.add(`${key} must have exactly one default`);
  if (m.filter(x => x.hist).length > 1) menuProblems.add(`${key} has more than one historical option`);
  const h = m.find(x => x.hist); if (h && !h.def) menuProblems.add(`${key} default is not the historical option`);
  for (const x of m) {
    if (typeof x.esc !== 'number') menuProblems.add(`${key}.${x.id} missing esc`);
    if (x.commit && x.backDown) menuProblems.add(`${key}.${x.id} both commit and backDown`);
    const w = words(x.label); maxLabelWords = Math.max(maxLabelWords, w); if (w > 18) longLabels.add(`${key}.${x.id} (${w} words)`);
  }
}
function checkLog(s) {
  const byRound = {};
  for (const e of s.log) {
    if (!C.EVENTS[e.id]) eventProblems.add(`no text for event ${e.id}`);
    emitted.add(e.id);
    const okVis = e.vis === 'public' || (Array.isArray(e.vis) && e.vis.length && e.vis.every(v => P.includes(v)));
    if (!okVis) eventProblems.add(`bad visibility on ${e.id}`);
    const by = e.by == null ? [] : Array.isArray(e.by) ? e.by : [e.by];
    for (const b of by) { (byRound[e.r] ||= new Set()).add(b); if (!(e.vis === 'public' || e.vis.includes(b))) eventProblems.add(`${e.id}: author ${b} cannot see own event`); }
  }
  for (let r = 1; r <= 6; r++) for (const p of P) if (!(byRound[r] && byRound[r].has(p))) feedbackGaps.add(`R${r}.${p}`);
}

function playGame(model, R, opts = {}) {
  let s = G.newGame();
  for (let r = 1; r <= 6; r++) {
    const ch = {};
    for (const p of P) {
      const m = G.menu(s, r, p); checkMenu(m, r, p);
      if (opts.timeoutRate && R() < opts.timeoutRate) continue;
      if (opts.npc && opts.npc.includes(p)) { ch[p] = m.find(x => x.def).id; continue; }
      ch[p] = MODELS[model](m, R, s);
    }
    s = G.play(s, ch).state;
  }
  checkLog(s);
  return s;
}

// =====================================================================================
// 1. Historical path reproduces 1914
{
  let s = G.newGame();
  for (let r = 1; r <= 6; r++) s = G.play(s, {}).state; // nobody submits = every default = history
  const fin = G.finish(s);
  const ids = s.log.map(e => `${e.r}:${e.id}`);
  const need = ['1:BLANK_CHEQUE', '2:WIESNER_REPORT', '2:ULT_HARSH', '2:FR_AT_SEA', '3:RELATIONS_BROKEN', '4:AH_DECLARES_WAR_RS',
    '5:BELGRADE_SHELLED', '5:RU_GENERAL_MOB', '5:DE_ULTIMATUM_RU', '5:FR_WITHDRAWS_10KM', '6:DE_DECLARES_WAR_RU',
    '6:DE_DECLARES_WAR_FR', '6:DE_ULTIMATUM_BELGIUM', '6:BELGIUM_RESISTS', '6:GB_DECLARES_WAR', '6:ITALY_NEUTRAL'];
  const missing = need.filter(x => !ids.includes(x));
  check('Historical path ends in general war', fin.ending === 'general', fin.ending);
  check('Historical path produces the real sequence of events', !missing.length, missing.join(', '));
  check('Historical path: no Austria–Russia war inside the 1–4 Aug window (it came on 6 Aug)', !s.f.war.includes('AH-RU'), s.f.war.join(' '));
  const hs = Object.fromEntries(P.map(p => [p, fin.score[p].total]));
  globalThis.PAR = hs;
  results.push({ name: 'Scores on the historical path ("par" to beat)', ok: true, detail: JSON.stringify(hs) });
  check('Nobody gets a perfect score in 1914, so every team can try to beat history', P.every(p => hs[p] < 7), JSON.stringify(hs));
}

// =====================================================================================
// 2. Random sampling under five player models: integrity, coverage, endings
const dist = {}, endingSeen = new Set(), modSeen = new Set();
const objMin = {}, objMax = {}, scoreSum = {}, scoreN = {}, objMaxTotal = {}, partSum = {};
for (const model of Object.keys(MODELS)) {
  const R = rng(1234 + model.length);
  dist[model] = {};
  const n = model === 'random' ? N : Math.floor(N / 4);
  for (let i = 0; i < n; i++) {
    const s = playGame(model, R);
    const fin = G.finish(s);
    dist[model][fin.ending] = (dist[model][fin.ending] || 0) + 1;
    endingSeen.add(fin.ending); fin.modifiers.forEach(m => modSeen.add(m));
    for (const p of P) {
      if (model === 'class') { fin.score[p].parts.forEach((v, k) => { partSum[`${p}.${k}`] = (partSum[`${p}.${k}`] || 0) + v; }); partSum[`${p}.pr`] = (partSum[`${p}.pr`] || 0) + fin.score[p].prestige; }
      fin.score[p].parts.forEach((v, k) => { const key = `${p}.${k}`; objMin[key] = Math.min(objMin[key] ?? 99, v); objMax[key] = Math.max(objMax[key] ?? -99, v); });
      const key = `${model}.${p}`; scoreSum[key] = (scoreSum[key] || 0) + fin.score[p].total; scoreN[key] = (scoreN[key] || 0) + 1;
      objMaxTotal[p] = Math.max(objMaxTotal[p] ?? -99, fin.score[p].total);
    }
  }
  for (const k in dist[model]) dist[model][k] /= n;
}
check('Every menu is well formed (2–3 options, one default = the historical option)', !menuProblems.size, [...menuProblems].slice(0, 8).join('; '));
check('Every event has text and valid visibility', !eventProblems.size, [...eventProblems].slice(0, 8).join('; '));
check('Every power sees a consequence of its own choice every round', !feedbackGaps.size, [...feedbackGaps].join(', '));
const orphan = Object.keys(C.EVENTS).filter(id => !emitted.has(id));
check('No orphan text (every written event can actually happen)', !orphan.length, orphan.join(', '));
check('All five endings are reachable', endingSeen.size === 5, [...endingSeen].join(', '));
const modMissing = Object.keys(C.MODIFIERS).filter(m => !modSeen.has(m));
check('Every ending modifier is reachable', !modMissing.length, modMissing.join(', '));
if (longLabels.size) warn('Option labels longer than 18 words (tighten in content pass)', [...longLabels].join('; '));
results.push({ name: 'Menu variants seen', ok: true, detail: `${menuVariants.size} distinct menus; longest label ${maxLabelWords} words` });

const D = m => Object.entries(dist[m]).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(', ');
for (const m of Object.keys(MODELS)) results.push({ name: `Ending mix — ${m} players`, ok: true, detail: D(m) });
const gpw = m => (dist[m].general || 0) + (dist[m].continental || 0) + (dist[m].eastern || 0);
check('Even a cautious class sometimes slides into a great-power war (≥ 10%)', gpw('class') >= 0.1, pct(gpw('class')));
check('Cautious classes keep the peace or a local war (≥ 80%)', ((dist.dove.peace || 0) + (dist.dove.local || 0)) >= 0.8, D('dove'));
check('Aggressive classes reach general war (≥ 80%)', (dist.hawk.general || 0) >= 0.8, D('hawk'));

const deadObj = [];
for (const p of P) S.OBJECTIVES[p].forEach((name, k) => { const key = `${p}.${k}`; if (!(objMin[key] === 0 && objMax[key] > 0)) deadObj.push(`${p}: ${name} [${objMin[key]}..${objMax[key]}]`); });
check('Every secret objective can be both met and missed', !deadObj.length, deadObj.join('; '));
for (const model of ['class', 'mixed']) {
  const means = P.map(p => (scoreSum[`${model}.${p}`] / scoreN[`${model}.${p}`]));
  results.push({ name: `Average scores (${model} players) vs 1914 par`, ok: true, detail: P.map((p, i) => `${p} ${means[i].toFixed(2)} (par ${PAR[p]})`).join(', ') });
}
{ const means = P.map(p => (scoreSum[`random.${p}`] / scoreN[`random.${p}`])); results.push({ name: 'Average scores, random players (for information)', ok: true, detail: P.map((p, i) => `${p} ${means[i].toFixed(2)}`).join(', ') }); }
{ const nC = scoreN['class.AH']; results.push({ name: 'Average points per objective, responsive classes (diagnostic)', ok: true, detail: P.map(p => `${p}: ` + S.OBJECTIVES[p].map((_, k) => (partSum[`${p}.${k}`] / nC).toFixed(2)).join(' / ') + ` | prestige ${(partSum[`${p}.pr`] / nC).toFixed(2)}`).join('; ') }); }
check('Every team can reach the maximum of 7', P.every(p => objMaxTotal[p] === 7), JSON.stringify(objMaxTotal));

// 2b. Strategic teams (chase their own secret objectives with short look-ahead)
{
  const ST = require('./strategic');
  const games = Number(process.env.SG || 150);
  const a = ST.run({ games, mix: 1, seed: 7, par: PAR }), b = ST.run({ games, mix: 0.5, seed: 8, par: PAR });
  const fmt = d => Object.entries(d).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${pct(v)}`).join(', ');
  const gp = d => (d.general || 0) + (d.continental || 0) + (d.eastern || 0);
  results.push({ name: 'Ending mix — strategic teams', ok: true, detail: fmt(a.dist) });
  results.push({ name: 'Ending mix — half strategic, half responsive', ok: true, detail: fmt(b.dist) });
  check('Strategic teams: the incentives usually lead to a great-power war (45–80%)', gp(a.dist) >= 0.45 && gp(a.dist) <= 0.8, pct(gp(a.dist)));
  check('Strategic teams: the full 1914 war is a common outcome (≥ 15%)', (a.dist.general || 0) >= 0.15, pct(a.dist.general || 0));
  check('Strategic teams: peace is possible but not the norm (10–45%)', (a.dist.peace || 0) >= 0.1 && (a.dist.peace || 0) <= 0.45, pct(a.dist.peace || 0));
  check('Mixed classes: war remains a real risk (great-power war ≥ 25%)', gp(b.dist) >= 0.25, pct(gp(b.dist)));
  const beat = P.filter(p => a.beat[p] < 0.2 || b.beat[p] < 0.2);
  check('Every team can beat its 1914 score (≥ 20% of games, strategic and mixed)', !beat.length, P.map(p => `${p} ${pct(a.beat[p])}/${pct(b.beat[p])}`).join(', '));
}

// =====================================================================================
// 3. Timeouts and absent groups never break the game
{
  const R = rng(77); let ok = true, d = {};
  for (let i = 0; i < 20000; i++) { try { const s = playGame('random', R, { timeoutRate: 0.25 }); const e = G.finish(s).ending; d[e] = (d[e] || 0) + 1; } catch (e) { ok = false; d.err = String(e); break; } }
  check('25% of decisions missing (timeouts): game always completes', ok, JSON.stringify(d));
  let ok2 = true;
  for (const p of P) { const R2 = rng(99); for (let i = 0; i < 5000; i++) { try { playGame('random', R2, { npc: [p] }); } catch (e) { ok2 = false; } } }
  check('Any one country run by the computer (absent group): game always completes', ok2);
  let ok3 = true; const R3 = rng(5);
  for (let i = 0; i < 5000; i++) { try { playGame('random', R3, { npc: ['RS', 'FR'] }); } catch (e) { ok3 = false; } }
  check('Two countries run by the computer: game always completes', ok3);
}

// =====================================================================================
// 4. Exhaustive check of every choice combination, from many different starting states each round
{
  const R = rng(4242), entry = {}, K = Number(process.env.K || 120);
  for (let r = 1; r <= 6; r++) entry[r] = new Map();
  for (let i = 0; i < 20000; i++) {
    let s = G.newGame();
    for (let r = 1; r <= 6; r++) {
      const key = JSON.stringify([s.f, P.map(p => s.prestige[p].commits > 0)]);
      if (entry[r].size < K && !entry[r].has(key)) entry[r].set(key, s);
      const ch = {}; for (const p of P) ch[p] = MODELS.random(G.menu(s, r, p), R);
      s = G.play(s, ch).state;
    }
  }
  let resolves = 0, errors = [];
  for (let r = 1; r <= 6; r++) {
    for (const s of entry[r].values()) {
      const menus = P.map(p => G.menu(s, r, p));
      const idx = menus.map(() => 0);
      while (true) {
        const ch = {}; P.forEach((p, k) => ch[p] = menus[k][idx[k]].id);
        try { const ns = G.play(s, ch).state; resolves++; if (r === 6) { const fin = G.finish(ns); if (!C.ENDINGS[fin.ending]) errors.push('no ending text ' + fin.ending); checkLog(ns); } }
        catch (e) { errors.push(`R${r} ${JSON.stringify(ch)}: ${e.message}`); }
        let k = 0; while (k < idx.length && ++idx[k] === menus[k].length) { idx[k] = 0; k++; }
        if (k === idx.length) break;
      }
    }
  }
  check('Every combination of choices resolves, from varied starting states', !errors.length, `${resolves.toLocaleString()} rounds resolved; ${errors.slice(0, 3).join(' | ')}`);
  check('Exhaustive run found no missing text or bad visibility', !eventProblems.size, [...eventProblems].slice(0, 5).join('; '));
}

// =====================================================================================
// 5. Decision relevance and dominance (common random numbers: same future, one choice changed)
const relevance = [], dominant = [];
{
  const R = rng(2026), SAMPLES = Number(process.env.REL || 3000);
  const plans = Array.from({ length: SAMPLES }, () => Array.from({ length: 7 }, () => Object.fromEntries(P.map(p => [p, [R(), R()]]))));
  const choose = (m, u, s) => classPick(m, u[0], u[1], s);
  const runPlan = (plan, over) => {
    let s = G.newGame(); const own = [], others = [];
    for (let r = 1; r <= 6; r++) {
      const ch = {};
      for (const p of P) {
        const m = G.menu(s, r, p);
        if (r > over.r) (p === over.p ? own : others).push(`${r}${p}:${m.map(x => x.id).join(',')}`);
        ch[p] = (over.r === r && over.p === p) ? over.id : choose(m, plan[r][p], s);
      }
      s = G.play(s, ch).state;
    }
    return { fin: G.finish(s), own: own.join('|'), others: others.join('|') };
  };
  const stateAt = (plan, r0) => { let s = G.newGame(); for (let r = 1; r < r0; r++) { const ch = {}; for (const p of P) ch[p] = choose(G.menu(s, r, p), plan[r][p], s); s = G.play(s, ch).state; } return s; };
  for (let r = 1; r <= 6; r++) for (const p of P) {
    let endC = 0, ownC = 0, menuC = 0, othC = 0, any = 0; const win = {}, ties = {};
    for (const plan of plans) {
      const s0 = stateAt(plan, r), m = G.menu(s0, r, p);
      const outs = m.map(x => runPlan(plan, { r, p, id: x.id }));
      const e = new Set(outs.map(o => o.fin.ending)).size > 1;
      const ownScores = outs.map(o => o.fin.score[p].total);
      const sc = new Set(ownScores).size > 1;
      const mn = new Set(outs.map(o => o.own)).size > 1;
      const ot = new Set(outs.map(o => o.others + JSON.stringify(P.filter(q => q !== p).map(q => o.fin.score[q].total)))).size > 1;
      endC += e; ownC += sc; menuC += mn; othC += ot; any += (e || sc || mn);
      const best = Math.max(...ownScores);
      m.forEach((x, k) => { if (ownScores[k] === best) { win[x.id] = (win[x.id] || 0) + 1; if (ownScores.filter(v => v === best).length > 1) ties[x.id] = (ties[x.id] || 0) + 1; } });
    }
    relevance.push({ key: `R${r}.${p}`, r, ending: endC / SAMPLES, own: ownC / SAMPLES, menus: menuC / SAMPLES, others: othC / SAMPLES, any: any / SAMPLES });
    for (const id in win) { const strict = (win[id] - (ties[id] || 0)) / SAMPLES; if (win[id] / SAMPLES >= 0.95 && strict >= 0.3) dominant.push(`R${r}.${p}.${id} best in ${pct(win[id] / SAMPLES)}`); }
  }
  const low = relevance.filter(x => x.any < 0.15).map(x => `${x.key} ${pct(x.any)}`), dead = relevance.filter(x => x.any < 0.03).map(x => `${x.key} ${pct(x.any)}`);
  check('No dead decisions: every decision changes the ending, own score or own later options in ≥ 3% of situations', !dead.length, dead.join(', '));
  check('Most decisions matter a lot: ≥ 30 of 36 matter in ≥ 15% of situations', relevance.length - low.length >= 30, `${relevance.length - low.length} of 36; lower: ${low.join(', ')}`);
  check('No option is a no-brainer (best for you in ≥ 95% of situations)', !dominant.length, dominant.join('; '));
  const early = relevance.filter(x => x.r <= 4);
  const meanEarly = early.reduce((a, x) => a + x.ending, 0) / early.length;
  const perRound = [2, 3, 4].map(r => Math.max(...relevance.filter(x => x.r === r).map(x => x.ending)));
  check('Cascade: rounds 1–4 change the ending (average ≥ 5%; best decision in each of rounds 2–4 ≥ 10%) [responsive classes]',
    meanEarly >= 0.05 && perRound.every(v => v >= 0.10), `average ${pct(meanEarly)}; best in R2/R3/R4: ${perRound.map(pct).join(' / ')}`);
}

// =====================================================================================
// 6. Pivot points: single changes from history that avoid a general war
const pivots = [];
{
  for (let r = 1; r <= 6; r++) for (const p of P) {
    let s0 = G.newGame(); for (let k = 1; k < r; k++) s0 = G.play(s0, {}).state;
    for (const x of G.menu(s0, r, p)) {
      if (x.def) continue;
      let s = s0; s = G.play(s, { [p]: x.id }).state; for (let k = r + 1; k <= 6; k++) s = G.play(s, {}).state;
      const e = G.finish(s).ending; if (e !== 'general') pivots.push(`R${r} ${S.NAME[p]}: "${x.label}" → ${e}`);
    }
  }
  check('History is not locked in: some single decisions avoid a general war', pivots.length > 0, `${pivots.length} pivot choices`);
  check('History is not fragile: most single changes still end in general war', pivots.length <= 25, `${pivots.length} of ${6 * 6 * 2} possible single changes avoid it`);
}

// 6b. Gates behave as designed
{
  const run = (plans) => { let s = G.newGame(); for (const ch of plans) s = G.play(s, ch).state; return s; };
  const ids = (s, r, p) => G.menu(s, r, p).map(x => x.id);
  // Gate 2: Russia needs Austria at war + preparations + a French promise to mobilize generally
  const noPromise = run([{}, { FR: 'restrain' }, { FR: 'wait' }, { FR: 'caution' }]);
  check('Gate 2: without a French promise, Russia cannot order general mobilization', !ids(noPromise, 5, 'RU').includes('general'), ids(noPromise, 5, 'RU').join(','));
  const hist4 = run([{}, {}, {}, {}]);
  check('Gate 2: on the 1914 path, general mobilization is available', ids(hist4, 5, 'RU').includes('general'));
  const noWar = run([{}, {}, {}, { AH: 'mobilize' }]);
  check('Gate 2: if Austria has not declared war, no general mobilization', !ids(noWar, 5, 'RU').includes('general'));
  // Gate 0
  const noBack = run([{ DE: 'none' }, {}, { DE: 'pass' }]);
  check('Gate 0: without German backing, Austria cannot declare war', !ids(noBack, 4, 'AH').includes('declare'), ids(noBack, 4, 'AH').join(','));
  const pressed = run([{}, {}, {}, { AH: 'talks', DE: 'press' }]);
  check('Gate 0: once Germany withdraws backing, Austria cannot start a war in round 5', !ids(pressed, 5, 'AH').includes('invade'), ids(pressed, 5, 'AH').join(','));
  // Gate 3
  check('Gate 3: Germany has no "east only" option (Moltke, 1 August 1914)', !ids(run([{}, {}, {}, {}, {}]), 6, 'DE').includes('eastOnly'));
  const lim = run([{ DE: 'limited' }, { DE: 'hurry', AH: 'harsh' }]);
  check('Gate 0: without a full blank cheque, a harsh ultimatum is toned down to firm demands', lim.f.demand === 'firm', lim.f.demand);
  const late = run([{ DE: 'limited' }, { DE: 'cheque', AH: 'harsh' }]);
  check('Gate 0: a blank cheque given in round 2 still allows the harsh ultimatum', late.f.demand === 'harsh', late.f.demand);
  // Gate 4a / 4b
  const brk = run([{}, {}, {}, {}, {}, { FR: 'neutral' }]);
  check('Gate 4a: neutrality after promising Russia costs France 2 prestige', G.finish(brk).score.FR.prestige === -2, String(G.finish(brk).score.FR.prestige));
  const frFree = run([{ FR: 'calm' }, { FR: 'vague' }, { FR: 'wait' }, { FR: 'caution' }, { FR: 'caution' }, { FR: 'neutral' }]);
  check('Gate 4a: a France that kept its options open can stay neutral without losing prestige', G.finish(frFree).score.FR.prestige === 0, String(G.finish(frFree).score.FR.prestige));
  const gen = run([{}, {}, {}, {}, {}]);
  check('Gate 8: once general mobilization starts, Russia cannot stand down', !ids(gen, 6, 'RU').includes('standDown'));
  const gbNo = run([{}, {}, { GB: 'extend' }, { GB: 'conference' }, { FR: 'caution', GB: 'noPromise' }]);
  check('Gate 4b: Britain cannot fight "for France" without a promise, a ready fleet or the French 10 km gesture', !ids(gbNo, 6, 'GB').includes('franceOrBelgium'));
  // Gate 7
  const beQuiet = run([{}, {}, {}, {}, { RS: 'quiet' }]);
  check('Gate 7: Belgium can only resist properly if it mobilized', !ids(beQuiet, 6, 'RS').includes('resist') && ids(beQuiet, 6, 'RS').includes('resistUnready'));
  // Gate 5
  check('Gate 5: "Halt in Belgrade" exists only if Germany proposed it', ids(run([{}, {}, {}, { DE: 'halt' }]), 5, 'AH').includes('halt') && !ids(hist4, 5, 'AH').includes('halt'));
  // Gate 1
  const conf = run([{}, { GB: 'talks' }, {}, { AH: 'talks' }]);
  check('Gate 1: talks open when Austria agrees and someone proposed them', !!conf.f.conference);
  const forced = run([{}, {}, {}, { AH: 'mobilize', DE: 'press' }]);
  check('Gate 1: German pressure can push a hesitating Austria into talks', !!forced.f.conference);
  const noForum = run([{ GB: 'ireland' }, { GB: 'aloof' }, { FR: 'wait', DE: 'back', GB: 'extend' }, { AH: 'talks', GB: 'silent', FR: 'caution', RU: 'partial', RS: 'defend' }]);
  check('Gate 1: no proposal, no conference', !noForum.f.conference);
}

// =====================================================================================
// 7. Prestige rule
{
  const run = (plans) => { let s = G.newGame(); for (const ch of plans) s = G.play(s, ch).state; return s; };
  const base = [{ RU: 'wait', RS: 'deny' }, { RU: 'peace', RS: 'campaign' }, { RU: 'aloof' }];
  const a = run(base); check('Backing down with no earlier promise costs nothing', a.prestige.RU.broken === 0, JSON.stringify(a.prestige.RU));
  const b = run([{ RU: 'warn' }, { RU: 'peace' }, { RU: 'aloof' }]); check('Backing down after a promise costs prestige', b.prestige.RU.broken === 1, JSON.stringify(b.prestige.RU));
  const c = run([{ RS: 'appeal' }, { RU: 'peace' }, { RU: 'aloof' }]); check("Serbia's public appeal puts Russia's prestige on the line", c.prestige.RU.broken === 1, JSON.stringify(c.prestige.RU));
  let d = run([{ RU: 'warn' }, { RU: 'peace' }, { RU: 'aloof' }, { RU: 'talks' }, { RU: 'none' }, { RU: 'standDown' }]);
  check('Prestige penalty is capped at −2', G.finish(d).score.RU.prestige === -2, String(G.finish(d).score.RU.prestige));
}

// =====================================================================================
// 8. Reading load per round (labels + events a group sees), at an assumed 100 words/minute for L2 readers
{
  const R = rng(8); const load = {};
  for (let i = 0; i < 3000; i++) {
    let s = G.newGame();
    for (let r = 1; r <= 6; r++) {
      for (const p of P) {
        const seen = G.visibleTo(s, p).filter(e => e.r === r - 1).map(e => C.EVENTS[e.id]).join(' ');
        const labels = G.menu(s, r, p).map(x => x.label).join(' ');
        const w = words(seen + ' ' + labels);
        const key = `R${r}`; load[key] = Math.max(load[key] || 0, w);
      }
      const ch = {}; for (const p of P) ch[p] = MODELS.random(G.menu(s, r, p), R);
      s = G.play(s, ch).state;
    }
  }
  results.push({ name: 'Peak words a group reads per round (events + options, before briefings)', ok: true, detail: Object.entries(load).map(([k, v]) => `${k} ${v}`).join(', ') });
  check('Event + option reading fits in 2 minutes at 100 wpm (≤ 200 words), leaving room for briefings', Math.max(...Object.values(load)) <= 200, JSON.stringify(load));
}

// =====================================================================================
// report
const icon = x => x === true ? 'PASS' : x === false ? 'FAIL' : 'WARN';
for (const r of results) console.log(`${icon(r.ok).padEnd(4)}  ${r.name}${r.detail ? '\n      ' + r.detail : ''}`);
console.log('\nRelevance (share of situations where the decision changes the ending / your score):');
console.log(relevance.map(x => `${x.key.padEnd(6)} ending ${pct(x.ending).padStart(6)}  own score ${pct(x.own).padStart(6)}  own options ${pct(x.menus).padStart(6)}  others ${pct(x.others).padStart(6)}`).join('\n'));
console.log('\nPivot points from the historical path:\n' + pivots.join('\n'));
console.log(`\n${failures} failed, ${warnings} warnings, ${results.filter(r => r.ok === true).length} passed`);
process.exitCode = failures ? 1 : 0;
