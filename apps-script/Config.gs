/**
 * Lesson Archive System — configuration.
 * Folder/Doc IDs below are placeholders — replace with real Drive IDs before
 * running Phase 2 (see apps-script/README.md, "Build order" in the plan).
 * The Gemini API key is never stored here — see getGeminiApiKey().
 */

var CONFIG = {
  classes: [
    {
      id: 'athens',
      name: '8 Athens',
      grade: 'MYP 3',
      subject: 'langlit',
      subjectEn: 'Language and Literature',
      subjectVi: 'Ngôn ngữ và Văn học',
      inboxId: 'PLACEHOLDER_ATHENS_INBOX_ID',
      reviewId: 'PLACEHOLDER_ATHENS_REVIEW_ID',
      lessonsId: 'PLACEHOLDER_ATHENS_LESSONS_ID',
      archiveId: 'PLACEHOLDER_ATHENS_ARCHIVE_ID',
      archiveDocId: 'PLACEHOLDER_ATHENS_ARCHIVE_DOC_ID'
    },
    {
      id: 'zurich',
      name: '9 Zurich',
      grade: 'MYP 4',
      subject: 'langlit',
      subjectEn: 'Language and Literature',
      subjectVi: 'Ngôn ngữ và Văn học',
      inboxId: 'PLACEHOLDER_ZURICH_INBOX_ID',
      reviewId: 'PLACEHOLDER_ZURICH_REVIEW_ID',
      lessonsId: 'PLACEHOLDER_ZURICH_LESSONS_ID',
      archiveId: 'PLACEHOLDER_ZURICH_ARCHIVE_ID',
      archiveDocId: 'PLACEHOLDER_ZURICH_ARCHIVE_DOC_ID'
    },
    {
      id: 'edmonton',
      name: '10 Edmonton',
      grade: 'MYP 5',
      subject: 'is',
      subjectEn: 'Individuals and Societies',
      subjectVi: 'Cá nhân và Xã hội',
      inboxId: 'PLACEHOLDER_EDMONTON_INBOX_ID',
      reviewId: 'PLACEHOLDER_EDMONTON_REVIEW_ID',
      lessonsId: 'PLACEHOLDER_EDMONTON_LESSONS_ID',
      archiveId: 'PLACEHOLDER_EDMONTON_ARCHIVE_ID',
      archiveDocId: 'PLACEHOLDER_EDMONTON_ARCHIVE_DOC_ID'
    }
  ],

  // Raw audio in _Archive/ older than this is deleted by cleanupAudio().
  audioRetentionDays: 30,

  // Verify this model ID against current Gemini API docs before Phase 2 —
  // model names/availability change. gemini-flash-latest is a placeholder.
  geminiModel: 'gemini-flash-latest',

  // Inline base64 audio above this size uses the Gemini Files API instead
  // of embedding it directly in the generateContent request body.
  inlineAudioLimitBytes: 15 * 1024 * 1024,

  // processInboxes() aborts and retries next hour past this, to stay clear
  // of Apps Script's ~6 minute execution ceiling.
  maxRunMillis: 4 * 60 * 1000,

  geminiMaxAttempts: 3,

  notifyEmail: 'PLACEHOLDER_NOTIFY_EMAIL@example.com',

  // Base URL of the deployed web app (doPost). Set after first deployment —
  // see apps-script/README.md.
  webAppUrl: 'PLACEHOLDER_WEB_APP_URL'
};

var AUDIO_EXTENSIONS = ['m4a', 'mp3', 'wav'];

function getClassConfig(classId) {
  for (var i = 0; i < CONFIG.classes.length; i++) {
    if (CONFIG.classes[i].id === classId) return CONFIG.classes[i];
  }
  return null;
}

/**
 * Gemini API key lives in Script Properties (Project Settings > Script
 * Properties in the Apps Script editor), never in source, so it isn't
 * exposed to anyone who can view this repo or the script's version history.
 */
function getGeminiApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set in Script Properties.');
  }
  return key;
}

function getLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Log');
  if (!sheet) {
    sheet = ss.insertSheet('Log');
    sheet.appendRow(['Timestamp', 'Class', 'Function', 'Status', 'Detail']);
  }
  return sheet;
}
