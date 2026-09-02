# Lesson Archive — Apps Script source

Source for the Section 4-5 pipeline from the Lesson Archive implementation
plan. This is **not** deployed from this repo — Apps Script has no native
git integration, so these files are the source of truth to paste into (or
`clasp push` to) the actual Apps Script project. Nothing here runs until you
do that.

## One-time setup

1. **Create the Sheet + bound script.** In Drive, create a new Google Sheet
   (this becomes the config/log sheet), then Extensions → Apps Script. This
   gives you a bound Apps Script project.
2. **Push this source.** Either paste each `.gs` file's contents into a
   matching file in the Apps Script editor, or use
   [`clasp`](https://github.com/google/clasp):
   ```
   npm install -g @google/clasp
   clasp login
   clasp create --type sheets --title "Lesson Archive" --parentId <SHEET_ID>
   # then copy these files into the created project directory and:
   clasp push
   ```
3. **Enable the advanced Drive API service** (used only for PPTX/DOCX →
   Google-format conversion in `Approval.gs`): in the Apps Script editor,
   Services (+) → Drive API → Add.
4. **Set the Gemini API key.** Project Settings → Script Properties → add
   `GEMINI_API_KEY`. Never put the key in source — `Config.gs` reads it via
   `PropertiesService` at call time.
5. **Fill in real Drive IDs.** Replace every `PLACEHOLDER_*` in `Config.gs`
   with the real folder/Doc IDs from Section 3 of the plan, once those
   folders exist (Phase 1 of the build order).
6. **Deploy the web app.** Deploy → New deployment → type "Web app",
   execute as "Me", access "Anyone with the link". Copy the resulting URL
   into `CONFIG.webAppUrl` in `Config.gs` and re-push/re-save — the
   approval email links depend on it.
7. **Install triggers.** Run `installTriggers` once from the editor (it
   will prompt for the OAuth scopes in `appsscript.json` — accept them).
8. **Publish each class's Archive Doc.** In the actual Google Doc for each
   class (the one whose ID is `archiveDocId`), File → Share → Publish to
   web. This is a one-time step per class; after that the published URL
   auto-updates on every append — no republish, ever. That published URL is
   what the website's "Lesson Archive" button should point to.

## What's implemented vs. what the plan flags as needing tuning

- `Config.gs` / `Prompts.gs` / `GeminiClient.gs` / `ProcessInboxes.gs` cover
  Section 4.2 + Section 5 in full, including the `langlit` vs `is` prompt
  variants.
- `Approval.gs` / `ArchiveDoc.gs` cover Section 4.3 (the `doPost` approval
  webhook, PDF conversion, publishing, and the archive append).
- `Cleanup.gs` covers 4.5 (audio retention) and the 4.3 stale-PENDING
  reminder.
- **Not automatable, and intentionally left to you:** the plan's own
  Section 8 build order — do not skip straight to Phase 5. Run Phase 2
  ("No publishing yet") against 3-5 real recordings first and tune
  `LANGLIT_FRAMING` / `IS_FRAMING` in `Prompts.gs` until the summaries need
  no edits, per Section 9's decisions (recording consent/school policy,
  and Trang's one-time review of the Vietnamese output) before turning on
  approval and publishing.
- Verify `CONFIG.geminiModel` and the Files API upload flow in
  `GeminiClient.gs` against the current Gemini API docs before Phase 2 —
  model names and endpoint details do change (the plan flags this too).
