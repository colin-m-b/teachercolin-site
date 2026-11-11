// Teacher console and projector for The Paris Peace Conference, 1919.
// This browser tab is the game's authority: it folds student actions into the
// host state, applies the rules, and publishes what students may see.

import { call, storage, h as el, fmtClock, timerRemaining } from "./api.js";
import {
  DELEGATIONS, PERSONAS, PRESETS, FINALE, REAL_TIMELINE, DEBRIEF, PERSPECTIVES, ITALY_NPC_NOTE, JOBS,
} from "./content.js";
import * as E from "./engine.js";

const SAVED_KEY = "ppc.teacher.games";
const POLL_MS = 2500;

let code = null;
let hostKey = null;
let H = null; // host state
let skew = 0; // server time minus local time
let writing = false;
let dirty = false;
let lastDocs = {};
let lastPub = "";
let pollTimer = null;
let drawerOpen = false;
let drawerTab = "delegations";
let netProblem = null;
let lastWireCount = 0;

const app = document.getElementById("app");

// ------------------------------------------------------------ helpers
function delName(del) {
  if (del === "va" && H && H.vaPersonas.includes("arab")) return "Voices of Asia, Africa & the Arab World";
  return DELEGATIONS[del] ? DELEGATIONS[del].name : del;
}
function delColor(del) {
  return DELEGATIONS[del] ? DELEGATIONS[del].color : "#1D3A5F";
}
function chip(del, extra) {
  return el("span.chip", { style: { color: delColor(del) } }, el("span.dot", { style: { background: delColor(del) } }), delName(del), extra ? ` · ${extra}` : "");
}
function now() {
  return Date.now() + skew;
}
function savedGames() {
  return storage.get(SAVED_KEY, []);
}
function rememberGame(c, k) {
  const list = savedGames().filter((g) => g.code !== c);
  list.unshift({ code: c, hostKey: k, at: Date.now() });
  storage.set(SAVED_KEY, list.slice(0, 8));
}
function optLabel(decision, id) {
  const o = decision.options.find((x) => x.id === id);
  return o ? o.label : "—";
}

// ------------------------------------------------------------ setup screen
let chosenPreset = "standard";

function renderSetup(message) {
  document.body.className = "ppc";
  app.replaceChildren();
  const presetCards = Object.entries(PRESETS).map(([id, p]) =>
    el("button.preset", { type: "button", "aria-pressed": String(id === chosenPreset), onclick: () => { chosenPreset = id; renderSetup(); } },
      el("div.eyebrow", `${p.lessons} lessons of 70 minutes`),
      el("h3", p.label),
      el("ol", p.plan.map((line) => el("li", line))),
    ),
  );
  const saved = savedGames().filter((g) => Date.now() - g.at < 7 * 86400000);
  app.append(
    el("header.mast", el("div.mast__inner", el("div.mast__title", "The Paris Peace Conference, ", el("span", "1919")), el("div.mast__meta", "Teacher console"))),
    el("main.page",
      el("section.hero",
        el("div.eyebrow", "Grade 10 · MYP Individuals and Societies"),
        el("h1.display", "Run the Conference"),
        el("p.lede", "Your class becomes the delegations that wrote the Treaty of Versailles. Every student plays on their own device; this screen is your projector and your controls."),
      ),
      message ? el("p.notice.notice--seal", message) : null,
      saved.length
        ? el("section.card.card--navy",
            el("h3", "Continue a conference"),
            el("p.muted.small", "Your conferences are saved for 7 days."),
            el("div.row", { style: { marginTop: "10px" } }, saved.map((g) => el("button.btn", { type: "button", onclick: () => resume(g.code, g.hostKey) }, `Code ${g.code} · started ${new Date(g.at).toLocaleDateString()}`))),
          )
        : null,
      el("section", { style: { marginTop: "26px" } },
        el("h2", { style: { fontSize: "1.6rem", marginBottom: "12px" } }, "Start a new conference"),
        el("p", { style: { marginBottom: "14px" } }, "Choose a length. You can stop at the end of any lesson and pick up where you left off."),
        el("div.presets", presetCards),
        el("div.row", { style: { marginTop: "18px" } },
          el("button.btn.btn--primary", { type: "button", id: "create", onclick: create }, "Open the conference"),
          el("span.muted.small", "Then ask students to go to teachercolin.com/versailles and type the code."),
        ),
      ),
      el("section.grid2", { style: { marginTop: "34px" } },
        el("div.card",
          el("h3", "How it runs"),
          el("ol.list",
            el("li", "Students join with the four-letter code and their first name."),
            el("li", "You press “Assign delegations”. The game randomizes, and you can move anyone."),
            el("li", "Each round: Brief → Negotiate (timed) → Vote → Reveal → Reflect. You press one button to move on."),
            el("li", "Finale: Germany receives the terms, objects, and decides whether to sign."),
            el("li", "Epilogue: 1919–1939 plays out from your class's choices. Then students download the essay worksheet."),
          ),
        ),
        el("div.card",
          el("h3", "Delegations by class size"),
          el("ul.list",
            el("li", "6–14 students: France, Britain, United States, Germany, Japan, and Voices of Asia & Africa (China, Vietnam, Africa). Italy is played by the game."),
            el("li", "15–20 students: Italy becomes a player."),
            el("li", "21–32 students: China becomes its own delegation; the Arab delegation joins the Voices."),
          ),
          el("p.small.muted", { style: { marginTop: "8px" } }, "Within each delegation, students hold jobs (Head, Envoy, Intelligence, Press) that rotate every lesson. Scores are hidden until the end."),
        ),
        el("div.card",
          el("h3", "Resume on another computer"),
          el("p.small", "Type the conference code and the teacher key shown in the console."),
          el("div.row", { style: { marginTop: "8px" } },
            el("input.input", { id: "rcode", placeholder: "Code", maxlength: "4", style: { maxWidth: "110px", textTransform: "uppercase" } }),
            el("input.input", { id: "rkey", placeholder: "Teacher key", style: { maxWidth: "170px" } }),
            el("button.btn", { type: "button", onclick: () => resume(document.getElementById("rcode").value.trim().toUpperCase(), document.getElementById("rkey").value.trim()) }, "Resume"),
          ),
        ),
        el("div.card",
          el("h3", "Privacy"),
          el("p.small", "Students type a first name only. Votes, notes and notebook entries are stored on teachercolin.com's server so the game can run across devices and lessons, and every conference is deleted automatically after 7 days. The essay worksheet is generated on the student's own device."),
        ),
      ),
    ),
  );
}

