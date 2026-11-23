'use strict';
// Where do strategic games stop escalating? Count each rung of the ladder.
const S = require('../../../37-days/engine/scenario'), G = require('../../../37-days/engine/engine');
const strat = require('./strategic');
const P = S.POWERS;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// reuse strategic internals by re-implementing a run that records choices
const src = require('fs').readFileSync('./strategic.js', 'utf8');
const m = {}; new Function('module', 'require', src.replace("if (require.main === module)", "module.exports.internal = { strategicPick, classPick }; if (false)"))(m, require);
const { strategicPick } = m.exports.internal;
const R = rng(11), games = Number(process.env.G || 120), count = {}, choiceCount = {};
const inc = (k) => count[k] = (count[k] || 0) + 1;
for (let g = 0; g < games; g++) {
  let s = G.newGame();
  for (let r = 1; r <= 6; r++) {
    const ch = {}; for (const p of P) ch[p] = strategicPick(s, r, p, R, 6, 2);
    for (const p of P) { const k = `R${r}.${p}.${ch[p]}`; choiceCount[k] = (choiceCount[k] || 0) + 1; }
    s = G.play(s, ch).state;
  }
  const f = s.f;
  inc('support:' + f.support); inc('demand:' + f.demand); inc('reply:' + f.reply); inc('relations:' + f.relations);
  if (f.deBacking) inc('backing at end'); if (f.conference) inc('conference'); if (f.settled) inc('settled');
  if (f.ahSerbWar) inc('Austria declared war'); inc('rusMob:' + f.rusMob); if (f.deUltimatum) inc('German ultimatum');
  inc('ending:' + G.finish(s).ending);
}
const show = o => Object.entries(o).sort().map(([k, v]) => `${k} ${(100 * v / games).toFixed(0)}%`).join('\n');
console.log(show(count)); console.log('--- choices'); console.log(show(choiceCount));
