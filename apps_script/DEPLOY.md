# Deploy the vote-collection endpoint (Google Apps Script)

This is a **reusable** endpoint: one Google Sheet (the general workbook) collects votes for many
campaigns, each in its own tab named by the `project` field. For this campaign the tab is
`forrt-merch-2026` (see `../config.js`). Future projects just send a different `project` and get
their own tab automatically — no redeploy needed.

## One-time setup (~5 minutes)

1. **Create the workbook.** In Google Drive, create a new Google Sheet, e.g.
   **"FORRT Design Votes (all campaigns)"**. Copy its ID from the URL
   (`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`).

2. **Add the script.** In that sheet: **Extensions ▸ Apps Script**. Delete the placeholder,
   paste the contents of **`Code.gs`**, and save.

3. **Point it at the workbook.** In the Apps Script editor: **Project Settings** (gear icon) ▸
   **Script properties** ▸ **Add script property**:
   `SPREADSHEET_ID` = the ID from step 1.
   *(If you added the script from inside the sheet it will also work without this, but setting it
   is more robust.)*

4. **Deploy as a web app.** **Deploy ▸ New deployment ▸** select type **Web app**. Set:
   - **Description:** FORRT vote endpoint
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
   Click **Deploy**, then **Authorize access** and grant permission (this is the auth step —
   Google will warn it's an unverified app you built; continue).

5. **Copy the Web app URL** (ends in `/exec`) and paste it into **`../config.js`** as `ENDPOINT`,
   then commit. Done.

## Test it

- Health check (open in a browser): `<your /exec URL>?action=ping` → `{"ok":true,...}`
- Live tally for this campaign: `<your /exec URL>?action=tally&project=forrt-merch-2026`
- Each vote appends a row to the `forrt-merch-2026` tab with:
  `timestamp, project, itemId, vote, note, voter, session, userAgent`.

## Notes
- Votes are sent as `text/plain` POSTs (a "simple" CORS request) so the GitHub Pages site can
  reach the script cross-origin without extra setup.
- If you ever change the code, **create a new deployment version** (or "Manage deployments ▸ Edit
  ▸ Version: New") for it to take effect. The `/exec` URL stays the same if you edit the existing
  deployment.
- Re-deploying is not needed to add a new campaign — just send a new `project` value.
