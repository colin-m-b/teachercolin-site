// 37 Days — printables: print.html#doc=cards|slips|runsheet|exit|record (cards and record need the teacher link).
'use strict';
(async () => {
  const { api, params, esc } = D37;
  const q = params();
  const main = document.getElementById('main');
  const { scenario: S, extras: X } = await D37.loadEngine(['scenario', 'extras']);
  const P = S.POWERS;
  window.addEventListener('hashchange', () => location.reload());
  const doc = q.doc || 'runsheet';
  document.title = `37 Days · ${({ cards: 'Role cards', slips: 'Decision slips', runsheet: 'Run sheet', exit: 'Exit ticket', record: 'Game record' })[doc] || 'Print'}`;

  function qr(text) {
    const c = qrcode(0, 'M'); c.addData(text); c.make();
    return c.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  if (doc === 'cards') {
    if (!q.g || !q.k) { main.innerHTML = '<p>Open role cards from the teacher panel.</p>'; return; }
    const v = await api({ action: 'teacher', g: q.g, k: q.k });
    const base = location.origin + location.pathname.replace(/print\.html$/, '');
    let html = `<h1 class="noprint" style="margin:10px 0">Role cards · game ${esc(v.gid)}</h1><p class="noprint small muted">Cut out one card per student. Each QR code opens that role’s screen. Keep cards face down until set-up: a card is a key.</p><div class="cards">`;
    for (const p of P) for (const r of X.roleSet(v.state.teams[p].size)) {
      const url = `${base}play.html#g=${v.gid}&t=${p}&r=${r}&k=${v.keys.roles[`${p}.${r}`]}`;
      const pw = X.powers(v.state.teams[p].size, r);
      html += `<div class="rc"><div class="bandc" style="background:${X.TEAM[p].colour}"></div><div>
        <div class="eyebrow">37 Days · ${esc(X.TEAM[p].capital)}</div><h2>${esc(X.TEAM[p].name)}</h2><h3>${esc(X.ROLE[r].name)}${pw.envoy && r !== 'envoy' ? ' and Envoy' : ''}</h3>
        <p class="small">${esc(X.ROLE[r].job)}</p>${p === 'RS' ? '<p class="small"><b>From round 5 your team plays Belgium.</b></p>' : ''}
        <p class="small muted">Leaders: ${esc(X.TEAM[p].leaders)}</p></div><div class="qr">${qr(url)}<div class="small muted" style="text-align:center">Game ${esc(v.gid)}</div></div>
        ${v.keys.join ? `<div class="small" style="grid-column:1/-1;border-top:1px solid #999;padding-top:6px">Can’t scan? Go to <b>${esc(location.host)}/37-days/join</b> · Game <b style="font-family:var(--font-mono)">${esc(v.gid)}</b> · Your code <b style="font-family:var(--font-mono)">${esc(v.keys.join[`${p}.${r}`])}</b></div>` : ''}</div>`;
    }
    main.innerHTML = html + '</div>';
    return;
  }

  if (doc === 'slips') {
    const { variants } = await (await fetch('engine/menu-variants.json', { cache: 'no-cache' })).json();
    let html = '<h1 class="noprint" style="margin:10px 0">Decision slips (Wi-fi backup)</h1><p class="noprint small muted">One packet per team. In offline mode the teacher panel tells you which slip code each team uses each round; the options can change with earlier choices.</p>';
    for (const p of P) {
      html += `<div class="pb"><h2>${esc(X.TEAM[p].name)}${p === 'RS' ? ' (Belgium from round 5)' : ''} · decision slips</h2>`;
      const list = Object.values(variants).filter(x => x.team === p).sort((a, b) => a.round - b.round || a.code.localeCompare(b.code));
      for (const x of list) {
        html += `<div class="slip"><span class="code">${esc(x.code)}</span><b>Round ${x.round} · ${esc(S.ROUNDS[x.round - 1].dates)} · ${esc(S.ROUNDS[x.round - 1].title)}</b>
          <ol type="A">${x.options.map(o => `<li>${esc(o.label)}</li>`).join('')}</ol>
          <div class="row small"><span>Our choice (circle): A B C</span></div><div class="small">Why?</div><div class="fill"></div></div>`;
      }
      html += '</div>';
    }
    main.innerHTML = html;
    return;
  }

  if (doc === 'exit') {
    const one = `<div class="slip" style="padding:16px"><b>37 Days · Exit ticket</b><p class="small">Name: ______________________ Team: ______________</p>
      <p style="margin-top:8px"><b>${esc(X.VOTE_QUESTION)}</b> (circle one)</p><p>${P.map(p => esc(X.TEAM[p].name)).join(' · ')}</p>
      <p class="small" style="margin-top:8px">One sentence: why?</p><div class="fill"></div><div class="fill"></div></div>`;
    main.innerHTML = one.repeat(4);
    return;
  }

  if (doc === 'record') {
    if (!q.g || !q.k) { main.innerHTML = '<p>Open the record from the teacher panel.</p>'; return; }
    const d = await api({ action: 'export', g: q.g, k: q.k });
    let html = `<h1>37 Days · game record ${esc(d.gid)}</h1><p class="muted small">Exported ${esc(new Date(d.exportedAt).toLocaleString())}</p>`;
    if (d.result) html += `<div class="card"><h2>${esc(d.result.endingText)}</h2><table class="t"><thead><tr><th>Team</th><th class="num">Score</th><th class="num">1914</th></tr></thead><tbody>${P.map(p => `<tr><td>${esc(X.TEAM[p].name)}</td><td class="num">${d.result.score[p].total}</td><td class="num">${d.result.par[p]}</td></tr>`).join('')}</tbody></table></div>`;
    for (const [r, x] of Object.entries(d.rounds)) {
      html += `<div class="card"><h2>Round ${r} · ${esc(x.dates)} · ${esc(x.title)}</h2><table class="t"><thead><tr><th>Team</th><th>Decision</th><th>Reason given</th><th>Secret promise</th></tr></thead><tbody>${P.map(p => `<tr><td>${esc(X.teamName(p, Number(r)))}</td><td>${esc(x.labels[p])} <span class="muted small">(${esc(x.source[p])})</span></td><td>${esc(x.justifications[p] || '')}</td><td>${x.promises[p] ? `to ${esc(X.TEAM[x.promises[p].to].name)}: ${esc(x.promises[p].text)}` : ''}</td></tr>`).join('')}</tbody></table>
        <h3 style="margin-top:10px">Telegrams</h3>${d.log.filter(e => String(e.r) === r).map(e => `<div class="small">• <b>${e.vis === 'public' ? 'Public' : esc(e.vis.join(', '))}:</b> ${esc(e.text)}</div>`).join('')}</div>`;
    }
    if (Object.keys(d.colourBooks || {}).length) html += `<div class="card"><h2>Colour Books</h2>${P.map(p => `<p><b>${esc(X.TEAM[p].name)}:</b> ${esc((d.colourBooks[p] || []).join(', ') || 'nothing')}</p>`).join('')}</div>`;
    if (Object.keys(d.tallies || {}).length) html += `<div class="card"><h2>Votes</h2><table class="t"><thead><tr><th>Vote</th>${P.map(p => `<th class="num">${esc(X.TEAM[p].name)}</th>`).join('')}</tr></thead><tbody>${Object.entries(d.tallies).map(([s, t]) => `<tr><td>${esc(X.STAGES[s].name)}</td>${P.map(p => `<td class="num">${t.counts[p]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    main.innerHTML = html;
    return;
  }

  // run sheet
  const rows = [
    ['0–8', 'Set-up', 'Teams sit at labelled capital tables. Each student scans their role card. Check every dot turns green on the panel. Tick “computer” for any absent team.'],
    ['8–12', 'Practice round', 'Panel: Start the practice round → Reveal. Point at the projector: decided lights, then the result.'],
    ['12–56', 'Rounds 1–6', 'Each round: Telegrams (2 min) → Council (2½ min) → Diplomacy (2 min, rounds 2–5 only) → Decision (1 min) → Lock and resolve → Result (1 min). One button per step.'],
    ['56–66', 'The ending', 'Show the ending and war map → what really happened → scores against 1914.'],
    ['66–72', 'Colour Books', 'Leaders publish two of their own documents.'],
    ['72–80', 'Exit ticket', 'First vote: which power was most responsible? One sentence of reasoning. Close the vote → results → End lesson 1. Export the record before you leave the room.'],
  ];
  main.innerHTML = `<h1>37 Days · Run sheet</h1>
    <div class="card card--war"><b>Never put the teacher panel on the projector.</b> Panel on your phone; projector page on the classroom computer; sound off.</div>
    <h2 style="margin-top:14px">Lesson 1 (80 minutes): the game</h2>
    <table class="t"><thead><tr><th>Minutes</th><th>Phase</th><th>What you do</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
    <p class="small" style="margin-top:6px">Running late? In the panel, tick “Skip the diplomacy windows” (saves 2 minutes a round). After the first run, skip the practice round.</p>
    <h2 style="margin-top:14px">Cues</h2>
    <ul style="padding-left:20px"><li><b>Telegrams:</b> “New telegrams. Read your briefing.”</li><li><b>Council:</b> “Leaders, ask your General what the military briefing says.”</li><li><b>Diplomacy:</b> “Envoys, visit one table. Two minutes. Log any promise.” Ring the bell at the end.</li><li><b>Decision:</b> “Leaders, submit now. If you miss the deadline, your country does what it did in 1914.”</li><li><b>Result:</b> read the public telegrams aloud from the projector.</li><li><b>Round 3:</b> France may be at sea: radio fragments only, no visits to or from France.</li><li><b>Round 5:</b> “Serbia’s team now plays Belgium.”</li></ul>
    <h2 style="margin-top:14px">If something goes wrong</h2>
    <ul style="padding-left:20px"><li><b>Wrong click on Lock:</b> Undo round (panel). Teams keep their submissions.</li><li><b>A student refreshes or closes the tab:</b> scan the card again; nothing is lost.</li><li><b>Two devices on one team:</b> the last submission before the lock counts; the panel shows it. Use Override if needed.</li><li><b>Wi-fi drops:</b> open offline mode (already loaded on your phone), hand out the paper slips, type in the choices.</li></ul>
    <h2 style="margin-top:14px">Lesson 2 (40 minutes): the archive release</h2>
    <table class="t"><tbody><tr><td>0–5</td><td>Recap: the class’s own timeline (printable game record).</td></tr><tr><td>5–25</td><td>Panel: release stage 1 (Colour Books) → vote → results; stage 2 (Fischer) → vote → results; stage 3 (Clark) → vote → results.</td></tr><tr><td>25–33</td><td>Discussion: What evidence changed your mind? Who controlled what you could see?</td></tr><tr><td>33–40</td><td>Writing: one paragraph. Which power was most responsible, and how did new evidence change your view?</td></tr></tbody></table>
    <h2 style="margin-top:14px">Day-of pre-flight</h2>
    <ul style="padding-left:20px"><li>Devices charged; Wi-fi checked at 8:00 (open a role link on a student device).</li><li>Game created, team sizes set, computer-played teams set for absences.</li><li>Role cards, decision slips and this run sheet printed.</li><li>Offline mode opened once on your phone.</li><li>Record exported at the end, before you leave the room.</li></ul>`;
})();
