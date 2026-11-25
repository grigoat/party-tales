/* ─────────────────────────────────────────────────────────────
   PARTY TALES · New Year season 2026/27
   Snow + golden sparkles and hanging balloon garlands in the heroes.
   To switch the season off: remove class "ny-season" from <body>
   (or the <script src="js/newyear.js"> tag) on every page.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (!document.body || !document.body.classList.contains('ny-season')) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Hanging balloons ─────────────────────────────────────── */
  var PALETTE = {
    gold:  ['#f7e6bd', '#d9b46a', '#a9843c'],
    blush: ['#fbe9f2', '#f0c6dc', '#c98fb0'],
    rose:  ['#f2a9d2', '#d478b0', '#a44f86'],
    pearl: ['#ffffff', '#f3ede8', '#cfc4bd']
  };
  // x, string length, radius, colour — one side; the other side is mirrored
  var SIDE = [
    { x: 30,  len: 70,  r: 26, c: 'gold'  },
    { x: 76,  len: 128, r: 31, c: 'rose'  },
    { x: 122, len: 46,  r: 21, c: 'pearl' },
    { x: 160, len: 104, r: 24, c: 'blush' }
  ];
  var uid = 0;

  function balloonSVG() {
    var defs = '', body = '';
    SIDE.forEach(function (b, i) {
      var id = 'nyb' + (++uid), p = PALETTE[b.c];
      defs += '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%">' +
        '<stop offset="0" stop-color="' + p[0] + '"/>' +
        '<stop offset=".55" stop-color="' + p[1] + '"/>' +
        '<stop offset="1" stop-color="' + p[2] + '"/></radialGradient>';
      // Hanging balloon: the string ends at the knot on TOP, the round body hangs below
      var x = b.x, r = b.r, ry = b.r * 1.15, k = b.len, t = k + 6, H = ry * 1.95;
      var shape = 'M' + x + ' ' + t +
        ' C ' + (x + r * 0.62) + ' ' + t + ' ' + (x + r) + ' ' + (t + H * 0.22) + ' ' + (x + r) + ' ' + (t + H * 0.55) +
        ' C ' + (x + r) + ' ' + (t + H * 0.82) + ' ' + (x + r * 0.55) + ' ' + (t + H) + ' ' + x + ' ' + (t + H) +
        ' C ' + (x - r * 0.55) + ' ' + (t + H) + ' ' + (x - r) + ' ' + (t + H * 0.82) + ' ' + (x - r) + ' ' + (t + H * 0.55) +
        ' C ' + (x - r) + ' ' + (t + H * 0.22) + ' ' + (x - r * 0.62) + ' ' + t + ' ' + x + ' ' + t + ' Z';
      var hx = x - r * 0.42, hy = t + H * 0.42;
      body += '<g class="ny-balloon" style="--d:' + (i * 0.7) + 's;--o:' + x + 'px 0">' +
        '<path d="M' + x + ' 0 C ' + (x + 4) + ' ' + (k * 0.35) + ' ' + (x - 4) + ' ' + (k * 0.7) + ' ' + x + ' ' + k + '" stroke="#d9b46a" stroke-width="1" fill="none" opacity=".75"/>' +
        '<path d="' + shape + '" fill="url(#' + id + ')"/>' +
        '<ellipse cx="' + hx + '" cy="' + hy + '" rx="' + (r * 0.18) + '" ry="' + (r * 0.34) + '" fill="#fff" opacity=".5" transform="rotate(18 ' + hx + ' ' + hy + ')"/>' +
        '<path d="M' + (x - 1.6) + ' ' + (t + 1) + ' L' + (x - 3.6) + ' ' + k + ' L' + (x + 3.6) + ' ' + k + ' L' + (x + 1.6) + ' ' + (t + 1) + ' Z" fill="' + p[2] + '"/>' +
        '</g>';
    });
    return '<svg viewBox="0 0 190 220" aria-hidden="true" focusable="false"><defs>' + defs + '</defs>' + body + '</svg>';
  }

  function addGarlands(host) {
    ['left', 'right'].forEach(function (side) {
      var el = document.createElement('div');
      el.className = 'ny-garland ny-garland-' + side;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = balloonSVG();
      host.appendChild(el);
    });
  }

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
        tw: Math.random() * Math.PI * 2
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
          f.y += f.vy; f.x += f.vx + Math.sin(f.sway) * 0.3;
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
  if (hero) addSky(hero, true); // home hero is already full of balloon photos — snow only

  var heroes = document.querySelectorAll('.page-hero');
  heroes.forEach(function (el) {
    el.classList.add('ny-host');
    addSky(el, false);
    addGarlands(el);
  });
  // Hang the garlands just below the fixed navigation bar
  var nav = document.getElementById('navbar');
  function placeGarlands() {
    var top = nav ? nav.offsetHeight : 0;
    document.querySelectorAll('.page-hero .ny-garland').forEach(function (g) { g.style.top = top + 'px'; });
  }
  placeGarlands();
  window.addEventListener('resize', placeGarlands);

  var cta = document.getElementById('cta-final');
  if (cta) addSky(cta, true);
})();
