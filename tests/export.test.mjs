import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Mock localStorage for Engine demo creation
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

const I18NMod = require('../src/i18n.js');
const EngineMod = require('../src/engine.js');
const SheetMod = require('../src/sheet-renderer.js');
const ExporterMod = require('../src/exporter.js');

const Engine = EngineMod.Engine || EngineMod;
const SheetRenderer = SheetMod.SheetRenderer || SheetMod;
const Exporter = ExporterMod.Exporter || ExporterMod;

// Ensure window.Matchblatt bridge works if modules check global window
globalThis.window = globalThis.window || {};
globalThis.window.Matchblatt = {
  I18N: I18NMod.I18N || I18NMod,
  Engine,
  SheetRenderer,
  Exporter,
};

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n=== Matchblatt SheetRenderer, PDF Exporter & Standalone Bundle Suite ===');

// 1. SheetRenderer ViewBoxes & SVG Generation
test('SheetRenderer.getViewBox covers full, set (regular & deciding in Bo5/Bo3), header, rosters, results, sanctions', () => {
  const demo = Engine.createDemoMatch('de');
  const fullVB = SheetRenderer.getViewBox('full', 0, demo.state);
  assert.equal(fullVB.x, 0);
  assert.equal(fullVB.y, 0);
  assert.equal(fullVB.w, 1684);
  assert.equal(fullVB.h, 1190);

  for (let i = 0; i < 5; i++) {
    const vb = SheetRenderer.getViewBox('set', i, demo.state);
    assert.ok(vb.w > 0 && vb.w < 1684 && vb.h > 0 && vb.h < 1190, `Set ${i + 1} viewBox must zoom in tightly`);
  }

  // In Best-of-3, setIndex 2 is deciding -> maps to Set 5 deciding box!
  const set5VB = SheetRenderer.getViewBox('set', 4, demo.state);
  let bo3Doc = Engine.createStore({ bestOf: 3 });
  bo3Doc = Engine.dispatch(bo3Doc, { type: 'UPDATE_META', meta: { bestOf: 3 } }).doc;
  const bo3DecidingVB = SheetRenderer.getViewBox('set', 2, bo3Doc.state);
  assert.equal(bo3DecidingVB.x, set5VB.x, 'Best-of-3 deciding set (index 2) must zoom to the Set 5 deciding panel');
  assert.equal(bo3DecidingVB.y, set5VB.y);
});

