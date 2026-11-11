// Game rules for The Paris Peace Conference, 1919.
// Pure functions over the teacher's host state. The teacher's browser is the
// only place these run; students only ever see the projections at the bottom.

import {
  DELEGATIONS, PERSONAS, ROUNDS, FINALE, EPILOGUE, METERS, PRESETS, PRESS_LINES,
  GERMAN_STANCES, score1933, warRisk,
} from "./content.js";

export const COUNCIL = ["fr", "gb", "us", "it"];
const PRIORITY = ["va", "de", "fr", "gb", "us", "jp", "cn", "it"];

export const roundById = (id) => ROUNDS.find((r) => r.id === id);

// ------------------------------------------------------------ setup
export function newHost(preset) {
  const p = PRESETS[preset] || PRESETS.standard;
  return {
    preset: preset in PRESETS ? preset : "standard",
    roundIds: p.rounds.slice(),
    negotiateMin: p.negotiateMin,
    players: {},
    delegations: [],
    vaPersonas: [],
    italyNPC: true,
    lesson: 1,
    rotation: 0,
    seq: 0,
    overlay: null, // "recap" | "cliff" | null
    timer: { endsAt: null, remaining: p.negotiateMin * 60, running: false },
    cursor: "",
    rounds: {},
    notes: [],
    wire: [],
    objections: [],
    finale: { chosen: [], delivery: null, votes: {}, results: null, sign: {}, paths: {} },
    showHistory: false,
    reflected: {},
    started: false,
  };
}

export function configFor(n) {
  if (n >= 21) return { delegations: ["fr", "gb", "us", "it", "de", "jp", "cn", "va"], vaPersonas: ["vietnam", "africa", "arab"], italyNPC: false };
  if (n >= 15) return { delegations: ["fr", "gb", "us", "it", "de", "jp", "va"], vaPersonas: ["china", "vietnam", "africa"], italyNPC: false };
  return { delegations: ["fr", "gb", "us", "de", "jp", "va"], vaPersonas: ["china", "vietnam", "africa"], italyNPC: true };
}

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function activePlayers(h) {
  return Object.entries(h.players).filter(([, p]) => !p.removed);
}

// Randomly assign every joined student to a delegation.
export function assignAll(h) {
  const ids = activePlayers(h).map(([pid]) => pid);
  const cfg = configFor(ids.length);
  h.delegations = cfg.delegations;
  h.vaPersonas = cfg.vaPersonas;
  h.italyNPC = cfg.italyNPC;
  const k = cfg.delegations.length;
  const base = Math.floor(ids.length / k);
  let extra = ids.length % k;
  const sizes = {};
  for (const d of cfg.delegations) sizes[d] = base;
  for (const d of PRIORITY) {
    if (extra <= 0) break;
    if (sizes[d] !== undefined) {
      sizes[d]++;
      extra--;
    }
  }
  const shuffled = shuffle(ids);
  let i = 0;
  for (const d of cfg.delegations) {
    for (let s = 0; s < sizes[d]; s++) h.players[shuffled[i++]].d = d;
  }
  refreshRoles(h);
}

export function placeLateJoiner(h, pid) {
  if (!h.delegations.length) return;
  const counts = Object.fromEntries(h.delegations.map((d) => [d, 0]));
  for (const [, p] of activePlayers(h)) if (p.d && counts[p.d] !== undefined) counts[p.d]++;
  const order = PRIORITY.filter((d) => counts[d] !== undefined);
  const smallest = order.reduce((best, d) => (counts[d] < counts[best] ? d : best), order[0]);
  h.players[pid].d = smallest;
  refreshRoles(h);
}

export function membersOf(h, del) {
  return activePlayers(h)
    .filter(([, p]) => p.d === del)
    .sort((a, b) => (a[1].joinOrder || 0) - (b[1].joinOrder || 0))
    .map(([pid]) => pid);
}

const JOB_SPLITS = {
  1: [["head", "envoy", "intel", "press"]],
  2: [["head", "press"], ["envoy", "intel"]],
  3: [["head"], ["envoy"], ["intel", "press"]],
  4: [["head"], ["envoy"], ["intel"], ["press"]],
};

