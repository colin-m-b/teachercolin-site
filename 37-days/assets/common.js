// 37 Days — shared browser helpers: API calls, polling, timers, the engine loader and tap-to-gloss.
'use strict';
window.D37 = (() => {
  const API = '/api/july1914';

  async function api(body) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    let j; try { j = await r.json(); } catch { j = { error: 'The server sent a bad response.' }; }
    if (!r.ok) { const e = new Error(j.error || `Error ${r.status}`); e.status = r.status; throw e; }
    return j;
  }

  // Links carry their keys in the URL fragment, which the browser never sends to a server.
  function params() {
    const out = {};
    for (const src of [location.search.slice(1), location.hash.slice(1)]) for (const kv of src.split('&')) { if (!kv) continue; const [k, v = ''] = kv.split('='); out[decodeURIComponent(k)] = decodeURIComponent(v); }
    return out;
  }

  // Poll every 2 s. Re-render only when the response changes. Shows a banner while the network is down.
  function poll(fetcher, render, { ms = 2000, onError } = {}) {
    let last = '', stopped = false, fails = 0, timer = null;
    async function tick() {
      if (stopped) return;
      try {
        const v = await fetcher();
        fails = 0; net(true);
        const s = JSON.stringify({ ...v, now: 0 });
        D37.clock(v.now);
        if (s !== last) { last = s; render(v); }
      } catch (e) {
        fails++;
        if (e.status && e.status < 500) { stopped = true; (onError || showFatal)(e); return; }
        if (fails >= 2) net(false);
      }
      timer = setTimeout(tick, document.hidden ? ms * 2 : ms);
    }
    tick();
    return { refresh() { clearTimeout(timer); last = ''; tick(); }, stop() { stopped = true; clearTimeout(timer); } };
  }
  function net(ok) {
    let b = document.getElementById('d37-net');
    if (ok) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'd37-net'; b.className = 'net'; b.textContent = 'Reconnecting…'; b.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:99'; document.body.appendChild(b); }
  }
  function showFatal(e) {
    const m = document.querySelector('main') || document.body;
    m.innerHTML = `<div class="wrap"><div class="card card--war"><h2>Cannot open this game</h2><p>${esc(e.message)}</p><p class="small muted">Check the link or ask your teacher for a new one.</p></div></div>`;
  }

  // Server clock offset, so every screen shows the same countdown.
  let offset = 0;
  function clock(serverNow) { if (serverNow) offset = serverNow - Date.now(); }
  const now = () => Date.now() + offset;
  function timerText(t) {
    if (!t) return '';
    const left = Math.max(0, Math.round((t.endsAt - now()) / 1000));
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
  function bindTimer(el, getTimer) {
    setInterval(() => {
      const t = getTimer();
      if (!t) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      el.textContent = timerText(t);
      el.classList.toggle('is-low', t.endsAt - now() < 15000);
    }, 250);
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Load the CommonJS engine files unchanged (the same files the server and the tests run).
  async function loadEngine(names = ['scenario', 'content', 'engine', 'extras']) {
    const mods = {};
    const req = n => { const k = n.replace(/^.*\//, '').replace(/\.js$/, ''); if (!mods[k]) throw new Error('module not loaded: ' + k); return mods[k].exports; };
    for (const n of names) {
      const src = await (await fetch(`engine/${n}.js`, { cache: 'no-cache' })).text();
      const module = { exports: {} }; mods[n] = module;
      new Function('module', 'exports', 'require', src)(module, module.exports, req);
    }
    return Object.fromEntries(names.map(n => [n, mods[n].exports]));
  }

  // Tap-to-gloss: wrap the first use of each glossary term in a block of text.
  let GL = null, RX = null;
  function setGlossary(list) {
    GL = new Map(); const pats = [];
    for (const g of list) for (const m of g.match) { GL.set(m.toLowerCase(), g); pats.push(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
    pats.sort((a, b) => b.length - a.length);
    RX = new RegExp(`\\b(${pats.join('|')})\\b`, 'gi');
  }
  function gloss(text) {
    const safe = esc(text);
    if (!RX) return safe;
    const seen = new Set();
    return safe.replace(RX, m => {
      const g = GL.get(m.toLowerCase()); if (!g || seen.has(g.term)) return m;
      seen.add(g.term);
      return `<span class="gloss" role="button" tabindex="0" data-term="${esc(g.term)}">${m}</span>`;
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.gloss');
    const old = document.querySelector('.glosspop');
    if (old && (!b || e.target.closest('.glosspop button'))) old.remove();
    if (!b || !GL) return;
    const g = [...GL.values()].find(x => x.term === b.dataset.term); if (!g) return;
    const p = document.createElement('div'); p.className = 'glosspop'; p.setAttribute('role', 'dialog');
    p.innerHTML = `<button type="button" aria-label="Close">×</button><b>${esc(g.term)}</b><div>${esc(g.en)}</div><div class="vi" lang="vi">${esc(g.vi)}</div>`;
    document.body.appendChild(p);
  });

  // A gloss inside an option label also selects the option (a span, unlike a button, lets the label work).
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('gloss')) { e.preventDefault(); e.target.click(); } });

  const fmtTime = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return { api, params, poll, clock, now, timerText, bindTimer, esc, loadEngine, setGlossary, gloss, fmtTime };
})();
