/**
 * Swiss Volley / FIVB Official International Volleyball Game Report ("Grosses Matchblatt")
 * Exact 1:1 Vector SVG Layout matching Swiss Volley / FIVB Official Scoresheet (A4 Landscape 1684 x 1190)
 * 100% Offline, Zero External Dependencies
 */
(function (root) {
  'use strict';

  var FULL_W = 1684;
  var FULL_H = 1190;
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  // Exact 1:1 layout geometry measured directly from official Swiss Volley / FIVB Matchblatt PDF (1684 x 1190)
  var LAYOUT = {
    header:    { x: 18,   y: 24,  w: 1644, h: 150 },
    legend1:   { x: 18,   y: 212, w: 265,  h: 178 },
    set1:      { x: 283,  y: 182, w: 669,  h: 208 },
    set2:      { x: 960,  y: 182, w: 702,  h: 208 },
    legend3:   { x: 18,   y: 428, w: 265,  h: 178 },
    set3:      { x: 283,  y: 398, w: 669,  h: 208 },
    set4:      { x: 960,  y: 398, w: 702,  h: 208 },
    legend5:   { x: 18,   y: 645, w: 265,  h: 152 },
    set5:      { x: 283,  y: 615, w: 915,  h: 182 },
    rosters:   { x: 1204, y: 615, w: 458,  h: 549 },
    rosterA:   { x: 1204, y: 615, w: 227,  h: 549 },
    rosterB:   { x: 1435, y: 615, w: 227,  h: 549 },
    sanctions: { x: 18,   y: 803, w: 303,  h: 361 },
    remarks:   { x: 331,  y: 803, w: 568,  h: 120 },
    approval:  { x: 331,  y: 930, w: 568,  h: 234 },
    results:   { x: 908,  y: 803, w: 290,  h: 361 }
  };

  function unwrapState(stateOrDoc) {
    if (stateOrDoc && typeof stateOrDoc === 'object' && stateOrDoc.state && typeof stateOrDoc.state === 'object') {
      return stateOrDoc.state;
    }
    return stateOrDoc || {};
  }

  function esc(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function truncate(str, maxChars) {
    if (!str) return '';
    var s = String(str);
    if (s.length <= maxChars) return s;
    return s.slice(0, Math.max(1, maxChars - 1)) + '…';
  }

  function wrapLines(text, maxCharsPerLine, maxLines) {
    if (!text) return [];
    var paragraphs = String(text).split(/\r?\n/);
    var out = [];
    for (var p = 0; p < paragraphs.length; p++) {
      var line = paragraphs[p].trim();
      if (!line) {
        if (out.length < maxLines) out.push('');
        continue;
      }
      var words = line.split(/\s+/);
      var cur = '';
      for (var w = 0; w < words.length; w++) {
        var word = words[w];
        if (!cur) {
          cur = word;
        } else if (cur.length + 1 + word.length <= maxCharsPerLine) {
          cur += ' ' + word;
        } else {
          out.push(cur);
          cur = word;
          if (out.length >= maxLines) break;
        }
      }
      if (cur && out.length < maxLines) {
        out.push(cur);
      }
      if (out.length >= maxLines) break;
    }
    return out.slice(0, maxLines);
  }

  function hasOverride(state, key, fallbackKey) {
    var ov = state && state.manualOverrides;
    if (!ov || typeof ov !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(ov, key) && ov[key] !== undefined && ov[key] !== null) {
      return true;
    }
    if (fallbackKey && Object.prototype.hasOwnProperty.call(ov, fallbackKey) && ov[fallbackKey] !== undefined && ov[fallbackKey] !== null) {
      return true;
    }
    return false;
  }

  function resolveValue(state, key, computedValue, fallbackKey) {
    var ov = state && state.manualOverrides;
    if (ov && typeof ov === 'object') {
      if (Object.prototype.hasOwnProperty.call(ov, key) && ov[key] !== undefined && ov[key] !== null) {
        return String(ov[key]);
      }
      if (fallbackKey && Object.prototype.hasOwnProperty.call(ov, fallbackKey) && ov[fallbackKey] !== undefined && ov[fallbackKey] !== null) {
        return String(ov[fallbackKey]);
      }
    }
    return computedValue === null || computedValue === undefined ? '' : String(computedValue);
  }

  function parseMinutesDiff(startStr, endStr) {
    if (!startStr || !endStr) return null;
    var m1 = String(startStr).match(/^(\d{1,2}):(\d{2})$/);
    var m2 = String(endStr).match(/^(\d{1,2}):(\d{2})$/);
    if (!m1 || !m2) return null;
    var t1 = parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
    var t2 = parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
    if (t2 < t1) t2 += 24 * 60;
    return t2 - t1;
  }

  function inferGenderFromCategory(cat) {
    if (!cat) return '';
    var s = String(cat).toLowerCase();
    if (/\b(women|woman|frauen|damen|femmes|femminile|female|ladies|w)\b/.test(s)) return 'women';
    if (/\b(men|man|männer|maenner|herren|hommes|maschile|male|m)\b/.test(s)) return 'men';
    return '';
  }

  function inferAgeGroupFromCategory(cat) {
    if (!cat) return '';
    var m = String(cat).toUpperCase().match(/\b(U23|U21|U19|U18|U17|U16|U15)\b/);
    if (!m) return '';
    if (m[1] === 'U21') return 'U23';
    if (m[1] === 'U18') return 'U19';
    if (m[1] === 'U16') return 'U17';
    return m[1];
  }

  function isMatchStarted(state) {
    if (!state) return false;
    if (state.phase === 'live' || state.phase === 'finished' || state.phase === 'lineup') return true;
    var sets = Array.isArray(state.sets) ? state.sets : [];
    for (var i = 0; i < sets.length; i++) {
      var s = sets[i];
      if (s && (s.status === 'live' || s.status === 'finished' || s.status === 'lineup' || s.firstRallyPlayed)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Computes Endresultat table summary.
   */
  function getSummary(state) {
    var sets = Array.isArray(state.sets) ? state.sets : [];
    var rows = [];
    var totals = {
      A: { T: 0, S: 0, W: 0, P: 0 },
      B: { T: 0, S: 0, W: 0, P: 0 }
    };
    var totalDurationMin = 0;
    var hasAnyDuration = false;
    var matchStart = '';
    var matchEnd = '';

    for (var slot = 1; slot <= 5; slot++) {
      var setObj = null;
      if (state.meta && state.meta.bestOf === 3) {
        if (slot === 1) setObj = sets[0] || null;
        else if (slot === 2) setObj = sets[1] || null;
        else if (slot === 5) setObj = sets[2] || null;
      } else {
        setObj = sets[slot - 1] || null;
      }

      var played = !!(
        setObj &&
        (setObj.status === 'live' ||
          setObj.status === 'finished' ||
          (setObj.points && (setObj.points.A > 0 || setObj.points.B > 0)))
      );

      if (!played || !setObj) {
        rows.push({
          slot: slot,
          played: false,
          status: setObj ? setObj.status : 'pending',
          durationMin: null,
          A: { T: '', S: '', W: '', P: '' },
          B: { T: '', S: '', W: '', P: '' }
        });
        continue;
      }

      if (!matchStart && setObj.startTime) matchStart = setObj.startTime;
      if (setObj.endTime) matchEnd = setObj.endTime;

      var tA = Array.isArray(setObj.timeouts && setObj.timeouts.A) ? setObj.timeouts.A.length : 0;
      var tB = Array.isArray(setObj.timeouts && setObj.timeouts.B) ? setObj.timeouts.B.length : 0;
      var sA = (setObj.subCount && typeof setObj.subCount.A === 'number') ? setObj.subCount.A : 0;
      var sB = (setObj.subCount && typeof setObj.subCount.B === 'number') ? setObj.subCount.B : 0;
      var pA = (setObj.points && typeof setObj.points.A === 'number') ? setObj.points.A : 0;
      var pB = (setObj.points && typeof setObj.points.B === 'number') ? setObj.points.B : 0;
      var wA = setObj.winner === 'A' ? 1 : (setObj.status === 'finished' ? 0 : '');
      var wB = setObj.winner === 'B' ? 1 : (setObj.status === 'finished' ? 0 : '');

      var dur = typeof setObj.durationMin === 'number'
        ? setObj.durationMin
        : parseMinutesDiff(setObj.startTime, setObj.endTime);

      if (typeof dur === 'number' && !isNaN(dur)) {
        totalDurationMin += dur;
        hasAnyDuration = true;
      }

      totals.A.T += tA;
      totals.B.T += tB;
      totals.A.S += sA;
      totals.B.S += sB;
      totals.A.P += pA;
      totals.B.P += pB;
      if (setObj.winner === 'A') totals.A.W += 1;
      if (setObj.winner === 'B') totals.B.W += 1;

      rows.push({
        slot: slot,
        played: true,
        status: setObj.status,
        durationMin: dur,
        A: { T: tA, S: sA, W: wA, P: pA },
        B: { T: tB, S: sB, W: wB, P: pB }
      });
    }

    var bestOf = (state.meta && state.meta.bestOf === 3) ? 3 : 5;
    var setsNeeded = Math.ceil(bestOf / 2);
    var matchWinner = state.matchWinner || null;
    if (!matchWinner) {
      if (totals.A.W >= setsNeeded) matchWinner = 'A';
      else if (totals.B.W >= setsNeeded) matchWinner = 'B';
    }

    var totalWallMin = parseMinutesDiff(matchStart, matchEnd);

    return {
      rows: rows,
      totals: totals,
      totalDurationMin: hasAnyDuration ? totalDurationMin : null,
      matchWallDurationMin: totalWallMin !== null ? totalWallMin : (hasAnyDuration ? totalDurationMin : null),
      matchStart: matchStart,
      matchEnd: matchEnd,
      matchWinner: matchWinner
    };
  }

  /**
   * Embedded SVG stylesheet for 100% standalone vector crispness (matching Swiss Volley black print + blue scorer ink).
   */
  function getEmbeddedCSS(options) {
    var printMode = !!(options && options.printMode);
    return [
      '.mb-bg { fill: #ffffff; }',
      '.mb-box { fill: #ffffff; stroke: #111111; stroke-width: 1.05; }',
      '.mb-box-thin { fill: #ffffff; stroke: #111111; stroke-width: 0.7; }',
      '.mb-grid { stroke: #111111; stroke-width: 0.65; fill: none; }',
      '.mb-grid-thin { stroke: #222222; stroke-width: 0.45; fill: none; }',
      '.mb-grid-strong { stroke: #111111; stroke-width: 1.15; fill: none; }',
      '.mb-dotted { stroke: #333333; stroke-width: 0.55; stroke-dasharray: 1.1 1.8; fill: none; }',
      '.mb-fnt { font-family: "Helvetica Neue", Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #111111; }',
      '.mb-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }',
      '.mb-ink { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Segoe UI", sans-serif; fill: #0d3b94; font-weight: 700; }',
      '.mb-ink-sans { font-family: "Helvetica Neue", Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0d3b94; font-weight: 700; }',
      '.mb-ink-stroke { stroke: #0d3b94; fill: none; stroke-linecap: round; stroke-linejoin: round; }',
      '.mb-red-stroke { stroke: #b91c1c; fill: none; stroke-linecap: round; stroke-linejoin: round; }',
      '.mb-muted { fill: #222222; }',
      '.mb-faint { fill: #444444; }',
      '.mb-white { fill: #ffffff; }',
      '.mb-cell-hit { fill: transparent; stroke: none; }',
      printMode
        ? '.mb-highlight { display: none; }'
        : '.mb-highlight { fill: #fbbf24; fill-opacity: 0.38; stroke: #d97706; stroke-width: 1.7; pointer-events: none; }'
    ].join('\n');
  }

  /**
   * Lookup helper for active state.highlights descriptors.
   */
  function createHighlightMatcher(state, enabled) {
    var list = (enabled && state && Array.isArray(state.highlights)) ? state.highlights : [];
    var matchedCount = 0;

    function normField(h) {
      return String(h.field || h.kind || h.target || h.type || '').toLowerCase();
    }

    function matchesSetIndex(h, setIdx) {
      if (h.setIndex !== undefined && h.setIndex !== null) {
        return Number(h.setIndex) === Number(setIdx);
      }
      if (h.set !== undefined && h.set !== null) {
        return Number(h.set) - 1 === Number(setIdx);
      }
      return false;
    }

    return {
      hasAny: list.length > 0,
      markMatched: function () { matchedCount++; },
      getMatchedCount: function () { return matchedCount; },
      raw: list,

      cellKey: function (key) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h) continue;
          if (typeof h === 'string' && h === key) {
            matchedCount++;
            return true;
          }
          if (h.cellKey && h.cellKey === key) {
            matchedCount++;
            return true;
          }
        }
        return false;
      },

      point: function (setIdx, team, pt, panelMode) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          var f = normField(h);
          if (!matchesSetIndex(h, setIdx)) continue;
          if (h.team && h.team !== team) continue;
          if (f === 'score' || f === 'point' || h.point !== undefined) {
            if (h.point !== undefined && Number(h.point) === Number(pt)) {
              if (panelMode === 'pre' && h.postSwitch === true) continue;
              if (panelMode === 'post' && h.postSwitch === false) continue;
              matchedCount++;
              return true;
            }
          }
        }
        return false;
      },

      serviceTurn: function (setIdx, team, colIdx, turnIdx) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          if (!matchesSetIndex(h, setIdx)) continue;
          if (h.team && h.team !== team) continue;
          var f = normField(h);
          var c = h.col !== undefined ? h.col : (h.posIndex !== undefined ? h.posIndex : h.position);
          if ((f === 'service' || f === 'rotation' || f === 'sideout' || f === 'win') && (c === undefined || Number(c) === Number(colIdx))) {
            if (h.turnIndex === undefined || Number(h.turnIndex) === Number(turnIdx)) {
              matchedCount++;
              return true;
            }
          }
        }
        return false;
      },

      sub: function (setIdx, team, colIdx) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          if (!matchesSetIndex(h, setIdx)) continue;
          if (h.team && h.team !== team) continue;
          var f = normField(h);
          var c = h.col !== undefined ? h.col : (h.posIndex !== undefined ? h.posIndex : h.position);
          if ((f === 'sub' || f === 'substitution') && (c === undefined || Number(c) === Number(colIdx))) {
            matchedCount++;
            return true;
          }
        }
        return false;
      },

      lineup: function (setIdx, team) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          if (!matchesSetIndex(h, setIdx)) continue;
          if (h.team && h.team !== team) continue;
          var f = normField(h);
          if (f === 'lineup' || f === 'start' || f === 'set_start') {
            matchedCount++;
            return true;
          }
        }
        return false;
      },

      timeout: function (setIdx, team, tIdx) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          if (!matchesSetIndex(h, setIdx)) continue;
          if (h.team && h.team !== team) continue;
          var f = normField(h);
          if (f === 'timeout') {
            if (h.timeoutIndex === undefined || Number(h.timeoutIndex) === Number(tIdx)) {
              matchedCount++;
              return true;
            }
          }
        }
        return false;
      },

      switch8: function (setIdx) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          var f = normField(h);
          if (f === 'switch8' || h.switch8) {
            if (h.setIndex === undefined || Number(h.setIndex) === Number(setIdx)) {
              matchedCount++;
              return true;
            }
          }
        }
        return false;
      },

      section: function (secName) {
        for (var i = 0; i < list.length; i++) {
          var h = list[i];
          if (!h || typeof h !== 'object') continue;
          if (String(h.section || '').toLowerCase() === secName.toLowerCase() || normField(h) === secName.toLowerCase()) {
            matchedCount++;
            return true;
          }
        }
        return false;
      }
    };
  }

  function renderHighlightRect(x, y, w, h, rx) {
    return '<rect class="mb-highlight" x="' + (x + 0.5).toFixed(1) + '" y="' + (y + 0.5).toFixed(1) + '" width="' + Math.max(2, w - 1).toFixed(1) + '" height="' + Math.max(2, h - 1).toFixed(1) + '" rx="' + (rx || 1.5) + '" />';
  }

  /**
   * Editable cell text helper with manualOverrides and interactive data-cell-key hit zone.
   */
  function renderEditableText(cfg) {
    var state = cfg.state;
    var interactive = cfg.interactive;
    var hl = cfg.hl;
    var key = cfg.key;
    var fallbackKey = cfg.fallbackKey;
    var label = cfg.label || key;
    var x = cfg.x;
    var y = cfg.y;
    var w = cfg.w;
    var h = cfg.h;
    var rawComputed = cfg.value;
    var val = resolveValue(state, key, rawComputed, fallbackKey);
    var overridden = hasOverride(state, key, fallbackKey);
    var maxChars = cfg.maxChars || 0;
    var displayVal = maxChars > 0 ? truncate(val, maxChars) : val;
    var align = cfg.align || 'center';
    var fontSize = cfg.fontSize || 10.5;
    var cls = cfg.cls || 'mb-ink-sans';
    var extraSvg = cfg.extraSvg || '';

    var padX = cfg.padX !== undefined ? cfg.padX : 3.5;
    var tx = align === 'left'
      ? (x + padX)
      : (align === 'right' ? (x + w - padX) : (x + w / 2 + (cfg.offsetX || 0)));
    var anchor = align === 'left' ? 'start' : (align === 'right' ? 'end' : 'middle');
    var ty = cfg.textY !== undefined ? cfg.textY : (y + h / 2 + fontSize * 0.35);

    var parts = [];
    if (hl && hl.cellKey(key)) {
      parts.push(renderHighlightRect(x, y, w, h, 1.5));
    }

    if (interactive) {
      var groupCls = overridden ? ' class="mb-overridden"' : '';
      parts.push(
        '<g' + groupCls + ' data-cell-key="' + esc(key) + '" data-cell-label="' + esc(label) + '" data-cell-value="' + esc(val) + '">'
      );
      parts.push('<rect class="mb-cell-hit" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" />');
    }

    if (displayVal !== '') {
      var colonMatch = cfg.colonSplit ? String(displayVal).match(/^([^:]+):([^:]+)$/) : null;
      if (colonMatch) {
        var cMid = x + w / 2;
        parts.push(
          '<text class="' + cls + '" x="' + (cMid - 3.5).toFixed(1) + '" y="' + ty.toFixed(1) + '" font-size="' + fontSize + '" text-anchor="end">' + esc(colonMatch[1].trim()) + '</text>'
        );
        parts.push(
          '<text class="' + cls + '" x="' + (cMid + 3.5).toFixed(1) + '" y="' + ty.toFixed(1) + '" font-size="' + fontSize + '" text-anchor="start">' + esc(colonMatch[2].trim()) + '</text>'
        );
      } else {
        parts.push(
          '<text class="' + cls + '" x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" font-size="' + fontSize + '" text-anchor="' + anchor + '">' + esc(displayVal) + '</text>'
        );
      }
    }
    if (extraSvg) parts.push(extraSvg);

    if (interactive) {
      parts.push('</g>');
    }
    return parts.join('');
  }

  /**
   * Renders a 3-line German / French / Italian small label block.
   */
  function renderTriLabel(x, y, lines, fontSize, lineStep, weight, anchor) {
    var fs = fontSize || 6.3;
    var step = lineStep || (fs + 1.35);
    var fw = weight || '500';
    var ta = anchor || 'start';
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      out.push(
        '<text class="mb-fnt" x="' + x.toFixed(1) + '" y="' + (y + i * step).toFixed(1) +
        '" font-size="' + fs + '" font-weight="' + fw + '" text-anchor="' + ta + '">' + esc(lines[i]) + '</text>'
      );
    }
    return out.join('');
  }

  /**
   * Renders an official Swiss Volley square checkbox [ ] with crisp ink X when checked.
   */
  function renderCheckbox(x, y, size, checked) {
    var out = [];
    out.push('<rect fill="#ffffff" stroke="#111111" stroke-width="0.75" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + size + '" height="' + size + '" />');
    if (checked) {
      var p = 2.6;
      out.push(
        '<path class="mb-ink-stroke" stroke-width="2.1" d="M' + (x + p).toFixed(1) + ',' + (y + p).toFixed(1) +
        ' L' + (x + size - p).toFixed(1) + ',' + (y + size - p).toFixed(1) +
        ' M' + (x + size - p).toFixed(1) + ',' + (y + p).toFixed(1) +
        ' L' + (x + p).toFixed(1) + ',' + (y + size - p).toFixed(1) + '" />'
      );
    }
    return out.join('');
  }

  /**
   * Renders SwissVolley stylized swoosh + wordmark (top-left) and FIVB emblem (top-right),
   * plus right-margin vertical copyright string.
   */
  function renderOfficialLogosAndCopyright() {
    var out = [];

    // 1. SwissVolley vector logo (x: 18..265, y: 22..118)
    out.push('<g id="mb-logo-swissvolley">');
    // Volleyball sphere top-right of swoosh
    out.push('<circle cx="131" cy="31" r="8.8" fill="#111111" />');
    out.push('<path d="M124,28 Q131,32 138,27 M125,35 Q132,31 139,34" stroke="#ffffff" stroke-width="1.1" fill="none" />');
    // Upper dynamic arc swoosh
    out.push(
      '<path fill="#111111" d="M97,38 C76,43 58,56 59,65 C60,72 80,74 114,65 C84,68 71,65 71,60 C71,53 84,45 103,41 Z" />'
    );
    // Main sweeping court/player arc swoosh
    out.push(
      '<path fill="#111111" d="M138,44 C149,50 144,64 115,74 C86,84 48,86 41,77 C36,71 45,61 62,54 C49,62 47,69 53,73 C63,79 94,75 118,65 C134,58 139,50 132,45 Z" />'
    );
    // Bold italic SwissVolley wordmark
    out.push(
      '<text class="mb-fnt" x="18" y="114" font-size="35" font-weight="900" font-style="italic" letter-spacing="-0.8">SwissVolley</text>'
    );
    out.push('</g>');

    // 2. FIVB vector logo (x: 1418..1646, y: 28..120)
    out.push('<g id="mb-logo-fivb">');
    // Geometric bold FIVB letters
    out.push(
      '<text class="mb-fnt" x="1532" y="73" font-size="48" font-weight="900" letter-spacing="1.5" text-anchor="middle">FIVB</text>'
    );
    out.push('<text class="mb-fnt" x="1598" y="73" font-size="5" font-weight="700">TM</text>');
    // Official FIVB double horizon arc
    out.push(
      '<path fill="#111111" d="M1436,93 Q1532,68 1628,93 Q1532,75 1436,93 Z" />'
    );
    out.push(
      '<path fill="#111111" d="M1462,96 Q1532,80 1602,96 Q1532,85 1462,96 Z" />'
    );
    out.push(
      '<text class="mb-fnt" x="1532" y="107" font-size="7.2" font-weight="700" letter-spacing="0.4" text-anchor="middle">FÉDÉRATION INTERNATIONALE</text>'
    );
    out.push(
      '<text class="mb-fnt" x="1532" y="116.5" font-size="7.2" font-weight="700" letter-spacing="0.4" text-anchor="middle">DE VOLLEYBALL</text>'
    );
    out.push('</g>');

    // 3. Right-edge vertical copyright notice (matching PDF)
    out.push(
      '<text class="mb-fnt" x="1675" y="420" font-size="6.8" text-anchor="middle" transform="rotate(-90 1675 420)">' +
      'Copyright: Swiss Volley, 3000 Bern   -   Nachdruck verboten – reproduction interdite – ristampa vietata' +
      '</text>'
    );

    return out.join('');
  }

  /**
   * 1. Top Band Header (x=18..1662, y=24..174) — 1:1 with Swiss Volley PDF
   */
  function renderTopHeader(state, interactive, hl) {
    var meta = state.meta || {};
    var teams = state.teams || {};
    var teamA = teams.A || {};
    var teamB = teams.B || {};
    var started = isMatchStarted(state);
    var out = [];

    out.push('<g id="mb-section-header">');
    if (hl && hl.section('header')) {
      out.push(renderHighlightRect(448, 42, 910, 82, 2));
    }

    out.push(renderOfficialLogosAndCopyright());

    // --- ROW 1A: 4 Top Header Boxes (y = 44 .. 122, h = 78) ---
    var topY = 44;
    var topH = 78;
    var cbSize = 18;

    // Box 1: Match Type (x = 450, w = 199)
    var b1x = 450, b1w = 199;
    var matchTypeVal = resolveValue(
      state,
      'meta.matchType',
      meta.matchType !== undefined ? meta.matchType : ''
    ).toLowerCase();

    out.push('<rect class="mb-box-thin" x="' + b1x + '" y="' + topY + '" width="' + b1w + '" height="' + topH + '" />');
    out.push(renderTriLabel(b1x + 7, topY + 11, ['Meisterschaft', 'Championnat', 'Campionato'], 6.5, 7.6));
    out.push(renderCheckbox(b1x + 88, topY + 8, cbSize, matchTypeVal === 'championship' || matchTypeVal === 'meisterschaft'));

    out.push(renderTriLabel(b1x + 132, topY + 11, ['Cup', 'Coupe', 'Coppa'], 6.5, 7.6));
    out.push(renderCheckbox(b1x + 172, topY + 8, cbSize, matchTypeVal === 'cup' || matchTypeVal === 'coupe'));

    out.push(renderTriLabel(b1x + 7, topY + 50, ['Freundschaftsspiel', 'Match amical', 'Incontro amichevole'], 6.3, 7.5));
    out.push(renderCheckbox(b1x + 88, topY + 48, cbSize, matchTypeVal === 'friendly' || matchTypeVal === 'freundschaftsspiel'));

    out.push(renderTriLabel(b1x + 132, topY + 50, ['Turnier', 'Tournoi', 'Torneo'], 6.5, 7.6));
    out.push(renderCheckbox(b1x + 172, topY + 48, cbSize, matchTypeVal === 'tournament' || matchTypeVal === 'turnier'));

    if (interactive) {
      out.push(
        '<g data-cell-key="meta.matchType" data-cell-label="Match Type (championship/cup/friendly/tournament)" data-cell-value="' + esc(matchTypeVal) + '">' +
        '<rect class="mb-cell-hit" x="' + b1x + '" y="' + topY + '" width="' + b1w + '" height="' + topH + '" /></g>'
      );
    }

    // Box 2: Competition Level (x = 659, w = 199)
    var b2x = 659, b2w = 199;
    var levelVal = resolveValue(
      state,
      'meta.level',
      meta.level !== undefined ? meta.level : ''
    ).toLowerCase();

    out.push('<rect class="mb-box-thin" x="' + b2x + '" y="' + topY + '" width="' + b2w + '" height="' + topH + '" />');
    out.push(renderTriLabel(b2x + 7, topY + 11, ['National', 'National', 'Nazionale'], 6.5, 7.6));
    out.push(renderCheckbox(b2x + 74, topY + 8, cbSize, levelVal === 'national'));

    out.push(renderTriLabel(b2x + 112, topY + 11, ['Regional', 'Régional', 'Regionale'], 6.5, 7.6));
    out.push(renderCheckbox(b2x + 172, topY + 8, cbSize, levelVal === 'regional'));

    out.push(renderTriLabel(b2x + 7, topY + 50, ['International', 'International', 'Internazionale'], 6.5, 7.6));
    out.push(renderCheckbox(b2x + 74, topY + 48, cbSize, levelVal === 'international'));

    out.push('<line class="mb-dotted" x1="' + (b2x + 112) + '" y1="' + (topY + 66) + '" x2="' + (b2x + 168) + '" y2="' + (topY + 66) + '" />');
    var customLevel = levelVal && levelVal !== 'national' && levelVal !== 'regional' && levelVal !== 'international';
    if (customLevel) {
      out.push('<text class="mb-ink-sans" x="' + (b2x + 140) + '" y="' + (topY + 63) + '" font-size="8" text-anchor="middle">' + esc(truncate(levelVal, 9)) + '</text>');
    }
    out.push(renderCheckbox(b2x + 172, topY + 48, cbSize, customLevel));

    if (interactive) {
      out.push(
        '<g data-cell-key="meta.level" data-cell-label="Level (national/regional/international)" data-cell-value="' + esc(levelVal) + '">' +
        '<rect class="mb-cell-hit" x="' + b2x + '" y="' + topY + '" width="' + b2w + '" height="' + topH + '" /></g>'
      );
    }

    // Box 3: Gender & Age Group (x = 867, w = 230)
    var b3x = 867, b3w = 230;
    var computedGender = meta.gender !== undefined ? meta.gender : inferGenderFromCategory(meta.category);
    var genderVal = resolveValue(state, 'meta.gender', computedGender).toLowerCase();
    var computedAge = meta.ageGroup !== undefined ? meta.ageGroup : inferAgeGroupFromCategory(meta.category);
    var ageVal = resolveValue(state, 'meta.ageGroup', computedAge).toUpperCase();

    out.push('<rect class="mb-box-thin" x="' + b3x + '" y="' + topY + '" width="' + b3w + '" height="' + topH + '" />');
    out.push(renderTriLabel(b3x + 7, topY + 11, ['Männer', 'Hommes', 'Maschile'], 6.5, 7.6));
    out.push(renderCheckbox(b3x + 56, topY + 8, cbSize, genderVal === 'men' || genderVal === 'männer' || genderVal === 'male'));

    out.push(renderTriLabel(b3x + 7, topY + 50, ['Frauen', 'Femmes', 'Femminile'], 6.5, 7.6));
    out.push(renderCheckbox(b3x + 56, topY + 48, cbSize, genderVal === 'women' || genderVal === 'frauen' || genderVal === 'female'));

    // Junior age groups (U23, U19, U17)
    out.push('<text class="mb-fnt" x="' + (b3x + 112) + '" y="' + (topY + 21) + '" font-size="7.2" text-anchor="end">U23</text>');
    out.push(renderCheckbox(b3x + 117, topY + 8, cbSize, ageVal === 'U23'));

    out.push('<text class="mb-fnt" x="' + (b3x + 112) + '" y="' + (topY + 61) + '" font-size="7.2" text-anchor="end">U19</text>');
    out.push(renderCheckbox(b3x + 117, topY + 48, cbSize, ageVal === 'U19'));

    out.push('<text class="mb-fnt" x="' + (b3x + 196) + '" y="' + (topY + 21) + '" font-size="7.2" text-anchor="end">U17</text>');
    out.push(renderCheckbox(b3x + 201, topY + 8, cbSize, ageVal === 'U17'));

    var customAge = !!(ageVal && ageVal !== 'U23' && ageVal !== 'U19' && ageVal !== 'U17' && ageVal !== 'SENIOR' && ageVal !== 'AKTIVE');
    out.push('<line class="mb-dotted" x1="' + (b3x + 148) + '" y1="' + (topY + 66) + '" x2="' + (b3x + 197) + '" y2="' + (topY + 66) + '" />');
    if (customAge) {
      out.push('<text class="mb-ink-sans" x="' + (b3x + 173) + '" y="' + (topY + 63) + '" font-size="7.5" text-anchor="middle">' + esc(truncate(ageVal, 7)) + '</text>');
    }
    out.push(renderCheckbox(b3x + 201, topY + 48, cbSize, customAge));

    if (interactive) {
      out.push(
        '<g data-cell-key="meta.gender" data-cell-label="Gender (women/men)" data-cell-value="' + esc(genderVal) + '">' +
        '<rect class="mb-cell-hit" x="' + b3x + '" y="' + topY + '" width="85" height="' + topH + '" /></g>'
      );
      out.push(
        '<g data-cell-key="meta.ageGroup" data-cell-label="Age Group (U23/U19/U17 or empty)" data-cell-value="' + esc(ageVal) + '">' +
        '<rect class="mb-cell-hit" x="' + (b3x + 85) + '" y="' + topY + '" width="' + (b3w - 85) + '" height="' + topH + '" /></g>'
      );
    }

    // Box 4: League Designation & Match Number (x = 1107, w = 248)
    var b4x = 1107, b4w = 248;
    var b4MidY = topY + 39;
    out.push('<rect class="mb-box-thin" x="' + b4x + '" y="' + topY + '" width="' + b4w + '" height="' + topH + '" />');
    out.push('<line class="mb-grid" x1="' + b4x + '" y1="' + b4MidY + '" x2="' + (b4x + b4w) + '" y2="' + b4MidY + '" />');

    out.push(renderTriLabel(b4x + 6, topY + 11, ['Bezeichnung der Liga', 'Désignation de la ligue', 'Designazione della lega'], 6.4, 7.6));
    out.push('<line class="mb-dotted" x1="' + (b4x + 86) + '" y1="' + (b4MidY - 7) + '" x2="' + (b4x + b4w - 6) + '" y2="' + (b4MidY - 7) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'meta.competition', label: 'Bezeichnung der Liga / Competition',
      x: b4x + 86, y: topY + 6, w: b4w - 92, h: 30,
      value: meta.competition || '', align: 'left', fontSize: 12, maxChars: 22
    }));

    out.push(renderTriLabel(b4x + 6, b4MidY + 11, ['Spiel Nr.', 'Match No', 'No dell\'incontro'], 6.4, 7.6));
    out.push('<line class="mb-dotted" x1="' + (b4x + 66) + '" y1="' + (topY + topH - 7) + '" x2="' + (b4x + b4w - 6) + '" y2="' + (topY + topH - 7) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'meta.matchNumber', label: 'Spiel Nr. / Match Number',
      x: b4x + 66, y: b4MidY + 6, w: b4w - 72, h: 30,
      value: meta.matchNumber || '', align: 'left', cls: 'mb-ink', fontSize: 12.5, maxChars: 18
    }));

    // --- ROW 1B: Teams, Ort, Halle, Datum, Zeit (y = 131 .. 174, h = 43) ---
    var subY = 131;
    var subH = 43;

    // 1B-1: Mannschaften / Equipes / Squadre (x = 18, w = 589)
    var tbx = 18, tbw = 589;
    out.push('<rect class="mb-box-thin" x="' + tbx + '" y="' + subY + '" width="' + tbw + '" height="' + subH + '" />');
    out.push('<text class="mb-fnt" x="' + (tbx + tbw / 2) + '" y="' + (subY + 10.5) + '" font-size="6.8" font-weight="700" text-anchor="middle">Mannschaften/Equipes/Squadre</text>');

    // Left A oder/ou/o B + circle
    out.push('<text class="mb-fnt" x="' + (tbx + 19) + '" y="' + (subY + 14) + '" font-size="9.5" text-anchor="middle">A</text>');
    out.push('<text class="mb-fnt" x="' + (tbx + 19) + '" y="' + (subY + 23) + '" font-size="6" text-anchor="middle">oder/ou/o</text>');
    out.push('<text class="mb-fnt" x="' + (tbx + 19) + '" y="' + (subY + 35) + '" font-size="9.5" text-anchor="middle">B</text>');
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + (tbx + 51) + '" cy="' + (subY + 23.5) + '" r="13.5" />');
    var showTeamLetters = started || (teamA.name && teamA.name !== 'Team A') || (teamB.name && teamB.name !== 'Team B');
    if (showTeamLetters) {
      out.push('<text class="mb-ink-sans" x="' + (tbx + 51) + '" y="' + (subY + 28.5) + '" font-size="14" text-anchor="middle">A</text>');
    }

    // Right circle + A oder/ou/o B
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + (tbx + tbw - 51) + '" cy="' + (subY + 23.5) + '" r="13.5" />');
    if (showTeamLetters) {
      out.push('<text class="mb-ink-sans" x="' + (tbx + tbw - 51) + '" y="' + (subY + 28.5) + '" font-size="14" text-anchor="middle">B</text>');
    }
    out.push('<text class="mb-fnt" x="' + (tbx + tbw - 19) + '" y="' + (subY + 14) + '" font-size="9.5" text-anchor="middle">A</text>');
    out.push('<text class="mb-fnt" x="' + (tbx + tbw - 19) + '" y="' + (subY + 23) + '" font-size="6" text-anchor="middle">oder/ou/o</text>');
    out.push('<text class="mb-fnt" x="' + (tbx + tbw - 19) + '" y="' + (subY + 35) + '" font-size="9.5" text-anchor="middle">B</text>');

    // Dotted lines & team names separated by ':'
    var midColonX = tbx + tbw / 2;
    out.push('<line class="mb-dotted" x1="' + (tbx + 72) + '" y1="' + (subY + 35) + '" x2="' + (midColonX - 8) + '" y2="' + (subY + 35) + '" />');
    out.push('<text class="mb-fnt" x="' + midColonX.toFixed(1) + '" y="' + (subY + 34) + '" font-size="12" font-weight="700" text-anchor="middle">:</text>');
    out.push('<line class="mb-dotted" x1="' + (midColonX + 8) + '" y1="' + (subY + 35) + '" x2="' + (tbx + tbw - 72) + '" y2="' + (subY + 35) + '" />');

    var dispTeamA = (teamA.name && teamA.name !== 'Team A') || started ? (teamA.name || '') : '';
    var dispTeamB = (teamB.name && teamB.name !== 'Team B') || started ? (teamB.name || '') : '';

    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'team.A.name', label: 'Team A Name',
      x: tbx + 72, y: subY + 13, w: midColonX - (tbx + 80), h: 23,
      value: dispTeamA, align: 'center', fontSize: 12.5, maxChars: 28
    }));
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'team.B.name', label: 'Team B Name',
      x: midColonX + 8, y: subY + 13, w: (tbx + tbw - 72) - (midColonX + 8), h: 23,
      value: dispTeamB, align: 'center', fontSize: 12.5, maxChars: 28
    }));

    // 1B-2: Ort / Lieu / Luogo (x = 616, w = 335)
    var ortX = 616, ortW = 335;
    out.push('<rect class="mb-box-thin" x="' + ortX + '" y="' + subY + '" width="' + ortW + '" height="' + subH + '" />');
    out.push(renderTriLabel(ortX + 6, subY + 11.5, ['Ort', 'Lieu', 'Luogo'], 6.5, 8.2));
    out.push('<line class="mb-dotted" x1="' + (ortX + 36) + '" y1="' + (subY + 35) + '" x2="' + (ortX + ortW - 8) + '" y2="' + (subY + 35) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'meta.city', label: 'Ort / Lieu / City',
      x: ortX + 38, y: subY + 12, w: ortW - 46, h: 24,
      value: meta.city || '', align: 'left', fontSize: 12, maxChars: 34
    }));

    // 1B-3: Halle / Salle / Palestra (x = 960, w = 335)
    var halX = 960, halW = 335;
    out.push('<rect class="mb-box-thin" x="' + halX + '" y="' + subY + '" width="' + halW + '" height="' + subH + '" />');
    out.push(renderTriLabel(halX + 6, subY + 11.5, ['Halle', 'Salle', 'Palestra'], 6.5, 8.2));
    out.push('<line class="mb-dotted" x1="' + (halX + 42) + '" y1="' + (subY + 35) + '" x2="' + (halX + halW - 8) + '" y2="' + (subY + 35) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'meta.hall', label: 'Halle / Salle / Hall',
      x: halX + 44, y: subY + 12, w: halW - 52, h: 24,
      value: meta.hall || '', align: 'left', fontSize: 11.5, maxChars: 36
    }));

    // 1B-4: Datum / Date / Data (x = 1304, w = 160)
    var datX = 1304, datW = 160;
    out.push('<rect class="mb-box-thin" x="' + datX + '" y="' + subY + '" width="' + datW + '" height="' + subH + '" />');
    out.push(renderTriLabel(datX + 6, subY + 11.5, ['Datum', 'Date', 'Data'], 6.5, 8.2));
    out.push('<line class="mb-dotted" x1="' + (datX + 36) + '" y1="' + (subY + 35) + '" x2="' + (datX + datW - 6) + '" y2="' + (subY + 35) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'meta.date', label: 'Datum / Date',
      x: datX + 36, y: subY + 12, w: datW - 42, h: 24,
      value: meta.date || '', align: 'left', cls: 'mb-ink', fontSize: 11, maxChars: 14
    }));

    // 1B-5: Zeit / Heure / Ora (x = 1472, w = 190)
    var zeiX = 1472, zeiW = 190;
    out.push('<rect class="mb-box-thin" x="' + zeiX + '" y="' + subY + '" width="' + zeiW + '" height="' + subH + '" />');
    out.push(renderTriLabel(zeiX + 6, subY + 11.5, ['Zeit', 'Heure', 'Ora'], 6.5, 8.2));
    out.push('<line class="mb-dotted" x1="' + (zeiX + 36) + '" y1="' + (subY + 35) + '" x2="' + (zeiX + zeiW - 6) + '" y2="' + (subY + 35) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'meta.time', label: 'Zeit / Heure / Time',
      x: zeiX + 38, y: subY + 12, w: zeiW - 46, h: 24,
      value: meta.time || '', align: 'left', cls: 'mb-ink', fontSize: 12, maxChars: 12
    }));

    out.push('</g>');
    return out.join('');
  }

  /**
   * Renders the authentic Swiss Volley Left Legend Column beside Set 1, Set 3, and Set 5.
   */
  function renderSetRowLegend(x, yTopOfRom, w, bodyH, turnRowsCount) {
    var out = [];
    var romH = 21;
    var startH = 20;
    var subH = 16;
    var scH = 24; // 2 sub-score rows (12px + 12px)
    var upperH = romH + startH + subH + scH; // 81px
    var turnsY = yTopOfRom + upperH;
    var turnsH = bodyH - upperH;
    var turnRowH = turnsH / turnRowsCount;

    var vStripW = 58;
    var subSplitX = x + w - 79; // 79px on right for Nr. Spieler / Spielstand & paired round numbers

    out.push('<rect class="mb-box" x="' + x + '" y="' + yTopOfRom + '" width="' + w + '" height="' + bodyH + '" />');
    // Vertical divider after Mannschafts-Aufstellung (spans upperH)
    out.push('<line class="mb-grid" x1="' + (x + vStripW) + '" y1="' + yTopOfRom + '" x2="' + (x + vStripW) + '" y2="' + turnsY + '" />');
    // Horizontal lines in upper section
    out.push('<line class="mb-grid" x1="' + (x + vStripW) + '" y1="' + (yTopOfRom + romH) + '" x2="' + (x + w) + '" y2="' + (yTopOfRom + romH) + '" />');
    out.push('<line class="mb-grid" x1="' + (x + vStripW) + '" y1="' + (yTopOfRom + romH + startH) + '" x2="' + (x + w) + '" y2="' + (yTopOfRom + romH + startH) + '" />');
    // Split inside Substitution row
    var ySubTop = yTopOfRom + romH + startH;
    out.push('<line class="mb-grid" x1="' + subSplitX + '" y1="' + ySubTop + '" x2="' + subSplitX + '" y2="' + (yTopOfRom + bodyH) + '" />');
    out.push('<line class="mb-grid" x1="' + subSplitX + '" y1="' + (ySubTop + subH) + '" x2="' + (x + w) + '" y2="' + (ySubTop + subH) + '" />');
    // Strong divider above Aufschlagrunde
    out.push('<line class="mb-grid-strong" x1="' + x + '" y1="' + turnsY + '" x2="' + (x + w) + '" y2="' + turnsY + '" />');

    // Vertical text: Mannschafts-Aufstellung / Formation des équipes / Formazione delle squadre
    var vMidY = yTopOfRom + upperH / 2;
    out.push(
      '<text class="mb-fnt" x="' + (x + 17) + '" y="' + vMidY.toFixed(1) + '" font-size="6.2" text-anchor="middle" transform="rotate(-90 ' + (x + 17) + ' ' + vMidY.toFixed(1) + ')">Mannschafts-Aufstellung</text>'
    );
    out.push(
      '<text class="mb-fnt" x="' + (x + 31) + '" y="' + vMidY.toFixed(1) + '" font-size="6.2" text-anchor="middle" transform="rotate(-90 ' + (x + 31) + ' ' + vMidY.toFixed(1) + ')">Formation des équipes</text>'
    );
    out.push(
      '<text class="mb-fnt" x="' + (x + 45) + '" y="' + vMidY.toFixed(1) + '" font-size="6.2" text-anchor="middle" transform="rotate(-90 ' + (x + 45) + ' ' + vMidY.toFixed(1) + ')">Formazione delle squadre</text>'
    );

    // Row 1: Aufschlagfolge / Aufgabenfolge
    out.push(renderTriLabel(x + vStripW + 5, yTopOfRom + 8.5, [
      'Aufschlagfolge/Ordre au service/',
      'Ordine del servizio'
    ], 6.4, 8.2));

    // Row 2: Startaufstellung
    out.push(renderTriLabel(x + vStripW + 5, yTopOfRom + romH + 8.2, [
      'Startaufstellung/Formation',
      'initiale/Formazione iniziale'
    ], 6.4, 8.0));

    // Row 3..5 left: Spieler-auswechslung
    out.push(renderTriLabel(x + vStripW + 5, ySubTop + 8.2, [
      'Spieler-',
      'auswechslung',
      'Remplacement',
      'des joueurs',
      'Sostituzione'
    ], 6.1, 7.1));

    // Row 3 right: Nr. Spieler
    out.push(renderTriLabel(subSplitX + 3, ySubTop + 6.8, [
      'Nr. Spieler/No jou-',
      'eur/No giocatore'
    ], 5.6, 6.8));

    // Row 4..5 right: Spielstand
    out.push(renderTriLabel(subSplitX + 3, ySubTop + subH + 7.2, [
      'Spielstand',
      'Résultat',
      'Risultato'
    ], 6.1, 7.1));

    // Lower left: Aufschlagrunde
    out.push(renderTriLabel(x + vStripW + 5, turnsY + turnsH / 2 - 7, [
      'Aufschlagrunde',
      'Tours au service',
      'Turni al servizio'
    ], 6.5, 8.2));

    // Lower right: Paired service round numbers (1.|5. .. 4.|8. or 1.|4. .. 3.|6.)
    var pairMidX = subSplitX + (x + w - subSplitX) / 2;
    out.push('<line class="mb-grid" x1="' + pairMidX.toFixed(1) + '" y1="' + turnsY + '" x2="' + pairMidX.toFixed(1) + '" y2="' + (yTopOfRom + bodyH) + '" />');
    for (var r = 0; r < turnRowsCount; r++) {
      var ry = turnsY + r * turnRowH;
      if (r > 0) {
        out.push('<line class="mb-grid" x1="' + subSplitX + '" y1="' + ry.toFixed(1) + '" x2="' + (x + w) + '" y2="' + ry.toFixed(1) + '" />');
      }
      var leftNum = (r + 1) + '.';
      var rightNum = (r + 1 + turnRowsCount) + '.';
      out.push('<text class="mb-fnt" x="' + ((subSplitX + pairMidX) / 2).toFixed(1) + '" y="' + (ry + turnRowH / 2 + 3.8).toFixed(1) + '" font-size="10.5" text-anchor="middle">' + leftNum + '</text>');
      out.push('<text class="mb-fnt" x="' + ((pairMidX + x + w) / 2).toFixed(1) + '" y="' + (ry + turnRowH / 2 + 3.8).toFixed(1) + '" font-size="10.5" text-anchor="middle">' + rightNum + '</text>');
    }

    return out.join('');
  }

  /**
   * Renders the vertical "S A T Z • S E T  N" strip on the left of each set.
   */
  function renderVerticalSetStrip(x, y, w, h, setNumText, subNote) {
    var out = [];
    out.push('<rect class="mb-box" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" />');
    var chars = ['S', 'A', 'T', 'Z', '•', 'S', 'E', 'T'];
    var startY = y + 19;
    var step = (h - 52) / chars.length;
    var cx = x + w / 2;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var fs = ch === '•' ? 11 : 12.5;
      out.push('<text class="mb-fnt" x="' + cx.toFixed(1) + '" y="' + (startY + i * step).toFixed(1) + '" font-size="' + fs + '" font-weight="600" text-anchor="middle">' + ch + '</text>');
    }
    out.push(
      '<text class="mb-fnt" x="' + cx.toFixed(1) + '" y="' + (y + h - (subNote ? 15 : 8)).toFixed(1) +
      '" font-size="' + (setNumText.length > 1 ? '11.5' : '15') + '" font-weight="700" text-anchor="middle">' + esc(setNumText) + '</text>'
    );
    if (subNote) {
      out.push('<text class="mb-fnt" x="' + cx.toFixed(1) + '" y="' + (y + h - 4).toFixed(1) + '" font-size="8.5" font-weight="700" text-anchor="middle">' + esc(subNote) + '</text>');
    }
    return out.join('');
  }

  /**
   * Renders vertical pair of (S) and (R) circles inside a Set Team Header, with ink X on active choice.
   */
  function renderVerticalSRCircles(cx, yTop, teamLetter, firstServeTeam, markActive) {
    var sCy = yTop + 8.2;
    var rCy = yTop + 21.8;
    var r = 5.6;
    var out = [];

    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.65" cx="' + cx.toFixed(1) + '" cy="' + sCy.toFixed(1) + '" r="' + r + '" />');
    out.push('<text class="mb-fnt" x="' + cx.toFixed(1) + '" y="' + (sCy + 2.5).toFixed(1) + '" font-size="7" text-anchor="middle">S</text>');

    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.65" cx="' + cx.toFixed(1) + '" cy="' + rCy.toFixed(1) + '" r="' + r + '" />');
    out.push('<text class="mb-fnt" x="' + cx.toFixed(1) + '" y="' + (rCy + 2.5).toFixed(1) + '" font-size="7" text-anchor="middle">R</text>');

    if (markActive && (firstServeTeam === 'A' || firstServeTeam === 'B')) {
      var targetCy = (firstServeTeam === teamLetter) ? sCy : rCy;
      out.push(
        '<path class="mb-ink-stroke" stroke-width="1.65" d="M' + (cx - 4.5).toFixed(1) + ',' + (targetCy - 4.5).toFixed(1) +
        ' L' + (cx + 4.5).toFixed(1) + ',' + (targetCy + 4.5).toFixed(1) +
        ' M' + (cx + 4.5).toFixed(1) + ',' + (targetCy - 4.5).toFixed(1) +
        ' L' + (cx - 4.5).toFixed(1) + ',' + (targetCy + 4.5).toFixed(1) + '" />'
      );
    }
    return out.join('');
  }

  /**
   * Official Swiss Volley T-bar cancellation on unused running points (Anleitung 3.1e, page 9).
   */
  function renderUnusedPointsCancellation(gridX, gridY, colW, rowH, numCols, rowsPerCol, lastScoredPoint, startCancelAtPoint) {
    var out = [];
    var totalPts = numCols * rowsPerCol;
    var fromPt = startCancelAtPoint !== undefined ? startCancelAtPoint : (lastScoredPoint + 1);
    if (fromPt > totalPts) return '';

    // Pre-switch points 1..K cancelled/transferred in Deciding Set Panel 3
    if (startCancelAtPoint === 1 && lastScoredPoint >= 1) {
      var upto = Math.min(lastScoredPoint, totalPts);
      for (var p = 1; p <= upto; p++) {
        var cIdx = Math.floor((p - 1) / rowsPerCol);
        var rIdx = (p - 1) % rowsPerCol;
        var px = gridX + cIdx * colW;
        var py = gridY + rIdx * rowH;
        out.push(
          '<line class="mb-ink-stroke" stroke-width="1.25" stroke-opacity="0.72" x1="' + (px + 3).toFixed(1) + '" y1="' + (py + rowH - 1.5).toFixed(1) +
          '" x2="' + (px + colW - 3).toFixed(1) + '" y2="' + (py + 1.5).toFixed(1) + '" />'
        );
      }
      return out.join('');
    }

    // End-of-set T-bar below lastScoredPoint + vertical bar through all remaining unused columns
    var firstUnused = Math.max(1, lastScoredPoint + 1);
    var firstCol = Math.floor((firstUnused - 1) / rowsPerCol);
    var firstRow = (firstUnused - 1) % rowsPerCol;

    var barX1 = gridX + firstCol * colW + 1.5;
    var barX2 = gridX + (firstCol + 1) * colW - 1.5;
    var barMidX = (barX1 + barX2) / 2;
    var barY = gridY + firstRow * rowH;
    var colBottomY = gridY + rowsPerCol * rowH - 1.5;

    // Horizontal underline right below last scored point + vertical stem down rest of column ("T-Balken")
    out.push('<line class="mb-ink-stroke" stroke-width="1.65" x1="' + barX1.toFixed(1) + '" y1="' + barY.toFixed(1) + '" x2="' + barX2.toFixed(1) + '" y2="' + barY.toFixed(1) + '" />');
    out.push('<line class="mb-ink-stroke" stroke-width="1.35" x1="' + barMidX.toFixed(1) + '" y1="' + barY.toFixed(1) + '" x2="' + barMidX.toFixed(1) + '" y2="' + colBottomY.toFixed(1) + '" />');

    // Remaining unused columns: top horizontal bar + vertical stem down center
    for (var c = firstCol + 1; c < numCols; c++) {
      var cx1 = gridX + c * colW + 1.5;
      var cx2 = gridX + (c + 1) * colW - 1.5;
      var cMid = (cx1 + cx2) / 2;
      var cyTop = gridY + 1.5;
      out.push('<line class="mb-ink-stroke" stroke-width="1.4" x1="' + cx1.toFixed(1) + '" y1="' + cyTop.toFixed(1) + '" x2="' + cx2.toFixed(1) + '" y2="' + cyTop.toFixed(1) + '" />');
      out.push('<line class="mb-ink-stroke" stroke-width="1.3" x1="' + cMid.toFixed(1) + '" y1="' + cyTop.toFixed(1) + '" x2="' + cMid.toFixed(1) + '" y2="' + colBottomY.toFixed(1) + '" />');
    }

    return out.join('');
  }

  /**
   * Renders a single Team Half inside Sets 1–4 OR a single Panel inside Deciding Set 5 (Panels 1–3).
   * Matches Swiss Volley PDF 1:1:
   *  - Paired Service Rounds (1|5, 2|6, 3|7, 4|8 in Sets 1–4; 1|4, 2|5, 3|6 in Set 5)
   *  - Running Points columns in upper right + "T" Timeout boxes directly underneath Punkte!
   */
  function renderTeamSetPanel(cfg) {
    var state = cfg.state;
    var setObj = cfg.setObj;
    var setIdx = cfg.setIdx;
    var setKeyNum = cfg.setKeyNum;
    var fallbackSetKeyNum = cfg.fallbackSetKeyNum;
    var team = cfg.team; // 'A' or 'B'
    var defaultPrintedLetter = cfg.printedLetter || ''; // 'A'/'B' pre-printed in Sets 1-4, '' in Set 5
    var panelMode = cfg.panelMode || 'regular'; // 'regular' | 'pre' | 'mid' | 'post'
    var sideRole = cfg.sideRole || 'left'; // 'left' (has Beginn), 'right' (has Ende), 'post' (has Pkt beim Seitenwechsel)
    var x = cfg.x;
    var y = cfg.y;
    var w = cfg.w;
    var h = cfg.h;
    var ptsCols = cfg.ptsCols || 4;
    var ptsRows = cfg.ptsRows || 12;
    var ptsTotalW = cfg.ptsTotalW || 67.5;
    var turnRowsCount = cfg.turnRowsCount || 4; // 4 rows x 2 = 8 turns in Sets 1-4; 3 rows x 2 = 6 turns in Set 5
    var interactive = cfg.interactive;
    var printMode = cfg.printMode;
    var hl = cfg.hl;

    var out = [];
    var teamObj = (state.teams && state.teams[team]) || {};
    var setStarted = !!(setObj && (setObj.status === 'live' || setObj.status === 'finished' || setObj.status === 'lineup'));
    var setLiveOrFinished = !!(setObj && (setObj.status === 'live' || setObj.status === 'finished'));
    var firstServe = setObj ? setObj.firstServe : null;
    var switchedAt8 = !!(setObj && setObj.switchedAt8);
    var ptsAtSwitchObj = (setObj && setObj.pointsAtSwitch) || null;
    var teamPtsAtSwitch = (ptsAtSwitchObj && typeof ptsAtSwitchObj[team] === 'number') ? ptsAtSwitchObj[team] : null;

    var hdrH = 30;
    var bodyY = y + hdrH;
    var bodyH = h - hdrH;
    var colsTotalW = w - ptsTotalW;
    var colW = colsTotalW / 6;
    var ptsX = x + colsTotalW;

    // Outer frame for this team panel
    out.push('<rect class="mb-box" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" />');
    out.push('<line class="mb-grid-strong" x1="' + x.toFixed(1) + '" y1="' + bodyY.toFixed(1) + '" x2="' + (x + w).toFixed(1) + '" y2="' + bodyY.toFixed(1) + '" />');
    out.push('<line class="mb-grid-strong" x1="' + ptsX.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + ptsX.toFixed(1) + '" y2="' + (y + h).toFixed(1) + '" />');

    // --- 1. TOP HEADER BAR (h = 30) ---
    var isDecidingPanel = panelMode !== 'regular';
    var decidingAssigned = !!(setStarted || (state.toss && state.toss.decidingInitialLeft));
    var showTeamName = isDecidingPanel
      ? decidingAssigned
      : (setStarted || isMatchStarted(state) || (teamObj.name && teamObj.name !== ('Team ' + team)));
    var teamNameVal = showTeamName ? (teamObj.shortName && w < 300 && (teamObj.name || '').length > 16 ? teamObj.name : (teamObj.name || '')) : '';

    var isCurrentlyServing = !printMode && setObj && setObj.status === 'live' && setObj.servingTeam === team &&
      (panelMode === 'regular' || panelMode === 'mid' || (panelMode === 'pre' && !switchedAt8) || (panelMode === 'post' && switchedAt8));

    if (sideRole === 'left') {
      // [ Beginn/Début/Inizio | Mannschaft/Equipe/Squadra + (A) + (S)/(R) | Punkte ]
      var begW = Math.round(colsTotalW * 0.33);
      var teamBoxX = x + begW;
      var teamBoxW = colsTotalW - begW;
      out.push('<line class="mb-grid" x1="' + teamBoxX.toFixed(1) + '" y1="' + y + '" x2="' + teamBoxX.toFixed(1) + '" y2="' + bodyY + '" />');
      out.push(renderTriLabel(x + 3.5, y + 8, ['Beginn', 'Début', 'Inizio'], 6.0, 7.2));
      out.push('<line class="mb-dotted" x1="' + (x + 28) + '" y1="' + (y + 24) + '" x2="' + (teamBoxX - 3) + '" y2="' + (y + 24) + '" />');
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'set.' + setKeyNum + '.startTime',
        fallbackKey: fallbackSetKeyNum ? ('set.' + fallbackSetKeyNum + '.startTime') : null,
        label: 'Set ' + setKeyNum + ' Start Time (Beginn)',
        x: x + 27, y: y + 6, w: begW - 30, h: 21,
        value: setObj ? (setObj.startTime || '') : '', cls: 'mb-ink', fontSize: 10.5
      }));

      // Mannschaft + Name + (A/B) + (S)/(R)
      out.push(renderTriLabel(teamBoxX + 3.5, y + 8, ['Mannschaft', 'Equipe', 'Squadra'], 6.0, 7.2));
      var srCx = ptsX - 8.5;
      var abCx = ptsX - 27;
      out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + abCx.toFixed(1) + '" cy="' + (y + 15) + '" r="10.8" />');
      if (defaultPrintedLetter) {
        var letterCls = (setStarted && team !== defaultPrintedLetter) ? 'mb-ink-sans' : 'mb-fnt';
        out.push('<text class="' + letterCls + '" x="' + abCx.toFixed(1) + '" y="' + (y + 20) + '" font-size="14" font-weight="600" text-anchor="middle">' + esc(team) + '</text>');
      } else if (setStarted) {
        out.push('<text class="mb-ink-sans" x="' + abCx.toFixed(1) + '" y="' + (y + 20) + '" font-size="13.5" text-anchor="middle">' + esc(team) + '</text>');
      }
      out.push(renderVerticalSRCircles(srCx, y, team, firstServe, setLiveOrFinished));
      if (isCurrentlyServing) {
        out.push('<circle cx="' + (abCx - 14).toFixed(1) + '" cy="' + (y + 8) + '" r="3.4" fill="#f59e0b" stroke="#b45309" stroke-width="0.7" />');
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'set.' + setKeyNum + '.' + team + '.teamName',
        label: 'Set ' + setKeyNum + ' Team ' + team,
        x: teamBoxX + 37, y: y + 8, w: Math.max(40, (abCx - 12) - (teamBoxX + 37)), h: 20,
        value: teamNameVal, align: 'left', fontSize: 10.2, maxChars: 15
      }));
    } else if (sideRole === 'right') {
      // [ Mannschaft/Equipe/Squadra + (B) + (S)/(R) | Ende/Fin/Fine | Punkte ]
      var endW = Math.round(colsTotalW * 0.33);
      var endX = ptsX - endW;
      var rTeamW = colsTotalW - endW;
      out.push('<line class="mb-grid" x1="' + endX.toFixed(1) + '" y1="' + y + '" x2="' + endX.toFixed(1) + '" y2="' + bodyY + '" />');

      out.push(renderTriLabel(x + 3.5, y + 8, ['Mannschaft', 'Equipe', 'Squadra'], 6.0, 7.2));
      var rSrCx = endX - 8.5;
      var rAbCx = endX - 27;
      out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + rAbCx.toFixed(1) + '" cy="' + (y + 15) + '" r="10.8" />');
      if (defaultPrintedLetter) {
        var rLetterCls = (setStarted && team !== defaultPrintedLetter) ? 'mb-ink-sans' : 'mb-fnt';
        out.push('<text class="' + rLetterCls + '" x="' + rAbCx.toFixed(1) + '" y="' + (y + 20) + '" font-size="14" font-weight="600" text-anchor="middle">' + esc(team) + '</text>');
      } else if (setStarted) {
        out.push('<text class="mb-ink-sans" x="' + rAbCx.toFixed(1) + '" y="' + (y + 20) + '" font-size="13.5" text-anchor="middle">' + esc(team) + '</text>');
      }
      out.push(renderVerticalSRCircles(rSrCx, y, team, firstServe, setLiveOrFinished));
      if (isCurrentlyServing) {
        out.push('<circle cx="' + (rAbCx - 14).toFixed(1) + '" cy="' + (y + 8) + '" r="3.4" fill="#f59e0b" stroke="#b45309" stroke-width="0.7" />');
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'set.' + setKeyNum + '.' + team + '.teamName',
        label: 'Set ' + setKeyNum + ' Team ' + team,
        x: x + 37, y: y + 8, w: Math.max(40, (rAbCx - 12) - (x + 37)), h: 20,
        value: teamNameVal, align: 'left', fontSize: 10.2, maxChars: 15
      }));

      // Ende / Fin / Fine
      out.push(renderTriLabel(endX + 3.5, y + 8, ['Ende', 'Fin', 'Fine'], 6.0, 7.2));
      out.push('<line class="mb-dotted" x1="' + (endX + 24) + '" y1="' + (y + 24) + '" x2="' + (ptsX - 3) + '" y2="' + (y + 24) + '" />');
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'set.' + setKeyNum + '.endTime',
        fallbackKey: fallbackSetKeyNum ? ('set.' + fallbackSetKeyNum + '.endTime') : null,
        label: 'Set ' + setKeyNum + ' End Time (Ende)',
        x: endX + 23, y: y + 6, w: endW - 26, h: 21,
        value: setObj ? (setObj.endTime || '') : '', cls: 'mb-ink', fontSize: 10.5
      }));
    } else {
      // Deciding Set Panel 3 ('post'): [ Mannschaft + ( ) | Pkt. beim Seitenwechsel + box | Punkte ]
      var swW = Math.round(colsTotalW * 0.46);
      var swX = ptsX - swW;
      out.push('<line class="mb-grid" x1="' + swX.toFixed(1) + '" y1="' + y + '" x2="' + swX.toFixed(1) + '" y2="' + bodyY + '" />');
      out.push(renderTriLabel(x + 3.5, y + 8, ['Mannschaft', 'Equipe', 'Squadra'], 5.8, 7.0));
      var pAbCx = swX - 14;
      out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + pAbCx.toFixed(1) + '" cy="' + (y + 15) + '" r="10.2" />');
      if (switchedAt8) {
        out.push('<text class="mb-ink-sans" x="' + pAbCx.toFixed(1) + '" y="' + (y + 19.5) + '" font-size="13" text-anchor="middle">' + esc(team) + '</text>');
      }
      if (isCurrentlyServing) {
        out.push('<circle cx="' + (pAbCx - 13).toFixed(1) + '" cy="' + (y + 8) + '" r="3.4" fill="#f59e0b" stroke="#b45309" stroke-width="0.7" />');
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'set.' + setKeyNum + '.' + team + '.post.teamName',
        label: 'Set ' + setKeyNum + ' Post-Switch Team',
        x: x + 36, y: y + 8, w: Math.max(30, (pAbCx - 11) - (x + 36)), h: 20,
        value: switchedAt8 ? teamNameVal : '', align: 'left', fontSize: 9.6, maxChars: 12
      }));

      // Pkt. beim Seitenwechsel / Points au changement / Punti al cambio
      out.push(renderTriLabel(swX + 3, y + 8, ['Pkt. beim Seitenwechsel', 'Points au changement', 'Punti al cambio'], 5.6, 7.0));
      var ptsSwVal = (switchedAt8 && teamPtsAtSwitch !== null) ? String(teamPtsAtSwitch) : '';
      var swValX = ptsX - 28;
      out.push('<line class="mb-dotted" x1="' + swValX.toFixed(1) + '" y1="' + (y + 24) + '" x2="' + (ptsX - 3).toFixed(1) + '" y2="' + (y + 24) + '" />');
      if (hl && hl.switch8(setIdx)) {
        out.push(renderHighlightRect(swX + 1, y + 1, swW - 2, hdrH - 2, 1.5));
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'set.' + setKeyNum + '.pointsAtSwitch',
        fallbackKey: fallbackSetKeyNum ? ('set.' + fallbackSetKeyNum + '.pointsAtSwitch') : null,
        label: 'Punkte beim Seitenwechsel / Points at Change',
        x: swValX, y: y + 4, w: 26, h: 22,
        value: ptsSwVal, cls: 'mb-ink', fontSize: 12
      }));
    }

    // Punkte / Points / Punti header
    out.push(renderTriLabel(ptsX + ptsTotalW / 2, y + 8, ['Punkte', 'Points', 'Punti'], 6.0, 7.2, '600', 'middle'));

    // --- 2. BODY ROWS: I..VI, Starter, Sub, SubScores (x2), and Paired Service Turns ---
    var romH = 21;
    var startH = 20;
    var subH = 16;
    var sc1H = 12;
    var sc2H = 12;
    var upperH = romH + startH + subH + sc1H + sc2H; // 81px
    var turnsY = bodyY + upperH;
    var turnsH = bodyH - upperH; // 97px (Sets 1-4) or 71px (Set 5)
    var turnRowH = turnsH / turnRowsCount;

    var yRom = bodyY;
    var yStart = yRom + romH;
    var ySub = yStart + startH;
    var ySc1 = ySub + subH;
    var ySc2 = ySc1 + sc1H;

    // Horizontal dividers across I..VI
    out.push('<line class="mb-grid" x1="' + x.toFixed(1) + '" y1="' + yStart + '" x2="' + ptsX.toFixed(1) + '" y2="' + yStart + '" />');
    out.push('<line class="mb-grid" x1="' + x.toFixed(1) + '" y1="' + ySub + '" x2="' + ptsX.toFixed(1) + '" y2="' + ySub + '" />');
    out.push('<line class="mb-grid" x1="' + x.toFixed(1) + '" y1="' + ySc1 + '" x2="' + ptsX.toFixed(1) + '" y2="' + ySc1 + '" />');
    out.push('<line class="mb-dotted" x1="' + x.toFixed(1) + '" y1="' + ySc2 + '" x2="' + ptsX.toFixed(1) + '" y2="' + ySc2 + '" />');
    out.push('<line class="mb-grid-strong" x1="' + x.toFixed(1) + '" y1="' + turnsY + '" x2="' + ptsX.toFixed(1) + '" y2="' + turnsY + '" />');

    for (var tr = 1; tr < turnRowsCount; tr++) {
      var trY = turnsY + tr * turnRowH;
      out.push('<line class="mb-grid" x1="' + x.toFixed(1) + '" y1="' + trY.toFixed(1) + '" x2="' + ptsX.toFixed(1) + '" y2="' + trY.toFixed(1) + '" />');
    }

    var showPanelLineupData = !setObj ? false : (panelMode === 'post' ? switchedAt8 : true);
    var lineupObj = (setObj && setObj.lineups && setObj.lineups[team]) || null;
    var positions = (lineupObj && Array.isArray(lineupObj.positions)) ? lineupObj.positions : [];

    if (hl && showPanelLineupData && hl.lineup(setIdx, team)) {
      out.push(renderHighlightRect(x, yStart, colsTotalW, startH, 1.5));
    }

    var keyPrefix = 'set.' + setKeyNum + '.' + team + (panelMode === 'post' ? '.post' : '');
    var fbPrefix = fallbackSetKeyNum ? ('set.' + fallbackSetKeyNum + '.' + team + (panelMode === 'post' ? '.post' : '')) : null;

    var maxTurns = turnRowsCount * 2; // 8 in Sets 1-4, 6 in Set 5

    for (var c = 0; c < 6; c++) {
      var cx = x + c * colW;
      var subColW = colW / 2;
      if (c > 0) {
        out.push('<line class="mb-grid" x1="' + cx.toFixed(1) + '" y1="' + bodyY + '" x2="' + cx.toFixed(1) + '" y2="' + (y + h) + '" />');
      }
      // Mid-column vertical divider inside Service Rounds (pairing 1|5, 2|6, 3|7, 4|8 or 1|4, 2|5, 3|6)
      out.push('<line class="mb-grid-thin" x1="' + (cx + subColW).toFixed(1) + '" y1="' + turnsY + '" x2="' + (cx + subColW).toFixed(1) + '" y2="' + (y + h) + '" />');

      // Roman numeral I..VI
      out.push(
        '<text class="mb-fnt" x="' + (cx + colW / 2).toFixed(1) + '" y="' + (yRom + 15) +
        '" font-size="11.5" font-weight="500" text-anchor="middle">' + ROMAN[c] + '</text>'
      );

      // Pre-printed colons ':' in both sub-score rows
      out.push('<text class="mb-fnt" x="' + (cx + colW / 2).toFixed(1) + '" y="' + (ySc1 + 9.2) + '" font-size="8.5" text-anchor="middle">:</text>');
      out.push('<text class="mb-fnt" x="' + (cx + colW / 2).toFixed(1) + '" y="' + (ySc2 + 9.2) + '" font-size="8.5" text-anchor="middle">:</text>');

      var pos = positions[c] || {
        starter: (lineupObj && Array.isArray(lineupObj.starters) && lineupObj.starters[c]) || '',
        sub: null,
        subReentered: false,
        subScores: [],
        serviceTurns: []
      };

      var starterVal = showPanelLineupData ? (pos.starter || '') : '';
      var subVal = showPanelLineupData ? (pos.sub || '') : '';
      var subSc0 = (showPanelLineupData && pos.subScores && pos.subScores[0]) ? (pos.subScores[0].team + ':' + pos.subScores[0].opp) : '';
      var subSc1 = (showPanelLineupData && pos.subScores && pos.subScores[1]) ? (pos.subScores[1].team + ':' + pos.subScores[1].opp) : '';

      if (hl && showPanelLineupData && hl.sub(setIdx, team, c)) {
        out.push(renderHighlightRect(cx, ySub, colW, subH + sc1H + sc2H, 1.5));
      }

      // Starter
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: keyPrefix + '.pos.' + c + '.starter',
        fallbackKey: fbPrefix ? (fbPrefix + '.pos.' + c + '.starter') : null,
        label: 'Set ' + setKeyNum + ' Team ' + team + ' Pos ' + ROMAN[c] + ' Starter',
        x: cx, y: yStart, w: colW, h: startH,
        value: starterVal, cls: 'mb-ink', fontSize: 11.5
      }));

      // Substitute + re-entry circle
      var resolvedSub = resolveValue(
        state,
        keyPrefix + '.pos.' + c + '.sub',
        subVal,
        fbPrefix ? (fbPrefix + '.pos.' + c + '.sub') : null
      );
      var reenterCircle = '';
      if (showPanelLineupData && pos.subReentered && resolvedSub) {
        reenterCircle = '<circle class="mb-ink-stroke" stroke-width="1.35" cx="' + (cx + colW / 2).toFixed(1) + '" cy="' + (ySub + subH / 2).toFixed(1) + '" r="' + (Math.min(colW, subH) / 2 - 1.2).toFixed(1) + '" />';
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: keyPrefix + '.pos.' + c + '.sub',
        fallbackKey: fbPrefix ? (fbPrefix + '.pos.' + c + '.sub') : null,
        label: 'Set ' + setKeyNum + ' Team ' + team + ' Pos ' + ROMAN[c] + ' Substitute',
        x: cx, y: ySub, w: colW, h: subH,
        value: subVal, cls: 'mb-ink', fontSize: 10.5,
        extraSvg: reenterCircle
      }));

      // Sub Scores 1 & 2 (split cleanly left/right around pre-printed colon ':')
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: keyPrefix + '.pos.' + c + '.subScore.0',
        fallbackKey: fbPrefix ? (fbPrefix + '.pos.' + c + '.subScore.0') : null,
        label: 'Set ' + setKeyNum + ' Team ' + team + ' Pos ' + ROMAN[c] + ' Sub Score 1',
        x: cx, y: ySc1, w: colW, h: sc1H,
        value: subSc0, cls: 'mb-ink', fontSize: 8.4, colonSplit: true
      }));
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: keyPrefix + '.pos.' + c + '.subScore.1',
        fallbackKey: fbPrefix ? (fbPrefix + '.pos.' + c + '.subScore.1') : null,
        label: 'Set ' + setKeyNum + ' Team ' + team + ' Pos ' + ROMAN[c] + ' Sub Score 2',
        x: cx, y: ySc2, w: colW, h: sc2H,
        value: subSc1, cls: 'mb-ink', fontSize: 8.4, colonSplit: true
      }));

      // Filter / map service turns for regular vs deciding panels
      var rawTurns = Array.isArray(pos.serviceTurns) ? pos.serviceTurns : [];
      var displayTurns = [];
      if (panelMode === 'regular' || panelMode === 'mid') {
        for (var rtIdx = 0; rtIdx < rawTurns.length; rtIdx++) {
          displayTurns.push({ turn: rawTurns[rtIdx], rawIndex: rtIdx });
        }
      } else if (panelMode === 'pre') {
        for (var ti = 0; ti < rawTurns.length; ti++) {
          var rt = rawTurns[ti];
          if (!rt.postSwitch) {
            displayTurns.push({ turn: rt, rawIndex: ti });
          } else if (rt.carriedOverSwitch || (ti === 0 && c === 0 && (rt.initialCheck || rt.initialX))) {
            displayTurns.push({
              turn: { initialCheck: rt.initialCheck, initialX: rt.initialX, exitScore: null, isWinningCircle: false },
              rawIndex: ti
            });
          }
        }
      } else if (panelMode === 'post' && switchedAt8) {
        // Preserve exact box slot from pre-switch so post-switch turns continue in their authentic round box!
        for (var tj = 0; tj < rawTurns.length; tj++) {
          var rtp = rawTurns[tj];
          var isOpenActiveAtPost = (rtp.exitScore === null || rtp.exitScore === undefined) &&
            setObj && setObj.status === 'live' && setObj.servingTeam === team &&
            lineupObj && Number(lineupObj.serverPosIndex) === c && tj === rawTurns.length - 1;
          if (rtp.postSwitch === true || isOpenActiveAtPost) {
            displayTurns[tj] = { turn: rtp, rawIndex: tj };
          }
        }
      }

      // Render paired service turn boxes: tIdx 0..(turnRowsCount-1) in left sub-col, turnRowsCount..(2*turnRowsCount-1) in right sub-col
      for (var tIdx = 0; tIdx < maxTurns; tIdx++) {
        var subCol = tIdx < turnRowsCount ? 0 : 1;
        var subRow = tIdx % turnRowsCount;
        var bx = cx + subCol * subColW;
        var by = turnsY + subRow * turnRowH;

        // Official tiny superscript round number in top-right corner of box (1..8 or 1..6)
        out.push(
          '<text class="mb-fnt" x="' + (bx + subColW - 1.8).toFixed(1) + '" y="' + (by + 6.4).toFixed(1) +
          '" font-size="5.8" text-anchor="end">' + (tIdx + 1) + '</text>'
        );

        var turnEntry = displayTurns[tIdx];
        var turnObj = turnEntry ? (turnEntry.turn || turnEntry) : null;
        var origTurnIdx = (turnEntry && turnEntry.rawIndex !== undefined) ? turnEntry.rawIndex : tIdx;

        var tCellKey = keyPrefix + '.pos.' + c + '.turn.' + tIdx;
        var tFbKey = fbPrefix ? (fbPrefix + '.pos.' + c + '.turn.' + tIdx) : null;

        if (hl && turnObj && hl.serviceTurn(setIdx, team, c, origTurnIdx)) {
          out.push(renderHighlightRect(bx, by, subColW, turnRowH, 1.2));
        }

        var computedExit = (turnObj && turnObj.exitScore !== null && turnObj.exitScore !== undefined) ? String(turnObj.exitScore) : '';
        var turnExtra = [];

        if (turnObj && turnObj.initialX) {
          turnExtra.push(
            '<path class="mb-ink-stroke" stroke-width="1.65" d="M' + (bx + 2.2).toFixed(1) + ',' + (by + 2.2).toFixed(1) +
            ' L' + (bx + subColW - 2.2).toFixed(1) + ',' + (by + turnRowH - 2.2).toFixed(1) +
            ' M' + (bx + subColW - 2.2).toFixed(1) + ',' + (by + 2.2).toFixed(1) +
            ' L' + (bx + 2.2).toFixed(1) + ',' + (by + turnRowH - 2.2).toFixed(1) + '" />'
          );
        }

        if (turnObj && turnObj.initialCheck) {
          // Slash/tick over the top-right superscript number (Anleitung 3.1a)
          var slX1 = bx + subColW - 6.8;
          var slY1 = by + 7.4;
          var slX2 = bx + subColW - 1.2;
          var slY2 = by + 1.5;
          turnExtra.push(
            '<line class="mb-ink-stroke" stroke-width="1.25" x1="' + slX1.toFixed(1) + '" y1="' + slY1.toFixed(1) +
            '" x2="' + slX2.toFixed(1) + '" y2="' + slY2.toFixed(1) + '" />'
          );
        }

        var finalExitStr = resolveValue(state, tCellKey, computedExit, tFbKey);
        if (turnObj && turnObj.isWinningCircle && finalExitStr !== '') {
          turnExtra.push(
            '<circle class="mb-ink-stroke" stroke-width="1.35" cx="' + (bx + subColW * 0.45).toFixed(1) + '" cy="' + (by + turnRowH * 0.56).toFixed(1) +
            '" r="' + (Math.min(subColW, turnRowH) / 2 - 1.1).toFixed(1) + '" />'
          );
        }

        out.push(renderEditableText({
          state: state, interactive: interactive, hl: hl,
          key: tCellKey,
          fallbackKey: tFbKey,
          label: 'Set ' + setKeyNum + ' Team ' + team + ' Pos ' + ROMAN[c] + ' Service Turn ' + (tIdx + 1),
          x: bx, y: by, w: subColW, h: turnRowH,
          offsetX: -1.0,
          textY: by + turnRowH * 0.56 + 3.4,
          value: computedExit, cls: 'mb-ink', fontSize: 9.6,
          extraSvg: turnExtra.join('')
        }));
      }
    }

    // --- 3. RUNNING POINTS ("Punkte / Points / Punti") + "T" TIMEOUTS DIRECTLY UNDERNEATH! ---
    // Exact PDF alignment:
    //  - In Sets 1-4: Punkte (12 rows) spans yRom .. (turnsY + turnRowH) = 81 + 24.25 = 105.25px;
    //    Below it (3 * 24.25 = 72.75px): "T" header row + Timeout 1 row + Timeout 2 row!
    //  - In Set 5: Punkte (8 or 10 rows) spans yRom .. (turnsY + turnRowH) = 81 + 23.67 = 104.67px;
    //    Below it (2 * 23.67 = 47.33px): "T" header (13.3px) + Timeout 1 (17px) + Timeout 2 (17px)!
    var ptsBottomY = turnsY + turnRowH;
    var ptsGridH = ptsBottomY - bodyY;
    var ptColW = ptsTotalW / ptsCols;
    var ptRowH = ptsGridH / ptsRows;

    var rawSlashes = (setObj && setObj.slashedPoints && Array.isArray(setObj.slashedPoints[team])) ? setObj.slashedPoints[team] : [];
    var slashMap = {};
    for (var sIdx = 0; sIdx < rawSlashes.length; sIdx++) {
      var sp = rawSlashes[sIdx];
      var ptNum = typeof sp === 'number' ? sp : Number(sp.point);
      var spPost = typeof sp === 'object' ? !!sp.postSwitch : false;
      var spPen = typeof sp === 'object' ? !!sp.byPenalty : false;

      if (panelMode === 'pre') {
        if (!spPost) slashMap[ptNum] = { byPenalty: spPen };
      } else if (panelMode === 'post') {
        if (spPost === true) slashMap[ptNum] = { byPenalty: spPen };
      } else {
        slashMap[ptNum] = { byPenalty: spPen };
      }
    }

    for (var pc = 0; pc < ptsCols; pc++) {
      var pcX = ptsX + pc * ptColW;
      if (pc > 0) {
        out.push('<line class="mb-grid-thin" x1="' + pcX.toFixed(1) + '" y1="' + bodyY + '" x2="' + pcX.toFixed(1) + '" y2="' + ptsBottomY.toFixed(1) + '" />');
      }
      for (var pr = 0; pr < ptsRows; pr++) {
        var ptVal = pc * ptsRows + pr + 1;
        var prY = bodyY + pr * ptRowH;

        if (hl && slashMap[ptVal] && hl.point(setIdx, team, ptVal, panelMode)) {
          out.push(renderHighlightRect(pcX, prY, ptColW, ptRowH, 1.2));
        }

        out.push(
          '<text class="mb-fnt" x="' + (pcX + ptColW / 2).toFixed(1) + '" y="' + (prY + ptRowH / 2 + 2.6).toFixed(1) +
          '" font-size="' + (ptsRows <= 8 ? '7.8' : '7.1') + '" text-anchor="middle">' + ptVal + '</text>'
        );

        var sl = slashMap[ptVal];
        if (sl) {
          if (sl.byPenalty) {
            out.push(
              '<circle class="mb-red-stroke" stroke-width="1.15" cx="' + (pcX + ptColW / 2).toFixed(1) + '" cy="' + (prY + ptRowH / 2).toFixed(1) +
              '" r="' + (Math.min(ptColW, ptRowH) / 2 - 0.5).toFixed(1) + '" />'
            );
          }
          out.push(
            '<line class="mb-ink-stroke" stroke-width="1.55" x1="' + (pcX + 2.4).toFixed(1) + '" y1="' + (prY + ptRowH - 1.2).toFixed(1) +
            '" x2="' + (pcX + ptColW - 2.4).toFixed(1) + '" y2="' + (prY + 1.2).toFixed(1) + '" />'
          );
        }
      }
    }

    // Unused points T-bar cancellation
    if (panelMode === 'post' && switchedAt8 && teamPtsAtSwitch && teamPtsAtSwitch >= 1) {
      out.push(renderUnusedPointsCancellation(ptsX, bodyY, ptColW, ptRowH, ptsCols, ptsRows, teamPtsAtSwitch, 1));
    }
    if (setObj && setObj.status === 'finished') {
      var finalPts = (setObj.points && typeof setObj.points[team] === 'number') ? setObj.points[team] : 0;
      if (panelMode === 'regular' || panelMode === 'mid' || (panelMode === 'post' && switchedAt8) || (panelMode === 'pre' && !switchedAt8)) {
        out.push(renderUnusedPointsCancellation(ptsX, bodyY, ptColW, ptRowH, ptsCols, ptsRows, finalPts));
      }
    }

    // "T" Timeouts Area directly underneath Punkte!
    out.push('<line class="mb-grid" x1="' + ptsX.toFixed(1) + '" y1="' + ptsBottomY.toFixed(1) + '" x2="' + (x + w).toFixed(1) + '" y2="' + ptsBottomY.toFixed(1) + '" />');

    var toRemH = (y + h) - ptsBottomY;
    var toHdrH = turnRowsCount === 4 ? turnRowH : 14;
    var toBoxH = (toRemH - toHdrH) / 2;
    var to1Y = ptsBottomY + toHdrH;
    var to2Y = to1Y + toBoxH;

    out.push('<line class="mb-grid" x1="' + ptsX.toFixed(1) + '" y1="' + to1Y.toFixed(1) + '" x2="' + (x + w).toFixed(1) + '" y2="' + to1Y.toFixed(1) + '" />');
    out.push('<line class="mb-dotted" x1="' + ptsX.toFixed(1) + '" y1="' + to2Y.toFixed(1) + '" x2="' + (x + w).toFixed(1) + '" y2="' + to2Y.toFixed(1) + '" />');

    out.push(
      '<text class="mb-fnt" x="' + (ptsX + ptsTotalW / 2).toFixed(1) + '" y="' + (ptsBottomY + toHdrH / 2 + 3.8).toFixed(1) +
      '" font-size="' + (turnRowsCount === 4 ? '11' : '9.5') + '" font-weight="800" text-anchor="middle">&quot;T&quot;</text>'
    );

    var rawTimeouts = (setObj && setObj.timeouts && Array.isArray(setObj.timeouts[team])) ? setObj.timeouts[team] : [];
    var panelTimeouts = [];
    for (var k = 0; k < rawTimeouts.length; k++) {
      var tk = rawTimeouts[k];
      if (panelMode === 'pre' && tk.postSwitch) continue;
      if (panelMode === 'post' && !tk.postSwitch && !switchedAt8) continue;
      panelTimeouts.push({ to: tk, origIdx: k });
    }

    for (var tiBox = 0; tiBox < 2; tiBox++) {
      var tbY = to1Y + tiBox * toBoxH;
      out.push('<text class="mb-fnt" x="' + (ptsX + ptsTotalW / 2).toFixed(1) + '" y="' + (tbY + toBoxH / 2 + 3).toFixed(1) + '" font-size="9" text-anchor="middle">:</text>');

      var toItem = panelTimeouts[tiBox];
      var toVal = toItem ? (toItem.to.team + ' : ' + toItem.to.opp) : '';
      if (hl && toItem && hl.timeout(setIdx, team, toItem.origIdx)) {
        out.push(renderHighlightRect(ptsX, tbY, ptsTotalW, toBoxH, 1.5));
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: keyPrefix + '.T.' + (tiBox + 1),
        fallbackKey: fbPrefix ? (fbPrefix + '.T.' + (tiBox + 1)) : null,
        label: 'Set ' + setKeyNum + ' Team ' + team + ' Timeout ' + (tiBox + 1),
        x: ptsX, y: tbY, w: ptsTotalW, h: toBoxH,
        value: toVal, cls: 'mb-ink', fontSize: ptsTotalW < 50 ? 8.5 : 9.8, colonSplit: true
      }));
    }

    return out.join('');
  }

  /**
   * 2. Regular Set Box (Sets 1, 2, 3, 4) — Full-width paired bands matching Swiss Volley PDF 1:1
   */
  function renderRegularSetBox(slotNum, box, state, interactive, printMode, hl) {
    var bestOf = (state.meta && state.meta.bestOf === 3) ? 3 : 5;
    var setIdx = slotNum - 1;
    var setObj = (bestOf === 3 && slotNum >= 3) ? null : ((state.sets && state.sets[setIdx]) || null);

    var defaultLeft = (slotNum % 2 === 1) ? 'A' : 'B';
    var defaultRight = defaultLeft === 'A' ? 'B' : 'A';
    var leftTeam = (setObj && (setObj.leftTeam || setObj.initialLeftTeam)) || defaultLeft;
    var rightTeam = (setObj && setObj.rightTeam) || (leftTeam === 'A' ? 'B' : 'A');

    var out = [];
    out.push('<g id="mb-set-' + slotNum + '" aria-label="Satz / Set ' + slotNum + '">');

    // Left Legend on Set 1 and Set 3
    if (slotNum === 1) {
      out.push(renderSetRowLegend(LAYOUT.legend1.x, LAYOUT.legend1.y, LAYOUT.legend1.w, LAYOUT.legend1.h, 4));
    } else if (slotNum === 3) {
      out.push(renderSetRowLegend(LAYOUT.legend3.x, LAYOUT.legend3.y, LAYOUT.legend3.w, LAYOUT.legend3.h, 4));
    }

    var vStripW = 30;
    out.push(renderVerticalSetStrip(box.x, box.y, vStripW, box.h, String(slotNum), ''));

    var panelsX = box.x + vStripW;
    var panelsW = box.w - vStripW;
    var halfW = panelsW / 2;

    out.push(renderTeamSetPanel({
      state: state, setObj: setObj, setIdx: setIdx, setKeyNum: slotNum,
      team: leftTeam, printedLetter: defaultLeft,
      panelMode: 'regular', sideRole: 'left',
      x: panelsX, y: box.y, w: halfW, h: box.h,
      ptsCols: 4, ptsRows: 12, ptsTotalW: 67.5, turnRowsCount: 4,
      interactive: interactive, printMode: printMode, hl: hl
    }));

    out.push(renderTeamSetPanel({
      state: state, setObj: setObj, setIdx: setIdx, setKeyNum: slotNum,
      team: rightTeam, printedLetter: defaultRight,
      panelMode: 'regular', sideRole: 'right',
      x: panelsX + halfW, y: box.y, w: halfW, h: box.h,
      ptsCols: 4, ptsRows: 12, ptsTotalW: 67.5, turnRowsCount: 4,
      interactive: interactive, printMode: printMode, hl: hl
    }));

    out.push('</g>');
    return out.join('');
  }

  /**
   * 3. Band 4 — Deciding Set 5 (3-Panel Tie-Break Box, x=283..1198, y=615..797) + Legend
   */
  function renderDecidingSetBox(state, interactive, printMode, hl) {
    var box = LAYOUT.set5;
    var bestOf = (state.meta && state.meta.bestOf === 3) ? 3 : 5;
    var decidingIdx = bestOf === 3 ? 2 : 4;
    var setObj = (state.sets && state.sets[decidingIdx]) || null;
    if ((!setObj || !setObj.isDeciding) && Array.isArray(state.sets)) {
      for (var i = 0; i < state.sets.length; i++) {
        if (state.sets[i] && state.sets[i].isDeciding) {
          decidingIdx = i;
          setObj = state.sets[i];
          break;
        }
      }
    }

    var setKeyNum = bestOf === 3 ? 3 : 5;
    var fallbackSetKeyNum = bestOf === 3 ? 5 : null;
    var leftInit = (setObj && (setObj.initialLeftTeam || setObj.leftTeam)) ||
      (state.toss && state.toss.decidingInitialLeft) || 'A';
    var otherTeam = leftInit === 'A' ? 'B' : 'A';

    var out = [];
    out.push('<g id="mb-set-deciding">');

    // Left Legend (3 rows: 1.|4., 2.|5., 3.|6.)
    out.push(renderSetRowLegend(LAYOUT.legend5.x, LAYOUT.legend5.y, LAYOUT.legend5.w, LAYOUT.legend5.h, 3));

    var vStripW = 30;
    out.push(renderVerticalSetStrip(box.x, box.y, vStripW, box.h, '5', bestOf === 3 ? '(3)' : ''));

    // Remaining width = 915 - 30 = 885:
    // Panel 1 (w=289, single Punkte col 1..8) + Panel 2 (w=293, 3 cols 1..30) + Seitenwechsel strip (w=14) + Panel 3 (w=289, 3 cols 1..30) = 885!
    var p1X = box.x + vStripW;
    var p1W = 289;
    var p2X = p1X + p1W;
    var p2W = 293;
    var swStripX = p2X + p2W;
    var swStripW = 14;
    var p3X = swStripX + swStripW;
    var p3W = (box.x + box.w) - p3X; // 289

    // Panel 1: initialLeftTeam pre-switch (Punkte 1..8 single column!)
    out.push(renderTeamSetPanel({
      state: state, setObj: setObj, setIdx: decidingIdx,
      setKeyNum: setKeyNum, fallbackSetKeyNum: fallbackSetKeyNum,
      team: leftInit, printedLetter: '',
      panelMode: 'pre', sideRole: 'left',
      x: p1X, y: box.y, w: p1W, h: box.h,
      ptsCols: 1, ptsRows: 8, ptsTotalW: 39, turnRowsCount: 3,
      interactive: interactive, printMode: printMode, hl: hl
    }));

    // Panel 2: otherTeam full set (Punkte 1..30 in 3 cols!)
    out.push(renderTeamSetPanel({
      state: state, setObj: setObj, setIdx: decidingIdx,
      setKeyNum: setKeyNum, fallbackSetKeyNum: fallbackSetKeyNum,
      team: otherTeam, printedLetter: '',
      panelMode: 'mid', sideRole: 'right',
      x: p2X, y: box.y, w: p2W, h: box.h,
      ptsCols: 3, ptsRows: 10, ptsTotalW: 54, turnRowsCount: 3,
      interactive: interactive, printMode: printMode, hl: hl
    }));

    // Vertical divider strip: Seitenwechsel/Changement/Cambio
    out.push('<rect class="mb-box" x="' + swStripX + '" y="' + box.y + '" width="' + swStripW + '" height="' + box.h + '" />');
    var swMidX = swStripX + swStripW / 2 + 2.2;
    var swMidY = box.y + box.h / 2;
    out.push(
      '<text class="mb-fnt" x="' + swMidX.toFixed(1) + '" y="' + swMidY.toFixed(1) +
      '" font-size="7.4" font-weight="700" text-anchor="middle" transform="rotate(-90 ' + swMidX.toFixed(1) + ' ' + swMidY.toFixed(1) + ')">Seitenwechsel/Changement/Cambio</text>'
    );

    // Panel 3: initialLeftTeam post-switch (Pkt. beim Seitenwechsel + Punkte 1..30 in 3 cols!)
    out.push(renderTeamSetPanel({
      state: state, setObj: setObj, setIdx: decidingIdx,
      setKeyNum: setKeyNum, fallbackSetKeyNum: fallbackSetKeyNum,
      team: leftInit, printedLetter: '',
      panelMode: 'post', sideRole: 'post',
      x: p3X, y: box.y, w: p3W, h: box.h,
      ptsCols: 3, ptsRows: 10, ptsTotalW: 54, turnRowsCount: 3,
      interactive: interactive, printMode: printMode, hl: hl
    }));

    out.push('</g>');
    return out.join('');
  }

  /**
   * Helper to embed base64 signature <image> inside a cell area.
   */
  function renderSignatureImage(x, y, w, h, sigDataUrl) {
    if (!sigDataUrl || typeof sigDataUrl !== 'string' || sigDataUrl.indexOf('data:image/') !== 0) {
      return '';
    }
    var pad = 2;
    return (
      '<image href="' + esc(sigDataUrl) + '" xlink:href="' + esc(sigDataUrl) + '" x="' + (x + pad).toFixed(1) +
      '" y="' + (y + pad).toFixed(1) + '" width="' + Math.max(8, w - pad * 2).toFixed(1) +
      '" height="' + Math.max(8, h - pad * 2).toFixed(1) + '" preserveAspectRatio="xMidYMid meet" />'
    );
  }

  /**
   * Official Swiss Volley Z-line strike across unused roster rows when match is live/finished.
   */
  function renderZStrike(x, yTop, w, yBottom) {
    var h = yBottom - yTop;
    if (h <= 2) return '';
    if (h <= 22) {
      var midY = (yTop + yBottom) / 2;
      return '<line class="mb-ink-stroke" stroke-width="1.3" stroke-opacity="0.78" x1="' + (x + 4).toFixed(1) + '" y1="' + midY.toFixed(1) + '" x2="' + (x + w - 4).toFixed(1) + '" y2="' + midY.toFixed(1) + '" />';
    }
    var p1 = (x + 4).toFixed(1) + ',' + (yTop + 4).toFixed(1);
    var p2 = (x + w - 4).toFixed(1) + ',' + (yTop + 4).toFixed(1);
    var p3 = (x + 4).toFixed(1) + ',' + (yBottom - 4).toFixed(1);
    var p4 = (x + w - 4).toFixed(1) + ',' + (yBottom - 4).toFixed(1);
    return '<polyline class="mb-ink-stroke" stroke-width="1.35" stroke-opacity="0.78" points="' + p1 + ' ' + p2 + ' ' + p3 + ' ' + p4 + '" />';
  }

  /**
   * 4. Lower-Right Quadrant — Mannschaften / Equipes / Squadre (Rosters, Liberos, Officials, Pre-Match Signatures)
   */
  function renderRostersQuadrant(state, interactive, hl) {
    var out = [];
    out.push('<g id="mb-section-rosters" aria-label="Mannschaften / Equipes / Squadre (Lizenz-Nr. / Geburtsdatum)">');
    out.push(renderSingleRoster('A', LAYOUT.rosterA, state, interactive, hl));
    out.push(renderSingleRoster('B', LAYOUT.rosterB, state, interactive, hl));

    // Centered top pill header straddling Roster A & B (exact match to Swiss Volley PDF!)
    var pillW = 148;
    var pillX = LAYOUT.rosters.x + (LAYOUT.rosters.w - pillW) / 2;
    var pillY = LAYOUT.rosters.y;
    out.push('<rect fill="#ffffff" stroke="#111111" stroke-width="0.75" x="' + pillX.toFixed(1) + '" y="' + pillY + '" width="' + pillW + '" height="12.5" />');
    out.push('<text class="mb-fnt" x="' + (pillX + pillW / 2).toFixed(1) + '" y="' + (pillY + 9.2) + '" font-size="7.4" font-weight="700" text-anchor="middle">Mannschaften/Equipes/Squadre</text>');

    out.push('</g>');
    return out.join('');
  }

  function renderSingleRoster(teamCode, box, state, interactive, hl) {
    var teamObj = (state.teams && state.teams[teamCode]) || {};
    var players = Array.isArray(teamObj.players) ? teamObj.players : [];
    var liberos = Array.isArray(teamObj.liberos) ? teamObj.liberos : [];
    var officials = teamObj.officials || {};
    var sigs = state.signatures || {};
    var started = isMatchStarted(state);

    var out = [];
    out.push('<g id="mb-roster-' + teamCode + '">');
    out.push('<rect class="mb-box" x="' + box.x + '" y="' + box.y + '" width="' + box.w + '" height="' + box.h + '" />');

    // 1. Team Header (h = 35, y = 615..650)
    var hdrH = 35;
    var isLeftRoster = teamCode === 'A';
    var showTeam = started || (teamObj.name && teamObj.name !== ('Team ' + teamCode));
    var teamNameDisp = showTeam ? (teamObj.name || '') : '';

    if (isLeftRoster) {
      out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + (box.x + 16) + '" cy="' + (box.y + 18) + '" r="11" />');
      if (showTeam) {
        out.push('<text class="mb-ink-sans" x="' + (box.x + 16) + '" y="' + (box.y + 22.5) + '" font-size="13" text-anchor="middle">A</text>');
      }
      out.push('<text class="mb-fnt" x="' + (box.x + 41) + '" y="' + (box.y + 12.5) + '" font-size="8.2" text-anchor="middle">A</text>');
      out.push('<text class="mb-fnt" x="' + (box.x + 41) + '" y="' + (box.y + 20.5) + '" font-size="5.6" text-anchor="middle">oder/ou/o</text>');
      out.push('<text class="mb-fnt" x="' + (box.x + 41) + '" y="' + (box.y + 30.5) + '" font-size="8.2" text-anchor="middle">B</text>');
      out.push('<line class="mb-dotted" x1="' + (box.x + 56) + '" y1="' + (box.y + 30) + '" x2="' + (box.x + box.w - 6) + '" y2="' + (box.y + 30) + '" />');
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'roster.' + teamCode + '.teamName', label: 'Roster Team A Name',
        x: box.x + 56, y: box.y + 12, w: box.w - 62, h: 20,
        value: teamNameDisp, align: 'left', fontSize: 11, maxChars: 22
      }));
    } else {
      out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + (box.x + box.w - 16) + '" cy="' + (box.y + 18) + '" r="11" />');
      if (showTeam) {
        out.push('<text class="mb-ink-sans" x="' + (box.x + box.w - 16) + '" y="' + (box.y + 22.5) + '" font-size="13" text-anchor="middle">B</text>');
      }
      out.push('<text class="mb-fnt" x="' + (box.x + box.w - 41) + '" y="' + (box.y + 12.5) + '" font-size="8.2" text-anchor="middle">A</text>');
      out.push('<text class="mb-fnt" x="' + (box.x + box.w - 41) + '" y="' + (box.y + 20.5) + '" font-size="5.6" text-anchor="middle">oder/ou/o</text>');
      out.push('<text class="mb-fnt" x="' + (box.x + box.w - 41) + '" y="' + (box.y + 30.5) + '" font-size="8.2" text-anchor="middle">B</text>');
      out.push('<line class="mb-dotted" x1="' + (box.x + 6) + '" y1="' + (box.y + 30) + '" x2="' + (box.x + box.w - 56) + '" y2="' + (box.y + 30) + '" />');
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'roster.' + teamCode + '.teamName', label: 'Roster Team B Name',
        x: box.x + 6, y: box.y + 12, w: box.w - 62, h: 20,
        value: teamNameDisp, align: 'left', fontSize: 11, maxChars: 22
      }));
    }

    // 2. Column Headers: Lizenz-Nr. (w=52) | Spieler-Nr. (w=36) | Name (w=139) = 227
    var colY = box.y + hdrH;
    var colH = 33;
    var wLic = 52;
    var wNr = 36;
    var wName = box.w - wLic - wNr;
    var xLic = box.x;
    var xNr = xLic + wLic;
    var xName = xNr + wNr;

    out.push('<line class="mb-grid" x1="' + box.x + '" y1="' + colY + '" x2="' + (box.x + box.w) + '" y2="' + colY + '" />');
    out.push('<line class="mb-grid" x1="' + box.x + '" y1="' + (colY + colH) + '" x2="' + (box.x + box.w) + '" y2="' + (colY + colH) + '" />');

    out.push(renderTriLabel(xLic + 3, colY + 9.5, ['Lizenz-Nr.', 'Licence-No.', 'Licenza-No.'], 6.2, 8.2));
    out.push(renderTriLabel(xNr + wNr / 2, colY + 9.5, ['Spieler-Nr.', 'Joueur-No.', 'Giocatore-No.'], 5.3, 8.2, '500', 'middle'));
    out.push(renderTriLabel(xName + 4, colY + 9.5, ['Name', 'Nom', 'Nome'], 6.4, 8.2));

    // 3. 14 Player Rows (h = 16.2 each -> 226.8px)
    var pStartY = colY + colH;
    var pRowH = 16.2;
    var pEndY = pStartY + 14 * pRowH;

    out.push('<line class="mb-grid" x1="' + xNr + '" y1="' + colY + '" x2="' + xNr + '" y2="' + pEndY + '" />');
    out.push('<line class="mb-grid" x1="' + xName + '" y1="' + colY + '" x2="' + xName + '" y2="' + pEndY + '" />');

    var firstEmptyPlayerRow = -1;
    for (var i = 0; i < 14; i++) {
      var py = pStartY + i * pRowH;
      out.push('<line class="mb-grid-thin" x1="' + box.x + '" y1="' + (py + pRowH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (py + pRowH).toFixed(1) + '" />');

      var pl = players[i] || null;
      var hasPl = !!(pl && (pl.number || pl.name));
      if (!hasPl && firstEmptyPlayerRow === -1) firstEmptyPlayerRow = i;

      var licOrDob = pl ? (pl.license || pl.birthdate || '') : '';
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'roster.' + teamCode + '.' + i + '.birthdate',
        label: 'Team ' + teamCode + ' Player ' + (i + 1) + ' License / Birthdate',
        x: xLic, y: py, w: wLic, h: pRowH,
        value: licOrDob, cls: 'mb-ink', fontSize: 7.8, maxChars: 11
      }));

      var isCap = !!(pl && pl.isCaptain);
      var capResolved = resolveValue(state, 'roster.' + teamCode + '.' + i + '.captain', isCap ? 'C' : '');
      var capCircle = '';
      if (capResolved && (pl && pl.number)) {
        capCircle = '<circle class="mb-ink-stroke" stroke-width="1.3" cx="' + (xNr + wNr / 2).toFixed(1) + '" cy="' + (py + pRowH / 2).toFixed(1) + '" r="7.2" />';
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'roster.' + teamCode + '.' + i + '.number',
        label: 'Team ' + teamCode + ' Player ' + (i + 1) + ' Jersey #',
        x: xNr, y: py, w: wNr, h: pRowH,
        value: pl ? (pl.number || '') : '', cls: 'mb-ink', fontSize: 10,
        extraSvg: capCircle
      }));

      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'roster.' + teamCode + '.' + i + '.name',
        label: 'Team ' + teamCode + ' Player ' + (i + 1) + ' Name',
        x: xName, y: py, w: wName, h: pRowH,
        value: pl ? (pl.name || '') : '', align: 'left', cls: 'mb-ink-sans', fontSize: 9.2, maxChars: 22
      }));
    }

    if (started && firstEmptyPlayerRow >= 0 && firstEmptyPlayerRow < 14) {
      out.push(renderZStrike(box.x, pStartY + firstEmptyPlayerRow * pRowH, box.w, pEndY));
    }

    // 4. LIBEROS («L») Header (h = 16) + 2 Rows (2 x 17 = 34px)
    var libHdrY = pEndY;
    var libHdrH = 16;
    out.push('<line class="mb-grid" x1="' + box.x + '" y1="' + (libHdrY + libHdrH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (libHdrY + libHdrH).toFixed(1) + '" />');
    out.push('<text class="mb-fnt" x="' + (box.x + box.w / 2) + '" y="' + (libHdrY + 11.5).toFixed(1) + '" font-size="8.2" text-anchor="middle">LIBEROS («L»)</text>');

    var libStartY = libHdrY + libHdrH;
    var libRowH = 17;
    var libEndY = libStartY + 2 * libRowH;
    out.push('<line class="mb-grid" x1="' + xNr + '" y1="' + libStartY.toFixed(1) + '" x2="' + xNr + '" y2="' + libEndY.toFixed(1) + '" />');
    out.push('<line class="mb-grid" x1="' + xName + '" y1="' + libStartY.toFixed(1) + '" x2="' + xName + '" y2="' + libEndY.toFixed(1) + '" />');

    var firstEmptyLibRow = -1;
    for (var li = 0; li < 2; li++) {
      var ly = libStartY + li * libRowH;
      out.push('<line class="mb-grid-thin" x1="' + box.x + '" y1="' + (ly + libRowH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (ly + libRowH).toFixed(1) + '" />');
      var lbObj = liberos[li] || null;
      if (!(lbObj && (lbObj.number || lbObj.name)) && firstEmptyLibRow === -1) firstEmptyLibRow = li;

      var libLic = lbObj ? (lbObj.license || lbObj.birthdate || '') : '';
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'libero.' + teamCode + '.' + li + '.birthdate',
        label: 'Team ' + teamCode + ' Libero ' + (li + 1) + ' License / Birthdate',
        x: xLic, y: ly, w: wLic, h: libRowH,
        value: libLic, cls: 'mb-ink', fontSize: 7.8, maxChars: 11
      }));

      var redesStrike = (lbObj && lbObj.redesignated)
        ? '<line class="mb-red-stroke" stroke-width="1.3" x1="' + (xNr + 4) + '" y1="' + (ly + libRowH - 3).toFixed(1) + '" x2="' + (xNr + wNr - 4) + '" y2="' + (ly + 3).toFixed(1) + '" />'
        : '';
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'libero.' + teamCode + '.' + li + '.number',
        label: 'Team ' + teamCode + ' Libero ' + (li + 1) + ' Jersey #',
        x: xNr, y: ly, w: wNr, h: libRowH,
        value: lbObj ? (lbObj.number || '') : '', cls: 'mb-ink', fontSize: 10,
        extraSvg: redesStrike
      }));

      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'libero.' + teamCode + '.' + li + '.name',
        label: 'Team ' + teamCode + ' Libero ' + (li + 1) + ' Name',
        x: xName, y: ly, w: wName, h: libRowH,
        value: lbObj ? (lbObj.name || '') : '', align: 'left', cls: 'mb-ink-sans', fontSize: 9.2, maxChars: 22
      }));
    }
    if (started && firstEmptyLibRow >= 0 && firstEmptyLibRow < 2) {
      out.push(renderZStrike(box.x, libStartY + firstEmptyLibRow * libRowH, box.w, libEndY));
    }

    // 5. Offizielle/Officiels/Ufficiali Header (h = 16) + 5 Rows (C, AC1, AC2, P, M -> 5 x 17 = 85px)
    var offHdrY = libEndY;
    var offHdrH = 16;
    out.push('<line class="mb-grid" x1="' + box.x + '" y1="' + (offHdrY + offHdrH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (offHdrY + offHdrH).toFixed(1) + '" />');
    out.push('<text class="mb-fnt" x="' + (box.x + box.w / 2) + '" y="' + (offHdrY + 11.5).toFixed(1) + '" font-size="8.2" text-anchor="middle">Offizielle/Officiels/Ufficiali</text>');

    var offRoles = [
      { code: 'C', prop: 'coach', label: 'Trainer / Coach (C)' },
      { code: 'AC1', prop: 'assistantCoach1', label: 'Ass.-Trainer 1 (AC1)' },
      { code: 'AC2', prop: 'assistantCoach2', label: 'Ass.-Trainer 2 (AC2)' },
      { code: 'P', prop: 'therapist', label: 'Physiotherapeut (P)' },
      { code: 'M', prop: 'doctor', label: 'Arzt / Doctor (M)' }
    ];
    var offStartY = offHdrY + offHdrH;
    var offRowH = 17;
    var offEndY = offStartY + 5 * offRowH;
    out.push('<line class="mb-grid" x1="' + xNr + '" y1="' + offStartY.toFixed(1) + '" x2="' + xNr + '" y2="' + offEndY.toFixed(1) + '" />');
    out.push('<line class="mb-grid" x1="' + xName + '" y1="' + offStartY.toFixed(1) + '" x2="' + xName + '" y2="' + offEndY.toFixed(1) + '" />');

    for (var oi = 0; oi < offRoles.length; oi++) {
      var oy = offStartY + oi * offRowH;
      var role = offRoles[oi];
      out.push('<line class="mb-grid-thin" x1="' + box.x + '" y1="' + (oy + offRowH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (oy + offRowH).toFixed(1) + '" />');
      out.push('<text class="mb-fnt" x="' + (xNr + wNr / 2) + '" y="' + (oy + 12.2).toFixed(1) + '" font-size="8.8" font-weight="800" text-anchor="middle">' + role.code + '</text>');

      var offVal = officials[role.prop] || '';
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'official.' + teamCode + '.' + role.prop,
        label: 'Team ' + teamCode + ' ' + role.label,
        x: xName, y: oy, w: wName, h: offRowH,
        value: offVal, align: 'left', cls: 'mb-ink-sans', fontSize: 9.2, maxChars: 22
      }));

      // Strike empty official rows when match has started (Anleitung 1.17, page 4)
      if (started && !resolveValue(state, 'official.' + teamCode + '.' + role.prop, offVal)) {
        out.push('<line class="mb-ink-stroke" stroke-width="1.0" stroke-opacity="0.6" x1="' + (xLic + 4) + '" y1="' + (oy + offRowH / 2).toFixed(1) + '" x2="' + (xLic + wLic - 4) + '" y2="' + (oy + offRowH / 2).toFixed(1) + '" />');
        out.push('<line class="mb-ink-stroke" stroke-width="1.0" stroke-opacity="0.6" x1="' + (xName + 4) + '" y1="' + (oy + offRowH / 2).toFixed(1) + '" x2="' + (box.x + box.w - 4) + '" y2="' + (oy + offRowH / 2).toFixed(1) + '" />');
      }
    }

    // 6. Unterschrift/Signature/Firma Header (h = 16) + Kapitän & Trainer rows (remaining ~82.2px)
    var sigHdrY = offEndY;
    var sigHdrH = 16;
    out.push('<line class="mb-grid" x1="' + box.x + '" y1="' + (sigHdrY + sigHdrH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (sigHdrY + sigHdrH).toFixed(1) + '" />');
    out.push('<text class="mb-fnt" x="' + (box.x + box.w / 2) + '" y="' + (sigHdrY + 11.5).toFixed(1) + '" font-size="8.2" text-anchor="middle">Unterschrift/Signature/Firma</text>');

    var sigRowsY = sigHdrY + sigHdrH;
    var sigTotalH = (box.y + box.h) - sigRowsY;
    var sigRowH = sigTotalH / 2;
    var capSigUrl = sigs['captain' + teamCode + '_pre'] || sigs['captain' + teamCode] || '';
    var coachSigUrl = sigs['coach' + teamCode] || '';

    out.push('<line class="mb-grid" x1="' + box.x + '" y1="' + (sigRowsY + sigRowH).toFixed(1) + '" x2="' + (box.x + box.w) + '" y2="' + (sigRowsY + sigRowH).toFixed(1) + '" />');

    out.push(renderTriLabel(box.x + 4, sigRowsY + 11, ['Kapitän', 'Capitaine', 'Capitano'], 6.4, 8.2));
    out.push(renderSignatureImage(box.x + 54, sigRowsY, box.w - 56, sigRowH, capSigUrl));

    out.push(renderTriLabel(box.x + 4, sigRowsY + sigRowH + 11, ['Trainer', 'Entraîneur', 'Allenatore'], 6.4, 8.2));
    out.push(renderSignatureImage(box.x + 54, sigRowsY + sigRowH, box.w - 56, sigRowH, coachSigUrl));

    out.push('</g>');
    return out.join('');
  }

  /**
   * 5A. Band 5 Left — Sanktionen / Sanctions / Sanzioni + Nicht ordnungsgemässer Antrag (x=18..321, y=805..1173)
   */
  function renderSanctionsBox(state, interactive, hl) {
    var sb = LAYOUT.sanctions;
    var out = [];

    out.push('<g id="mb-section-sanctions">');
    out.push('<rect class="mb-box" x="' + sb.x + '" y="' + sb.y + '" width="' + sb.w + '" height="' + sb.h + '" />');

    // Top Header (h = 48): Left = Sanktionen/Sanctions/Sanzioni, Right = Nicht ordnungsgemässer Antrag
    var topH = 48;
    var splitTopX = sb.x + 118;
    out.push('<line class="mb-grid" x1="' + splitTopX + '" y1="' + sb.y + '" x2="' + splitTopX + '" y2="' + (sb.y + topH) + '" />');
    out.push('<line class="mb-grid" x1="' + sb.x + '" y1="' + (sb.y + topH) + '" x2="' + (sb.x + sb.w) + '" y2="' + (sb.y + topH) + '" />');

    out.push('<text class="mb-fnt" x="' + (sb.x + 6) + '" y="' + (sb.y + 15) + '" font-size="11.5" font-weight="800">Sanktionen</text>');
    out.push('<text class="mb-fnt" x="' + (sb.x + 6) + '" y="' + (sb.y + 28.5) + '" font-size="11.5" font-weight="800">Sanctions</text>');
    out.push('<text class="mb-fnt" x="' + (sb.x + 6) + '" y="' + (sb.y + 42) + '" font-size="11.5" font-weight="800">Sanzioni</text>');

    var irMidX = splitTopX + (sb.x + sb.w - splitTopX) / 2;
    out.push(renderTriLabel(irMidX, sb.y + 9, [
      'Nicht ordnungsgemässer Antrag',
      'Demande non fondée',
      'Richiesta impropria'
    ], 5.8, 6.8, '500', 'middle'));

    var ir = state.improperRequests || {};
    if (hl && hl.section('improperrequest')) {
      out.push(renderHighlightRect(splitTopX + 2, sb.y + 24, sb.w - 122, 22, 1.5));
    }

    // Team (A)   :   Team (B)
    var cAx = splitTopX + 44;
    var cBx = sb.x + sb.w - 16;
    var cIrY = sb.y + 36.5;
    out.push('<text class="mb-fnt" x="' + (splitTopX + 5) + '" y="' + (cIrY + 3.5) + '" font-size="9" font-weight="800">Team</text>');
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + cAx + '" cy="' + cIrY + '" r="8.5" />');
    out.push('<text class="mb-fnt" x="' + cAx + '" y="' + (cIrY + 3.5) + '" font-size="9.5" text-anchor="middle">A</text>');

    out.push('<text class="mb-fnt" x="' + ((cAx + cBx) / 2 - 14).toFixed(1) + '" y="' + (cIrY + 3.5) + '" font-size="9">:</text>');

    out.push('<text class="mb-fnt" x="' + (cBx - 39) + '" y="' + (cIrY + 3.5) + '" font-size="9" font-weight="800">Team</text>');
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + cBx + '" cy="' + cIrY + '" r="8.5" />');
    out.push('<text class="mb-fnt" x="' + cBx + '" y="' + (cIrY + 3.5) + '" font-size="9.5" text-anchor="middle">B</text>');

    ['A', 'B'].forEach(function (tCode) {
      var cx = tCode === 'A' ? cAx : cBx;
      var hasFlag = !!(ir[tCode]);
      var irVal = resolveValue(state, 'improper.' + tCode, hasFlag ? 'X' : '');
      var xCross = '';
      if (irVal && irVal !== '0' && irVal !== 'false') {
        xCross = '<path class="mb-ink-stroke" stroke-width="1.9" d="M' + (cx - 6) + ',' + (cIrY - 6) + ' L' + (cx + 6) + ',' + (cIrY + 6) + ' M' + (cx + 6) + ',' + (cIrY - 6) + ' L' + (cx - 6) + ',' + (cIrY + 6) + '" />';
      }
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'improper.' + tCode, label: 'Improper Request Team ' + tCode + ' (X or empty)',
        x: cx - 9, y: cIrY - 9, w: 18, h: 18,
        value: '', extraSvg: xCross
      }));
    });

    // Column Headers (h = 33, y = 853..886)
    var thY = sb.y + topH;
    var thH = 33;
    var colWidths = [41, 41, 43, 43, 34, 30, 71]; // sum = 303
    var colXs = [];
    var accX = sb.x;
    for (var c = 0; c < colWidths.length; c++) {
      colXs.push(accX);
      accX += colWidths[c];
    }

    var rowsStartY = thY + thH;
    var sRowH = 19.3;
    var numRows = 10;
    var rowsEndY = rowsStartY + numRows * sRowH;

    out.push('<line class="mb-grid" x1="' + sb.x + '" y1="' + rowsStartY + '" x2="' + (sb.x + sb.w) + '" y2="' + rowsStartY + '" />');
    for (var cv = 1; cv < colWidths.length; cv++) {
      out.push('<line class="mb-grid" x1="' + colXs[cv] + '" y1="' + thY + '" x2="' + colXs[cv] + '" y2="' + rowsEndY.toFixed(1) + '" />');
    }

    out.push(renderTriLabel(colXs[0] + 2, thY + 9.5, ['Verwarnung', 'Avertissement', 'Avvertimento'], 5.3, 7.6));
    out.push(renderTriLabel(colXs[1] + 2, thY + 9.5, ['Bestrafung', 'Pénalisation', 'Penalizzazione'], 5.3, 7.6));
    out.push(renderTriLabel(colXs[2] + 2, thY + 9.5, ['Hinausstellung', 'Expulsion', 'Espulsione'], 5.2, 7.6));
    out.push(renderTriLabel(colXs[3] + 2, thY + 9.5, ['Disqualifikation', 'Disqualification', 'Squalifica'], 5.1, 7.6));

    // (A) oder/ou/o (B) header in col 4
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.6" cx="' + (colXs[4] + 8.5) + '" cy="' + (thY + 9) + '" r="5.5" />');
    out.push('<text class="mb-fnt" x="' + (colXs[4] + 8.5) + '" y="' + (thY + 11.5) + '" font-size="6.8" text-anchor="middle">A</text>');
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.6" cx="' + (colXs[4] + 8.5) + '" cy="' + (thY + 23.5) + '" r="5.5" />');
    out.push('<text class="mb-fnt" x="' + (colXs[4] + 8.5) + '" y="' + (thY + 26) + '" font-size="6.8" text-anchor="middle">B</text>');
    out.push(renderTriLabel(colXs[4] + 24, thY + 10.5, ['oder', 'ou', 'o'], 5.3, 6.8, '500', 'middle'));

    out.push(renderTriLabel(colXs[5] + colWidths[5] / 2, thY + 13, ['Satz', 'Set'], 6.2, 8.2, '500', 'middle'));
    out.push(renderTriLabel(colXs[6] + colWidths[6] / 2, thY + 9.5, ['Spielstand', 'Résultat', 'Risultato'], 6.0, 7.6, '500', 'middle'));

    // 10 Sanction Rows
    var sanctions = Array.isArray(state.sanctions) ? state.sanctions : [];
    var colLabels = ['Verwarnung', 'Bestrafung', 'Hinausstellung', 'Disqualifikation', 'Team A/B', 'Satz', 'Spielstand'];
    var subKeys = ['W', 'P', 'E', 'D', 'team', 'set', 'score'];

    for (var r = 0; r < numRows; r++) {
      var ry = rowsStartY + r * sRowH;
      out.push('<line class="mb-grid-thin" x1="' + sb.x + '" y1="' + (ry + sRowH).toFixed(1) + '" x2="' + (sb.x + sb.w) + '" y2="' + (ry + sRowH).toFixed(1) + '" />');
      out.push('<text class="mb-fnt" x="' + (colXs[6] + colWidths[6] / 2).toFixed(1) + '" y="' + (ry + 13.5).toFixed(1) + '" font-size="9" text-anchor="middle">:</text>');

      var sEntry = sanctions[r] || null;
      var wVal = '', pVal = '', eVal = '', dVal = '', abVal = '', setVal = '', scVal = '';

      if (sEntry) {
        var sType = String(sEntry.sanctionType || sEntry.type || '').toLowerCase();
        var isDelay = sType.indexOf('delay') !== -1 || !!sEntry.isDelay;
        var who = isDelay ? 'D' : String(sEntry.person || sEntry.playerOrOfficial || sEntry.player || sEntry.target || sEntry.symbol || 'X');

        if (sType === 'warning' || sType === 'w' || sType === 'yellow' || sType === 'delaywarning' || sType === 'delay_warning') {
          wVal = who;
        } else if (sType === 'penalty' || sType === 'p' || sType === 'red' || sType === 'delaypenalty' || sType === 'delay_penalty') {
          pVal = who;
        } else if (sType === 'expulsion' || sType === 'e') {
          eVal = who;
        } else if (sType === 'disqualification' || sType === 'd') {
          dVal = who;
        } else {
          wVal = who;
        }

        abVal = sEntry.team || '';
        setVal = sEntry.set !== undefined ? String(sEntry.set) : (sEntry.setNumber !== undefined ? String(sEntry.setNumber) : (sEntry.setIndex !== undefined ? String(sEntry.setIndex + 1) : ''));
        if (typeof sEntry.score === 'string') {
          scVal = sEntry.score.replace(':', ' : ').replace(/\s+/g, ' ');
        } else if (sEntry.score && typeof sEntry.score === 'object') {
          if (sEntry.score.team !== undefined && sEntry.score.opp !== undefined) {
            scVal = sEntry.score.team + ' : ' + sEntry.score.opp;
          } else if (sEntry.score.A !== undefined && sEntry.score.B !== undefined) {
            scVal = (abVal === 'B') ? (sEntry.score.B + ' : ' + sEntry.score.A) : (sEntry.score.A + ' : ' + sEntry.score.B);
          }
        }
      }

      if (hl && sEntry && r === sanctions.length - 1 && hl.section('sanctions')) {
        out.push(renderHighlightRect(sb.x + 1, ry, sb.w - 2, sRowH, 1.5));
      }

      var vals = [wVal, pVal, eVal, dVal, abVal, setVal, scVal];
      for (var sc = 0; sc < 7; sc++) {
        out.push(renderEditableText({
          state: state, interactive: interactive, hl: hl,
          key: 'sanction.' + r + '.' + subKeys[sc],
          label: 'Sanction Row ' + (r + 1) + ' ' + colLabels[sc],
          x: colXs[sc], y: ry, w: colWidths[sc], h: sRowH,
          value: vals[sc], cls: 'mb-ink', fontSize: 9.8, colonSplit: sc === 6
        }));
      }
    }

    // Authentic Swiss Volley trilingual explanation footer (y = 1084 .. 1173)
    var footLines = [
      'Sanktionen eintragen: Die zutreffende Abkürzung (Nr. des Spielers, C = Trainer, AC1/AC2 =',
      'Trainerassistenten, P = Physio, M = Arzt, und D = Spielverzögerungen) in die entsprechende Spalte',
      'eintragen, Mannschaft bezeichnen, Satz und Spielstand im Moment der Sanktion eintragen.',
      'Pour inscrire les sanctions: mettre l\'abréviation correspondante (No pour le joueur, C = Entraîneur,',
      'AC1/AC2 = Entraîneurs adjoints, P = Physio, M = Médecin ou D pour retard de jeu), dans la colonne et',
      'indiquer l\'équipe, le set et le score au moment de la sanction.',
      'Per iscrivere le sanzioni: mettere l\'abbreviazione corrispondente (No del giocatore, C = Allenatore,',
      'AC1/AC2 = Aiuto Allenatori, P = Terapeuta, M = Medico, D per ritardo inizio del gioco), nella colonna e',
      'indicare la formazione, il set, il punteggio al momento della sanzione.'
    ];
    for (var fl = 0; fl < footLines.length; fl++) {
      out.push(
        '<text class="mb-fnt" x="' + (sb.x + 4) + '" y="' + (rowsEndY + 9.5 + fl * 9.1).toFixed(1) +
        '" font-size="5.6">' + esc(footLines[fl]) + '</text>'
      );
    }

    out.push('</g>');
    return out.join('');
  }

  /**
   * 5B. Band 5 Center-Left — Bemerkungen/Remarques/Osservazioni (top) + Bestätigung/Approbation/Approvazione (bottom)
   */
  function renderRemarksAndApproval(state, interactive, hl) {
    var rb = LAYOUT.remarks;
    var ab = LAYOUT.approval;
    var meta = state.meta || {};
    var sigs = state.signatures || {};
    var out = [];

    // --- 1. Bemerkungen/Remarques/Osservazioni (x=331, y=805, w=568, h=122) ---
    out.push('<g id="mb-section-remarks">');
    out.push('<rect class="mb-box" x="' + rb.x + '" y="' + rb.y + '" width="' + rb.w + '" height="' + rb.h + '" />');
    out.push('<line class="mb-grid" x1="' + rb.x + '" y1="' + (rb.y + 22) + '" x2="' + (rb.x + rb.w) + '" y2="' + (rb.y + 22) + '" />');
    out.push('<text class="mb-fnt" x="' + (rb.x + 6) + '" y="' + (rb.y + 15.5) + '" font-size="10.2" font-weight="800">Bemerkungen/Remarques/Osservazioni</text>');

    var lineStep = 25;
    for (var ln = 1; ln <= 3; ln++) {
      var ly = rb.y + 22 + ln * lineStep;
      out.push('<line class="mb-grid-thin" x1="' + rb.x + '" y1="' + ly + '" x2="' + (rb.x + rb.w) + '" y2="' + ly + '" />');
    }

    var remarksText = resolveValue(state, 'remarks', state.remarks || '');
    var rLines = wrapLines(remarksText, 82, 4);

    if (hl && (hl.section('remarks') || hl.cellKey('remarks'))) {
      out.push(renderHighlightRect(rb.x + 2, rb.y + 23, rb.w - 4, rb.h - 25, 1.5));
    }

    if (interactive) {
      var rOver = hasOverride(state, 'remarks') ? ' class="mb-overridden"' : '';
      out.push('<g' + rOver + ' data-cell-key="remarks" data-cell-label="Bemerkungen / Remarques / Remarks" data-cell-value="' + esc(remarksText) + '">');
      out.push('<rect class="mb-cell-hit" x="' + (rb.x + 1) + '" y="' + (rb.y + 22) + '" width="' + (rb.w - 2) + '" height="' + (rb.h - 23) + '" />');
    }
    for (var rl = 0; rl < rLines.length; rl++) {
      out.push(
        '<text class="mb-ink-sans" x="' + (rb.x + 6) + '" y="' + (rb.y + 22 + (rl + 1) * lineStep - 6) +
        '" font-size="10">' + esc(rLines[rl]) + '</text>'
      );
    }
    if (interactive) out.push('</g>');
    out.push('</g>');

    // --- 2. Bestätigung/Approbation/Approvazione (x=331, y=934, w=568, h=239) ---
    out.push('<g id="mb-section-approval" aria-label="Bestätigung / Approbation / Approval">');
    out.push('<rect class="mb-box" x="' + ab.x + '" y="' + ab.y + '" width="' + ab.w + '" height="' + ab.h + '" />');

    var titleH = 18;
    var subHdrY = ab.y + titleH;
    var subHdrH = 28;
    var rowsY = subHdrY + subHdrH;
    var refRowH = 26.8;
    var ljY = rowsY + 4 * refRowH;
    var ljRowH = 24;
    var capY = ljY + 2 * ljRowH;

    out.push('<line class="mb-grid" x1="' + ab.x + '" y1="' + subHdrY + '" x2="' + (ab.x + ab.w) + '" y2="' + subHdrY + '" />');
    out.push('<text class="mb-fnt" x="' + (ab.x + ab.w / 2) + '" y="' + (ab.y + 13.2) + '" font-size="10.2" font-weight="800" text-anchor="middle">Bestätigung/Approbation/Approvazione</text>');

    // Columns: Role(66) | Name(162) | Land(80) | Lizenz-Nr.(74) | Unterschrift(186) = 568
    var xRole = ab.x;
    var xName = xRole + 66;
    var xLand = xName + 162;
    var xLic = xLand + 80;
    var xSig = xLic + 74;

    out.push('<line class="mb-grid" x1="' + ab.x + '" y1="' + rowsY + '" x2="' + (ab.x + ab.w) + '" y2="' + rowsY + '" />');
    out.push('<line class="mb-grid" x1="' + xName + '" y1="' + subHdrY + '" x2="' + xName + '" y2="' + capY + '" />');
    // Land divider spans subHdr + Referees 1 & 2 (and also splits Line Judges 1/3 vs 2/4 below!)
    out.push('<line class="mb-grid" x1="' + xLand + '" y1="' + subHdrY + '" x2="' + xLand + '" y2="' + (rowsY + 2 * refRowH) + '" />');
    out.push('<line class="mb-grid" x1="' + xLic + '" y1="' + subHdrY + '" x2="' + xLic + '" y2="' + ljY + '" />');
    out.push('<line class="mb-grid" x1="' + xSig + '" y1="' + subHdrY + '" x2="' + xSig + '" y2="' + ljY + '" />');

    out.push(renderTriLabel(xRole + 4, subHdrY + 9, ['Schiedsrichter', 'Arbitres', 'Arbitri'], 6.1, 7.6));
    out.push(renderTriLabel(xName + 4, subHdrY + 9, ['Name', 'Nom', 'Nome'], 6.2, 7.6));
    out.push(renderTriLabel(xLand + 4, subHdrY + 9, ['Land', 'Pays', 'Paese'], 6.2, 7.6));
    out.push(renderTriLabel(xLic + 4, subHdrY + 9, ['Lizenz-Nr.', 'Licence-No', 'Licenza-No'], 6.2, 7.6));
    out.push(renderTriLabel(xSig + 4, subHdrY + 9, ['Unterschrift', 'Signature', 'Firma'], 6.2, 7.6));

    if (hl && hl.section('signatures')) {
      out.push(renderHighlightRect(xSig, rowsY, ab.x + ab.w - xSig, 4 * refRowH, 1.5));
    }

    var offRows = [
      { roleLbl: '1.', key: 'meta.referee1', lbl: '1. Schiedsrichter', val: meta.referee1 || '', sigRole: 'referee1', hasLand: true },
      { roleLbl: '2.', key: 'meta.referee2', lbl: '2. Schiedsrichter', val: meta.referee2 || '', sigRole: 'referee2', hasLand: true },
      { tri: ['Schreiber', 'Marqueur', 'Marcatore'], key: 'meta.scorer', lbl: 'Schreiber / Scorer', val: meta.scorer || '', sigRole: 'scorer', hasLand: false },
      { tri: ['Schreiber Ass.', 'Marqueur adj.', 'Marcatore ass.'], key: 'meta.assistantScorer', lbl: 'Schreiber Ass. / Asst. Scorer', val: meta.assistantScorer || '', sigRole: 'assistantScorer', hasLand: false }
    ];

    for (var ri = 0; ri < 4; ri++) {
      var ry = rowsY + ri * refRowH;
      var item = offRows[ri];
      out.push('<line class="mb-grid" x1="' + ab.x + '" y1="' + (ry + refRowH) + '" x2="' + (ab.x + ab.w) + '" y2="' + (ry + refRowH) + '" />');

      if (item.roleLbl) {
        out.push('<text class="mb-fnt" x="' + (xRole + 6) + '" y="' + (ry + 18) + '" font-size="11.5">' + item.roleLbl + '</text>');
      } else if (item.tri) {
        out.push(renderTriLabel(xRole + 4, ry + 8.5, item.tri, 5.8, 7.0));
      }

      var nameW = item.hasLand ? 162 : (162 + 80);
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: item.key, label: item.lbl + ' Name',
        x: xName, y: ry, w: nameW, h: refRowH,
        value: item.val, align: 'left', cls: 'mb-ink-sans', fontSize: 10.2, maxChars: item.hasLand ? 24 : 34
      }));

      if (item.hasLand) {
        out.push(renderEditableText({
          state: state, interactive: interactive, hl: hl,
          key: item.key + '.country', label: item.lbl + ' Land / Country',
          x: xLand, y: ry, w: 80, h: refRowH,
          value: meta[item.sigRole + 'Country'] || '', cls: 'mb-ink-sans', fontSize: 9.5, maxChars: 10
        }));
      }

      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: item.key + '.license', label: item.lbl + ' Lizenz-Nr.',
        x: xLic, y: ry, w: 74, h: refRowH,
        value: meta[item.sigRole + 'License'] || '', cls: 'mb-ink', fontSize: 9.2, maxChars: 10
      }));

      out.push(renderSignatureImage(xSig, ry, (ab.x + ab.w) - xSig, refRowH, sigs[item.sigRole] || ''));
    }

    // Line Judges 1..4 (2x2 grid)
    var ljs = Array.isArray(meta.lineJudges) ? meta.lineJudges : [];
    var ljMidX = xName + ((ab.x + ab.w) - xName) / 2;
    out.push('<line class="mb-grid" x1="' + xName + '" y1="' + (ljY + ljRowH) + '" x2="' + (ab.x + ab.w) + '" y2="' + (ljY + ljRowH) + '" />');
    out.push('<line class="mb-grid" x1="' + ljMidX.toFixed(1) + '" y1="' + ljY + '" x2="' + ljMidX.toFixed(1) + '" y2="' + capY + '" />');
    out.push('<line class="mb-grid" x1="' + ab.x + '" y1="' + capY + '" x2="' + (ab.x + ab.w) + '" y2="' + capY + '" />');

    out.push(renderTriLabel(xRole + 4, ljY + 14, ['Linienrichter', 'Juges de ligne', 'Giudici di linea'], 6.0, 8.0));

    var ljCells = [
      { idx: 0, num: '1.', x: xName, y: ljY, w: ljMidX - xName },
      { idx: 1, num: '2.', x: ljMidX, y: ljY, w: (ab.x + ab.w) - ljMidX },
      { idx: 2, num: '3.', x: xName, y: ljY + ljRowH, w: ljMidX - xName },
      { idx: 3, num: '4.', x: ljMidX, y: ljY + ljRowH, w: (ab.x + ab.w) - ljMidX }
    ];
    for (var lc = 0; lc < ljCells.length; lc++) {
      var cell = ljCells[lc];
      out.push('<text class="mb-fnt" x="' + (cell.x + 6).toFixed(1) + '" y="' + (cell.y + 16.5).toFixed(1) + '" font-size="10.5">' + cell.num + '</text>');
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'meta.lineJudge.' + cell.idx, label: 'Linienrichter / Line Judge ' + (cell.idx + 1),
        x: cell.x + 22, y: cell.y, w: cell.w - 24, h: ljRowH,
        value: ljs[cell.idx] || '', align: 'left', cls: 'mb-ink-sans', fontSize: 9.8, maxChars: 28
      }));
    }

    // Unterschrift Kapitäne (A) (B) post-match row (y = 1140..1173, h = 33)
    var capH = (ab.y + ab.h) - capY;
    out.push(renderTriLabel(xRole + 4, capY + 9.5, [
      'Unterschrift Kapitäne',
      'Signature Capitaines',
      'Firma Capitani'
    ], 6.0, 7.5));

    var capACx = xLand + 22;
    var capBCx = xLic + 52;
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + capACx + '" cy="' + (capY + capH / 2).toFixed(1) + '" r="9.5" />');
    out.push('<text class="mb-fnt" x="' + capACx + '" y="' + (capY + capH / 2 + 3.5).toFixed(1) + '" font-size="10.5" text-anchor="middle">A</text>');
    out.push(renderSignatureImage(capACx + 12, capY + 1, capBCx - capACx - 26, capH - 2, sigs.captainA_post || ''));

    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.75" cx="' + capBCx + '" cy="' + (capY + capH / 2).toFixed(1) + '" r="9.5" />');
    out.push('<text class="mb-fnt" x="' + capBCx + '" y="' + (capY + capH / 2 + 3.5).toFixed(1) + '" font-size="10.5" text-anchor="middle">B</text>');
    out.push(renderSignatureImage(capBCx + 12, capY + 1, (ab.x + ab.w) - (capBCx + 14), capH - 2, sigs.captainB_post || ''));

    out.push('</g>');
    return out.join('');
  }

  /**
   * 5C. Band 5 Center-Right — Endresultat / Résultat final / Risultato finale (x=908..1198, y=805..1173)
   * Matches Swiss Volley PDF & Anleitung page 17 1:1!
   */
  function renderEndresultatBox(state, interactive, hl) {
    var eb = LAYOUT.results;
    var summary = getSummary(state);
    var teams = state.teams || {};
    var started = isMatchStarted(state);
    var teamA = teams.A || {};
    var teamB = teams.B || {};
    var showTeamNames = started || (teamA.name && teamA.name !== 'Team A') || (teamB.name && teamB.name !== 'Team B');
    var teamAName = showTeamNames ? (teamA.shortName && (teamA.name || '').length > 16 ? teamA.name : (teamA.name || '')) : '';
    var teamBName = showTeamNames ? (teamB.shortName && (teamB.name || '').length > 16 ? teamB.name : (teamB.name || '')) : '';
    var fullWinnerName = summary.matchWinner
      ? ((teams[summary.matchWinner] && teams[summary.matchWinner].name) || ('Team ' + summary.matchWinner))
      : '';

    var out = [];
    out.push('<g id="mb-section-results">');
    out.push('<rect class="mb-box" x="' + eb.x + '" y="' + eb.y + '" width="' + eb.w + '" height="' + eb.h + '" />');

    // Title Row (h = 21)
    var titleH = 21;
    out.push('<line class="mb-grid" x1="' + eb.x + '" y1="' + (eb.y + titleH) + '" x2="' + (eb.x + eb.w) + '" y2="' + (eb.y + titleH) + '" />');
    out.push('<text class="mb-fnt" x="' + (eb.x + eb.w / 2) + '" y="' + (eb.y + 15) + '" font-size="10.2" font-weight="800" text-anchor="middle">Endresultat/Résultat final/Risultato finale</text>');

    // Team Subheader Row (h = 33, y = 826..859)
    var teamY = eb.y + titleH;
    var teamH = 33;
    var midX = eb.x + eb.w / 2;
    out.push('<line class="mb-grid" x1="' + eb.x + '" y1="' + (teamY + teamH) + '" x2="' + (eb.x + eb.w) + '" y2="' + (teamY + teamH) + '" />');

    out.push(renderTriLabel(eb.x + 4, teamY + 9, ['Mannschaft', 'Equipe', 'Squadra'], 5.8, 7.2));
    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.7" cx="' + (midX - 9) + '" cy="' + (teamY + 10) + '" r="6" />');
    out.push('<text class="mb-fnt" x="' + (midX - 9) + '" y="' + (teamY + 12.6) + '" font-size="7.5" font-weight="700" text-anchor="middle">A</text>');
    out.push('<line class="mb-dotted" x1="' + (eb.x + 38) + '" y1="' + (teamY + 28) + '" x2="' + (midX - 4) + '" y2="' + (teamY + 28) + '" />');
    out.push('<text class="mb-ink-sans" x="' + (eb.x + 40) + '" y="' + (teamY + 25.5) + '" font-size="9.5">' + esc(truncate(teamAName, 15)) + '</text>');

    out.push('<circle fill="#ffffff" stroke="#111111" stroke-width="0.7" cx="' + (midX + 9) + '" cy="' + (teamY + 10) + '" r="6" />');
    out.push('<text class="mb-fnt" x="' + (midX + 9) + '" y="' + (teamY + 12.6) + '" font-size="7.5" font-weight="700" text-anchor="middle">B</text>');
    out.push(renderTriLabel(eb.x + eb.w - 4, teamY + 9, ['Mannschaft', 'Equipe', 'Squadra'], 5.8, 7.2, '500', 'end'));
    out.push('<line class="mb-dotted" x1="' + (midX + 4) + '" y1="' + (teamY + 28) + '" x2="' + (eb.x + eb.w - 38) + '" y2="' + (teamY + 28) + '" />');
    out.push('<text class="mb-ink-sans" x="' + (eb.x + eb.w - 40) + '" y="' + (teamY + 25.5) + '" font-size="9.5" text-anchor="end">' + esc(truncate(teamBName, 15)) + '</text>');

    // Column Headers (h = 28, y = 859..887):
    // A: "T"(24), S(24), W(24), Punkte(32) [104] | Satz (Dauer) [82] | B: Punkte(32), W(24), S(24), "T"(24) [104] = 290!
    var colHdrY = teamY + teamH;
    var colHdrH = 28;
    var rWidths = [24, 24, 24, 32, 82, 32, 24, 24, 24];
    var rXs = [];
    var curX = eb.x;
    for (var ci = 0; ci < rWidths.length; ci++) {
      rXs.push(curX);
      curX += rWidths[ci];
    }

    var rowsStartY = colHdrY + colHdrH;
    var setRowH = 30.2;
    var totY = rowsStartY + 5 * setRowH;
    var tableBottomY = totY + 32;

    out.push('<line class="mb-grid" x1="' + eb.x + '" y1="' + rowsStartY + '" x2="' + (eb.x + eb.w) + '" y2="' + rowsStartY + '" />');
    for (var cj = 1; cj < rWidths.length; cj++) {
      var strongV = (cj === 4 || cj === 5);
      out.push('<line class="' + (strongV ? 'mb-grid-strong' : 'mb-grid') + '" x1="' + rXs[cj] + '" y1="' + colHdrY + '" x2="' + rXs[cj] + '" y2="' + tableBottomY + '" />');
    }

    // Header labels
    out.push('<text class="mb-fnt" x="' + (rXs[0] + 12) + '" y="' + (colHdrY + 18) + '" font-size="9.5" font-weight="800" text-anchor="middle">&quot;T&quot;</text>');
    out.push('<text class="mb-fnt" x="' + (rXs[1] + 12) + '" y="' + (colHdrY + 18) + '" font-size="9.5" text-anchor="middle">S</text>');
    out.push('<text class="mb-fnt" x="' + (rXs[2] + 12) + '" y="' + (colHdrY + 18) + '" font-size="9.5" text-anchor="middle">W</text>');
    out.push(renderTriLabel(rXs[3] + 16, colHdrY + 8.5, ['Punkte', 'Points', 'Punti'], 5.5, 7.2, '500', 'middle'));

    out.push(renderTriLabel(rXs[4] + 41, colHdrY + 8.5, ['Satz (Dauer)', 'Set (Durée)', 'Set (Durata)'], 5.8, 7.2, '500', 'middle'));

    out.push(renderTriLabel(rXs[5] + 16, colHdrY + 8.5, ['Punkte', 'Points', 'Punti'], 5.5, 7.2, '500', 'middle'));
    out.push('<text class="mb-fnt" x="' + (rXs[6] + 12) + '" y="' + (colHdrY + 18) + '" font-size="9.5" text-anchor="middle">W</text>');
    out.push('<text class="mb-fnt" x="' + (rXs[7] + 12) + '" y="' + (colHdrY + 18) + '" font-size="9.5" text-anchor="middle">S</text>');
    out.push('<text class="mb-fnt" x="' + (rXs[8] + 12) + '" y="' + (colHdrY + 18) + '" font-size="9.5" font-weight="800" text-anchor="middle">&quot;T&quot;</text>');

    // 5 Set Rows (1..5)
    for (var sr = 0; sr < 5; sr++) {
      var sRow = summary.rows[sr];
      var sy = rowsStartY + sr * setRowH;
      out.push('<line class="mb-grid-thin" x1="' + eb.x + '" y1="' + (sy + setRowH) + '" x2="' + (eb.x + eb.w) + '" y2="' + (sy + setRowH) + '" />');

      var slot = sRow.slot;
      var durStr = (sRow.durationMin !== null && sRow.durationMin !== undefined) ? (sRow.durationMin + "'") : '';

      // Pre-printed "1. (       )" format in center column
      out.push('<text class="mb-fnt" x="' + (rXs[4] + 8) + '" y="' + (sy + 20) + '" font-size="8.2">' + slot + '.  (</text>');
      out.push('<text class="mb-fnt" x="' + (rXs[4] + rWidths[4] - 7) + '" y="' + (sy + 20) + '" font-size="8.2" text-anchor="end">)</text>');
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'result.set.' + slot + '.duration', label: 'Set ' + slot + ' Duration (min)',
        x: rXs[4] + 24, y: sy, w: rWidths[4] - 34, h: setRowH,
        value: durStr, cls: 'mb-ink', fontSize: 10
      }));

      var aCells = [['T', sRow.A.T], ['S', sRow.A.S], ['W', sRow.A.W], ['P', sRow.A.P]];
      var bCells = [['P', sRow.B.P], ['W', sRow.B.W], ['S', sRow.B.S], ['T', sRow.B.T]];
      for (var ac = 0; ac < 4; ac++) {
        out.push(renderEditableText({
          state: state, interactive: interactive, hl: hl,
          key: 'result.set.' + slot + '.A.' + aCells[ac][0],
          label: 'Set ' + slot + ' Team A ' + aCells[ac][0],
          x: rXs[ac], y: sy, w: rWidths[ac], h: setRowH,
          value: aCells[ac][1], cls: 'mb-ink', fontSize: ac === 3 ? 11 : 10
        }));
        out.push(renderEditableText({
          state: state, interactive: interactive, hl: hl,
          key: 'result.set.' + slot + '.B.' + bCells[ac][0],
          label: 'Set ' + slot + ' Team B ' + bCells[ac][0],
          x: rXs[5 + ac], y: sy, w: rWidths[5 + ac], h: setRowH,
          value: bCells[ac][1], cls: 'mb-ink', fontSize: ac === 0 ? 11 : 10
        }));
      }
    }

    // Total Row (y = 1042..1075, h = 33)
    var totH = tableBottomY - totY;
    out.push('<line class="mb-grid-strong" x1="' + eb.x + '" y1="' + totY + '" x2="' + (eb.x + eb.w) + '" y2="' + totY + '" />');
    out.push('<line class="mb-grid-strong" x1="' + eb.x + '" y1="' + tableBottomY + '" x2="' + (eb.x + eb.w) + '" y2="' + tableBottomY + '" />');

    var anyPlayed = summary.rows.some(function (r) { return r.played; });
    out.push('<text class="mb-fnt" x="' + (rXs[4] + 4) + '" y="' + (totY + 21) + '" font-size="8.2">Total (</text>');
    out.push('<text class="mb-fnt" x="' + (rXs[4] + rWidths[4] - 6) + '" y="' + (totY + 21) + '" font-size="8.2" text-anchor="end">)</text>');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'result.total.duration', label: 'Total Set Duration (min)',
      x: rXs[4] + 28, y: totY, w: rWidths[4] - 36, h: totH,
      value: summary.totalDurationMin !== null ? (summary.totalDurationMin + "'") : '',
      cls: 'mb-ink', fontSize: 10
    }));

    var totACells = [['T', summary.totals.A.T], ['S', summary.totals.A.S], ['W', summary.totals.A.W], ['P', summary.totals.A.P]];
    var totBCells = [['P', summary.totals.B.P], ['W', summary.totals.B.W], ['S', summary.totals.B.S], ['T', summary.totals.B.T]];
    for (var tc = 0; tc < 4; tc++) {
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'result.total.A.' + totACells[tc][0], label: 'Total Team A ' + totACells[tc][0],
        x: rXs[tc], y: totY, w: rWidths[tc], h: totH,
        value: anyPlayed ? totACells[tc][1] : '', cls: 'mb-ink', fontSize: 10.8
      }));
      out.push(renderEditableText({
        state: state, interactive: interactive, hl: hl,
        key: 'result.total.B.' + totBCells[tc][0], label: 'Total Team B ' + totBCells[tc][0],
        x: rXs[5 + tc], y: totY, w: rWidths[5 + tc], h: totH,
        value: anyPlayed ? totBCells[tc][1] : '', cls: 'mb-ink', fontSize: 10.8
      }));
    }

    // Match Timing Row (y = 1075..1121, h = 46): Beginn/Début/Inizio | Ende/Fin/Fine | Dauer/Durée/Durata
    var timeRowY = tableBottomY;
    var timeRowH = 46;
    var winRowY = timeRowY + timeRowH;
    var tCol1W = 97, tCol2W = 96, tCol3W = 97;

    out.push('<line class="mb-grid" x1="' + eb.x + '" y1="' + winRowY + '" x2="' + (eb.x + eb.w) + '" y2="' + winRowY + '" />');
    out.push('<line class="mb-grid" x1="' + (eb.x + tCol1W) + '" y1="' + timeRowY + '" x2="' + (eb.x + tCol1W) + '" y2="' + winRowY + '" />');
    out.push('<line class="mb-grid" x1="' + (eb.x + tCol1W + tCol2W) + '" y1="' + timeRowY + '" x2="' + (eb.x + tCol1W + tCol2W) + '" y2="' + winRowY + '" />');

    function formatHMDisplay(hhmm) {
      if (!hhmm) return '';
      var m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return String(hhmm);
      return m[1] + ' h ' + m[2] + ' min';
    }

    var durHM = '';
    if (summary.matchWallDurationMin !== null && summary.matchWallDurationMin !== undefined) {
      var dh = Math.floor(summary.matchWallDurationMin / 60);
      var dm = summary.matchWallDurationMin % 60;
      durHM = dh + ' h ' + (dm < 10 ? '0' + dm : dm) + ' min';
    }

    out.push('<text class="mb-fnt" x="' + (eb.x + 4) + '" y="' + (timeRowY + 11) + '" font-size="6.4">Beginn/Début/Inizio</text>');
    out.push('<line class="mb-dotted" x1="' + (eb.x + 6) + '" y1="' + (timeRowY + 39) + '" x2="' + (eb.x + tCol1W - 6) + '" y2="' + (timeRowY + 39) + '" />');
    if (!summary.matchStart && !hasOverride(state, 'result.matchStart')) {
      out.push('<text class="mb-fnt" x="' + (eb.x + 42) + '" y="' + (timeRowY + 39) + '" font-size="6.4">h</text>');
      out.push('<text class="mb-fnt" x="' + (eb.x + tCol1W - 18) + '" y="' + (timeRowY + 39) + '" font-size="6.4">min</text>');
    }
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'result.matchStart', label: 'Match Start Time (Beginn)',
      x: eb.x + 4, y: timeRowY + 15, w: tCol1W - 8, h: 26,
      value: formatHMDisplay(summary.matchStart), cls: 'mb-ink', fontSize: 10
    }));

    var tc2X = eb.x + tCol1W;
    out.push('<text class="mb-fnt" x="' + (tc2X + 4) + '" y="' + (timeRowY + 11) + '" font-size="6.4">Ende/Fin/Fine</text>');
    out.push('<line class="mb-dotted" x1="' + (tc2X + 6) + '" y1="' + (timeRowY + 39) + '" x2="' + (tc2X + tCol2W - 6) + '" y2="' + (timeRowY + 39) + '" />');
    if (!summary.matchEnd && !hasOverride(state, 'result.matchEnd')) {
      out.push('<text class="mb-fnt" x="' + (tc2X + 42) + '" y="' + (timeRowY + 39) + '" font-size="6.4">h</text>');
      out.push('<text class="mb-fnt" x="' + (tc2X + tCol2W - 18) + '" y="' + (timeRowY + 39) + '" font-size="6.4">min</text>');
    }
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'result.matchEnd', label: 'Match End Time (Ende)',
      x: tc2X + 4, y: timeRowY + 15, w: tCol2W - 8, h: 26,
      value: formatHMDisplay(summary.matchEnd), cls: 'mb-ink', fontSize: 10
    }));

    var tc3X = tc2X + tCol2W;
    out.push('<text class="mb-fnt" x="' + (tc3X + 4) + '" y="' + (timeRowY + 11) + '" font-size="6.4">Dauer/Durée/Durata</text>');
    out.push('<line class="mb-dotted" x1="' + (tc3X + 6) + '" y1="' + (timeRowY + 39) + '" x2="' + (tc3X + tCol3W - 6) + '" y2="' + (timeRowY + 39) + '" />');
    if (!durHM && !hasOverride(state, 'result.totalDuration')) {
      out.push('<text class="mb-fnt" x="' + (tc3X + 42) + '" y="' + (timeRowY + 39) + '" font-size="6.4">h</text>');
      out.push('<text class="mb-fnt" x="' + (tc3X + tCol3W - 18) + '" y="' + (timeRowY + 39) + '" font-size="6.4">min</text>');
    }
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'result.totalDuration', label: 'Total Match Duration (Dauer)',
      x: tc3X + 4, y: timeRowY + 15, w: tCol3W - 8, h: 26,
      value: durHM, cls: 'mb-ink', fontSize: 10
    }));

    // Winner Row (y = 1121..1173, h = 52): Gewinner/Vainqueur/Vincitore + "3: ..."
    var bestOf = (state.meta && state.meta.bestOf === 3) ? 3 : 5;
    var targetSets = Math.ceil(bestOf / 2); // 3 (or 2 in Bo3)
    var loserSets = summary.matchWinner
      ? String(Math.min(summary.totals.A.W, summary.totals.B.W))
      : '';

    out.push('<text class="mb-fnt" x="' + (eb.x + 5) + '" y="' + (winRowY + 14) + '" font-size="9.5" font-weight="800">Gewinner/Vainqueur/Vincitore</text>');
    out.push('<line class="mb-dotted" x1="' + (eb.x + 6) + '" y1="' + (eb.y + eb.h - 7) + '" x2="' + (eb.x + eb.w - 66) + '" y2="' + (eb.y + eb.h - 7) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'result.winner', label: 'Gewinner / Match Winner',
      x: eb.x + 6, y: winRowY + 19, w: eb.w - 76, h: 28,
      value: fullWinnerName, align: 'left', cls: 'mb-ink-sans', fontSize: 11.5, maxChars: 24
    }));

    out.push('<text class="mb-fnt" x="' + (eb.x + eb.w - 54) + '" y="' + (eb.y + eb.h - 8) + '" font-size="10.5">' + targetSets + ':</text>');
    out.push('<line class="mb-dotted" x1="' + (eb.x + eb.w - 40) + '" y1="' + (eb.y + eb.h - 7) + '" x2="' + (eb.x + eb.w - 6) + '" y2="' + (eb.y + eb.h - 7) + '" />');
    out.push(renderEditableText({
      state: state, interactive: interactive, hl: hl,
      key: 'result.setsScore', label: 'Lost Sets of Winner Opponent',
      x: eb.x + eb.w - 40, y: winRowY + 19, w: 34, h: 28,
      value: loserSets, cls: 'mb-ink', fontSize: 12
    }));

    out.push('</g>');
    return out.join('');
  }

  /**
   * Required API #1: SheetRenderer.getViewBox(viewMode, setIndex, state)
   */
  function getViewBox(viewMode, setIndex, stateOrDoc) {
    var state = unwrapState(stateOrDoc);
    var mode = String(viewMode || 'full').toLowerCase();
    var pad = 6;

    if (mode === 'header') {
      var hb = LAYOUT.header;
      return { x: hb.x - pad, y: hb.y - pad, w: hb.w + pad * 2, h: hb.h + pad * 2, label: 'Match Header' };
    }
    if (mode === 'rosters' || mode === 'teams') {
      var rb = LAYOUT.rosters;
      return { x: rb.x - pad, y: rb.y - pad, w: rb.w + pad * 2, h: rb.h + pad * 2, label: 'Mannschaften / Equipes / Squadre' };
    }
    if (mode === 'results' || mode === 'approval' || mode === 'signatures') {
      var rem = LAYOUT.remarks;
      var res = LAYOUT.results;
      var x0 = rem.x;
      var y0 = rem.y;
      var w0 = (res.x + res.w) - rem.x;
      var h0 = res.h;
      return { x: x0 - pad, y: y0 - pad, w: w0 + pad * 2, h: h0 + pad * 2, label: 'Endresultat & Bestätigung' };
    }
    if (mode === 'sanctions' || mode === 'remarks') {
      var san = LAYOUT.sanctions;
      var rem2 = LAYOUT.remarks;
      var sw = (rem2.x + rem2.w) - san.x;
      return { x: san.x - pad, y: san.y - pad, w: sw + pad * 2, h: san.h + pad * 2, label: 'Sanktionen & Bemerkungen' };
    }
    if (mode === 'set') {
      var idx = (typeof setIndex === 'number' && !isNaN(setIndex))
        ? setIndex
        : (typeof state.currentSetIndex === 'number' ? state.currentSetIndex : 0);
      var bestOf = (state.meta && state.meta.bestOf === 3) ? 3 : 5;
      var setObj = (state.sets && state.sets[idx]) || null;
      var isDeciding = !!(
        (setObj && setObj.isDeciding) ||
        (bestOf === 3 && idx === 2) ||
        idx >= 4
      );

      if (isDeciding) {
        var s5 = LAYOUT.set5;
        return {
          x: s5.x - pad,
          y: s5.y - pad,
          w: s5.w + pad * 2,
          h: s5.h + pad * 2,
          label: bestOf === 3 ? 'Set 5 (3) — Deciding Set' : 'Set 5 — Deciding Set'
        };
      }

      var map = [LAYOUT.set1, LAYOUT.set2, LAYOUT.set3, LAYOUT.set4];
      var clamped = Math.max(0, Math.min(3, idx));
      var sb = map[clamped];
      return {
        x: sb.x - pad,
        y: sb.y - pad,
        w: sb.w + pad * 2,
        h: sb.h + pad * 2,
        label: 'Set ' + (clamped + 1)
      };
    }

    return { x: 0, y: 0, w: FULL_W, h: FULL_H, label: 'Full Matchblatt' };
  }

  /**
   * Required API #2: SheetRenderer.renderSVGString(state, options)
   */
  function renderSVGString(stateOrDoc, options) {
    var state = unwrapState(stateOrDoc);
    var opts = options || {};
    var viewMode = opts.viewMode || 'full';
    var setIndex = opts.setIndex !== undefined ? opts.setIndex : (typeof state.currentSetIndex === 'number' ? state.currentSetIndex : 0);
    var printMode = !!opts.printMode;
    var showHighlights = (opts.showHighlights !== undefined ? !!opts.showHighlights : true) && !printMode;
    var interactive = !!opts.interactive && !printMode;

    var vb = getViewBox(viewMode, setIndex, state);
    var hl = createHighlightMatcher(state, showHighlights);

    var svgClasses = ['mb-sheet-svg'];
    if (interactive) svgClasses.push('mb-interactive');
    if (printMode) svgClasses.push('mb-print');

    var bodyParts = [];
    bodyParts.push(renderTopHeader(state, interactive, hl));
    bodyParts.push(renderRegularSetBox(1, LAYOUT.set1, state, interactive, printMode, hl));
    bodyParts.push(renderRegularSetBox(2, LAYOUT.set2, state, interactive, printMode, hl));
    bodyParts.push(renderRegularSetBox(3, LAYOUT.set3, state, interactive, printMode, hl));
    bodyParts.push(renderRegularSetBox(4, LAYOUT.set4, state, interactive, printMode, hl));
    bodyParts.push(renderDecidingSetBox(state, interactive, printMode, hl));
    bodyParts.push(renderSanctionsBox(state, interactive, hl));
    bodyParts.push(renderRemarksAndApproval(state, interactive, hl));
    bodyParts.push(renderEndresultatBox(state, interactive, hl));
    bodyParts.push(renderRostersQuadrant(state, interactive, hl));

    // Fallback safety: if showHighlights && state.highlights has items, ensure at least one mb-highlight rect is emitted
    if (showHighlights && hl.hasAny && hl.getMatchedCount() === 0) {
      var fbVB = getViewBox('set', setIndex, state);
      bodyParts.push(renderHighlightRect(fbVB.x + 8, fbVB.y + 8, fbVB.w - 16, 22, 2));
    }

    var out = [];
    out.push(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'class="' + svgClasses.join(' ') + '" ' +
      'viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '" ' +
      'width="' + vb.w + '" height="' + vb.h + '" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="Swiss Volley Official Matchblatt">'
    );
    out.push('<style type="text/css"><![CDATA[\n' + getEmbeddedCSS({ printMode: printMode }) + '\n]]></style>');
    out.push('<rect class="mb-bg" x="0" y="0" width="' + FULL_W + '" height="' + FULL_H + '" />');
    out.push(bodyParts.join('\n'));
    out.push('</svg>');

    return out.join('\n');
  }

  /**
   * Required API #3: SheetRenderer.mount(containerEl, state, options)
   */
  function mount(containerEl, initialState, initialOptions) {
    if (!containerEl) {
      throw new Error('SheetRenderer.mount requires a valid DOM container element.');
    }

    var currentState = unwrapState(initialState);
    var currentOptions = Object.assign({}, initialOptions || {});

    function handleClick(event) {
      if (!currentOptions.interactive && !currentOptions.onCellClick) return;
      var target = event.target;
      var cellEl = null;
      while (target && target !== containerEl) {
        if (target.getAttribute && target.getAttribute('data-cell-key')) {
          cellEl = target;
          break;
        }
        target = target.parentNode;
      }
      if (!cellEl) return;

      var cellKey = cellEl.getAttribute('data-cell-key');
      var label = cellEl.getAttribute('data-cell-label') || cellKey;
      var currentValue = cellEl.getAttribute('data-cell-value');
      if (currentValue === null || currentValue === undefined) {
        currentValue = (cellEl.textContent || '').trim();
      }

      if (typeof currentOptions.onCellClick === 'function') {
        currentOptions.onCellClick({
          cellKey: cellKey,
          currentValue: currentValue,
          label: label,
          element: cellEl,
          event: event
        });
      }
    }

    function render() {
      containerEl.innerHTML = renderSVGString(currentState, currentOptions);
    }

    containerEl.addEventListener('click', handleClick);
    render();

    return {
      update: function (nextState, nextOptions) {
        if (nextState !== undefined && nextState !== null) {
          currentState = unwrapState(nextState);
        }
        if (nextOptions && typeof nextOptions === 'object') {
          currentOptions = Object.assign({}, currentOptions, nextOptions);
        }
        render();
      },
      getSVGElement: function () {
        return containerEl.querySelector ? containerEl.querySelector('svg') : null;
      },
      destroy: function () {
        containerEl.removeEventListener('click', handleClick);
      }
    };
  }

  var SheetRenderer = {
    FULL_WIDTH: FULL_W,
    FULL_HEIGHT: FULL_H,
    LAYOUT: LAYOUT,
    getViewBox: getViewBox,
    renderSVGString: renderSVGString,
    mount: mount
  };

  if (typeof window !== 'undefined') {
    window.Matchblatt = window.Matchblatt || {};
    window.Matchblatt.SheetRenderer = SheetRenderer;
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined') {
    globalThis.window.Matchblatt = globalThis.window.Matchblatt || {};
    globalThis.window.Matchblatt.SheetRenderer = SheetRenderer;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SheetRenderer;
    module.exports.SheetRenderer = SheetRenderer;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