// Jobs rotate each lesson; personas inside Voices of Asia & Africa stay put.
export function refreshRoles(h) {
  for (const del of h.delegations) {
    const members = membersOf(h, del);
    const n = members.length;
    const split = JOB_SPLITS[Math.min(n, 4)] || [];
    members.forEach((pid, i) => {
      const p = h.players[pid];
      const slot = (i + h.rotation) % n;
      p.jobs = slot < split.length ? split[slot].slice() : ["envoy"];
      p.personas = [];
    });
    if (del === "va") {
      // Every persona gets a speaker; spare members double up on a persona.
      for (let j = 0; n && j < Math.max(n, h.vaPersonas.length); j++) {
        const persona = h.vaPersonas[j % h.vaPersonas.length];
        const p = h.players[members[j % n]];
        if (!p.personas.includes(persona)) p.personas.push(persona);
      }
    }
    if (del === "cn") members.forEach((pid) => (h.players[pid].personas = ["china"]));
  }
  for (const [, p] of activePlayers(h)) if (!p.d) { p.jobs = []; p.personas = []; }
}

// Which persona ids a delegation speaks for.
export function personasOf(h, del) {
  if (del === "va") return h.vaPersonas.slice();
  if (del === "cn") return ["china"];
  return [];
}

// Goal-holders: delegation id for great powers, persona ids for the voices.
function holders(h, del) {
  const ps = personasOf(h, del);
  return ps.length ? ps : [del];
}

// ------------------------------------------------------------ sequence
export function sequence(h) {
  const seq = [{ kind: "lobby" }];
  h.roundIds.forEach((id, r) => {
    for (const phase of ["brief", "negotiate", "vote", "reveal", "reflect"]) seq.push({ kind: "round", r, id, phase });
  });
  for (const phase of ["terms", "counter", "sign", "ceremony"]) seq.push({ kind: "finale", phase });
  EPILOGUE.forEach((_, step) => seq.push({ kind: "epilogue", phase: "timeline", step }));
  seq.push({ kind: "epilogue", phase: "verdict" });
  seq.push({ kind: "epilogue", phase: "history" });
  if (h.preset === "extended") seq.push({ kind: "debrief" });
  seq.push({ kind: "write" });
  return seq;
}

export function stageOf(h) {
  const seq = sequence(h);
  return seq[Math.min(h.seq, seq.length - 1)];
}

export function roundState(h, id) {
  if (!h.rounds[id]) h.rounds[id] = { recs: {}, votes: {}, unanimity: false, threats: {}, actions: {}, statements: {}, germany: null, result: null };
  return h.rounds[id];
}

// ------------------------------------------------------------ voters
export function votersFor(h, decision) {
  if (decision.body === "council") return COUNCIL.filter((d) => h.delegations.includes(d) || (d === "it" && h.italyNPC));
  const list = h.delegations.filter((d) => d !== "de");
  if (h.italyNPC && !list.includes("it")) list.push("it");
  return list;
}

export function delegationVotesOn(h, del, decision) {
  if (del === "de") return false;
  if (decision.body === "council") return COUNCIL.includes(del);
  return true;
}

// Threats and actions a delegation may use this round.
export function leversFor(h, del, round) {
  const mine = (lever) => {
    if (lever.who === "persona") return personasOf(h, del).some((p) => lever.persona.includes(p));
    return lever.who === del;
  };
  return {
    threats: round.threats.filter((t) => mine(t) && !(t.npcAuto && h.italyNPC)),
    actions: (round.actions || []).filter(mine),
  };
}

// ------------------------------------------------------------ resolving a round
function tally(options, votes) {
  const counts = Object.fromEntries(options.map((o) => [o.id, 0]));
  for (const v of Object.values(votes)) if (counts[v] !== undefined) counts[v]++;
  return counts;
}

function winner(decision, counts) {
  const top = Math.max(...Object.values(counts));
  if (top === 0) return { option: decision.compromise, deadlock: true };
  const tied = Object.keys(counts).filter((k) => counts[k] === top);
  if (tied.length === 1) return { option: tied[0], deadlock: false };
  return { option: decision.compromise, deadlock: true };
}

export function addFx(target, fx) {
  for (const [k, v] of Object.entries(fx || {})) target[k] = (target[k] || 0) + v;
}

