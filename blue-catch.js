// Blue Catch model: a full 360° image sequence drawn to a canvas. It spins
// continuously on its own and can be dragged either way.
(() => {
  document.querySelectorAll(".bc-turntable").forEach((stage) => {
    const canvas = stage.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const count = Number(stage.dataset.frames);
    const path = stage.dataset.path;
    const last = count - 1;
    const frames = new Array(count);
    let ready = 0, started = false;

    const start = () => {
      if (started) return;
      started = true;
      for (let i = 0; i < count; i += 1) {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => {
          frames[i] = im;
          ready += 1;
          if (i === 0) { canvas.width = im.naturalWidth; canvas.height = im.naturalHeight; draw(); }
          if (ready === count) stage.classList.add("is-ready");
        };
        im.src = `${path}${String(i + 1).padStart(3, "0")}.jpg`;
      }
    };

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const PERIOD = 20000;                // ms for one full turn
    let pos = 0, dragging = false, startX = 0, startPos = 0, idleUntil = 0, visible = false, drawn = -1;

    function nearest(i) {
      if (frames[i]) return frames[i];
      for (let d = 1; d < count; d += 1) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    }
    const wrap = (v) => ((v % count) + count) % count;
    function draw() {
      const i = Math.round(wrap(pos)) % count;
      if (i === drawn && frames[i]) return;
      const im = nearest(i);
      if (!im) return;
      ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
      if (frames[i]) drawn = i;
    }

    let prev = 0;
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min(50, now - (prev || now)); prev = now;
      if (!visible || dragging || reduceMotion || now < idleUntil || !stage.classList.contains("is-ready")) return;
      pos = wrap(pos + (dt / PERIOD) * count);
      draw();
    }
    requestAnimationFrame(tick);

    new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; if (visible) start(); });
    }, { rootMargin: "300px 0px", threshold: 0 }).observe(stage);

    if ("nodrag" in stage.dataset) return;   // gallery card: just spins, clicks open the project
    stage.addEventListener("pointerdown", (e) => {
      dragging = true; startX = e.clientX; startPos = pos;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
      start();
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const perPx = count / (stage.clientWidth * 2);
      pos = wrap(startPos + (e.clientX - startX) * perPx);
      draw();
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      idleUntil = performance.now() + 1500;
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  });
})();
