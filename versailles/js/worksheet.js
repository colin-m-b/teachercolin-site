// Builds the student's essay worksheet (.docx), pre-filled with their own
// conference notebook. Runs entirely on the student's device.

import { Docx } from "./docx.js";
import { ASSESSMENT, PERSPECTIVES, ROUNDS, DELEGATIONS, PERSONAS, JOBS, FINALE } from "./content.js";

const REAL_TERMS = [
  "Article 231 (the “war guilt clause”): Germany accepted responsibility for causing all the loss and damage of the war.",
  "Reparations: set in 1921 at 132 billion gold marks, including Allied war pensions.",
  "Territory: Alsace-Lorraine to France; a corridor to the sea for Poland, splitting East Prussia from Germany; Danzig a Free City; the Saar under the League for 15 years.",
  "Military: army limited to 100,000 men; no tanks, air force or submarines; the Rhineland demilitarized and occupied for 15 years; union with Austria forbidden.",
  "Colonies: Germany's colonies became League of Nations mandates run by Britain, France, Belgium, South Africa, Australia, New Zealand and Japan.",
  "Beyond Europe: Germany's rights in Shandong went to Japan; Japan's racial equality clause was not adopted; the Vietnamese petition was ignored; the Arab lands were divided between Britain and France.",
  "The League of Nations was created, but the United States never joined, and Germany was not admitted until 1926.",
];

export function buildWorksheet({ perspectiveId, name, state, me, notebook }) {
  const per = PERSPECTIVES.find((p) => p.id === perspectiveId) || PERSPECTIVES[0];
  const d = new Docx();

  d.title(ASSESSMENT.title);
  d.p([{ text: ASSESSMENT.subtitle, i: true, color: "555555" }]);
  d.table([
    ["Name", "Class", "Date"],
    [name || "", "10", ""],
  ], { widths: [4360, 2000, 3000] });

  d.h1("Your perspective");
  d.p([{ text: per.title, b: true, size: 13 }]);
  d.p(per.intro);
  d.h2("Questions to consider");
  d.bullets(per.consider);

  d.h1("The task");
  d.p([{ text: "Essential question: ", b: true }, ASSESSMENT.question]);
  d.p(ASSESSMENT.task);
  d.p([{ text: "Length: ", b: true }, ASSESSMENT.length]);
  d.numbers(ASSESSMENT.steps);

  // ------------------------------------------------ notebook
  d.h1("Your conference notebook");
  if (me && me.d) {
    const delName = DELEGATIONS[me.d] ? DELEGATIONS[me.d].name : me.d;
    const personas = (me.personas || []).map((p) => PERSONAS[p].name).join(", ");
    const jobs = (me.jobs || []).map((j) => JOBS[j].label).join(", ");
    d.p([{ text: "In the simulation you represented: ", b: true }, `${delName}${personas ? ` (speaking for ${personas})` : ""}${jobs ? `. Your most recent job: ${jobs}.` : ""}`]);
  }
  d.p([{ text: "Your character is not the person you played in the simulation. Use what you learned at the table as evidence for how the treaty affected people like your character.", i: true, color: "555555" }]);

  const ids = (state && state.roundIds) || [];
  let wrote = false;
  for (const id of ids) {
    const round = ROUNDS.find((r) => r.id === id);
    const entry = (notebook || {})[id];
    const result = state && state.results ? state.results[id] : null;
    if (!round) continue;
    d.h2(`${round.title} (${round.date})`);
    if (result) {
      d.bullets(round.decisions.map((dec) => {
        const opt = dec.options.find((o) => o.id === result.dec[dec.id]);
        return opt ? opt.term : dec.title;
      }));
    }
    if (entry && (entry.want || entry.got || entry.paid || entry.answer)) {
      wrote = true;
      d.table([
        ["", "Your notes"],
        ["What did we want?", entry.want || ""],
        ["What did we get?", entry.got || ""],
        ["Who paid the price?", entry.paid || ""],
        [round.reflect, entry.answer || ""],
      ], { widths: [3000, 6360], header: false });
    } else {
      d.p([{ text: "No notebook entry for this round.", i: true, color: "777777" }]);
    }
  }
  const fin = (notebook || {}).final;
  if (fin && fin.answer) {
    wrote = true;
    d.h2("The Hall of Mirrors");
    d.table([[FINALE.ceremony.reflect, fin.answer]], { widths: [3000, 6360], header: false });
  }
  if (!wrote && !ids.length) d.p("Your notebook is empty. Use the evidence bank below.");

  if (state && state.treaty && state.treaty.length) {
    d.h2("The treaty your conference wrote");
    d.bullets(state.treaty.map((t) => t.term + (t.softened ? ` (softened after German protest: ${t.softened.toLowerCase()})` : "")));
  }

  d.h1("Evidence bank: the real Treaty of Versailles (signed 28 June 1919)");
  d.bullets(REAL_TERMS);

  // ------------------------------------------------ organizer
  d.h1("Plan");
  d.table([
    ["", "Your plan"],
    ["My claim: was the treaty fair to me? Why or why not?", ""],
    ["Evidence 1 (a specific term or event)", ""],
    ["Evidence 2", ""],
    ["Evidence 3", ""],
    ["Someone who would see it differently, and why", ""],
    ["My final judgement", ""],
  ], { widths: [3400, 5960], minHeight: 900 });

  d.h1("Write", { pageBreakBefore: true });
  d.p([{ text: `${per.title}, writing in 1919 or 1920.`, i: true }]);
  d.lines(44);

  // ------------------------------------------------ rubric
  d.h1("Assessment criteria", { pageBreakBefore: true });
  for (const c of ASSESSMENT.criteria) {
    d.h2(c.name);
    d.p([{ text: c.strands, i: true, size: 10, color: "555555" }]);
    d.table([["Level", "Descriptor (task-specific)"], ...c.bands], { widths: [1100, 8260] });
  }
  d.table([["Criterion", "Level (out of 8)", "Comment"], ["A: Knowing and understanding", "", ""], ["C: Communicating", "", ""], ["D: Thinking critically", "", ""]], { widths: [3200, 1800, 4360], minHeight: 600 });

  return d.blob();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