export function resolveRound(h, id) {
  const round = roundById(id);
  const rs = roundState(h, id);
  const out = { dec: {}, votes: {}, counts: {}, deadlock: {}, ruled: false, threatsMet: [], threatsUnmet: [], flags: [], fx: {}, lines: [], scores: {} };

  for (const decision of round.decisions) {
    const voters = votersFor(h, decision);
    const votes = {};
    for (const d of voters) {
      if (d === "it" && h.italyNPC) votes.it = decision.npc.it;
      else if (rs.votes[d] && rs.votes[d][decision.id]) votes[d] = rs.votes[d][decision.id];
    }
    const counts = tally(decision.options, votes);
    let { option, deadlock } = winner(decision, counts);
    if (decision.unanimity && option === "include" && rs.unanimity) {
      const allYes = voters.every((d) => votes[d] === "include");
      if (!allYes) {
        option = "reject";
        out.ruled = true;
        out.lines.push("The chair ruled that such an important change needed unanimous support. Because not every delegation voted for it, the clause failed.");
      }
    }
    out.dec[decision.id] = option;
    out.votes[decision.id] = votes;
    out.counts[decision.id] = counts;
    out.deadlock[decision.id] = deadlock;
    if (deadlock) out.lines.push(`No majority on ${decision.title.toLowerCase()}: the Conference fell back on the compromise.`);
    addFx(out.fx, decision.options.find((o) => o.id === option).fx);
  }

  // threats
  const declared = Object.entries(rs.threats).map(([del, tid]) => ({ del, threat: round.threats.find((t) => t.id === tid) }));
  if (h.italyNPC) {
    const auto = round.threats.find((t) => t.npcAuto);
    if (auto) declared.push({ del: "it", threat: auto });
  }
  for (const { del, threat } of declared) {
    if (!threat) continue;
    const ok = threat.demand.options.includes(out.dec[threat.demand.decision]);
    const res = ok ? threat.met : threat.unmet;
    (ok ? out.threatsMet : out.threatsUnmet).push(threat.id);
    addFx(out.fx, res.fx);
    if (res.flag) out.flags.push(res.flag);
    out.scores[del] = (out.scores[del] || 0) + (res.score || 0);
    out.lines.push(res.text);
  }
  // actions
  for (const [del, aids] of Object.entries(rs.actions)) {
    for (const aid of aids) {
      const a = (round.actions || []).find((x) => x.id === aid);
      if (!a) continue;
      addFx(out.fx, a.fx);
      out.lines.push(a.text);
      void del;
    }
  }
  // Germany
  if (rs.germany) {
    const st = GERMAN_STANCES.find((s) => s.id === rs.germany.stance);
    if (st) addFx(out.fx, st.fx);
    if (rs.germany.stance === "fulfil") out.scores.de = (out.scores.de || 0) + 1;
  }
  rs.result = out;
  return out;
}

// Outcome object for goal scoring.
function outcomeOf(res) {
  return { dec: res.dec, votes: res.votes, threatsMet: res.threatsMet, threatsUnmet: res.threatsUnmet };
}

// ------------------------------------------------------------ objections & finale
export function objectionCandidates(h) {
  const list = [];
  for (const id of h.roundIds) {
    const res = h.rounds[id] && h.rounds[id].result;
    if (!res) continue;
    for (const decision of roundById(id).decisions) {
      if (!decision.soften || !decision.soften.from.includes(res.dec[decision.id])) continue;
      list.push({ id: decision.id, round: id, title: decision.title, term: decision.options.find((o) => o.id === res.dec[decision.id]).term, soften: decision.soften.label });
    }
  }
  return list;
}

export function decisionById(id) {
  for (const r of ROUNDS) for (const d of r.decisions) if (d.id === id) return d;
  return null;
}

export function finaleObjections(h) {
  const cands = objectionCandidates(h).map((c) => c.id);
  let chosen = (h.finale.chosen || []).filter((id) => cands.includes(id));
  if (!chosen.length) chosen = h.objections.filter((id) => cands.includes(id));
  if (!chosen.length) chosen = cands;
  return [...new Set(chosen)].slice(0, 3);
}

