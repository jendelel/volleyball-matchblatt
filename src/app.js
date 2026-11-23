/* ==========================================================================
   Matchblatt — Complete Scorer Application UI (`src/app.js`)
   Consumes `window.Matchblatt.{I18N, Engine, SheetRenderer, Exporter}`
   100% Offline, Zero External CDNs, Responsive Phone / Foldable / Laptop UI
   ========================================================================== */
(function () {
  'use strict';

  const FALLBACK_STRINGS = {
    en: {
      'app.title': 'Matchblatt',
      'app.offlineReady': 'Offline Ready',
      'app.offlineActive': 'Offline Mode',
      'nav.setup': 'Match',
      'nav.rosters': 'Teams',
      'nav.live': 'Live Game',
      'nav.review': 'Review & Export',
      'action.undo': 'Undo',
      'action.redo': 'Redo',
      'action.demo': 'Load Sample Match',
      'action.clearReset': 'Clear & Reset Match',
      'action.previewSheet': 'Sheet Preview',
      'action.hideSheet': 'Hide Sheet',
      'sheet.currentSet': 'Current Set',
      'sheet.fullSheet': 'Full Sheet',
      'sheet.tapEdit': 'Tap-to-Edit',
      'sheet.expand': 'Expand',
      'sheet.closeFullscreen': 'Exit Fullscreen',
      'setup.heroTitle': 'Official Swiss Volley / FIVB Scoresheet',
      'setup.heroSub': 'Works 100% offline. Auto-saves every rally to device storage.',
      'setup.matchInfo': 'Match Details & Officials',
      'setup.competition': 'Competition / League',
      'setup.matchType': 'Competition Type',
      'setup.type.championship': 'Championship',
      'setup.type.cup': 'Cup',
      'setup.type.friendly': 'Friendly',
      'setup.type.tournament': 'Tournament',
      'setup.level': 'Level',
      'setup.level.regional': 'Regional',
      'setup.level.national': 'National',
      'setup.level.international': 'International',
      'setup.gender': 'Gender',
      'setup.gender.women': 'Women',
      'setup.gender.men': 'Men',
      'setup.ageGroup': 'Age Category',
      'setup.age.senior': 'Senior',
      'setup.age.U23': 'U23',
      'setup.age.U19': 'U19',
      'setup.age.U17': 'U17',
      'setup.matchNumber': 'Match No.',
      'setup.category': 'Category',
      'setup.format': 'Match Format',
      'setup.bestOf5': 'Best of 5 (3 Sets to Win)',
      'setup.bestOf3': 'Best of 3 (2 Sets to Win)',
      'setup.city': 'City',
      'setup.hall': 'Sports Hall',
      'setup.date': 'Date',
      'setup.time': 'Time',
      'setup.referee1': '1st Referee',
      'setup.referee2': '2nd Referee',
      'setup.scorer': 'Scorer',
      'setup.assistantScorer': 'Assistant Scorer',
      'setup.tossTitle': 'Teams & Coin Toss (Set 1)',
      'setup.swapAB': 'Swap Team A ↔ B',
      'setup.teamAName': 'Team A Name',
      'setup.teamAShort': 'Short A',
      'setup.teamBName': 'Team B Name',
      'setup.teamBShort': 'Short B',
      'setup.initialSide': 'Starting Left Court Side (Set 1)',
      'setup.firstServe': 'First Serve (Set 1)',
      'setup.nextRosters': 'Next: Team Rosters →',
      'rosters.fastAddHint': 'Rapid-enter jersey numbers separated by spaces or commas (only # required!):',
      'rosters.fastAddBtn': '+ Add Jerseys',
      'rosters.addRow': '+ Add Player Row',
      'rosters.players': 'Players (max 14)',
      'rosters.liberos': 'Liberos "L" (max 2)',
      'rosters.licenseOrBirthdate': 'Birthdate / License No.',
      'rosters.licensePlaceholder': 'Birthdate / License No.',
      'rosters.addLibero': '+ Add Libero',
      'rosters.redesignate': 'Injury Redesignation',
      'rosters.officials': 'Team Officials & Pre-Match Signatures',
      'rosters.coach': 'Coach (C)',
      'rosters.ac1': 'Asst Coach 1 (AC1)',
      'rosters.ac2': 'Asst Coach 2 (AC2)',
      'rosters.therapist': 'Therapist (T)',
      'rosters.doctor': 'Doctor (M)',
      'rosters.nextLive': 'Next: Set Lineup & Live Game →',
      'lineup.title': 'Starting Lineup — Set {set}',
      'lineup.decidingToss': 'Deciding Set Coin Toss (Set {set})',
      'lineup.tapHint': 'Tap a court zone (I–VI), then tap a roster jersey below. Zone I serves first.',
      'lineup.autoFill': 'Auto-Fill First 6',
      'lineup.clear': 'Clear 6',
      'lineup.startSet': 'Confirm Lineups & Start Set {set}',
      'live.serve': 'SERVE',
      'live.sub': 'Sub',
      'live.timeout': 'Timeout',
      'live.cards': 'Cards / IR',
      'live.swapSides': 'Swap Sides',
      'live.libero': 'Libero',
      'live.endSetBtn': 'Confirm End of Set {set} ({score})',
      'live.switched8': '8 Points Reached — Court Sides Swapped Automatically!',
      'live.shortcuts': 'Shortcuts: [A / ←] Score Left • [L / →] Score Right • [Ctrl/Cmd+Z] Undo • [Ctrl/Cmd+Shift+Z] Redo',
      'review.summaryTitle': 'Match Result & Set Totals',
      'review.manualTitle': 'Manual Report Adjustments & Remarks',
      'review.tapEditToggle': 'Tap-to-Edit Matchblatt Cells',
      'review.resetOverrides': 'Reset All Manual Cell Edits',
      'review.remarks': 'Remarks (Bemerkungen)',
      'review.setTimes': 'Set Start / End Times',
      'review.signaturesTitle': 'Official Touch Signatures',
      'review.exportTitle': 'Export, Share & Backup (100% Offline)',
      'export.downloadPDF': 'Download PDF',
      'export.sharePDF': 'Share PDF',
      'export.downloadPNG': 'Download PNG',
      'export.sharePNG': 'Share PNG',
      'export.exportJSON': 'Export JSON',
      'export.importJSON': 'Import JSON',
    },
    de: {
      'app.title': 'Matchblatt',
      'app.offlineReady': 'Offline Bereit',
      'app.offlineActive': 'Offline-Modus',
      'nav.setup': 'Spiel',
      'nav.rosters': 'Teams',
      'nav.live': 'Live-Spiel',
      'nav.review': 'Prüfen & Export',
      'action.undo': 'Rückgängig',
      'action.redo': 'Wiederholen',
      'action.demo': 'Beispielspiel laden',
      'action.clearReset': 'Spiel löschen & zurücksetzen',
      'action.previewSheet': 'Matchblatt zeigen',
      'action.hideSheet': 'Blatt ausblenden',
      'sheet.currentSet': 'Aktueller Satz',
      'sheet.fullSheet': 'Ganzes Blatt',
      'sheet.tapEdit': 'Zellen bearbeiten',
      'sheet.expand': 'Vollbild',
      'sheet.closeFullscreen': 'Vollbild schliessen',
      'setup.heroTitle': 'Offizielles Swiss Volley / FIVB Matchblatt',
      'setup.heroSub': '100% offline nutzbar. Speichert jeden Ballwechsel automatisch lokal.',
      'setup.matchInfo': 'Spieldaten & Schiedsgericht',
      'setup.competition': 'Bezeichnung der Liga',
      'setup.matchType': 'Wettbewerbsart',
      'setup.type.championship': 'Meisterschaft',
      'setup.type.cup': 'Cup',
      'setup.type.friendly': 'Freundschaftsspiel',
      'setup.type.tournament': 'Turnier',
      'setup.level': 'Spielklasse',
      'setup.level.regional': 'Regional',
      'setup.level.national': 'National',
      'setup.level.international': 'International',
      'setup.gender': 'Geschlecht',
      'setup.gender.women': 'Frauen',
      'setup.gender.men': 'Männer',
      'setup.ageGroup': 'Alterskategorie',
      'setup.age.senior': 'Aktive',
      'setup.age.U23': 'U23',
      'setup.age.U19': 'U19',
      'setup.age.U17': 'U17',
      'setup.matchNumber': 'Spiel-Nr.',
      'setup.category': 'Kategorie',
      'setup.format': 'Spielmodus',
      'setup.bestOf5': 'Best-of-5 (3 Gewinnsätze)',
      'setup.bestOf3': 'Best-of-3 (2 Gewinnsätze)',
      'setup.city': 'Ort',
      'setup.hall': 'Halle',
      'setup.date': 'Datum',
      'setup.time': 'Zeit',
      'setup.referee1': '1. Schiedsrichter',
      'setup.referee2': '2. Schiedsrichter',
      'setup.scorer': 'Schreiber/in',
      'setup.assistantScorer': 'Schreiber-Assistent/in',
      'setup.tossTitle': 'Mannschaften & Auslosung (Satz 1)',
      'setup.swapAB': 'Team A ↔ B tauschen',
      'setup.teamAName': 'Name Team A',
      'setup.teamAShort': 'Kürzel A',
      'setup.teamBName': 'Name Team B',
      'setup.teamBShort': 'Kürzel B',
      'setup.initialSide': 'Linke Spielfeldseite (Satz 1)',
      'setup.firstServe': 'Erster Aufschlag (Satz 1)',
      'setup.nextRosters': 'Weiter: Mannschaftslisten →',
      'rosters.fastAddHint': 'Trikotnummern schnell mit Leerzeichen/Komma eingeben (nur Nr. Pflicht!):',
      'rosters.fastAddBtn': '+ Nr. hinzufügen',
      'rosters.addRow': '+ Spielerzeile',
      'rosters.players': 'Spieler/innen (max. 14)',
      'rosters.liberos': 'Liberos «L» (max. 2)',
      'rosters.licenseOrBirthdate': 'Geb.-Dat. / Lizenz-Nr.',
      'rosters.licensePlaceholder': 'Geb.-Dat. / Lizenz-Nr.',
      'rosters.addLibero': '+ Libero hinzufügen',
      'rosters.redesignate': 'Neubestimmung (Verletzung)',
      'rosters.officials': 'Offizielle & Unterschriften vor Spielbeginn',
      'rosters.coach': 'Trainer/in (C)',
      'rosters.ac1': 'Ass.-Trainer 1 (AC1)',
      'rosters.ac2': 'Ass.-Trainer 2 (AC2)',
      'rosters.therapist': 'Therapeut/in (T)',
      'rosters.doctor': 'Arzt/Ärztin (M)',
      'rosters.nextLive': 'Weiter: Aufstellung & Live-Spiel →',
      'lineup.title': 'Startaufstellung — Satz {set}',
      'lineup.decidingToss': 'Auslosung Entscheidungssatz (Satz {set})',
      'lineup.tapHint': 'Position (I–VI) antippen, dann Trikotnummer unten wählen. Pos. I schlägt zuerst auf.',
      'lineup.autoFill': 'Erste 6 füllen',
      'lineup.clear': 'Leeren',
      'lineup.startSet': 'Aufstellung bestätigen & Satz {set} starten',
      'live.serve': 'AUFSCHLAG',
      'live.sub': 'Wechsel',
      'live.timeout': 'Time-out',
      'live.cards': 'Karten / UA',
      'live.swapSides': 'Seitenwechsel',
      'live.libero': 'Libero',
      'live.endSetBtn': 'Satz {set} beenden ({score}) → Weiter',
      'live.switched8': '8 Punkte erreicht — Automatischer Seitenwechsel ausgeführt!',
      'live.shortcuts': 'Tasten: [A / ←] Punkt Links • [L / →] Punkt Rechts • [Cmd/Ctrl+Z] Zurück • [Cmd/Ctrl+Shift+Z] Vor',
      'review.summaryTitle': 'Spielresultat & Satzübersicht',
      'review.manualTitle': 'Manuelle Korrekturen & Bemerkungen',
      'review.tapEditToggle': 'Matchblatt-Zellen direkt antippen & ändern',
      'review.resetOverrides': 'Alle manuellen Zellkorrekturen zurücksetzen',
      'review.remarks': 'Bemerkungen',
      'review.setTimes': 'Satzzeiten (Start / Ende)',
      'review.signaturesTitle': 'Unterschriften (Touch / Maus)',
      'review.exportTitle': 'Export, Teilen & Backup (100% Offline)',
      'export.downloadPDF': 'PDF herunterladen',
      'export.sharePDF': 'PDF teilen',
      'export.downloadPNG': 'PNG herunterladen',
      'export.sharePNG': 'PNG teilen',
      'export.exportJSON': 'JSON Backup',
      'export.importJSON': 'JSON laden',
    },
  };

  const SIGNATURE_ROLES = [
    { role: 'captainA_pre', en: 'Captain A (Pre)', de: 'Captain A (Vor)' },
    { role: 'coachA', en: 'Coach A', de: 'Trainer A' },
    { role: 'captainB_pre', en: 'Captain B (Pre)', de: 'Captain B (Vor)' },
    { role: 'coachB', en: 'Coach B', de: 'Trainer B' },
    { role: 'scorer', en: 'Scorer', de: 'Schreiber/in' },
    { role: 'assistantScorer', en: 'Asst. Scorer', de: 'Schreiber-Ass.' },
    { role: 'referee2', en: '2nd Referee', de: '2. Schiedsrichter' },
    { role: 'referee1', en: '1st Referee', de: '1. Schiedsrichter' },
    { role: 'captainA_post', en: 'Captain A (Post)', de: 'Captain A (Nach)' },
    { role: 'captainB_post', en: 'Captain B (Post)', de: 'Captain B (Nach)' },
  ];

  const ROMAN_ZONES = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  function esc(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function interpolate(str, params) {
    if (!params) return str;
    return String(str).replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  }

  function initApp() {
    const MB = window.Matchblatt || {};
    const { I18N, Engine, SheetRenderer, Exporter } = MB;
    if (!Engine || !SheetRenderer) {
      console.error('Matchblatt modules missing:', Object.keys(MB));
      return;
    }

    // Register offline Service Worker strictly on http: or https: protocols
    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Load saved match or create fresh default match
    let doc = Engine.loadFromStorage();
    if (!doc || !doc.state) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      doc = Engine.createStore({
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
        bestOf: 5,
      });
      Engine.saveToStorage(doc);
    }

    function phaseToTab(phase) {
      if (phase === 'rosters') return 'rosters';
      if (phase === 'lineup' || phase === 'live') return 'live';
      if (phase === 'finished') return 'review';
      return 'setup';
    }

    const ui = {
      activeTab: phaseToTab(doc.state.phase),
      menuOpen: false,
      mobileSheetOpen: false,
      sheetFullscreen: false,
      sheetViewMode: doc.state.phase === 'live' || doc.state.phase === 'lineup' ? 'set' : 'full',
      sheetSetIndex: doc.state.currentSetIndex || 0,
      manualEditMode: false,
      zoom: 1,
      panX: 0,
      panY: 0,
      isOnline: navigator.onLine !== false,
      lineupDrafts: {}, // key `${setIndex}_A` -> [6 strings]
      lineupCursor: { A: 0, B: 0 },
      dismissedSwitch8Set: -1,
      timeoutTimer: null, // { team, remaining, intervalId }
      modal: null, // { type, ...payload }
    };

    function tr(key, params = {}) {
      const lang = (doc.state && doc.state.lang) || 'de';
      const fbDict = FALLBACK_STRINGS[lang] || FALLBACK_STRINGS.en;
      const fallback = interpolate(fbDict[key] || FALLBACK_STRINGS.en[key] || key, params);
      if (I18N && typeof I18N.t === 'function') {
        const res = I18N.t(key, lang, { ...params, fallback });
        if (res && res !== key) return res;
      }
      return fallback;
    }

    function teamDisplayName(teamKey) {
      const tObj = doc.state.teams[teamKey];
      return (tObj && tObj.name && tObj.name.trim()) ? tObj.name.trim() : `Team ${teamKey}`;
    }

    function teamShort(teamKey) {
      const tObj = doc.state.teams[teamKey];
      if (tObj && tObj.shortName && tObj.shortName.trim()) return tObj.shortName.trim().slice(0, 4).toUpperCase();
      const n = teamDisplayName(teamKey);
      return n.slice(0, 3).toUpperCase();
    }

    // Build persistent shell
    const rootEl = document.getElementById('app');
    rootEl.innerHTML = `
      <header class="mb-topbar" id="mb-topbar"></header>
      <main class="mb-workspace" id="mb-workspace">
        <section class="mb-pane-controls" id="mb-controls"></section>
        <aside class="mb-pane-sheet" id="mb-sheet-pane">
          <div class="mb-sheet-toolbar" id="mb-sheet-toolbar"></div>
          <div class="mb-sheet-stage" id="mb-sheet-stage">
            <div class="mb-sheet-transform" id="mb-sheet-transform">
              <div class="mb-sheet-mount" id="mb-sheet-mount"></div>
            </div>
            <div class="mb-sheet-zoom-hud" id="mb-sheet-zoom-hud">
              <button type="button" class="mb-zoom-btn" data-action="sheet-zoom-out" title="Zoom Out" aria-label="Zoom Out">−</button>
              <span class="mb-zoom-pct tabular" data-action="sheet-zoom-reset" id="mb-zoom-pct" title="Reset Zoom">100%</span>
              <button type="button" class="mb-zoom-btn" data-action="sheet-zoom-in" title="Zoom In" aria-label="Zoom In">+</button>
            </div>
          </div>
        </aside>
      </main>
      <div id="mb-modal-root"></div>
      <div id="mb-toast-root" class="mb-toast-stack" aria-live="assertive"></div>
      <input type="file" id="mb-json-file-input" accept=".json,application/json" style="display:none">
    `;

    const topbarEl = document.getElementById('mb-topbar');
    const workspaceEl = document.getElementById('mb-workspace');
    const controlsEl = document.getElementById('mb-controls');
    const sheetPaneEl = document.getElementById('mb-sheet-pane');
    const sheetToolbarEl = document.getElementById('mb-sheet-toolbar');
    const sheetStageEl = document.getElementById('mb-sheet-stage');
    const sheetTransformEl = document.getElementById('mb-sheet-transform');
    const sheetMountEl = document.getElementById('mb-sheet-mount');
    const zoomPctEl = document.getElementById('mb-zoom-pct');
    const modalRootEl = document.getElementById('mb-modal-root');
    const toastRootEl = document.getElementById('mb-toast-root');
    const jsonFileInput = document.getElementById('mb-json-file-input');

    let sheetController = null;

    function showToast(msg, variant = 'default') {
      const el = document.createElement('div');
      el.className = `mb-toast ${variant === 'amber' ? 'amber' : variant === 'danger' ? 'danger' : ''}`;
      el.textContent = msg;
      toastRootEl.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 3200);
    }

    function applyPanZoom() {
      sheetTransformEl.style.transform = `translate(${ui.panX}px, ${ui.panY}px) scale(${ui.zoom})`;
      if (zoomPctEl) {
        zoomPctEl.textContent = `${Math.round(ui.zoom * 100)}%`;
      }
    }

    function resetPanZoom() {
      ui.zoom = 1;
      ui.panX = 0;
      ui.panY = 0;
      applyPanZoom();
    }

    function handleSheetCellClick(cellInfo) {
      if (!ui.manualEditMode || !cellInfo || !cellInfo.cellKey) return;
      const existing = doc.state.manualOverrides && doc.state.manualOverrides[cellInfo.cellKey];
      ui.modal = {
        type: 'cellOverride',
        cellKey: cellInfo.cellKey,
        label: cellInfo.label || cellInfo.cellKey,
        value: existing !== undefined ? existing : (cellInfo.currentValue || ''),
      };
      renderModal();
    }

    function fitSheetSVG() {
      const svgEl = sheetController && typeof sheetController.getSVGElement === 'function'
        ? sheetController.getSVGElement()
        : (sheetMountEl.querySelector ? sheetMountEl.querySelector('svg') : null);
      if (!svgEl) return;

      let vbW = 1684;
      let vbH = 1190;
      const rawVB = svgEl.getAttribute && svgEl.getAttribute('viewBox');
      if (rawVB) {
        const parts = rawVB.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          vbW = parts[2];
          vbH = parts[3];
        }
      } else if (typeof SheetRenderer.getViewBox === 'function') {
        const vb = SheetRenderer.getViewBox(ui.sheetViewMode, ui.sheetSetIndex, doc.state);
        const candW = vb && (vb.w || vb.width);
        const candH = vb && (vb.h || vb.height);
        if (candW > 0 && candH > 0) {
          vbW = candW;
          vbH = candH;
        }
      }

      if (svgEl.setAttribute) {
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }

      // On compact phone portrait (<700px) when viewing a wide landscape Set strip (e.g. Swiss Volley Set 1..5),
      // size the top sheet pane snugly to the strip's natural aspect height so there is zero dead grey space
      // while keeping >=172px total height and freeing room for the Live Rally Cockpit below.
      const isNarrowMobile = typeof window !== 'undefined' && window.innerWidth > 0 && window.innerWidth < 700;
      if (!isNarrowMobile || ui.sheetFullscreen || ui.sheetViewMode === 'full') {
        sheetPaneEl.style.height = '';
        sheetPaneEl.style.minHeight = '';
      } else if (sheetPaneEl.offsetParent !== null) {
        const paneW = sheetPaneEl.clientWidth || window.innerWidth;
        const toolbarH = (sheetToolbarEl && sheetToolbarEl.offsetHeight) || 40;
        const estSvgH = Math.ceil((Math.max(200, paneW - 14) / vbW) * vbH);
        const maxMobilePaneH = Math.round((window.innerHeight || 852) * 0.42);
        const snugPaneH = Math.max(172, Math.min(maxMobilePaneH, toolbarH + estSvgH + 18));
        sheetPaneEl.style.minHeight = '172px';
        sheetPaneEl.style.height = `${snugPaneH}px`;
      }

      // Reset to small box before measuring stage so intrinsic SVG height never inflates flex container
      svgEl.style.width = '10px';
      svgEl.style.height = '10px';
      svgEl.style.aspectRatio = `${vbW} / ${vbH}`;
      svgEl.style.overflow = 'hidden';

      const rect = sheetStageEl.getBoundingClientRect ? sheetStageEl.getBoundingClientRect() : null;
      if (rect && rect.width > 24 && rect.height > 24) {
        const pad = rect.width < 500 ? 14 : 18;
        const availW = Math.max(20, rect.width - pad);
        const availH = Math.max(20, rect.height - pad);
        const scale = Math.min(availW / vbW, availH / vbH);
        svgEl.style.width = `${Math.max(1, Math.floor(vbW * scale))}px`;
        svgEl.style.height = `${Math.max(1, Math.floor(vbH * scale))}px`;
      } else {
        svgEl.style.width = 'auto';
        svgEl.style.height = 'auto';
      }
    }

    function renderSheet() {
      const maxSetIdx = Math.max(0, (doc.state.sets ? doc.state.sets.length : 1) - 1);
      if (ui.sheetSetIndex > maxSetIdx) ui.sheetSetIndex = maxSetIdx;

      const options = {
        viewMode: ui.sheetViewMode,
        setIndex: ui.sheetSetIndex,
        showHighlights: true,
        interactive: ui.manualEditMode,
        printMode: false,
        onCellClick: handleSheetCellClick,
      };

      if (typeof SheetRenderer.mount === 'function') {
        if (!sheetController) {
          sheetController = SheetRenderer.mount(sheetMountEl, doc.state, options);
        } else {
          sheetController.update(doc.state, options);
        }
      } else {
        sheetMountEl.innerHTML = SheetRenderer.renderSVGString(doc.state, options);
      }

      fitSheetSVG();

      // Render sheet toolbar pills
      const setButtons = (doc.state.sets || [])
        .map((s, idx) => {
          const isAct = ui.sheetViewMode === 'set' && ui.sheetSetIndex === idx;
          return `<button type="button" class="mb-pill-btn ${isAct ? 'active' : ''}" data-action="sheet-select-set" data-set-index="${idx}">S${s.number}</button>`;
        })
        .join('');

      sheetToolbarEl.innerHTML = `
        <div class="mb-sheet-pills">
          <button type="button" class="mb-pill-btn ${ui.sheetViewMode === 'set' ? 'active' : ''}" data-action="sheet-mode-set">
            ${esc(tr('sheet.currentSet'))}
          </button>
          <button type="button" class="mb-pill-btn ${ui.sheetViewMode === 'full' ? 'active' : ''}" data-action="sheet-mode-full">
            ${esc(tr('sheet.fullSheet'))}
          </button>
          ${setButtons}
        </div>
        <div class="mb-sheet-pills">
          <button type="button" class="mb-pill-btn ${ui.manualEditMode ? 'edit-active' : ''}" data-action="toggle-manual-edit">
            ✎ ${esc(tr('sheet.tapEdit'))}
          </button>
          <button type="button" class="mb-pill-btn ${ui.sheetFullscreen ? 'active' : ''}" data-action="toggle-sheet-fullscreen">
            ${ui.sheetFullscreen ? '✕ ' + esc(tr('sheet.closeFullscreen')) : '⛶ ' + esc(tr('sheet.expand'))}
          </button>
        </div>
      `;
    }

    function dispatchAction(action, opts = {}) {
      const res = Engine.dispatch(doc, action);
      if (res.error) {
        showToast(res.error, 'danger');
        return res;
      }
      if (res.warnings && res.warnings.length > 0 && !action.force && !opts.ignoreWarnings) {
        return res;
      }
      doc = res.doc;
      Engine.saveToStorage(doc);

      if (doc.state.justSwitchedAt8) {
        showToast(tr('live.switched8'), 'amber');
      }
      if (opts.syncSetView && typeof doc.state.currentSetIndex === 'number') {
        ui.sheetSetIndex = doc.state.currentSetIndex;
      }
      if (opts.sheetOnly) {
        renderTopbar();
        renderSheet();
      } else {
        renderAll();
      }
      return res;
    }

    function startTimeoutTimer(team) {
      if (ui.timeoutTimer && ui.timeoutTimer.intervalId) {
        clearInterval(ui.timeoutTimer.intervalId);
      }
      const timerObj = {
        team,
        remaining: 30,
        intervalId: null,
      };
      timerObj.intervalId = setInterval(() => {
        timerObj.remaining -= 1;
        const badgeEl = document.getElementById('mb-timeout-countdown');
        if (timerObj.remaining <= 0) {
          clearInterval(timerObj.intervalId);
          ui.timeoutTimer = null;
          if (ui.activeTab === 'live') renderControls();
        } else if (badgeEl) {
          badgeEl.textContent = `${timerObj.remaining}s`;
        }
      }, 1000);
      ui.timeoutTimer = timerObj;
    }

    function cleanStepLabelHtml(raw) {
      const cleaned = String(raw || '').replace(/^\d+\.\s*/, '');
      const ampIdx = cleaned.indexOf(' & ');
      if (ampIdx !== -1) {
        return esc(cleaned.slice(0, ampIdx)) + `<span class="mb-tab-extra">${esc(cleaned.slice(ampIdx))}</span>`;
      }
      return esc(cleaned);
    }

    function formatBrandHtml(raw) {
      const s = String(raw || 'Matchblatt');
      if (s.toLowerCase().startsWith('swiss volley ')) {
        return `<span class="mb-brand-prefix">${esc(s.slice(0, 13))}</span>${esc(s.slice(13))}`;
      }
      return esc(s);
    }

    // ========================================================================
    // Render Top Persistent Bar
    // ========================================================================
    function renderTopbar() {
      const lang = doc.state.lang || 'de';
      document.documentElement.lang = lang;
      const canUndo = Engine.canUndo(doc);
      const canRedo = Engine.canRedo(doc);
      const lastLabel = doc.state.lastActionLabel || '';

      topbarEl.innerHTML = `
        <div class="mb-topbar-upper">
          <div class="mb-brand">
            <span class="mb-brand-logo" aria-hidden="true">🏐</span>
            <span class="mb-brand-title">${formatBrandHtml(tr('app.title'))}</span>
            <span class="mb-offline-pill ${ui.isOnline ? '' : 'is-offline'}">
              <span class="mb-offline-dot"></span>
              <span>${esc(ui.isOnline ? tr('app.offlineReady') : tr('app.offlineActive'))}</span>
            </span>
          </div>

          <div class="mb-topbar-actions">
            ${lastLabel ? `<span class="mb-last-action-badge" title="${esc(lastLabel)}">${esc(lastLabel)}</span>` : ''}
            <button type="button" class="mb-icon-btn" data-action="undo" ${canUndo ? '' : 'disabled'} title="${esc(tr('action.undo'))}${lastLabel ? ': ' + esc(lastLabel) : ''}" aria-label="${esc(tr('action.undo'))}">
              ↶ <span class="mb-undo-label">${esc(tr('action.undo'))}</span>
            </button>
            <button type="button" class="mb-icon-btn" data-action="redo" ${canRedo ? '' : 'disabled'} title="${esc(tr('action.redo'))}" aria-label="${esc(tr('action.redo'))}">
              ↷
            </button>

            <div class="mb-lang-switch" role="group" aria-label="Language">
              <button type="button" class="mb-lang-btn ${lang === 'de' ? 'active' : ''}" data-action="set-lang" data-lang="de">DE</button>
              <button type="button" class="mb-lang-btn ${lang === 'en' ? 'active' : ''}" data-action="set-lang" data-lang="en">EN</button>
            </div>

            <div class="mb-menu-wrap">
              <button type="button" class="mb-icon-btn" data-action="toggle-menu" aria-label="Menu" aria-expanded="${ui.menuOpen}">
                ☰
              </button>
              ${ui.menuOpen ? `
                <div class="mb-menu-popover" role="menu">
                  <button type="button" class="mb-menu-item" data-action="load-demo">
                    ⚡ ${esc(tr('action.demo'))}
                  </button>
                  <button type="button" class="mb-menu-item" data-action="toggle-mobile-sheet">
                    📄 ${esc(ui.mobileSheetOpen ? tr('action.hideSheet') : tr('action.previewSheet'))}
                  </button>
                  <button type="button" class="mb-menu-item" data-action="toggle-sheet-fullscreen">
                    ⛶ ${esc(tr('sheet.expand'))}
                  </button>
                  <div class="mb-menu-divider"></div>
                  <button type="button" class="mb-menu-item" data-action="export-json">
                    💾 ${esc(tr('export.exportJSON'))}
                  </button>
                  <button type="button" class="mb-menu-item" data-action="trigger-import-json">
                    📂 ${esc(tr('export.importJSON'))}
                  </button>
                  <div class="mb-menu-divider"></div>
                  <button type="button" class="mb-menu-item danger" data-action="prompt-clear-match">
                    🗑 ${esc(tr('action.clearReset'))}
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <nav class="mb-step-tabs" aria-label="Match Steps">
          <button type="button" class="mb-step-tab ${ui.activeTab === 'setup' ? 'active' : ''}" data-action="switch-tab" data-tab="setup">
            <span class="mb-step-num">1</span>
            <span>${cleanStepLabelHtml(tr('nav.setup'))}</span>
          </button>
          <button type="button" class="mb-step-tab ${ui.activeTab === 'rosters' ? 'active' : ''}" data-action="switch-tab" data-tab="rosters">
            <span class="mb-step-num">2</span>
            <span>${cleanStepLabelHtml(tr('nav.rosters'))}</span>
          </button>
          <button type="button" class="mb-step-tab ${ui.activeTab === 'live' ? 'active' : ''}" data-action="switch-tab" data-tab="live">
            <span class="mb-step-num">3</span>
            <span>${cleanStepLabelHtml(tr('nav.live'))}</span>
          </button>
          <button type="button" class="mb-step-tab ${ui.activeTab === 'review' ? 'active' : ''}" data-action="switch-tab" data-tab="review">
            <span class="mb-step-num">4</span>
            <span>${cleanStepLabelHtml(tr('nav.review'))}</span>
          </button>
        </nav>
      `;
    }

    // ========================================================================
    // Step 1: Match Setup & Coin Toss
    // ========================================================================
    function renderSetupStep() {
      const m = doc.state.meta || {};
      const toss = doc.state.toss || {};
      const tA = doc.state.teams.A || {};
      const tB = doc.state.teams.B || {};

      const curMatchType = m.matchType || 'championship';
      const curLevel = m.level || 'regional';
      const curGender = m.gender || (m.category && /\b(men|männer|herren)\b/i.test(m.category) && !/women/i.test(m.category) ? 'men' : 'women');
      const curAgeGroup = m.ageGroup || '';

      const matchTypes = [
        { val: 'championship', label: tr('setup.type.championship') },
        { val: 'cup', label: tr('setup.type.cup') },
        { val: 'friendly', label: tr('setup.type.friendly') },
        { val: 'tournament', label: tr('setup.type.tournament') },
      ];

      const levels = [
        { val: 'regional', label: tr('setup.level.regional') },
        { val: 'national', label: tr('setup.level.national') },
        { val: 'international', label: tr('setup.level.international') },
      ];

      const genders = [
        { val: 'women', label: tr('setup.gender.women') },
        { val: 'men', label: tr('setup.gender.men') },
      ];

      const ageGroups = [
        { val: '', label: tr('setup.age.senior') },
        { val: 'U23', label: tr('setup.age.U23') },
        { val: 'U19', label: tr('setup.age.U19') },
        { val: 'U17', label: tr('setup.age.U17') },
      ];

      return `
        <div class="mb-card" style="background:linear-gradient(135deg,#0d2240 0%,#18488f 100%);color:#fff;border:none;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div>
              <h2 style="margin:0;font-size:17px;font-weight:800;">🏐 ${esc(tr('setup.heroTitle'))}</h2>
              <p style="margin:4px 0 0;font-size:13px;color:#dbeafe;">${esc(tr('setup.heroSub'))}</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="mb-btn mb-btn-amber" data-action="load-demo">
                ⚡ ${esc(tr('action.demo'))}
              </button>
              <button type="button" class="mb-btn" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.3);" data-action="toggle-mobile-sheet">
                📄 ${esc(ui.mobileSheetOpen ? tr('action.hideSheet') : tr('action.previewSheet'))}
              </button>
            </div>
          </div>
        </div>

        <div class="mb-card">
          <div class="mb-card-header">
            <h3 class="mb-card-title">🪙 ${esc(tr('setup.tossTitle'))}</h3>
            <button type="button" class="mb-btn" data-action="swap-teams-ab" style="min-height:40px;padding:6px 12px;font-size:13px;">
              ⇄ ${esc(tr('setup.swapAB'))}
            </button>
          </div>

          <div class="mb-grid-2" style="margin-bottom:12px;">
            <div style="display:grid;grid-template-columns:1fr 92px;gap:8px;">
              <label class="mb-field">
                <span class="mb-label"><span class="mb-team-badge" style="width:20px;height:20px;font-size:11px;">A</span> ${esc(tr('setup.teamAName'))}</span>
                <input type="text" class="mb-input" data-team-field="A.name" placeholder="e.g. Volley Köniz" value="${esc(tA.name || '')}">
              </label>
              <label class="mb-field">
                <span class="mb-label">${esc(tr('setup.teamAShort'))}</span>
                <input type="text" class="mb-input" maxlength="4" data-team-field="A.shortName" placeholder="VKÖ" value="${esc(tA.shortName || '')}">
              </label>
            </div>
            <div style="display:grid;grid-template-columns:1fr 92px;gap:8px;">
              <label class="mb-field">
                <span class="mb-label"><span class="mb-team-badge team-b" style="width:20px;height:20px;font-size:11px;">B</span> ${esc(tr('setup.teamBName'))}</span>
                <input type="text" class="mb-input" data-team-field="B.name" placeholder="e.g. VBC Zürich" value="${esc(tB.name || '')}">
              </label>
              <label class="mb-field">
                <span class="mb-label">${esc(tr('setup.teamBShort'))}</span>
                <input type="text" class="mb-input" maxlength="4" data-team-field="B.shortName" placeholder="ZÜR" value="${esc(tB.shortName || '')}">
              </label>
            </div>
          </div>

          <div class="mb-grid-2">
            <div class="mb-field">
              <span class="mb-label">${esc(tr('setup.initialSide'))}</span>
              <div class="mb-seg">
                <button type="button" class="mb-seg-btn ${toss.initialLeft !== 'B' ? 'active' : ''}" data-action="set-toss" data-field="initialLeft" data-val="A">
                  ⬅ ${esc(teamDisplayName('A'))} (A)
                </button>
                <button type="button" class="mb-seg-btn ${toss.initialLeft === 'B' ? 'active' : ''}" data-action="set-toss" data-field="initialLeft" data-val="B">
                  ⬅ ${esc(teamDisplayName('B'))} (B)
                </button>
              </div>
            </div>

            <div class="mb-field">
              <span class="mb-label">${esc(tr('setup.firstServe'))}</span>
              <div class="mb-seg">
                <button type="button" class="mb-seg-btn ${toss.firstServeSet1 !== 'B' ? 'active' : ''}" data-action="set-toss" data-field="firstServeSet1" data-val="A">
                  🏐 ${esc(teamDisplayName('A'))} (A)
                </button>
                <button type="button" class="mb-seg-btn ${toss.firstServeSet1 === 'B' ? 'active' : ''}" data-action="set-toss" data-field="firstServeSet1" data-val="B">
                  🏐 ${esc(teamDisplayName('B'))} (B)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-card">
          <div class="mb-card-header">
            <h3 class="mb-card-title">📋 ${esc(tr('setup.matchInfo'))}</h3>
          </div>

          <div class="mb-field" style="margin-bottom:10px;">
            <span class="mb-label">${esc(tr('setup.matchType'))}</span>
            <div class="mb-seg" role="group" aria-label="${esc(tr('setup.matchType'))}" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));">
              ${matchTypes
                .map(
                  (opt) => `
                  <button type="button" class="mb-seg-btn ${curMatchType === opt.val ? 'active' : ''}" style="padding:6px 8px;font-size:12.5px;" aria-pressed="${curMatchType === opt.val}" data-action="set-meta-chip" data-meta-key="matchType" data-meta-val="${esc(opt.val)}">
                    ${esc(opt.label)}
                  </button>
                `
                )
                .join('')}
            </div>
          </div>

          <div class="mb-field" style="margin-bottom:10px;">
            <span class="mb-label">${esc(tr('setup.level'))}</span>
            <div class="mb-seg" role="group" aria-label="${esc(tr('setup.level'))}" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));">
              ${levels
                .map(
                  (opt) => `
                  <button type="button" class="mb-seg-btn ${curLevel === opt.val ? 'active' : ''}" style="padding:6px 6px;font-size:12.5px;" aria-pressed="${curLevel === opt.val}" data-action="set-meta-chip" data-meta-key="level" data-meta-val="${esc(opt.val)}">
                    ${esc(opt.label)}
                  </button>
                `
                )
                .join('')}
            </div>
          </div>

          <div class="mb-grid-2" style="margin-bottom:10px;">
            <div class="mb-field">
              <span class="mb-label">${esc(tr('setup.gender'))}</span>
              <div class="mb-seg" role="group" aria-label="${esc(tr('setup.gender'))}" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));">
                ${genders
                  .map(
                    (opt) => `
                    <button type="button" class="mb-seg-btn ${curGender === opt.val ? 'active' : ''}" style="padding:6px 8px;font-size:12.5px;" aria-pressed="${curGender === opt.val}" data-action="set-meta-chip" data-meta-key="gender" data-meta-val="${esc(opt.val)}">
                      ${esc(opt.label)}
                    </button>
                  `
                  )
                  .join('')}
              </div>
            </div>

            <div class="mb-field">
              <span class="mb-label">${esc(tr('setup.ageGroup'))}</span>
              <div class="mb-seg" role="group" aria-label="${esc(tr('setup.ageGroup'))}" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));">
                ${ageGroups
                  .map(
                    (opt) => `
                    <button type="button" class="mb-seg-btn ${curAgeGroup === opt.val ? 'active' : ''}" style="padding:6px 4px;font-size:12px;" aria-pressed="${curAgeGroup === opt.val}" data-action="set-meta-chip" data-meta-key="ageGroup" data-meta-val="${esc(opt.val)}">
                      ${esc(opt.label)}
                    </button>
                  `
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <div class="mb-field" style="margin-bottom:12px;">
            <span class="mb-label">${esc(tr('setup.format'))}</span>
            <div class="mb-seg">
              <button type="button" class="mb-seg-btn ${Number(m.bestOf) !== 3 ? 'active' : ''}" data-action="set-bestof" data-bestof="5">
                ${esc(tr('setup.bestOf5'))}
              </button>
              <button type="button" class="mb-seg-btn ${Number(m.bestOf) === 3 ? 'active' : ''}" data-action="set-bestof" data-bestof="3">
                ${esc(tr('setup.bestOf3'))}
              </button>
            </div>
          </div>

          <div class="mb-grid-2" style="margin-bottom:10px;">
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.competition'))}</span>
              <input type="text" class="mb-input" data-meta="competition" placeholder="NLA / 1. Liga / 2. Liga" value="${esc(m.competition || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.matchNumber'))}</span>
              <input type="text" class="mb-input" data-meta="matchNumber" placeholder="10428" value="${esc(m.matchNumber || '')}">
            </label>
          </div>

          <div class="mb-grid-2" style="margin-bottom:10px;">
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.city'))}</span>
              <input type="text" class="mb-input" data-meta="city" placeholder="Bern" value="${esc(m.city || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.hall'))}</span>
              <input type="text" class="mb-input" data-meta="hall" placeholder="Sporthalle Weissenstein" value="${esc(m.hall || '')}">
            </label>
          </div>

          <div class="mb-grid-2" style="margin-bottom:10px;">
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.date'))}</span>
              <input type="date" class="mb-input" data-meta="date" value="${esc(m.date || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.time'))}</span>
              <input type="time" class="mb-input" data-meta="time" value="${esc(m.time || '')}">
            </label>
          </div>

          <div class="mb-grid-2">
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.referee1'))}</span>
              <input type="text" class="mb-input" data-meta="referee1" value="${esc(m.referee1 || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.referee2'))}</span>
              <input type="text" class="mb-input" data-meta="referee2" value="${esc(m.referee2 || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.scorer'))}</span>
              <input type="text" class="mb-input" data-meta="scorer" value="${esc(m.scorer || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(tr('setup.assistantScorer'))}</span>
              <input type="text" class="mb-input" data-meta="assistantScorer" value="${esc(m.assistantScorer || '')}">
            </label>
          </div>
        </div>

        <button type="button" class="mb-btn mb-btn-primary mb-btn-block" data-action="go-step" data-tab="rosters">
          ${esc(tr('setup.nextRosters'))}
        </button>
      `;
    }

    // ========================================================================
    // Step 2: Team Details & Rosters (Fast Jersey Entry + Optional Details)
    // ========================================================================
    function renderTeamEditorCard(teamKey) {
      const team = doc.state.teams[teamKey] || { players: [], liberos: [], officials: {} };
      const players = team.players || [];
      const liberos = team.liberos || [];
      const off = team.officials || {};
      const sigs = doc.state.signatures || {};
      const capSigRole = teamKey === 'A' ? 'captainA_pre' : 'captainB_pre';
      const coachSigRole = teamKey === 'A' ? 'coachA' : 'coachB';

      const playerRowsHtml = players
        .map(
          (p, idx) => `
          <div class="mb-player-row">
            <input type="text" inputmode="numeric" class="mb-input mb-input-sm tabular" placeholder="#" aria-label="Jersey #" data-roster-edit="${teamKey}.players.${idx}.number" value="${esc(p.number)}">
            <input type="text" class="mb-input mb-input-sm" placeholder="Name (opt.)" aria-label="Player Name" data-roster-edit="${teamKey}.players.${idx}.name" value="${esc(p.name || '')}">
            <input type="text" class="mb-input mb-input-sm mb-bday-input tabular" placeholder="${esc(tr('rosters.licensePlaceholder'))}" aria-label="${esc(tr('rosters.licenseOrBirthdate'))}" data-roster-edit="${teamKey}.players.${idx}.license" value="${esc(p.license || p.birthdate || '')}">
            <button type="button" class="mb-cap-btn ${p.isCaptain ? 'active' : ''}" data-action="toggle-captain" data-team="${teamKey}" data-index="${idx}" title="Captain (C)">C</button>
            <button type="button" class="mb-del-btn" data-action="remove-player" data-team="${teamKey}" data-index="${idx}" title="Remove" aria-label="Remove player">×</button>
          </div>
        `
        )
        .join('');

      const liberoRowsHtml = liberos
        .map(
          (l, idx) => `
          <div class="mb-player-row" style="background:#fefce8;border-color:#fde047;">
            <input type="text" inputmode="numeric" class="mb-input mb-input-sm tabular" placeholder="L#" aria-label="Libero #" data-roster-edit="${teamKey}.liberos.${idx}.number" value="${esc(l.number)}">
            <input type="text" class="mb-input mb-input-sm" placeholder="Libero Name (opt.)" data-roster-edit="${teamKey}.liberos.${idx}.name" value="${esc(l.name || '')}">
            <input type="text" class="mb-input mb-input-sm mb-bday-input tabular" placeholder="${esc(tr('rosters.licensePlaceholder'))}" aria-label="${esc(tr('rosters.licenseOrBirthdate'))}" data-roster-edit="${teamKey}.liberos.${idx}.license" value="${esc(l.license || l.birthdate || '')}">
            <span style="display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#854d0e;">${l.redesignated ? 'INJ' : 'L'}</span>
            <button type="button" class="mb-del-btn" data-action="remove-libero" data-team="${teamKey}" data-index="${idx}" title="Remove Libero">×</button>
          </div>
        `
        )
        .join('');

      return `
        <div class="mb-card" id="mb-roster-card-${teamKey}">
          <div class="mb-card-header">
            <h3 class="mb-card-title">
              <span class="mb-team-badge ${teamKey === 'B' ? 'team-b' : ''}">${teamKey}</span>
              <span>${esc(teamDisplayName(teamKey))}</span>
              <span class="mb-count-badge tabular">${players.length}/14</span>
            </h3>
          </div>

          <div class="mb-grid-2" style="margin-bottom:10px;">
            <label class="mb-field">
              <span class="mb-label">${esc(teamKey === 'A' ? tr('setup.teamAName') : tr('setup.teamBName'))}</span>
              <input type="text" class="mb-input mb-input-sm" data-team-field="${teamKey}.name" value="${esc(team.name || '')}">
            </label>
            <label class="mb-field">
              <span class="mb-label">${esc(teamKey === 'A' ? tr('setup.teamAShort') : tr('setup.teamBShort'))}</span>
              <input type="text" class="mb-input mb-input-sm" maxlength="4" data-team-field="${teamKey}.shortName" value="${esc(team.shortName || '')}">
            </label>
          </div>

          <div class="mb-label" style="margin-bottom:4px;">⚡ ${esc(tr('rosters.fastAddHint'))}</div>
          <div class="mb-fast-add-bar">
            <input type="text" class="mb-input mb-input-sm tabular" id="mb-fast-jerseys-${teamKey}" data-fast-input="${teamKey}" placeholder="e.g. 2 4 7 9 11 14 18">
            <button type="button" class="mb-btn mb-btn-primary" style="min-height:44px;white-space:nowrap;" data-action="fast-add-players" data-team="${teamKey}">
              ${esc(tr('rosters.fastAddBtn'))}
            </button>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span class="mb-label">${esc(tr('rosters.players'))}</span>
            <button type="button" class="mb-btn" style="min-height:36px;padding:4px 10px;font-size:12px;" data-action="add-player-row" data-team="${teamKey}" ${players.length >= 14 ? 'disabled' : ''}>
              ${esc(tr('rosters.addRow'))}
            </button>
          </div>

          <div class="mb-player-list" style="margin-bottom:12px;">
            ${playerRowsHtml || `<div style="font-size:13px;color:var(--text-muted);padding:8px;">No players added yet — enter jersey numbers above!</div>`}
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
            <span class="mb-label">${esc(tr('rosters.liberos'))}</span>
            <div style="display:flex;gap:6px;">
              ${liberos.length > 0 && players.length > 0 ? `
                <button type="button" class="mb-btn" style="min-height:36px;padding:4px 10px;font-size:12px;" data-action="open-libero-redesignate" data-team="${teamKey}">
                  🩹 ${esc(tr('rosters.redesignate'))}
                </button>
              ` : ''}
              <button type="button" class="mb-btn" style="min-height:36px;padding:4px 10px;font-size:12px;" data-action="add-libero-row" data-team="${teamKey}" ${liberos.length >= 2 ? 'disabled' : ''}>
                ${esc(tr('rosters.addLibero'))}
              </button>
            </div>
          </div>

          <div class="mb-player-list" style="margin-bottom:12px;">
            ${liberoRowsHtml}
          </div>

          <details>
            <summary style="cursor:pointer;font-weight:700;font-size:13px;color:var(--court-navy);padding:6px 0;">
              ${esc(tr('rosters.officials'))}
            </summary>
            <div class="mb-grid-2" style="margin-top:8px;">
              <label class="mb-field">
                <span class="mb-label">${esc(tr('rosters.coach'))}</span>
                <input type="text" class="mb-input mb-input-sm" data-official-edit="${teamKey}.coach" value="${esc(off.coach || '')}">
              </label>
              <label class="mb-field">
                <span class="mb-label">${esc(tr('rosters.ac1'))}</span>
                <input type="text" class="mb-input mb-input-sm" data-official-edit="${teamKey}.assistantCoach1" value="${esc(off.assistantCoach1 || '')}">
              </label>
              <label class="mb-field">
                <span class="mb-label">${esc(tr('rosters.ac2'))}</span>
                <input type="text" class="mb-input mb-input-sm" data-official-edit="${teamKey}.assistantCoach2" value="${esc(off.assistantCoach2 || '')}">
              </label>
              <label class="mb-field">
                <span class="mb-label">${esc(tr('rosters.therapist'))} / ${esc(tr('rosters.doctor'))}</span>
                <input type="text" class="mb-input mb-input-sm" data-official-edit="${teamKey}.therapist" value="${esc(off.therapist || '')}">
              </label>
            </div>
            <div class="mb-grid-2" style="margin-top:10px;">
              <button type="button" class="mb-btn" style="min-height:42px;font-size:12.5px;" data-action="open-signature" data-role="${capSigRole}">
                ✍ Captain ${teamKey} ${sigs[capSigRole] ? '✓' : ''}
              </button>
              <button type="button" class="mb-btn" style="min-height:42px;font-size:12.5px;" data-action="open-signature" data-role="${coachSigRole}">
                ✍ Coach ${teamKey} ${sigs[coachSigRole] ? '✓' : ''}
              </button>
            </div>
          </details>
        </div>
      `;
    }

    function renderRostersStep() {
      return `
        <div class="mb-rosters-dual">
          ${renderTeamEditorCard('A')}
          ${renderTeamEditorCard('B')}
        </div>
        <button type="button" class="mb-btn mb-btn-primary mb-btn-block" data-action="go-step" data-tab="live">
          ${esc(tr('rosters.nextLive'))}
        </button>
      `;
    }

    // ========================================================================
    // Step 3: Live Game (Start-of-Set Lineup 6-Grid + Live Rally Cockpit)
    // ========================================================================
    function getDraftLineup(setIdx, teamKey) {
      const key = `${setIdx}_${teamKey}`;
      if (!ui.lineupDrafts[key]) {
        const existing = doc.state.sets[setIdx]?.lineups?.[teamKey]?.starters;
        ui.lineupDrafts[key] = Array.isArray(existing) && existing.length === 6 ? [...existing] : ['', '', '', '', '', ''];
      }
      return ui.lineupDrafts[key];
    }

    function renderLineupTeamBox(setIdx, teamKey, sideLabel, isServingFirst) {
      const draft = getDraftLineup(setIdx, teamKey);
      const cursor = ui.lineupCursor[teamKey] || 0;
      const team = doc.state.teams[teamKey] || { players: [], liberos: [] };
      const activeLiberos = (team.liberos || []).filter((l) => !l.redesignated);

      // Court visual order: Front row at net [IV (3), III (2), II (1)], Back row [V (4), VI (5), I (0)]
      const courtVisualIndices = [3, 2, 1, 4, 5, 0];

      const slotsHtml = courtVisualIndices
        .map((posIdx) => {
          const val = draft[posIdx] || '';
          const isSel = cursor === posIdx;
          return `
            <button type="button" class="mb-zone-slot ${isSel ? 'selected' : ''} ${val ? 'filled' : ''}" data-action="select-lineup-zone" data-team="${teamKey}" data-zone="${posIdx}">
              <span class="mb-zone-roman">${ROMAN_ZONES[posIdx]}</span>
              ${posIdx === 0 ? `<span class="mb-zone-srv-tag">${isServingFirst ? '🏐 SRV' : 'RCV'}</span>` : ''}
              <span class="mb-zone-num tabular">${val ? esc(val) : '—'}</span>
            </button>
          `;
        })
        .join('');

      const playerChips = (team.players || [])
        .map((p) => {
          const usedIdx = draft.indexOf(String(p.number));
          const isUsed = usedIdx !== -1;
          return `
            <button type="button" class="mb-jersey-chip tabular ${isUsed ? 'used' : ''}" data-action="pick-lineup-jersey" data-team="${teamKey}" data-number="${esc(p.number)}">
              <span>#${esc(p.number)}</span>
              ${isUsed ? `<small>${ROMAN_ZONES[usedIdx]}</small>` : p.name ? `<small>${esc(p.name)}</small>` : ''}
            </button>
          `;
        })
        .join('');

      const liberoChips = activeLiberos
        .map(
          (l) => `
          <button type="button" class="mb-jersey-chip is-libero tabular" data-action="pick-lineup-libero" data-team="${teamKey}" data-number="${esc(l.number)}" title="Libero cannot start without override">
            <span>L#${esc(l.number)}</span>
            <small>Libero</small>
          </button>
        `
        )
        .join('');

      return `
        <div class="mb-card" style="padding:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="mb-team-badge ${teamKey === 'B' ? 'team-b' : ''}">${teamKey}</span>
              <strong>${esc(teamDisplayName(teamKey))}</strong>
              <span class="mb-count-badge">${esc(sideLabel)}</span>
            </div>
            <div style="display:flex;gap:4px;">
              <button type="button" class="mb-btn" style="min-height:36px;padding:4px 8px;font-size:12px;" data-action="autofill-lineup" data-team="${teamKey}">
                ⚡ ${esc(tr('lineup.autoFill'))}
              </button>
              <button type="button" class="mb-btn" style="min-height:36px;padding:4px 8px;font-size:12px;" data-action="clear-lineup" data-team="${teamKey}">
                ${esc(tr('lineup.clear'))}
              </button>
            </div>
          </div>

          <div class="mb-court-entry">
            <div class="mb-net-label">▲ NET / NETZ ▲</div>
            <div class="mb-court-6grid">
              ${slotsHtml}
            </div>
          </div>

          <div class="mb-roster-chips">
            ${playerChips || `<span style="font-size:12.5px;color:var(--text-muted);">Add at least 6 players in Step 2 (Teams), or enter below:</span>`}
            ${liberoChips}
          </div>

          ${(team.players || []).length < 6 ? `
            <div style="margin-top:8px;display:flex;gap:6px;">
              <input type="text" class="mb-input mb-input-sm tabular" id="mb-inline-six-${teamKey}" placeholder="Enter 6 jerseys: e.g. 1 4 7 9 11 14">
              <button type="button" class="mb-btn mb-btn-primary" style="min-height:44px;white-space:nowrap;" data-action="inline-six-apply" data-team="${teamKey}">Set 6</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    function renderLineupView(setIdx, currentSet) {
      const leftTeam = currentSet.leftTeam || 'A';
      const rightTeam = currentSet.rightTeam || (leftTeam === 'A' ? 'B' : 'A');
      const firstServe = currentSet.firstServe || 'A';
      const toss = doc.state.toss || {};

      return `
        ${currentSet.isDeciding ? `
          <div class="mb-card" style="border-color:var(--signal-amber);background:#fffbeb;">
            <h3 class="mb-card-title" style="margin-bottom:8px;">🪙 ${esc(tr('lineup.decidingToss', { set: currentSet.number }))}</h3>
            <div class="mb-grid-2">
              <div class="mb-field">
                <span class="mb-label">Left Court Side</span>
                <div class="mb-seg">
                  <button type="button" class="mb-seg-btn ${(toss.decidingInitialLeft || leftTeam) === 'A' ? 'active' : ''}" data-action="set-deciding-toss" data-field="decidingInitialLeft" data-val="A">${esc(teamDisplayName('A'))}</button>
                  <button type="button" class="mb-seg-btn ${(toss.decidingInitialLeft || leftTeam) === 'B' ? 'active' : ''}" data-action="set-deciding-toss" data-field="decidingInitialLeft" data-val="B">${esc(teamDisplayName('B'))}</button>
                </div>
              </div>
              <div class="mb-field">
                <span class="mb-label">First Serve</span>
                <div class="mb-seg">
                  <button type="button" class="mb-seg-btn ${(toss.decidingFirstServe || firstServe) === 'A' ? 'active' : ''}" data-action="set-deciding-toss" data-field="decidingFirstServe" data-val="A">🏐 ${esc(teamDisplayName('A'))}</button>
                  <button type="button" class="mb-seg-btn ${(toss.decidingFirstServe || firstServe) === 'B' ? 'active' : ''}" data-action="set-deciding-toss" data-field="decidingFirstServe" data-val="B">🏐 ${esc(teamDisplayName('B'))}</button>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="mb-card" style="padding:10px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <div>
              <h3 class="mb-card-title">${esc(tr('lineup.title', { set: currentSet.number }))}</h3>
              <p class="mb-card-subtitle">${esc(tr('lineup.tapHint'))}</p>
            </div>
            <button type="button" class="mb-btn" style="min-height:40px;padding:6px 10px;font-size:12.5px;" data-action="swap-sides">
              ⇄ ${esc(tr('live.swapSides'))}
            </button>
          </div>
        </div>

        <div class="mb-lineup-grid-wrap">
          ${renderLineupTeamBox(setIdx, leftTeam, 'LEFT', firstServe === leftTeam)}
          ${renderLineupTeamBox(setIdx, rightTeam, 'RIGHT', firstServe === rightTeam)}
        </div>

        <button type="button" class="mb-btn mb-btn-success mb-btn-block" style="font-size:16px;min-height:54px;" data-action="confirm-start-set" data-set-index="${setIdx}">
          🏐 ${esc(tr('lineup.startSet', { set: currentSet.number }))}
        </button>
      `;
    }

    function renderMiniHalfCourt(teamKey, side, currentSet) {
      const court = currentSet.lineups?.[teamKey]?.court || ['', '', '', '', '', ''];
      const isServing = currentSet.servingTeam === teamKey;
      // Authentic FIVB scorer perspective across central vertical net (3 cols x 2 rows compact or 2x3):
      // Using 3x2 grid: Left half has Front row [IV, III, II] on top, Back row [V, VI, I] on bottom;
      // Right half mirrors: Front row [II, III, IV] on top, Back row [I, VI, V] on bottom!
      const order = side === 'left' ? [3, 2, 1, 4, 5, 0] : [1, 2, 3, 0, 5, 4];

      return `
        <div class="mb-mini-half" aria-label="${esc(teamDisplayName(teamKey))} court">
          ${order
            .map((zIdx) => {
              const isSrv = isServing && zIdx === 0;
              return `
                <div class="mb-mini-cell ${isSrv ? 'active-server' : ''}">
                  <span class="mb-mini-zone">${ROMAN_ZONES[zIdx]}</span>
                  <span class="mb-mini-num tabular">${esc(court[zIdx] || '—')}${isSrv ? '🏐' : ''}</span>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    function renderLiveRallyCockpit(setIdx, currentSet) {
      const leftTeam = currentSet.leftTeam || 'A';
      const rightTeam = currentSet.rightTeam || (leftTeam === 'A' ? 'B' : 'A');
      const leftScore = currentSet.points[leftTeam] || 0;
      const rightScore = currentSet.points[rightTeam] || 0;

      const setsWonA = (doc.state.sets || []).filter((s) => s.winner === 'A').length;
      const setsWonB = (doc.state.sets || []).filter((s) => s.winner === 'B').length;
      const leftSetsWon = leftTeam === 'A' ? setsWonA : setsWonB;
      const rightSetsWon = rightTeam === 'A' ? setsWonA : setsWonB;

      const leftServerNum = currentSet.lineups?.[leftTeam]?.court?.[0] || '';
      const rightServerNum = currentSet.lineups?.[rightTeam]?.court?.[0] || '';

      const leftSubs = currentSet.subCount?.[leftTeam] || 0;
      const rightSubs = currentSet.subCount?.[rightTeam] || 0;
      const leftTOs = (currentSet.timeouts?.[leftTeam] || []).length;
      const rightTOs = (currentSet.timeouts?.[rightTeam] || []).length;

      // Check win condition
      const target = currentSet.targetPoints || (currentSet.isDeciding ? 15 : 25);
      let winnerCandidate = doc.state.canFinishSet || null;
      if (!winnerCandidate) {
        if (currentSet.points.A >= target && currentSet.points.A - currentSet.points.B >= 2) winnerCandidate = 'A';
        else if (currentSet.points.B >= target && currentSet.points.B - currentSet.points.A >= 2) winnerCandidate = 'B';
      }

      const showSwitch8Banner =
        currentSet.isDeciding && currentSet.switchedAt8 && ui.dismissedSwitch8Set !== setIdx;

      return `
        <div class="mb-live-cockpit">
          ${winnerCandidate ? `
            <div class="mb-banner mb-banner-win">
              <span>🏆 ${esc(teamDisplayName(winnerCandidate))} reached set win (${currentSet.points[leftTeam]}:${currentSet.points[rightTeam]})!</span>
              <button type="button" class="mb-btn mb-btn-success" style="min-height:42px;padding:6px 14px;" data-action="finish-set">
                ${esc(tr('live.endSetBtn', { set: currentSet.number, score: `${currentSet.points[leftTeam]}:${currentSet.points[rightTeam]}` }))}
              </button>
            </div>
          ` : ''}

          ${showSwitch8Banner ? `
            <div class="mb-banner mb-banner-switch8">
              <span>⇄ ${esc(tr('live.switched8'))}</span>
              <button type="button" class="mb-btn" style="min-height:36px;padding:4px 10px;font-size:12px;" data-action="dismiss-switch8" data-set-index="${setIdx}">OK</button>
            </div>
          ` : ''}

          ${ui.timeoutTimer ? `
            <div class="mb-banner mb-banner-timer">
              <span>⏱ Timeout ${esc(teamDisplayName(ui.timeoutTimer.team))} — <strong id="mb-timeout-countdown" class="tabular">${ui.timeoutTimer.remaining}s</strong></span>
              <button type="button" class="mb-icon-btn" style="min-height:32px;" data-action="dismiss-timeout-timer">✕</button>
            </div>
          ` : ''}

          <div class="mb-score-deck">
            <button type="button" class="mb-score-btn" id="btn-score-left" data-action="score-left">
              <div class="mb-score-btn-top">
                <span class="mb-score-team-name">[${leftTeam}] ${esc(teamDisplayName(leftTeam))}</span>
                ${currentSet.servingTeam === leftTeam ? `<span class="mb-serve-pill">🏐 #${esc(leftServerNum)}</span>` : ''}
              </div>
              <div class="mb-score-btn-main">
                <span class="mb-score-big tabular">${leftScore}</span>
                <span class="mb-plus-one-chip">+1</span>
              </div>
            </button>

            <div class="mb-score-center">
              <span class="mb-set-pill">S${currentSet.number}</span>
              <span class="mb-sets-tally tabular">${leftSetsWon}:${rightSetsWon}</span>
              <span class="mb-side-labels">${leftTeam} ◀ | ▶ ${rightTeam}</span>
            </div>

            <button type="button" class="mb-score-btn right-side" id="btn-score-right" data-action="score-right">
              <div class="mb-score-btn-top">
                <span class="mb-score-team-name">[${rightTeam}] ${esc(teamDisplayName(rightTeam))}</span>
                ${currentSet.servingTeam === rightTeam ? `<span class="mb-serve-pill">🏐 #${esc(rightServerNum)}</span>` : ''}
              </div>
              <div class="mb-score-btn-main">
                <span class="mb-score-big tabular">${rightScore}</span>
                <span class="mb-plus-one-chip">+1</span>
              </div>
            </button>
          </div>

          <div class="mb-mini-court-card">
            <div class="mb-mini-courts">
              ${renderMiniHalfCourt(leftTeam, 'left', currentSet)}
              <div class="mb-mini-net" title="Net"></div>
              ${renderMiniHalfCourt(rightTeam, 'right', currentSet)}
            </div>
          </div>

          <div class="mb-live-actions">
            <button type="button" class="mb-action-btn" data-action="open-sub" data-team="${leftTeam}">
              <span>⇄ ${esc(tr('live.sub'))} ${esc(teamShort(leftTeam))}</span>
              <span class="mb-count-badge tabular ${leftSubs >= 6 ? 'warn' : ''}">${leftSubs}/6</span>
            </button>
            <button type="button" class="mb-action-btn" data-action="open-sub" data-team="${rightTeam}">
              <span>⇄ ${esc(tr('live.sub'))} ${esc(teamShort(rightTeam))}</span>
              <span class="mb-count-badge tabular ${rightSubs >= 6 ? 'warn' : ''}">${rightSubs}/6</span>
            </button>
            <button type="button" class="mb-action-btn" data-action="call-timeout" data-team="${leftTeam}">
              <span>⏱ ${esc(tr('live.timeout'))} ${esc(teamShort(leftTeam))}</span>
              <span class="mb-count-badge tabular ${leftTOs >= 2 ? 'warn' : ''}">${leftTOs}/2</span>
            </button>
            <button type="button" class="mb-action-btn" data-action="call-timeout" data-team="${rightTeam}">
              <span>⏱ ${esc(tr('live.timeout'))} ${esc(teamShort(rightTeam))}</span>
              <span class="mb-count-badge tabular ${rightTOs >= 2 ? 'warn' : ''}">${rightTOs}/2</span>
            </button>
          </div>

          <div class="mb-live-utility-row">
            <button type="button" class="mb-btn" style="min-height:46px;padding:6px 8px;font-size:12.5px;" data-action="open-sanctions">
              🟨🟥 ${esc(tr('live.cards'))}
            </button>
            <button type="button" class="mb-btn" style="min-height:46px;padding:6px 8px;font-size:12.5px;" data-action="swap-sides">
              ⇄ ${esc(tr('live.swapSides'))}
            </button>
            <button type="button" class="mb-btn" style="min-height:46px;padding:6px 8px;font-size:12.5px;" data-action="open-libero-redesignate" data-team="${leftTeam}">
              🦺 ${esc(tr('live.libero'))}
            </button>
          </div>

          <div class="mb-kbd-hint">${esc(tr('live.shortcuts'))}</div>
        </div>
      `;
    }

    function renderLiveStep() {
      const sets = doc.state.sets || [];
      const setIdx = Math.min(doc.state.currentSetIndex || 0, Math.max(0, sets.length - 1));
      const currentSet = sets[setIdx];

      if (doc.state.phase === 'finished') {
        return `
          <div class="mb-card" style="text-align:center;padding:22px;">
            <h2 style="margin:0 0 8px;color:var(--court-navy);">🏆 Match Completed!</h2>
            <p style="margin:0 0 16px;color:var(--text-secondary);">All winning sets have been completed. Proceed to Review & Export to sign and download the official Matchblatt.</p>
            <button type="button" class="mb-btn mb-btn-primary" data-action="go-step" data-tab="review">
              Go to Review, Signatures & Export →
            </button>
          </div>
        `;
      }

      if (!currentSet) return '';

      const setChips = sets
        .map((s, i) => {
          const scoreTxt = s.status !== 'pending' ? ` (${s.points.A}:${s.points.B})` : '';
          return `<span class="mb-pill-btn ${i === setIdx ? 'active' : ''}" style="pointer-events:none;">S${s.number}${scoreTxt}${s.winner ? ' ✓' : ''}</span>`;
        })
        .join('');

      const headerStrip = `<div style="display:flex;gap:4px;overflow-x:auto;margin-bottom:8px;">${setChips}</div>`;

      if (currentSet.status === 'live') {
        return headerStrip + renderLiveRallyCockpit(setIdx, currentSet);
      }
      return headerStrip + renderLineupView(setIdx, currentSet);
    }

    // ========================================================================
    // Step 4: Post-Match Summary, Manual Cell Edit, Signatures & Export
    // ========================================================================
    function renderReviewStep() {
      const summary = Engine.computeSummary ? Engine.computeSummary(doc.state) : null;
      const perSet = (summary && (summary.sets || summary.perSet)) || [];
      const totals = (summary && (summary.totals || summary.matchTotals)) || {
        A: { T: 0, S: 0, W: 0, P: 0 },
        B: { T: 0, S: 0, W: 0, P: 0 },
        totalDurationMin: 0,
      };
      const winner = summary && summary.matchWinner;
      const overridesCount = Object.keys(doc.state.manualOverrides || {}).length;
      const sigs = doc.state.signatures || {};

      const summaryRows = perSet
        .map((s) => {
          const played = s.played !== undefined ? s.played : (s.A.P > 0 || s.B.P > 0);
          if (!played) return '';
          return `
            <tr class="tabular">
              <td>${s.A.T}</td>
              <td>${s.A.S}</td>
              <td>${s.A.W}</td>
              <td><strong>${s.A.P}</strong></td>
              <td>S${s.setNumber} ${s.durationMin != null ? `(${s.durationMin}')` : ''}</td>
              <td><strong>${s.B.P}</strong></td>
              <td>${s.B.W}</td>
              <td>${s.B.S}</td>
              <td>${s.B.T}</td>
            </tr>
          `;
        })
        .join('');

      const setTimesRows = (doc.state.sets || [])
        .map((s, idx) => {
          if (s.status === 'pending' && !s.startTime && !s.endTime) return '';
          return `
            <div style="display:grid;grid-template-columns:64px 1fr 1fr;gap:8px;align-items:center;margin-bottom:6px;">
              <strong style="font-size:13px;">Set ${s.number}</strong>
              <input type="text" class="mb-input mb-input-sm tabular" placeholder="Start HH:MM" data-set-time="${idx}.startTime" value="${esc(s.startTime || '')}">
              <input type="text" class="mb-input mb-input-sm tabular" placeholder="End HH:MM" data-set-time="${idx}.endTime" value="${esc(s.endTime || '')}">
            </div>
          `;
        })
        .join('');

      const sigSlotsHtml = SIGNATURE_ROLES.map((item) => {
        const lang = doc.state.lang || 'de';
        const dataUrl = sigs[item.role];
        return `
          <button type="button" class="mb-sig-slot ${dataUrl ? 'signed' : ''}" data-action="open-signature" data-role="${item.role}">
            <span style="font-size:11.5px;font-weight:800;color:var(--court-navy);">${esc(lang === 'de' ? item.de : item.en)}</span>
            ${dataUrl ? `<img src="${esc(dataUrl)}" alt="Signature">` : `<span style="font-size:12px;color:var(--text-muted);">✍ Tap to Sign</span>`}
          </button>
        `;
      }).join('');

      return `
        <div class="mb-card">
          <div class="mb-card-header">
            <h3 class="mb-card-title">📤 ${esc(tr('review.exportTitle'))}</h3>
          </div>
          <div class="mb-export-grid">
            <button type="button" class="mb-btn mb-btn-primary" data-action="download-pdf">
              📄 ${esc(tr('export.downloadPDF'))}
            </button>
            <button type="button" class="mb-btn mb-btn-navy" data-action="share-pdf">
              📲 ${esc(tr('export.sharePDF'))}
            </button>
            <button type="button" class="mb-btn" data-action="download-png">
              🖼 ${esc(tr('export.downloadPNG'))}
            </button>
            <button type="button" class="mb-btn" data-action="share-png">
              📤 ${esc(tr('export.sharePNG'))}
            </button>
            <button type="button" class="mb-btn" data-action="export-json">
              💾 ${esc(tr('export.exportJSON'))}
            </button>
            <button type="button" class="mb-btn" data-action="trigger-import-json">
              📂 ${esc(tr('export.importJSON'))}
            </button>
          </div>
        </div>

        <div class="mb-card">
          <div class="mb-card-header">
            <h3 class="mb-card-title">🏆 ${esc(tr('review.summaryTitle'))}</h3>
            ${winner ? `<span class="mb-serve-pill" style="font-size:12.5px;padding:4px 10px;">Winner: ${esc(teamDisplayName(winner))}</span>` : ''}
          </div>
          <div style="overflow-x:auto;">
            <table class="mb-summary-table">
              <thead>
                <tr>
                  <th colspan="4">[A] ${esc(teamDisplayName('A'))}</th>
                  <th>Set</th>
                  <th colspan="4">[B] ${esc(teamDisplayName('B'))}</th>
                </tr>
                <tr>
                  <th>T</th><th>S</th><th>W</th><th>P</th>
                  <th>(min)</th>
                  <th>P</th><th>W</th><th>S</th><th>T</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows || `<tr><td colspan="9" style="color:var(--text-muted);padding:12px;">No points recorded yet.</td></tr>`}
                <tr class="total-row tabular">
                  <td>${totals.A?.T ?? 0}</td>
                  <td>${totals.A?.S ?? 0}</td>
                  <td>${totals.A?.W ?? 0}</td>
                  <td>${totals.A?.P ?? 0}</td>
                  <td>Total ${totals.totalDurationMin ? `(${totals.totalDurationMin}')` : ''}</td>
                  <td>${totals.B?.P ?? 0}</td>
                  <td>${totals.B?.W ?? 0}</td>
                  <td>${totals.B?.S ?? 0}</td>
                  <td>${totals.B?.T ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mb-card">
          <div class="mb-card-header">
            <h3 class="mb-card-title">✍ ${esc(tr('review.signaturesTitle'))}</h3>
          </div>
          <div class="mb-sig-grid">
            ${sigSlotsHtml}
          </div>
        </div>

        <div class="mb-card">
          <div class="mb-card-header">
            <h3 class="mb-card-title">✎ ${esc(tr('review.manualTitle'))}</h3>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            <button type="button" class="mb-btn ${ui.manualEditMode ? 'mb-btn-amber' : ''}" data-action="toggle-manual-edit">
              ✎ ${esc(tr('review.tapEditToggle'))}: <strong>${ui.manualEditMode ? 'ON' : 'OFF'}</strong>
            </button>
            ${overridesCount > 0 ? `
              <button type="button" class="mb-btn" data-action="clear-all-overrides">
                ↺ ${esc(tr('review.resetOverrides'))} (${overridesCount})
              </button>
            ` : ''}
          </div>

          <label class="mb-field" style="margin-bottom:12px;">
            <span class="mb-label">${esc(tr('review.remarks'))}</span>
            <textarea class="mb-textarea" id="mb-remarks-textarea" data-remarks="true" placeholder="Official match remarks, exceptional substitutions, protests...">${esc(doc.state.remarks || '')}</textarea>
          </label>

          ${setTimesRows ? `
            <div class="mb-field">
              <span class="mb-label">${esc(tr('review.setTimes'))}</span>
              ${setTimesRows}
            </div>
          ` : ''}
        </div>
      `;
    }

    // ========================================================================
    // Modals (Sub, Timeout Warn, Sanctions, Libero, Cell Edit, Signature, Reset)
    // ========================================================================
    function renderModal() {
      if (!ui.modal) {
        modalRootEl.innerHTML = '';
        return;
      }

      const m = ui.modal;
      let bodyHtml = '';

      if (m.type === 'sub') {
        const setIdx = doc.state.currentSetIndex || 0;
        const currentSet = doc.state.sets[setIdx];
        const court = currentSet?.lineups?.[m.team]?.court || [];
        const roster = doc.state.teams[m.team]?.players || [];
        const bench = roster.filter((p) => !court.includes(String(p.number)));

        let warnings = [];
        if (m.outNumber && m.inNumber && Engine.validateSubstitution) {
          const v = Engine.validateSubstitution(doc.state, m.team, m.outNumber, m.inNumber);
          if (Array.isArray(v)) warnings = v;
          else if (v && Array.isArray(v.warnings)) warnings = v.warnings;
          else if (v && v.error) warnings = [v.error];
        }

        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">⇄ Substitution — ${esc(teamDisplayName(m.team))}</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>

          <div class="mb-label" style="margin-bottom:6px;">1. Select Player Going OUT (On Court):</div>
          <div class="mb-roster-chips" style="margin-top:0;margin-bottom:12px;">
            ${court
              .map(
                (num, zIdx) => `
                <button type="button" class="mb-jersey-chip tabular ${m.outNumber === String(num) ? 'used' : ''}" data-action="sub-pick-out" data-number="${esc(num)}">
                  <span>#${esc(num)}</span>
                  <small>${ROMAN_ZONES[zIdx]}</small>
                </button>
              `
              )
              .join('')}
          </div>

          <div class="mb-label" style="margin-bottom:6px;">2. Select Bench Player Coming IN:</div>
          <div class="mb-roster-chips" style="margin-top:0;margin-bottom:12px;">
            ${bench.length > 0
              ? bench
                  .map(
                    (p) => `
                    <button type="button" class="mb-jersey-chip tabular ${m.inNumber === String(p.number) ? 'used' : ''}" data-action="sub-pick-in" data-number="${esc(p.number)}">
                      <span>#${esc(p.number)}</span>
                      ${p.name ? `<small>${esc(p.name)}</small>` : ''}
                    </button>
                  `
                  )
                  .join('')
              : `<span style="font-size:13px;color:var(--text-muted);">No bench players on roster — or enter jersey # below:</span>`}
          </div>

          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <input type="text" inputmode="numeric" class="mb-input mb-input-sm tabular" id="mb-sub-manual-in" placeholder="Or type IN jersey #" value="${esc(m.inNumber || '')}">
          </div>

          ${warnings.length > 0 ? `
            <div class="mb-alert-warn">
              ⚠️ Rule Warning: ${esc(warnings.join(' • '))}
            </div>
          ` : ''}

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <button type="button" class="mb-btn" style="flex:1;" data-action="close-modal">Cancel</button>
            ${warnings.length > 0 ? `
              <button type="button" class="mb-btn mb-btn-amber" style="flex:2;" data-action="confirm-sub" data-force="true">
                ⚠️ Override / Exceptional Sub
              </button>
            ` : `
              <button type="button" class="mb-btn mb-btn-primary" style="flex:2;" data-action="confirm-sub" ${!m.outNumber ? 'disabled' : ''}>
                Confirm Sub ${m.outNumber ? `#${esc(m.outNumber)} → #${esc(m.inNumber || '?')}` : ''}
              </button>
            `}
          </div>
        `;
      } else if (m.type === 'timeoutWarn') {
        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">⏱ Timeout Limit Reached</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>
          <div class="mb-alert-warn">
            ⚠️ ${esc((m.warnings || ['Maximum of 2 timeouts per set already used.']).join(' '))}
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <button type="button" class="mb-btn" style="flex:1;" data-action="close-modal">Cancel</button>
            <button type="button" class="mb-btn mb-btn-amber" style="flex:1;" data-action="force-timeout" data-team="${m.team}">
              Override & Record Timeout
            </button>
          </div>
        `;
      } else if (m.type === 'lineupWarn') {
        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">⚠️ Lineup Rule Warning</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>
          <div class="mb-alert-warn">
            ${esc((m.warnings || []).join(' • '))}
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <button type="button" class="mb-btn" style="flex:1;" data-action="close-modal">Go Back</button>
            <button type="button" class="mb-btn mb-btn-amber" style="flex:1;" data-action="force-start-set" data-set-index="${m.setIndex}">
              Override & Start Set
            </button>
          </div>
        `;
      } else if (m.type === 'sanctions') {
        const sType = m.sanctionType || 'warning';
        const isPenalty = sType === 'penalty' || sType === 'delayPenalty';
        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">🟨🟥 Sanctions, Cards & Improper Request</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>

          <div class="mb-field" style="margin-bottom:10px;">
            <span class="mb-label">Team</span>
            <div class="mb-seg">
              <button type="button" class="mb-seg-btn ${m.team !== 'B' ? 'active' : ''}" data-action="sanction-set-team" data-team="A">[A] ${esc(teamDisplayName('A'))}</button>
              <button type="button" class="mb-seg-btn ${m.team === 'B' ? 'active' : ''}" data-action="sanction-set-team" data-team="B">[B] ${esc(teamDisplayName('B'))}</button>
            </div>
          </div>

          <div class="mb-field" style="margin-bottom:10px;">
            <span class="mb-label">Type</span>
            <select class="mb-select" id="mb-sanction-type-select" data-action-change="sanction-type">
              <option value="warning" ${sType === 'warning' ? 'selected' : ''}>🟨 Yellow Card — Warning (W)</option>
              <option value="penalty" ${sType === 'penalty' ? 'selected' : ''}>🟥 Red Card — Penalty (P, opponent point)</option>
              <option value="expulsion" ${sType === 'expulsion' ? 'selected' : ''}>🟨+🟥 Expulsion (E)</option>
              <option value="disqualification" ${sType === 'disqualification' ? 'selected' : ''}>🟨/🟥 Disqualification (D)</option>
              <option value="delayWarning" ${sType === 'delayWarning' ? 'selected' : ''}>⏱🟨 Delay Warning (DW)</option>
              <option value="delayPenalty" ${sType === 'delayPenalty' ? 'selected' : ''}>⏱🟥 Delay Penalty (DP, opponent point)</option>
              <option value="improperRequest" ${sType === 'improperRequest' ? 'selected' : ''}>⊘ Improper Request (Unberechtigter Antrag)</option>
            </select>
          </div>

          ${sType !== 'improperRequest' && sType !== 'delayWarning' && sType !== 'delayPenalty' ? `
            <label class="mb-field" style="margin-bottom:10px;">
              <span class="mb-label">Jersey # or Official (C / AC / T / M)</span>
              <input type="text" class="mb-input mb-input-sm" id="mb-sanction-person" placeholder="e.g. 7 or C" value="${esc(m.playerOrOfficial || '')}">
            </label>
          ` : ''}

          ${isPenalty ? `
            <label style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13.5px;margin-bottom:12px;">
              <input type="checkbox" id="mb-sanction-award-pt" ${m.awardPoint !== false ? 'checked' : ''} style="width:20px;height:20px;">
              <span>Automatically award penalty point & rotation to opponent</span>
            </label>
          ` : ''}

          <div style="display:flex;gap:8px;">
            <button type="button" class="mb-btn" style="flex:1;" data-action="close-modal">Cancel</button>
            <button type="button" class="mb-btn mb-btn-danger" style="flex:2;" data-action="submit-sanction">Record Sanction</button>
          </div>
        `;
      } else if (m.type === 'liberoRedesignate') {
        const teamObj = doc.state.teams[m.team] || { players: [], liberos: [] };
        const setIdx = doc.state.currentSetIndex || 0;
        const court = doc.state.sets[setIdx]?.lineups?.[m.team]?.court || [];
        const eligiblePlayers = (teamObj.players || []).filter((p) => !court.includes(String(p.number)));

        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">🦺 Libero Injury Redesignation</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>

          <div class="mb-seg" style="margin-bottom:12px;">
            <button type="button" class="mb-seg-btn ${m.team !== 'B' ? 'active' : ''}" data-action="libero-modal-team" data-team="A">[A] ${esc(teamDisplayName('A'))}</button>
            <button type="button" class="mb-seg-btn ${m.team === 'B' ? 'active' : ''}" data-action="libero-modal-team" data-team="B">[B] ${esc(teamDisplayName('B'))}</button>
          </div>

          <label class="mb-field" style="margin-bottom:10px;">
            <span class="mb-label">Injured / Unable Libero (OUT)</span>
            <select class="mb-select" id="mb-libero-out">
              ${(teamObj.liberos || []).map((l) => `<option value="${esc(l.number)}">L #${esc(l.number)} ${esc(l.name || '')}</option>`).join('')}
            </select>
          </label>

          <label class="mb-field" style="margin-bottom:12px;">
            <span class="mb-label">New Redesignated Libero (Bench Player IN)</span>
            <select class="mb-select" id="mb-libero-in">
              ${eligiblePlayers.map((p) => `<option value="${esc(p.number)}">#${esc(p.number)} ${esc(p.name || '')}</option>`).join('')}
            </select>
          </label>

          <div style="display:flex;gap:8px;">
            <button type="button" class="mb-btn" style="flex:1;" data-action="close-modal">Cancel</button>
            <button type="button" class="mb-btn mb-btn-primary" style="flex:2;" data-action="submit-libero-redesignate" ${(teamObj.liberos || []).length === 0 || eligiblePlayers.length === 0 ? 'disabled' : ''}>
              Confirm Redesignation
            </button>
          </div>
        `;
      } else if (m.type === 'cellOverride') {
        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">✎ Edit Matchblatt Cell</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>
          <p style="margin:0 0 8px;font-size:12.5px;color:var(--text-muted);">Cell: <code>${esc(m.label)}</code></p>
          <label class="mb-field" style="margin-bottom:12px;">
            <span class="mb-label">Manual Value</span>
            <input type="text" class="mb-input" id="mb-cell-override-input" value="${esc(m.value)}">
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="mb-btn" data-action="clear-single-override" data-cell-key="${esc(m.cellKey)}">Reset Cell</button>
            <button type="button" class="mb-btn mb-btn-primary" style="flex:1;" data-action="save-cell-override" data-cell-key="${esc(m.cellKey)}">Save Override</button>
          </div>
        `;
      } else if (m.type === 'signature') {
        const roleObj = SIGNATURE_ROLES.find((r) => r.role === m.role) || { en: m.role, de: m.role };
        const lang = doc.state.lang || 'de';
        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">✍ ${esc(lang === 'de' ? roleObj.de : roleObj.en)}</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>
          <p style="margin:0 0 8px;font-size:12.5px;color:var(--text-muted);">Sign inside the box below using finger, stylus, or mouse:</p>
          <div class="mb-sig-canvas-wrap">
            <canvas id="mb-sig-canvas" class="mb-sig-canvas"></canvas>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
            <button type="button" class="mb-btn" data-action="sig-clear-pad">Clear Pad</button>
            ${doc.state.signatures?.[m.role] ? `<button type="button" class="mb-btn mb-btn-danger" data-action="sig-delete-saved" data-role="${esc(m.role)}">Remove</button>` : ''}
            <button type="button" class="mb-btn mb-btn-primary" style="flex:1;" data-action="sig-save" data-role="${esc(m.role)}">Save Signature</button>
          </div>
        `;
      } else if (m.type === 'confirmClear') {
        bodyHtml = `
          <div class="mb-modal-header">
            <h3 class="mb-modal-title">🗑 ${esc(tr('action.clearReset'))}</h3>
            <button type="button" class="mb-del-btn" data-action="close-modal">✕</button>
          </div>
          <p style="margin:0 0 14px;font-size:14px;color:var(--text-secondary);">
            Are you sure you want to permanently clear the current match and reset all scores, rosters, and signatures?
          </p>
          <div style="display:flex;gap:8px;">
            <button type="button" class="mb-btn" style="flex:1;" data-action="close-modal">Cancel</button>
            <button type="button" class="mb-btn mb-btn-danger" style="flex:1;" data-action="confirm-clear-match">Yes, Clear Match</button>
          </div>
        `;
      }

      modalRootEl.innerHTML = `
        <div class="mb-modal-backdrop" data-action="backdrop-close">
          <div class="mb-modal" role="dialog" aria-modal="true">
            ${bodyHtml}
          </div>
        </div>
      `;

      if (m.type === 'signature') {
        initSignatureCanvas(m.role);
      }
      if (m.type === 'cellOverride') {
        const inp = document.getElementById('mb-cell-override-input');
        if (inp) inp.focus();
      }
    }

    // ========================================================================
    // High-DPI Touch Signature Pad Controller
    // ========================================================================
    let sigCanvasCtx = null;
    let sigHasInk = false;

    function initSignatureCanvas(role) {
      const canvas = document.getElementById('mb-sig-canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round((rect.width || 440) * dpr);
      canvas.height = Math.round((rect.height || 190) * dpr);

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0d2240';
      ctx.lineWidth = 2.6;
      sigCanvasCtx = ctx;
      sigHasInk = false;

      // Draw existing signature if present
      const existing = doc.state.signatures?.[role];
      if (existing) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width || 440, rect.height || 190);
          sigHasInk = true;
        };
        img.src = existing;
      }

      let drawing = false;
      let lastX = 0;
      let lastY = 0;

      function getPos(e) {
        const r = canvas.getBoundingClientRect();
        return {
          x: e.clientX - r.left,
          y: e.clientY - r.top,
        };
      }

      canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (canvas.setPointerCapture) {
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (_) {}
        }
        drawing = true;
        sigHasInk = true;
        const p = getPos(e);
        lastX = p.x;
        lastY = p.y;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#0d2240';
        ctx.fill();
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        e.preventDefault();
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
      });

      const endStroke = () => {
        drawing = false;
      };
      canvas.addEventListener('pointerup', endStroke);
      canvas.addEventListener('pointercancel', endStroke);
    }

    // ========================================================================
    // Workspace Layout & Master Render
    // ========================================================================
    function updateWorkspaceClasses() {
      const sets = doc.state.sets || [];
      const curSet = sets[doc.state.currentSetIndex || 0];
      const isLiveRally = ui.activeTab === 'live' && doc.state.phase !== 'finished' && curSet && curSet.status === 'live';

      workspaceEl.classList.toggle('is-live-step', ui.activeTab === 'live');
      workspaceEl.classList.toggle('is-live-rally', !!isLiveRally);
      workspaceEl.classList.toggle('is-review', ui.activeTab === 'review');
      workspaceEl.classList.toggle('mobile-sheet-open', !!ui.mobileSheetOpen);
      sheetPaneEl.classList.toggle('is-fullscreen', !!ui.sheetFullscreen);
    }

    function renderControls() {
      if (ui.activeTab === 'setup') {
        controlsEl.innerHTML = renderSetupStep();
      } else if (ui.activeTab === 'rosters') {
        controlsEl.innerHTML = renderRostersStep();
      } else if (ui.activeTab === 'live') {
        controlsEl.innerHTML = renderLiveStep();
      } else {
        controlsEl.innerHTML = renderReviewStep();
      }
    }

    function renderAll() {
      updateWorkspaceClasses();
      renderTopbar();
      renderControls();
      renderSheet();
      renderModal();
    }

    // ========================================================================
    // Interactive Pan & Pinch/Wheel Zoom on Matchblatt Stage
    // ========================================================================
    (function setupSheetPanZoom() {
      const pointers = new Map();
      let startPanX = 0;
      let startPanY = 0;
      let startClientX = 0;
      let startClientY = 0;
      let initialPinchDist = 0;
      let initialZoom = 1;
      let movedSignificantly = false;

      sheetStageEl.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.mb-sheet-zoom-hud')) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        movedSignificantly = false;

        if (pointers.size === 1) {
          startClientX = e.clientX;
          startClientY = e.clientY;
          startPanX = ui.panX;
          startPanY = ui.panY;
          sheetStageEl.classList.add('is-panning');
        } else if (pointers.size === 2) {
          const pts = Array.from(pointers.values());
          initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          initialZoom = ui.zoom;
        }
      });

      window.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 1) {
          const dx = e.clientX - startClientX;
          const dy = e.clientY - startClientY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedSignificantly = true;
          if (movedSignificantly) {
            ui.panX = startPanX + dx;
            ui.panY = startPanY + dy;
            applyPanZoom();
          }
        } else if (pointers.size === 2 && initialPinchDist > 10) {
          movedSignificantly = true;
          const pts = Array.from(pointers.values());
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          ui.zoom = Math.min(4, Math.max(0.6, initialZoom * (dist / initialPinchDist)));
          applyPanZoom();
        }
      });

      const clearPointer = (e) => {
        pointers.delete(e.pointerId);
        if (pointers.size === 0) {
          sheetStageEl.classList.remove('is-panning');
        }
      };
      window.addEventListener('pointerup', clearPointer);
      window.addEventListener('pointercancel', clearPointer);

      sheetStageEl.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 1.12 : 0.89;
          ui.zoom = Math.min(4, Math.max(0.6, ui.zoom * delta));
          applyPanZoom();
        },
        { passive: false }
      );
    })();

    // ========================================================================
    // Event Delegation (Clicks, Form Edits, Keyboard Shortcuts)
    // ========================================================================
    function parseFastJerseys(raw) {
      return String(raw || '')
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && /^\d{1,3}$/.test(s));
    }

    function applyFastAddPlayers(teamKey) {
      const inp = document.getElementById(`mb-fast-jerseys-${teamKey}`);
      if (!inp) return;
      const nums = parseFastJerseys(inp.value);
      if (nums.length === 0) return;

      const curPlayers = [...(doc.state.teams[teamKey]?.players || [])];
      const existingNums = new Set(curPlayers.map((p) => String(p.number)));
      let hasCap = curPlayers.some((p) => p.isCaptain);

      for (const n of nums) {
        if (curPlayers.length >= 14) break;
        if (!existingNums.has(n)) {
          curPlayers.push({
            number: n,
            name: '',
            birthdate: '',
            license: '',
            isCaptain: !hasCap,
          });
          hasCap = true;
          existingNums.add(n);
        }
      }
      inp.value = '';
      dispatchAction({ type: 'UPDATE_TEAM', team: teamKey, data: { players: curPlayers } });
    }

    function attemptStartSet(setIdx, force) {
      const draftA = getDraftLineup(setIdx, 'A');
      const draftB = getDraftLineup(setIdx, 'B');
      if (draftA.some((n) => !n) || draftB.some((n) => !n)) {
        showToast('Please assign all 6 court positions (I–VI) for both Team A and Team B!', 'danger');
        return;
      }

      const resA = Engine.dispatch(doc, { type: 'SET_LINEUP', setIndex: setIdx, team: 'A', starters: [...draftA], force });
      if (resA.error) {
        if (!force) {
          ui.modal = { type: 'lineupWarn', setIndex: setIdx, warnings: [resA.error] };
          renderModal();
        } else {
          showToast(resA.error, 'danger');
        }
        return;
      }
      if (resA.warnings && resA.warnings.length > 0 && !force) {
        ui.modal = { type: 'lineupWarn', setIndex: setIdx, warnings: resA.warnings };
        renderModal();
        return;
      }

      const resB = Engine.dispatch(resA.doc, { type: 'SET_LINEUP', setIndex: setIdx, team: 'B', starters: [...draftB], force });
      if (resB.error) {
        if (!force) {
          ui.modal = { type: 'lineupWarn', setIndex: setIdx, warnings: [resB.error] };
          renderModal();
        } else {
          showToast(resB.error, 'danger');
        }
        return;
      }
      if (resB.warnings && resB.warnings.length > 0 && !force) {
        ui.modal = { type: 'lineupWarn', setIndex: setIdx, warnings: resB.warnings };
        renderModal();
        return;
      }

      const resStart = Engine.dispatch(resB.doc, { type: 'CONFIRM_SET_START', setIndex: setIdx, force: Boolean(force) });
      if (resStart.error) {
        showToast(resStart.error, 'danger');
        return;
      }
      if (resStart.warnings && resStart.warnings.length > 0 && !force) {
        ui.modal = { type: 'lineupWarn', setIndex: setIdx, warnings: resStart.warnings };
        renderModal();
        return;
      }

      doc = resStart.doc;
      Engine.saveToStorage(doc);
      ui.modal = null;
      ui.sheetViewMode = 'set';
      ui.sheetSetIndex = setIdx;
      resetPanZoom();
      renderAll();
    }

    rootEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        if (ui.menuOpen && !e.target.closest('.mb-menu-wrap')) {
          ui.menuOpen = false;
          renderTopbar();
        }
        return;
      }

      const action = btn.getAttribute('data-action');
      if (action === 'backdrop-close' && e.target !== btn) return;

      switch (action) {
        case 'toggle-menu':
          ui.menuOpen = !ui.menuOpen;
          renderTopbar();
          break;

        case 'switch-tab':
        case 'go-step': {
          const tab = btn.getAttribute('data-tab');
          ui.activeTab = tab;
          ui.menuOpen = false;
          if (tab === 'live') {
            ui.sheetViewMode = 'set';
            ui.sheetSetIndex = doc.state.currentSetIndex || 0;
            resetPanZoom();
          } else if (tab === 'review') {
            ui.sheetViewMode = 'full';
            resetPanZoom();
          }
          renderAll();
          break;
        }

        case 'set-lang': {
          const lang = btn.getAttribute('data-lang');
          const r = Engine.dispatch(doc, { type: 'SET_LANGUAGE', lang, skipHistory: true });
          if (!r.error && r.doc && r.doc.state.lang === lang) {
            doc = r.doc;
          } else {
            doc = { ...doc, state: { ...doc.state, lang } };
          }
          Engine.saveToStorage(doc);
          renderAll();
          break;
        }

        case 'undo':
          if (Engine.canUndo(doc)) {
            doc = Engine.undo(doc);
            Engine.saveToStorage(doc);
            ui.sheetSetIndex = doc.state.currentSetIndex || 0;
            renderAll();
          }
          break;

        case 'redo':
          if (Engine.canRedo(doc)) {
            doc = Engine.redo(doc);
            Engine.saveToStorage(doc);
            ui.sheetSetIndex = doc.state.currentSetIndex || 0;
            renderAll();
          }
          break;

        case 'load-demo':
          ui.menuOpen = false;
          doc = Engine.createDemoMatch(doc.state.lang || 'de');
          Engine.saveToStorage(doc);
          ui.lineupDrafts = {};
          ui.activeTab = 'live';
          ui.sheetViewMode = 'set';
          ui.sheetSetIndex = doc.state.currentSetIndex || 0;
          resetPanZoom();
          renderAll();
          showToast('Sample Swiss Volley Match Loaded!');
          break;

        case 'prompt-clear-match':
          ui.menuOpen = false;
          ui.modal = { type: 'confirmClear' };
          renderTopbar();
          renderModal();
          break;

        case 'confirm-clear-match': {
          Engine.clearStorage();
          const now = new Date();
          doc = Engine.createStore({
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 5),
            bestOf: 5,
          });
          Engine.saveToStorage(doc);
          ui.lineupDrafts = {};
          ui.modal = null;
          ui.activeTab = 'setup';
          ui.sheetViewMode = 'full';
          resetPanZoom();
          renderAll();
          showToast('Match cleared and reset.');
          break;
        }

        case 'toggle-mobile-sheet':
          ui.menuOpen = false;
          ui.mobileSheetOpen = !ui.mobileSheetOpen;
          renderAll();
          break;

        case 'toggle-sheet-fullscreen':
          ui.menuOpen = false;
          ui.sheetFullscreen = !ui.sheetFullscreen;
          resetPanZoom();
          renderAll();
          break;

        case 'sheet-mode-set':
          ui.sheetViewMode = 'set';
          ui.sheetSetIndex = doc.state.currentSetIndex || 0;
          resetPanZoom();
          renderSheet();
          break;

        case 'sheet-mode-full':
          ui.sheetViewMode = 'full';
          resetPanZoom();
          renderSheet();
          break;

        case 'sheet-select-set':
          ui.sheetViewMode = 'set';
          ui.sheetSetIndex = Number(btn.getAttribute('data-set-index') || 0);
          resetPanZoom();
          renderSheet();
          break;

        case 'sheet-zoom-in':
          ui.zoom = Math.min(4, ui.zoom * 1.25);
          applyPanZoom();
          break;

        case 'sheet-zoom-out':
          ui.zoom = Math.max(0.6, ui.zoom / 1.25);
          applyPanZoom();
          break;

        case 'sheet-zoom-reset':
          resetPanZoom();
          break;

        case 'toggle-manual-edit':
          ui.manualEditMode = !ui.manualEditMode;
          if (ui.manualEditMode) {
            ui.mobileSheetOpen = true;
            showToast('Tap any cell on the Matchblatt to override its text!', 'amber');
          }
          renderAll();
          break;

        // Setup & Toss
        case 'swap-teams-ab':
          ui.lineupDrafts = {};
          dispatchAction({ type: 'SWAP_TEAMS_AB' });
          break;

        case 'set-toss': {
          const field = btn.getAttribute('data-field');
          const val = btn.getAttribute('data-val');
          dispatchAction({ type: 'UPDATE_TOSS', toss: { [field]: val } });
          break;
        }

        case 'set-deciding-toss': {
          const field = btn.getAttribute('data-field');
          const val = btn.getAttribute('data-val');
          dispatchAction({ type: 'UPDATE_TOSS', toss: { [field]: val } });
          break;
        }

        case 'set-bestof': {
          const bestOf = Number(btn.getAttribute('data-bestof'));
          dispatchAction({ type: 'UPDATE_META', meta: { bestOf } });
          break;
        }

        case 'set-meta-chip': {
          const mKey = btn.getAttribute('data-meta-key');
          const mVal = btn.getAttribute('data-meta-val');
          if (mKey) {
            dispatchAction({ type: 'UPDATE_META', meta: { [mKey]: mVal != null ? mVal : '' } });
          }
          break;
        }

        // Rosters
        case 'fast-add-players':
          applyFastAddPlayers(btn.getAttribute('data-team'));
          break;

        case 'add-player-row': {
          const tKey = btn.getAttribute('data-team');
          const cur = [...(doc.state.teams[tKey]?.players || [])];
          if (cur.length >= 14) break;
          let nextNum = 1;
          const used = new Set(cur.map((p) => String(p.number)));
          while (used.has(String(nextNum))) nextNum++;
          cur.push({ number: String(nextNum), name: '', birthdate: '', license: '', isCaptain: cur.length === 0 });
          dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { players: cur } });
          break;
        }

        case 'toggle-captain': {
          const tKey = btn.getAttribute('data-team');
          const idx = Number(btn.getAttribute('data-index'));
          const cur = (doc.state.teams[tKey]?.players || []).map((p, i) => ({
            ...p,
            isCaptain: i === idx ? !p.isCaptain : false,
          }));
          dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { players: cur } });
          break;
        }

        case 'remove-player': {
          const tKey = btn.getAttribute('data-team');
          const idx = Number(btn.getAttribute('data-index'));
          const cur = (doc.state.teams[tKey]?.players || []).filter((_, i) => i !== idx);
          dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { players: cur } });
          break;
        }

        case 'add-libero-row': {
          const tKey = btn.getAttribute('data-team');
          const cur = [...(doc.state.teams[tKey]?.liberos || [])];
          if (cur.length >= 2) break;
          cur.push({ number: cur.length === 0 ? '99' : '98', name: '', birthdate: '', license: '', isCaptain: false });
          dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { liberos: cur } });
          break;
        }

        case 'remove-libero': {
          const tKey = btn.getAttribute('data-team');
          const idx = Number(btn.getAttribute('data-index'));
          const cur = (doc.state.teams[tKey]?.liberos || []).filter((_, i) => i !== idx);
          dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { liberos: cur } });
          break;
        }

        // Lineup 6-Grid
        case 'select-lineup-zone': {
          const tKey = btn.getAttribute('data-team');
          ui.lineupCursor[tKey] = Number(btn.getAttribute('data-zone'));
          renderControls();
          break;
        }

        case 'pick-lineup-jersey': {
          const tKey = btn.getAttribute('data-team');
          const num = btn.getAttribute('data-number');
          const setIdx = doc.state.currentSetIndex || 0;
          const draft = getDraftLineup(setIdx, tKey);
          const existingIdx = draft.indexOf(num);
          if (existingIdx !== -1) {
            draft[existingIdx] = '';
            ui.lineupCursor[tKey] = existingIdx;
          } else {
            const z = ui.lineupCursor[tKey] || 0;
            draft[z] = num;
            const nextEmpty = draft.findIndex((v, idx) => idx > z && !v);
            const anyEmpty = draft.findIndex((v) => !v);
            ui.lineupCursor[tKey] = nextEmpty !== -1 ? nextEmpty : anyEmpty !== -1 ? anyEmpty : (z + 1) % 6;
          }
          renderControls();
          break;
        }

        case 'pick-lineup-libero': {
          const tKey = btn.getAttribute('data-team');
          const num = btn.getAttribute('data-number');
          const setIdx = doc.state.currentSetIndex || 0;
          const draft = getDraftLineup(setIdx, tKey);
          const existingIdx = draft.indexOf(num);
          if (existingIdx !== -1) {
            draft[existingIdx] = '';
            ui.lineupCursor[tKey] = existingIdx;
          } else {
            showToast(`⚠️ #${num} is a Libero (L) — blocked unless overridden at Set Start.`, 'amber');
            const z = ui.lineupCursor[tKey] || 0;
            draft[z] = num;
            const nextEmpty = draft.findIndex((v, idx) => idx > z && !v);
            const anyEmpty = draft.findIndex((v) => !v);
            ui.lineupCursor[tKey] = nextEmpty !== -1 ? nextEmpty : anyEmpty !== -1 ? anyEmpty : (z + 1) % 6;
          }
          renderControls();
          break;
        }

        case 'autofill-lineup': {
          const tKey = btn.getAttribute('data-team');
          const setIdx = doc.state.currentSetIndex || 0;
          let players = doc.state.teams[tKey]?.players || [];
          if (players.length < 6) {
            const autoRoster = ['1', '2', '3', '4', '5', '6'].map((n, i) => ({
              number: n,
              name: '',
              birthdate: '',
              isCaptain: i === 0,
            }));
            dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { players: autoRoster } });
            players = doc.state.teams[tKey]?.players || [];
          }
          ui.lineupDrafts[`${setIdx}_${tKey}`] = players.slice(0, 6).map((p) => String(p.number));
          renderControls();
          break;
        }

        case 'inline-six-apply': {
          const tKey = btn.getAttribute('data-team');
          const setIdx = doc.state.currentSetIndex || 0;
          const inp = document.getElementById(`mb-inline-six-${tKey}`);
          const nums = parseFastJerseys(inp ? inp.value : '');
          if (nums.length < 6) {
            showToast('Enter 6 jersey numbers separated by spaces.', 'amber');
            break;
          }
          const six = nums.slice(0, 6);
          const curPlayers = [...(doc.state.teams[tKey]?.players || [])];
          const have = new Set(curPlayers.map((p) => String(p.number)));
          six.forEach((n, idx) => {
            if (!have.has(n)) {
              curPlayers.push({ number: n, name: '', birthdate: '', isCaptain: curPlayers.length === 0 && idx === 0 });
              have.add(n);
            }
          });
          dispatchAction({ type: 'UPDATE_TEAM', team: tKey, data: { players: curPlayers } });
          ui.lineupDrafts[`${setIdx}_${tKey}`] = six;
          renderControls();
          break;
        }

        case 'clear-lineup': {
          const tKey = btn.getAttribute('data-team');
          const setIdx = doc.state.currentSetIndex || 0;
          ui.lineupDrafts[`${setIdx}_${tKey}`] = ['', '', '', '', '', ''];
          ui.lineupCursor[tKey] = 0;
          renderControls();
          break;
        }

        case 'confirm-start-set':
          attemptStartSet(Number(btn.getAttribute('data-set-index')), false);
          break;

        case 'force-start-set':
          attemptStartSet(Number(btn.getAttribute('data-set-index')), true);
          break;

        // Live Rally Scoring & Controls
        case 'score-left': {
          const curSet = doc.state.sets[doc.state.currentSetIndex || 0];
          if (curSet && curSet.status === 'live') {
            dispatchAction({ type: 'SCORE_POINT', team: curSet.leftTeam }, { syncSetView: true });
          }
          break;
        }

        case 'score-right': {
          const curSet = doc.state.sets[doc.state.currentSetIndex || 0];
          if (curSet && curSet.status === 'live') {
            dispatchAction({ type: 'SCORE_POINT', team: curSet.rightTeam }, { syncSetView: true });
          }
          break;
        }

        case 'finish-set': {
          dispatchAction({ type: 'FINISH_SET' }, { syncSetView: true });
          if (doc.state.phase === 'finished') {
            ui.activeTab = 'review';
            ui.sheetViewMode = 'full';
            resetPanZoom();
            renderAll();
          }
          break;
        }

        case 'dismiss-switch8':
          ui.dismissedSwitch8Set = Number(btn.getAttribute('data-set-index'));
          renderControls();
          break;

        case 'dismiss-timeout-timer':
          if (ui.timeoutTimer && ui.timeoutTimer.intervalId) clearInterval(ui.timeoutTimer.intervalId);
          ui.timeoutTimer = null;
          renderControls();
          break;

        case 'open-sub': {
          const team = btn.getAttribute('data-team');
          const curSet = doc.state.sets[doc.state.currentSetIndex || 0];
          const firstCourt = curSet?.lineups?.[team]?.court?.[0] || '';
          ui.modal = { type: 'sub', team, outNumber: String(firstCourt), inNumber: '' };
          renderModal();
          break;
        }

        case 'sub-pick-out':
          if (ui.modal && ui.modal.type === 'sub') {
            ui.modal.outNumber = btn.getAttribute('data-number');
            renderModal();
          }
          break;

        case 'sub-pick-in':
          if (ui.modal && ui.modal.type === 'sub') {
            ui.modal.inNumber = btn.getAttribute('data-number');
            renderModal();
          }
          break;

        case 'confirm-sub': {
          if (!ui.modal || ui.modal.type !== 'sub') break;
          const manualInp = document.getElementById('mb-sub-manual-in');
          const inNum = (manualInp && manualInp.value.trim()) || ui.modal.inNumber;
          if (!ui.modal.outNumber || !inNum) {
            showToast('Select both OUT player and IN player.', 'amber');
            break;
          }
          const force = btn.getAttribute('data-force') === 'true';
          const res = dispatchAction({
            type: 'SUBSTITUTE',
            team: ui.modal.team,
            outNumber: String(ui.modal.outNumber),
            inNumber: String(inNum),
            force,
            exceptional: force,
          });
          if (!res.error && (!res.warnings || res.warnings.length === 0 || force)) {
            ui.modal = null;
            renderModal();
          } else if (res.warnings && res.warnings.length > 0) {
            ui.modal.inNumber = String(inNum);
            renderModal();
          }
          break;
        }

        case 'call-timeout': {
          const team = btn.getAttribute('data-team');
          const res = dispatchAction({ type: 'TIMEOUT', team });
          if (res.warnings && res.warnings.length > 0) {
            ui.modal = { type: 'timeoutWarn', team, warnings: res.warnings };
            renderModal();
          } else if (!res.error) {
            startTimeoutTimer(team);
            renderControls();
          }
          break;
        }

        case 'force-timeout': {
          const team = btn.getAttribute('data-team');
          ui.modal = null;
          const res = dispatchAction({ type: 'TIMEOUT', team, force: true });
          if (!res.error) {
            startTimeoutTimer(team);
            renderControls();
          }
          break;
        }

        case 'swap-sides':
          dispatchAction({ type: 'SWAP_SIDES' });
          break;

        case 'open-sanctions':
          ui.modal = { type: 'sanctions', team: 'A', sanctionType: 'warning', playerOrOfficial: '', awardPoint: true };
          renderModal();
          break;

        case 'sanction-set-team':
          if (ui.modal && ui.modal.type === 'sanctions') {
            const personInp = document.getElementById('mb-sanction-person');
            if (personInp) ui.modal.playerOrOfficial = personInp.value;
            ui.modal.team = btn.getAttribute('data-team');
            renderModal();
          }
          break;

        case 'submit-sanction': {
          if (!ui.modal || ui.modal.type !== 'sanctions') break;
          const sel = document.getElementById('mb-sanction-type-select');
          const sType = sel ? sel.value : ui.modal.sanctionType;
          const personInp = document.getElementById('mb-sanction-person');
          const awardChk = document.getElementById('mb-sanction-award-pt');
          const team = ui.modal.team;
          ui.modal = null;
          if (sType === 'improperRequest') {
            dispatchAction({ type: 'IMPROPER_REQUEST', team, force: true });
          } else {
            const personVal = personInp ? personInp.value.trim() || 'C' : 'C';
            dispatchAction({
              type: 'ADD_SANCTION',
              team,
              sanctionType: sType,
              person: personVal,
              playerNumber: personVal,
              playerOrOfficial: personVal,
              awardPoint: awardChk ? awardChk.checked : true,
            });
          }
          break;
        }

        case 'open-libero-redesignate':
          ui.modal = { type: 'liberoRedesignate', team: btn.getAttribute('data-team') || 'A' };
          renderModal();
          break;

        case 'libero-modal-team':
          if (ui.modal && ui.modal.type === 'liberoRedesignate') {
            ui.modal.team = btn.getAttribute('data-team');
            renderModal();
          }
          break;

        case 'submit-libero-redesignate': {
          if (!ui.modal || ui.modal.type !== 'liberoRedesignate') break;
          const outSel = document.getElementById('mb-libero-out');
          const inSel = document.getElementById('mb-libero-in');
          if (outSel && inSel && outSel.value && inSel.value) {
            const team = ui.modal.team;
            ui.modal = null;
            dispatchAction({
              type: 'REDESIGNATE_LIBERO',
              team,
              outLiberoNumber: outSel.value,
              newLiberoNumber: inSel.value,
            });
          }
          break;
        }

        // Manual Overrides & Signatures
        case 'save-cell-override': {
          const key = btn.getAttribute('data-cell-key');
          const inp = document.getElementById('mb-cell-override-input');
          ui.modal = null;
          dispatchAction({ type: 'SET_MANUAL_OVERRIDE', cellKey: key, value: inp ? inp.value : '' });
          break;
        }

        case 'clear-single-override': {
          const key = btn.getAttribute('data-cell-key');
          ui.modal = null;
          dispatchAction({ type: 'SET_MANUAL_OVERRIDE', cellKey: key, value: null });
          break;
        }

        case 'clear-all-overrides':
          dispatchAction({ type: 'CLEAR_MANUAL_OVERRIDES' });
          break;

        case 'open-signature':
          ui.modal = { type: 'signature', role: btn.getAttribute('data-role') };
          renderModal();
          break;

        case 'sig-clear-pad': {
          const canvas = document.getElementById('mb-sig-canvas');
          if (canvas && sigCanvasCtx) {
            sigCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            sigHasInk = false;
          }
          break;
        }

        case 'sig-delete-saved': {
          const role = btn.getAttribute('data-role');
          ui.modal = null;
          dispatchAction({ type: 'SET_SIGNATURE', role, dataUrl: '' });
          break;
        }

        case 'sig-save': {
          const role = btn.getAttribute('data-role');
          const canvas = document.getElementById('mb-sig-canvas');
          const dataUrl = canvas && sigHasInk ? canvas.toDataURL('image/png') : '';
          ui.modal = null;
          dispatchAction({ type: 'SET_SIGNATURE', role, dataUrl });
          break;
        }

        case 'close-modal':
        case 'backdrop-close':
          ui.modal = null;
          renderModal();
          break;

        // Export & Share
        case 'download-pdf':
          if (Exporter && Exporter.downloadPDF) {
            showToast('Generating A4 Landscape PDF...');
            await Exporter.downloadPDF(doc.state);
          }
          break;

        case 'share-pdf':
          if (Exporter && Exporter.sharePDF) {
            await Exporter.sharePDF(doc.state);
          }
          break;

        case 'download-png':
          if (Exporter && Exporter.downloadPNG) {
            showToast('Rendering High-DPI PNG...');
            await Exporter.downloadPNG(doc.state);
          }
          break;

        case 'share-png':
          if (Exporter && Exporter.sharePNG) {
            await Exporter.sharePNG(doc.state);
          }
          break;

        case 'export-json':
          ui.menuOpen = false;
          if (Exporter && Exporter.exportJSON) {
            Exporter.exportJSON(doc);
            showToast('JSON Backup downloaded.');
          }
          break;

        case 'trigger-import-json':
          ui.menuOpen = false;
          renderTopbar();
          jsonFileInput.value = '';
          jsonFileInput.click();
          break;
      }
    });

    // Handle Form Field Commits (`change` event commits to Undo history without losing typing focus!)
    rootEl.addEventListener('change', (e) => {
      const t = e.target;

      if (t.getAttribute('data-action-change') === 'sanction-type' && ui.modal && ui.modal.type === 'sanctions') {
        const personInp = document.getElementById('mb-sanction-person');
        if (personInp) ui.modal.playerOrOfficial = personInp.value;
        ui.modal.sanctionType = t.value;
        renderModal();
        return;
      }

      const metaKey = t.getAttribute('data-meta');
      if (metaKey) {
        dispatchAction({ type: 'UPDATE_META', meta: { [metaKey]: t.value } }, { sheetOnly: true });
        return;
      }

      const teamField = t.getAttribute('data-team-field');
      if (teamField) {
        const [teamKey, prop] = teamField.split('.');
        dispatchAction({ type: 'UPDATE_TEAM', team: teamKey, data: { [prop]: t.value } }, { sheetOnly: false });
        return;
      }

      const rosterEdit = t.getAttribute('data-roster-edit');
      if (rosterEdit) {
        const [teamKey, listName, idxStr, prop] = rosterEdit.split('.');
        const idx = Number(idxStr);
        const val = t.value.trim();
        const list = (doc.state.teams[teamKey]?.[listName] || []).map((item, i) => {
          if (i !== idx) return item;
          if (prop === 'license' || prop === 'birthdate') {
            if (!val) {
              return { ...item, license: '', birthdate: '' };
            }
            const isDateLike = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(val) || /^\d{4}-\d{2}-\d{2}$/.test(val);
            if (isDateLike) {
              return { ...item, birthdate: val, license: '' };
            }
            return { ...item, license: val };
          }
          return { ...item, [prop]: val };
        });
        dispatchAction({ type: 'UPDATE_TEAM', team: teamKey, data: { [listName]: list } }, { sheetOnly: true });
        return;
      }

      const officialEdit = t.getAttribute('data-official-edit');
      if (officialEdit) {
        const [teamKey, prop] = officialEdit.split('.');
        const officials = { ...(doc.state.teams[teamKey]?.officials || {}), [prop]: t.value };
        dispatchAction({ type: 'UPDATE_TEAM', team: teamKey, data: { officials } }, { sheetOnly: true });
        return;
      }

      if (t.getAttribute('data-remarks') === 'true') {
        dispatchAction({ type: 'SET_REMARKS', remarks: t.value }, { sheetOnly: true });
        return;
      }

      const setTimeSpec = t.getAttribute('data-set-time');
      if (setTimeSpec) {
        const [idxStr, prop] = setTimeSpec.split('.');
        const setIdx = Number(idxStr);
        const s = doc.state.sets[setIdx] || {};
        dispatchAction(
          {
            type: 'UPDATE_SET_TIMES',
            setIndex: setIdx,
            startTime: prop === 'startTime' ? t.value : s.startTime,
            endTime: prop === 'endTime' ? t.value : s.endTime,
          },
          { sheetOnly: true }
        );
      }
    });

    // Enter key on Fast Jersey Entry input
    rootEl.addEventListener('keydown', (e) => {
      const fastTeam = e.target.getAttribute && e.target.getAttribute('data-fast-input');
      if (fastTeam && e.key === 'Enter') {
        e.preventDefault();
        applyFastAddPlayers(fastTeam);
      }
    });

    // JSON File Import Handler
    jsonFileInput.addEventListener('change', async () => {
      const file = jsonFileInput.files && jsonFileInput.files[0];
      if (!file || !Exporter || !Exporter.importJSON) return;
      try {
        const imported = await Exporter.importJSON(file);
        if (imported && imported.state) {
          doc = Engine.normalizeDoc ? Engine.normalizeDoc(imported) : imported;
        } else if (imported && imported.teams && imported.sets) {
          const wrapped = { state: imported, past: [], future: [], version: 1 };
          doc = Engine.normalizeDoc ? Engine.normalizeDoc(wrapped) : wrapped;
        } else {
          throw new Error('Invalid Matchblatt JSON file');
        }
        Engine.saveToStorage(doc);
        ui.lineupDrafts = {};
        ui.activeTab = phaseToTab(doc.state.phase);
        ui.sheetSetIndex = doc.state.currentSetIndex || 0;
        renderAll();
        showToast('Match restored from JSON backup!');
      } catch (err) {
        showToast('Failed to import JSON: ' + (err.message || err), 'danger');
      }
    });

    // Laptop Keyboard Shortcuts (disabled when typing in inputs or modal open)
    window.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);

      if (e.key === 'Escape') {
        if (ui.modal) {
          ui.modal = null;
          renderModal();
          return;
        }
        if (ui.sheetFullscreen) {
          ui.sheetFullscreen = false;
          renderAll();
          return;
        }
      }

      if (isEditable || ui.modal) return;

      // Undo / Redo shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (Engine.canRedo(doc)) {
            doc = Engine.redo(doc);
            Engine.saveToStorage(doc);
            renderAll();
          }
        } else if (Engine.canUndo(doc)) {
          doc = Engine.undo(doc);
          Engine.saveToStorage(doc);
          renderAll();
        }
        return;
      }

      // Live scoring shortcuts
      if (ui.activeTab === 'live' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const curSet = doc.state.sets[doc.state.currentSetIndex || 0];
        if (!curSet || curSet.status !== 'live') return;
        const k = e.key.toLowerCase();
        if (k === 'a' || k === 'q' || e.key === 'ArrowLeft') {
          e.preventDefault();
          dispatchAction({ type: 'SCORE_POINT', team: curSet.leftTeam }, { syncSetView: true });
        } else if (k === 'l' || k === 'p' || e.key === 'ArrowRight') {
          e.preventDefault();
          dispatchAction({ type: 'SCORE_POINT', team: curSet.rightTeam }, { syncSetView: true });
        }
      }
    });

    // Online / Offline status indicator updates
    window.addEventListener('online', () => {
      ui.isOnline = true;
      renderTopbar();
    });
    window.addEventListener('offline', () => {
      ui.isOnline = false;
      renderTopbar();
    });

    // Re-fit SVG cleanly on any viewport or pane resize
    window.addEventListener('resize', fitSheetSVG);
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => fitSheetSVG());
      ro.observe(sheetStageEl);
      ro.observe(sheetPaneEl);
    }

    // Initial render
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