async function create() {
  const btn = document.getElementById("create");
  btn.disabled = true;
  btn.textContent = "Opening…";
  try {
    const res = await call("create", { preset: chosenPreset });
    code = res.code;
    hostKey = res.hostKey;
    H = E.newHost(chosenPreset);
    rememberGame(code, hostKey);
    location.hash = code;
    startHost();
    dirty = true;
    await sync();
  } catch (err) {
    renderSetup(err.message);
  }
}

async function resume(c, k) {
  if (!/^[A-Z]{4}$/.test(c) || !k) return renderSetup("Type the four-letter code and the teacher key.");
  try {
    const res = await call("hostload", { code: c, hostKey: k });
    code = c;
    hostKey = k;
    skew = res.now - Date.now();
    H = res.host || E.newHost(res.state.preset);
    rememberGame(code, hostKey);
    location.hash = code;
    startHost();
    render();
  } catch (err) {
    renderSetup(err.message);
  }
}

// ------------------------------------------------------------ host loop
function startHost() {
  document.body.className = "ppc projector";
  clearInterval(pollTimer);
  pollTimer = setInterval(pollOnce, POLL_MS);
  setInterval(tickClock, 500);
  pollOnce();
  render();
}

async function pollOnce() {
  try {
    const res = await call("hostpoll", { code, hostKey, cursor: H.cursor }, { retries: 0 });
    skew = res.now - Date.now();
    let changed = false;
    for (const a of res.actions) {
      if (E.applyAction(H, a)) changed = true;
      H.cursor = a.key;
    }
    if (res.actions.length) dirty = true;
    if (netProblem) {
      netProblem = null;
      changed = true;
    }
    if (changed) render();
    if (dirty) await sync();
  } catch (err) {
    netProblem = err.message;
    renderNet();
  }
}

async function sync() {
  if (writing) {
    dirty = true;
    return;
  }
  writing = true;
  dirty = false;
  try {
    const pub = E.publicState(H);
    const dels = {};
    for (const d of H.delegations) {
      const doc = JSON.stringify(E.delegationDoc(H, d));
      if (doc !== lastDocs[d]) dels[d] = JSON.parse(doc);
    }
    const pubJson = JSON.stringify(pub);
    const body = { code, hostKey, host: H, dels };
    if (pubJson !== lastPub) {
      H.v = (H.v || 0) + 1;
      body.state = { ...pub, v: H.v };
      body.host = H;
    }
    const res = await call("hostwrite", body);
    skew = res.now - Date.now();
    if (body.state) lastPub = pubJson;
    for (const [d, doc] of Object.entries(dels)) lastDocs[d] = JSON.stringify(doc);
    netProblem = null;
  } catch (err) {
    dirty = true;
    netProblem = err.message;
    renderNet();
  } finally {
    writing = false;
  }
  if (dirty) setTimeout(sync, 400);
}

function change(fn) {
  fn();
  dirty = true;
  render();
  sync();
}

// ------------------------------------------------------------ teacher actions
function nextStep() {
  const stage = E.stageOf(H);
  if (H.overlay) {
    change(() => (H.overlay = null));
    return;
  }
  if (stage.kind === "lobby") {
    if (!H.delegations.length) return change(() => E.assignAll(H));
    return change(() => {
      H.started = true;
      H.seq = 1;
      E.onEnter(H);
    });
  }
  const seq = E.sequence(H);
  if (H.seq >= seq.length - 1) return;
  change(() => {
    if (stage.kind === "round" && stage.phase === "negotiate") pauseTimer(true);
    H.seq++;
    E.onEnter(H);
  });
}

