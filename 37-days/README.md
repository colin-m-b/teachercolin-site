# 37 Days: the July Crisis simulation

A six-round live classroom simulation (28 June – 4 August 1914) with a follow-up archive lesson.
The plan is the Claude Doc "July 1914 Simulation — Build & Test Plan".

## Pages (all under `/37-days/`)

| Page | Who | What |
| --- | --- | --- |
| `index.html` | Teacher | Create a game (needs the teacher code), reopen recent games, backups |
| `teacher.html#g=…&k=…` | Teacher, on a phone | One button per step, team status, overrides, undo, export, printables. **Never on the projector.** |
| `projector.html#g=…` | Classroom screen | Date, timer, decided lights, public telegrams, ending, map, scores, vote charts. No secrets. |
| `play.html#g=…&t=…&r=…&k=…` | Each student | Opened from the QR code on a role card |
| `print.html#doc=…` | Teacher | `cards` (QR role cards), `slips`, `runsheet`, `exit`, `record` |
| `offline.html` | Teacher | Wi-fi backup: the engine runs in the browser; choices typed in from paper slips |

## Setup on Netlify (once)

1. Site settings → Environment variables: add `JULY1914_TEACHER_CODE` (any passphrase). The live site
   refuses to create games until it is set.
2. Netlify installs `@netlify/blobs` from `package.json` and builds `netlify/functions/july1914.mjs`
   (served at `/api/july1914`). Nothing else to configure.
3. Pre-flight check after deploy: `https://teachercolin.com/netlify/july1914/briefings.mjs` must return 404.

## How it is built

- `engine/scenario.js`, `engine/engine.js`, `engine/content.js` are the tested prototype (version 9), **unchanged**.
  The server, the offline mode and the tests all run these same files.
- `engine/extras.js`: public content (round intros, glossary with Vietnamese, practice round, roles).
- `engine/menu-variants.json`: the 52 menu variants with slip codes. Regenerate after any `scenario.js`
  change: `node tests/july1914/make-variants.mjs`.
- `netlify/july1914/`: **server only**. `api.mjs` (game logic around the engine), `briefings.mjs`
  (72 role briefings), `teacher.mjs` (teacher notes, real-1914 evidence packet). Blocked from static
  serving in `netlify.toml`.
- Storage: Netlify Blobs, strong consistency, one store per deploy context (`july1914-production`,
  `july1914-deploy-preview`, …). Only teacher actions write the game state; each role writes only its own keys.

## Tests

```bash
node tests/july1914/api.test.mjs
```

```bash
node tests/july1914/e2e.mjs
```

```bash
cd tests/july1914/prototype && node test.js
```

`api.test.mjs`: content limits, secrets, a 14-device session, undo, overrides, late and wrong-team
submissions, absent teams, import, load. `e2e.mjs`: the full two-lesson flow in Chromium with 13 phones,
the projector, printables, offline mode with the network off, and a network drop.
`node tests/july1914/dev-server.mjs` runs the whole thing locally on port 8888.

## Draft content still to sign off (plan: content checkpoint)

Briefings, teacher notes, evidence packet, round intros and the Vietnamese glossary are drafts:
facts to be checked against two sources, and glosses checked by a fluent speaker.
