# The Paris Peace Conference, 1919

A classroom simulation of the Treaty of Versailles for MYP Individuals and Societies (Grade 10).

- **Students:** teachercolin.com/versailles. They type a four-letter code and their first name.
- **Teacher:** teachercolin.com/versailles/teacher.html, opened on the projector computer.

## Files

| File | What it holds |
|---|---|
| `js/content.js` | All historical content: delegations, personas, rounds, options, goals, threats, intelligence, epilogue, perspectives, rubric. Fix a fact here. |
| `js/engine.js` | The rules: assignment, voting, threats, scoring, meters, the epilogue, and what each student may see. |
| `js/teacher.js` | The teacher console and projector. This browser tab runs the game. |
| `js/play.js` | The student device view. |
| `js/worksheet.js`, `js/docx.js` | The essay worksheet, built as a .docx on the student's device. |
| `../netlify/functions/versailles/` | The only server code on the site: a small authenticated mailbox in front of Netlify Blobs. |

## How it works

The teacher's browser is the single authority. Students send small actions (a vote, a note, a threat) to `/api/versailles`. The teacher's tab collects them every 2.5 seconds, applies the rules, and publishes a public state plus one private document per delegation. Students check for updates every 2.5 seconds.

Storage is one Netlify Blobs store, `versailles`. Each conference is deleted 7 days after it was created; the cleanup runs whenever a new conference is opened. Students give a first name only.

## Class sizes

| Students | Delegations |
|---|---|
| 6–14 | France, Britain, United States, Germany, Japan, Voices of Asia & Africa (China, Vietnam, Africa). Italy is played by the game. |
| 15–20 | Adds Italy as a player |
| 21–32 | China becomes its own delegation; the Arab delegation joins the Voices |

## Testing locally

Install the dependency with `npm install`, then run `netlify dev` from the repository root.