function prevStep() {
  if (H.seq <= 1) return;
  change(() => {
    H.seq--;
    E.onEnter(H);
  });
}

function pauseTimer(silent) {
  const t = H.timer;
  if (!t.running) return;
  t.remaining = Math.max(0, (t.endsAt - now()) / 1000);
  t.running = false;
  t.endsAt = null;
  if (!silent) dirty = true;
}
function toggleTimer() {
  change(() => {
    const t = H.timer;
    if (t.running) pauseTimer();
    else {
      t.running = true;
      t.endsAt = now() + (t.remaining || 60) * 1000;
    }
  });
}
function addMinute() {
  change(() => {
    const t = H.timer;
    if (t.running) t.endsAt += 60000;
    else t.remaining = (t.remaining || 0) + 60;
  });
}

function endLesson() {
  change(() => {
    pauseTimer(true);
    H.overlay = "cliff";
  });
}
function startLesson() {
  change(() => {
    H.lesson++;
    H.rotation++;
    E.refreshRoles(H);
    H.overlay = "recap";
  });
}

function movePlayer(pid, del) {
  change(() => {
    if (del === "__remove") H.players[pid].removed = true;
    else H.players[pid].d = del;
    E.refreshRoles(H);
  });
}

function reshuffle() {
  if (!confirm("Reshuffle every student into new delegations?")) return;
  change(() => E.assignAll(H));
}

// ------------------------------------------------------------ rendering
function render() {
  if (!H) return;
  const stage = E.stageOf(H);
  const top = el("header.proj__top",
    el("div.proj__brand", "The Paris Peace Conference, ", el("span", "1919")),
    el("div.proj__join", "Join at ", el("strong", "teachercolin.com/versailles"), " · code ", el("b", code)),
  );
  const stageEl = el("main.proj__stage", { id: "stage" }, el("div.proj__inner", renderStage(stage)));
  const controls = renderControls(stage);
  const wrap = el("div.proj", top, stageEl, controls);
  const scroll = document.getElementById("stage") ? document.getElementById("stage").scrollTop : 0;
  app.replaceChildren(wrap);
  if (drawerOpen) app.append(renderDrawer(stage));
  renderNet();
  const st = document.getElementById("stage");
  if (st && sameStageAsBefore(stage)) st.scrollTop = scroll;
  tickClock();
}

let lastStageKey = "";
function sameStageAsBefore(stage) {
  const key = `${H.seq}:${H.overlay}`;
  const same = key === lastStageKey;
  lastStageKey = key;
  return same;
}

function renderNet() {
  let bar = document.getElementById("netbar");
  if (!netProblem) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = el("div.toast", { id: "netbar" });
    document.body.append(bar);
  }
  bar.textContent = `Connection problem: ${netProblem} Retrying…`;
}

function tickClock() {
  const clock = document.getElementById("bigclock");
  if (clock && H) {
    const rem = timerRemaining(H.timer, skew);
    clock.textContent = fmtClock(rem);
    clock.classList.toggle("bigclock--low", rem <= 60);
    const btn = document.getElementById("timerbtn");
    if (btn) btn.textContent = H.timer.running ? "Pause timer" : "Start timer";
  }
}

function nextLabel(stage) {
  if (H.overlay === "cliff") return null;
  if (H.overlay) return "Continue";
  if (stage.kind === "lobby") return H.delegations.length ? "Begin the conference" : "Assign delegations";
  const seq = E.sequence(H);
  const next = seq[H.seq + 1];
  if (!next) return null;
  const names = {
    brief: "Brief", negotiate: "Open negotiations", vote: "Call the vote", reveal: "Reveal the results", reflect: "Reflect",
    terms: "Hand Germany the terms", counter: "Vote on Germany's objections", sign: "Sign or refuse?", ceremony: "The Hall of Mirrors",
    timeline: "Next year", verdict: "Was it fair?", history: "What really happened",
  };
  if (next.kind === "round" && next.phase === "brief") return `Round ${next.r + 1}: ${E.roundById(next.id).title}`;
  if (next.kind === "epilogue" && next.phase === "timeline" && next.step === 0) return "The epilogue: 1919–1939";
  if (next.kind === "debrief") return "Debrief";
  if (next.kind === "write") return "The essay";
  return names[next.phase] || "Next";
}

