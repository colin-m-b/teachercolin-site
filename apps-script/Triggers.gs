/**
 * Run this once manually from the Apps Script editor after deploying, to
 * install the time-based triggers. Safe to re-run — it clears and
 * reinstalls this project's triggers first, so it never double-fires.
 */
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('processInboxes').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('cleanupAudio').timeBased().everyDays(1).atHour(3).create();
  ScriptApp.newTrigger('remindStalePending').timeBased().everyDays(1).atHour(8).create();

  logEvent('', 'installTriggers', 'OK', 'Triggers installed.');
}
