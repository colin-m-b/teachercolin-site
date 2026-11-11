// Student device view for The Paris Peace Conference, 1919.
// Students join with a code and first name, then follow the teacher's
// projector. Everything they do is sent as a small action; the teacher's
// browser decides what counts.

import { call, storage, h as el, fmtClock, timerRemaining, ApiError } from "./api.js";
import {
  DELEGATIONS, PERSONAS, JOBS, ROUNDS, FINALE, PRESS_TONES, PRESS_LINES, NOTE_TYPES, NOTE_REPLIES,
  GERMAN_STANCES, REAL_TIMELINE, DEBRIEF, PERSPECTIVES, ITALY_NPC_NOTE,
} from "./content.js";
import { leversFor, delegationVotesOn, personasOf } from "./engine.js";
import { buildWorksheet, downloadBlob } from "./worksheet.js";

const SESSION_KEY = "ppc.student.session";
const app = document.getElementById("app");

let session = storage.get(SESSION_KEY); // { code, pid, key, name }
let S = null; // public state
let D = null; // my delegation's private doc
let skew = 0;
let tab = "now";
let pendingRender = false;
let lastSig = "";
let notebook = {};
let seenNotes = 0;
let local = { recs: {}, ballot: {}, compose: { type: "offer" }, override: false, chosen: null, perspective: null };
let pollHandle = null;

// ------------------------------------------------------------ helpers
const roundById = (id) => ROUNDS.find((r) => r.id === id);
const me = () => (S && S.players ? S.players[session.pid] : null);
const myDel = () => (me() ? me().d : null);
const jobs = () => (me() ? me().jobs || [] : []);
const has = (job) => jobs().includes(job);
function delName(del) {
  if (del === "va" && S && S.vaPersonas.includes("arab")) return "Voices of Asia, Africa & the Arab World";
  return DELEGATIONS[del] ? DELEGATIONS[del].name : del;
}
const delColor = (del) => (DELEGATIONS[del] ? DELEGATIONS[del].color : "#1D3A5F");
function toast(text) {
  const t = el("div.toast", text);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
async function act(type, data) {
  try {
    await call("act", { code: session.code, pid: session.pid, key: session.key, type, data });
    return true;
  } catch (err) {
    toast(err.message);
    if (err instanceof ApiError && err.status === 403) leave();
    return false;
  }
}
function memberWith(job) {
  if (!D) return null;
  const m = D.members.find((x) => (x.jobs || []).includes(job));
  return m ? m.name : null;
}
function stars(n) {
  return "★".repeat(Math.max(1, Math.min(4, n)));
}

// ------------------------------------------------------------ join
function renderJoin(message, pendingName) {
  stopPolling();
  document.body.className = "ppc";
  const codeFromUrl = new URLSearchParams(location.search).get("code") || "";
  app.replaceChildren(
    el("header.mast", el("div.mast__inner", el("div.mast__title", "The Paris Peace Conference, ", el("span", "1919")))),
    el("main.dev", { style: { paddingTop: "28px" } },
      el("div.eyebrow", "Paris · January 1919"),
      el("h1.display", { style: { fontSize: "2.2rem", margin: "6px 0 10px" } }, "Delegates, take your seats."),
      el("p.lede", "The war is over. Now the world must make peace. Join your class's conference."),
      el("form.card.stack", { style: { marginTop: "22px" }, onsubmit: (e) => { e.preventDefault(); join(); } },
        el("label.field", el("span.label", "Conference code"), el("input.input.input--code", { id: "code", maxlength: "4", autocomplete: "off", autocapitalize: "characters", value: codeFromUrl || (session && session.code) || "", required: true })),
        el("label.field", el("span.label", "Your first name"), el("input.input", { id: "name", maxlength: "24", autocomplete: "given-name", value: pendingName || "", required: true })),
        message ? el("p.error", message) : null,
        el("button.btn.btn--primary.btn--block", { type: "submit", id: "joinbtn" }, "Enter the Conference"),
      ),
      el("p.small.muted", { style: { marginTop: "14px" } }, "Only your first name is stored, and the whole conference is deleted after 7 days. Teachers: ", el("a", { href: "teacher.html" }, "open the teacher console"), "."),
    ),
  );
}

async function join(claim = false, nameOverride) {
  const code = document.getElementById("code") ? document.getElementById("code").value.trim().toUpperCase() : session.code;
  const name = nameOverride || document.getElementById("name").value.trim();
  if (!/^[A-Z]{4}$/.test(code)) return renderJoin("The code is four letters, on the big screen.", name);
  if (!name) return renderJoin("Type your first name.", name);
  const btn = document.getElementById("joinbtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Joining…";
  }
  try {
    const res = await call("join", { code, name, claim });
    if (res.exists) {
      app.replaceChildren(el("main.dev", { style: { paddingTop: "40px" } },
        el("div.card.stack",
          el("h2", `Someone called “${res.name}” has already joined.`),
          el("p", "Is that you, rejoining on this device? If not, go back and add your last initial."),
          el("div.row",
            el("button.btn.btn--primary", { type: "button", onclick: () => { session = { code }; join(true, name); } }, "Yes, that's me"),
            el("button.btn", { type: "button", onclick: () => renderJoin(null, `${name} `) }, "No, go back"),
          ),
        ),
      ));
      session = { code };
      return;
    }
    session = { code, pid: res.pid, key: res.key, name: res.name };
    storage.set(SESSION_KEY, session);
    notebook = res.notebook || storage.get(`ppc.nb.${code}.${res.pid}`, {}) || {};
    startPolling();
  } catch (err) {
    renderJoin(err.message, name);
  }
}

function leave() {
  storage.remove(SESSION_KEY);
  session = null;
  S = null;
  D = null;
  renderJoin();
}

// ------------------------------------------------------------ polling
function startPolling() {
  stopPolling();
  document.body.className = "ppc";
  renderShell();
  pollOnce();
  pollHandle = setInterval(() => {
    if (document.hidden && Math.random() < 0.66) return; // poll less when the tab is hidden
    pollOnce();
  }, 2500);
}
function stopPolling() {
  clearInterval(pollHandle);
  pollHandle = null;
}

async function pollOnce() {
  if (!session || !session.key) return;
  try {
    const res = await call("poll", { code: session.code, pid: session.pid, key: session.key, v: S ? S.v : -1 }, { retries: 0 });
    skew = res.now - Date.now();
    if (res.state) S = res.state;
    D = res.del;
    const sig = JSON.stringify([S && S.v, D]);
    if (sig !== lastSig) {
      lastSig = sig;
      requestRender();
    }
    setOffline(false);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
      stopPolling();
      storage.remove(SESSION_KEY);
      renderJoin(err.message);
      return;
    }
    setOffline(true);
  }
}

