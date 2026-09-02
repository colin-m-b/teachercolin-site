/**
 * Daily trigger (spec 4.5): deletes raw audio in _Archive/ older than
 * CONFIG.audioRetentionDays.
 */
function cleanupAudio() {
  forEachClass(function(classConfig) {
    var cutoff = new Date(Date.now() - CONFIG.audioRetentionDays * 24 * 60 * 60 * 1000);
    var deleted = 0;
    listFiles(classConfig.archiveId).forEach(function(f) {
      if (isAudioFile(f) && f.getDateCreated() < cutoff) {
        f.setTrashed(true);
        deleted++;
      }
    });
    if (deleted > 0) logEvent(classConfig.id, 'cleanupAudio', 'OK', deleted + ' audio file(s) deleted.');
  });
}

/**
 * Daily trigger (spec 4.3): reminds Colin about PENDING reviews older than
 * 7 days that nobody has approved or discarded.
 */
function remindStalePending() {
  forEachClass(function(classConfig) {
    var cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    var stale = listFiles(classConfig.reviewId).filter(function(f) {
      return f.getName().indexOf('PENDING —') === 0 && f.getDateCreated() < cutoff;
    });
    stale.forEach(function(f) {
      MailApp.sendEmail({
        to: CONFIG.notifyEmail,
        subject: '[Reminder] Unreviewed lesson — ' + classConfig.name + ' — ' + f.getName(),
        body: 'This review has been waiting over 7 days: ' + f.getUrl()
      });
    });
  });
}
