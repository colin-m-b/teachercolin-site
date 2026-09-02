/**
 * Hourly trigger (spec 4.2). Install via installTriggers() in Triggers.gs.
 */
function processInboxes() {
  var startedAt = Date.now();
  forEachClass(function(classConfig) {
    if (Date.now() - startedAt > CONFIG.maxRunMillis) {
      logEvent(classConfig.id, 'processInboxes', 'SKIPPED', 'Time budget exceeded; will retry next hour.');
      return;
    }
    processInboxForClass(classConfig);
  });
}

function processInboxForClass(classConfig) {
  var allFiles = listFiles(classConfig.inboxId).filter(function(f) { return !isProcessed(f); });
  var audioFiles = allFiles.filter(isAudioFile)
    .sort(function(a, b) { return a.getName().localeCompare(b.getName()); });

  if (audioFiles.length === 0) {
    logEvent(classConfig.id, 'processInboxForClass', 'SKIPPED', 'No new audio in _Inbox.');
    return;
  }

  var nonAudioFiles = allFiles.filter(function(f) { return !isAudioFile(f); });

  var prompt = buildLessonPrompt(classConfig);
  var audioBlobs = audioFiles.map(function(f) { return f.getBlob(); });
  var lessonData = callGeminiForLesson(audioBlobs, prompt, CONFIG.geminiModel);

  if (lessonData.error) {
    logEvent(classConfig.id, 'processInboxForClass', 'GEMINI_ERROR', lessonData.error);
    notifyError(classConfig.id, 'processInboxForClass', 'Gemini could not process the audio: ' + lessonData.error);
    return; // Leave _Inbox untouched; a human needs to look at this recording.
  }

  var folderName = formatDateFolderName(lessonData.date_detected, lessonData.lesson_title || 'Untitled Lesson');
  var reviewDoc = createReviewDoc(classConfig, folderName, lessonData);

  var reviewFolder = DriveApp.getFolderById(classConfig.reviewId);
  nonAudioFiles.forEach(function(f) { f.moveTo(reviewFolder); });
  audioFiles.forEach(function(f) {
    f.moveTo(reviewFolder);
    markProcessed(f);
  });

  var token = generateApprovalToken(classConfig.id, folderName);
  sendApprovalEmail(classConfig, folderName, reviewDoc, nonAudioFiles, token);

  logEvent(classConfig.id, 'processInboxForClass', 'OK',
    folderName + ' — ' + (nonAudioFiles.length + audioFiles.length) + ' files, awaiting approval.');
}

function createReviewDoc(classConfig, folderName, lessonData) {
  var reviewFolder = DriveApp.getFolderById(classConfig.reviewId);
  var doc = DocumentApp.create('PENDING — ' + folderName);
  DriveApp.getFileById(doc.getId()).moveTo(reviewFolder);

  var body = doc.getBody();
  body.appendParagraph(lessonData.lesson_title || folderName).setHeading(DocumentApp.ParagraphHeading.TITLE);

  appendSummarySection(body, 'English Summary', lessonData.summary_en);
  appendSummarySection(body, 'Tóm tắt tiếng Việt', lessonData.summary_vi);

  body.appendPageBreak();
  body.appendParagraph('Teacher Notes (private — never published)').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  appendListSection(body, 'What worked', lessonData.teacher_notes.what_worked);
  appendListSection(body, 'What to change', lessonData.teacher_notes.what_to_change);
  appendListSection(body, 'Students to follow up', lessonData.teacher_notes.students_to_follow_up);

  doc.saveAndClose();
  return doc;
}

function appendSummarySection(body, heading, summary) {
  body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Essential Question').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(summary.essential_question || '');

  body.appendParagraph('Key Terms').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (summary.key_terms || []).forEach(function(kt) {
    body.appendListItem(kt.term + ' — ' + kt.definition).setGlyphType(DocumentApp.GlyphType.BULLET);
  });

  appendListSection(body, 'Main Points', summary.main_points);
  appendListSection(body, 'Examples Used', summary.examples_used);

  body.appendParagraph('Tasks Assigned').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (summary.tasks_assigned || []).forEach(function(t) {
    body.appendListItem(t.task + (t.due ? ' (due ' + t.due + ')' : '')).setGlyphType(DocumentApp.GlyphType.BULLET);
  });
}

function appendListSection(body, heading, items) {
  body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (items || []).forEach(function(item) {
    body.appendListItem(item).setGlyphType(DocumentApp.GlyphType.BULLET);
  });
}

function sendApprovalEmail(classConfig, folderName, reviewDoc, materialFiles, token) {
  var approveUrl = CONFIG.webAppUrl + '?action=approve&token=' + token;
  var discardUrl = CONFIG.webAppUrl + '?action=discard&token=' + token;

  var fileList = materialFiles.length
    ? materialFiles.map(function(f) { return '- ' + f.getName(); }).join('\n')
    : '(no additional materials — slides/materials were not downloaded to _Inbox for this lesson)';

  var body = [
    classConfig.name + ' — ' + folderName,
    '',
    'Review the generated summary here:',
    reviewDoc.getUrl(),
    '',
    'Files about to be published to Lessons/' + folderName + '/:',
    fileList,
    '',
    'APPROVE AND PUBLISH:',
    approveUrl,
    '',
    'Discard (clears _Inbox and _Review without publishing):',
    discardUrl
  ].join('\n');

  MailApp.sendEmail({
    to: CONFIG.notifyEmail,
    subject: '[Review] ' + classConfig.name + ' — ' + folderName,
    body: body
  });
}