function setOffline(off) {
  let bar = document.getElementById("offline");
  if (!off) return bar && bar.remove();
  if (!bar) document.body.append(el("div.toast", { id: "offline" }, "Reconnecting to the Conference…"));
}

// Don't rebuild the page under someone's fingers.
function requestRender() {
  const a = document.activeElement;
  if (a && app.contains(a) && a.matches("textarea, input[type=text], input:not([type])")) {
    pendingRender = true;
    return;
  }
  render();
}
document.addEventListener("focusout", () => {
  setTimeout(() => {
    if (pendingRender) {
      pendingRender = false;
      requestRender();
    }
  }, 50);
});

setInterval(() => {
  const c = document.getElementById("minitimer");
  if (c && S) c.textContent = fmtClock(timerRemaining(S.timer, skew));
}, 500);

// ------------------------------------------------------------ shell
function renderShell() {
  app.replaceChildren(el("main.dev", el("div.lookup", el("div.display", "Connecting…"))));
}

function render() {
  if (!S) return renderShell();
  const p = me();
  const stage = S.stage;
  const del = myDel();
  const band = el("div.dev__band", { style: { "--c": del ? delColor(del) : "#1D3A5F" } },
    el("div",
      el("b", del ? delName(del) : "The Paris Peace Conference"),
      el("div.small", session.name, p && p.personas && p.personas.length ? ` · for ${p.personas.map((x) => PERSONAS[x].name).join(", ")}` : ""),
    ),
    el("div", { style: { textAlign: "right" } },
      el("div.jobs", (p && p.jobs ? p.jobs : []).map((j) => el("span.job", JOBS[j].label))),
      stage.kind === "round" && stage.phase === "negotiate" ? el("div.minitimer", { id: "minitimer" }, fmtClock(timerRemaining(S.timer, skew))) : null,
    ),
  );

  if (!p) {
    app.replaceChildren(band, el("main.dev", el("div.lookup", el("div.display", "You're in."), el("p.muted", "Waiting for your teacher to let you in…"))));
    return;
  }
  if (!del) {
    app.replaceChildren(band, el("main.dev",
      el("div.lookup", el("div.display", `Welcome, ${session.name}.`), el("p", "Your teacher will assign you to a delegation soon. Look at the big screen.")),
      el("p.small.muted", { style: { textAlign: "center" } }, el("button.btn.btn--ghost.btn--small", { type: "button", onclick: () => { if (confirm("Leave the conference on this device?")) leave(); } }, "Not you? Leave")),
    ));
    return;
  }

  const incoming = D ? D.notes.filter((n) => n.to === del).length : 0;
  const unread = tab === "notes" ? 0 : Math.max(0, incoming - seenNotes);
  if (tab === "notes") seenNotes = incoming;
  const tabs = el("div.tabs", { role: "tablist" },
    [["now", "Now"], ["orders", "Orders"], ["notes", "Notes"], ["notebook", "Notebook"]].map(([id, label]) =>
      el("button.tab", { type: "button", role: "tab", "aria-selected": String(tab === id), onclick: () => { tab = id; render(); } },
        label, id === "notes" && unread ? el("span.badge", String(unread)) : null),
    ),
  );
  let body;
  if (tab === "orders") body = viewOrders();
  else if (tab === "notes") body = viewNotes();
  else if (tab === "notebook") body = viewNotebook();
  else body = viewNow();
  app.replaceChildren(band, el("main.dev", tabs, body));
}

// ------------------------------------------------------------ ORDERS tab
function dossier(del) {
  const d = DELEGATIONS[del];
  const personas = me().personas || [];
  const blocks = [];
  if (del !== "va") {
    blocks.push(el("div.card.card--navy",
      el("div.eyebrow", "Your delegation"),
      el("h3", `${d.name}: ${d.leader}`),
      d.leaderTitle ? el("p.small.muted", d.leaderTitle) : null,
      el("p", { style: { marginTop: "8px" } }, d.who),
      el("p", { style: { marginTop: "10px" } }, el("strong", "You want:")),
      el("ul.list", d.wants.map((w) => el("li", w))),
      el("p", { style: { marginTop: "10px" } }, el("strong", "You fear: "), d.fears),
      d.facts.length ? el("p.small.muted", { style: { marginTop: "8px" } }, d.facts.join(" · ")) : null,
    ));
    if (del === "de") blocks.push(el("p.notice", "Germany has no vote. Each round you lodge a formal objection and choose how to present the terms to the German people. In the finale, the Conference votes on your objections, and you decide whether Germany signs."));
  } else {
    blocks.push(el("div.card.card--navy", el("div.eyebrow", "Your delegation"), el("h3", delName("va")), el("p", d.who)));
  }
  const showPersonas = del === "va" ? S.vaPersonas : [];
  for (const id of showPersonas) {
    const p = PERSONAS[id];
    const mine = personas.includes(id);
    blocks.push(el(`div.card${mine ? ".card--seal" : ""}`,
      el("div.eyebrow", mine ? "You speak for" : "Your teammate speaks for"),
      el("h3", `${p.name}: ${p.leader}`),
      el("p", p.who),
      el("ul.list", { style: { marginTop: "8px" } }, p.wants.map((w) => el("li", w))),
    ));
  }
  return blocks;
}

