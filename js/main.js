// Live signal trace in the hero: two summed sine waves plus a faint noise floor.
// Pointer x sets the frequency, pointer y sets the amplitude. Respects reduced motion.
(function () {
  var canvas = document.getElementById("scope");
  var toggle = document.getElementById("scope-toggle");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var paused = reduce;
  var target = { f: 0.5, a: 0.5 }, cur = { f: 0.5, a: 0.5 };
  var t = 0;

  function grid() {
    ctx.strokeStyle = "rgba(159,176,200,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= W; x += W / 12) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (var y = 0; y <= H; y += H / 8) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(159,176,200,0.28)";
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  }

  function sample(x, f, a) {
    var k = x / W;
    var w1 = Math.sin(k * (6 + f * 22) * Math.PI * 2 / 3 + t * 2.2);
    var w2 = 0.35 * Math.sin(k * (14 + f * 40) * Math.PI * 2 / 3 - t * 3.1);
    var env = 0.55 + 0.45 * Math.sin(k * Math.PI);
    return (w1 + w2) * env * a * (H * 0.3);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    grid();
    ctx.lineJoin = "round";
    // glow pass, then crisp pass
    [[8, "rgba(255,178,36,0.14)"], [2.5, "#ffb224"]].forEach(function (p) {
      ctx.lineWidth = p[0]; ctx.strokeStyle = p[1];
      ctx.beginPath();
      for (var x = 0; x <= W; x += 3) {
        var y = H / 2 - sample(x, cur.f, 0.35 + cur.a * 0.75);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  function frame() {
    if (!paused) {
      t += 0.012;
      cur.f += (target.f - cur.f) * 0.06;
      cur.a += (target.a - cur.a) * 0.06;
      draw();
    }
    requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    target.f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    target.a = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
    if (paused) draw();
  });

  function setLabel() {
    toggle.textContent = paused ? "Play" : "Pause";
    toggle.setAttribute("aria-pressed", String(paused));
  }
  toggle.addEventListener("click", function () { paused = !paused; setLabel(); if (paused) draw(); });
  setLabel();
  draw();
  requestAnimationFrame(frame);
})();
