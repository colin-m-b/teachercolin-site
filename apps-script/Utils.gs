function logEvent(classId, fn, status, detail) {
  try {
    getLogSheet().appendRow([new Date(), classId || '', fn, status, detail || '']);
  } catch (e) {
    // Logging must never break the caller.
  }
}

function notifyError(classId, fn, error) {
  logEvent(classId, fn, 'ERROR', String(error && error.stack || error));
  try {
    MailApp.sendEmail({
      to: CONFIG.notifyEmail,
      subject: 'Lesson Archive error — ' + (classId || 'unknown') + ' / ' + fn,
      body: String(error && error.stack || error)
    });
  } catch (e) {
    // If email itself fails, the Log sheet entry above is the fallback record.
  }
}

/**
 * Runs fn(classConfig) for every configured class, isolating failures so one
 * class erroring never blocks the others (spec 4.6).
 */
function forEachClass(fn) {
  CONFIG.classes.forEach(function(classConfig) {
    try {
      fn(classConfig);
    } catch (error) {
      notifyError(classConfig.id, fn.name || 'forEachClass', error);
    }
  });
}

function isAudioFile(file) {
  var name = file.getName().toLowerCase();
  return AUDIO_EXTENSIONS.some(function(ext) { return name.endsWith('.' + ext); });
}

function listFiles(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var iterator = folder.getFiles();
  var files = [];
  while (iterator.hasNext()) files.push(iterator.next());
  return files;
}

// Drive file property used so a re-run of processInboxes() never re-sends a
// file that already produced a PENDING review doc (spec 4.6, idempotency).
var PROCESSED_MARKER_KEY = 'lessonArchiveProcessed';

function markProcessed(file) {
  file.setProperty ? file.setProperty(PROCESSED_MARKER_KEY, 'true')
    : Drive.Properties.insert({ key: PROCESSED_MARKER_KEY, value: 'true', visibility: 'PRIVATE' }, file.getId());
}

function isProcessed(file) {
  try {
    return file.getProperty ? file.getProperty(PROCESSED_MARKER_KEY) === 'true' : false;
  } catch (e) {
    return false;
  }
}

function formatDateFolderName(dateStr, title) {
  var date = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : Utilities.formatDate(new Date(), CONFIG.timeZone || Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return date + ' — ' + title;
}

function generateApprovalToken(classId, folderName) {
  var token = Utilities.getUuid();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('token:' + token, JSON.stringify({
    classId: classId,
    folderName: folderName,
    createdAt: new Date().toISOString(),
    used: false
  }));
  return token;
}

function consumeApprovalToken(token) {
  var props = PropertiesService.getScriptProperties();
  var key = 'token:' + token;
  var raw = props.getProperty(key);
  if (!raw) return null;
  var data = JSON.parse(raw);
  if (data.used) return null;
  data.used = true;
  props.setProperty(key, JSON.stringify(data));
  return data;
}

function withExponentialBackoff(fn, maxAttempts) {
  var attempts = 0;
  var lastError;
  while (attempts < maxAttempts) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      attempts++;
      if (attempts < maxAttempts) {
        Utilities.sleep(1000 * Math.pow(2, attempts));
      }
    }
  }
  throw lastError;
}