function currentRound() {
  return S.stage.kind === "round" ? roundById(S.stage.id) : null;
}

function viewOrders() {
  const del = myDel();
  const round = currentRound();
  const parts = [];
  if (round) {
    const holders = del === "va" ? S.vaPersonas : del === "cn" ? ["china"] : [del];
    const goals = holders.flatMap((hld) => (round.goals[hld] || []).map((g) => ({ ...g, holder: hld })));
    parts.push(el("div.card.card--seal",
      el("div.eyebrow", `Secret orders · Round ${S.stage.r + 1}`),
      el("h3", round.title),
      goals.length
        ? goals.map((g) => el("div.goal", el("span.goal__pts", stars(g.max)), el("div", holders.length > 1 ? el("strong", `${PERSONAS[g.holder].name}: `) : null, g.text)))
        : el("p.muted", "Nothing on the table matters directly to you this round. Use your vote to make friends."),
      el("p.small.muted", { style: { marginTop: "8px" } }, "More stars means it matters more. Your score stays secret until the end."),
    ));
    const intel = round.intel[del];
    if (intel) {
      parts.push(has("intel")
        ? el("div.card", el("div.eyebrow", "Intelligence report · for your eyes only"), el("p.mono", { style: { marginTop: "6px" } }, intel), el("p.small.muted", { style: { marginTop: "8px" } }, "Brief your team. Only you can see this."))
        : el("div.card.card--tint", el("div.eyebrow", "Intelligence report"), el("p", `${memberWith("intel") || "Your Intelligence Officer"} has a confidential report this round. Ask them what it says.`)));
    }
    const lv = leversFor(S, del, round);
    if (lv.threats.length || lv.actions.length) {
      parts.push(el("div.card",
        el("div.eyebrow", "Your levers this round"),
        lv.threats.map((t) => el("p", { style: { marginTop: "8px" } }, el("strong", `Threat: ${t.label}. `), `You demand ${demandText(t)}. If the vote goes against you, the threat is carried out, and that has consequences for you too.`)),
        lv.actions.map((a) => el("p", { style: { marginTop: "8px" } }, el("strong", `Action: ${a.label}. `), "Goes straight onto the wire. No conditions.")),
        el("p.small.muted", { style: { marginTop: "8px" } }, `Only the Head of Delegation (${memberWith("head") || "your Head"}) can use them.`),
      ));
    }
  }
  parts.push(...dossier(del));
  if (S.italyNPC) parts.push(el("p.small.muted", ITALY_NPC_NOTE));
  return el("div.stack", parts);
}

function demandText(threat) {
  const round = currentRound();
  const dec = round.decisions.find((d) => d.id === threat.demand.decision);
  const opts = threat.demand.options.map((o) => `“${dec.options.find((x) => x.id === o).label}”`).join(" or ");
  return `${opts} on ${dec.title.toLowerCase()}`;
}

// ------------------------------------------------------------ NOW tab
function phaseHeader(eyebrow, title, sub) {
  return el("div.dev__phase", el("div.eyebrow", eyebrow), el("div.display", title), sub ? el("p.muted", sub) : null);
}

function viewNow() {
  const st = S.stage;
  if (S.overlay === "cliff") return el("div.lookup", el("div.display", "The Conference adjourns."), el("p", "See you next lesson. Your work is saved."));
  if (S.overlay === "recap") return el("div.stack", phaseHeader(`Lesson ${S.lesson}`, "Previously at Paris…", "Look at the big screen."), jobCard());
  if (st.kind === "lobby") return el("div.stack", phaseHeader("Paris · January 1919", "Welcome to the Conference", "Sit with your delegation and read your orders."), jobCard(), ...dossier(myDel()));
  if (st.kind === "round") return viewRound(st);
  if (st.kind === "finale") return viewFinale(st);
  if (st.kind === "epilogue") return viewEpilogue(st);
  if (st.kind === "debrief") return el("div.stack", phaseHeader("Debrief", "Stepping out of role"), el("ol.list.card", DEBRIEF.map((q) => el("li", q))), essayCard());
  if (st.kind === "write") return el("div.stack", phaseHeader("Assessment", "Was the Treaty of Versailles fair?"), essayCard());
  return el("div");
}

function jobCard() {
  return el("div.card",
    el("div.eyebrow", "Your job"),
    jobs().map((j) => el("p", { style: { marginTop: "6px" } }, el("strong", `${JOBS[j].label}: `), JOBS[j].does)),
    D ? el("p.small.muted", { style: { marginTop: "8px" } }, "Your team: ", D.members.map((m) => `${m.name} (${(m.jobs || []).map((j) => JOBS[j].label).join(", ")})`).join(" · ")) : null,
  );
}

function myDecisions(round) {
  const del = myDel();
  return round.decisions.filter((d) => delegationVotesOn(S, del, d));
}