function renderControls(stage) {
  const label = nextLabel(stage);
  const where = describe(stage);
  const btns = [];
  if (H.overlay === "cliff") {
    btns.push(el("button.btn.btn--primary", { type: "button", onclick: startLesson }, `Start lesson ${H.lesson + 1}`));
    btns.push(el("button.btn", { type: "button", onclick: () => change(() => (H.overlay = null)) }, "Cancel: keep going"));
  } else {
    if (H.seq > 1 && !H.overlay) btns.push(el("button.btn", { type: "button", onclick: prevStep, title: "Go back one step" }, "Back"));
    if (stage.kind === "round" && stage.phase === "negotiate" && !H.overlay) {
      btns.push(el("button.btn", { type: "button", id: "timerbtn", onclick: toggleTimer }, H.timer.running ? "Pause timer" : "Start timer"));
      btns.push(el("button.btn", { type: "button", onclick: addMinute }, "+1 min"));
    }
    const historyable = (stage.kind === "round" && ["reveal", "reflect"].includes(stage.phase)) || (stage.kind === "finale" && stage.phase === "ceremony");
    if (historyable && !H.overlay) btns.push(el("button.btn", { type: "button", onclick: () => change(() => (H.showHistory = !H.showHistory)) }, H.showHistory ? "Hide history" : "What really happened?"));
    if (H.started && !H.overlay) btns.push(el("button.btn", { type: "button", onclick: endLesson }, "End lesson here"));
    if (label) btns.push(el("button.btn.btn--primary", { type: "button", onclick: nextStep, disabled: stage.kind === "lobby" && !Object.keys(H.players).length ? true : null }, `${label} →`));
  }
  return el("footer.controls",
    el("div.controls__where", el("b", `Lesson ${H.lesson}`), ` · ${where}`),
    btns,
    el("button.btn", { type: "button", onclick: () => { drawerOpen = !drawerOpen; render(); } }, drawerOpen ? "Close console" : "Console"),
  );
}

function describe(stage) {
  if (stage.kind === "lobby") return `${E.activePlayers(H).length} joined`;
  if (stage.kind === "round") return `Round ${stage.r + 1} of ${H.roundIds.length} · ${E.roundById(stage.id).title} · ${stage.phase}`;
  if (stage.kind === "finale") return `Finale · ${stage.phase}`;
  if (stage.kind === "epilogue") return `Epilogue · ${stage.phase}`;
  return stage.kind;
}

// ------------------------------------------------------------ stage views
function renderStage(stage) {
  if (H.overlay === "cliff") return viewCliff(stage);
  if (H.overlay === "recap") return viewRecap();
  switch (stage.kind) {
    case "lobby": return viewLobby();
    case "round": return viewRound(stage);
    case "finale": return viewFinale(stage);
    case "epilogue": return viewEpilogue(stage);
    case "debrief": return viewDebrief();
    case "write": return viewWrite();
    default: return el("div");
  }
}

function delegationCards(status) {
  return el("div.delegrid", H.delegations.map((d) => {
    const members = E.membersOf(H, d).map((pid) => H.players[pid]);
    const s = status ? status(d) : null;
    return el(`div.deleg${s && s.done ? ".deleg--done" : ""}`, { style: { "--c": delColor(d) } },
      el("div.deleg__name", delName(d)),
      el("div.deleg__leader", d === "va" ? H.vaPersonas.map((p) => PERSONAS[p].name).join(" · ") : DELEGATIONS[d].leader),
      el("div.deleg__members", members.length ? members.map((p, i) => el("span", (i ? " · " : "") + p.name)) : el("span.muted", "No one yet")),
      s ? el("div.deleg__status", s.text) : null,
    );
  }));
}

function viewLobby() {
  const players = E.activePlayers(H).map(([, p]) => p);
  if (!H.delegations.length) {
    const n = players.length;
    const cfg = E.configFor(n);
    return el("div",
      el("div.joinbox",
        el("div.joinbox__url", "Go to ", el("strong", "teachercolin.com/versailles")),
        el("div.joinbox__code", code),
        el("div.p-body.muted", "Type this code and your first name."),
      ),
      el("div.namecloud", players.map((p) => el("span", p.name))),
      el("p.p-body.muted", { style: { textAlign: "center", marginTop: "18px" } },
        n ? `${n} joined. With ${n} students you will have ${cfg.delegations.length} delegations: ${cfg.delegations.map(delName).join(", ")}.` : "Waiting for delegates…"),
    );
  }
  return el("div",
    el("div.p-date", "Paris · January 1919"),
    el("h1.p-title", "The delegations"),
    el("p.p-sub", "Find your delegation. Sit together. Read your dossier on your device."),
    el("div.p-section", delegationCards()),
    H.italyNPC ? el("p.p-body.muted.p-section", ITALY_NPC_NOTE) : null,
  );
}

