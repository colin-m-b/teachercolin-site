/**
 * Approval webhook (spec 4.3). Deploy as a web app ("execute as me",
 * "anyone with the link") — see apps-script/README.md.
 *
 * Requires the advanced "Drive API" service enabled in this Apps Script
 * project (Services > Drive API), used only for convert-on-upload when
 * turning PPTX/DOCX into Google-native files ahead of PDF export.
 */
function doPost(e) {
  var action = e.parameter.action;
  var token = e.parameter.token;
  var tokenData = consumeApprovalToken(token);

  if (!tokenData) {
    return ContentService.createTextOutput('This link has already been used or is invalid.');
  }

  var classConfig = getClassConfig(tokenData.classId);
  if (!classConfig) {
    return ContentService.createTextOutput('Unknown class for this link.');
  }

  try {
    if (action === 'discard') {
      discardReview(classConfig, tokenData.folderName);
      return ContentService.createTextOutput('Discarded ' + tokenData.folderName + '. Nothing was published.');
    }
    if (action === 'approve') {
      publishLesson(classConfig, tokenData.folderName);
      return ContentService.createTextOutput('Published ' + tokenData.folderName + ' to ' + classConfig.name + ' Lessons.');
    }
    return ContentService.createTextOutput('Unknown action.');
  } catch (error) {
    notifyError(classConfig.id, 'doPost', error);
    return ContentService.createTextOutput('Something went wrong publishing this lesson — Colin has been notified.');
  }
}

function discardReview(classConfig, folderName) {
  var reviewFolder = DriveApp.getFolderById(classConfig.reviewId);
  var files = listFiles(classConfig.reviewId);
  files.forEach(function(f) { f.setTrashed(true); });
  logEvent(classConfig.id, 'discardReview', 'OK', folderName);
  MailApp.sendEmail({
    to: CONFIG.notifyEmail,
    subject: '[Discarded] ' + classConfig.name + ' — ' + folderName,
    body: 'Discarded — nothing was published.'
  });
}

function publishLesson(classConfig, folderName) {
  var reviewFiles = listFiles(classConfig.reviewId);
  var pendingDoc = reviewFiles.find(function(f) { return f.getName().indexOf('PENDING —') === 0; });
  if (!pendingDoc) throw new Error('No PENDING review doc found for ' + folderName);

  var lessonsRoot = DriveApp.getFolderById(classConfig.lessonsId);
  var lessonFolder = lessonsRoot.createFolder(folderName);
  var archiveFolder = DriveApp.getFolderById(classConfig.archiveId);
  var materialsFolder = null;

  reviewFiles.forEach(function(f) {
    if (f.getId() === pendingDoc.getId()) return;
    var mime = f.getMimeType();
    if (mime === MimeType.MICROSOFT_POWERPOINT || mime === MimeType.MICROSOFT_WORD ||
        f.getName().match(/\.(pptx|docx)$/i)) {
      var pdf = convertOfficeFileToPdf(f, lessonFolder);
      var isSlides = /\.pptx$/i.test(f.getName()) || mime === MimeType.MICROSOFT_POWERPOINT;
      pdf.setName(isSlides ? 'Slides.pdf' : f.getName().replace(/\.(pptx|docx)$/i, '.pdf'));
      f.moveTo(archiveFolder);
    } else if (isAudioFile(f)) {
      f.moveTo(archiveFolder);
    } else {
      if (!materialsFolder) materialsFolder = lessonFolder.createFolder('Materials');
      f.moveTo(materialsFolder);
    }
  });

  var summaryPdf = createSummaryPdf(pendingDoc, lessonFolder);
  appendToArchiveDoc(classConfig, folderName, pendingDoc, lessonFolder);

  pendingDoc.setName(pendingDoc.getName().replace('PENDING —', 'Teacher Notes —'));
  pendingDoc.moveTo(archiveFolder);

  logEvent(classConfig.id, 'publishLesson', 'OK', folderName);
  MailApp.sendEmail({
    to: CONFIG.notifyEmail,
    subject: '[Published] ' + classConfig.name + ' — ' + folderName,
    body: 'Published to: ' + lessonFolder.getUrl() + '\nSummary: ' + summaryPdf.getUrl()
  });
}

function convertOfficeFileToPdf(officeFile, destFolder) {
  var isSlides = /\.pptx$/i.test(officeFile.getName());
  var resource = {
    title: officeFile.getName().replace(/\.(pptx|docx)$/i, ''),
    mimeType: isSlides ? MimeType.GOOGLE_SLIDES : MimeType.GOOGLE_DOCS,
    parents: [{ id: destFolder.getId() }]
  };
  var converted = Drive.Files.insert(resource, officeFile.getBlob(), { convert: true });
  var convertedFile = DriveApp.getFileById(converted.id);
  var pdfBlob = convertedFile.getAs(MimeType.PDF);
  var pdfFile = destFolder.createFile(pdfBlob);
  convertedFile.setTrashed(true); // keep only the PDF in Lessons/; source stays in _Archive
  return pdfFile;
}

/**
 * Strips the "Teacher Notes" section from the review Doc (everything from
 * the page break onward — see createReviewDoc in ProcessInboxes.gs) and
 * exports the remaining parent-facing summary as Summary.pdf.
 */
function createSummaryPdf(pendingDoc, destFolder) {
  var copy = DriveApp.getFileById(pendingDoc.getId()).makeCopy('tmp-summary-export', destFolder);
  var copyDoc = DocumentApp.openById(copy.getId());
  var body = copyDoc.getBody();

  var teacherHeadingIndex = -1;
  for (var i = 0; i < body.getNumChildren(); i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH &&
        child.asParagraph().getText().indexOf('Teacher Notes') === 0) {
      teacherHeadingIndex = i;
      break;
    }
  }
  if (teacherHeadingIndex >= 0) {
    for (var j = body.getNumChildren() - 1; j >= teacherHeadingIndex; j--) {
      body.removeChild(body.getChild(j));
    }
  }
  copyDoc.saveAndClose();

  var pdfBlob = DriveApp.getFileById(copy.getId()).getAs(MimeType.PDF);
  var pdfFile = destFolder.createFile(pdfBlob);
  pdfFile.setName('Summary.pdf');
  DriveApp.getFileById(copy.getId()).setTrashed(true);
  return pdfFile;
}