function recommendBlock(round) {
  const decisions = myDecisions(round);
  if (!decisions.length) return null;
  return el("div.card",
    el("div.eyebrow", "Recommend to your Head"),
    el("p.small.muted", "Tap the option you think your delegation should vote for. Your whole team sees it."),
    decisions.map((dec) => {
      const recs = (D && D.recs && D.recs[dec.id]) || {};
      const mine = local.recs[`${round.id}:${dec.id}`] || recs[session.name];
      return el("div", { style: { marginTop: "14px" } },
        el("h3", { style: { fontSize: "1.1rem" } }, `${dec.title}${dec.body === "council" ? " (Council of Four)" : ""}`),
        el("p.small", { style: { marginBottom: "8px" } }, dec.question),
        dec.options.map((o) => {
          const names = Object.entries(recs).filter(([, v]) => v === o.id).map(([n]) => n);
          return el("button.opt", { type: "button", "aria-pressed": String(mine === o.id), onclick: () => { local.recs[`${round.id}:${dec.id}`] = o.id; act("rec", { round: round.id, decision: dec.id, option: o.id }); render(); } },
            el("span.opt__label", o.label), el("span.opt__detail", o.detail),
            names.length ? el("span.opt__recs", `Recommended by ${names.join(", ")}`) : null);
        }),
      );
    }),
  );
}

function ballotBlock(round) {
  const decisions = myDecisions(round);
  if (!decisions.length) return null;
  const isHead = has("head") || local.override;
  const cast = D && D.votes;
  if (!isHead) {
    return el("div.card",
      el("div.eyebrow", "The ballot"),
      el("p", cast ? `✓ ${memberWith("head") || "Your Head"} has cast your delegation's ballot.` : `${memberWith("head") || "Your Head"} is casting your delegation's ballot. Make your case to them now.`),
      cast ? el("ul.list", { style: { marginTop: "6px" } }, decisions.map((d) => el("li", `${d.title}: ${(d.options.find((o) => o.id === cast[d.id]) || {}).label || "abstain"}`))) : null,
      el("button.btn.btn--ghost.btn--small", { type: "button", style: { marginTop: "8px" }, onclick: () => { if (confirm("Only do this if your Head of Delegation is absent. Cast the ballot yourself?")) { local.override = true; render(); } } }, "Our Head is absent"),
    );
  }
  const unanimityDecision = decisions.find((d) => d.unanimity === myDel());
  return el("div.card.card--navy",
    el("div.eyebrow", "Your ballot · Head of Delegation"),
    decisions.map((dec) => {
      const recs = (D && D.recs && D.recs[dec.id]) || {};
      const chosen = local.ballot[dec.id] || (cast ? cast[dec.id] : null);
      return el("div", { style: { marginTop: "14px" } },
        el("h3", { style: { fontSize: "1.1rem" } }, dec.title),
        dec.options.map((o) => {
          const names = Object.entries(recs).filter(([, v]) => v === o.id).map(([n]) => n);
          return el("button.opt", { type: "button", "aria-pressed": String(chosen === o.id), onclick: () => { local.ballot[dec.id] = o.id; render(); } },
            el("span.opt__label", o.label), names.length ? el("span.opt__recs", `Team: ${names.join(", ")}`) : null);
        }),
      );
    }),
    unanimityDecision ? el("label.row", { style: { marginTop: "14px", alignItems: "flex-start" } },
      el("input", { type: "checkbox", id: "unanimity", checked: (local.unanimity ?? (D && D.unanimity)) ? true : null, onchange: (e) => (local.unanimity = e.target.checked), style: { marginTop: "5px" } }),
      el("span", el("strong", "As chair of the League commission, rule that the racial equality clause needs unanimous support. "), "If even one delegation votes against it, it fails, however many vote for it.")) : null,
    el("button.btn.btn--primary.btn--block", { type: "button", style: { marginTop: "16px" }, onclick: castBallot }, cast ? "Update ballot" : "Cast ballot"),
    cast ? el("p.small.muted", { style: { marginTop: "6px" } }, "Cast. You can change it until your teacher reveals the results.") : null,
  );
}

async function castBallot() {
  const round = currentRound();
  const votes = {};
  for (const d of myDecisions(round)) {
    const v = local.ballot[d.id] || (D && D.votes ? D.votes[d.id] : null);
    if (v) votes[d.id] = v;
  }
  if (Object.keys(votes).length < myDecisions(round).length && !confirm("You haven't chosen on every question. Abstain on the rest?")) return;
  const data = { round: round.id, votes };
  if (myDel() === "us") data.unanimity = !!(local.unanimity ?? (D && D.unanimity));
  if (await act("vote", data)) toast("Ballot cast.");
}

function leverBlock(round) {
  const del = myDel();
  const lv = leversFor(S, del, round);
  if (!lv.threats.length && !lv.actions.length) return null;
  const isHead = has("head") || local.override;
  const declared = D && D.threat;
  return el("div.card.card--seal",
    el("div.eyebrow", "Levers"),
    lv.threats.map((t) => el("div", { style: { marginTop: "10px" } },
      el("p", el("strong", t.label)),
      el("p.small", `Demand: ${demandText(t)}.`),
      declared === t.id ? el("p.notice.notice--seal", "Declared. The whole Conference knows.")
        : declared ? null
        : isHead ? el("button.btn.btn--seal.btn--small", { type: "button", style: { marginTop: "6px" }, onclick: async () => { if (confirm(`Declare this threat publicly? You can only make one threat per round, and you cannot take it back.\n\n${t.label}`)) { if (await act("threat", { round: round.id, id: t.id })) toast("Threat declared."); } } }, "Declare this threat")
        : null,
    )),
    lv.actions.map((a) => el("div", { style: { marginTop: "10px" } },
      el("p", el("strong", a.label)),
      (D && D.actions || []).includes(a.id) ? el("p.notice.notice--ok", "Done. It's on the wire.")
        : isHead ? el("button.btn.btn--small", { type: "button", style: { marginTop: "6px" }, onclick: async () => { if (await act("action", { round: round.id, id: a.id })) toast("Sent to the wire."); } }, "Do it")
        : null,
    )),
    !isHead ? el("p.small.muted", { style: { marginTop: "8px" } }, `Only ${memberWith("head") || "your Head"} can use these. Advise them.`) : null,
  );
}