function viewCliff() {
  const seq = E.sequence(H);
  const upcoming = seq.slice(H.seq).find((s) => s.kind === "round" && s.phase === "brief" && s.r > (E.stageOf(H).r ?? -1));
  const cur = E.stageOf(H);
  let teaser = "Next session: the Conference continues.";
  if (cur.kind === "round") teaser = E.roundById(cur.id).teaser;
  else if (upcoming) teaser = `Next session: ${E.roundById(upcoming.id).title}.`;
  return el("div.overlay-card",
    el("div.p-date", "End of session"),
    el("h1.p-title", "The Conference adjourns"),
    el("p.p-q.p-section", teaser),
    el("div.p-section.card",
      el("p.p-body", "Everything is saved. Next lesson, open this page again (it remembers the conference) and press ", el("strong", `Start lesson ${H.lesson + 1}`), ". Jobs will rotate."),
      el("p.p-body.muted", { style: { marginTop: "8px" } }, `Conference code: ${code} · Teacher key: ${hostKey}`),
    ),
  );
}

function viewRecap() {
  const items = E.recap(H);
  return el("div.overlay-card",
    el("div.p-date", `Lesson ${H.lesson}`),
    el("h1.p-title", "Previously at Paris…"),
    items.length ? el("div.p-section", items.map((it) => el("div.recap-item",
      el("div.p-h", it.title),
      el("ul.p-body.list", it.terms.map((t) => el("li", t))),
      it.lines.length ? el("p.p-body.muted", { style: { marginTop: "6px" } }, it.lines.join(" ")) : null,
    ))) : el("p.p-body.p-section", "The delegations have arrived in Paris. Nothing has been decided yet."),
    el("p.p-body.p-section", el("strong", "Jobs have rotated."), " Check your device for your job this lesson."),
  );
}

function decisionList(round) {
  return el("div.p-section",
    el("div.p-h", "On the table this round"),
    el("ul.p-body.list", round.decisions.map((d) => el("li", el("strong", d.title), ` (${d.body === "council" ? "the Council of Four votes" : "every delegation votes"}): ${d.question}`))),
  );
}

function viewRound(stage) {
  const round = E.roundById(stage.id);
  const rs = E.roundState(H, stage.id);
  const header = el("div",
    el("div.p-date", `Round ${stage.r + 1} · ${round.date}`),
    el("h1.p-title", round.title),
    el("div.p-sub", round.subtitle),
  );

  if (stage.phase === "brief") {
    return el("div", header,
      el("div.p-cols",
        el("div", el("p.p-q", round.question), el("ul.p-body.list.p-section", round.context.map((c) => el("li", c)))),
        el("div",
          el("div.source.p-source", el("p.source__text", `“${round.source.text}”`), el("p.source__cite", round.source.cite)),
          decisionList(round),
          el("p.p-body.p-section", el("strong", "Germany"), " is not invited to the table. It answers in writing."),
        ),
      ),
    );
  }

  if (stage.phase === "negotiate") {
    const wire = H.wire.slice(-6).reverse();
    const fresh = H.wire.length > lastWireCount;
    lastWireCount = H.wire.length;
    return el("div", header,
      el("div.p-cols",
        el("div",
          el("div.eyebrow", "Negotiations close in"),
          el("div.bigclock", { id: "bigclock" }, fmtClock(H.timer.remaining)),
          el("ul.p-body.list.p-section",
            el("li", el("strong", "Envoys"), ": send notes, or walk to another delegation's table."),
            el("li", el("strong", "Heads"), ": hear your team's recommendations. Declare a threat if you dare."),
            el("li", el("strong", "Press Secretaries"), ": publish your statement to the world."),
            el("li", el("strong", "Intelligence Officers"), ": brief your team on your secret report."),
          ),
          el("p.p-body.muted.p-section", `Diplomatic notes sent so far: ${H.notes.length}`),
        ),
        el("div",
          el("div.p-h", "The wire"),
          el("div.wire", wire.length ? wire.map((w, i) => el(`div.telegram${i === 0 && fresh ? ".flash" : ""}`, el("div.telegram__head", w.kind === "press" ? `Press · ${delName(w.del)}` : w.kind === "threat" ? `Threat · ${delName(w.del)}` : `Dispatch · ${delName(w.del)}`), w.text)) : el("p.p-body.muted", "Quiet, for now.")),
        ),
      ),
      decisionList(round),
    );
  }

  if (stage.phase === "vote") {
    return el("div", header,
      el("p.p-q.p-section", "The doors are closed. Heads of Delegation: cast your votes."),
      el("div.p-section", delegationCards((d) => {
        if (d === "de") return { done: !!rs.germany, text: rs.germany ? "✓ Objection lodged" : "Writing an objection…" };
        const done = !!rs.votes[d];
        return { done, text: done ? "✓ Ballot cast" : "Deliberating…" };
      })),
      H.italyNPC ? el("p.p-body.muted.p-section", "Italy's votes are cast by the game.") : null,
    );
  }

  if (stage.phase === "reveal" || stage.phase === "reflect") {
    const res = rs.result || E.resolveRound(H, stage.id);
    const results = round.decisions.map((d) => {
      const votes = res.votes[d.id];
      return el("div.result",
        el("div.result__q", d.title),
        el("div.result__won", optLabel(d, res.dec[d.id])),
        el("div.votes", Object.entries(votes).map(([del, v]) => chip(del, optLabel(d, v)))),
        res.deadlock[d.id] ? el("p.small.muted", { style: { marginTop: "6px" } }, "No majority: the compromise stands.") : null,
      );
    });
    const moods = E.moodWords(H);
    if (stage.phase === "reflect") {
      const total = E.activePlayers(H).filter(([, p]) => p.d).length;
      const done = Object.values(H.reflected).filter((r) => r[stage.id]).length;
      return el("div", header,
        el("p.p-q.p-section", round.reflect),
        el("p.p-body.p-section", "On your device: write your notebook entry. What did your delegation want? What did it get? Who paid the price?"),
        el("p.p-body.muted", `${done} of ${total} notebooks written`),
        H.showHistory ? historyPanel(round.history) : null,
      );
    }
    return el("div", header,
      el("div.p-cols",
        el("div", results),
        el("div",
          res.lines.length ? el("div", el("div.p-h", "Consequences"), res.lines.map((l) => el("div.telegram", l))) : null,
          el("div.p-section", el("div.p-h", "The mood"), el("div.moods", moods.map((m) => el("div.mood", el("div.mood__place", m.place), el("div.mood__word", m.word))))),
        ),
      ),
      H.showHistory ? historyPanel(round.history) : null,
    );
  }
  return header;
}

