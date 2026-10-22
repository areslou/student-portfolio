// Interactions. Without JavaScript the page is a normal static site; with reduced motion
// the decorative effects stay still and the events reel becomes a plain scrolling row.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- scroll progress, nav spy, horizontal reel ---------- */
  var bar = $(".progress");
  var reel = $(".reel"), reelTrack = $(".reel-track"), reelBar = $(".reel-bar span");
  var reelDist = 0, hs = false, SPEED = 2.1; // horizontal px per scrolled px

  function setupReel() {
    if (!reel) return;
    hs = window.innerWidth >= 960 && !reduce;
    reel.classList.toggle("hscroll", hs);
    if (hs) {
      var th = reelTrack.clientHeight - 116 - 4;
      $$("li", reelTrack).forEach(function (li) {
        var im = $("img", li);
        li.style.width = Math.round(th * (+im.getAttribute("width") / +im.getAttribute("height"))) + 4 + "px";
      });
      reelDist = Math.max(0, reelTrack.scrollWidth - window.innerWidth + 40);
      reel.style.height = reelDist / SPEED + window.innerHeight - 56 + "px";
    } else {
      reel.style.height = "";
      reelTrack.style.transform = "";
      $$("li", reelTrack).forEach(function (li) { li.style.width = ""; });
      if (reelBar) reelBar.style.transform = "scaleX(0)";
    }
    onScroll();
  }

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    if (hs) {
      var r = reel.getBoundingClientRect();
      var p = clamp(-r.top / (reel.offsetHeight - window.innerHeight + 56), 0, 1);
      reelTrack.style.transform = "translate3d(" + -p * reelDist + "px,0,0)";
      if (reelBar) reelBar.style.transform = "scaleX(" + p + ")";
    } else if (reel && reelBar) {
      var m = reelTrack.scrollWidth - reelTrack.clientWidth;
      reelBar.style.transform = "scaleX(" + (m > 0 ? reelTrack.scrollLeft / m : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", setupReel);
  window.addEventListener("load", setupReel);
  if (reelTrack) reelTrack.addEventListener("scroll", onScroll, { passive: true });
  setupReel();

  var links = $$(".bar nav a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["projects", "events", "experience", "record", "contact"].forEach(function (id) {
      var el = document.getElementById(id); if (el) spy.observe(el);
    });
  }

  /* ---------- square cursor ---------- */
  var cur = $(".cursor");
  if (cur && finePointer && !reduce) {
    var cx = 0, cy = 0, tx = 0, ty = 0, seen = false;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { cx = tx; cy = ty; seen = true; cur.classList.add("show"); }
      var hot = e.target.closest && e.target.closest("a, button, .stage-frame, .also li, .exp-list li");
      cur.classList.toggle("big", !!hot);
    });
    document.addEventListener("pointerleave", function () { cur.classList.remove("show"); seen = false; });
    (function loop() {
      cx += (tx - cx) * 0.25; cy += (ty - cy) * 0.25;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- name: letters swell toward the pointer ---------- */
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
          c.style.fontVariationSettings = '"wght" ' + Math.round(560 + 240 * clamp(1 - d / 240, 0, 1));
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

  /* ---------- portrait: a square lens that re-renders the photo ---------- */
  var frame = $("#stage-frame"), fx = $("#stage-fx");
  if (frame && fx) {
    var L = { x: 0.5, y: 0.45, s: 0 }, A = { x: 0.5, y: 0.45, s: 0 };
    var size = function () { return frame.clientWidth * 0.62; };
    var hint = $("#stage-hint");
    var apply = function () {
      var w = frame.clientWidth, h = frame.clientHeight, r = L.s / 2, x = L.x * w, y = L.y * h;
      frame.style.setProperty("--t", Math.max(0, y - r) + "px");
      frame.style.setProperty("--l", Math.max(0, x - r) + "px");
      frame.style.setProperty("--rt", Math.max(0, w - (x + r)) + "px");
      frame.style.setProperty("--b", Math.max(0, h - (y + r)) + "px");
      frame.style.setProperty("--cx", x + "px");
      frame.style.setProperty("--cy", y + "px");
      frame.style.setProperty("--s", L.s + "px");
      fx.style.visibility = L.s < 1 ? "hidden" : "visible";
      frame.style.setProperty("--ringv", L.s < 2 ? "hidden" : "visible");
    };
    var running = false;
    var tick = function () {
      L.x += (A.x - L.x) * 0.22; L.y += (A.y - L.y) * 0.22; L.s += (A.s - L.s) * 0.18;
      apply();
      if (Math.abs(A.x - L.x) + Math.abs(A.y - L.y) + Math.abs(A.s - L.s) > 0.003) requestAnimationFrame(tick);
      else running = false;
    };
    var go = function () { if (!running) { running = true; requestAnimationFrame(tick); } };
    var track = function (e) {
      var b = frame.getBoundingClientRect();
      A.x = clamp((e.clientX - b.left) / b.width, 0, 1);
      A.y = clamp((e.clientY - b.top) / b.height, 0, 1);
      A.s = size(); go();
    };
    var introOn = !reduce, introTimer = null;
    var stopIntro = function () { introOn = false; if (introTimer) clearTimeout(introTimer); };
    frame.addEventListener("pointerenter", function (e) { stopIntro(); track(e); });
    frame.addEventListener("pointermove", track);
    frame.addEventListener("pointerdown", track);
    frame.addEventListener("pointerleave", function () { A.s = 0; go(); });

    var modes = $$(".modes button");
    var notes = { signal: "Signal: every row of pixels becomes a wave.", halftone: "Halftone: the photo rebuilt from dots.", heat: "Heat: brightness mapped to a thermal scale." };
    modes.forEach(function (btn) {
      btn.addEventListener("click", function () {
        stopIntro();
        modes.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        fx.src = "images/fx-" + btn.dataset.fx + ".webp";
        if (hint) hint.textContent = notes[btn.dataset.fx];
        A.x = 0.5; A.y = 0.5; A.s = frame.clientWidth * 1.6; go();
        introTimer = setTimeout(function () { A.s = 0; go(); }, 1100);
      });
    });

    // one orchestrated moment: the lens sweeps across the photo once so the hover is discoverable
    if (introOn) {
      var t0 = performance.now() + 500;
      L.x = A.x = 0.2; L.y = A.y = 0.8; apply();
      (function sweep(now) {
        if (!introOn) return;
        var t = clamp((now - t0) / 2200, 0, 1);
        if (now < t0) return requestAnimationFrame(sweep);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        L.x = A.x = 0.2 + 0.6 * e; L.y = A.y = 0.8 - 0.45 * e; L.s = A.s = size() * Math.sin(Math.PI * t);
        apply();
        if (t < 1) requestAnimationFrame(sweep); else { A.s = 0; L.s = 0; apply(); }
      })(performance.now());
    }
  }

  /* ---------- hero signal trace (background) ---------- */
  var trace = $("#trace");
  if (trace && trace.getContext) {
    var ctx = trace.getContext("2d"), W = 0, H = 0;
    var f = 0.35, a = 0.5, tf = 0.35, ta = 0.5, t = 0, visible = true;
    var fit = function () {
      var r = trace.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      W = trace.width = Math.max(1, Math.round(r.width * d)); H = trace.height = Math.max(1, Math.round(r.height * d));
    };
    fit(); window.addEventListener("resize", fit);
    window.addEventListener("pointermove", function (e) { tf = e.clientX / window.innerWidth; ta = 1 - e.clientY / window.innerHeight; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(trace);
    var drawTrace = function () {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(159,176,200,0.12)"; ctx.lineWidth = 1; ctx.beginPath();
      var gs = H / 14;
      for (var gx = 0; gx <= W; gx += gs) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = 0; gy <= H; gy += gs) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();
      [[10, "rgba(255,178,36,0.14)"], [2.5, "#ffb224"]].forEach(function (p) {
        ctx.lineWidth = p[0]; ctx.strokeStyle = p[1]; ctx.lineJoin = "miter"; ctx.beginPath();
        for (var x = 0; x <= W; x += 6) {
          var k = x / W;
          var y = H * 0.32 - (Math.sin(k * (8 + f * 34) * Math.PI + t * 2) + 0.4 * Math.sin(k * (22 + f * 60) * Math.PI - t * 3)) * (0.25 + a * 0.6) * H * 0.12;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };
    var anim = function () {
      if (visible && !reduce) { t += 0.012; f += (tf - f) * 0.05; a += (ta - a) * 0.05; drawTrace(); }
      requestAnimationFrame(anim);
    };
    drawTrace(); anim();
  }

  /* ---------- count-up when numbers scroll into view ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
    if (reduce || !("IntersectionObserver" in window)) return;
    el.textContent = (0).toFixed(dec);
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var s = performance.now();
      (function step(now) {
        var p = clamp((now - s) / 1100, 0, 1);
        el.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      })(s);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ---------- lightbox ---------- */
  var box = $("#lightbox");
  if (box && box.showModal) {
    var bigImg = $("img", box), cap = $("p", box);
    $$(".shot:not(.vid)").forEach(function (s) {
      s.addEventListener("click", function () {
        bigImg.src = s.dataset.full; bigImg.alt = s.dataset.alt;
        cap.textContent = s.dataset.alt || "";
        box.showModal();
      });
    });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
  }

  /* ---------- video player: loads Facebook's embed only after a click ---------- */
  var vbox = $("#videobox");
  if (vbox && vbox.showModal) {
    var vframe = $(".vframe", vbox), vlink = $("#vfallback", vbox);
    var stop = function () { vframe.innerHTML = ""; };
    $$(".vid").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        vframe.style.setProperty("--vr", a.dataset.ratio || "1.7778");
        var src = "https://www.facebook.com/plugins/video.php?show_text=false&autoplay=1&href=" + encodeURIComponent(a.href);
        vframe.innerHTML = '<iframe title="' + (a.dataset.alt || "Video") + '" src="' + src + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
        vlink.href = a.href;
        vbox.showModal();
      });
    });
    vbox.addEventListener("close", stop);
    vbox.addEventListener("click", function (e) { if (e.target === vbox) vbox.close(); });
  }
})();