function pressBlock(round) {
  const del = myDel();
  if (!has("press") || !PRESS_LINES[del]) return null;
  const done = D && D.statement;
  return el("div.card",
    el("div.eyebrow", "Press Secretary · your statement"),
    done ? el("p", `✓ Published: “${PRESS_LINES[del][done]}”`)
      : el("div",
          el("p.small.muted", "Choose your tone. Your statement goes up on the big screen."),
          Object.entries(PRESS_TONES).map(([tone, label]) => el("button.opt", { type: "button", onclick: async () => { if (confirm(`Publish this statement?\n\n“${PRESS_LINES[del][tone]}”`)) { if (await act("statement", { round: round.id, tone })) toast("Published."); } } },
            el("span.opt__label", label), el("span.opt__detail", PRESS_LINES[del][tone]))),
        ),
  );
}

function germanyBlock(round) {
  const decisions = round.decisions.filter((d) => d.soften);
  const cur = D && D.germany;
  local.germany = local.germany || {};
  const objection = local.germany.objection ?? (cur ? cur.objection : decisions[0] ? decisions[0].id : null);
  const stance = local.germany.stance ?? (cur ? cur.stance : null);
  return el("div.card.card--navy",
    el("div.eyebrow", "Germany's written reply"),
    el("p.small", "You are not at the table, but you can protest. Choose the term you object to most this round. In the finale, the Conference will vote on your objections."),
    decisions.length ? el("div", { style: { marginTop: "10px" } },
      el("p", el("strong", "Our formal objection")),
      decisions.map((d) => el("button.opt", { type: "button", "aria-pressed": String(objection === d.id), onclick: () => { local.germany.objection = d.id; render(); } }, el("span.opt__label", d.title), el("span.opt__detail", `We will ask: ${d.soften.label.toLowerCase()}.`))),
    ) : el("p.muted", "Nothing this round touches Germany directly. Choose your message to the German people."),
    el("p", { style: { marginTop: "12px" } }, el("strong", "Our message to the German people")),
    GERMAN_STANCES.map((s) => el("button.opt", { type: "button", "aria-pressed": String(stance === s.id), onclick: () => { local.germany.stance = s.id; render(); } }, el("span.opt__label", s.label), el("span.opt__detail", s.detail))),
    el("button.btn.btn--primary.btn--block", { type: "button", style: { marginTop: "14px" }, disabled: stance ? null : true, onclick: async () => { if (await act("germany", { round: round.id, objection, stance })) toast("Reply lodged."); } }, cur ? "Update our reply" : "Lodge our reply"),
    cur ? el("p.small.muted", { style: { marginTop: "6px" } }, "Lodged. Anyone in your delegation can change it until the vote closes.") : null,
  );
}

function viewRound(st) {
  const round = roundById(st.id);
  const del = myDel();
  const label = { brief: "Briefing", negotiate: "Negotiation", vote: "The vote", reveal: "Results", reflect: "Reflection" }[st.phase];
  const head = phaseHeader(`Round ${st.r + 1} · ${round.date} · ${label}`, round.title, round.question);

  if (st.phase === "brief") {
    return el("div.stack", head,
      el("div.card", el("ul.list", round.context.map((c) => el("li", c)))),
      el("div.source", el("p.source__text", `“${round.source.text}”`), el("p.source__cite", round.source.cite)),
      el("p.notice", "Open the ", el("strong", "Orders"), " tab: your secret orders for this round are there."),
      del === "de" ? germanyBlock(round) : recommendBlock(round),
    );
  }
  if (st.phase === "negotiate" || st.phase === "vote") {
    const blocks = [head];
    if (st.phase === "negotiate") blocks.push(el("p.notice", el("strong", "Negotiate. "), has("envoy") ? "You are the Envoy: send notes (Notes tab) or go and talk to another delegation." : "Discuss with your team. Your Envoy can carry messages to other delegations."));
    if (del === "de") blocks.push(germanyBlock(round));
    else if (st.phase === "vote") blocks.push(ballotBlock(round), recommendBlock(round));
    else blocks.push(recommendBlock(round));
    blocks.push(leverBlock(round), pressBlock(round));
    if (st.phase === "negotiate" && del !== "de" && has("head")) blocks.push(el("p.small.muted", "You will cast the ballot when your teacher calls the vote."));
    return el("div.stack", blocks.filter(Boolean));
  }
  if (st.phase === "reveal") {
    const res = S.results[round.id];
    return el("div.stack", head,
      res ? round.decisions.map((d) => {
        const won = d.options.find((o) => o.id === res.dec[d.id]);
        const mine = res.votes[d.id] ? res.votes[d.id][del] : null;
        return el("div.card",
          el("div.eyebrow", d.title),
          el("h3", won.label),
          el("p.small", won.term),
          mine ? el("p.small.muted", { style: { marginTop: "6px" } }, `Your delegation voted: ${d.options.find((o) => o.id === mine).label}`) : null,
        );
      }) : el("p.muted", "Counting…"),
      res && res.lines.length ? el("div", res.lines.map((l) => el("div.telegram", l))) : null,
      S.showHistory ? historyCard(round.history) : el("p.small.muted", "Look at the big screen."),
    );
  }
  // reflect
  return el("div.stack", head, notebookForm(round.id, round.reflect), S.showHistory ? historyCard(round.history) : null);
}