function historyPanel(lines, title = "What really happened") {
  return el("div.history.p-section", el("div.eyebrow", title), el("ul.list", { style: { marginTop: "8px" } }, lines.map((l) => el("li", l))));
}

function treatyBlock() {
  const lines = E.treatySummary(H);
  return el("div.treaty",
    el("div.eyebrow", "Treaty of Peace between the Allied and Associated Powers and Germany"),
    el("ol", { style: { marginTop: "10px" } }, lines.map((l) => el("li", l.term, l.softened ? el("span.tag-soft", ` (softened: ${l.softened.toLowerCase()})`) : null))),
  );
}

function viewFinale(stage) {
  if (stage.phase === "terms") {
    const t = FINALE.terms;
    return el("div",
      el("div.p-date", t.date), el("h1.p-title", t.title),
      el("div.p-cols",
        treatyBlock(),
        el("div",
          el("div.source.p-source", el("p.source__text", `“${t.source.text}”`), el("p.source__cite", t.source.cite)),
          el("p.p-q.p-section", "Germany: choose up to three terms to challenge."),
          el("p.p-body", "Everyone else: read the treaty you wrote. Which terms will Germany fight?"),
          el("p.p-body.p-section", el("strong", H.finale.chosen.length ? "✓ Germany has chosen its objections." : "Germany is deciding…")),
        ),
      ),
    );
  }
  if (stage.phase === "counter") {
    const obs = E.finaleObjections(H).map((id) => E.objectionCandidates(H).find((c) => c.id === id)).filter(Boolean);
    return el("div",
      el("div.p-date", FINALE.counter.date), el("h1.p-title", FINALE.counter.title),
      el("p.p-q.p-section", FINALE.counter.prompt),
      el("div.p-section", obs.map((o) => el("div.result", el("div.result__q", o.title), el("div.result__won", o.soften), el("p.p-body.muted", `Currently: ${o.term}`)))),
      el("div.p-section", delegationCards((d) => (d === "de" ? { done: true, text: "Waiting for the verdict" } : { done: !!H.finale.votes[d], text: H.finale.votes[d] ? "✓ Voted" : "Deliberating…" }))),
    );
  }
  if (stage.phase === "sign") {
    const r = H.finale.results || {};
    const hasChina = H.delegations.includes("cn") || H.vaPersonas.includes("china");
    return el("div",
      el("div.p-date", FINALE.sign.date), el("h1.p-title", FINALE.sign.title),
      el("div.p-cols",
        el("div",
          el("div.p-h", "The verdict on Germany's objections"),
          Object.entries(r).map(([id, x]) => el("div.result", el("div.result__q", E.decisionById(id).title), el("div.result__won", x.granted ? "Granted" : "Refused"), el("p.small.muted", `${x.grant} for, ${x.refuse} against`))),
          Object.keys(r).length ? null : el("p.p-body.muted", "Germany lodged no objections."),
        ),
        el("div",
          el("div.source.p-source", el("p.source__text", `“${FINALE.sign.source.text}”`), el("p.source__cite", FINALE.sign.source.cite)),
          el("p.p-q.p-section", "The Allies give an ultimatum: sign, or the war resumes."),
          el("p.p-body.p-section", el("strong", H.finale.sign.de ? "✓ Germany has decided." : "Germany is deciding…")),
          hasChina ? el("p.p-body", el("strong", H.finale.sign.china ? "✓ China has decided." : "China is deciding…")) : null,
        ),
      ),
    );
  }
  // ceremony
  const sign = H.finale.sign;
  const { flags } = E.meters(H);
  const deText = sign.de === "refuse"
    ? "Germany refused. Allied armies crossed the Rhine and the blockade tightened. Days later, a new German government signed under protest, and nationalists swore revenge."
    : "Germany signed. Two ministers of the new republic put their names to the treaty. In Germany, nationalists called them “November criminals”.";
  const chinaRefused = sign.china === "refuse" || flags.chinaRefuses;
  return el("div",
    el("div.p-date", FINALE.ceremony.date), el("h1.p-title", FINALE.ceremony.title),
    el("p.p-body.p-section", FINALE.ceremony.text),
    el("div.p-cols",
      el("div",
        el("div.telegram", el("div.telegram__head", "Germany"), deText),
        H.delegations.includes("cn") || H.vaPersonas.includes("china")
          ? el("div.telegram", el("div.telegram__head", "China"), chinaRefused ? "China's seats stay empty. Its delegates refuse to sign." : "China signs.")
          : null,
        el("p.p-q.p-section", FINALE.ceremony.reflect),
      ),
      treatyBlock(),
    ),
    H.showHistory ? historyPanel(FINALE.history) : null,
  );
}

