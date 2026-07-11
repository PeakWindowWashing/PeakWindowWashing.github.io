// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Scroll-scrubbed hero (image sequence on canvas) ----
// The hero clip lives as pre-extracted JPEG frames in /frames. Scroll
// position through the pinned hero track maps to a frame index; an easing
// loop glides the shown frame toward the target so the wipe feels fluid.
(function () {
  const track = document.getElementById("heroTrack");
  const hero = document.getElementById("hero");
  const canvas = document.getElementById("heroCanvas");
  const hint = document.getElementById("heroHint");
  if (!track || !hero || !canvas) return;

  const ctx = canvas.getContext("2d");
  const FRAME_COUNT = 60;
  const framePath = (i) => "frames/frame_" + String(i).padStart(3, "0") + ".jpg?v=2";

  const frames = [];
  let targetP = 0, currentP = 0, looping = false, lastIdx = -1, sized = false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function draw(idx) {
    let i = Math.min(FRAME_COUNT - 1, Math.max(0, idx));
    while (i >= 0 && !(frames[i] && frames[i].complete && frames[i].naturalWidth)) i--;
    if (i < 0 || i === lastIdx) return;
    lastIdx = i;
    ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height);
  }

  function readTarget() {
    const r = track.getBoundingClientRect();
    // Use nearly the whole pinned distance so the wipe finishes right as the
    // hero unpins — the page then scrolls into the content as the clip ends,
    // instead of holding on a dead final frame.
    const span = Math.max(1, (track.offsetHeight - innerHeight) * 0.97);
    targetP = Math.min(1, Math.max(0, -r.top / span));
  }

  function render() {
    if (hint) hero.classList.toggle("washed", currentP > 0.03);
    draw(Math.round(currentP * (FRAME_COUNT - 1)));
  }

  function loop() {
    // Lower easing = silkier, more cinematic glide (the frame floats toward
    // the scroll target instead of snapping to it).
    currentP += (targetP - currentP) * 0.09;
    if (Math.abs(targetP - currentP) < 0.0006) { currentP = targetP; render(); looping = false; return; }
    render();
    requestAnimationFrame(loop);
  }
  function ensureLoop() { if (!looping) { looping = true; requestAnimationFrame(loop); } }

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.src = framePath(i);
    frames[i] = img;
    // Wait for the frame to be fully DECODED (not just downloaded) before
    // drawing. Drawing an undecoded image inside onload can paint blank on
    // first load — that's why the hero used to appear only after a scroll.
    const onReady = () => {
      if (!sized && img.naturalWidth) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        sized = true;
        lastIdx = -1;            // canvas resize clears it — force a redraw
      }
      render();
    };
    if (img.decode) {
      img.decode().then(onReady).catch(() => { img.onload = onReady; });
    } else {
      img.onload = onReady;
    }
  }

  if (reduce) { currentP = targetP = 1; render(); return; }

  addEventListener("scroll", () => { readTarget(); ensureLoop(); }, { passive: true });
  addEventListener("resize", () => { readTarget(); ensureLoop(); });
  readTarget();
  currentP = targetP;
  render();
})();

// ---- Scroll reveal ----
(function () {
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = Math.min(i, 6) * 85 + "ms";
    });
  });

  const targets = document.querySelectorAll("[data-reveal]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
  targets.forEach((el) => io.observe(el));
})();

// ---- Before / After sliders ----
window.baSliderInit = function (slider) {
    const handle = slider.querySelector(".ba-handle");
    if (!handle) return;
    const tag = slider.querySelector(".ba-tag");
    let dragging = false;

    function updateTag(pct) {
      if (tag) tag.textContent = pct >= 50 ? "Before" : "After";
    }
    updateTag(parseFloat(getComputedStyle(slider).getPropertyValue("--pos")) || 50);

    function setPos(clientX) {
      const rect = slider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      slider.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", Math.round(pct));
      updateTag(pct);
    }

    slider.addEventListener("pointerdown", (e) => {
      dragging = true;
      slider.classList.add("is-dragging");
      slider.setPointerCapture(e.pointerId);
      setPos(e.clientX);
    });
    slider.addEventListener("pointermove", (e) => {
      if (dragging) setPos(e.clientX);
    });
    const stop = () => { dragging = false; slider.classList.remove("is-dragging"); };
    slider.addEventListener("pointerup", stop);
    slider.addEventListener("pointercancel", stop);

    handle.addEventListener("keydown", (e) => {
      const cur = parseFloat(getComputedStyle(slider).getPropertyValue("--pos")) || 50;
      if (e.key === "ArrowLeft") { const v = Math.max(0, cur - 4); slider.style.setProperty("--pos", v + "%"); handle.setAttribute("aria-valuenow", Math.round(v)); updateTag(v); e.preventDefault(); }
      if (e.key === "ArrowRight") { const v = Math.min(100, cur + 4); slider.style.setProperty("--pos", v + "%"); handle.setAttribute("aria-valuenow", Math.round(v)); updateTag(v); e.preventDefault(); }
    });
};
document.querySelectorAll(".ba-slider").forEach(window.baSliderInit);

