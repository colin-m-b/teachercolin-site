// 37 Days — teacher panel: teacher.html#g=GAME&k=TEACHERKEY. Run it on your phone, never on the projector.
'use strict';
(async () => {
  const { api, params, poll, esc, bindTimer, fmtTime } = D37;
  const q = params();
  const g = q.g, k = q.k;
  const $ = s => document.querySelector(s);
  const main = $('#main');
  if (!g || !k) { main.innerHTML = '<div class="card card--war"><h2>Missing game link</h2><p>Start or reopen a game from the <a href="./">37 Days start page</a>.</p></div>'; return; }
  const { extras: X } = await D37.loadEngine(['extras']);
  const P = Object.keys(X.TEAM);
  let view = null, pending = null, busy = false;
  bindTimer($('#timer'), () => view?.timer);
  const base = location.origin + location.pathname.replace(/teacher\.html$/, '');
  const links = {
    projector: `${base}projector.html#g=${g}`,
    cards: `${base}print.html#doc=cards&g=${g}&k=${k}`,
    record: `${base}print.html#doc=record&g=${g}&k=${k}`,
    slips: `${base}print.html#doc=slips`, runsheet: `${base}print.html#doc=runsheet`, exit: `${base}print.html#doc=exit`,
    offline: `${base}offline.html`,
  };
  const roleLink = (t, r) => `${base}play.html#g=${g}&t=${t}&r=${r}&k=${view.keys.roles[`${t}.${r}`]}`;

  function nextLabel(v) {
    const n = v.next; if (!n) return null;
    if (v.phase === 'lobby') return 'Start the practice round';
    if (v.phase === 'practice') return v.step === 'open' ? 'Reveal the practice result' : 'Start round 1: telegrams';
    if (v.phase === 'round') {
      if (v.step === 'telegram') return 'Open the council';
      if (v.step === 'council') return n.step === 'diplomacy' ? 'Open the diplomacy window' : 'Call for decisions';
      if (v.step === 'diplomacy') return 'Call for decisions';
      if (v.step === 'decision') return `Lock and resolve round ${v.round}`;
      if (v.step === 'result') return v.round < 6 ? `Start round ${v.round + 1}` : 'Show the ending';
    }
    if (v.phase === 'ending') return v.step === 'map' ? 'Show what really happened' : v.step === 'replay' ? 'Show scores against 1914' : 'Open the Colour Books';
    if (v.phase === 'colour') return 'Close Colour Books, open the exit vote';
    if (v.phase === 'vote') return v.step === 'open' ? 'Close the vote, show results' : v.stage === 0 ? 'End lesson 1' : v.stage < 3 ? (v.stage === 1 ? 'Release the Fischer files (stage 2)' : 'Release every archive (stage 3, Clark)') : 'Show all four votes';
    if (v.phase === 'break') return 'Lesson 2: release the Colour Books (stage 1)';
    if (v.phase === 'discussion') return 'Finish';
    return null;
  }

  async function act(body, confirmText) {
    if (busy) return; if (confirmText && !confirm(confirmText)) return;
    busy = true; document.querySelectorAll('[data-act]').forEach(b => { b.disabled = true; });
    try { const v = await api({ action: 'do', g, k, ...body }); render(v, true); }
    catch (e) { alert(e.message); P_.refresh(); }
    finally { busy = false; document.querySelectorAll('[data-act]').forEach(b => { b.disabled = false; }); }
  }

  function render(v, force) {
    // Do not redraw while the teacher is typing or using a menu; redraw when they leave it.
    const a = document.activeElement;
    if (!force && a && main.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) { pending = v; return; }
    pending = null; view = v;
    $('#meta').textContent = `Game ${v.gid} · ${v.phase === 'round' ? `Round ${v.round} · ${X.STEPS[v.step].name}` : v.phase}`;
    const label = nextLabel(v);
    const danger = v.phase === 'round' && v.step === 'decision';
    let html = `<div class="card card--accent noprint">
      <div class="eyebrow">${v.phase === 'round' ? `Round ${v.round} of 6 · ${esc(v.dates)} · ${esc(v.title)}` : 'Next step'}</div>
      ${label ? `<button class="btn btn--big ${danger ? 'btn--war' : ''}" data-act="next">${esc(label)}</button>` : '<p><b>The game is finished.</b> Export the record below.</p>'}
      <div class="row" style="margin-top:10px">
        ${['lobby', 'practice'].includes(v.phase) ? '<button class="btn btn--ghost btn--small" data-act="skip">Skip practice</button>' : ''}
        ${v.timer ? '<button class="btn btn--ghost btn--small" data-act="t30">+30 s</button><button class="btn btn--ghost btn--small" data-act="tstop">Stop timer</button>' : v.phase === 'round' ? '<button class="btn btn--ghost btn--small" data-act="t30">Start a 30 s timer</button>' : ''}
        ${v.undoable ? `<button class="btn btn--ghost btn--small" data-act="undo">Undo round ${v.undoable}</button>` : ''}
      </div></div>`;

    // teams: one card each (readable on a phone)
    html += `<div class="card"><h2>Teams</h2><div class="tgrid">`;
    for (const p of P) {
      const t = v.state.teams[p];
      const roles = X.roleSet(t.size);
      let status = '';
      if (v.presence) status = roles.map(r => `<span title="${r}" style="color:${v.presence[`${p}.${r}`] ? 'var(--ok)' : 'var(--muted)'}">${v.presence[`${p}.${r}`] ? '●' : '○'} ${X.ROLE[r].name}</span>`).join(' ');
      else if (v.lights) status = `<span class="${v.lights[p] === 'decided' ? 'status--ok' : 'muted'}">${esc(v.lights[p])}</span>`;
      if (v.phase === 'practice' && v.practiceSubs) status += v.practiceSubs[p] ? ` · <b>${esc(v.practiceSubs[p])}</b>` : '';
      let dec = '', ov = '';
      if (v.phase === 'round') {
        const res = v.state.resolved[v.round];
        const sub = v.subs?.[p];
        if (res) dec = `<b>${esc(res.labels[p])}</b> <span class="muted small">(${esc(res.source[p])})</span>${res.justifications[p] ? `<br><span class="small">“${esc(res.justifications[p])}”</span>` : ''}`;
        else if (sub?.stale) dec = '<span class="status--err small">Old submission from before an undo: ignored</span>';
        else if (sub) dec = `${esc(sub.label)} <span class="muted small">${fmtTime(sub.at)}</span>${sub.justification ? `<br><span class="small">“${esc(sub.justification)}”</span>` : ''}`;
        else dec = '<span class="muted">No decision yet</span>';
        if (!res) {
          const cur = v.state.overrides[v.round]?.[p] || '';
          ov = `<select data-ov="${p}" aria-label="Override ${p}"><option value="">No override</option>${v.menus[p].map(o => `<option value="${esc(o.id)}" ${cur === o.id ? 'selected' : ''}>${o.hist ? '★ ' : ''}${esc(o.label)}</option>`).join('')}</select>`;
        }
      }
      html += `<div class="tcard"><div class="row" style="justify-content:space-between"><b><span class="swatch" style="--team:${X.TEAM[p].colour};display:inline-block;vertical-align:-2px"></span> ${esc(v.teamNames[p])}</b>
        <span class="row small"><label>Size <select data-size="${p}" aria-label="Team size" style="width:auto;padding:4px">${[1, 2, 3].map(n => `<option ${n === t.size ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label><input type="checkbox" data-comp="${p}" ${t.computer ? 'checked' : ''}> Computer</label></span></div>
        <div class="small" style="margin-top:4px">${status}</div>${dec ? `<div style="margin-top:6px">${dec}</div>` : ''}${ov ? `<div style="margin-top:6px">${ov}</div>` : ''}</div>`;
    }
    html += '</div><p class="small muted" style="margin-top:6px">Computer-played teams and missed deadlines get what happened in 1914 (★). An override beats the team’s submission.</p></div>';

    if (v.promises && Object.keys(v.promises).length) {
      html += `<div class="card"><h2>Secret promises logged this round</h2>${Object.entries(v.promises).map(([p, x]) => `<p><b>${esc(X.TEAM[p].name)} → ${esc(X.TEAM[x.to].name)}:</b> ${esc(x.text)}</p>`).join('')}</div>`;
    }
    if (v.phase === 'round' && v.telegrams?.length) {
      html += `<details class="card"><summary>${v.state.resolved[v.round] ? 'This round’s results' : 'Telegrams the teams are reading'} (all, with who sees them)</summary><div class="telegrams">${v.telegrams.map(e => `<div class="tg"><span class="tg__tag ${e.vis === 'public' ? 'tg__tag--public' : 'tg__tag--secret'}">${e.vis === 'public' ? 'Public' : esc(e.vis.join(', '))}</span>${esc(e.text)}</div>`).join('')}</div></details>`;
    }
    if (v.note) {
      html += `<details class="card"><summary>Teacher note · round ${v.round}</summary><p><b>What really happened.</b> ${esc(v.note.happened)}</p><p><b>What the game compresses.</b> ${esc(v.note.compressed)}</p><p><b>Where the other options come from.</b> ${esc(v.note.counterfactuals)}</p></details>`;
    }
    if (v.phase === 'colour' && v.colour) html += `<div class="card"><h2>Colour Books</h2>${P.map(p => `<p>${esc(X.TEAM[p].name)}: ${v.colour[p].length === 2 ? '<span class="status--ok">published</span>' : 'not yet'}</p>`).join('')}</div>`;
    if (v.votesExpected) html += `<div class="card"><h2>Votes in: ${v.votesIn} of ${v.votesExpected}</h2></div>`;
    if (v.fullScores) {
      html += `<details class="card"><summary>Full scores (all objectives)</summary><table class="t"><tbody>${P.map(p => `<tr><td>${esc(X.TEAM[p].name)}</td><td>${v.fullScores[p].parts.join(' + ')} ${v.fullScores[p].prestige ? `${v.fullScores[p].prestige}` : ''}</td><td class="num"><b>${v.fullScores[p].total}</b></td></tr>`).join('')}</tbody></table></details>`;
    }

    // links and settings
    html += `<div class="card noprint"><h2>Screens and printables</h2>
      <p><a href="${links.projector}" target="_blank" rel="noopener">Projector page</a> · open on the classroom computer.</p>
      <p><a href="${links.cards}" target="_blank" rel="noopener">Role cards with QR codes</a> · <a href="${links.slips}" target="_blank" rel="noopener">Decision slips</a> · <a href="${links.runsheet}" target="_blank" rel="noopener">Run sheet</a> · <a href="${links.exit}" target="_blank" rel="noopener">Exit ticket</a></p>
      <p><a href="${links.record}" target="_blank" rel="noopener">Printable game record</a> · <button class="btn btn--ghost btn--small" data-act="export">Download JSON export</button></p>
      <p class="small muted">Wi-fi down? Open <a href="${links.offline}" target="_blank" rel="noopener">offline mode</a> and type choices from the paper slips.</p>
      <details style="margin-top:8px"><summary class="small">Role links (to rehearse alone, or if a QR code will not scan)</summary><p class="small muted" style="margin-top:6px">To rehearse alone: open any role in a new tab (or on a second device) and play it; tick “Computer” for the teams you are not playing.</p>${P.map(p => X.roleSet(v.state.teams[p].size).map(r => `<div class="small" style="word-break:break-all;margin-top:4px"><b>${esc(X.TEAM[p].name)} · ${X.ROLE[r].name}:</b> <a href="${esc(roleLink(p, r))}" target="_blank" rel="noopener">open</a> <span class="muted">${esc(roleLink(p, r))}</span></div>`).join('')).join('')}</details></div>`;
    html += `<details class="card noprint"><summary>Timers and diplomacy</summary>
      <div class="row">${Object.keys(X.DEFAULT_SECONDS).map(s => `<label class="small" style="width:120px">${X.STEPS[s].name} (s)<input type="number" min="10" max="900" data-dur="${s}" value="${v.state.durations[s]}"></label>`).join('')}</div>
      <label class="row small" style="margin-top:10px"><input type="checkbox" data-skipdip ${v.state.skipDiplomacy ? 'checked' : ''}> Skip the diplomacy windows (saves 2 minutes a round)</label>
      <button class="btn btn--ghost btn--small" style="margin-top:10px" data-act="save">Save settings</button></details>`;
    main.innerHTML = html;
  }

  main.addEventListener('focusout', () => setTimeout(() => { if (pending && !main.contains(document.activeElement)) render(pending); }, 50));
  main.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || !view) return;
    const v = view, from = `${v.phase}:${v.round}:${v.step}:${v.stage}`;
    const a = b.dataset.act;
    if (a === 'next') {
      const missing = v.phase === 'round' && v.step === 'decision' ? P.filter(p => v.lights?.[p] === 'thinking') : [];
      act({ op: 'next', from }, missing.length ? `Not decided yet: ${missing.map(p => X.TEAM[p].name).join(', ')}. They will get what happened in 1914. Lock the round?` : null);
    }
    if (a === 'skip') act({ op: 'skipPractice', from });
    if (a === 't30') act({ op: 'timer', add: 30 });
    if (a === 'tstop') act({ op: 'timer', stop: true });
    if (a === 'undo') act({ op: 'undo', round: v.undoable }, `Undo round ${v.undoable}? Its result is removed and the round goes back to the decision step. Teams keep their submissions.`);
    if (a === 'save') {
      const durations = {}; main.querySelectorAll('[data-dur]').forEach(i => { durations[i.dataset.dur] = Number(i.value); });
      act({ op: 'settings', durations, skipDiplomacy: main.querySelector('[data-skipdip]').checked });
    }
    if (a === 'export') exportJSON();
  });
  main.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.ov) act({ op: 'override', round: view.round, team: t.dataset.ov, choice: t.value || null });
    if (t.dataset.size) act({ op: 'size', team: t.dataset.size, size: Number(t.value) });
    if (t.dataset.comp) act({ op: 'computer', team: t.dataset.comp, on: t.checked });
  });

  async function exportJSON() {
    try {
      const data = await api({ action: 'export', g, k });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `37-days-${g}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) { alert(e.message); }
  }

  const P_ = poll(() => api({ action: 'teacher', g, k }), v => render(v));
})();