test('SheetRenderer.renderSVGString produces valid, self-contained SVG with highlights, overrides, and signatures', () => {
  let doc = Engine.createDemoMatch('de');
  // Score a point to ensure fresh highlights
  doc = Engine.dispatch(doc, { type: 'SCORE_POINT', team: 'A' }).doc;
  // Add a manual cell override and a mock PNG signature
  const mockSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  doc = Engine.dispatch(doc, {
    type: 'SET_MANUAL_OVERRIDE',
    cellKey: 'meta.city',
    value: 'Zürich Manual Override',
  }).doc;
  doc = Engine.dispatch(doc, {
    type: 'SET_SIGNATURE',
    role: 'scorer',
    dataUrl: mockSig,
  }).doc;

  const svgInteractive = SheetRenderer.renderSVGString(doc.state, {
    viewMode: 'full',
    showHighlights: true,
    interactive: true,
    printMode: false,
  });

  assert.ok(svgInteractive.startsWith('<svg') || svgInteractive.includes('<svg'), 'Must output <svg>');
  assert.ok(svgInteractive.trim().endsWith('</svg>'), 'Must close with </svg>');
  assert.ok(svgInteractive.includes('<style'), 'Must embed self-contained <style> inside SVG');
  assert.ok(svgInteractive.includes('0 0 1684 1190'), 'Full viewMode must have 0 0 1684 1190 viewBox');
  assert.ok(svgInteractive.includes('Zürich Manual Override'), 'Manual override value must render in SVG');
  assert.ok(svgInteractive.includes('data-cell-key='), 'Interactive mode must emit data-cell-key attributes');
  assert.ok(svgInteractive.includes('mb-highlight'), 'Live mode with highlights must include mb-highlight elements');
  assert.ok(svgInteractive.includes(mockSig), 'Embedded base64 signature must appear in SVG');

  // Verify zero external network fetches inside SVG (ignore standard w3.org XML namespaces)
  const strippedNS = svgInteractive.replace(/https?:\/\/www\.w3\.org\/[A-Za-z0-9/_-]+/g, '');
  assert.equal(/https?:\/\//i.test(strippedNS), false, 'SVG must have ZERO external http/https URLs');

  // Print mode must suppress interactive highlight overlays
  const svgPrint = SheetRenderer.renderSVGString(doc.state, {
    viewMode: 'full',
    showHighlights: false,
    interactive: false,
    printMode: true,
  });
  // Check no mb-highlight rect element is rendered in printMode (ignore CSS selector inside <style>)
  const svgPrintWithoutStyle = svgPrint.replace(/<style[\s\S]*?<\/style>/g, '');
  assert.equal(svgPrintWithoutStyle.includes('mb-highlight'), false, 'Print mode must not render mb-highlight elements');
});

// 2. Exporter PDF-1.4 Binary Verification
test('Exporter.buildPDFBytesFromJPEG builds a valid %PDF-1.4 A4 Landscape file with exact xref offsets and raw binary JPEG', () => {
  // Construct a synthetic valid JPEG binary buffer including arbitrary non-UTF8 bytes (0x80..0xFE)
  const fakeJpeg = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x80, 0x9f, 0xc3, 0xfe, 0x00, 0x11, 0x22, 0x33, 0xab, 0xcd, 0xef, 0xff, 0xd9,
  ]);

  const pdfBytes = Exporter.buildPDFBytesFromJPEG(fakeJpeg, 3368, 2380);
  assert.ok(pdfBytes instanceof Uint8Array, 'Must return a Uint8Array');

  const latin1 = Buffer.from(pdfBytes).toString('latin1');
  assert.ok(latin1.startsWith('%PDF-1.4'), 'PDF must start with %PDF-1.4 header');
  assert.ok(latin1.trimEnd().endsWith('%%EOF'), 'PDF must end with %%EOF');
  assert.ok(latin1.includes('/DCTDecode'), 'PDF image object must use /DCTDecode');
  assert.ok(latin1.includes('/DeviceRGB'), 'PDF image object must specify /DeviceRGB');
  assert.ok(latin1.includes('3368') && latin1.includes('2380'), 'PDF must declare exact pixel dimensions');
  assert.ok(/841\.89|842/.test(latin1) && /595\.28|595/.test(latin1), 'PDF must use A4 Landscape MediaBox');

  // Verify raw JPEG bytes appear intact without UTF-8 corruption!
  const jpegStartIdx = Buffer.from(pdfBytes).indexOf(Buffer.from(fakeJpeg));
  assert.notEqual(jpegStartIdx, -1, 'Raw JPEG binary bytes must appear byte-for-byte intact inside PDF stream');

  // Verify startxref and every xref entry offset!
  const startxrefMatch = latin1.match(/startxref\s+(\d+)\s+%%EOF/);
  assert.ok(startxrefMatch, 'PDF must contain startxref <offset> before %%EOF');
  const xrefOffset = Number(startxrefMatch[1]);
  assert.equal(latin1.slice(xrefOffset, xrefOffset + 4), 'xref', `startxref (${xrefOffset}) must point directly to "xref"`);

  // Parse xref entries and verify each "nnnnnnnnnn 00000 n" points to "<id> 0 obj"
  const xrefSection = latin1.slice(xrefOffset);
  const lines = xrefSection.split(/\r?\n/);
  // lines[0] === 'xref', lines[1] === '0 N', lines[2] === object 0 ('0000000000 65535 f '), lines[2 + objNum] === object objNum
  const headerParts = lines[1].trim().split(/\s+/);
  assert.equal(headerParts[0], '0', 'xref subsection must start at object 0');
  const count = Number(headerParts[1]);
  assert.ok(count >= 5, `Expected at least 5 PDF objects in xref, got ${count}`);
  assert.match(lines[2], /^0000000000 65535 f/, 'Object 0 entry must be free head 0000000000 65535 f');

  for (let objNum = 1; objNum < count; objNum++) {
    const entryLine = lines[2 + objNum];
    const m = entryLine.match(/^(\d{10}) (\d{5}) ([nf])\s*$/);
    assert.ok(m, `Malformed xref entry for obj ${objNum}: ${JSON.stringify(entryLine)}`);
    if (m[3] === 'n') {
      const objOffset = Number(m[1]);
      const actualAtOffset = latin1.slice(objOffset, objOffset + 12);
      assert.ok(
        actualAtOffset.startsWith(`${objNum} 0 obj`),
        `xref offset ${objOffset} for object ${objNum} points to ${JSON.stringify(actualAtOffset)} instead of "${objNum} 0 obj"`
      );
    }
  }
});

