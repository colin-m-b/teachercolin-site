// 37 Days — student page. Opened from the QR code on a role card: play.html#g=GAME&t=TEAM&r=ROLE&k=KEY
'use strict';
(async () => {
  const { api, params, poll, esc, gloss, bindTimer, fmtTime } = D37;
  const q = params();
  const id = { g: q.g, t: q.t, role: q.r, k: q.k };
  const $ = s => document.querySelector(s);
  const main = $('#main');
  if (!id.g || !id.t || !id.role || !id.k) { main.innerHTML = '<div class="card card--war"><h2>This link is incomplete</h2><p>Scan the QR code on your role card again.</p></div>'; return; }

  const { extras: X } = await D37.loadEngine(['extras']);
  D37.setGlossary(X.GLOSSARY);
  const NAMES = Object.fromEntries(Object.entries(X.TEAM).map(([k, v]) => [k, v.name]));

  // Drafts survive re-renders and refreshes (per device, per round).
  const draftKey = r => `d37:${id.g}:${id.t}:${id.role}:r${r}`;
  const loadDraft = r => { try { return JSON.parse(localStorage.getItem(draftKey(r))) || {}; } catch { return {}; } };
  const saveDraft = (r, d) => { try { localStorage.setItem(draftKey(r), JSON.stringify(d)); } catch {} };

  let view = null;
  bindTimer($('#timer'), () => view?.timer);
  api({ action: 'hello', ...id }).catch(() => {});
  setInterval(() => api({ action: 'hello', ...id }).catch(() => {}), 60000);

  // Each section is replaced only when its HTML changes, so typing and focus are never disturbed.
  const sections = {};
  function section(name, html) {
    let el = sections[name];
    if (!el) { el = document.createElement('section'); el.dataset.s = name; sections[name] = el; el._html = null; }
    if (el._html !== html) { el.innerHTML = html; el._html = html; el.dispatchEvent(new CustomEvent('rendered')); }
    return el;
  }
  function layout(names) {
    const want = names.map(n => sections[n]);
    if ([...main.children].length !== want.length || want.some((el, i) => main.children[i] !== el)) { main.innerHTML = ''; want.forEach(el => main.appendChild(el)); }
  }

  const tgHTML = (e) => {
    const tag = e.mine ? '<span class="tg__tag tg__tag--mine">You</span>' : e.public ? '<span class="tg__tag tg__tag--public">Public</span>' : '<span class="tg__tag tg__tag--secret">Secret</span>';
    return `<div class="tg">${tag}${gloss(e.text)}</div>`;
  };
  const stepsHTML = v => {
    const steps = ['telegram', 'council', ...(v.diplomacyThisRound ? ['diplomacy'] : []), 'decision', 'result'];
    return `<div class="steps">${steps.map(s => `<span class="${s === v.step ? 'is-now' : ''}">${X.STEPS[s].name}</span>`).join('')}</div>`;
  };

  function render(v) {
    view = v;
    const teamColour = X.TEAM[v.team].colour;
    $('#swatch').style.setProperty('--team', teamColour);
    $('#team').textContent = `${v.teamName} · ${X.ROLE[v.role].name}`;
    $('#meta').textContent = v.phase === 'round' ? `Round ${v.round} of 6 · ${v.dates}` : '';
    const names = [], binds = [];

    if (v.phase === 'lobby') {
      section('lobby', `<div class="card card--accent"><div class="eyebrow">Welcome</div><h1>You are the ${esc(X.ROLE[v.role].name)} of ${esc(X.TEAM[v.team].name)}</h1>
        <p>${esc(X.ROLE[v.role].job)}</p>${v.powers.envoy && v.role !== 'envoy' ? '<p>You are also your team’s <b>Envoy</b>: in diplomacy windows you visit one other table and can log a secret promise.</p>' : ''}
        <p class="muted">Your leaders: ${esc(X.TEAM[v.team].leaders)}. Capital: ${esc(X.TEAM[v.team].capital)}.</p>
        <p><b>Wait for your teacher to start.</b> Keep this page open. If you close it, scan your card again.</p></div>`);
      names.push('lobby');
    }

    if (v.phase === 'practice' && v.practice) {
      const pr = v.practice;
      let html = `<div class="card card--accent"><div class="eyebrow">Practice round · no points</div><p>${gloss(pr.prompt)}</p>`;
      if (pr.result) {
        html += `<h3 style="margin-top:12px">What the teams chose</h3>` + pr.result.options.map(o => `<div>${esc(o.label)}: <b>${pr.result.counts[o.id]}</b></div>`).join('');
      } else if (v.powers.submit) {
        html += `<form id="pf"><div class="options">${pr.options.map(o => `<label class="opt ${pr.mine?.choice === o.id ? 'is-chosen' : ''}"><input type="radio" name="c" value="${o.id}" ${pr.mine?.choice === o.id ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>
          <button class="btn" type="submit">Submit</button><div class="status" id="pfs">${pr.mine ? '<span class="status--ok">Submitted. Watch the projector.</span>' : ''}</div></form>`;
      } else {
        html += `<div class="options">${pr.options.map(o => `<div class="opt opt--static">${esc(o.label)}</div>`).join('')}</div><p class="muted">Discuss with your Leader. Your Leader submits.</p>`;
      }
      section('practice', html + '</div>');
      names.push('practice');
      binds.push(() => {
      const pf = document.getElementById('pf');
      if (pf && !pf._bound) {
        pf._bound = true;
        pf.addEventListener('change', () => pf.querySelectorAll('.opt').forEach(o => o.classList.toggle('is-chosen', o.querySelector('input').checked)));
        pf.addEventListener('submit', async e => {
          e.preventDefault(); const s = pf.querySelector('#pfs');
          if (!pf.c.value) { s.innerHTML = '<span class="status--err">Choose an option first.</span>'; return; }
          try { await api({ action: 'submit', ...id, choice: pf.c.value }); s.innerHTML = '<span class="status--ok">Submitted. Watch the projector.</span>'; }
          catch (err) { s.innerHTML = `<span class="status--err">${esc(err.message)}</span>`; }
        });
      }
      });
    }

    if (v.phase === 'round') {
      // step + hint
      const hint = v.step === 'decision' && !v.powers.submit ? 'Your Leader submits now. Help them decide.' : v.step === 'diplomacy' && !v.powers.envoy ? 'Your Envoy is visiting another table. Keep discussing.' : X.STEPS[v.step].hint;
      section('step', `${stepsHTML(v)}<p class="hint">${esc(hint)}</p>
        ${v.round >= X.BELGIUM_FROM && v.team === 'RS' ? `<div class="card card--warn">${v.round === X.BELGIUM_FROM ? '<b>New country!</b> ' : ''}From round 5 your team plays <b>Belgium</b>. Serbia’s fate is now in other hands.</div>` : ''}
        ${v.computer ? '<div class="card card--warn">Your teacher has set your country to be played by the computer this round.</div>' : ''}`);
      names.push('step');

      // telegrams: intro + the latest results
      const latestR = v.resolved ? v.round : v.round - 1;
      const latest = v.telegrams.filter(e => e.r === latestR);
      section('telegrams', `<div class="card"><h2>${v.resolved ? 'Results' : 'Telegrams'} <span class="muted small">${esc(v.dates)}</span></h2>
        ${v.blackout ? '<div class="card card--warn small"><b>At sea.</b> Your President and Prime Minister are on a ship home. You get only radio fragments, and you cannot join diplomacy this round.</div>' : ''}
        <div class="telegrams">${v.intro && !v.resolved ? `<div class="tg tg--intro">${gloss(v.intro)}</div>` : ''}${latest.map(tgHTML).join('') || (v.round === 1 ? '' : '<p class="muted">No new telegrams.</p>')}</div></div>`);
      names.push('telegrams');

      // briefing(s)
      if (v.briefings) {
        section('briefing', Object.entries(v.briefings).map(([b, text]) => `<div class="card card--accent"><div class="eyebrow">${b === 'general' ? 'Military briefing · for the General' : 'Cabinet briefing · for the Leader'}</div><p>${gloss(text)}</p></div>`).join(''));
        names.push('briefing');
      }

      // decision
      names.push('decision');
      section('decision', decisionHTML(v));
      binds.push(() => bindDecision(v));

      if (v.diplomacy) { section('diplomacy', diplomacyHTML(v)); binds.push(() => bindDiplomacy(v)); names.push('diplomacy'); }
    }

    if (v.ending) { section('ending', endingHTML(v)); names.push('ending'); }
    if (v.colour) { section('colour', colourHTML(v)); binds.push(() => bindColour(v)); names.push('colour'); }
    if (v.vote) { section('vote', voteHTML(v)); binds.push(() => bindVote(v)); names.push('vote'); }
    if (v.phase === 'break') { section('break', '<div class="card card--ok"><h2>End of lesson 1</h2><p>Thank you, statesmen. Next lesson the archives open, one by one, as they did for historians.</p></div>'); names.push('break'); }
    if (v.archive) { section('archive', archiveHTML(v.archive)); names.push('archive'); }

    // always: objectives + history
    section('objectives', `<details class="card"><summary>Your secret objectives (up to 7 points)</summary>
      <ul style="padding-left:20px">${v.objectives.map(o => `<li>${gloss(o.text)}</li>`).join('')}</ul>
      <p class="small muted" style="margin-top:8px">Backing down after a promise or threat costs 1 point (up to 2). Your score is compared with what your country scored in 1914.</p></details>`);
    names.push('objectives');
    const byR = {}; for (const e of v.telegrams) (byR[e.r] ||= []).push(e);
    section('history', `<details class="card"><summary>All your telegrams so far</summary>${Object.keys(byR).length ? Object.entries(byR).map(([r, es]) => `<h3 style="margin-top:10px">Round ${r}</h3><div class="telegrams">${es.map(tgHTML).join('')}</div>`).join('') : '<p class="muted">None yet.</p>'}</details>`);
    names.push('history');
    layout(names);
    binds.forEach(f => f());
  }

  // ---------------- decision
  function decisionHTML(v) {
    if (v.resolved) {
      const src = { team: '', timeout: ' (no decision in time: what happened in 1914)', computer: ' (played by the computer)', teacher: ' (set by your teacher)' }[v.resolved.source] || '';
      return `<div class="card card--ok"><div class="eyebrow">Your decision this round</div><p><b>${esc(v.resolved.label)}</b>${esc(src)}</p></div>`;
    }
    if (!v.menu) return '';
    const sub = v.submission;
    const head = `<div class="eyebrow">Decision · round ${v.round}</div><h2>${esc(v.title)}</h2>`;
    if (!v.powers.submit) {
      return `<div class="card">${head}<div class="options">${v.menu.map((o, i) => `<div class="opt opt--static ${sub?.choice === o.id ? 'is-chosen' : ''}"><span class="opt__letter">${'ABC'[i]}</span><span>${gloss(o.label)}</span></div>`).join('')}</div>
        <p class="${sub ? 'status--ok' : 'muted'}">${sub ? `Your Leader has submitted: ${esc(sub.label)}` : 'Your Leader has not submitted yet.'}</p></div>`;
    }
    return `<div class="card">${head}<form id="df"><div class="options">${v.menu.map((o, i) => `<label class="opt"><input type="radio" name="c" value="${esc(o.id)}"><span class="opt__letter">${'ABC'[i]}</span><span>${gloss(o.label)}</span></label>`).join('')}</div>
      <label class="field" for="why">Why? One or two sentences. This becomes evidence for the archive lesson.</label>
      <textarea id="why" maxlength="400" placeholder="We chose this because…"></textarea>
      <div class="chips">${v.starters.map(s => `<button type="button" class="chip" data-starter="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn" type="submit">${sub ? 'Change decision' : 'Submit decision'}</button></div>
      <div class="status" id="dfs">${sub ? `<span class="status--ok">Submitted at ${fmtTime(sub.at)}: ${esc(sub.label)}.</span> You can change it until your teacher locks the round.` : 'Not submitted yet. If you miss the deadline, your country does what it did in 1914.'}</div></form></div>`;
  }
  function bindDecision(v) {
    const f = document.getElementById('df'); if (!f || f._bound) return; f._bound = true;
    const r = v.round, d = loadDraft(r);
    const sub = v.submission;
    const choice = d.choice || sub?.choice;
    if (choice) { const i = f.querySelector(`input[value="${CSS.escape(choice)}"]`); if (i) { i.checked = true; i.closest('.opt').classList.add('is-chosen'); } }
    f.why.value = d.why ?? sub?.justification ?? '';
    f.addEventListener('change', () => { f.querySelectorAll('.opt').forEach(o => o.classList.toggle('is-chosen', o.querySelector('input').checked)); saveDraft(r, { choice: f.c.value, why: f.why.value }); });
    f.why.addEventListener('input', () => saveDraft(r, { choice: f.c.value, why: f.why.value }));
    f.addEventListener('click', e => { const s = e.target.closest('[data-starter]'); if (!s) return; const t = s.dataset.starter.replace('…', ' '); f.why.value = (f.why.value ? f.why.value.trim() + ' ' : '') + t; f.why.focus(); saveDraft(r, { choice: f.c.value, why: f.why.value }); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const st = document.getElementById('dfs');
      if (!f.c.value) { st.innerHTML = '<span class="status--err">Choose an option first.</span>'; return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      try { await api({ action: 'submit', ...id, round: r, choice: f.c.value, justification: f.why.value }); st.innerHTML = '<span class="status--ok">Submitted.</span>'; P.refresh(); }
      catch (err) { st.innerHTML = `<span class="status--err">${esc(err.message)}</span>`; }
      finally { btn.disabled = false; }
    });
  }

  // ---------------- diplomacy
  function diplomacyHTML(v) {
    const d = v.diplomacy;
    if (d.blocked) return '<div class="card card--warn"><b>Diplomacy:</b> your leaders are at sea this round. No visits.</div>';
    const others = Object.keys(NAMES).filter(p => p !== v.team && !(d.franceAtSea && p === 'FR'));
    const pr = d.promise;
    if (!d.open) return `<div class="card"><div class="eyebrow">Envoy</div><p class="muted">The diplomacy window opens after the council.</p>${pr ? `<p>Logged: promise to ${esc(NAMES[pr.to])}: “${esc(pr.text)}”</p>` : ''}</div>`;
    return `<div class="card card--accent"><div class="eyebrow">Envoy · diplomacy window</div>
      <p>Visit <b>one</b> other table for 2 minutes. If you agree a secret promise, log it here. Nobody sees it now. It will appear in the archive lesson.</p>
      <form id="pf2"><label class="field" for="to">Team you visited</label>
      <select id="to"><option value="">Choose…</option>${others.map(p => `<option value="${p}" ${pr?.to === p ? 'selected' : ''}>${esc(X.teamName(p, v.round))}</option>`).join('')}</select>
      <label class="field" for="pt">The promise (who promised what?)</label><textarea id="pt" maxlength="300" placeholder="Russia promised that…">${esc(pr?.text || '')}</textarea>
      <div class="row" style="margin-top:10px"><button class="btn btn--ghost" type="submit">Log secret promise</button></div><div class="status" id="pfs2">${pr ? '<span class="status--ok">Promise logged.</span>' : ''}</div></form></div>`;
  }
  function bindDiplomacy(v) {
    const f = document.getElementById('pf2'); if (!f || f._bound) return; f._bound = true;
    f.addEventListener('submit', async e => {
      e.preventDefault(); const st = document.getElementById('pfs2');
      try { await api({ action: 'promise', ...id, round: v.round, to: f.to.value, text: f.pt.value }); st.innerHTML = '<span class="status--ok">Promise logged.</span>'; }
      catch (err) { st.innerHTML = `<span class="status--err">${esc(err.message)}</span>`; }
    });
  }

  // ---------------- ending
  function endingHTML(v) {
    const e = v.ending;
    let html = `<div class="card ${e.ending === 'peace' ? 'card--ok' : 'card--war'}"><div class="eyebrow">4 August 1914 · the ending</div><h1>${esc(e.endingText)}</h1>${e.modifiers.length ? `<ul style="padding-left:20px;margin-top:8px">${e.modifiers.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}</div>`;
    if (v.myScore) {
      const s = v.myScore;
      html += `<div class="card"><h2>Your score: ${s.total} of 7 <span class="${s.total > s.par ? 'beat' : s.total < s.par ? 'below' : ''}">(1914: ${s.par})</span></h2>
        <table class="t"><tbody>${v.objectives.map((o, i) => `<tr><td>${esc(o.text)}</td><td class="num"><b>${s.parts[i]}</b>/${o.max}</td></tr>`).join('')}
        <tr><td>Prestige lost by backing down</td><td class="num"><b>${s.prestige}</b></td></tr></tbody></table>
        <p style="margin-top:8px">${s.total > s.par ? '<b class="beat">You beat 1914.</b>' : s.total === s.par ? 'You matched 1914.' : 'Your country did worse than in 1914.'}</p></div>`;
    } else if (e.show !== 'scores') html += '<p class="muted card">Scores come next, on the projector.</p>';
    return html;
  }

  // ---------------- colour books
  function colourHTML(v) {
    const c = v.colour;
    const intro = `<div class="eyebrow">Colour Books</div><h2>Publish two documents</h2><p>In 1914 each government published a hand-picked set of its own documents to show it was not to blame. Choose the <b>two</b> documents your government will publish. Everything else stays secret… for now.</p>`;
    const list = c.docs.map(d => `<label class="opt ${c.chosen?.includes(d.id) ? 'is-chosen' : ''} ${v.powers.submit ? '' : 'opt--static'}">${v.powers.submit ? `<input type="checkbox" name="d" value="${d.id}" ${c.chosen?.includes(d.id) ? 'checked' : ''}>` : ''}<span><span class="doc__meta">Round ${d.r} · ${d.kind === 'decision' ? 'your decision' : 'secret telegram'}</span><br>${esc(d.text)}</span></label>`).join('');
    if (!v.powers.submit) return `<div class="card">${intro}<div class="options">${list}</div><p class="muted">Help your Leader choose. Your Leader submits.</p></div>`;
    return `<div class="card">${intro}<form id="cf"><div class="options">${list}</div><button class="btn" type="submit">Publish these two</button><div class="status" id="cfs">${c.chosen?.length === 2 ? '<span class="status--ok">Published.</span> You can change your choice until your teacher closes the Colour Books.' : ''}</div></form></div>`;
  }
  function bindColour() {
    const f = document.getElementById('cf'); if (!f || f._bound) return; f._bound = true;
    f.addEventListener('change', () => f.querySelectorAll('.opt').forEach(o => o.classList.toggle('is-chosen', o.querySelector('input').checked)));
    f.addEventListener('submit', async e => {
      e.preventDefault(); const st = document.getElementById('cfs');
      const docs = [...f.querySelectorAll('input:checked')].map(i => i.value);
      try { await api({ action: 'colour', ...id, docs }); st.innerHTML = '<span class="status--ok">Published.</span>'; }
      catch (err) { st.innerHTML = `<span class="status--err">${esc(err.message)}</span>`; }
    });
  }

  // ---------------- votes
  function voteHTML(v) {
    const vt = v.vote, mine = vt.mine;
    const stage = X.STAGES[vt.stage];
    let html = `<div class="card card--accent"><div class="eyebrow">Vote ${vt.stage + 1} of 4 · ${esc(stage.name)}</div><h2>${esc(vt.question)}</h2><p class="small muted">Evidence so far: ${esc(stage.note)}.</p>`;
    if (vt.open) {
      html += `<form id="vf"><div class="options">${Object.keys(NAMES).map(p => `<label class="opt ${mine?.power === p ? 'is-chosen' : ''}"><input type="radio" name="p" value="${p}" ${mine?.power === p ? 'checked' : ''}><span>${esc(NAMES[p])}</span></label>`).join('')}</div>
        <label class="field" for="vr">One sentence: why?</label><textarea id="vr" maxlength="300">${esc(mine?.reason || '')}</textarea>
        <button class="btn" type="submit" style="margin-top:10px">${mine ? 'Change my vote' : 'Vote'}</button><div class="status" id="vfs">${mine ? '<span class="status--ok">Vote recorded.</span>' : ''}</div></form>`;
    } else {
      html += mine ? `<p>You voted: <b>${esc(NAMES[mine.power])}</b>.</p>` : '<p class="muted">Voting is closed.</p>';
      if (vt.tally) html += '<p>Results are on the projector.</p>';
    }
    return html + '</div>';
  }
  function bindVote(v) {
    const f = document.getElementById('vf'); if (!f || f._bound) return; f._bound = true;
    f.addEventListener('change', () => f.querySelectorAll('.opt').forEach(o => o.classList.toggle('is-chosen', o.querySelector('input').checked)));
    f.addEventListener('submit', async e => {
      e.preventDefault(); const st = document.getElementById('vfs');
      if (!f.p.value) { st.innerHTML = '<span class="status--err">Choose a power.</span>'; return; }
      try { await api({ action: 'vote', ...id, stage: v.vote.stage, power: f.p.value, reason: f.vr.value }); st.innerHTML = '<span class="status--ok">Vote recorded.</span>'; }
      catch (err) { st.innerHTML = `<span class="status--err">${esc(err.message)}</span>`; }
    });
  }

  // ---------------- archive
  function recordHTML(rec) {
    return `<details class="card"><summary>${esc(rec.name)}: the full file</summary>
      ${rec.rounds.map(r => `<div class="doc"><div class="doc__meta">Round ${r.r}</div>
        <p><b>Decision:</b> ${esc(r.decision)}${r.source !== 'team' ? ` <span class="muted">(${esc(r.source)})</span>` : ''}</p>
        ${r.justification ? `<p><b>Reason given:</b> ${esc(r.justification)}</p>` : ''}
        ${r.promise ? `<p><b>Secret promise to ${esc(NAMES[r.promise.to])}:</b> ${esc(r.promise.text)}</p>` : ''}
        <p class="small"><b>Cabinet briefing:</b> ${esc(r.briefings.leader)}</p><p class="small"><b>Military briefing:</b> ${esc(r.briefings.general)}</p></div>`).join('')}
      ${rec.privateTelegrams.length ? `<h3 style="margin-top:10px">Secret telegrams</h3><div class="telegrams">${rec.privateTelegrams.map(t => `<div class="tg"><span class="tg__tag tg__tag--secret">R${t.r}</span>${esc(t.text)}</div>`).join('')}</div>` : ''}</details>`;
  }
  function archiveHTML(a) {
    let html = `<div class="card"><div class="eyebrow">The archives · release ${a.stage} of 3</div><h2>Colour Books (1914)</h2>
      ${a.colourBooks.map(c => `<h3 style="margin-top:10px">${esc(c.name)}</h3>${c.docs.length ? c.docs.map(d => `<div class="doc">${esc(d.text)}</div>`).join('') : '<p class="muted">Published nothing.</p>'}`).join('')}</div>`;
    if (a.fischer) html += `<div class="card card--accent"><h2>Fischer (1961): the German and Austrian files</h2><p class="small muted">Fritz Fischer worked from newly opened German archives.</p></div>${a.fischer.map(recordHTML).join('')}`;
    if (a.clark) html += `<div class="card card--accent"><h2>Clark (2012): every archive</h2><p class="small muted">Christopher Clark used the archives of every country.</p></div>${a.clark.map(recordHTML).join('')}
      <details class="card" open><summary>Real 1914: evidence packet</summary>${a.evidence.map(e => `<div class="doc"><div class="doc__meta">${esc(e.date)} · ${esc(e.title)}</div><p>${gloss(e.text)}</p><p class="small muted">${esc(e.source)}</p></div>`).join('')}</details>`;
    return html;
  }

  const P = poll(() => api({ action: 'team', ...id }), render);
})();