function viewEpilogue(stage) {
  const events = E.epilogueEvents(H);
  if (stage.phase === "timeline") {
    const ev = events[stage.step];
    return el(`div${ev.danger ? "" : ".event--calm"}`,
      el("div.p-date", "Epilogue · the next twenty years"),
      el("div.year", { style: { marginTop: "18px" } }, ev.year),
      el("h1.p-title", { style: { marginTop: "8px" } }, ev.title),
      el("p.p-q.p-section", { style: { maxWidth: "1100px" } }, ev.text),
      el("div.timeline-dots", events.map((e, i) => el(`span${i === stage.step ? ".on" : ""}${e.danger ? ".danger" : ""}`, e.year))),
    );
  }
  if (stage.phase === "verdict") {
    const sc = E.scores(H);
    const rows = [];
    for (const d of H.delegations) {
      if (d === "va") {
        for (const p of H.vaPersonas) if (sc[p]) rows.push({ label: PERSONAS[p].name, pct: sc[p].pct, color: delColor("va") });
      } else if (sc[d]) rows.push({ label: delName(d), pct: sc[d].pct, color: delColor(d) });
    }
    rows.sort((a, b) => b.pct - a.pct);
    return el("div",
      el("div.p-date", "The verdict"),
      el("h1.p-title", "Was it fair?"),
      el("p.p-sub", "How much of its secret orders did each party achieve?"),
      el("div.bars.p-section", rows.map((r) => el("div.bar", { style: { "--c": r.color } }, el("div.bar__label", r.label), el("div.bar__track", el("div.bar__fill", { style: { width: `${r.pct}%` } })), el("div.bar__val", `${r.pct}%`)))),
      el("p.p-q.p-section", "Is a treaty fair if every party is equally unhappy? Or only if the guilty pay?"),
    );
  }
  // history
  const ours = events.filter((e) => e.danger).length;
  return el("div",
    el("div.p-date", "Your history and the real one"),
    el("h1.p-title", "What really happened"),
    el("div.p-cols",
      el("div", el("div.p-h", "1919–1945"), el("ul.p-body.list", REAL_TIMELINE.map(([y, t]) => el("li", el("strong", `${y} `), t)))),
      el("div",
        el("div.p-h", "Your conference"),
        el("p.p-body", `${ours} of ${events.length} years in your epilogue went toward conflict.`),
        el("p.p-body", events[events.length - 1].text),
        el("div.p-section.card.card--seal",
          el("p.p-q", "Did the Treaty of Versailles make the Second World War inevitable?"),
          el("p.p-body.muted", { style: { marginTop: "8px" } }, "What else had to happen? The Depression, the failure of the League, choices made in the 1930s, and choices made in Tokyo and Rome, not only in Berlin."),
        ),
      ),
    ),
  );
}

function viewDebrief() {
  return el("div",
    el("div.p-date", "Debrief"),
    el("h1.p-title", "Stepping out of role"),
    el("ol.p-body.list.p-section", { style: { fontSize: "clamp(1.1rem, 1.7vw, 1.6rem)" } }, DEBRIEF.map((q) => el("li", q))),
  );
}

function viewWrite() {
  return el("div",
    el("div.p-date", "Assessment"),
    el("h1.p-title", "Was the Treaty of Versailles fair?"),
    el("p.p-sub", "On your device: choose a perspective and download your worksheet. Your notebook entries are already in it."),
    el("div.grid2.p-section", PERSPECTIVES.map((p) => el("div.card", el("h3", p.title), el("p.small", p.intro)))),
  );
}

