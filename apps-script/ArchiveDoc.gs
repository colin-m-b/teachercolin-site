/**
 * Appends one lesson entry to the top of a class's Archive Doc (spec
 * Section 7). The Archive Doc itself is published once, manually, via
 * File > Share > Publish to web in the Docs UI (a one-time step per class —
 * see apps-script/README.md) — after that it auto-updates on every append,
 * no republish needed.
 */
function appendToArchiveDoc(classConfig, folderName, pendingDoc, lessonFolder) {
  var archiveDoc = DocumentApp.openById(classConfig.archiveDocId);
  var archiveBody = archiveDoc.getBody();
  var pendingBody = DocumentApp.openById(pendingDoc.getId()).getBody();

  var parts = folderName.split(' — ');
  var dateStr = parts[0];
  var title = parts.slice(1).join(' — ');
  var displayDate = Utilities.formatDate(new Date(dateStr + 'T00:00:00'), Session.getScriptTimeZone(), 'd MMMM yyyy');

  var insertAt = 0;
  archiveBody.insertParagraph(insertAt++, '── ' + displayDate + ' ──────────────')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  archiveBody.insertParagraph(insertAt++, title)
    .setHeading(DocumentApp.ParagraphHeading.TITLE);

  var numChildren = pendingBody.getNumChildren();
  for (var i = 1; i < numChildren; i++) { // skip index 0: the lesson_title TITLE, already re-added above
    var child = pendingBody.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH &&
        child.asParagraph().getText().indexOf('Teacher Notes') === 0) {
      break; // never copy teacher notes into the parent-facing archive
    }
    insertAt = insertCopiedElement(archiveBody, insertAt, child) ? insertAt + 1 : insertAt;
  }

  var linksPara = archiveBody.insertParagraph(insertAt++, '');
  var slidesUrl = findFileUrlInFolder(lessonFolder, 'Slides.pdf');
  if (slidesUrl) linksPara.appendText('📄 Slides (PDF)').setLinkUrl(slidesUrl);
  var materialsFolders = lessonFolder.getFoldersByName('Materials');
  if (materialsFolders.hasNext()) {
    if (slidesUrl) linksPara.appendText('  |  ');
    linksPara.appendText('📁 Materials').setLinkUrl(materialsFolders.next().getUrl());
  }

  archiveBody.insertHorizontalRule(insertAt);
  archiveDoc.saveAndClose();
}

function insertCopiedElement(body, index, element) {
  var type = element.getType();
  if (type === DocumentApp.ElementType.PARAGRAPH) {
    body.insertParagraph(index, element.copy());
    return true;
  }
  if (type === DocumentApp.ElementType.LIST_ITEM) {
    body.insertListItem(index, element.copy());
    return true;
  }
  return false;
}

function findFileUrlInFolder(folder, name) {
  var files = folder.getFilesByName(name);
  return files.hasNext() ? files.next().getUrl() : null;
}
