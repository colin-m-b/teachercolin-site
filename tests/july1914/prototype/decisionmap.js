'use strict';
const S = require('../../../37-days/engine/scenario'), G = require('../../../37-days/engine/engine');
const P = S.POWERS;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// historical-state menus
let hs = G.newGame(); const histMenus = {};
for (let r = 1; r <= 6; r++) { for (const p of P) histMenus[`${r}.${p}`] = G.menu(hs, r, p); hs = G.play(hs, {}).state; }
// union of options seen
const R = rng(3), seen = {};
for (let i = 0; i < 30000; i++) {
  let s = G.newGame();
  for (let r = 1; r <= 6; r++) {
    const ch = {};
    for (const p of P) { const m = G.menu(s, r, p); const k = `${r}.${p}`; seen[k] ||= new Map(); for (const x of m) if (!seen[k].has(x.id)) seen[k].set(x.id, x); ch[p] = m[Math.floor(R() * m.length)].id; }
    s = G.play(s, ch).state;
  }
}
const NAMES = { AH: 'Austria-Hungary', DE: 'Germany', RU: 'Russia', FR: 'France', GB: 'Britain', RS: 'Serbia' };
let md = '';
for (const R0 of S.ROUNDS) {
  md += `### Round ${R0.n}: ${R0.title} (${R0.dates})\n\n| Team | Options (★ = what happened in 1914) |\n| --- | --- |\n`;
  for (const p of P) {
    const k = `${R0.n}.${p}`, hm = histMenus[k], hids = new Set(hm.map(x => x.id));
    const ordered = [...hm.map(x => seen[k].get(x.id) || x), ...[...seen[k].values()].filter(x => !hids.has(x.id))];
    const opts = ordered.map(x => {
      const lab = (hm.find(y => y.id === x.id) || x).label.replace(/\|/g, '/');
      const star = (hm.find(y => y.id === x.id) || {}).hist ? '★ ' : '';
      const cond = hids.has(x.id) ? '' : ' *(only in some situations)*';
      return `${star}${lab}${cond}`;
    });
    const team = (R0.n >= 5 && p === 'RS') ? 'Belgium (Serbia team)' : NAMES[p];
    md += `| ${team} | ${opts.join(' · ')} |\n`;
  }
  md += '\n';
}
require('fs').writeFileSync('decision_map.md', md);
console.log(md.length, 'chars'); console.log(md.slice(0, 1500));
