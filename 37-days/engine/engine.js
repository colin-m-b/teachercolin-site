'use strict';
// Generic engine: plays one round at a time on an immutable state.
const S = require('./scenario');

function newGame() {
  return {
    round: 0, f: {}, ch: {}, log: [],
    prestige: Object.fromEntries(S.POWERS.map(p => [p, { commits: 0, broken: 0 }])),
  };
}

function menu(s, r, p) {
  const m = S.ROUNDS[r - 1].menu(s, p).map(x => ({ ...x }));
  if (!m.some(x => x.def)) { const h = m.find(x => x.hist); if (h) h.def = 1; }
  return m;
}

// choices: { power: optionId }. Missing or invalid ids fall back to the default (timeout rule).
function play(s, choices) {
  const r = s.round + 1;
  if (r > S.ROUNDS.length) throw new Error('game already over');
  const ns = structuredClone(s);
  const c = {}, timedOut = [];
  for (const p of S.POWERS) {
    const m = menu(ns, r, p);
    let opt = m.find(x => x.id === choices[p]);
    if (!opt) { opt = m.find(x => x.def); timedOut.push(p); }
    c[p] = opt.id;
    const pr = ns.prestige[p];
    if (opt.backDown && pr.commits > 0) { pr.broken += 1; ns.log.push({ r, id: 'PRESTIGE_LOSS', vis: [p], by: p }); }
    if (opt.commit) pr.commits += 1;
  }
  ns.ch[r] = c;
  const E = (id, vis, by) => ns.log.push({ r, id, vis, by });
  S.ROUNDS[r - 1].resolve(ns, c, E);
  ns.round = r;
  return { state: ns, timedOut };
}

function finish(s) {
  if (s.round !== S.ROUNDS.length) throw new Error('game not finished');
  return { ending: S.ending(s.f), modifiers: S.modifiers(s.f), score: S.score(s) };
}

// What a given power is allowed to see (used for the group screens and the archive release).
function visibleTo(s, p) {
  return s.log.filter(e => e.vis === 'public' || (Array.isArray(e.vis) && e.vis.includes(p)));
}

module.exports = { newGame, menu, play, finish, visibleTo };
