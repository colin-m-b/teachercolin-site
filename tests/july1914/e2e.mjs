// Browser run-through of a whole class session: teacher panel, projector and 13 student phones.
// Run: node tests/july1914/e2e.mjs   (uses the local dev server and the pre-installed Playwright Chromium)
import { createRequire } from 'node:module';
import { startServer } from './dev-server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 8899, BASE = `http://localhost:${PORT}/37-days/`;
const SHOTS = 'tests/july1914/shots';
const { server, setOffline } = await startServer(PORT);
const browser = await chromium.launch();
const errors = [];
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };
const watch = (page, name) => { page.on('pageerror', e => errors.push(`${name}: ${e.message}`)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_INTERNET_DISCONNECTED|ERR_EMPTY_RESPONSE/.test(m.text())) errors.push(`${name}: ${m.text()}`); }); page.on('dialog', d => d.accept()); };
const api = body => fetch(`http://localhost:${PORT}/api/july1914`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));

try {
  // ---- teacher creates a game from the start page
  const tctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const teacher = await tctx.newPage(); watch(teacher, 'teacher');
  await teacher.goto(BASE);
  await teacher.click('#create button[type=submit]');
  await teacher.waitForURL(/teacher\.html#g=/);
  const hash = new URL(teacher.url()).hash.slice(1);
  const g = /g=([^&]+)/.exec(hash)[1], k = /k=([^&]+)/.exec(hash)[1];
  check('Start page creates a game and opens the teacher panel', !!g && !!k, g);
  const T0 = await api({ action: 'teacher', g, k });

  // ---- projector
  const pctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const proj = await pctx.newPage(); watch(proj, 'projector');
  await proj.goto(`${BASE}projector.html#g=${g}`);

  // ---- 13 students on phones
  const sctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const students = {};
  for (const t of ['AH', 'DE', 'RU', 'FR', 'GB', 'RS']) for (const r of (t === 'DE' ? ['leader', 'general', 'envoy'] : ['leader', 'general'])) {
    const p = await sctx.newPage(); watch(p, `${t}.${r}`);
    await p.goto(`${BASE}play.html#g=${g}&t=${t}&r=${r}&k=${T0.keys.roles[`${t}.${r}`]}`);
    students[`${t}.${r}`] = p;
  }
  await sleep(2500);
  await students['DE.envoy'].screenshot({ path: `${SHOTS}/01-student-lobby.png` });
  await teacher.waitForFunction(() => document.body.innerText.includes('Start the practice round'));
  const joined = await teacher.locator('.tcard span[style*="var(--ok)"]').count();
  check('Teacher panel shows all 13 devices joined', joined === 13, `${joined}`);
  await teacher.screenshot({ path: `${SHOTS}/02-teacher-lobby.png`, fullPage: true });

  const next = async () => { await teacher.click('[data-act=next]'); await sleep(300); };
  const waitAll = async (fn, arg) => { for (const p of Object.values(students)) await p.waitForFunction(fn, arg, { timeout: 8000 }); };

  // ---- practice round
  await next();
  await waitAll(() => /practice round/i.test(document.body.innerText));
  for (const t of ['AH', 'DE', 'RU', 'FR', 'GB', 'RS']) { const p = students[`${t}.leader`]; await p.click('#pf .opt >> nth=1'); await p.click('#pf button[type=submit]'); }
  await proj.waitForFunction(() => document.querySelectorAll('.pj-light.is-decided').length === 6, null, { timeout: 8000 });
  check('Projector lights turn green as teams decide (practice)', true);
  await next();
  await proj.waitForFunction(() => document.body.innerText.includes('Send a diplomat'), null, { timeout: 8000 });

  // ---- rounds
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 1; r <= 6; r++) {
    await next(); // telegrams
    await waitAll(rr => document.querySelector('#meta')?.textContent.includes(`Round ${rr} of 6`), r);
    if (r === 1) {
      await proj.waitForFunction(() => document.body.innerText.includes('Sarajevo'));
      await proj.screenshot({ path: `${SHOTS}/03-projector-round1.png` });
      const gen = await students['AH.general'].innerText('main');
      check('General’s screen shows the military briefing, not the cabinet briefing', /military briefing/i.test(gen) && !/cabinet briefing/i.test(gen));
    }
    await next(); // council
    const T = await api({ action: 'teacher', g, k });
    if (T.next.step === 'diplomacy') {
      await next(); // diplomacy
      const env = students['RU.general'];
      await env.waitForSelector('#pf2', { timeout: 8000 }).catch(() => {});
      if (await env.$('#pf2')) {
        await env.selectOption('#to', 'GB');
        await env.fill('#pt', `Round ${r}: Russia promised Britain to wait 24 hours before mobilizing.`);
        await env.click('#pf2 button[type=submit]');
        await env.waitForSelector('#pfs2 .status--ok');
        if (r === 2) await env.screenshot({ path: `${SHOTS}/04-student-envoy.png`, fullPage: true });
      }
    }
    await next(); // decision
    for (const t of ['AH', 'DE', 'RU', 'FR', 'GB', 'RS']) {
      if (t === 'GB' && r === 3) continue; // Britain misses one deadline
      const p = students[`${t}.leader`];
      await p.waitForSelector('#df', { timeout: 8000 });
      const n = await p.locator('#df .opt').count();
      const pick = rnd() < 0.6 ? 0 : Math.floor(rnd() * n);
      await p.click(`#df .opt >> nth=${pick}`);
      await p.click('#df [data-starter] >> nth=0');
      await p.type('#why', `${t} round ${r} reasoning`);
      if (t === 'AH' && r === 2) { await p.reload(); await p.waitForSelector('#df'); const kept = await p.inputValue('#why'); check('A refresh keeps the unsent decision draft', kept.includes('AH round 2 reasoning')); }
      await p.click('#df button[type=submit]');
      await p.waitForSelector('#dfs .status--ok', { timeout: 8000 }).catch(async e => { console.log('DEBUG', t, r, await p.innerText('#dfs').catch(() => 'no dfs'), await p.innerText('main').then(x => x.slice(0, 600))); throw e; });
      if (t === 'FR' && r === 1) await p.screenshot({ path: `${SHOTS}/05-student-decision.png`, fullPage: true });
    }
    await sleep(2300);
    if (r === 1) await teacher.screenshot({ path: `${SHOTS}/06-teacher-decision.png`, fullPage: true });
    const projText = await proj.innerText('body');
    check(`Round ${r}: nothing private on the projector`, !projText.includes('reasoning') && !projText.includes('briefing') && !projText.includes('promised Britain'));
    await next(); // lock and resolve
    await proj.waitForFunction(() => /Result/i.test(document.querySelector('.pj-step')?.textContent || ''), null, { timeout: 8000 });
    if (r === 5) await proj.screenshot({ path: `${SHOTS}/07-projector-result.png` });
  }

  // ---- ending
  await next(); await proj.waitForSelector('.pj-ending', { timeout: 8000 }); await sleep(500);
  await proj.screenshot({ path: `${SHOTS}/08-projector-ending.png` });
  const ending = (await api({ action: 'projector', g })).ending.ending;
  check('Game reaches an ending', !!ending, ending);
  await next(); await sleep(2500); await proj.screenshot({ path: `${SHOTS}/09-projector-replay.png` });
  await next(); await proj.waitForSelector('.pj-table', { timeout: 8000 });
  await proj.screenshot({ path: `${SHOTS}/10-projector-scores.png` });
  await students['GB.leader'].waitForFunction(() => document.body.innerText.includes('Your score'), null, { timeout: 8000 });
  await students['GB.leader'].screenshot({ path: `${SHOTS}/11-student-score.png`, fullPage: true });

  // ---- colour books
  await next();
  for (const t of ['AH', 'DE', 'RU', 'FR', 'GB', 'RS']) {
    const p = students[`${t}.leader`];
    await p.waitForSelector('#cf', { timeout: 8000 });
    await p.click('#cf .opt >> nth=0'); await p.click('#cf .opt >> nth=1');
    await p.click('#cf button[type=submit]'); await p.waitForSelector('#cfs .status--ok');
  }
  // ---- exit vote
  await next();
  const voteAll = async stage => {
    let i = 0;
    for (const [name, p] of Object.entries(students)) {
      await p.waitForSelector('#vf', { timeout: 8000 });
      const pick = [[1, 1, 1, 0, 2], [1, 0, 1, 0, 3], [0, 0, 1, 2, 0], [2, 0, 3, 1, 5]][stage][i++ % 5];
      await p.click(`#vf .opt >> nth=${pick}`);
      await p.fill('#vr', `${name} thinks so`);
      await p.click('#vf button[type=submit]'); await p.waitForSelector('#vfs .status--ok');
    }
  };
  await voteAll(0);
  await next(); await proj.waitForSelector('.pj-bars', { timeout: 8000 });
  await next(); // break
  for (let stage = 1; stage <= 3; stage++) {
    await next();
    await voteAll(stage);
    if (stage === 3) await students['FR.general'].screenshot({ path: `${SHOTS}/12-student-archive.png`, fullPage: true });
    await next();
  }
  await proj.waitForSelector('.pj-bars', { timeout: 8000 }); await sleep(400);
  await proj.screenshot({ path: `${SHOTS}/13-projector-votes.png` });
  await next(); // discussion
  const ex = await api({ action: 'export', g, k });
  check('Export after the browser session holds 6 rounds, 4 vote stages and the promises', Object.keys(ex.rounds).length === 6 && Object.keys(ex.tallies).length === 4 && Object.values(ex.rounds).filter(x => x.promises.RU).length >= 3);
  check('Britain’s missed deadline was filled with what happened in 1914', ex.rounds[3].source.GB === 'timeout');

  // ---- printables
  const pr = await tctx.newPage(); watch(pr, 'print');
  await pr.goto(`${BASE}print.html#doc=cards&g=${g}&k=${k}`); await pr.waitForSelector('.rc svg');
  check('Role cards print with 13 QR codes', (await pr.locator('.rc').count()) === 13);
  await pr.setViewportSize({ width: 900, height: 1200 }); await pr.screenshot({ path: `${SHOTS}/14-role-cards.png` });
  await pr.goto(`${BASE}print.html#doc=slips`); await pr.waitForSelector('.slip');
  check('Decision slip pack lists every menu variant', (await pr.locator('.slip').count()) === 52);
  await pr.goto(`${BASE}print.html#doc=record&g=${g}&k=${k}`); await pr.waitForSelector('h2');
  await pr.goto(`${BASE}print.html#doc=runsheet`); await pr.waitForSelector('table');

  // ---- offline mode with the network off
  const octx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const off = await octx.newPage(); watch(off, 'offline');
  await off.goto(`${BASE}offline.html`); await off.waitForSelector('[data-resolve]');
  await sleep(500);
  await octx.setOffline(true);
  for (let r = 1; r <= 6; r++) { await off.click('[data-resolve]'); await sleep(100); }
  await off.waitForSelector('.card--war h2, .card--ok h2');
  const offText = await off.innerText('main');
  check('Offline mode completes a full game with the network off', offText.includes('Scores against 1914') && offText.includes('general European war'));
  await off.screenshot({ path: `${SHOTS}/15-offline-ending.png`, fullPage: true });
  await off.reload(); await off.waitForSelector('main .card h2', { timeout: 8000 }).catch(() => {});
  check('Offline mode reloads from the service-worker cache with no network', (await off.innerText('body')).includes('Scores against 1914'));
  await octx.setOffline(false);

  // ---- network drop during a live game: student page recovers
  setOffline(true);
  await sleep(5000);
  const banner = await students['AH.leader'].$('#d37-net');
  setOffline(false);
  await students['AH.leader'].waitForFunction(() => !document.getElementById('d37-net'), null, { timeout: 8000 });
  check('Student page shows "Reconnecting…" when the network drops, and recovers', !!banner);

  check('No JavaScript errors on any page', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  console.error(e); fail++;
} finally {
  await browser.close(); server.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
