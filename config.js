// Campaign config for the FORRT design vote.
// After deploying the Apps Script web app (see apps_script/DEPLOY.md), paste its /exec URL
// into ENDPOINT below and commit. Until then the app runs in local mode (votes saved in the
// browser and downloadable as CSV).
window.FORRT_VOTE_CONFIG = {
  ENDPOINT: "https://script.google.com/macros/s/AKfycbyx858xfSCgHQ8RmbfbMsdzcmzrkNs_JZVmqeEBVrH-S6g8YJbI32CY7if-k8oTzg-eyQ/exec",
  PROJECT: "forrt-merch-2026",        // the sheet/tab name this campaign writes to
  TITLE: "Help pick FORRT merch",
  SUBTITLE: "No need to get through all of them — rate as many or as few as you like, and stop whenever. Every vote counts. Judge the artwork itself; the shirt colour and product are just a preview and will vary.",
  GOAL: 250                            // shown in progress; actual count comes from manifest
};
