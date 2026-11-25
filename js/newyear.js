/* ─────────────────────────────────────────────────────────────
   PARTY TALES · New Year season 2026/27
   Snow + golden sparkles in the heroes; flakes swirl away from the cursor.
   To switch the season off: remove class "ny-season" from <body>
   (or the <script src="js/newyear.js"> tag) on every page.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (!document.body || !document.body.classList.contains('ny-season')) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Snow & sparkles ──────────────────────────────────────── */
  function addSky(host, dark) {
    var canvas = document.createElement('canvas');
    canvas.className = 'ny-sky';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, flakes = [], running = false, visible = true, raf = 0;
    var mx = -9999, my = -9999, R = 130;
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      host.addEventListener('pointermove', function (e) {
        var rc = host.getBoundingClientRect(); mx = e.clientX - rc.left; my = e.clientY - rc.top;
      });
      host.addEventListener('pointerleave', function () { mx = my = -9999; });
    }
    var colours = dark
      ? ['255,255,255', '255,255,255', '255,255,255', '243,223,174', '240,214,229']
      : ['217,180,106', '217,180,106', '212,120,176', '201,143,176'];

    function make(initial) {
      var sparkle = Math.random() < (dark ? 0.22 : 0.5);
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -10,
        r: sparkle ? 1 + Math.random() * 1.6 : 1.2 + Math.random() * 2.4,
        vy: 0.25 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        sway: Math.random() * Math.PI * 2,
        a: dark ? 0.35 + Math.random() * 0.5 : 0.25 + Math.random() * 0.35,
        c: colours[Math.floor(Math.random() * colours.length)],
        sparkle: sparkle,
        tw: Math.random() * Math.PI * 2,
        px: 0, py: 0
      };
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(Math.min(90, (w * h) / (dark ? 14000 : 22000)));
      flakes = [];
      for (var i = 0; i < target; i++) flakes.push(make(true));
      if (!running) draw(false);
    }

    function star(x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x, y, x + r * 2.2, y);
      ctx.quadraticCurveTo(x, y, x, y + r * 2.2); ctx.quadraticCurveTo(x, y, x - r * 2.2, y);
      ctx.quadraticCurveTo(x, y, x, y - r * 2.2);
      ctx.fill();
    }

    function draw(step) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        if (step) {
          f.sway += 0.012; f.tw += 0.05;
          var dx = f.x - mx, dy = f.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 1) {           // swirl away from the cursor
            var d = Math.sqrt(d2), force = (1 - d / R) * 1.6;
            f.px += (dx / d) * force - (dy / d) * force * 0.5;
            f.py += (dy / d) * force + (dx / d) * force * 0.5;
          }
          f.px *= 0.92; f.py *= 0.92;
          f.y += f.vy + f.py; f.x += f.vx + Math.sin(f.sway) * 0.3 + f.px;
          if (f.y > h + 10 || f.x < -20 || f.x > w + 20) { flakes[i] = make(false); continue; }
        }
        if (f.sparkle) {
          ctx.fillStyle = 'rgba(' + f.c + ',' + (f.a * (0.55 + 0.45 * Math.sin(f.tw))).toFixed(3) + ')';
          star(f.x, f.y, f.r);
        } else {
          ctx.fillStyle = 'rgba(' + f.c + ',' + f.a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    function loop() {
      if (!running) return;
      draw(true);
      raf = requestAnimationFrame(loop);
    }
    function update() {
      var should = visible && !document.hidden && !reduceMotion;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (!should && running) { running = false; cancelAnimationFrame(raf); }
    }

    resize();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(resize, 200); });
    document.addEventListener('visibilitychange', update);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; update(); }).observe(host);
    }
    update();
  }

  /* ── Mount ────────────────────────────────────────────────── */
  var hero = document.querySelector('.hero');
  if (hero) addSky(hero, true);

  document.querySelectorAll('.page-hero').forEach(function (el) {
    el.classList.add('ny-host');
    addSky(el, false);
  });

  var cta = document.getElementById('cta-final');
  if (cta) addSky(cta, true);
})();