// ------------------------------------------------------------ console drawer
function renderDrawer(stage) {
  const tabs = [["delegations", "Delegations"], ["submissions", "This round"], ["notes", `Notes (${H.notes.length})`], ["settings", "Settings"]];
  let body;
  if (drawerTab === "delegations") {
    const rows = E.activePlayers(H).sort((a, b) => (a[1].d || "").localeCompare(b[1].d || "") || a[1].name.localeCompare(b[1].name));
    body = el("div",
      H.delegations.length ? el("p.small.muted", "Move a student by choosing a new delegation. Jobs are recalculated automatically.") : el("p.small.muted", "Students appear here as they join. Press “Assign delegations” when everyone is in."),
      el("table",
        el("tr", el("th", "Student"), el("th", "Delegation"), el("th", "Job")),
        rows.map(([pid, p]) => el("tr",
          el("td", p.name),
          el("td", H.delegations.length
            ? el("select", { onchange: (e) => movePlayer(pid, e.target.value) },
                H.delegations.map((d) => el("option", { value: d, selected: p.d === d ? true : null }, delName(d))),
                el("option", { value: "__remove" }, "Remove from game"))
            : "—"),
          el("td.small", (p.jobs || []).map((j) => JOBS[j].label).join(", "), p.personas && p.personas.length ? el("div.muted", p.personas.map((x) => PERSONAS[x].name).join(", ")) : null),
        )),
      ),
      H.delegations.length && stage.kind === "lobby" ? el("button.btn.btn--small", { type: "button", style: { marginTop: "12px" }, onclick: reshuffle }, "Reshuffle everyone") : null,
    );
  } else if (drawerTab === "submissions") {
    if (stage.kind !== "round") body = el("p.small.muted", "Shows ballots and threats during a round.");
    else {
      const round = E.roundById(stage.id);
      const rs = E.roundState(H, stage.id);
      body = el("div",
        el("h3", round.title),
        el("table",
          el("tr", el("th", "Delegation"), el("th", "Ballot"), el("th", "Threat / action"), el("th", "Press")),
          H.delegations.map((d) => el("tr",
            el("td", delName(d)),
            el("td.small", d === "de"
              ? (rs.germany ? `Objects to: ${rs.germany.objection ? E.decisionById(rs.germany.objection).title : "nothing"}; stance: ${rs.germany.stance}` : "—")
              : rs.votes[d] ? Object.entries(rs.votes[d]).map(([k, v]) => el("div", `${E.decisionById(k).title}: ${optLabel(E.decisionById(k), v)}`)) : "—"),
            el("td.small", [rs.threats[d] ? round.threats.find((t) => t.id === rs.threats[d]).label : "", ...(rs.actions[d] || []).map((a) => round.actions.find((x) => x.id === a).label)].filter(Boolean).join("; ") || "—"),
            el("td.small", rs.statements[d] || "—"),
          )),
        ),
        el("p.small.muted", { style: { marginTop: "10px" } }, "Ballots stay hidden from the projector until you reveal the results."),
      );
    }
  } else if (drawerTab === "notes") {
    body = el("div", H.notes.length ? H.notes.slice().reverse().map((n) => el("div.note",
      el("div.note__meta", `${delName(n.from)} → ${delName(n.to)} · ${n.by} · ${new Date(n.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`),
      el("div", n.text),
    )) : el("p.small.muted", "No notes yet. Notes are structured (students choose from menus), so there is nothing to moderate."));
  } else {
    body = el("div.stack",
      el("p", el("strong", "Conference code: "), code),
      el("p", el("strong", "Teacher key: "), el("span.mono", hostKey), el("br"), el("span.small.muted", "You need this only to resume on a different computer.")),
      el("label.field", el("span.label", "Negotiation time per round (minutes)"),
        el("input.input", { type: "number", min: "2", max: "30", value: String(H.negotiateMin), style: { maxWidth: "120px" }, onchange: (e) => change(() => (H.negotiateMin = Math.max(2, Math.min(30, Number(e.target.value) || 10)))) })),
      el("p.small.muted", `Length: ${PRESETS[H.preset].label} (${H.roundIds.length} rounds).`),
      el("button.btn.btn--small", { type: "button", onclick: () => { if (confirm("Leave this screen? The conference stays saved.")) { clearInterval(pollTimer); location.hash = ""; location.reload(); } } }, "Leave to the start screen"),
    );
  }
  return el("aside.drawer",
    el("div.drawer__head",
      el("div.row", tabs.map(([id, label]) => el("button.btn.btn--small" + (drawerTab === id ? ".btn--primary" : ".btn--ghost"), { type: "button", onclick: () => { drawerTab = id; render(); } }, label))),
      el("button.btn.btn--small.btn--ghost", { type: "button", onclick: () => { drawerOpen = false; render(); }, "aria-label": "Close console" }, "✕"),
    ),
    el("div.drawer__body", body),
  );
}

// ------------------------------------------------------------ boot
function boot() {
  const fromHash = location.hash.slice(1).toUpperCase();
  const saved = savedGames().find((g) => g.code === fromHash);
  if (saved) resume(saved.code, saved.hostKey);
  else renderSetup();
}

window.addEventListener("keydown", (e) => {
  if (!H || e.target.matches("input, select, textarea")) return;
  if (e.key === "ArrowRight" && e.altKey) nextStep();
});

boot();