export function resolveCounter(h) {
  const results = {};
  const voters = h.delegations.filter((d) => d !== "de");
  if (h.italyNPC) voters.push("it");
  for (const id of finaleObjections(h)) {
    let grant = 0;
    let refuse = 0;
    for (const d of voters) {
      const v = d === "it" && h.italyNPC ? "refuse" : (h.finale.votes[d] || {})[id];
      if (v === "grant") grant++;
      else if (v === "refuse") refuse++;
    }
    results[id] = { granted: grant > refuse, grant, refuse };
  }
  h.finale.results = results;
  return results;
}

// ------------------------------------------------------------ meters, scores
export function meters(h) {
  const m = Object.fromEntries(Object.entries(METERS).map(([k, v]) => [k, v.start]));
  const flags = {};
  for (const id of h.roundIds) {
    const res = h.rounds[id] && h.rounds[id].result;
    if (!res) continue;
    for (const [k, v] of Object.entries(res.fx)) m[k] += v;
    res.flags.forEach((f) => (flags[f] = true));
  }
  const fin = h.finale;
  if (fin.delivery) {
    const opt = FINALE.terms.deliveryOptions.find((o) => o.id === fin.delivery);
    if (opt) addFx(m, opt.fx);
  }
  if (fin.results) {
    for (const [id, r] of Object.entries(fin.results)) if (r.granted) addFx(m, decisionById(id).soften.fx);
  }
  if (fin.sign.de === "refuse") {
    flags.forcedSign = true;
    m.resentment += 12;
  }
  if (fin.sign.china === "refuse" || flags.chinaRefuses) flags.chinaRefused = true;
  for (const k of Object.keys(m)) m[k] = Math.max(0, Math.min(100, Math.round(m[k])));
  return { m, flags };
}

export function epilogueContext(h) {
  const { m, flags } = meters(h);
  const dec = {};
  for (const id of h.roundIds) {
    const res = h.rounds[id] && h.rounds[id].result;
    if (res) Object.assign(dec, res.dec);
  }
  return { m, flags, dec, paths: h.finale.paths || {}, delivery: h.finale.delivery };
}

export function epilogueEvents(h) {
  const ctx = epilogueContext(h);
  return EPILOGUE.map((e) => ({ year: e.year, title: e.title(ctx), text: e.text(ctx), danger: !!e.danger(ctx) }));
}

export function scores(h) {
  const out = {};
  const add = (key, got, max) => {
    if (!out[key]) out[key] = { got: 0, max: 0 };
    out[key].got += got;
    out[key].max += max;
  };
  for (const del of h.delegations) {
    for (const id of h.roundIds) {
      const res = h.rounds[id] && h.rounds[id].result;
      if (!res) continue;
      const round = roundById(id);
      const o = outcomeOf(res);
      for (const holder of holders(h, del)) {
        for (const goal of round.goals[holder] || []) {
          const got = goal.score(o, del);
          add(del, got, goal.max);
          if (holder !== del) add(holder, got, goal.max);
        }
      }
      if (res.scores[del]) add(del, res.scores[del], 0);
    }
  }
  // finale
  const fin = h.finale;
  if (fin.results) {
    for (const r of Object.values(fin.results)) {
      if (h.delegations.includes("de")) add("de", r.granted ? 2 : 0, 2);
      if (r.granted && h.delegations.includes("fr")) add("fr", -1, 0);
    }
  }
  if (fin.sign.de && h.delegations.includes("de")) add("de", fin.sign.de === "sign" ? 2 : 0, 2);
  const result = {};
  for (const [k, v] of Object.entries(out)) {
    result[k] = { ...v, pct: v.max ? Math.max(0, Math.min(100, Math.round((100 * v.got) / v.max))) : 0 };
  }
  return result;
}

export function moodWords(h) {
  const { m } = meters(h);
  const word = (v, words) => words[Math.min(words.length - 1, Math.floor(v / (101 / words.length)))];
  return [
    { place: "Berlin", word: word(m.resentment, ["Resigned", "Bitter", "Angry", "Furious"]) },
    { place: "Paris", word: word(m.security, ["Afraid", "Uneasy", "Reassured", "Confident"]) },
    { place: "Tokyo & Beijing", word: word(m.asia, ["Calm", "Tense", "Hostile", "Explosive"]) },
    { place: "The colonies", word: word(m.awakening, ["Hopeful", "Restless", "Stirring", "Rising"]) },
    { place: "Rome", word: word(m.italy, ["Content", "Grumbling", "Resentful", "Seething"]) },
  ];
}