function historyCard(lines) {
  return el("div.history", el("div.eyebrow", "What really happened"), el("ul.list", { style: { marginTop: "6px" } }, lines.map((l) => el("li", l))));
}

// ------------------------------------------------------------ notebook
function saveNotebookLocal() {
  storage.set(`ppc.nb.${session.code}.${session.pid}`, notebook);
}

function notebookForm(key, question) {
  const entry = notebook[key] || {};
  const field = (name, label, rows = 2) =>
    el("label.field", el("span.label", label),
      el("textarea.textarea", { rows: String(rows), "data-k": name, oninput: (e) => { notebook[key] = { ...(notebook[key] || {}), [name]: e.target.value }; saveNotebookLocal(); } }, entry[name] || ""));
  const fields = key === "final"
    ? [field("answer", question, 5)]
    : [field("want", "What did your delegation want?"), field("got", "What did it get?"), field("paid", "Who paid the price?"), field("answer", question, 3)];
  return el("form.card.stack", { onsubmit: async (e) => { e.preventDefault(); await saveNotebook(key); } },
    el("div.eyebrow", "Your notebook"),
    el("p.small.muted", "A few sentences each. You will use these as evidence in your essay."),
    fields,
    el("button.btn.btn--primary", { type: "submit" }, entry.saved ? "Update notebook" : "Save to notebook"),
    entry.saved ? el("p.small.muted", "✓ Saved") : null,
  );
}

async function saveNotebook(key) {
  notebook[key] = { ...(notebook[key] || {}), saved: Date.now() };
  saveNotebookLocal();
  const ok = await act("notebook", notebook);
  if (ok) {
    await act("reflected", { key });
    toast("Saved to your notebook.");
    render();
  }
}

function viewNotebook() {
  const ids = S.roundIds || [];
  const st = S.stage;
  const reached = (id) => S.results && S.results[id];
  const items = ids.filter(reached).map((id) => {
    const round = roundById(id);
    return el("details.card", { open: st.kind === "round" && st.id === id ? true : null },
      el("summary", el("strong", round.title)),
      el("div", { style: { marginTop: "10px" } }, notebookForm(id, round.reflect)),
    );
  });
  const finished = ["epilogue", "debrief", "write"].includes(st.kind) || (st.kind === "finale" && st.phase === "ceremony");
  return el("div.stack",
    phaseHeader("Your notebook", "Conference notebook", "Your entries become evidence in your essay worksheet."),
    items.length ? items : el("p.muted", "Entries appear here after each round's results."),
    finished || (notebook.final && notebook.final.answer) ? el("details.card", el("summary", el("strong", "The Hall of Mirrors")), el("div", { style: { marginTop: "10px" } }, notebookForm("final", FINALE.ceremony.reflect))) : null,
    finished ? essayCard() : null,
  );
}

// ------------------------------------------------------------ notes
function viewNotes() {
  const del = myDel();
  const notes = D ? D.notes.slice().reverse() : [];
  const canSend = has("envoy") || has("head");
  const others = S.delegations.filter((d) => d !== del);
  return el("div.stack",
    canSend ? composeCard(others) : el("p.notice", `${memberWith("envoy") || "Your Envoy"} sends your delegation's notes. You can read everything here.`),
    notes.length ? notes.map((n) => noteCard(n, canSend)) : el("p.muted", "No notes yet."),
  );
}

function decisionChoices() {
  const round = currentRound();
  if (!round) return [];
  return round.decisions;
}

function composeCard(others) {
  const c = local.compose;
  const decisions = decisionChoices();
  if (!c.to || !others.includes(c.to)) c.to = others[0];
  const type = NOTE_TYPES[c.type];
  const needsA = type.template.includes("{decA}");
  const needsB = type.template.includes("{decB}");
  if (needsA && !decisions.length) c.type = "meet";
  const decA = decisions.find((d) => d.id === c.decA) || decisions[0];
  const decB = decisions.find((d) => d.id === c.decB) || decisions[decisions.length > 1 ? 1 : 0];
  const optA = decA ? decA.options.find((o) => o.id === c.optA) || decA.options[0] : null;
  const optB = decB ? decB.options.find((o) => o.id === c.optB) || decB.options[0] : null;
  const text = NOTE_TYPES[c.type].template
    .replace("{decA}", decA ? decA.title.toLowerCase() : "")
    .replace("{decB}", decB ? decB.title.toLowerCase() : "")
    .replace("{optA}", optA ? optA.label : "")
    .replace("{optB}", optB ? optB.label : "");
  const select = (key, options, value) => el("select.select", { onchange: (e) => { c[key] = e.target.value; render(); } }, options.map(([v, l]) => el("option", { value: v, selected: v === value ? true : null }, l)));
  const typeOptions = Object.entries(NOTE_TYPES).filter(([k, t]) => decisions.length || !t.template.includes("{decA}")).map(([k, t]) => [k, t.label]);
  return el("div.card.card--navy.stack",
    el("div.eyebrow", "New diplomatic note"),
    el("label.field", el("span.label", "To"), select("to", others.map((d) => [d, delName(d)]), c.to)),
    el("label.field", el("span.label", "Kind of note"), select("type", typeOptions, c.type)),
    needsA && decA ? el("div.grid2",
      el("label.field", el("span.label", needsB ? "We vote on" : "On"), select("decA", decisions.map((d) => [d.id, d.title]), decA.id)),
      el("label.field", el("span.label", "Option"), select("optA", decA.options.map((o) => [o.id, o.label]), optA.id))) : null,
    needsB && decB ? el("div.grid2",
      el("label.field", el("span.label", "If you vote on"), select("decB", decisions.map((d) => [d.id, d.title]), decB.id)),
      el("label.field", el("span.label", "Option"), select("optB", decB.options.map((o) => [o.id, o.label]), optB.id))) : null,
    el("div.telegram", el("div.telegram__head", `${delName(myDel())} → ${delName(c.to)}`), text),
    el("button.btn.btn--primary", { type: "button", onclick: async () => { if (await act("note", { to: c.to, type: c.type, text })) { toast("Note sent."); } } }, "Send note"),
  );
}

