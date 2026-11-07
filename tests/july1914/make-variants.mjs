// Builds 37-days/engine/menu-variants.json: every menu variant the engine can show, per round and team,
// with a stable slip code (e.g. R4-AH-B). Used by the printed decision-slip pack and offline mode.
// Run after any change to scenario.js: node tests/july1914/make-variants.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const S = require('../../37-days/engine/scenario.js');
const G = require('../../37-days/engine/engine.js');

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// key: "r.p:id,id,id" -> options
export function collect(n, seed = 1914) {
  const R = rng(seed), out = {};
  for (let g = 0; g < n; g++) {
    let s = G.newGame();
    const bias = R(); // mix of historical-leaning and random games so rare branches appear
    for (let r = 1; r <= 6; r++) {
      const ch = {};
      for (const p of S.POWERS) {
        const m = G.menu(s, r, p);
        out[`${r}.${p}:${m.map(x => x.id).join(',')}`] ||= m.map(x => ({ id: x.id, label: x.label, def: !!x.def, hist: !!x.hist }));
        ch[p] = R() < bias ? m.find(x => x.def).id : m[Math.floor(R() * m.length)].id;
      }
      s = G.play(s, ch).state;
    }
  }
  return out;
}

export function build(n = 60000) {
  const raw = collect(n);
  const groups = {};
  for (const k of Object.keys(raw).sort()) { const [rp] = k.split(':'); (groups[rp] ||= []).push(k); }
  const variants = {};
  for (const [rp, keys] of Object.entries(groups)) {
    const [r, p] = rp.split('.');
    keys.forEach((k, i) => { variants[k] = { code: `R${r}-${p}-${String.fromCharCode(65 + i)}`, round: Number(r), team: p, options: raw[k] }; });
  }
  return { generated: 'tests/july1914/make-variants.mjs', count: Object.keys(variants).length, variants };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const v = build();
  fs.writeFileSync('37-days/engine/menu-variants.json', JSON.stringify(v, null, 1));
  console.log(`${v.count} menu variants written`);
}
