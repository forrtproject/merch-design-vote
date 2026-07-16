/**
 * Reusable vote-collection endpoint for FORRT design-voting (and similar) apps.
 *
 * ONE general workbook, MANY campaigns: every campaign writes to its own sheet/tab,
 * named by the `project` field in each request. Reuse this same deployment for future
 * projects — just send a different `project`.
 *
 * Setup (see DEPLOY.md):
 *   1. Create/choose a Google Sheet (the general workbook).
 *   2. Extensions ▸ Apps Script, paste this file.
 *   3. Project Settings ▸ Script Properties ▸ add  SPREADSHEET_ID = <the sheet's id>.
 *      (Or bind the script to the sheet and it will use the active spreadsheet.)
 *   4. Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Who has access: Anyone.
 *      Authorise when prompted. Copy the /exec URL into the app's config.js.
 *
 * Requests use text/plain bodies (a "simple" CORS request → no preflight), so the
 * GitHub Pages app can POST cross-origin without extra CORS headers.
 */

var HEADERS = ['timestamp', 'project', 'itemId', 'vote', 'note', 'voter', 'session', 'userAgent'];

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheetFor_(ss, project) {
  var name = (project || 'default').toString().substring(0, 90).replace(/[\\\/\?\*\[\]:]/g, '_');
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
    var ss = getSpreadsheet_();
    var sh = sheetFor_(ss, body.project);
    sh.appendRow([
      new Date(),
      body.project || '',
      body.itemId || '',
      body.vote || '',
      body.note || '',
      body.voter || '',
      body.session || '',
      (e && e.parameter && e.parameter.ua) || body.userAgent || ''
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  if (action === 'ping') return json_({ ok: true, service: 'forrt-vote', ts: new Date() });
  if (action === 'tally') {
    var project = e.parameter.project;
    if (!project) return json_({ ok: false, error: 'project required' });
    var ss = getSpreadsheet_();
    var sh = ss.getSheetByName(project);
    if (!sh) return json_({ ok: true, project: project, tally: {} });
    var rows = sh.getDataRange().getValues();
    var tally = {};
    for (var i = 1; i < rows.length; i++) {
      var item = rows[i][2], vote = rows[i][3];
      if (!item) continue;
      tally[item] = tally[item] || { keep: 0, discard: 0, love: 0 };
      if (tally[item][vote] !== undefined) tally[item][vote]++;
    }
    return json_({ ok: true, project: project, tally: tally });
  }
  return json_({ ok: false, error: 'unknown action' });
}