// 3. JSON Backup & Restore
await (async () => {
  try {
    const demo = Engine.createDemoMatch('en');
    const serialized = JSON.stringify(demo);
    const restored = await Exporter.importJSON(serialized);
    assert.ok(restored && restored.state, 'Exporter.importJSON must parse serialized match doc');
    assert.equal(restored.state.teams.A.name, demo.state.teams.A.name);
    passed++;
    console.log('  ✓ Exporter.importJSON restores match document cleanly');
  } catch (err) {
    console.error('  ✗ FAIL: Exporter.importJSON restores match document cleanly');
    console.error(err);
    process.exitCode = 1;
  }
})();

// 4. Standalone Single-File Bundle & Zero-External-CDN Check
test('scripts/bundle.mjs builds matchblatt-standalone.html with zero external http/https dependencies', () => {
  const requiredFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'styles/sheet.css',
    'styles/app.css',
    'src/i18n.js',
    'src/engine.js',
    'src/sheet-renderer.js',
    'src/exporter.js',
    'src/app.js',
    'scripts/bundle.mjs',
  ];
  for (const rel of requiredFiles) {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `Missing required project file: ${rel}`);
  }

  execFileSync(process.execPath, [path.join(ROOT, 'scripts/bundle.mjs')], {
    cwd: ROOT,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'pipe',
  });

  const bundlePath = path.join(ROOT, 'matchblatt-standalone.html');
  assert.ok(fs.existsSync(bundlePath), 'matchblatt-standalone.html must be generated');
  const html = fs.readFileSync(bundlePath, 'utf8');
  assert.ok(html.length > 20000, 'Standalone bundle should inline full CSS + JS');

  // Must not have external or un-inlined <script src="..."> or <link rel="stylesheet" href="...">
  assert.equal(/<script[^>]+\bsrc\s*=/i.test(html), false, 'Standalone HTML must inline all <script> tags');
  assert.equal(/<link[^>]+rel=["']stylesheet["']/i.test(html), false, 'Standalone HTML must inline all stylesheets');

  // Check zero external http:// or https:// URLs across ALL source, style, manifest, SW, and HTML files (except w3.org XML namespaces)
  const allLocalFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'styles/sheet.css',
    'styles/app.css',
    'src/i18n.js',
    'src/engine.js',
    'src/sheet-renderer.js',
    'src/exporter.js',
    'src/app.js',
    'matchblatt-standalone.html',
  ];
  for (const file of allLocalFiles) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const cleaned = content
      .replace(/https?:\/\/www\.w3\.org\/[A-Za-z0-9/_-]+/g, '')
      // Ignore regex literals or comments checking for http(s)://
      .replace(/\/https\?:\\\/\\\/[^/\n]*\/[gimsuy]*/g, '');
    const externalMatches = cleaned.match(/https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^\s"'<>`]*/gi) || [];
    assert.deepEqual(externalMatches, [], `${file} must contain ZERO external http/https URLs, found: ${externalMatches.join(', ')}`);
  }
});

