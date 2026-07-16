// Campaign config for the FORRT design vote.
// After deploying the Apps Script web app (see apps_script/DEPLOY.md), paste its /exec URL
// into ENDPOINT below and commit. Until then the app runs in local mode (votes saved in the
// browser and downloadable as CSV).
window.FORRT_VOTE_CONFIG = {
  ENDPOINT: "",                       // e.g. "https://script.google.com/macros/s/AKfy.../exec"
  PROJECT: "forrt-merch-2026",        // the sheet/tab name this campaign writes to
  TITLE: "Help pick FORRT merch",
  SUBTITLE: "Swipe through the designs — keep the ones you'd wear or gift.",
  GOAL: 250                            // shown in progress; actual count comes from manifest
};
