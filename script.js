/* Mobile menu + the dog in the header.
   No dependencies. The site works without this file; the dog just stays still. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  var header = doc.querySelector('.site-header');
  var toggle = doc.querySelector('.nav-toggle');
  if (header && toggle) {
    var setOpen = function (open) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    doc.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });
    window.matchMedia('(min-width: 721px)').addEventListener('change', function () { setOpen(false); });
    var navLinks = doc.querySelector('.nav-links');
    if (navLinks) {
      navLinks.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') setOpen(false);
      });
    }
  }

  /* ---------- The dog ---------- */
  var svg = doc.querySelector('.dog');
  if (!svg) return;

  var q = function (sel) { return svg.querySelector(sel); };
  var head = q('.dog-head'), face = q('.dog-face');
  var earL = q('.dog-ear-l'), earR = q('.dog-ear-r');
  var tail = q('.dog-tail'), tongue = q('.dog-tongue');
  var pupils = [].slice.call(svg.querySelectorAll('.dog-pupil'));
  var eyes = [].slice.call(svg.querySelectorAll('.dog-eye'));
  var link = svg.closest('a');

  var IDLE_MS = 5000;       // after this long without pointer movement the dog looks around on its own
  var now0 = performance.now();

  var st = { gx: 0, gy: 0, tilt: 0, lid: 0.06, tongue: 0 };   // current pose
  var ptr = { x: 0, y: 0, at: -1e9 };                           // last pointer position
  var wander = { gx: 0.45, gy: 0.55 };                          // where it looks when nobody is moving
  var forced = { gx: 0, gy: 0, until: 0 };                      // e.g. look down/up while scrolling on touch
  var blinkUntil = reduce ? 0 : now0 + 420;                     // eyes open shortly after load
  var wagUntil = 0, tongueUntil = 0;
  var raf = 0, last = 0;

  var f = function (n) { return Math.round(n * 100) / 100; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  function aim(now) {
    if (now < forced.until) return { gx: forced.gx, gy: forced.gy, near: false, side: 1 };
    if (now - ptr.at < IDLE_MS) {
      var r = svg.getBoundingClientRect();
      var cx = r.left + r.width * 0.5;
      var cy = r.top + r.height * 0.42;
      var dx = ptr.x - cx, dy = ptr.y - cy;
      return {
        gx: dx / (Math.abs(dx) + 170),
        gy: dy / (Math.abs(dy) + 130),
        near: Math.hypot(dx, dy) < 180,
        side: dx < 0 ? -1 : 1
      };
    }
    return { gx: wander.gx, gy: wander.gy, near: false, side: 1 };
  }

  function render(now, wag) {
    var rot = reduce ? 0 : st.gx * 8 + st.tilt;
    head.setAttribute('transform', 'translate(' + f(st.gx * 3.4) + ' ' + f(st.gy * 2.4) + ') rotate(' + f(rot) + ' 80 78)');
    face.setAttribute('transform', 'translate(' + f(st.gx * 5.8) + ' ' + f(st.gy * 3.4) + ')');

    var pt = 'translate(' + f(st.gx * 2.1) + ' ' + f(st.gy * 1.9) + ')';
    pupils.forEach(function (p) { p.setAttribute('transform', pt); });
    eyes.forEach(function (e) {
      var cx = +e.getAttribute('data-cx'), cy = +e.getAttribute('data-cy');
      e.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(1 ' + f(st.lid) + ') translate(' + (-cx) + ' ' + (-cy) + ')');
    });

    var ear = reduce ? 0 : -st.gx * 3.5 + (wag ? Math.sin(now / 55) * 3 * wag : 0);
    earL.setAttribute('transform', 'rotate(' + f(ear) + ' 66 40)');
    earR.setAttribute('transform', 'rotate(' + f(ear) + ' 94 40)');
    tail.setAttribute('transform', 'rotate(' + f(wag ? Math.sin(now / 45) * 16 * wag : 0) + ' 112 104)');
    tongue.setAttribute('transform', 'translate(80 72.5) scale(1 ' + f(st.tongue) + ') translate(-80 -72.5)');
  }

  function step(now) {
    raf = 0;
    var dt = Math.min(now - (last || now), 64);
    last = now;

    var a = aim(now);
    var k = 1 - Math.exp(-dt / (reduce ? 70 : 105));
    st.gx += (a.gx - st.gx) * k;
    st.gy += (a.gy - st.gy) * k;

    var tiltT = (!reduce && a.near) ? a.side * 9 : 0;   // curious head tilt when the pointer is close
    st.tilt += (tiltT - st.tilt) * k * 0.7;

    var lidT = now < blinkUntil ? 0.06 : 1;
    st.lid += (lidT - st.lid) * (1 - Math.exp(-dt / 45));

    var tonT = now < tongueUntil ? 1 : 0;
    st.tongue += (tonT - st.tongue) * (1 - Math.exp(-dt / 80));

    var wag = (!reduce && now < wagUntil) ? Math.min(1, (wagUntil - now) / 250) : 0;
    render(now, wag);

    var settled =
      Math.abs(a.gx - st.gx) < 0.003 && Math.abs(a.gy - st.gy) < 0.003 &&
      Math.abs(tiltT - st.tilt) < 0.05 && Math.abs(lidT - st.lid) < 0.01 &&
      Math.abs(tonT - st.tongue) < 0.01 && !wag;
    if (settled) last = 0; else request();
  }

  function request() { if (!raf) raf = requestAnimationFrame(step); }

  /* Pointer: mouse, pen and touch all count. */
  function onPointer(e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now();
    request();
  }
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });

  /* On touch screens the finger is often on the page, not moving: glance toward the scroll direction. */
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY, d = y - lastY;
    lastY = y;
    if (reduce || Math.abs(d) < 3 || window.matchMedia('(hover: hover)').matches) return;
    forced = { gx: 0.1, gy: d > 0 ? 0.9 : -0.7, until: performance.now() + 900 };
    request();
    setTimeout(request, 950);
  }, { passive: true });

  /* Idle life: wander, blink. Both off for reduced motion. */
  if (!reduce) {
    var spots = [[-0.8, 0.25], [0.7, 0.3], [0.2, 0.85], [0.95, 0.65], [0, 0.1], [-0.35, 0.75], [0.5, 0.5]];
    var prev = -1;
    (function wanderLoop() {
      var i; do { i = Math.floor(Math.random() * spots.length); } while (i === prev);
      prev = i; wander = { gx: spots[i][0], gy: spots[i][1] };
      request();
      setTimeout(wanderLoop, rand(1700, 3800));
    })();
    (function blinkLoop() {
      setTimeout(function () {
        blinkUntil = performance.now() + 130;
        request();
        blinkLoop();
      }, rand(2400, 6200));
    })();
  }

  /* Say hi: wag on hover/focus, tongue on press. */
  if (link) {
    var wagNow = function () { wagUntil = performance.now() + 1500; request(); };
    link.addEventListener('pointerenter', wagNow);
    link.addEventListener('focus', wagNow);
    link.addEventListener('pointerdown', function () {
      var t = performance.now();
      tongueUntil = t + 1300; wagUntil = t + 1700; request();
    });
    var isMoti = doc.body.getAttribute('data-page') === 'moti';
    if (isMoti) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        wagUntil = performance.now() + 2000;
        tongueUntil = performance.now() + 1400;
        request();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
  }

  render(now0, 0);
  request();
})();