// ---- Before / After carousel (infinite filmstrip) ----
(function () {
  const carousel = document.querySelector(".ba-carousel");
  if (!carousel) return;
  const viewport = carousel.querySelector(".ba-viewport");
  const track = carousel.querySelector(".ba-track");
  const real = Array.from(track.querySelectorAll(".ba-slide"));
  const dots = Array.from(carousel.querySelectorAll(".ba-dot"));
  const prev = carousel.querySelector(".ba-prev");
  const next = carousel.querySelector(".ba-next");
  const n = real.length;
  if (!n) return;

  // Clone the last slide onto the front and the first onto the back,
  // so there is always a photo peeking on BOTH sides and the loop
  // wraps around seamlessly.
  const firstClone = real[0].cloneNode(true);
  const lastClone = real[n - 1].cloneNode(true);
  [firstClone, lastClone].forEach((c) => {
    c.classList.remove("is-active");
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll(".ba-slider").forEach(window.baSliderInit);
  });
  track.appendChild(firstClone);
  track.insertBefore(lastClone, real[0]);

  const all = Array.from(track.children); // [cloneLast, real..., cloneFirst]
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let v = 1;                              // virtual position, starts on first real slide
  let animating = false;
  let settleTimer = null;

  const realIdx = (vi) => (vi - 1 + n) % n;

  function center(vi, animate) {
    const s = all[vi];
    if (!s) return;
    if (!animate) track.style.transition = "none";
    const offset = s.offsetLeft + s.offsetWidth / 2 - viewport.clientWidth / 2;
    track.style.transform = "translateX(" + -offset + "px)";
    if (!animate) { void track.offsetWidth; track.style.transition = ""; }
  }

  function paint() {
    all.forEach((s, i) => s.classList.toggle("is-active", i === v));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === realIdx(v)));
  }

  // Once a slide transition ends on a cloned edge, silently snap to its real
  // twin. Idempotent + timer-safe so it can be called at any moment (on the
  // real transitionend, as a fallback, or before starting the next move)
  // without ever leaving the position out of sync.
  function settle() {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    animating = false;
    if (v === 0) v = n;
    else if (v === n + 1) v = 1;
    else return;
    center(v, false);
    paint();
  }

  // Animate to an absolute virtual index. Callers must resolve any pending
  // edge-snap (via settle) BEFORE reading v, so the target is always computed
  // from a real, in-sync position — this is what keeps rapid clicks and the
  // wrap-around seamless.
  function go(vi) {
    v = Math.max(0, Math.min(all.length - 1, vi));
    paint();
    if (reduce) { center(v, false); settle(); return; }
    animating = true;
    center(v, true);
    settleTimer = setTimeout(settle, 650); // fallback if transitionend is missed
  }

  // Relative step (prev/next): settle first, THEN read v and move.
  function step(dir) { settle(); go(v + dir); }

  // The real trigger for the edge-snap: fires exactly when the slide finishes
  // sliding, so there's no fixed-timer race against the animation.
  track.addEventListener("transitionend", (e) => {
    if (e.target === track && e.propertyName === "transform") settle();
  });

  if (prev) prev.addEventListener("click", () => step(-1));
  if (next) next.addEventListener("click", () => step(1));
  dots.forEach((d, i) => d.addEventListener("click", () => { settle(); go(i + 1); }));
  all.forEach((s, i) => s.addEventListener("click", () => { settle(); if (i !== v) go(i); }));

  window.addEventListener("resize", () => center(v, false));
  window.addEventListener("load", () => center(v, false));
  paint();
  center(v, false);
})();

// ---- Quote form ----
const form = document.getElementById("quoteForm");
const note = document.getElementById("formNote");
form.addEventListener("submit", async (e) => {
  const action = form.getAttribute("action") || "";
  const notConnected = action.includes("YOUR_FORM_ID");
  e.preventDefault();
  if (notConnected) {
    note.className = "form-note success";
    note.textContent = "Thanks! (Demo mode — connect a Formspree ID in index.html to receive this.)";
    form.reset();
    return;
  }
  note.className = "form-note";
  note.textContent = "Sending…";
  try {
    const res = await fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    if (res.ok) {
      note.className = "form-note success";
      note.textContent = "Thanks! We'll be in touch shortly with your quote.";
      form.reset();
    } else { throw new Error("Request failed"); }
  } catch (err) {
    note.className = "form-note error";
    note.textContent = "Something went wrong. Please try again, or call us directly.";
  }
});
