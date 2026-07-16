(() => {
  const CFG = window.FORRT_VOTE_CONFIG || {};
  const PROJECT = CFG.PROJECT || "default";
  const K_VOTER = "forrt_voter";
  const K_VOTES = `forrt_votes_${PROJECT}`;
  const K_OUT = `forrt_outbox_${PROJECT}`;
  const $ = (s) => document.querySelector(s);

  // ---- identity + storage ----
  function voterId() {
    let v = localStorage.getItem(K_VOTER);
    if (!v) { v = "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(K_VOTER, v); }
    return v;
  }
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const SESSION = "s-" + Math.random().toString(36).slice(2);

  let items = [], votes = load(K_VOTES, {}), queue = [], i = 0;

  // ---- networking (best-effort; outbox retries) ----
  function post(payload) {
    if (!CFG.ENDPOINT) return;
    fetch(CFG.ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload), keepalive: true })
      .then((r) => r.ok || Promise.reject()).catch(() => {
        const out = load(K_OUT, []); out.push(payload); save(K_OUT, out);
      });
  }
  function flushOutbox() {
    if (!CFG.ENDPOINT) return;
    let out = load(K_OUT, []); if (!out.length) return;
    save(K_OUT, []);
    out.forEach(post);
  }

  // ---- flow ----
  function shuffle(a) { for (let j = a.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [a[j], a[k]] = [a[k], a[j]]; } return a; }

  function begin() {
    queue = shuffle(items.filter((x) => !votes[x.slug]));
    i = 0; render();
  }

  function record(vote) {
    const x = queue[i]; if (!x) return;
    const note = ($("#note")?.value || "").trim();
    votes[x.slug] = { vote, note }; save(K_VOTES, votes);
    post({ project: PROJECT, itemId: x.slug, vote, note, voter: voterId(), session: SESSION,
           title: x.title, ts: new Date().toISOString() });
    i++; render();
  }
  function undo() {
    if (i === 0) return;
    i--; const x = queue[i]; delete votes[x.slug]; save(K_VOTES, votes);
    post({ project: PROJECT, itemId: x.slug, vote: "undo", note: "", voter: voterId(), session: SESSION,
           title: x.title, ts: new Date().toISOString() });
    render();
  }

  function counts() {
    const c = { keep: 0, love: 0, discard: 0 };
    Object.values(votes).forEach((v) => { if (c[v.vote] !== undefined) c[v.vote]++; });
    return c;
  }

  function render() {
    const total = items.length, rated = Object.keys(votes).length, c = counts();
    $("#count").textContent = `${rated}/${total} · ♥${c.love} ✓${c.keep}`;
    $("#barfill").style.width = `${(rated / total) * 100}%`;
    const app = $("#app");
    if (i >= queue.length) { renderDone(app, c); return; }
    const x = queue[i];
    const prods = x.best_products || [];
    const prodLine = prods.length ? `Shown on <b>${prods[0]}</b>${prods.length > 1 ? " · also suits " + prods.slice(1).join(", ") : ""}` : "";
    app.innerHTML = `
      <div class="wrap">
        <div class="card"><img alt="${x.title}" src="img/${x.slug}.webp"
          onerror="this.onerror=null;this.src='img/${x.slug}.png'"></div>
        <div class="meta">
          <div class="t">${x.title}</div>
          <div class="row"><span class="chip">${x.category || ""}</span><span class="prod">${prodLine}</span></div>
        </div>
        <textarea id="note" class="note" placeholder="Optional note — 'great as a sticker', 'text too small', 'love the jellyfish'…"></textarea>
        <div class="btns">
          <button class="undo" id="b-undo">↑ Undo</button>
          <button class="no" id="b-no">✕ Pass</button>
          <button class="keep" id="b-keep">✓ Keep</button>
          <button class="love" id="b-love">♥ Love</button>
        </div>
        <div class="hint">Judge the artwork, not the shirt colour or product — those will vary.<br>← Pass&nbsp;&nbsp;→ Keep&nbsp;&nbsp;↑ Undo&nbsp;&nbsp;L Love · your picks save on this device</div>
      </div>`;
    $("#b-undo").onclick = undo; $("#b-no").onclick = () => record("discard");
    $("#b-keep").onclick = () => record("keep"); $("#b-love").onclick = () => record("love");
  }

  function renderDone(app, c) {
    const kept = items.filter((x) => ["keep", "love"].includes(votes[x.slug]?.vote));
    app.innerHTML = `
      <div class="wrap done">
        <div class="big">🎉</div>
        <h2>All ${items.length} rated — thank you!</h2>
        <p>You loved <b>${c.love}</b> and kept <b>${c.keep}</b>.${CFG.ENDPOINT ? " Your votes were submitted." : ""}</p>
        <div>
          <button id="csv" class="ghost">Download my picks (CSV)</button>
          <button id="again" class="ghost">Review / change answers</button>
        </div>
        <div class="gal">${kept.map((x) => `<figure><img src="img/${x.slug}.webp" onerror="this.src='img/${x.slug}.png'"><figcaption>${votes[x.slug].vote === "love" ? "♥ " : ""}${x.title}</figcaption></figure>`).join("")}</div>
      </div>`;
    $("#csv").onclick = downloadCsv;
    $("#again").onclick = () => { votes = {}; save(K_VOTES, votes); begin(); };
  }

  function downloadCsv() {
    const rows = [["slug", "title", "category", "vote", "note"]];
    items.forEach((x) => { const v = votes[x.slug]; if (v) rows.push([x.slug, x.title, x.category || "", v.vote, v.note || ""]); });
    const csv = rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${PROJECT}-mypicks.csv`; a.click();
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowRight") record("keep");
    else if (e.key === "ArrowLeft") record("discard");
    else if (e.key === "ArrowUp") undo();
    else if (e.key.toLowerCase() === "l") record("love");
  });

  // ---- boot ----
  $("#title").textContent = CFG.TITLE || "Design vote";
  $("#subtitle").textContent = CFG.SUBTITLE || "";
  if (!CFG.ENDPOINT) $("#banner").style.display = "block";
  flushOutbox();
  fetch("manifest.json").then((r) => r.json()).then((data) => {
    items = data.map((c) => ({ slug: c.slug, title: c.title, category: c.category,
      best_products: c.best_products, exact_text: c.exact_text }));
    begin();
  }).catch(() => { $("#app").innerHTML = '<div class="wrap done"><h2>Could not load designs.</h2></div>'; });
})();