// ------------------------------------------------------------ the treaty you wrote
export function treatySummary(h) {
  const lines = [];
  for (const id of h.roundIds) {
    const res = h.rounds[id] && h.rounds[id].result;
    if (!res) continue;
    for (const decision of roundById(id).decisions) {
      const opt = decision.options.find((o) => o.id === res.dec[decision.id]);
      const softened = h.finale.results && h.finale.results[decision.id] && h.finale.results[decision.id].granted;
      lines.push({ id: decision.id, title: decision.title, term: opt.term, historical: decision.historical === opt.id, softened: softened ? decision.soften.label : null });
    }
  }
  return lines;
}

// ------------------------------------------------------------ folding student actions
export function canAct(h, pid) {
  const p = h.players[pid];
  return p && !p.removed && p.d;
}

function pushWire(h, entry) {
  h.wire.push({ t: Date.now(), ...entry });
  if (h.wire.length > 60) h.wire.splice(0, h.wire.length - 60);
}

export function applyAction(h, a) {
  const stage = stageOf(h);
  if (a.type === "join") {
    if (!h.players[a.pid]) {
      h.players[a.pid] = { name: a.data.name, d: null, jobs: [], personas: [], joinOrder: Object.keys(h.players).length };
      if (h.started) placeLateJoiner(h, a.pid);
    } else if (h.players[a.pid].removed) {
      h.players[a.pid].removed = false;
      if (h.started) placeLateJoiner(h, a.pid);
    }
    return true;
  }
  if (!canAct(h, a.pid)) return false;
  const p = h.players[a.pid];
  const del = p.d;
  const data = a.data || {};

  if (a.type === "note") {
    if (!h.delegations.includes(data.to) || data.to === del) return false;
    h.notes.push({
      id: `${a.t}-${a.pid}`, t: a.t, from: del, to: data.to, by: p.name,
      type: data.type, text: String(data.text || "").slice(0, 400), replyTo: data.replyTo || null, reply: data.reply || null,
    });
    if (h.notes.length > 400) h.notes.splice(0, h.notes.length - 400);
    return true;
  }
  if (a.type === "reflected") {
    h.reflected[a.pid] = h.reflected[a.pid] || {};
    h.reflected[a.pid][data.key] = true;
    return true;
  }

  if (stage.kind === "round" && data.round === stage.id) {
    const round = roundById(stage.id);
    const rs = roundState(h, stage.id);
    const open = stage.phase === "negotiate" || stage.phase === "vote";
    if (a.type === "rec" && (open || stage.phase === "brief")) {
      rs.recs[del] = rs.recs[del] || {};
      rs.recs[del][data.decision] = rs.recs[del][data.decision] || {};
      rs.recs[del][data.decision][p.name] = data.option;
      return true;
    }
    if (a.type === "vote" && open) {
      const clean = {};
      for (const decision of round.decisions) {
        if (!delegationVotesOn(h, del, decision)) continue;
        const v = (data.votes || {})[decision.id];
        if (decision.options.some((o) => o.id === v)) clean[decision.id] = v;
      }
      rs.votes[del] = clean;
      if (del === "us" && round.decisions.some((d) => d.unanimity)) rs.unanimity = !!data.unanimity;
      return true;
    }
    if (a.type === "threat" && open && !rs.threats[del]) {
      const lever = leversFor(h, del, round).threats.find((t) => t.id === data.id);
      if (!lever) return false;
      rs.threats[del] = lever.id;
      pushWire(h, { kind: "threat", del, text: lever.announce });
      return true;
    }
    if (a.type === "action" && open) {
      const lever = leversFor(h, del, round).actions.find((t) => t.id === data.id);
      rs.actions[del] = rs.actions[del] || [];
      if (!lever || rs.actions[del].includes(lever.id)) return false;
      rs.actions[del].push(lever.id);
      pushWire(h, { kind: "action", del, text: lever.announce });
      return true;
    }
    if (a.type === "statement" && open && !rs.statements[del] && PRESS_LINES[del] && PRESS_LINES[del][data.tone]) {
      rs.statements[del] = data.tone;
      pushWire(h, { kind: "press", del, text: PRESS_LINES[del][data.tone] });
      return true;
    }
    if (a.type === "germany" && del === "de" && open) {
      const decisions = round.decisions.filter((d) => d.soften).map((d) => d.id);
      rs.germany = { objection: decisions.includes(data.objection) ? data.objection : null, stance: GERMAN_STANCES.some((s) => s.id === data.stance) ? data.stance : "protest" };
      h.objections = h.objections.filter((x) => !decisions.includes(x));
      if (rs.germany.objection) h.objections.push(rs.germany.objection);
      return true;
    }
    return false;
  }

  if (stage.kind === "finale") {
    if (a.type === "finale-objections" && del === "de" && stage.phase === "terms") {
      const cands = objectionCandidates(h).map((c) => c.id);
      h.finale.chosen = (data.list || []).filter((id) => cands.includes(id)).slice(0, 3);
      if (FINALE.terms.deliveryOptions.some((o) => o.id === data.delivery)) h.finale.delivery = data.delivery;
      return true;
    }
    if (a.type === "finale-vote" && del !== "de" && stage.phase === "counter") {
      const clean = {};
      for (const id of finaleObjections(h)) if (["grant", "refuse"].includes((data.votes || {})[id])) clean[id] = data.votes[id];
      h.finale.votes[del] = clean;
      return true;
    }
    if (a.type === "finale-sign" && stage.phase === "sign") {
      if (del === "de" && ["sign", "refuse"].includes(data.choice)) h.finale.sign.de = data.choice;
      if (personasOf(h, del).includes("china") && data.who === "china" && ["sign", "refuse"].includes(data.choice)) h.finale.sign.china = data.choice;
      return true;
    }
    if (a.type === "finale-path" && stage.phase === "sign") {
      const paths = FINALE.sign.paths[data.persona];
      if (personasOf(h, del).includes(data.persona) && paths && paths.some((x) => x.id === data.choice)) {
        h.finale.paths[data.persona] = data.choice;
        return true;
      }
    }
  }
  return false;
}

