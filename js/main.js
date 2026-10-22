// Interactions for the portfolio. Everything degrades gracefully: with no JavaScript the
// page is a normal static site, and with reduced motion the decorative effects stay still.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- scroll progress + active nav link ---------- */
  var bar = $(".progress");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var links = $$(".nav nav a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["projects", "experience", "skills", "media", "contact"].forEach(function (id) {
      var el = document.getElementById(id); if (el) spy.observe(el);
    });
  }

  /* ---------- cursor ring ---------- */
  var ring = $(".cursor");
  if (ring && finePointer && !reduce) {
    var rx = 0, ry = 0, tx = 0, ty = 0, seen = false;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { rx = tx; ry = ty; seen = true; ring.classList.add("show"); }
      var hot = e.target.closest && e.target.closest("a, button, .case, .stage-frame, .row, .shot");
      ring.classList.toggle("big", !!hot);
    });
    document.addEventListener("pointerleave", function () { ring.classList.remove("show"); seen = false; });
    (function loop() {
      rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- name: letters swell near the pointer ---------- */
  var h1 = $("h1");
  if (h1) {
    var text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.innerHTML = text.split(" ").map(function (w) {
      return '<span class="w" aria-hidden="true">' + w.split("").map(function (c) { return '<span class="ch">' + c + "</span>"; }).join("") + "</span>";
    }).join(" ");
    var chars = $$(".ch", h1);
    if (finePointer && !reduce) {
      var pending = false, px = 0, py = 0;
      var paint = function () {
        pending = false;
        chars.forEach(function (c) {
          var r = c.getBoundingClientRect();
          var d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
          var w = 560 + 240 * clamp(1 - d / 220, 0, 1);
          c.style.fontVariationSettings = '"wght" ' + Math.round(w);
        });
      };
      window.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY;
        if (!pending) { pending = true; requestAnimationFrame(paint); }
      });
    } else {
      chars.forEach(function (c) { c.style.fontVariationSettings = '"wght" 780'; });
    }
  }

  /* ---------- portrait lens ---------- */
  var frame = $("#stage-frame"), fx = $("#stage-fx");
  if (frame && fx) {
    var cur = { x: 0.5, y: 0.45, r: 0 }, aim = { x: 0.5, y: 0.45, r: 0 };
    var RADIUS = function () { return frame.clientWidth * 0.34; };
    var hint = $("#stage-hint");
    var apply = function () {
      frame.style.setProperty("--x", cur.x * 100 + "%");
      frame.style.setProperty("--y", cur.y * 100 + "%");
      frame.style.setProperty("--r", cur.r + "px");
    };
    var running = false;
    var tick = function () {
      cur.x += (aim.x - cur.x) * 0.16; cur.y += (aim.y - cur.y) * 0.16; cur.r += (aim.r - cur.r) * 0.14;
      apply();
      if (Math.abs(aim.x - cur.x) + Math.abs(aim.y - cur.y) + Math.abs(aim.r - cur.r) > 0.002) requestAnimationFrame(tick);
      else running = false;
    };
    var go = function () { if (!running) { running = true; requestAnimationFrame(tick); } };
    var track = function (e) {
      var b = frame.getBoundingClientRect();
      aim.x = clamp((e.clientX - b.left) / b.width, 0, 1);
      aim.y = clamp((e.clientY - b.top) / b.height, 0, 1);
      aim.r = RADIUS(); go();
    };
    frame.addEventListener("pointerenter", function (e) { interrupt(); track(e); });
    frame.addEventListener("pointermove", track);
    frame.addEventListener("pointerdown", track);
    frame.addEventListener("pointerleave", function () { aim.r = 0; go(); });

    var intro = null;
    function interrupt() { if (intro) { clearTimeout(intro); intro = null; } }

    var modes = $$(".modes button");
    modes.forEach(function (btn) {
      btn.addEventListener("click", function () {
        modes.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        fx.src = "images/fx-" + btn.dataset.fx + ".webp";
        if (hint) hint.textContent = { signal: "Signal: each row of the photo becomes a wave, brighter where it's darker.", halftone: "Halftone: the photo rebuilt from dots.", heat: "Heat: brightness mapped to a thermal colour scale." }[btn.dataset.fx];
        // flash the whole frame so keyboard and touch users can see the result too
        aim.x = 0.5; aim.y = 0.5; aim.r = frame.clientWidth * 1.2; go();
        interrupt();
        intro = setTimeout(function () { aim.r = 0; go(); }, 1100);
      });
    });

    // one orchestrated moment on load: the lens sweeps across the photo to show what it does
    if (!reduce) {
      var start = performance.now();
      cur.x = 0.18; cur.y = 0.82; aim.x = 0.18; aim.y = 0.82;
      var sweep = function (now) {
        if (!intro && now - start > 4000) return;
        var t = clamp((now - start - 500) / 2200, 0, 1);
        if (t >= 1 || frame.matches(":hover")) { aim.r = frame.matches(":hover") ? aim.r : 0; go(); return; }
        var e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        aim.x = 0.18 + 0.64 * e; aim.y = 0.82 - 0.5 * e; aim.r = RADIUS() * Math.sin(Math.PI * Math.min(1, t * 1.05));
        cur.x = aim.x; cur.y = aim.y; cur.r = aim.r; apply();
        requestAnimationFrame(sweep);
      };
      intro = setTimeout(function () { requestAnimationFrame(sweep); }, 100);
      setTimeout(interrupt, 3500);
    }
  }

  /* ---------- signal strip ---------- */
  var trace = $("#trace");
  if (trace && trace.getContext) {
    var ctx = trace.getContext("2d"), W = trace.width, H = trace.height;
    var f = 0.35, a = 0.5, tf = 0.35, ta = 0.5, t = 0, visible = true;
    window.addEventListener("pointermove", function (e) {
      tf = e.clientX / window.innerWidth; ta = 1 - e.clientY / window.innerHeight;
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(trace);
    }
    var drawTrace = function () {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(159,176,200,0.14)"; ctx.lineWidth = 1; ctx.beginPath();
      for (var gx = 0; gx <= W; gx += W / 32) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      [[7, "rgba(255,178,36,0.15)"], [2.2, "#ffb224"]].forEach(function (p) {
        ctx.lineWidth = p[0]; ctx.strokeStyle = p[1]; ctx.lineJoin = "round"; ctx.beginPath();
        for (var x = 0; x <= W; x += 4) {
          var k = x / W;
          var y = H / 2 - (Math.sin(k * (10 + f * 40) * Math.PI + t * 2) + 0.4 * Math.sin(k * (28 + f * 70) * Math.PI - t * 3)) * (0.2 + a * 0.55) * H * 0.3 * (0.6 + 0.4 * Math.sin(k * Math.PI));
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };
    var anim = function () {
      if (visible && !reduce) { t += 0.014; f += (tf - f) * 0.05; a += (ta - a) * 0.05; drawTrace(); }
      requestAnimationFrame(anim);
    };
    drawTrace(); anim();
  }

  /* ---------- count-up when the number scrolls into view ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = +el.dataset.count;
    if (reduce || !("IntersectionObserver" in window)) return;
    el.textContent = "0";
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var s = performance.now();
      (function step(now) {
        var p = clamp((now - s) / 900, 0, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(s);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ---------- card spotlight + tilt, magnetic buttons ---------- */
  $$(".case, .edu > div").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var b = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - b.left + "px");
      card.style.setProperty("--my", e.clientY - b.top + "px");
      if (finePointer && !reduce && card.classList.contains("case")) {
        var rx = ((e.clientY - b.top) / b.height - 0.5) * -3, ry = ((e.clientX - b.left) / b.width - 0.5) * 3;
        card.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-3px)";
      }
    });
    card.addEventListener("pointerleave", function () { card.style.transform = ""; });
  });
  if (finePointer && !reduce) {
    $$(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var b = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + (e.clientX - b.left - b.width / 2) * 0.18 + "px," + (e.clientY - b.top - b.height / 2) * 0.28 + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- lightbox ---------- */
  var box = $("#lightbox");
  if (box && box.showModal) {
    var bigImg = $("img", box), cap = $("p", box);
    $$(".shot").forEach(function (s) {
      s.addEventListener("click", function () {
        bigImg.src = s.dataset.full; bigImg.alt = s.dataset.alt;
        var li = s.closest("li"); cap.textContent = li ? li.textContent.trim() : "";
        box.showModal();
      });
    });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
  }
})();
