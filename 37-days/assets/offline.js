// 37 Days — offline mode. The tested engine runs in this browser; choices come from paper slips.
// offline.html            control screen (your phone)
// offline.html#screen=pj  public screen for a second display on the same computer (no secrets)
'use strict';
(async () => {
  const { esc } = D37;
  const main = document.getElementById('main');
  const STORE = 'd37:offline';
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  let M;
  try { M = await D37.loadEngine(['scenario', 'content', 'engine', 'extras']); }
  catch { main.innerHTML = '<div class="card card--war"><h2>Offline mode is not loaded</h2><p>Open this page once while the Wi-fi works, then keep the tab open.</p></div>'; return; }
  const { scenario: S, content: C, engine: G, extras: X } = M;
  let variants = {};
  try { variants = (await (await fetch('engine/menu-variants.json')).json()).variants; } catch {}
  const P = S.POWERS;

  // Par: the 1914 path, computed by the engine itself.
  let hs = G.newGame(); for (let r = 1; r <= 6; r++) hs = G.play(hs, {}).state;
  const PAR = Object.fromEntries(P.map(p => [p, G.finish(hs).score[p].total]));

  const fresh = () => ({ engine: G.newGame(), snaps: [], choices: {}, pending: {}, startedAt: Date.now() });
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || fresh(); } catch { return fresh(); } };
  let st = load();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch {} };
  const ev = e => C.EVENTS[e.id] || e.id;

  // ---------- public screen
  if (location.hash.includes('screen=pj')) {
    document.body.className = 'proj';
    document.querySelector('.bar').remove();
    const draw = () => {
      st = load();
      const done = st.engine.round;
      if (done === 6) {
        const fin = G.finish(st.engine);
        main.innerHTML = `<div class="pj-top"><div><div class="pj-date">4 August 1914</div><div class="pj-title">The ending</div></div></div><div class="pj-grid"><div class="pj-ending ${fin.ending === 'peace' ? 'is-peace' : ''}"><div class="pj-big">${esc(C.ENDINGS[fin.ending])}</div></div><div>${D37Map.svg(st.engine.f.war)}</div></div>`;
        return;
      }
      const r = done + 1, R = S.ROUNDS[r - 1];
      const feed = st.engine.log.filter(e => e.r === done && e.vis === 'public');
      main.innerHTML = `<div class="pj-top"><div><div class="pj-date">${esc(R.dates)}</div><div class="pj-title">Round ${r} of 6 · ${esc(R.title)}</div></div></div><div class="pj-feed"><div class="pj-tg pj-tg--intro">${esc(X.INTROS[r])}</div>${feed.map(e => `<div class="pj-tg">${esc(ev(e))}</div>`).join('')}</div>`;
    };
    draw(); setInterval(draw, 1000); window.addEventListener('storage', draw);
    return;
  }

  function code(r, p, m) { return variants[`${r}.${p}:${m.map(x => x.id).join(',')}`]?.code || null; }

  function render() {
    const done = st.engine.round;
    document.getElementById('meta').textContent = done < 6 ? `Round ${done + 1} of 6` : 'Ending';
    let html = `<div class="card card--warn small">Offline mode runs the game on this device only. Read public telegrams aloud; show each team its secret telegrams on this screen. <a href="offline.html#screen=pj" target="_blank">Open a public screen</a> (for a second display on this computer).</div>`;
    if (done > 0) {
      const last = st.engine.log.filter(e => e.r === done);
      html += `<div class="card"><h2>Results of round ${done}</h2><h3>Public: read aloud</h3><div class="telegrams">${last.filter(e => e.vis === 'public').map(e => `<div class="tg">${esc(ev(e))}</div>`).join('')}</div>
        <h3 style="margin-top:12px">Secret: show each team</h3><div class="row">${P.map(p => `<button class="btn btn--ghost btn--small" data-show="${p}">${esc(X.teamName(p, done))} (${last.filter(e => e.vis !== 'public' && e.vis.includes(p)).length})</button>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn btn--ghost btn--small" data-undo>Undo round ${done}</button></div></div>`;
    }
    if (done < 6) {
      const r = done + 1, R = S.ROUNDS[r - 1];
      html += `<div class="card card--accent"><div class="eyebrow">Round ${r} of 6 · ${esc(R.dates)}</div><h2>${esc(R.title)}</h2><p class="small muted">Tell each team its slip code. Tap the option each team circled. Leave a team blank and it does what happened in 1914 (★).</p>`;
      for (const p of P) {
        const m = G.menu(st.engine, r, p);
        const c = code(r, p, m);
        html += `<div class="teamrow"><div><b>${esc(X.teamName(p, r))}</b><br><span class="small">${c ? `Slip <b style="font-family:var(--font-mono)">${esc(c)}</b>` : '<span class="status--err">Not in the slip pack: read the options aloud</span>'}</span></div><div>${m.map((o, i) => `<button class="optbtn ${st.pending[p] === o.id ? 'is-on' : ''}" data-p="${p}" data-o="${esc(o.id)}"><b>${'ABC'[i]}</b> ${o.hist ? '★ ' : ''}${esc(o.label)}</button>`).join('')}</div></div>`;
      }
      html += `<button class="btn btn--big btn--war" data-resolve style="margin-top:10px">Resolve round ${r}</button></div>`;
    } else {
      const fin = G.finish(st.engine);
      html += `<div class="card ${fin.ending === 'peace' ? 'card--ok' : 'card--war'}"><h2>${esc(C.ENDINGS[fin.ending])}</h2>${fin.modifiers.map(m => `<p>${esc(C.MODIFIERS[m])}</p>`).join('')}</div>
        <div class="card"><h2>Scores against 1914</h2><table class="t"><tbody>${P.map(p => `<tr><td>${esc(X.TEAM[p].name)}</td><td class="num"><b>${fin.score[p].total}</b></td><td class="num">1914: ${PAR[p]}</td></tr>`).join('')}</tbody></table></div>
        <div class="card">${D37Map.svg(st.engine.f.war)}</div>`;
    }
    html += `<div class="card"><h2>Save and upload</h2><p class="small">Download the choices now. Later, upload them on the <a href="./">start page</a> (“Backups”) to run the archive lesson on students’ devices.</p>
      <div class="row"><button class="btn btn--ghost btn--small" data-export>Download offline game</button><button class="btn btn--ghost btn--small" data-reset>Start a new offline game</button></div></div>`;
    main.innerHTML = html;
  }

  function showTeam(p) {
    const done = st.engine.round;
    const es = st.engine.log.filter(e => e.r === done && e.vis !== 'public' && e.vis.includes(p));
    const o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = `<div class="wrap"><div class="eyebrow">Secret · for ${esc(X.teamName(p, done))} only</div><h1>Round ${done}: your secret telegrams</h1><div class="telegrams" style="margin-top:12px">${es.map(e => `<div class="tg" style="font-size:1.2rem">${esc(ev(e))}</div>`).join('') || '<p>None this round.</p>'}</div><button class="btn btn--big" style="margin-top:20px">Done: hide</button></div>`;
    o.querySelector('button').onclick = () => o.remove();
    document.body.appendChild(o);
  }

  main.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.p) { st.pending[t.dataset.p] = st.pending[t.dataset.p] === t.dataset.o ? undefined : t.dataset.o; save(); render(); }
    if (t.dataset.show) showTeam(t.dataset.show);
    if ('resolve' in t.dataset) {
      const r = st.engine.round + 1;
      const blank = P.filter(p => !st.pending[p]);
      if (blank.length && !confirm(`No choice for ${blank.map(p => X.TEAM[p].name).join(', ')}: they get what happened in 1914. Resolve?`)) return;
      st.snaps.push(st.engine);
      const res = G.play(st.engine, st.pending);
      st.engine = res.state; st.choices[r] = res.state.ch[r]; st.pending = {};
      save(); render(); window.scrollTo(0, 0);
    }
    if ('undo' in t.dataset && confirm('Undo the last round?')) { const r = st.engine.round; st.pending = { ...st.choices[r] }; delete st.choices[r]; st.engine = st.snaps.pop(); save(); render(); }
    if ('export' in t.dataset) {
      const blob = new Blob([JSON.stringify({ format: '37-days-offline-1', exportedAt: new Date().toISOString(), choices: st.choices, log: st.engine.log }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `37-days-offline-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    }
    if ('reset' in t.dataset && confirm('Start a new offline game? Download the current one first if you need it.')) { st = fresh(); save(); render(); }
  });
  render();
})();
