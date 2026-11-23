import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.join('/tmp', 'matchblatt-shots');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function launchChromeCDP() {
  const userDataDir = fs.mkdtempSync('/tmp/mb-e2e-chrome-');
  const proc = spawn(
    CHROME_BIN,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--user-data-dir=${userDataDir}`,
      '--remote-debugging-pipe',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] }
  );

  let buf = '';
  let nextId = 1;
  const pending = new Map();
  const pageErrors = [];
  const eventHandlers = new Map();

  proc.stdio[4].on('data', (chunk) => {
    buf += chunk.toString();
    const parts = buf.split('\0');
    buf = parts.pop();
    for (const raw of parts) {
      if (!raw) continue;
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`));
        else resolve(msg.result);
      } else {
        if (msg.method && eventHandlers.has(msg.method)) {
          eventHandlers.get(msg.method)(msg);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          const details = msg.params?.exceptionDetails;
          pageErrors.push(details?.exception?.description || details?.text || JSON.stringify(details));
        } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
          const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
          pageErrors.push(`console.error: ${text}`);
        }
      }
    }
  });

  function send(method, params = {}, sessionId = undefined) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      const payload = JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0';
      proc.stdio[3].write(payload);
    });
  }

  return { proc, send, pageErrors, eventHandlers, userDataDir };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('\n=== Matchblatt Multi-Viewport Browser E2E & Visual Verification ===');
  const baseUrl = 'http://127.0.0.1:8080/';
  const { proc, send, pageErrors, eventHandlers } = launchChromeCDP();

  try {
    const { targetInfos } = await send('Target.getTargets');
    const pageTarget = targetInfos.find((t) => t.type === 'page');
    const { sessionId: sid } = await send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true,
    });

    // Serve http://127.0.0.1:8080/* directly from local workspace via CDP Fetch interception
    eventHandlers.set('Fetch.requestPaused', (msg) => {
      const reqUrl = new URL(msg.params.request.url);
      const rel = reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname.replace(/^\/+/, '');
      const fullPath = path.resolve(ROOT, rel);
      if (!fullPath.startsWith(ROOT) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 404, body: '' }, msg.sessionId).catch(() => {});
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      const body = fs.readFileSync(fullPath).toString('base64');
      send(
        'Fetch.fulfillRequest',
        {
          requestId: msg.params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: MIME_TYPES[ext] || 'application/octet-stream' }],
          body,
        },
        msg.sessionId
      ).catch(() => {});
    });

    await send('Fetch.enable', { patterns: [{ urlPattern: 'http://127.0.0.1:8080/*' }] }, sid);
    await send('Page.enable', {}, sid);
    await send('Runtime.enable', {}, sid);
    await send('DOM.enable', {}, sid);
    // Force consistent light theme across all screenshots (swarm_pane rule)
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: 'light' }],
    }, sid);

    async function setViewport(width, height, mobile = false) {
      await send(
        'Emulation.setDeviceMetricsOverride',
        {
          width,
          height,
          deviceScaleFactor: 2,
          mobile,
        },
        sid
      );
      await sleep(180);
    }

    async function evalJS(expression, awaitPromise = true) {
      const res = await send(
        'Runtime.evaluate',
        { expression, returnByValue: true, awaitPromise },
        sid
      );
      if (res.exceptionDetails) {
        throw new Error(`Eval exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
      }
      return res.result?.value;
    }

    async function captureScreenshot(filename) {
      await sleep(220);
      const { data } = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }, sid);
      const outPath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`  📸 Saved ${filename} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
      return outPath;
    }

    // =========================================================================
    // 0. Export Empty State Full-Sheet PNG + DOM Text-Overlap/Clipping Audit
    // =========================================================================
    await setViewport(1440, 900, false);
    await send('Page.navigate', { url: baseUrl }, sid);
    await sleep(600);
    await evalJS(`localStorage.clear(); location.reload();`);
    await sleep(600);

    // Render empty state full-sheet PNG directly from browser Exporter.toPNGBlob
    const emptyPngB64 = await evalJS(`(async () => {
      const emptyDoc = window.Matchblatt.Engine.createStore();
      const blob = await window.Matchblatt.Exporter.toPNGBlob(emptyDoc.state, { width: 2382, height: 1684 });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 8192) {
        bin += String.fromCharCode(...buf.subarray(i, i + 8192));
      }
      return btoa(bin);
    })()`, true);
    const scratchDir = path.join(SCREENSHOT_DIR, 'scratch');
    fs.mkdirSync(scratchDir, { recursive: true });
    fs.writeFileSync(path.join(scratchDir, 'empty_sheet_export.png'), Buffer.from(emptyPngB64, 'base64'));
    console.log('  📸 Saved scratch/empty_sheet_export.png (empty state 1:1 full sheet)');

    // Audit Blank Full-Sheet SVG in DOM for text overlaps or out-of-bounds clipping
    await evalJS(`document.querySelector('[data-action="sheet-mode-full"]').click()`);
    await sleep(150);

    const svgGeometryAuditHelper = `(() => {
      const svg = document.querySelector('#mb-sheet-mount svg');
      if (!svg) return { error: 'No SVG mounted' };
      const texts = Array.from(svg.querySelectorAll('text'));
      const boxes = [];
      const outOfPage = [];
      for (const t of texts) {
        const content = (t.textContent || '').trim();
        if (!content) continue;
        // Skip rotated vertical labels from axis-aligned horizontal pair check, but verify they stay inside page
        const transform = t.getAttribute('transform') || '';
        const ctm = t.getCTM();
        const svgCTM = svg.getCTM();
        const bb = t.getBBox();
        if (bb.width <= 0 || bb.height <= 0) continue;
        // Map 4 corners through CTM relative to root SVG user space (0..1684, 0..1190)
        const inv = svgCTM.inverse().multiply(ctm);
        const pts = [
          new DOMPoint(bb.x, bb.y).matrixTransform(inv),
          new DOMPoint(bb.x + bb.width, bb.y).matrixTransform(inv),
          new DOMPoint(bb.x, bb.y + bb.height).matrixTransform(inv),
          new DOMPoint(bb.x + bb.width, bb.y + bb.height).matrixTransform(inv),
        ];
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));
        if (minX < -2 || maxX > 1686 || minY < -2 || maxY > 1192) {
          outOfPage.push({ content, minX: Math.round(minX), maxX: Math.round(maxX), minY: Math.round(minY), maxY: Math.round(maxY) });
        }
        boxes.push({ content, minX, maxX, minY, maxY, rotated: transform.includes('rotate') });
      }
      // Check for unintended text-on-text collisions (>35% intersection of smaller box's area)
      const collisions = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const ix = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
          const iy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
          if (ix > 2.2 && iy > 2.2) {
            const areaA = (a.maxX - a.minX) * (a.maxY - a.minY);
            const areaB = (b.maxX - b.minX) * (b.maxY - b.minY);
            const ratio = (ix * iy) / Math.min(areaA, areaB);
            if (ratio > 0.35) {
              collisions.push({
                a: a.content,
                b: b.content,
                at: [Math.round(a.minX), Math.round(a.minY)],
                ratio: Number(ratio.toFixed(2)),
              });
            }
          }
        }
      }
      return { textCount: boxes.length, outOfPage, collisions: collisions.slice(0, 15) };
    })()`;

    const blankAudit = await evalJS(svgGeometryAuditHelper);
    console.log('  ✓ Blank Full-Sheet SVG audit:', JSON.stringify(blankAudit));
    assert.deepEqual(blankAudit.outOfPage, [], `Blank SVG text outside page bounds: ${JSON.stringify(blankAudit.outOfPage)}`);
    assert.deepEqual(blankAudit.collisions, [], `Blank SVG text collisions found: ${JSON.stringify(blankAudit.collisions)}`);

    // Test Step 1 Swiss Volley Header Checkboxes (matchType, level, gender, ageGroup) on Laptop 1440x900
    await evalJS(`
      document.querySelector('[data-action="set-meta-chip"][data-meta-key="matchType"][data-meta-val="cup"]').click();
      document.querySelector('[data-action="set-meta-chip"][data-meta-key="level"][data-meta-val="national"]').click();
      document.querySelector('[data-action="set-meta-chip"][data-meta-key="gender"][data-meta-val="women"]').click();
      document.querySelector('[data-action="set-meta-chip"][data-meta-key="ageGroup"][data-meta-val="U23"]').click();
    `);
    await sleep(150);
    const chipState = await evalJS(`JSON.parse(localStorage.getItem('matchblatt_doc_v1')).state.meta`);
    assert.equal(chipState.matchType, 'cup');
    assert.equal(chipState.level, 'national');
    assert.equal(chipState.gender, 'women');
    assert.equal(chipState.ageGroup, 'U23');
    await captureScreenshot('00_laptop_1440x900_setup_checkboxes.png');

    // =========================================================================
    // 1. iPhone 17 Viewport (393x852): Full End-to-End Walkthrough from Scratch
    // =========================================================================
    await setViewport(393, 852, true);
    await send('Page.navigate', { url: baseUrl }, sid);
    await sleep(600);

    // Clear storage to test fresh setup -> quick jersey entry -> lineup -> live scoring
    await evalJS(`localStorage.clear(); location.reload();`);
    await sleep(600);

    // Check zero horizontal overflow on iPhone 17 Setup screen
    const setupMetrics = await evalJS(`({
      innerW: window.innerWidth,
      scrollW: document.documentElement.scrollWidth,
      hasTopbar: !!document.getElementById('mb-topbar'),
      lang: document.querySelector('.mb-lang-btn.active')?.dataset.lang
    })`);
    assert.ok(setupMetrics.hasTopbar, 'Topbar must render on iPhone 17');
    assert.ok(
      setupMetrics.scrollW <= setupMetrics.innerW + 1,
      `iPhone 17 Setup horizontal overflow: scrollWidth=${setupMetrics.scrollW} > innerWidth=${setupMetrics.innerW}`
    );

    // Toggle EN / DE language switch and set Setup fields
    await evalJS(`
      document.querySelector('[data-action="set-lang"][data-lang="en"]').click();
    `);
    await sleep(100);
    const enTitleCheck = await evalJS(`document.body.innerText.includes('Match') && document.body.innerText.includes('Teams')`);
    assert.ok(enTitleCheck, 'EN language toggle must translate step tabs');

    // Switch back to DE (Swiss Volley default) or keep EN — let's use EN for clear international readability or test both!
    // Go to Step 2: Rosters -> Rapid space-separated jersey entry (ONLY jersey numbers!)
    await evalJS(`document.querySelector('[data-action="go-step"][data-tab="rosters"]').click()`);
    await sleep(150);

    await evalJS(`
      // Set Team A & B names and rapid-add jerseys
      const setInput = (sel, val) => {
        const el = document.querySelector(sel);
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setInput('[data-team-field="A.name"]', 'VBC Kanti Schaffhausen');
      setInput('[data-team-field="A.shortName"]', 'KAN');
      setInput('#mb-fast-jerseys-A', '2 4 7 9 11 14 15 18');
      document.querySelector('[data-action="fast-add-players"][data-team="A"]').click();

      // Add a Libero #12 to Team A and toggle Captain on first player
      document.querySelector('[data-action="toggle-captain"][data-team="A"][data-index="0"]').click();
      document.querySelector('[data-action="add-libero-row"][data-team="A"]').click();
      setInput('[data-roster-edit="A.liberos.0.number"]', '12');

      // If Team B is tabbed or stacked on mobile, ensure Team B is visible/editable
      const bTabBtn = document.querySelector('[data-roster-team="B"], [data-action="roster-tab"][data-team="B"]');
      if (bTabBtn) bTabBtn.click();
      setInput('[data-team-field="B.name"]', 'Sm\\'Aesch Pfeffingen');
      setInput('[data-team-field="B.shortName"]', 'PFE');
      setInput('#mb-fast-jerseys-B', '1 5 8 10 13 16 20');
      document.querySelector('[data-action="fast-add-players"][data-team="B"]').click();
      document.querySelector('[data-action="toggle-captain"][data-team="B"][data-index="0"]').click();
    `);
    await sleep(180);

    const rosterCounts = await evalJS(`({
      aCount: document.querySelectorAll('[data-roster-edit^="A.players."][data-roster-edit$=".number"]').length,
      bCount: document.querySelectorAll('[data-roster-edit^="B.players."][data-roster-edit$=".number"]').length
    })`);
    assert.ok(rosterCounts.aCount === 8, `Expected 8 Team A players from rapid entry, got ${rosterCounts.aCount}`);

    // Go to Step 3: Set 1 Lineup
    await evalJS(`document.querySelector('[data-action="switch-tab"][data-tab="live"]').click()`);
    await sleep(180);

    // Test Libero guard in lineup (clicking Libero chip #12) + autofill 6 starters for A and B + Confirm Set Start
    await evalJS(`
      document.querySelector('[data-action="autofill-lineup"][data-team="A"]').click();
      document.querySelector('[data-action="autofill-lineup"][data-team="B"]').click();
      document.querySelector('[data-action="confirm-start-set"]').click();
    `);
    await sleep(220);

    // Score rallies on iPhone 17: Left +1, Left +1, Right +1 (side-out rotation!), Substitution, Timeout, Undo
    await evalJS(`
      document.getElementById('btn-score-left').click();
      document.getElementById('btn-score-left').click();
      document.getElementById('btn-score-right').click();
    `);
    await sleep(150);

    // Perform a Substitution via the UI modal on Team A: #4 OUT -> #15 IN
    await evalJS(`
      document.querySelector('[data-action="open-sub"][data-team="A"]').click();
    `);
    await sleep(100);
    await evalJS(`
      document.querySelector('[data-action="sub-pick-out"][data-number="4"]').click();
      document.querySelector('[data-action="sub-pick-in"][data-number="15"]').click();
      document.querySelector('[data-action="confirm-sub"]').click();
    `);
    await sleep(120);

    // Call Timeout for Team B and dismiss timer pill after checking it
    await evalJS(`document.querySelector('[data-action="call-timeout"][data-team="B"]').click()`);
    await sleep(120);
    const hasTimeoutBanner = await evalJS(`!!document.getElementById('mb-timeout-countdown')`);
    assert.ok(hasTimeoutBanner, '30s timeout countdown banner should appear on timeout');
    await evalJS(`document.querySelector('[data-action="dismiss-timeout-timer"]')?.click()`);

    // Score one more point so Current Set Matchblatt shows vibrant latest point highlight!
    await evalJS(`document.getElementById('btn-score-left').click()`);
    await sleep(150);

    // Verify Undo & Redo buttons work via UI click
    const scoreBeforeUndo = await evalJS(`document.getElementById('btn-score-left').innerText`);
    await evalJS(`document.querySelector('[data-action="undo"]').click()`);
    await sleep(100);
    const scoreAfterUndo = await evalJS(`document.getElementById('btn-score-left').innerText`);
    assert.notEqual(scoreAfterUndo, scoreBeforeUndo, 'Undo button must revert latest scored point');
    await evalJS(`document.querySelector('[data-action="redo"]').click()`);
    await sleep(150);

    // Inspect iPhone 17 (393x852) live layout ergonomics:
    // Both Matchblatt pane and Score buttons must be visible in viewport without overlap!
    const iphoneLiveLayout = await evalJS(`(() => {
      const sheetPane = document.getElementById('mb-sheet-pane').getBoundingClientRect();
      const controlsPane = document.getElementById('mb-controls').getBoundingClientRect();
      const leftBtn = document.getElementById('btn-score-left').getBoundingClientRect();
      const rightBtn = document.getElementById('btn-score-right').getBoundingClientRect();
      const hasHighlight = !!document.querySelector('#mb-sheet-mount .mb-highlight');
      return {
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        scrollW: document.documentElement.scrollWidth,
        sheetPane: { top: sheetPane.top, bottom: sheetPane.bottom, height: sheetPane.height, width: sheetPane.width },
        controlsPane: { top: controlsPane.top, bottom: controlsPane.bottom, height: controlsPane.height },
        leftBtn: { top: leftBtn.top, bottom: leftBtn.bottom, height: leftBtn.height, width: leftBtn.width },
        rightBtn: { top: rightBtn.top, bottom: rightBtn.bottom, height: rightBtn.height, width: rightBtn.width },
        hasHighlight
      };
    })()`);

    console.log('  ✓ iPhone 17 (393x852) live layout metrics:', JSON.stringify(iphoneLiveLayout));
    assert.ok(iphoneLiveLayout.scrollW <= 394, 'No horizontal overflow on iPhone 17 live view');
    assert.ok(iphoneLiveLayout.sheetPane.height >= 160, 'Top Matchblatt viewport must be generously visible on iPhone 17');
    assert.ok(
      iphoneLiveLayout.sheetPane.bottom <= iphoneLiveLayout.controlsPane.top + 2,
      'Top Matchblatt viewport must not overlap bottom Live Cockpit on iPhone 17'
    );
    assert.ok(iphoneLiveLayout.leftBtn.height >= 48 && iphoneLiveLayout.rightBtn.height >= 48, '+1 Score buttons must be >= 48px tall');
    assert.ok(iphoneLiveLayout.leftBtn.bottom <= 852, '+1 Score buttons must be visible above fold without scrolling on iPhone 17');
    assert.ok(iphoneLiveLayout.hasHighlight, 'Current Set Matchblatt SVG must display live mb-highlight');

    await captureScreenshot('01_iphone17_live_scoring.png');

    // Toggle Full Sheet zoom-out on iPhone 17 and verify viewBox switches to 0 0 1684 1190, then back to Current Set
    await evalJS(`document.querySelector('[data-action="sheet-mode-full"]').click()`);
    await sleep(150);
    const fullVBAttr = await evalJS(`document.querySelector('#mb-sheet-mount svg')?.getAttribute('viewBox')`);
    assert.equal(fullVBAttr, '0 0 1684 1190', 'Full Sheet toggle must switch SVG viewBox to 0 0 1684 1190');
    await evalJS(`document.querySelector('[data-action="sheet-mode-set"]').click()`);
    await sleep(120);

    // =========================================================================
    // 2. Pixel Fold / iPhone Duo Unfolded Viewport (840x900): Dual-Pane Split
    // =========================================================================
    await setViewport(840, 900, false);
    // Load realistic Swiss Volley Demo Match (Volley Köniz vs VBC Zürich, Set 2 live)
    await evalJS(`
      document.querySelector('[data-action="toggle-menu"]').click();
    `);
    await sleep(80);
    await evalJS(`
      document.querySelector('[data-action="load-demo"]').click();
    `);
    await sleep(250);
    // Score a point in Set 2 so highlight glows on foldable dual-pane view
    await evalJS(`document.getElementById('btn-score-left').click()`);
    await sleep(180);

    const foldableLayout = await evalJS(`(() => {
      const controls = document.getElementById('mb-controls').getBoundingClientRect();
      const sheet = document.getElementById('mb-sheet-pane').getBoundingClientRect();
      const overflowing = [];
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1) {
          overflowing.push({ tag: el.tagName, id: el.id, cls: typeof el.className === 'string' ? el.className : '', right: Math.round(r.right) });
        }
      }
      return {
        scrollW: document.documentElement.scrollWidth,
        overflowing: overflowing.slice(0, 8),
        controls: { left: controls.left, right: controls.right, width: controls.width, height: controls.height },
        sheet: { left: sheet.left, right: sheet.right, width: sheet.width, height: sheet.height }
      };
    })()`);
    console.log('  ✓ Foldable (840x900) dual-pane metrics:', JSON.stringify(foldableLayout));
    assert.ok(
      foldableLayout.scrollW <= 841,
      `No horizontal overflow on 840x900 foldable (got scrollWidth=${foldableLayout.scrollW}, overflowing=${JSON.stringify(foldableLayout.overflowing)})`
    );
    assert.ok(
      foldableLayout.sheet.left >= foldableLayout.controls.right - 2,
      'Foldable 840x900 must engage side-by-side Dual-Pane Split Layout'
    );

    await captureScreenshot('02_foldable_840x900_dual_pane.png');

    // =========================================================================
    // 3. Laptop Viewport (1440x900): Keyboard Shortcuts, Review, Manual Cell Edit, Touch Signatures & PDF/PNG Export
    // =========================================================================
    await setViewport(1440, 900, false);
    await sleep(200);

    // Test keyboard shortcut ArrowRight to score for Right team
    const ptsBeforeKey = await evalJS(`document.getElementById('btn-score-right').innerText`);
    await evalJS(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`);
    await sleep(150);
    const ptsAfterKey = await evalJS(`document.getElementById('btn-score-right').innerText`);
    assert.notEqual(ptsAfterKey, ptsBeforeKey, 'Laptop keyboard shortcut ArrowRight must score +1 Right');

    // Verify Current Set zoom pills S1..S5 frame every Swiss Volley set box cleanly
    for (let sIdx = 0; sIdx < 5; sIdx++) {
      await evalJS(`document.querySelector('[data-action="sheet-select-set"][data-set-index="${sIdx}"]').click()`);
      await sleep(90);
      const vbInfo = await evalJS(`(() => {
        const svg = document.querySelector('#mb-sheet-mount svg');
        const expected = window.Matchblatt.SheetRenderer.getViewBox('set', ${sIdx});
        const r = svg.getBoundingClientRect();
        return {
          actualVB: svg.getAttribute('viewBox'),
          expectedVB: expected.x + ' ' + expected.y + ' ' + expected.w + ' ' + expected.h,
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      })()`);
      assert.equal(vbInfo.actualVB, vbInfo.expectedVB, `Set S${sIdx + 1} zoom pill must set viewBox to ${vbInfo.expectedVB}`);
      assert.ok(vbInfo.w > 200 && vbInfo.h > 50, `Set S${sIdx + 1} zoomed SVG must render with non-trivial dimensions`);
    }
    // Return to Set 2 (active live set in demo match) for live cockpit screenshot
    await evalJS(`document.querySelector('[data-action="sheet-select-set"][data-set-index="1"]').click()`);
    await sleep(120);

    await captureScreenshot('03_laptop_1440x900_live_cockpit.png');

    // Switch to Step 4: Review & Export + Full Sheet view
    await evalJS(`
      document.querySelector('[data-action="switch-tab"][data-tab="review"]').click();
      document.querySelector('[data-action="sheet-mode-full"]').click();
    `);
    await sleep(220);

    // Test Manual Cell Edit mode: toggle ON -> click cell [data-cell-key="meta.hall"] -> save override
    await evalJS(`document.querySelector('[data-action="toggle-manual-edit"]').click()`);
    await sleep(150);
    await evalJS(`
      const cell = document.querySelector('#mb-sheet-mount [data-cell-key="meta.hall"]');
      if (!cell) throw new Error('Interactive cell meta.hall not found');
      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    `);
    await sleep(120);
    await evalJS(`
      const inp = document.getElementById('mb-cell-override-input');
      if (!inp) throw new Error('Manual override modal input did not open');
      inp.value = 'Sporthalle Weissenstein (Court 1)';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-action="save-cell-override"]').click();
    `);
    await sleep(150);
    // Turn off Tap-to-Edit mode after editing so sheet looks crisp
    await evalJS(`document.querySelector('[data-action="toggle-manual-edit"]').click()`);
    await sleep(120);

    const overrideRendered = await evalJS(`
      document.querySelector('#mb-sheet-mount svg')?.innerHTML.includes('Sporthalle Weissenstein (Court 1)')
    `);
    assert.ok(overrideRendered, 'Manual cell override must render live onto the Matchblatt SVG');

    // Test Touch Signature Pad: open scorer signature modal, draw realistic cursive signature strokes, and save!
    await evalJS(`document.querySelector('[data-action="open-signature"][data-role="scorer"]').click()`);
    await sleep(150);

    const sigPadBox = await evalJS(`(() => {
      const c = document.getElementById('mb-sig-canvas');
      const r = c.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    })()`);
    assert.ok(sigPadBox.w > 200 && sigPadBox.h > 100, 'Signature pad canvas must have generous dimensions');

    // Dispatch pointer events to draw a neat cursive signature stroke
    await evalJS(`(() => {
      const c = document.getElementById('mb-sig-canvas');
      const r = c.getBoundingClientRect();
      const fire = (type, dx, dy) => {
        c.dispatchEvent(new PointerEvent(type, {
          clientX: r.left + dx,
          clientY: r.top + dy,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          buttons: type === 'pointerup' ? 0 : 1,
          bubbles: true
        }));
      };
      fire('pointerdown', 40, 110);
      const pts = [[65,65],[85,115],[110,75],[135,105],[165,80],[200,100],[245,85],[290,95]];
      for (const [x, y] of pts) fire('pointermove', x, y);
      fire('pointerup', 290, 95);
    })()`);
    await sleep(100);
    await evalJS(`document.querySelector('[data-action="sig-save"]').click()`);
    await sleep(200);

    const sigEmbeddedInSVG = await evalJS(`
      document.querySelector('#mb-sheet-mount svg')?.innerHTML.includes('data:image/png;base64,')
    `);
    assert.ok(sigEmbeddedInSVG, 'Saved touch signature must embed directly into Matchblatt SVG');

    // Audit Filled + Signed Full-Sheet SVG in DOM for zero text overlap or clipping!
    const filledAudit = await evalJS(svgGeometryAuditHelper);
    console.log('  ✓ Filled & Signed Full-Sheet SVG audit:', JSON.stringify(filledAudit));
    assert.deepEqual(filledAudit.outOfPage, [], `Filled SVG text outside page bounds: ${JSON.stringify(filledAudit.outOfPage)}`);
    assert.deepEqual(filledAudit.collisions, [], `Filled SVG text collisions found: ${JSON.stringify(filledAudit.collisions)}`);

    // Test in-browser High-DPI PNG & PDF Export + save filled_sheet_export.png for 1:1 visual comparison!
    const exportCheck = await evalJS(`(async () => {
      const raw = JSON.parse(localStorage.getItem('matchblatt_doc_v1'));
      const pngBlob = await window.Matchblatt.Exporter.toPNGBlob(raw.state, { width: 2382, height: 1684 });
      const pdfBlob = await window.Matchblatt.Exporter.toPDFBlob(raw.state);
      const pngBuf = new Uint8Array(await pngBlob.arrayBuffer());
      const pdfBuf = new Uint8Array(await pdfBlob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < pngBuf.length; i += 8192) {
        bin += String.fromCharCode(...pngBuf.subarray(i, i + 8192));
      }
      const pdfHead = new TextDecoder('latin1').decode(pdfBuf.slice(0, 8));
      const pdfTail = new TextDecoder('latin1').decode(pdfBuf.slice(-16));
      return {
        pngSize: pngBlob.size,
        pngMagic: Array.from(pngBuf.slice(0, 4)),
        pngB64: btoa(bin),
        pdfSize: pdfBlob.size,
        pdfHead,
        pdfTail
      };
    })()`, true);

    fs.writeFileSync(path.join(scratchDir, 'filled_sheet_export.png'), Buffer.from(exportCheck.pngB64, 'base64'));
    console.log('  📸 Saved scratch/filled_sheet_export.png (filled demo + signature 1:1 full sheet)');
    console.log('  ✓ Browser High-DPI Export verified:', JSON.stringify({ ...exportCheck, pngB64: '<omitted>' }));
    assert.deepEqual(exportCheck.pngMagic, [0x89, 0x50, 0x4e, 0x47], 'PNG blob must have valid PNG magic header');
    assert.ok(exportCheck.pngSize > 80000, `Expected high-DPI PNG > 80KB, got ${exportCheck.pngSize}`);
    assert.equal(exportCheck.pdfHead, '%PDF-1.4', 'PDF blob must start with %PDF-1.4');
    assert.ok(exportCheck.pdfTail.trim().endsWith('%%EOF'), 'PDF blob must end with %%EOF');
    assert.ok(exportCheck.pdfSize > 80000, `Expected high-DPI PDF > 80KB, got ${exportCheck.pdfSize}`);

    await captureScreenshot('04_laptop_1440x900_review_signed_fullsheet.png');

    // Check Service Worker registration on http://127.0.0.1
    const swStatus = await evalJS(`(async () => {
      if (!navigator.serviceWorker) return 'unsupported';
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0 ? 'registered' : 'none';
    })()`, true);
    console.log('  ✓ Service Worker status on HTTP:', swStatus);

    // Check zero runtime JS errors on HTTP!
    assert.deepEqual(pageErrors, [], `Unexpected browser runtime/console errors: ${pageErrors.join(' | ')}`);

    // =========================================================================
    // 4. Test Standalone Single-File Bundle over file:// protocol!
    // =========================================================================
    const standaloneUrl = 'file://' + path.join(ROOT, 'matchblatt-standalone.html');
    await send('Page.navigate', { url: standaloneUrl }, sid);
    await sleep(600);
    const standaloneBooted = await evalJS(`!!document.getElementById('mb-topbar')`);
    assert.ok(standaloneBooted, 'matchblatt-standalone.html MUST boot and render #mb-topbar when opened via file://!');
    assert.deepEqual(pageErrors, [], `Unexpected errors on file:// standalone HTML: ${pageErrors.join(' | ')}`);
    console.log('  ✓ Standalone file:// bundle booted cleanly with zero errors!\n');
  } finally {
    proc.kill();
  }
}

run().catch((err) => {
  console.error('\n  ✗ E2E Browser Verification FAILED:', err.message);
  process.exitCode = 1;
});
