# July 1914 crisis simulation: tested game-logic prototype (version 9)

Plain Node.js, no dependencies. The plan itself is in the Claude Doc "37 Days" plan.

- scenario.js: powers, six rounds (menus + resolvers), endings, scoring, secret objectives
- engine.js: state machine (newGame, menu, play, finish, visibleTo)
- content.js: draft event, ending and modifier texts
- test.js: 68 automated checks (`node test.js`; env N, REL, K, SG tune run sizes)
- strategic.js: look-ahead "strategic player" model used by the tests
- diag.js, decisionmap.js: diagnostics; decisionmap.js writes decision_map.md
- final_run.txt: last full test run (67/68 pass)

Status: plan stage. An independent review was stopped before it finished. Open items:
7 of 36 decisions have low stakes, and cautious classes keep the peace about 67% of the time.
Next step: build the classroom site (Netlify Functions + Blobs with strong consistency).
