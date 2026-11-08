/* Route Grid Background ("Palette BG")
   - Pure ambient background wallpaper (Option A: pointer-events: none, no hover/tooltips to interfere with content).
   - Shows all runs of the year arranged in a subtle responsive grid.
   - Each route outline is colored with Garmin speed heatmap coloring.
   - Bottom-left badge links cleanly to the Running Tapestry on personal.html.
   - Jumping ᕕ( ᐛ )ᕗ emoticon used as a clean, delightful initial loading indicator.
*/
(function () {
  'use strict';

  // 1. Geometric Vector Runner Loading Indicator
  var loader = null;
  var showTime = performance.now();
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var P_V1 = 'M422 135Q472 135 501.0 165.5Q530 196 530 230Q530 274 497.0 307.0Q464 340 420 340Q370 340 340.0 317.0Q310 294 310 230Q310 182 340.0 158.5Q370 135 422 135ZM191 457 586 1493H815L1384 0H1174L700 1294L410 496Q536 488 615.5 410.0Q695 332 695 230Q695 115 611.5 42.5Q528 -30 422 -30Q326 -31 238.0 47.0Q150 125 150 230Q150 351 191 457Z';
  var P_PL = 'M635 1554Q501 1324 436.0 1099.0Q371 874 371 643Q371 412 436.5 185.5Q502 -41 635 -270H475Q325 -35 250.5 192.0Q176 419 176 643Q176 866 250.0 1092.0Q324 1318 475 1554Z';
  var P_FC = 'M217 1547H421V1342H217ZM715 1871H919V1666H715ZM1204 1218 273 746 1204 272ZM1374 0 119 632V860L1374 1493Z';
  var P_PR = 'M164 1554H324Q474 1318 548.5 1092.0Q623 866 623 643Q623 419 548.5 192.0Q474 -35 324 -270H164Q297 -41 362.5 185.5Q428 412 428 643Q428 874 362.5 1099.0Q297 1324 164 1554Z';
  var P_V2 = 'M349 989Q399 989 428.0 1019.5Q457 1050 457 1084Q457 1128 424.0 1161.0Q391 1194 347 1194Q297 1194 267.0 1171.0Q237 1148 237 1084Q237 1036 267.0 1012.5Q297 989 349 989ZM621 1048Q609 951 527.0 887.5Q445 824 349 824Q240 824 158.5 904.5Q77 985 77 1084Q77 1226 164.0 1290.5Q251 1355 322 1355Q387 1355 461 1318L1368 860V632L113 0V182L1214 746Z';

  var LOADER_SVG =
    '<svg class="site-loader-svg" viewBox="0 0 7363 2180" aria-hidden="true" focusable="false">' +
      '<g transform="translate(0, 1890) scale(1, -1)" fill="currentColor">' +
        '<g class="runner-pose-a">' +
          '<path d="' + P_V1 + '" />' +
          '<path d="' + P_PL + '" transform="translate(1401, 0)" />' +
          '<path d="' + P_FC + '" transform="translate(2851, 0)" />' +
          '<path d="' + P_PR + '" transform="translate(5077, 0)" />' +
          '<path d="' + P_V2 + '" transform="translate(5876, 0)" />' +
        '</g>' +
        '<g class="runner-pose-b">' +
          '<path d="' + P_V2 + '" />' +
          '<path d="' + P_PL + '" transform="translate(1487, 0)" />' +
          '<path d="' + P_FC + '" transform="translate(2937, 0)" />' +
          '<path d="' + P_PR + '" transform="translate(5163, 0)" />' +
          '<path d="' + P_V1 + '" transform="translate(5962, 0)" />' +
        '</g>' +
      '</g>' +
    '</svg>';

  function initLoader() {
    if (prefersReduced) return;
    loader = document.getElementById('site-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'site-loader';
      loader.className = 'site-loader';
      loader.setAttribute('aria-label', 'Loading');
      loader.innerHTML =
        '<div class="site-loader-box">' +
          '<div class="site-loader-walker">' + LOADER_SVG + '</div>' +
          '<div class="site-loader-shadow"></div>' +
        '</div>';
      if (document.body) {
        document.body.prepend(loader);
      }
    }
    showTime = performance.now();
  }

  function dismissLoader() {
    if (!loader) return;
    var elapsed = performance.now() - showTime;
    // 550ms provides one crisp two-step running stride
    var minVisibleTime = 550;
    var remaining = Math.max(0, minVisibleTime - elapsed);
    setTimeout(function () {
      if (!loader) return;
      loader.classList.add('loaded');
    }, remaining);
  }

  // Intercept internal link clicks for a seamless runner page transition
  document.addEventListener('click', function (e) {
    if (prefersReduced) return;
    var link = e.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
    if (link.hasAttribute('download')) return;
    if (link.origin && link.origin !== window.location.origin) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Skip same-page anchors (e.g. personal.html#last-run on personal.html)
    if (link.pathname === window.location.pathname && link.search === window.location.search) return;

    var dest = link.href;
    e.preventDefault();
    initLoader();
    if (loader) {
      loader.classList.remove('loaded');
    }
    setTimeout(function () {
      window.location.href = dest;
    }, 200);
  });

  // Handle browser Back/Forward (bfcache)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && loader) {
      loader.classList.add('loaded');
    }
  });

  // Safety fallback: never keep loader up more than 2.4s even if offline or slow
  setTimeout(dismissLoader, 2400);

  function init() {
    initLoader();

    if (document.body && document.body.getAttribute('data-page') === 'moti') {
      dismissLoader();
      return;
    }
    if (document.getElementById('route-bg')) {
      dismissLoader();
      return;
    }

    var jsonUrl = (window.location.protocol === 'file:') ? 'runs-2026-grid.json' : '/runs-2026-grid.json';

    fetch(jsonUrl)
      .then(function (r) {
        if (!r.ok) {
          return fetch('runs-2026-grid.json').then(function (r2) {
            return r2.ok ? r2.json() : Promise.reject(r2.status);
          });
        }
        return r.json();
      })
      .then(function (runs) {
        dismissLoader();

        if (!runs || !runs.length || document.getElementById('route-bg')) return;

        var totalRuns = runs.length;
        var totalKm = runs.reduce(function (sum, r) { return sum + (r.dist || 0); }, 0);

        // Ambient Background Grid Palette (Option A: Pure wallpaper, pointer-events: none)
        var container = document.createElement('div');
        container.id = 'route-bg';
        container.className = 'route-bg';
        container.setAttribute('aria-hidden', 'true');

        var resizeRaf = 0;
        function updateLayout() {
          if (resizeRaf) return;
          resizeRaf = requestAnimationFrame(function () {
            resizeRaf = 0;
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var aspect = vw / vh;
            var cols = Math.max(8, Math.round(Math.sqrt(runs.length * aspect * 1.05)));
            container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
          });
        }

        updateLayout();
        window.addEventListener('resize', updateLayout);

        var frag = document.createDocumentFragment();
        runs.forEach(function (r) {
          var tile = document.createElement('div');
          tile.className = 'route-bg-tile';
          tile.setAttribute('data-id', r.id);
          var runColor = r.color || '#22c55e';
          tile.style.color = runColor;

          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 100 100');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          if (r.path) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', r.path);
            svg.appendChild(path);
          }

          tile.appendChild(svg);
          frag.appendChild(tile);
        });

        container.appendChild(frag);
        document.body.prepend(container);

        // Bottom-left Indicator Badge (links cleanly to personal.html running tapestry)
        var badge = document.createElement('a');
        badge.id = 'route-bg-badge';
        badge.className = 'route-bg-badge';
        badge.href = 'personal.html#running-tapestry';
        badge.setAttribute('title', 'Explore all ' + totalRuns + ' runs on the Personal page');
        badge.innerHTML =
          '<span class="route-bg-dot"></span>' +
          '<span class="route-bg-text">' +
            '<strong>2026 Running Grid:</strong> ' + totalRuns + ' runs \u00b7 ' + Math.round(totalKm).toLocaleString() + ' km' +
          '</span>';
        document.body.appendChild(badge);
      })
      .catch(function () {
        dismissLoader();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
