'use strict';
// Strategic players: each team estimates its own expected final score for every option
// (short look-ahead rollouts where everyone else plays like a responsive class) and leans
// toward the best one. Tells us where the incentive structure pushes the crisis.
const S = require('../../../37-days/engine/scenario'), G = require('../../../37-days/engine/engine');
const P = S.POWERS;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tension(f) {
  let T = 0;
  if (f.support === 'full') T += 1; if (f.demand === 'harsh') T += 1;
  if (f.relations === 'broken') T += 1; else if (f.relations === 'eased') T -= 1.5;
  if (f.ahSerbWar) T += 1.5; if (f.conference) T -= 1.5; if (f.settled) T -= 2;
  if (f.rusMob === 'general') T += 1.5; else if (f.rusMob === 'partial') T += 0.5;
  if (f.deUltimatum) T += 1; if (f.frPromised) T += 0.5;
  return T;
}
function classPick(m, u1, u2, s) {
  if (u1 < 0.3) return m.find(x => x.def).id;
  const T = tension(s.f), w = m.map(x => Math.exp(0.9 * (x.esc - 1) * (T - 2)));
  let acc = 0; const tot = w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < m.length; k++) { acc += w[k] / tot; if (u2 < acc) return m[k].id; }
  return m[m.length - 1].id;
}
function softmax(m, ev, lambda, u) {
  const mx = Math.max(...ev), w = ev.map(v => Math.exp(lambda * (v - mx)));
  let acc = 0; const tot = w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < m.length; k++) { acc += w[k] / tot; if (u < acc) return m[k].id; }
  return m[m.length - 1].id;
}
function strategicPick(s, r, p, R, K, lambda) {
  const m = G.menu(s, r, p);
  const ev = m.map(x => {
    let tot = 0;
    for (let k = 0; k < K; k++) {
      const ch = {}; for (const q of P) ch[q] = q === p ? x.id : classPick(G.menu(s, r, q), R(), R(), s);
      let st = G.play(s, ch).state;
      for (let rr = r + 1; rr <= 6; rr++) { const c2 = {}; for (const q of P) c2[q] = classPick(G.menu(st, rr, q), R(), R(), st); st = G.play(st, c2).state; }
      tot += S.score(st)[p].total;
    }
    return tot / K;
  });
  return softmax(m, ev, lambda, R());
}
function run({ games = 300, K = 6, lambda = 2, mix = 1, seed = 1, par = null } = {}) {
  const R = rng(seed), dist = {}, sum = Object.fromEntries(P.map(p => [p, 0])), beat = Object.fromEntries(P.map(p => [p, 0]));
  for (let g = 0; g < games; g++) {
    let s = G.newGame();
    for (let r = 1; r <= 6; r++) {
      const ch = {};
      for (const p of P) ch[p] = R() < mix ? strategicPick(s, r, p, R, K, lambda) : classPick(G.menu(s, r, p), R(), R(), s);
      s = G.play(s, ch).state;
    }
    const fin = G.finish(s); dist[fin.ending] = (dist[fin.ending] || 0) + 1;
    for (const p of P) { sum[p] += fin.score[p].total; if (par && fin.score[p].total > par[p]) beat[p]++; }
  }
  for (const p of P) beat[p] /= games;
  for (const k in dist) dist[k] = +(dist[k] / games).toFixed(3);
  const avg = Object.fromEntries(P.map(p => [p, +(sum[p] / games).toFixed(2)]));
  return { dist, avg, beat };
}
module.exports = { run };
if (require.main === module) {
  const t0 = Date.now();
  const games = Number(process.env.G || 300);
  console.log('strategic, all teams:', JSON.stringify(run({ games, mix: 1 })));
  console.log('half strategic, half responsive:', JSON.stringify(run({ games, mix: 0.5, seed: 2 })));
  console.log(`(${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
