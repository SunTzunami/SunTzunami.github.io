/* personal-page.js — initializers for personal.html
   Externalised from inline <script> so the SPA script loader picks it up correctly.
   Includes: last-run card, muse stories (with Escape + ARIA), running stat auto-update. */
(function () {
  'use strict';

  /* ── Last Run Card ───────────────────────────────────────────────────────── */
  function initLastRunCard() {
    var detailsEl = document.getElementById('last-run-details');
    var pathEl    = document.getElementById('last-run-path');
    var updatedEl = document.getElementById('garmin-updated');
    var cardEl    = document.getElementById('last-run-card');
    if (!detailsEl) return;

    Promise.all([
      fetch('garmin-activities.json').then(function (r) { return r.ok ? r.json() : null; }),
      fetch('runs-2026-grid.json').then(function (r) { return r.ok ? r.json() : null; })
    ])
      .then(function (results) {
        var data = results[0];
        var grid = results[1] || [];

        /* ── Auto-update prose + KPI stats from summary ── */
        if (data && data.summary) {
          var s = data.summary;

          // Prose running stats (hobby section)
          var distApprox  = document.getElementById('run-dist-approx');
          var countApprox = document.getElementById('run-count-approx');
          var sinceText   = document.getElementById('run-since-text');

          if (distApprox && s.total_distance_km) {
            distApprox.textContent = Math.round(s.total_distance_km).toLocaleString() + '+ km';
          }
          if (countApprox && s.total_runs) {
            countApprox.textContent = s.total_runs.toLocaleString() + '+';
          }
          if (sinceText && s.since_date) {
            var sinceDate = new Date(s.since_date);
            sinceText.textContent = sinceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }

          // KPI cards (running section)
          var kpiDist = document.getElementById('kpi-dist');
          var kpiRuns = document.getElementById('kpi-runs');
          var kpiVo2  = document.getElementById('kpi-vo2');
          var kpiRhr  = document.getElementById('kpi-rhr');

          if (kpiDist && s.total_distance_km) {
            kpiDist.textContent = Math.round(s.total_distance_km).toLocaleString();
          }
          if (kpiRuns && s.total_runs && s.since_date) {
            var d0 = new Date(s.since_date);
            kpiRuns.textContent = 'Since ' + d0.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
              ' (' + s.total_runs + ' runs)';
          }
          if (kpiVo2 && s.current_vo2max) {
            kpiVo2.textContent = s.current_vo2max.toFixed(1);
          }
          if (kpiRhr && s.current_rhr) {
            kpiRhr.textContent = Math.round(s.current_rhr);
          }
        }

        if (!data || !data.activities || data.activities.length === 0) {
          detailsEl.innerHTML = '<p class="activity-empty">No runs yet — check back soon.</p>';
          return;
        }

        var a          = data.activities[0]; // latest run
        var latestGrid = grid.length ? grid[grid.length - 1] : null;

        var date    = a.date ? new Date(a.date) : null;
        var dateStr = date
          ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : '';

        // Time category
        var hour         = date ? date.getHours() : 8;
        var timeCategory = 'Run';
        if      (hour >= 5  && hour < 12) timeCategory = 'Morning Run';
        else if (hour >= 12 && hour < 17) timeCategory = 'Afternoon Run';
        else if (hour >= 17 && hour < 21) timeCategory = 'Evening Run';
        else                              timeCategory = 'Night Run';

        // Pace M:SS
        var paceStr = '';
        if (a.avg_pace_min_km) {
          var pm = Math.floor(a.avg_pace_min_km);
          var ps = Math.round((a.avg_pace_min_km - pm) * 60);
          paceStr = pm + ':' + (ps < 10 ? '0' : '') + ps + ' /km';
        }

        // Duration
        var durStr = '';
        if (a.duration_min) {
          if (a.duration_min >= 60) {
            var dh = Math.floor(a.duration_min / 60);
            var dm = Math.round(a.duration_min % 60);
            durStr = dh + 'h ' + dm + 'm';
          } else {
            durStr = Math.round(a.duration_min) + 'm';
          }
        }

        var html = '<div class="last-run-header">';
        html += '<span class="last-run-label">Latest Run</span>';
        html += '<span class="last-run-date">' + dateStr + '</span>';
        html += '</div>';
        html += '<div class="last-run-name">' + timeCategory + '</div>';
        html += '<div class="last-run-stats">';
        if (a.distance_km) html += '<div class="run-stat"><span class="run-stat-value">' + a.distance_km.toFixed(1) + '</span><span class="run-stat-unit">km</span></div>';
        if (durStr)        html += '<div class="run-stat"><span class="run-stat-value">' + durStr + '</span><span class="run-stat-unit">time</span></div>';
        if (paceStr)       html += '<div class="run-stat"><span class="run-stat-value">' + paceStr + '</span><span class="run-stat-unit">pace</span></div>';
        if (a.avg_hr)      html += '<div class="run-stat"><span class="run-stat-value">' + Math.round(a.avg_hr) + '</span><span class="run-stat-unit">bpm</span></div>';
        html += '</div>';

        detailsEl.innerHTML = html;

        // Render route silhouette
        if (pathEl && latestGrid && latestGrid.path) {
          var isTreadmill = latestGrid.path.indexOf('A 26 26') !== -1;
          if (isTreadmill) {
            var svgWrap = pathEl.parentNode;
            if (svgWrap && window.buildKaomojiSvg) {
              svgWrap.innerHTML = window.buildKaomojiSvg(latestGrid.color);
            }
          } else {
            pathEl.setAttribute('d', latestGrid.path);
            if (latestGrid.color) {
              pathEl.style.stroke  = latestGrid.color;
              pathEl.style.filter  = 'drop-shadow(0 4px 12px ' + latestGrid.color + '55)';
            }
            if (typeof pathEl.getTotalLength === 'function') {
              try {
                var len = pathEl.getTotalLength();
                if (len > 0) {
                  pathEl.style.strokeDasharray  = len;
                  pathEl.style.strokeDashoffset = len;
                  var spd = (latestGrid.spd && latestGrid.spd > 0) ? latestGrid.spd : 10.5;
                  var dur = Math.max(0.7, Math.min(3.0, 18 / spd));
                  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0;
                  pathEl.getBoundingClientRect();
                  pathEl.style.transition       = 'stroke-dashoffset ' + dur.toFixed(2) + 's cubic-bezier(0.25, 1, 0.5, 1)';
                  pathEl.style.strokeDashoffset = '0';
                }
              } catch (e) {}
            }
          }
        }

        if (cardEl && latestGrid) {
          cardEl.onclick = function () {
            if (window.openRunDetail) window.openRunDetail(latestGrid, grid);
          };
        }

        if (data.updated && updatedEl) {
          var u = new Date(data.updated);
          updatedEl.textContent = 'Last synced: ' + u.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          });
        }
      })
      .catch(function () {
        if (detailsEl) detailsEl.innerHTML = '<p class="activity-empty">Couldn\'t load run data right now.</p>';
      });
  }

  /* ── Muse Stories — with ARIA, Escape key support ────────────────────────── */
  var museKeydownAttached = false;

  function initMuseStories() {
    document.querySelectorAll('.muse').forEach(function (muse) {
      var toggle = muse.querySelector('.muse-toggle');
      var story  = muse.querySelector('.muse-story');
      if (!toggle || !story) return;

      // Wire up ARIA: give the story panel an id and point aria-controls at it
      var storyId = 'muse-story-' + (muse.id || Math.random().toString(36).substr(2, 6));
      if (!story.id) story.id = storyId;
      toggle.setAttribute('aria-controls', story.id);

      // Prevent duplicate click listeners if called multiple times
      if (toggle.dataset.museBound) return;
      toggle.dataset.museBound = 'true';

      toggle.addEventListener('click', function () {
        var isHidden = story.hidden;
        story.hidden = !isHidden;
        toggle.setAttribute('aria-expanded', String(isHidden));
        toggle.textContent = isHidden ? 'Close story -' : 'Story +';
      });
    });

    // Escape key closes any open muse stories (attached only once)
    if (!museKeydownAttached) {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          var openStories = document.querySelectorAll('.muse-story:not([hidden])');
          if (!openStories.length) return;
          openStories.forEach(function (story) {
            story.hidden = true;
            var muse = story.closest('.muse');
            var toggle = muse ? muse.querySelector('.muse-toggle') : null;
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'false');
              toggle.textContent = 'Story +';
              toggle.focus();
            }
          });
        }
      });
      museKeydownAttached = true;
    }
  }

  /* ── Public API (called by route-bg.js SPA engine) ──────────────────────── */
  window.initLastRunCard  = initLastRunCard;
  window.initMuseStories  = initMuseStories;
  window.initPersonalPage = function () {
    initLastRunCard();
    initMuseStories();
    if (window.initRunningCharts) window.initRunningCharts();
  };

  // Run immediately on hard page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLastRunCard();
      initMuseStories();
    });
  } else {
    initLastRunCard();
    initMuseStories();
  }
})();
