// 37 Days — projector page: projector.html#g=GAME. Public information only.
'use strict';
(async () => {
  const { api, params, poll, esc } = D37;
  const g = params().g;
  const main = document.getElementById('main');
  if (!g) { main.innerHTML = '<p class="pj-wait">Open this page from the teacher panel (it needs a game code).</p>'; return; }
  const { extras: X } = await D37.loadEngine(['extras']);
  let view = null;

  const STAGE_COLOURS = ['#B9B1A0', '#C8A24A', '#3B5F8C', '#1F2421'];
  function chart(tallies) {
    const stages = Object.keys(tallies).map(Number).sort();
    const P = Object.keys(X.TEAM);
    const max = Math.max(1, ...stages.flatMap(s => P.map(p => tallies[s].counts[p])));
    const W = 1500, H = 560, left = 60, base = 470, gw = (W - left - 20) / P.length, bw = Math.min(56, (gw - 30) / 4);
    let bars = '';
    P.forEach((p, i) => {
      const x0 = left + i * gw + (gw - bw * stages.length) / 2;
      stages.forEach((s, j) => {
        const v = tallies[s].counts[p], h = (v / max) * 380;
        bars += `<rect x="${x0 + j * bw}" y="${base - h}" width="${bw - 6}" height="${h}" fill="${STAGE_COLOURS[s]}"/>`;
        if (v) bars += `<text x="${x0 + j * bw + (bw - 6) / 2}" y="${base - h - 8}" text-anchor="middle" font-size="24" font-weight="700" fill="#1F2421">${v}</text>`;
      });
      bars += `<text x="${left + i * gw + gw / 2}" y="${base + 40}" text-anchor="middle" font-size="28" font-weight="600" fill="#1F2421">${esc(X.TEAM[p].name)}</text>`;
    });
    const legend = stages.map((s, j) => `<rect x="${left + j * 330}" y="12" width="26" height="26" fill="${STAGE_COLOURS[s]}"/><text x="${left + j * 330 + 36}" y="34" font-size="24" fill="#1F2421">${j + 1}. ${esc(X.STAGES[s].short)}</text>`).join('');
    return `<div class="pj-bars"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Votes on responsibility" font-family="IBM Plex Sans, sans-serif">${legend}<line x1="${left}" y1="${base}" x2="${W - 20}" y2="${base}" stroke="#1F2421" stroke-width="2"/>${bars}</svg></div>`;
  }

  function top(v, big, sub, right = '') {
    return `<div class="pj-top"><div><div class="pj-date">${big}</div>${sub ? `<div class="pj-title">${sub}</div>` : ''}</div><div class="pj-right">${right}</div></div>`;
  }

  function render(v) {
    view = v;
    let html = '';
    if (v.phase === 'lobby') {
      html = top(v, '37 Days', 'The July Crisis · 28 June – 4 August 1914') +
        `<p class="pj-big" style="margin-top:40px">Find your capital’s table.<br>Scan the QR code on your role card.</p><p class="pj-mid muted" style="margin-top:30px">Game <span class="pj-code">${esc(v.gid)}</span></p>`;
    } else if (v.phase === 'practice') {
      html = top(v, 'Practice round', 'No points. Learn the screen: read, discuss, submit, watch.', `<div class="pj-step">${v.step === 'reveal' ? 'Result' : 'Decide'}</div>`) + lights(v);
      if (v.practice) html += `<div class="pj-feed">${v.practice.options.map(o => `<div class="pj-tg">${esc(o.label)}: <b>${v.practice.counts[o.id]}</b></div>`).join('')}</div>`;
      else html += `<p class="pj-mid">Kiel Week, June 1914: Germany invites guests to its naval regatta. How does your government reply?</p>`;
    } else if (v.phase === 'round') {
      const resolved = v.step === 'result';
      const latestR = resolved ? v.round : v.round - 1;
      const feed = v.publicLog.filter(e => e.r === latestR);
      html = top(v, esc(v.dates), `Round ${v.round} of 6 · ${esc(v.title)}`, `<div class="pj-step">${esc(X.STEPS[v.step].name)}</div><div class="pj-timer" id="ptimer"></div>`) +
        (resolved ? '' : lights(v)) +
        `<div class="pj-feed">${v.intro && !resolved ? `<div class="pj-tg pj-tg--intro">${esc(v.intro)}</div>` : ''}${feed.map(e => `<div class="pj-tg">${esc(e.text)}</div>`).join('')}</div>` +
        (v.step === 'diplomacy' ? `<p class="pj-mid" style="margin-top:20px"><b>Diplomacy window.</b> One Envoy per team visits one other table. Two minutes.</p>` : '');
    } else if (v.ending) {
      const e = v.ending;
      const head = top(v, '4 August 1914', 'The ending');
      const endBox = `<div class="pj-ending ${e.ending === 'peace' ? 'is-peace' : ''}"><div class="pj-big">${esc(e.endingText)}</div>${e.modifiers.length ? `<ul class="pj-mid">${e.modifiers.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}</div>`;
      if (v.phase === 'ending' && e.show === 'map') html = head + `<div class="pj-grid">${endBox}<div>${D37Map.svg(e.war)}</div></div>`;
      else if (v.phase === 'ending' && e.show === 'replay') {
        html = top(v, 'What really happened', 'The public record of July–August 1914') +
          `<ol class="pj-replay">${e.replay.map(x => `<li>${esc(x.text)}</li>`).join('')}</ol>`;
      } else if (v.phase === 'ending' || v.phase === 'colour') {
        const P = Object.keys(X.TEAM);
        html = top(v, 'Can you beat 1914?', 'Each team’s secret objectives, scored out of 7') +
          `<div class="pj-grid"><table class="pj-table"><thead><tr><th>Country</th><th class="num">Your class</th><th class="num">1914</th><th></th></tr></thead><tbody>${P.map(p => { const s = e.scores[p]; return `<tr><td><span class="swatch" style="--team:${X.TEAM[p].colour};display:inline-block;width:22px;height:22px;margin-right:10px;vertical-align:-2px"></span>${esc(X.TEAM[p].name)}</td><td class="num"><b>${s.total}</b></td><td class="num">${s.par}</td><td class="${s.total > s.par ? 'beat' : s.total < s.par ? 'below' : ''}">${s.total > s.par ? 'Beat 1914' : s.total < s.par ? 'Worse' : 'Same'}</td></tr>`; }).join('')}</tbody></table><div>${D37Map.svg(e.war)}</div></div>` +
          (v.phase === 'colour' ? `<p class="pj-mid" style="margin-top:24px"><b>Colour Books.</b> Leaders: choose the two documents your government will publish.</p>` : '');
      } else if (v.phase === 'vote') {
        const q = v.voteQuestion;
        html = top(v, `Vote ${v.stage + 1} of 4`, esc(X.STAGES[v.stage].name) + ' · ' + esc(X.STAGES[v.stage].note));
        if (v.step === 'open') html += `<p class="pj-big" style="margin-top:30px">${esc(q)}</p><p class="pj-mid" style="margin-top:20px">Vote on your device, with one sentence of reasoning.</p>`;
        else html += `<p class="pj-mid" style="margin-bottom:14px">${esc(q)}</p>` + chart(v.tallies);
      } else if (v.phase === 'break') {
        html = top(v, 'End of lesson 1', 'Next lesson: the archives open') + `<p class="pj-mid">${esc(v.voteQuestion)}</p>` + chart(v.tallies);
      } else {
        html = top(v, 'Who was responsible?', 'Four votes, as the evidence was released') + `<p class="pj-mid" style="margin-bottom:14px">What evidence changed your mind? Who controlled what you could see?</p>` + chart(v.tallies);
      }
    }
    main.innerHTML = html;
    tickTimer();
  }
  function tickTimer() {
    const pt = document.getElementById('ptimer'); if (!pt) return;
    const t = view?.timer;
    pt.textContent = t ? D37.timerText(t) : '';
    pt.classList.toggle('is-low', !!t && t.endsAt - D37.now() < 15000);
  }
  setInterval(tickTimer, 250);

  function lights(v) {
    if (!v.lights) return '';
    return `<div class="pj-lights">${Object.entries(v.lights).map(([p, st]) => `<div class="pj-light is-${st}"><b><span class="swatch" style="--team:${X.TEAM[p].colour}"></span>${esc(v.teams[p].name.replace(' (Serbia team)', ''))}</b><span>${st === 'decided' ? 'Decided ✓' : st === 'computer' ? 'Computer' : 'Thinking…'}</span></div>`).join('')}</div>`;
  }

  poll(() => api({ action: 'projector', g }), render);
})();
