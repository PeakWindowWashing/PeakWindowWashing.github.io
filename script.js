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
(function () {
  document.querySelectorAll(".ba-slider").forEach((slider) => {
    const handle = slider.querySelector(".ba-handle");
    if (!handle) return;
    let dragging = false;

    function setPos(clientX) {
      const rect = slider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      slider.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", Math.round(pct));
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
      if (e.key === "ArrowLeft") { const v = Math.max(0, cur - 4); slider.style.setProperty("--pos", v + "%"); handle.setAttribute("aria-valuenow", Math.round(v)); e.preventDefault(); }
      if (e.key === "ArrowRight") { const v = Math.min(100, cur + 4); slider.style.setProperty("--pos", v + "%"); handle.setAttribute("aria-valuenow", Math.round(v)); e.preventDefault(); }
    });
  });
})();

// ---- Before / After carousel ----
(function () {
  const carousel = document.querySelector(".ba-carousel");
  if (!carousel) return;
  const viewport = carousel.querySelector(".ba-viewport");
  const slides = Array.from(carousel.querySelectorAll(".ba-slide"));
  const dots = Array.from(carousel.querySelectorAll(".ba-dot"));
  const prev = carousel.querySelector(".ba-prev");
  const next = carousel.querySelector(".ba-next");
  let idx = 0;

  function setHeight() {
    const active = slides[idx];
    if (active) viewport.style.height = active.offsetHeight + "px";
  }

  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === idx));
    dots.forEach((d, n) => d.classList.toggle("is-active", n === idx));
    setHeight();
  }

  if (prev) prev.addEventListener("click", () => show(idx - 1));
  if (next) next.addEventListener("click", () => show(idx + 1));
  dots.forEach((d, n) => d.addEventListener("click", () => show(n)));

  window.addEventListener("resize", setHeight);
  window.addEventListener("load", setHeight);
  setHeight();
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
