/**
 * Run Telemetry Modal
 * Interactive inspection dialog for individual runs from the 2026 Route Tapestry.
 * Displays normalized route geometry and detailed athletic metrics while strictly
 * preserving privacy (no raw GPS coordinates, street addresses, or map overlays).
 */
(function () {
  'use strict';

  var currentRunList = [];
  var currentIndex = -1;
  var modalEl = null;
  var backdropEl = null;

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function formatDateStr(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    var dt = new Date(y, m, d);
    var dayName = DAYS[dt.getDay()] || '';
    var monName = MONTHS[m] || '';
    return dayName + ', ' + monName + ' ' + d + ', ' + y;
  }

  function getTimeCategory(timeStr) {
    if (!timeStr) return 'Run';
    var hour = parseInt(timeStr.split(':')[0], 10);
    if (isNaN(hour)) return 'Run';
    if (hour >= 5 && hour < 12) return 'Morning Run';
    if (hour >= 12 && hour < 17) return 'Afternoon Run';
    if (hour >= 17 && hour < 21) return 'Evening Run';
    return 'Night Run';
  }

  function formatLocation(loc) {
    if (!loc) return 'Setagaya Ward, Tokyo';
    if (loc.indexOf('Bhopal') !== -1) return 'Bhopal, India';
    if (loc.indexOf('Santa Clara') !== -1) return 'Santa Clara, CA, USA';
    if (loc.indexOf('Ward') !== -1 || loc.indexOf('Tokyo') !== -1) return loc + ', Tokyo';
    return loc;
  }

  function formatDuration(durMin) {
    if (!durMin) return '-';
    var mins = Math.floor(durMin);
    var secs = Math.round((durMin - mins) * 60);
    if (secs >= 60) { mins += 1; secs = 0; }
    return mins + 'm ' + (secs < 10 ? '0' : '') + secs + 's';
  }

  function createModalDOM() {
    if (document.getElementById('run-detail-modal')) return;

    backdropEl = document.createElement('div');
    backdropEl.id = 'run-detail-backdrop';
    backdropEl.className = 'run-modal-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');

    modalEl = document.createElement('div');
    modalEl.id = 'run-detail-modal';
    modalEl.className = 'run-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', 'Run Details');

    modalEl.innerHTML =
      '<div class="run-modal-header">' +
      '<div class="run-modal-meta">' +
      '<div class="run-modal-date" id="run-m-date">Sunday, Nov 8, 2026</div>' +
      '<div class="run-modal-badges">' +
      '<span class="run-pill run-pill-time" id="run-m-time">08:09 · Morning Run</span>' +
      '<span class="run-pill run-pill-loc" id="run-m-loc">Setagaya Ward, Tokyo</span>' +
      '<span class="run-pill run-pill-wx" id="run-m-wx" style="display:none;"></span>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="run-modal-close" id="run-m-close" aria-label="Close dialog">×</button>' +
      '</div>' +

      '<div class="run-modal-body">' +
      '<div class="run-hero-layout">' +
      '<div class="run-route-hero">' +
      '<div class="run-route-canvas-wrap">' +
      '<svg id="run-m-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">' +
      '<path id="run-m-path" d="" />' +
      '</svg>' +
      '</div>' +
      '</div>' +

      '<div class="run-stats-grid">' +
      '<div class="run-stat-card highlight">' +
      '<span class="run-stat-label">Distance</span>' +
      '<span class="run-stat-value" id="run-m-dist">-</span>' +
      '</div>' +
      '<div class="run-stat-card">' +
      '<span class="run-stat-label">Duration</span>' +
      '<span class="run-stat-value" id="run-m-dur">-</span>' +
      '</div>' +
      '<div class="run-stat-card highlight">' +
      '<span class="run-stat-label">Avg Pace</span>' +
      '<span class="run-stat-value" id="run-m-pace">-</span>' +
      '</div>' +
      '<div class="run-stat-card">' +
      '<span class="run-stat-label">Speed</span>' +
      '<span class="run-stat-value" id="run-m-spd">-</span>' +
      '<span class="run-stat-sub" id="run-m-maxspd"></span>' +
      '</div>' +
      '<div class="run-stat-card">' +
      '<span class="run-stat-label">Heart Rate</span>' +
      '<span class="run-stat-value" id="run-m-hr">-</span>' +
      '<span class="run-stat-sub" id="run-m-maxhr"></span>' +
      '</div>' +
      '<div class="run-stat-card">' +
      '<span class="run-stat-label">Cadence</span>' +
      '<span class="run-stat-value" id="run-m-cadence">-</span>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '<div class="run-modal-footer">' +
      '<button type="button" class="run-nav-btn" id="run-m-prev">← Earlier Run</button>' +
      '<span class="run-modal-counter" id="run-m-counter">Run 1 of 1</span>' +
      '<button type="button" class="run-nav-btn" id="run-m-next">Later Run →</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(backdropEl);
    document.body.appendChild(modalEl);

    // Event listeners
    backdropEl.addEventListener('click', closeModal);
    document.getElementById('run-m-close').addEventListener('click', closeModal);

    document.getElementById('run-m-prev').addEventListener('click', function () {
      if (currentIndex > 0) {
        showRunAtIndex(currentIndex - 1);
      }
    });

    document.getElementById('run-m-next').addEventListener('click', function () {
      if (currentIndex < currentRunList.length - 1) {
        showRunAtIndex(currentIndex + 1);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!modalEl || !modalEl.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) showRunAtIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < currentRunList.length - 1) showRunAtIndex(currentIndex + 1);
      }
    });
  }

  function showRunAtIndex(idx) {
    if (!currentRunList || idx < 0 || idx >= currentRunList.length) return;
    currentIndex = idx;
    var r = currentRunList[idx];

    createModalDOM();

    // Populate header
    var dateEl = document.getElementById('run-m-date');
    if (dateEl) dateEl.textContent = formatDateStr(r.date);

    var isTreadmill = r.path && r.path.indexOf('A 26 26') !== -1;
    var timeEl = document.getElementById('run-m-time');
    if (timeEl) {
      var cat = isTreadmill ? 'Treadmill Run' : getTimeCategory(r.time);
      timeEl.textContent = (r.time || '') + ' · ' + cat;
    }

    var locEl = document.getElementById('run-m-loc');
    if (locEl) locEl.textContent = isTreadmill ? 'Indoor Treadmill' : formatLocation(r.loc);

    var wxPill = document.getElementById('run-m-wx');
    if (wxPill) {
      if (!isTreadmill && r.temp !== undefined && r.temp !== null) {
        var wxParts = [Math.round(r.temp) + '°C'];
        if (r.cond) wxParts.push(r.cond);
        if (r.wind !== undefined && r.wind !== null) wxParts.push(r.wind.toFixed(1) + ' km/h wind');
        if (r.humid !== undefined && r.humid !== null) wxParts.push(r.humid + '% humidity');
        wxPill.textContent = wxParts.join(' · ');
        wxPill.style.display = 'inline-flex';
      } else {
        wxPill.style.display = 'none';
      }
    }

    // Populate Route Path
    var svgWrap = document.getElementById('run-m-svg');
    var pathEl = document.getElementById('run-m-path');
    if (svgWrap && pathEl) {
      if (isTreadmill) {
        svgWrap.innerHTML = '<circle cx="56" cy="22" r="7.5" fill="' + (r.color || 'var(--dog)') + '"/><path d="M52 30 L45 52 L32 66 L24 82 M45 52 L62 63 L74 80 M35 42 L48 35 L64 39" fill="none" stroke="' + (r.color || 'var(--dog)') + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 4px 12px ' + (r.color || '#b5771f') + '66)"/>';
      } else {
        svgWrap.innerHTML = '<path id="run-m-path" d="' + (r.path || '') + '" style="stroke:' + (r.color || 'var(--dog)') + '; filter:drop-shadow(0 4px 12px ' + (r.color || '#b5771f') + '66);"/>';
      }
    }

    // Populate Telemetry Cards (Core 6 stats next to outline)
    var distEl = document.getElementById('run-m-dist');
    if (distEl) distEl.innerHTML = (r.dist ? r.dist.toFixed(2) : '-') + ' <small>km</small>';

    var durEl = document.getElementById('run-m-dur');
    if (durEl) durEl.textContent = formatDuration(r.dur);

    var paceEl = document.getElementById('run-m-pace');
    if (paceEl) paceEl.innerHTML = (r.pace || '-') + ' <small>/km</small>';

    var spdEl = document.getElementById('run-m-spd');
    if (spdEl) spdEl.innerHTML = (r.spd ? r.spd.toFixed(1) : '-') + ' <small>km/h</small>';

    var maxSpdEl = document.getElementById('run-m-maxspd');
    if (maxSpdEl) maxSpdEl.textContent = r.max_spd ? ('Max ' + r.max_spd.toFixed(1) + ' km/h') : '';

    var hrEl = document.getElementById('run-m-hr');
    if (hrEl) hrEl.innerHTML = (r.hr ? Math.round(r.hr) : '-') + ' <small>bpm</small>';

    var maxHrEl = document.getElementById('run-m-maxhr');
    if (maxHrEl) maxHrEl.textContent = r.max_hr ? ('Max ' + Math.round(r.max_hr) + ' bpm') : '';

    var cadEl = document.getElementById('run-m-cadence');
    if (cadEl) cadEl.innerHTML = (r.cadence ? Math.round(r.cadence) : '-') + ' <small>spm</small>';

    // Navigation buttons
    var prevBtn = document.getElementById('run-m-prev');
    if (prevBtn) prevBtn.disabled = (idx <= 0);

    var nextBtn = document.getElementById('run-m-next');
    if (nextBtn) nextBtn.disabled = (idx >= currentRunList.length - 1);

    var counterEl = document.getElementById('run-m-counter');
    if (counterEl) {
      counterEl.textContent = 'Run ' + (idx + 1) + ' of ' + currentRunList.length;
    }

    // Activate modal
    backdropEl.classList.add('active');
    modalEl.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function openRunModal(runData, list) {
    if (!runData) return;
    currentRunList = (list && list.length) ? list : [runData];
    var foundIdx = -1;
    for (var i = 0; i < currentRunList.length; i++) {
      if (currentRunList[i].id === runData.id) {
        foundIdx = i;
        break;
      }
    }
    showRunAtIndex(foundIdx >= 0 ? foundIdx : 0);
  }

  function closeModal() {
    if (backdropEl) backdropEl.classList.remove('active');
    if (modalEl) modalEl.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  // Expose global methods
  window.openRunDetail = openRunModal;
  window.closeRunDetail = closeModal;
})();