function noteCard(n, canReply) {
  const del = myDel();
  const incoming = n.to === del;
  const replied = D.notes.some((x) => x.replyTo === n.id);
  return el(`div.note${incoming ? ".note--in" : ".note--out"}`,
    el("div.note__meta", `${incoming ? `From ${delName(n.from)}` : `To ${delName(n.to)}`} · ${n.by} · ${new Date(n.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`),
    el("div", n.text),
    incoming && canReply && !n.reply && !replied
      ? el("div.row", { style: { marginTop: "8px" } }, Object.entries(NOTE_REPLIES).map(([k, t]) =>
          el("button.btn.btn--small", { type: "button", onclick: async () => { if (await act("note", { to: n.from, type: "reply", reply: k, replyTo: n.id, text: `Re: “${n.text.slice(0, 80)}${n.text.length > 80 ? "…" : ""}” ${t}` })) toast("Reply sent."); } }, t)))
      : null,
  );
}

// ------------------------------------------------------------ finale
function viewFinale(st) {
  const del = myDel();
  const isHead = has("head") || local.override;
  if (st.phase === "terms") {
    const t = FINALE.terms;
    const treaty = el("div.treaty", el("div.eyebrow", "The treaty"), el("ol", { style: { marginTop: "8px" } }, (S.treaty || []).map((x) => el("li", x.term))));
    if (del !== "de") return el("div.stack", phaseHeader(t.date, t.title, "Germany is choosing which terms to challenge."), treaty);
    const cands = (D && D.candidates) || [];
    local.chosen = local.chosen || (D && D.finale && D.finale.chosen && D.finale.chosen.length ? D.finale.chosen.slice() : cands.filter((c) => (S.objections || []).some((o) => o.id === c.id)).map((c) => c.id).slice(0, 3));
    local.delivery = local.delivery || (D && D.finale && D.finale.delivery) || null;
    return el("div.stack",
      phaseHeader(t.date, t.title, t.germanyPrompt),
      el("div.source", el("p.source__text", `“${t.source.text}”`), el("p.source__cite", t.source.cite)),
      el("div.card.card--navy",
        el("div.eyebrow", `Challenge up to three terms (${local.chosen.length} chosen)`),
        cands.length ? null : el("p.muted", "Your conference was mild: there is nothing left that Germany can ask to soften. Choose how you receive the treaty."),
        cands.map((c) => el("button.opt", { type: "button", "aria-pressed": String(local.chosen.includes(c.id)), onclick: () => {
          if (local.chosen.includes(c.id)) local.chosen = local.chosen.filter((x) => x !== c.id);
          else if (local.chosen.length < 3) local.chosen.push(c.id);
          else toast("Three at most. Remove one first.");
          render();
        } }, el("span.opt__label", c.title), el("span.opt__detail", `Now: ${c.term}`), el("span.opt__recs", `We ask: ${c.soften}`))),
        el("p", { style: { marginTop: "12px" } }, el("strong", "How will you receive the treaty?")),
        t.deliveryOptions.map((o) => el("button.opt", { type: "button", "aria-pressed": String(local.delivery === o.id), onclick: () => { local.delivery = o.id; render(); } }, el("span.opt__label", o.label), el("span.opt__detail", o.detail))),
        el("button.btn.btn--primary.btn--block", { type: "button", style: { marginTop: "14px" }, onclick: async () => { if (await act("finale-objections", { list: local.chosen, delivery: local.delivery })) toast("Germany's reply delivered."); } }, "Deliver Germany's reply"),
        D && D.finale && D.finale.chosen && D.finale.chosen.length ? el("p.small.muted", { style: { marginTop: "6px" } }, "Delivered. You can change it until your teacher moves on.") : null,
      ),
    );
  }
  if (st.phase === "counter") {
    const obs = S.objections || [];
    if (del === "de") return el("div.stack", phaseHeader(FINALE.counter.date, FINALE.counter.title, "The Conference is voting on your objections. Watch the big screen."), el("ul.list.card", obs.map((o) => el("li", o.soften))));
    local.counter = local.counter || {};
    const cast = D && D.finale && D.finale.votes;
    return el("div.stack",
      phaseHeader(FINALE.counter.date, FINALE.counter.title, FINALE.counter.prompt),
      obs.map((o) => {
        const v = local.counter[o.id] || (cast ? cast[o.id] : null);
        return el("div.card",
          el("div.eyebrow", o.title), el("h3", o.soften), el("p.small.muted", `Currently: ${o.term}`),
          isHead ? el("div.row", { style: { marginTop: "10px" } },
            el("button.opt", { type: "button", style: { width: "auto", flex: 1 }, "aria-pressed": String(v === "grant"), onclick: () => { local.counter[o.id] = "grant"; render(); } }, el("span.opt__label", "Grant it")),
            el("button.opt", { type: "button", style: { width: "auto", flex: 1, marginTop: 0 }, "aria-pressed": String(v === "refuse"), onclick: () => { local.counter[o.id] = "refuse"; render(); } }, el("span.opt__label", "Refuse"))) : null,
        );
      }),
      isHead
        ? el("button.btn.btn--primary.btn--block", { type: "button", onclick: async () => { const votes = {}; for (const o of obs) { const v = local.counter[o.id] || (cast ? cast[o.id] : null); if (v) votes[o.id] = v; } if (await act("finale-vote", { votes })) toast("Votes cast."); } }, cast ? "Update votes" : "Cast votes")
        : el("p.notice", `${memberWith("head") || "Your Head"} casts these votes. Tell them what you think.`),
    );
  }
  if (st.phase === "sign") {
    const blocks = [phaseHeader(FINALE.sign.date, FINALE.sign.title, "The Allies have issued an ultimatum.")];
    blocks.push(el("div.source", el("p.source__text", `“${FINALE.sign.source.text}”`), el("p.source__cite", FINALE.sign.source.cite)));
    const sign = (D && D.finale && D.finale.sign) || {};
    if (del === "de") {
      blocks.push(choiceCard("Germany's decision", FINALE.sign.germany, sign.de, isHead, (id) => act("finale-sign", { choice: id }), `${memberWith("head") || "Your Head"} decides. Talk it through first.`));
    }
    const personas = me().personas || [];
    if (personas.includes("china")) {
      blocks.push(choiceCard("China: sign or refuse?", FINALE.sign.china, sign.china, true, (id) => act("finale-sign", { choice: id, who: "china" })));
    }
    for (const p of personas) {
      const paths = FINALE.sign.paths[p];
      if (paths) blocks.push(choiceCard(`${PERSONAS[p].name}: what next for your movement?`, paths, D && D.finale && D.finale.paths ? D.finale.paths[p] : null, true, (id) => act("finale-path", { persona: p, choice: id })));
    }
    if (blocks.length === 2) blocks.push(el("p.notice", "Germany decides whether to sign. Watch the big screen."));
    return el("div.stack", blocks);
  }
  // ceremony
  return el("div.stack",
    phaseHeader(FINALE.ceremony.date, FINALE.ceremony.title, FINALE.ceremony.text),
    notebookForm("final", FINALE.ceremony.reflect),
    S.showHistory ? historyCard(FINALE.history) : null,
  );
}