// Called whenever the teacher moves to a new step.
export function onEnter(h) {
  const stage = stageOf(h);
  if (stage.kind === "round" && stage.phase === "negotiate") {
    const rs = roundState(h, stage.id);
    if (!rs.timerSet) {
      h.timer = { endsAt: Date.now() + h.negotiateMin * 60000, remaining: h.negotiateMin * 60, running: true };
      rs.timerSet = true;
    }
    if (h.italyNPC) {
      const auto = roundById(stage.id).threats.find((t) => t.npcAuto);
      if (auto && !rs.npcAnnounced) {
        rs.npcAnnounced = true;
        pushWire(h, { kind: "threat", del: "it", text: auto.announce });
      }
    }
  }
  if (stage.kind === "round" && stage.phase === "reveal") resolveRound(h, stage.id);
  if (stage.kind === "finale" && stage.phase === "sign") resolveCounter(h);
  if (stage.kind === "round" && stage.phase === "brief") h.showHistory = false;
  if (stage.kind === "finale" && stage.phase === "terms") h.showHistory = false;
}

// ------------------------------------------------------------ projections
export function publicState(h) {
  const stage = stageOf(h);
  const players = {};
  for (const [pid, p] of activePlayers(h)) players[pid] = { name: p.name, d: p.d, jobs: p.jobs, personas: p.personas };
  const pub = {
    preset: h.preset,
    roundIds: h.roundIds,
    lesson: h.lesson,
    players,
    delegations: h.delegations,
    vaPersonas: h.vaPersonas,
    italyNPC: h.italyNPC,
    seq: h.seq,
    stage,
    overlay: h.overlay,
    timer: h.timer,
    wire: h.wire.slice(-25),
    noteCount: h.notes.length,
    showHistory: h.showHistory,
    results: {},
    status: {},
  };
  for (const id of h.roundIds) {
    const rs = h.rounds[id];
    if (rs && rs.result) {
      const done = h.roundIds.indexOf(id) < (stage.kind === "round" ? stage.r : 99) || (stage.kind === "round" && stage.id === id && ["reveal", "reflect"].includes(stage.phase));
      if (done) pub.results[id] = { dec: rs.result.dec, votes: rs.result.votes, counts: rs.result.counts, lines: rs.result.lines, ruled: rs.result.ruled };
    }
  }
  if (stage.kind === "round") {
    const rs = roundState(h, stage.id);
    pub.status = {
      votes: Object.keys(rs.votes),
      statements: Object.keys(rs.statements),
      germany: !!rs.germany,
      reflected: Object.entries(h.reflected).filter(([, r]) => r[stage.id]).map(([pid]) => pid),
    };
  }
  if (["reveal", "reflect"].includes(stage.phase) || stage.kind === "finale") pub.moods = moodWords(h);
  if (stage.kind === "finale" || stage.kind === "epilogue" || stage.kind === "debrief" || stage.kind === "write") {
    pub.treaty = treatySummary(h);
    pub.objections = finaleObjections(h).map((id) => {
      const c = objectionCandidates(h).find((x) => x.id === id);
      return c;
    }).filter(Boolean);
    pub.finale = {
      chosen: h.finale.chosen,
      delivery: h.finale.delivery,
      voted: Object.keys(h.finale.votes),
      results: stage.phase === "counter" ? null : h.finale.results,
      sign: stage.phase === "sign" ? { de: !!h.finale.sign.de, china: !!h.finale.sign.china } : h.finale.sign,
      paths: stage.phase === "sign" ? Object.keys(h.finale.paths) : h.finale.paths,
    };
    if (stage.phase === "ceremony" || stage.kind !== "finale") pub.finale.signFull = h.finale.sign;
  }
  if (stage.kind === "epilogue" || stage.kind === "debrief" || stage.kind === "write") {
    const ctx = epilogueContext(h);
    pub.epilogue = { events: epilogueEvents(h), meters: ctx.m, risk1933: score1933(ctx), war: warRisk(ctx), scores: scores(h) };
  }
  if (h.overlay === "recap") pub.recap = recap(h);
  return pub;
}

