/**
 * Minimal Gemini API client for the lesson-audio-to-JSON call.
 * Endpoints/field names below match the Gemini API as of the plan's
 * writing — re-verify against https://ai.google.dev/gemini-api/docs before
 * Phase 2, per the plan's own caveat on Section 4.1.
 */

var GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';

/**
 * @param {Blob[]} audioBlobs one or more audio segments, in playback order
 *   (spec 4.2 step 2: multiple files in one _Inbox are segments of one lesson)
 * @param {string} prompt
 * @param {string} model
 * @returns {Object} parsed JSON response matching the schema in Prompts.gs,
 *   or { error: '...' } if Gemini reported the audio as unusable.
 */
function callGeminiForLesson(audioBlobs, prompt, model) {
  return withExponentialBackoff(function() {
    var audioParts = audioBlobs.map(function(audioBlob) {
      return audioBlob.getBytes().length <= CONFIG.inlineAudioLimitBytes
        ? { inline_data: { mime_type: audioBlob.getContentType(), data: Utilities.base64Encode(audioBlob.getBytes()) } }
        : { file_data: { mime_type: audioBlob.getContentType(), file_uri: uploadAudioToGeminiFilesApi(audioBlob) } };
    });

    var requestBody = {
      contents: [{ parts: [{ text: prompt }].concat(audioParts) }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    var response = UrlFetchApp.fetch(
      GEMINI_BASE_URL + '/v1beta/models/' + model + ':generateContent?key=' + getGeminiApiKey(),
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      }
    );

    var code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('Gemini API error ' + code + ': ' + response.getContentText());
    }

    var body = JSON.parse(response.getContentText());
    var text = body.candidates && body.candidates[0] && body.candidates[0].content
      && body.candidates[0].content.parts && body.candidates[0].content.parts[0]
      && body.candidates[0].content.parts[0].text;

    if (!text) {
      throw new Error('Gemini response had no text part: ' + response.getContentText());
    }

    return JSON.parse(text);
  }, CONFIG.geminiMaxAttempts);
}

/**
 * Resumable upload to the Gemini Files API, for audio over
 * CONFIG.inlineAudioLimitBytes. Returns the uploaded file's URI.
 */
function uploadAudioToGeminiFilesApi(audioBlob) {
  var apiKey = getGeminiApiKey();
  var startResponse = UrlFetchApp.fetch(
    GEMINI_BASE_URL + '/upload/v1beta/files?key=' + apiKey,
    {
      method: 'post',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(audioBlob.getBytes().length),
        'X-Goog-Upload-Header-Content-Type': audioBlob.getContentType()
      },
      contentType: 'application/json',
      payload: JSON.stringify({ file: { display_name: audioBlob.getName() } }),
      muteHttpExceptions: true
    }
  );

  var uploadUrl = startResponse.getHeaders()['x-goog-upload-url'] || startResponse.getHeaders()['X-Goog-Upload-URL'];
  if (!uploadUrl) {
    throw new Error('Gemini Files API did not return an upload URL: ' + startResponse.getContentText());
  }

  var uploadResponse = UrlFetchApp.fetch(uploadUrl, {
    method: 'post',
    headers: {
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    payload: audioBlob,
    muteHttpExceptions: true
  });

  var fileInfo = JSON.parse(uploadResponse.getContentText());
  if (!fileInfo.file || !fileInfo.file.uri) {
    throw new Error('Gemini Files API upload failed: ' + uploadResponse.getContentText());
  }
  return fileInfo.file.uri;
}