function choiceCard(title, options, current, canChoose, send, waiting) {
  return el("div.card.card--navy",
    el("div.eyebrow", title),
    options.map((o) => el("button.opt", { type: "button", "aria-pressed": String(current === o.id), disabled: canChoose ? null : true, onclick: async () => { if (confirm(`${o.label}?`)) { if (await send(o.id)) toast("Decision sent."); } } }, el("span.opt__label", o.label), el("span.opt__detail", o.detail))),
    !canChoose && waiting ? el("p.small.muted", { style: { marginTop: "8px" } }, waiting) : null,
    current ? el("p.small.muted", { style: { marginTop: "8px" } }, "Decided. You can change it until your teacher moves on.") : null,
  );
}

// ------------------------------------------------------------ epilogue
function viewEpilogue(st) {
  const ep = S.epilogue;
  if (!ep) return el("p.muted", "Loading…");
  if (st.phase === "timeline") {
    const ev = ep.events[st.step];
    return el("div.stack", phaseHeader(`Epilogue · ${ev.year}`, ev.title), el("p.lede", ev.text), el("p.small.muted", "Look at the big screen."));
  }
  if (st.phase === "verdict") {
    const sc = D && D.score;
    const ps = D && D.personaScores ? Object.entries(D.personaScores).filter(([, v]) => v) : [];
    return el("div.stack",
      phaseHeader("The verdict", "Was it fair?", "How much of your secret orders did you achieve?"),
      sc ? el("div.card", el("div.eyebrow", delName(myDel())), el("div.bigclock", { style: { fontSize: "4rem" } }, `${sc.pct}%`)) : null,
      ps.map(([p, v]) => el("div.card", el("div.eyebrow", PERSONAS[p].name), el("h3", `${v.pct}%`))),
      el("p", "Does your score feel fair? Was the treaty fair to the parties who scored lowest?"),
    );
  }
  return el("div.stack",
    phaseHeader("Your history and the real one", "What really happened"),
    el("ul.list.card", REAL_TIMELINE.map(([y, t]) => el("li", el("strong", `${y} `), t))),
    el("p.notice", el("strong", "Think: "), "Did the Treaty of Versailles make the Second World War inevitable?"),
  );
}

// ------------------------------------------------------------ essay worksheet
function essayCard() {
  const chosen = local.perspective;
  return el("div.card.card--seal.stack",
    el("div.eyebrow", "Your essay worksheet"),
    el("p", "Choose a perspective. Your worksheet will include your notebook entries, the treaty your conference wrote, an evidence bank, a planner and the rubric."),
    PERSPECTIVES.map((p) => el("button.opt", { type: "button", "aria-pressed": String(chosen === p.id), onclick: () => { local.perspective = p.id; render(); } }, el("span.opt__label", p.title), el("span.opt__detail", p.intro))),
    el("button.btn.btn--primary.btn--block", { type: "button", disabled: chosen ? null : true, onclick: download }, "Download worksheet (.docx)"),
  );
}

function download() {
  const blob = buildWorksheet({ perspectiveId: local.perspective, name: session.name, state: S, me: me(), notebook });
  const safe = session.name.replace(/[^A-Za-z0-9]+/g, "-") || "student";
  downloadBlob(blob, `Versailles-perspective-${safe}.docx`);
}

// ------------------------------------------------------------ boot
if (session && session.key) {
  notebook = storage.get(`ppc.nb.${session.code}.${session.pid}`, {}) || {};
  startPolling();
  // fetch the server copy of the notebook in case this is a new device
  call("join", { code: session.code, name: session.name, claim: true }).then((res) => {
    if (res && res.notebook) {
      notebook = { ...res.notebook, ...notebook };
      saveNotebookLocal();
    }
  }).catch(() => {});
} else {
  renderJoin();
}