// 5. Authentic 1:1 Swiss Volley / FIVB Grosses Matchblatt SVG Layout & Conventions Check
test('SheetRenderer matches Swiss Volley / FIVB PDF 1:1: DE/FR/IT labels, logos, checkboxes, 1..8 paired turns, "T" under Punkte, and macro geometry', () => {
  // Verify macro LAYOUT coordinates match the official Swiss Volley A4 Landscape PDF
  const L = SheetRenderer.LAYOUT;
  assert.ok(L, 'SheetRenderer.LAYOUT must be exposed');
  assert.ok(L.set1.y === L.set2.y && L.set1.x < L.set2.x, 'Sets 1 & 2 sit side-by-side across top set band');
  assert.ok(L.set3.y === L.set4.y && L.set3.y > L.set1.y + L.set1.h - 1, 'Sets 3 & 4 sit below Sets 1 & 2');
  assert.ok(L.set5.y > L.set3.y + L.set3.h - 1, 'Set 5 sits below Sets 3 & 4 on the left');
  assert.ok(L.rosters.x > L.set5.x + L.set5.w && L.rosters.y === L.set5.y, 'Mannschaften rosters sit in the lower-right quadrant beside Set 5 & bottom band');
  assert.equal(L.set5.x + L.set5.w, L.results.x + L.results.w, 'Set 5 right edge aligns flush with Endresultat right edge');
  assert.ok(
    L.sanctions.y > L.set5.y + L.set5.h &&
      L.sanctions.x < L.remarks.x &&
      L.remarks.y < L.approval.y &&
      L.approval.x < L.results.x &&
      L.results.x + L.results.w < L.rosters.x,
    'Bottom band orders Sanktionen -> Bemerkungen/Bestätigung -> Endresultat left of Mannschaften'
  );

  // Verify blank sheet renders cleanly with zero "undefined" / "NaN"
  const emptyDoc = Engine.createStore();
  const emptySvg = SheetRenderer.renderSVGString(emptyDoc.state, { viewMode: 'full', showHighlights: false, interactive: true });
  assert.equal(/undefined|NaN/.test(emptySvg), false, 'Blank SVG must not contain undefined or NaN');

  // Verify authentic Swiss Volley DE / FR / IT labels & logos
  const requiredLabels = [
    'SwissVolley',
    'FIVB',
    'FÉDÉRATION INTERNATIONALE',
    'DE VOLLEYBALL',
    'Mannschaften/Equipes/Squadre',
    'Bezeichnung der Liga',
    'Désignation de la ligue',
    'Designazione della lega',
    'Meisterschaft',
    'Championnat',
    'Campionato',
    'Freundschaftsspiel',
    'Turnier',
    'National',
    'Regional',
    'International',
    'Männer',
    'Frauen',
    'U23',
    'U19',
    'U17',
    'Aufschlagrunde',
    'Tours au service',
    'Turni al servizio',
    'Punkte',
    'Points',
    'Punti',
    'Seitenwechsel/Changement/Cambio',
    'Pkt. beim Seitenwechsel',
    'Points au changement',
    'Punti al cambio',
    'Lizenz-Nr.',
    'Licence-No.',
    'Licenza-No.',
    'Spieler-Nr.',
    'LIBEROS («L»)',
    'Offizielle/Officiels/Ufficiali',
    'Sanktionen',
    'Sanctions',
    'Sanzioni',
    'Nicht ordnungsgemässer Antrag',
    'Demande non fondée',
    'Richiesta impropria',
    'Bemerkungen/Remarques/Osservazioni',
    'Bestätigung/Approbation/Approvazione',
    'Endresultat/Résultat final/Risultato finale',
    'Gewinner/Vainqueur/Vincitore',
  ];
  for (const lbl of requiredLabels) {
    assert.ok(emptySvg.includes(lbl), `SVG must include authentic Swiss Volley label: ${lbl}`);
  }

  // Verify header checkboxes (matchType, level, gender, ageGroup) emit interactive cell keys & toggle checked X paths
  assert.ok(emptySvg.includes('data-cell-key="meta.matchType"'), 'Interactive SVG must expose meta.matchType');
  assert.ok(emptySvg.includes('data-cell-key="meta.level"'), 'Interactive SVG must expose meta.level');
  assert.ok(emptySvg.includes('data-cell-key="meta.gender"'), 'Interactive SVG must expose meta.gender');
  assert.ok(emptySvg.includes('data-cell-key="meta.ageGroup"'), 'Interactive SVG must expose meta.ageGroup');

  let checkedDoc = Engine.dispatch(emptyDoc, {
    type: 'UPDATE_META',
    meta: { matchType: 'cup', level: 'international', gender: 'men', ageGroup: 'U19' },
  }).doc;
  const headerBlankAgeSvg = SheetRenderer.renderSVGString(emptyDoc.state, { viewMode: 'header', showHighlights: false });
  const headerWithAgeSvg = SheetRenderer.renderSVGString(checkedDoc.state, { viewMode: 'header', showHighlights: false });
  const countInkStrokes = (s) => (s.match(/class="mb-ink-stroke"/g) || []).length;
  assert.equal(
    countInkStrokes(headerWithAgeSvg),
    countInkStrokes(headerBlankAgeSvg) + 1,
    'Selecting ageGroup U19 must add an ink X mark in the top header checkboxes'
  );

  // Verify 1..8 paired service-turn layout (Turn 1 & Turn 5 share Row 0 left/right; Turn 4 & Turn 8 share Row 3 left/right)
  assert.ok(emptySvg.includes('>1.</text>') && emptySvg.includes('>5.</text>'), 'Set legend must include paired 1. | 5. labels');
  assert.ok(emptySvg.includes('>4.</text>') && emptySvg.includes('>8.</text>'), 'Set legend must include paired 4. | 8. labels');
  assert.ok(emptySvg.includes('>6.</text>') && emptySvg.includes('>3.</text>'), 'Set 5 legend must include paired 1.|4., 2.|5., 3.|6. labels');

  const extractHitBox = (svgStr, cellKey) => {
    const re = new RegExp(`data-cell-key="${cellKey.replace(/\./g, '\\.')}"[^>]*>\\s*<rect class="mb-cell-hit" x="([0-9.]+)" y="([0-9.]+)" width="([0-9.]+)" height="([0-9.]+)"`);
    const m = svgStr.match(re);
    assert.ok(m, `Expected hit rect for ${cellKey}`);
    return { x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]) };
  };
  const turn1Box = extractHitBox(emptySvg, 'set.1.A.pos.0.turn.0');
  const turn2Box = extractHitBox(emptySvg, 'set.1.A.pos.0.turn.1');
  const turn5Box = extractHitBox(emptySvg, 'set.1.A.pos.0.turn.4');
  const turn8Box = extractHitBox(emptySvg, 'set.1.A.pos.0.turn.7');
  const starter0Box = extractHitBox(emptySvg, 'set.1.A.pos.0.starter');
  assert.equal(turn1Box.y, turn5Box.y, 'Service Turn 1 and Turn 5 must sit side-by-side on the same row');
  assert.ok(turn5Box.x > turn1Box.x && Math.abs((turn1Box.w + turn5Box.w) - starter0Box.w) < 0.5, 'Turns 1 & 5 must split column I width in half');
  assert.ok(turn2Box.y > turn1Box.y && turn8Box.y > turn5Box.y, 'Turns 2..4 and 6..8 stack vertically beneath 1|5');

  // Verify "T" timeouts sit directly underneath the Punkte columns (x > column VI right edge, y below Service Turn row 1)
  const starter5Box = extractHitBox(emptySvg, 'set.1.A.pos.5.starter');
  const timeout1Box = extractHitBox(emptySvg, 'set.1.A.T.1');
  const timeout2Box = extractHitBox(emptySvg, 'set.1.A.T.2');
  assert.ok(emptySvg.includes('&quot;T&quot;') || emptySvg.includes('"T"'), 'Must render "T" timeout header');
  assert.ok(timeout1Box.x >= starter5Box.x + starter5Box.w - 0.5, 'Timeout box 1 must align horizontally under the Punkte strip to the right of Pos VI');
  assert.equal(timeout1Box.x, timeout2Box.x, 'Timeout boxes 1 and 2 must stack directly in the Punkte column strip');
  assert.ok(timeout1Box.y > turn1Box.y + turn1Box.h && timeout2Box.y > timeout1Box.y, 'Timeout boxes 1 and 2 must sit below the upper Punkte grid');

  // Verify filled Demo Match + player license renders cleanly
  let demo = Engine.createDemoMatch('de');
  demo = Engine.dispatch(demo, {
    type: 'UPDATE_TEAM',
    team: 'A',
    data: {
      players: demo.state.teams.A.players.map((p, idx) => (idx === 0 ? { ...p, license: 'SV-99881' } : p)),
    },
  }).doc;
  const filledSvg = SheetRenderer.renderSVGString(demo.state, { viewMode: 'full', showHighlights: true });
  assert.equal(/undefined|NaN/.test(filledSvg), false, 'Filled SVG must not contain undefined or NaN');
  assert.ok(filledSvg.includes('Volley Köniz') && filledSvg.includes('VBC Zürich'), 'Must render team names');
  assert.ok(filledSvg.includes('SV-99881'), 'Must render player license number in Lizenz-Nr. column');
});

console.log(`\nExport & Bundle suite finished: ${passed} tests passed.\n`);
