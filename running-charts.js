/* Running & Health Analytics Charts - plain SVG, 0 external dependencies */
(function () {
  'use strict';

  function formatPace(paceMinKm) {
    if (!paceMinKm) return '';
    var mins = Math.floor(paceMinKm);
    var secs = Math.round((paceMinKm - mins) * 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function createSvg(w, h) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');
    return svg;
  }

  function addEl(parent, tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      el.setAttribute(k, attrs[k]);
    }
    parent.appendChild(el);
    return el;
  }

  // 1. Single-series Line Chart with Area fill
  function renderSingleSeriesChart(container, series, opts) {
    if (!container || !series || series.length < 2) return;
    container.innerHTML = '';

    var w = 680;
    var h = 220;
    var padL = 50;
    var padR = 25;
    var padT = 20;
    var padB = 35;

    var chartW = w - padL - padR;
    var chartH = h - padT - padB;

    var yMin = opts.yMin !== undefined ? opts.yMin : Infinity;
    var yMax = opts.yMax !== undefined ? opts.yMax : -Infinity;

    if (opts.yMin === undefined || opts.yMax === undefined) {
      for (var i = 0; i < series.length; i++) {
        var v = series[i].y;
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
      var ySpan = yMax - yMin || 1;
      if (opts.yMin === undefined) yMin = Math.floor(yMin - ySpan * 0.08);
      if (opts.yMax === undefined) yMax = Math.ceil(yMax + ySpan * 0.08);
    }

    var svg = createSvg(w, h);
    var gradId = 'grad-' + Math.random().toString(36).substr(2, 8);

    // Defs & Gradient
    var defs = addEl(svg, 'defs', {});
    var grad = addEl(defs, 'linearGradient', { id: gradId, x1: '0', y1: '0', x2: '0', y2: '1' });
    addEl(grad, 'stop', { offset: '0%', 'stop-color': opts.color || '#b5771f', 'stop-opacity': '0.35' });
    addEl(grad, 'stop', { offset: '100%', 'stop-color': opts.color || '#b5771f', 'stop-opacity': '0.02' });

    // Gridlines & Y-axis labels
    var gridSteps = 4;
    for (var g = 0; g <= gridSteps; g++) {
      var yVal = yMin + (g / gridSteps) * (yMax - yMin);
      var py = padT + chartH - (g / gridSteps) * chartH;

      addEl(svg, 'line', {
        x1: padL,
        y1: py,
        x2: padL + chartW,
        y2: py,
        stroke: 'var(--line)',
        'stroke-width': '1',
        'stroke-dasharray': g === 0 ? 'none' : '3 3'
      });

      var label = opts.yFormatter ? opts.yFormatter(yVal) : Math.round(yVal);
      var text = addEl(svg, 'text', {
        x: padL - 8,
        y: py + 4,
        'text-anchor': 'end',
        fill: 'var(--ink-3)',
        'font-family': 'var(--sans, sans-serif)',
        'font-size': '11px',
        'font-weight': '450'
      });
      text.textContent = label;
    }

    // Points & Path
    var pts = [];
    for (var j = 0; j < series.length; j++) {
      var px = padL + (j / (series.length - 1)) * chartW;
      var pyVal = padT + chartH - ((series[j].y - yMin) / (yMax - yMin)) * chartH;
      pts.push({ x: px, y: pyVal, data: series[j] });
    }

    // Area Path
    var areaD = 'M ' + pts[0].x + ' ' + (padT + chartH) + ' ';
    for (var a = 0; a < pts.length; a++) {
      areaD += 'L ' + pts[a].x + ' ' + pts[a].y + ' ';
    }
    areaD += 'L ' + pts[pts.length - 1].x + ' ' + (padT + chartH) + ' Z';
    addEl(svg, 'path', { d: areaD, fill: 'url(#' + gradId + ')' });

    // Line Path
    var lineD = 'M ';
    for (var l = 0; l < pts.length; l++) {
      lineD += (l === 0 ? '' : 'L ') + pts[l].x + ' ' + pts[l].y + ' ';
    }
    addEl(svg, 'path', {
      d: lineD,
      fill: 'none',
      stroke: opts.color || '#b5771f',
      'stroke-width': '2.4',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    });

    // Start & End Dots
    addEl(svg, 'circle', {
      cx: pts[0].x,
      cy: pts[0].y,
      r: '3.5',
      fill: opts.color || '#b5771f'
    });
    addEl(svg, 'circle', {
      cx: pts[pts.length - 1].x,
      cy: pts[pts.length - 1].y,
      r: '4.5',
      fill: 'var(--surface)',
      stroke: opts.color || '#b5771f',
      'stroke-width': '2.5'
    });

    // X-axis Milestone Labels (e.g. Jan 2024, Jan 2025, Jan 2026, Now)
    var xInterval = Math.max(1, Math.floor(series.length / 5));
    for (var xIdx = 0; xIdx < series.length; xIdx += xInterval) {
      var xPt = pts[xIdx];
      var xTxt = addEl(svg, 'text', {
        x: xPt.x,
        y: padT + chartH + 18,
        'text-anchor': xIdx === 0 ? 'start' : (xIdx + xInterval >= series.length ? 'end' : 'middle'),
        fill: 'var(--ink-3)',
        'font-family': 'var(--sans, sans-serif)',
        'font-size': '11px',
        'font-weight': '450'
      });
      xTxt.textContent = series[xIdx].label || series[xIdx].x;
    }

    // Tooltip overlay
    var tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    container.appendChild(tooltip);

    var crosshair = addEl(svg, 'line', {
      x1: 0, y1: padT, x2: 0, y2: padT + chartH,
      stroke: 'var(--ink-2)', 'stroke-width': '1', 'stroke-dasharray': '2 2', opacity: '0'
    });
    var hoverCircle = addEl(svg, 'circle', {
      cx: 0, cy: 0, r: '5', fill: 'var(--surface)', stroke: opts.color || '#b5771f', 'stroke-width': '2.5', opacity: '0'
    });

    container.appendChild(svg);

    // Mouse events
    function onMove(e) {
      var rect = svg.getBoundingClientRect();
      var clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      var mouseX = (clientX - rect.left) * (w / rect.width);

      if (mouseX < padL || mouseX > padL + chartW) {
        onLeave();
        return;
      }

      var frac = (mouseX - padL) / chartW;
      var idx = Math.min(pts.length - 1, Math.max(0, Math.round(frac * (pts.length - 1))));
      var p = pts[idx];

      crosshair.setAttribute('x1', p.x);
      crosshair.setAttribute('x2', p.x);
      crosshair.setAttribute('opacity', '0.6');

      hoverCircle.setAttribute('cx', p.x);
      hoverCircle.setAttribute('cy', p.y);
      hoverCircle.setAttribute('opacity', '1');

      var tipX = (p.x / w) * 100;
      var tipY = (p.y / h) * 100;
      tooltip.style.left = tipX + '%';
      tooltip.style.top = tipY + '%';
      tooltip.style.opacity = '1';

      var valStr = opts.tooltipFormatter ? opts.tooltipFormatter(p.data) : p.data.y + (opts.unit || '');
      tooltip.innerHTML = '<strong>' + p.data.x + '</strong><br>' + valStr;
    }

    function onLeave() {
      crosshair.setAttribute('opacity', '0');
      hoverCircle.setAttribute('opacity', '0');
      tooltip.style.opacity = '0';
    }

    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('mouseleave', onLeave);
    svg.addEventListener('touchmove', onMove, { passive: true });
    svg.addEventListener('touchend', onLeave);
  }

  // 2. Dual-series Line Chart for Pace & HR Progression
  function renderPaceHrChart(container, monthlyList) {
    if (!container || !monthlyList || monthlyList.length < 2) return;
    container.innerHTML = '';

    var w = 680;
    var h = 240;
    var padL = 45;
    var padR = 45;
    var padT = 25;
    var padB = 35;

    var chartW = w - padL - padR;
    var chartH = h - padT - padB;

    // Dynamic pace range from actual data
    var allPaces = monthlyList.map(function (m) { return m.pace; });
    var allHrs = monthlyList.map(function (m) { return m.hr; });

    var minPaceFound = Math.min.apply(null, allPaces);
    var maxPaceFound = Math.max.apply(null, allPaces);
    var minHrFound = Math.min.apply(null, allHrs);
    var maxHrFound = Math.max.apply(null, allHrs);

    // Faster pace at top (paceMin), slower pace at bottom (paceMax <= 7.5)
    var paceMin = Math.floor(minPaceFound * 10) / 10 - 0.2;
    var paceMax = Math.min(7.5, Math.ceil(maxPaceFound * 10) / 10 + 0.2);

    var hrMin = Math.floor(minHrFound / 5) * 5 - 5;
    var hrMax = Math.ceil(maxHrFound / 5) * 5 + 5;

    var svg = createSvg(w, h);

    // Gridlines (4 lines)
    var steps = 4;
    for (var g = 0; g <= steps; g++) {
      var py = padT + (g / steps) * chartH;
      addEl(svg, 'line', {
        x1: padL, y1: py, x2: padL + chartW, y2: py,
        stroke: 'var(--line)', 'stroke-width': '1', 'stroke-dasharray': g === steps ? 'none' : '3 3'
      });

      // Left axis label (Pace min/km - top is faster paceMin, bottom is slower paceMax)
      var curPace = paceMin + (g / steps) * (paceMax - paceMin);
      var pTxt = addEl(svg, 'text', {
        x: padL - 8, y: py + 4, 'text-anchor': 'end',
        fill: '#2563eb', 'font-family': 'var(--sans, sans-serif)', 'font-size': '10.5px', 'font-weight': '600'
      });
      pTxt.textContent = formatPace(curPace);

      // Right axis label (HR bpm - top is hrMax, bottom is hrMin)
      var curHr = Math.round(hrMax - (g / steps) * (hrMax - hrMin));
      var hTxt = addEl(svg, 'text', {
        x: padL + chartW + 8, y: py + 4, 'text-anchor': 'start',
        fill: '#e11d48', 'font-family': 'var(--sans, sans-serif)', 'font-size': '10.5px', 'font-weight': '600'
      });
      hTxt.textContent = curHr + ' bpm';
    }

    // Pace Points (inverted Y: lower value = faster = higher up, clamped to chart area)
    var pacePts = [];
    var hrPts = [];
    for (var i = 0; i < monthlyList.length; i++) {
      var m = monthlyList[i];
      var px = padL + (i / (monthlyList.length - 1)) * chartW;
      
      // Invert pace so faster is higher, clamp within bounds
      var normPace = Math.max(0, Math.min(1, (m.pace - paceMin) / (paceMax - paceMin)));
      var pyPace = padT + normPace * chartH;

      var normHr = Math.max(0, Math.min(1, (m.hr - hrMin) / (hrMax - hrMin)));
      var pyHr = padT + chartH - normHr * chartH;

      pacePts.push({ x: px, y: pyPace, val: m.pace, month: m.month });
      hrPts.push({ x: px, y: pyHr, val: m.hr, month: m.month });
    }

    // Pace Line (Blue)
    var paceD = 'M ';
    for (var pIdx = 0; pIdx < pacePts.length; pIdx++) {
      paceD += (pIdx === 0 ? '' : 'L ') + pacePts[pIdx].x + ' ' + pacePts[pIdx].y + ' ';
    }
    addEl(svg, 'path', {
      d: paceD, fill: 'none', stroke: '#2563eb', 'stroke-width': '2.6',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });

    // HR Line (Crimson/Rose)
    var hrD = 'M ';
    for (var hIdx = 0; hIdx < hrPts.length; hIdx++) {
      hrD += (hIdx === 0 ? '' : 'L ') + hrPts[hIdx].x + ' ' + hrPts[hIdx].y + ' ';
    }
    addEl(svg, 'path', {
      d: hrD, fill: 'none', stroke: '#e11d48', 'stroke-width': '2.6',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });

    // Start & End indicators
    addEl(svg, 'circle', { cx: pacePts[0].x, cy: pacePts[0].y, r: '3.5', fill: '#2563eb' });
    addEl(svg, 'circle', { cx: pacePts[pacePts.length - 1].x, cy: pacePts[pacePts.length - 1].y, r: '4.5', fill: 'var(--surface)', stroke: '#2563eb', 'stroke-width': '2.5' });
    addEl(svg, 'circle', { cx: hrPts[0].x, cy: hrPts[0].y, r: '3.5', fill: '#e11d48' });
    addEl(svg, 'circle', { cx: hrPts[hrPts.length - 1].x, cy: hrPts[hrPts.length - 1].y, r: '4.5', fill: 'var(--surface)', stroke: '#e11d48', 'stroke-width': '2.5' });

    // X-axis Milestone Labels
    var step = Math.floor(monthlyList.length / 5);
    for (var k = 0; k < monthlyList.length; k += step) {
      var xPos = padL + (k / (monthlyList.length - 1)) * chartW;
      var xLabel = monthlyList[k].month;
      var lbl = addEl(svg, 'text', {
        x: xPos, y: padT + chartH + 18,
        'text-anchor': k === 0 ? 'start' : (k + step >= monthlyList.length ? 'end' : 'middle'),
        fill: 'var(--ink-3)', 'font-family': 'var(--sans, sans-serif)', 'font-size': '11px', 'font-weight': '450'
      });
      lbl.textContent = xLabel;
    }

    // Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    container.appendChild(tooltip);

    var crosshair = addEl(svg, 'line', {
      x1: 0, y1: padT, x2: 0, y2: padT + chartH,
      stroke: '#45484e', 'stroke-width': '1', 'stroke-dasharray': '2 2', opacity: '0'
    });

    container.appendChild(svg);

    function onMove(e) {
      var rect = svg.getBoundingClientRect();
      var clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      var mouseX = (clientX - rect.left) * (w / rect.width);
      if (mouseX < padL || mouseX > padL + chartW) {
        crosshair.setAttribute('opacity', '0');
        tooltip.style.opacity = '0';
        return;
      }
      var frac = (mouseX - padL) / chartW;
      var idx = Math.min(monthlyList.length - 1, Math.max(0, Math.round(frac * (monthlyList.length - 1))));
      var m = monthlyList[idx];
      var px = padL + (idx / (monthlyList.length - 1)) * chartW;

      crosshair.setAttribute('x1', px);
      crosshair.setAttribute('x2', px);
      crosshair.setAttribute('opacity', '0.6');

      tooltip.style.left = (px / w * 100) + '%';
      tooltip.style.top = '30%';
      tooltip.style.opacity = '1';
      tooltip.innerHTML = '<strong>' + m.month + '</strong><br>' +
        '<span style="color:#60a5fa;">Pace: ' + formatPace(m.pace) + ' /km</span><br>' +
        '<span style="color:#fb7185;">Avg HR: ' + Math.round(m.hr) + ' bpm</span>';
    }

    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('mouseleave', function () {
      crosshair.setAttribute('opacity', '0');
      tooltip.style.opacity = '0';
    });
    svg.addEventListener('touchmove', onMove, { passive: true });
    svg.addEventListener('touchend', function () {
      crosshair.setAttribute('opacity', '0');
      tooltip.style.opacity = '0';
    });
  }

  // Main Dashboard Init
  function initDashboard() {
    var kpiDist = document.getElementById('kpi-dist');
    if (!kpiDist) return;

    fetch('garmin-activities.json')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) {
        if (!data) return;

        // Populate KPIs
        if (data.summary) {
          if (data.summary.total_distance_km) {
            kpiDist.textContent = Number(data.summary.total_distance_km).toLocaleString();
          }
          var kpiRuns = document.getElementById('kpi-runs');
          if (kpiRuns && data.summary.total_runs) {
            kpiRuns.textContent = 'Across ' + data.summary.total_runs + ' runs since Jan 1, 2024';
          }
          var kpiVo2 = document.getElementById('kpi-vo2');
          if (kpiVo2 && data.summary.current_vo2max) {
            kpiVo2.textContent = data.summary.current_vo2max;
          }
          var kpiRhr = document.getElementById('kpi-rhr');
          if (kpiRhr && data.summary.current_rhr) {
            kpiRhr.textContent = Math.round(data.summary.current_rhr);
          }

          // Dynamically adjust Running narrative numbers
          var runDistApprox = document.getElementById('run-dist-approx');
          if (runDistApprox && data.summary.total_distance_km) {
            var distKm = Number(data.summary.total_distance_km);
            var approxDist = Math.round(distKm / 50) * 50;
            runDistApprox.textContent = Number(approxDist).toLocaleString() + ' km';
            runDistApprox.title = 'Exact: ' + Number(distKm.toFixed(1)).toLocaleString() + ' km';
          }
          var runCountApprox = document.getElementById('run-count-approx');
          if (runCountApprox && data.summary.total_runs) {
            var runsCount = Number(data.summary.total_runs);
            var approxCount = Math.floor(runsCount / 50) * 50;
            runCountApprox.textContent = Number(approxCount).toLocaleString() + '+';
            runCountApprox.title = 'Exact: ' + runsCount + ' runs';
          }
          var runSinceText = document.getElementById('run-since-text');
          if (runSinceText && data.summary.since_date) {
            var dParts = data.summary.since_date.split('-');
            if (dParts.length >= 2) {
              var mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              var mIdx = parseInt(dParts[1], 10) - 1;
              if (mIdx >= 0 && mIdx < 12) {
                runSinceText.textContent = mNames[mIdx] + ' ' + dParts[0];
              }
            }
          }
        }

        // Recent pace & HR
        var kpiPace = document.getElementById('kpi-pace');
        if (kpiPace && data.timeseries && data.timeseries.pace_and_hr && data.timeseries.pace_and_hr.length > 0) {
          var latestTrend = data.timeseries.pace_and_hr[data.timeseries.pace_and_hr.length - 1];
          kpiPace.textContent = formatPace(latestTrend.pace);
        }

        // Yearly Grid
        var yearlyGrid = document.getElementById('yearly-grid');
        if (yearlyGrid && data.yearly) {
          var yHtml = '';
          for (var yr in data.yearly) {
            var yData = data.yearly[yr];
            yHtml += '<div class="yearly-card">';
            yHtml += '<div class="yearly-card-head">';
            yHtml += '<span class="yearly-year">' + yr + '</span>';
            yHtml += '<span class="yearly-runs">' + yData.runs + ' runs · ' + yData.duration_hours + ' hrs</span>';
            yHtml += '</div>';
            yHtml += '<div class="yearly-metrics">';
            yHtml += '<div><span>Distance</span><strong>' + Number(yData.distance_km).toLocaleString() + ' km</strong></div>';
            yHtml += '<div><span>Avg Pace</span><strong>' + formatPace(yData.avg_pace_min_km) + ' /km</strong></div>';
            yHtml += '<div><span>Avg HR</span><strong>' + (yData.avg_hr ? Math.round(yData.avg_hr) + ' bpm' : '-') + '</strong></div>';
            yHtml += '<div><span>Avg Distance</span><strong>' + (yData.distance_km / yData.runs).toFixed(1) + ' km</strong></div>';
            yHtml += '</div>';
            yHtml += '</div>';
          }
          yearlyGrid.innerHTML = yHtml;
        }

        // Timeseries Charts
        if (data.timeseries) {
          // 1. Cumulative Distance
          if (data.timeseries.cumulative_distance) {
            var cumSeries = data.timeseries.cumulative_distance.map(function (pt) {
              return { x: pt.date, y: pt.cum_km, label: pt.date.substr(0, 7) };
            });
            renderSingleSeriesChart(document.getElementById('chart-cumulative'), cumSeries, {
              color: '#b5771f',
              unit: ' km',
              yFormatter: function (v) { return Math.round(v) + ' km'; },
              tooltipFormatter: function (d) { return 'Cumulative: <strong>' + Number(d.y).toLocaleString() + ' km</strong>'; }
            });
          }

          // 2. Pace & HR Adaptation
          if (data.timeseries.pace_and_hr) {
            renderPaceHrChart(document.getElementById('chart-pace-hr'), data.timeseries.pace_and_hr);
          }

          // 3. VO2 Max
          if (data.timeseries.vo2max) {
            var vo2Series = data.timeseries.vo2max.map(function (pt) {
              return { x: pt.month, y: pt.vo2max, label: pt.month };
            });
            renderSingleSeriesChart(document.getElementById('chart-vo2max'), vo2Series, {
              color: '#16a34a',
              unit: ' ml/kg/min',
              yMin: 45,
              yMax: 60,
              yFormatter: function (v) { return Math.round(v); },
              tooltipFormatter: function (d) { return 'VO₂ Max: <strong>' + d.y + '</strong>'; }
            });
          }

          // 4. Resting Heart Rate (RHR)
          if (data.timeseries.rhr) {
            var rhrSeries = data.timeseries.rhr.map(function (pt) {
              return { x: pt.month, y: pt.avg_rhr, label: pt.month };
            });
            renderSingleSeriesChart(document.getElementById('chart-rhr'), rhrSeries, {
              color: '#8b5cf6',
              unit: ' bpm',
              yMin: 40,
              yMax: 60,
              yFormatter: function (v) { return Math.round(v) + ' bpm'; },
              tooltipFormatter: function (d) { return 'Avg RHR: <strong>' + d.y + ' bpm</strong>'; }
            });
          }
        }
      })
      .catch(function (err) {
        console.error('Error loading running stats:', err);
      });
  }

  function buildGridKaomojiSvg(color) {
    return window.buildKaomojiSvg ? window.buildKaomojiSvg(color) : '';
  }

  // Showcase Grid in Personal Page
  function initPersonalRunningGrid() {
    var container = document.getElementById('personal-grid-container');
    if (!container) return;

    // Create or reuse tooltip
    var tooltip = document.getElementById('personal-grid-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'personal-grid-tooltip';
      tooltip.className = 'route-grid-tooltip';
      document.body.appendChild(tooltip);
    }

    fetch('runs-2026-grid.json')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (runs) {
        if (!runs || !runs.length) return;

        container.innerHTML = '';
        var frag = document.createDocumentFragment();
        runs.forEach(function (r) {
          var tile = document.createElement('div');
          tile.className = 'personal-grid-tile';
          tile.setAttribute('data-id', r.id);
          var runColor = r.color || '#22c55e';
          tile.style.color = runColor;

          var isTreadmill = r.path && r.path.indexOf('A 26 26') !== -1;
          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 100 100');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          if (isTreadmill) {
            tile.classList.add('treadmill-tile');
            svg.innerHTML = buildGridKaomojiSvg(runColor);
          } else if (r.path) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', r.path);
            svg.appendChild(path);
          }

          tile.appendChild(svg);

          tile.addEventListener('mouseenter', function () {
            var rect = tile.getBoundingClientRect();
            tile.style.borderColor = runColor;
            tile.style.boxShadow = '0 6px 16px ' + runColor + '55';

            // Speed-contingent route trace on hover
            if (!isTreadmill) {
              var pathEl = svg.querySelector('path');
              if (pathEl && typeof pathEl.getTotalLength === 'function') {
                try {
                  var len = pathEl.getTotalLength();
                  if (len > 0) {
                    pathEl.style.transition = 'none';
                    pathEl.style.strokeDasharray = len;
                    pathEl.style.strokeDashoffset = len;
                    pathEl.getBoundingClientRect();
                    var spd = (r.spd && r.spd > 0) ? r.spd : 10.5;
                    var dur = Math.max(0.4, Math.min(1.4, 10 / spd));
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                      dur = 0;
                    }
                    pathEl.style.transition = 'stroke-dashoffset ' + dur.toFixed(2) + 's cubic-bezier(0.25, 1, 0.5, 1)';
                    pathEl.style.strokeDashoffset = '0';
                  }
                } catch (e) {}
              }
            }

            var locLabel = isTreadmill ? 'Treadmill Run' : r.loc;
            tooltip.innerHTML = '<strong>' + r.date + ' (' + r.time + ')' + (isTreadmill ? ' - Treadmill' : '') + '</strong><br>' +
              r.dist + ' km · <span style="color:' + runColor + '; font-weight:600;">' + r.pace + '/km (' + (r.spd ? r.spd + ' km/h' : '') + ')</span><br>' +
              '<span style="color:var(--ink-2);">' + locLabel + '</span>' + (r.hr ? ' · ' + Math.round(r.hr) + ' bpm' : '');
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            tooltip.style.top = rect.top + 'px';
            tooltip.style.opacity = '1';
          });

          tile.addEventListener('mouseleave', function () {
            tile.style.borderColor = '';
            tile.style.boxShadow = '';
            tooltip.style.opacity = '0';
          });

          tile.addEventListener('click', function () {
            tooltip.style.opacity = '0';
            if (window.openRunDetail) {
              window.openRunDetail(r, runs);
            }
          });

          frag.appendChild(tile);
        });

        container.appendChild(frag);
      })
      .catch(function (err) {
        container.innerHTML = '<p class="grid-loading">Unable to load route tapestry.</p>';
      });
  }

  function startAll() {
    initDashboard();
    initPersonalRunningGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAll);
  } else {
    startAll();
  }
})();