export function recap(h) {
  const items = [];
  for (const id of h.roundIds) {
    const res = h.rounds[id] && h.rounds[id].result;
    if (!res) continue;
    const round = roundById(id);
    items.push({
      title: round.title,
      terms: round.decisions.map((d) => d.options.find((o) => o.id === res.dec[d.id]).term),
      lines: res.lines.slice(0, 3),
    });
  }
  return items;
}

export function delegationDoc(h, del) {
  const stage = stageOf(h);
  const doc = { del, members: membersOf(h, del).map((pid) => ({ pid, name: h.players[pid].name, jobs: h.players[pid].jobs, personas: h.players[pid].personas })) };
  doc.notes = h.notes.filter((n) => n.from === del || n.to === del).slice(-80);
  if (stage.kind === "round") {
    const rs = roundState(h, stage.id);
    doc.round = stage.id;
    doc.recs = rs.recs[del] || {};
    doc.votes = rs.votes[del] || null;
    doc.unanimity = del === "us" ? rs.unanimity : false;
    doc.threat = rs.threats[del] || null;
    doc.actions = rs.actions[del] || [];
    doc.statement = rs.statements[del] || null;
    doc.germany = del === "de" ? rs.germany : null;
  }
  if (stage.kind === "finale") {
    doc.finale = {
      chosen: del === "de" ? h.finale.chosen : undefined,
      delivery: del === "de" ? h.finale.delivery : undefined,
      votes: h.finale.votes[del] || null,
      sign: h.finale.sign,
      paths: h.finale.paths,
    };
    if (del === "de") doc.candidates = objectionCandidates(h);
  }
  if (stage.kind === "epilogue" || stage.kind === "write" || stage.kind === "debrief") {
    const sc = scores(h);
    doc.score = sc[del] || null;
    doc.personaScores = Object.fromEntries(personasOf(h, del).map((p) => [p, sc[p] || null]));
  }
  return doc;
}

export const ALL = { DELEGATIONS, PERSONAS };
